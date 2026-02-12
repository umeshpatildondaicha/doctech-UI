import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { ChatMessage, ChatSession, ChatFilter, ChatNotification } from '../interfaces/chat.interface';
import { PatientService, DoctorConnectedPatientDTO } from './patient.service';
import { AppointmentService } from './appointment.service';
import { ChatApiService } from './chat-api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly chatSessions = new BehaviorSubject<ChatSession[]>([]);
  private readonly currentChatSession = new BehaviorSubject<ChatSession | null>(null);
  private readonly messages = new BehaviorSubject<ChatMessage[]>([]);
  private readonly notifications = new BehaviorSubject<ChatNotification[]>([]);

  constructor(
    private readonly patientService: PatientService,
    private readonly appointmentService: AppointmentService,
    private readonly chatApi: ChatApiService,
    private readonly auth: AuthService
  ) {
    this.chatApi.messages$.subscribe((incoming) => {
      // Ensure senderName is human-friendly (patient's real name instead of literal "Patient")
      const active = this.currentChatSession.value;
      const msg: ChatMessage = {
        ...incoming,
        senderName:
          incoming.senderType === 'DOCTOR'
            ? this.getDoctorName()
            : (active?.patientName ?? incoming.senderName ?? 'Patient')
      };

      const current = this.messages.value;

      // Replace optimistic message when server echo arrives (avoid duplicate)
      const optimisticIdx = current.findIndex(
        (m) =>
          typeof m.id === 'string' &&
          m.id.startsWith('opt-') &&
          m.content === msg.content &&
          m.senderType === msg.senderType
      );
      if (optimisticIdx !== -1) {
        const next = [...current];
        next[optimisticIdx] = msg;
        this.messages.next(next);
        return;
      }
      if (!current.some((m) => m.id === msg.id)) {
        this.messages.next([...current, msg]);
      }

      // Keep the chat-list preview/ticks in sync for the active session
      if (active) {
        const nextSession: ChatSession = { ...active, lastMessage: msg, lastActivity: msg.timestamp ?? new Date() };
        this.currentChatSession.next(nextSession);
        this.updateSessionInList(nextSession);
      }
    });
  }

  /**
   * Load chat sessions from connected patients.
   * GET /api/patients/doctor/{doctorCode}/connected
   */
  loadConnectedPatientsAsSessions(doctorCode: string): Observable<ChatSession[]> {
    return this.patientService.getConnectedPatients(doctorCode).pipe(
      map((resp) => {
        // Handle wrapped responses: { content: [...] } or { data: [...] } or raw array
        const r = resp as DoctorConnectedPatientDTO[] | { content?: DoctorConnectedPatientDTO[]; data?: DoctorConnectedPatientDTO[]; patients?: DoctorConnectedPatientDTO[] };
        const arr = Array.isArray(r) ? r : r?.content ?? r?.data ?? r?.patients ?? [];
        return this.mapPatientsToSessions(arr);
      }),
      tap((sessions) => this.chatSessions.next(sessions)),
      catchError(() => {
        this.chatSessions.next([]);
        return of([]);
      })
    );
  }

  private mapPatientsToSessions(patients: DoctorConnectedPatientDTO[]): ChatSession[] {
    const doctorName = this.getDoctorName();
    return patients.map((p, idx) => ({
      id: p.publicId,
      patientId: idx + 1,
      patientName: `${(p.firstName || '').trim()} ${(p.lastName || '').trim()}`.trim() || 'Patient',
      patientPublicId: p.publicId,
      doctorId: 1,
      doctorName,
      unreadCount: 0,
      isActive: true,
      lastActivity: new Date(),
      appointmentStatus: undefined as ChatSession['appointmentStatus']
    }));
  }

  private getDoctorName(): string {
    const u = this.auth.getCurrentUser() as { firstName?: string; lastName?: string; name?: string } | null;
    if (!u) return 'Doctor';
    if (u.firstName || u.lastName) return `Dr. ${(u.firstName || '').trim()} ${(u.lastName || '').trim()}`.trim();
    return (u as any).name || 'Doctor';
  }

  /**
   * When doctor selects a patient: resolve appointment and open chat.
   * Fetches appointments, picks one (latest), loads history, connects WebSocket.
   */
  openChatForPatient(session: ChatSession): Observable<{ session: ChatSession; messages: ChatMessage[] }> {
    // Use "me" when backend supports it (GET /api/appointments/doctor/me/patient/...), else public doctor code
    const doctorCode = this.auth.getDoctorPublicCode() ?? this.auth.getDoctorRegistrationNumber() ?? 'me';
    const patientPublicId = session.patientPublicId ?? session.id;
    if (!doctorCode || !patientPublicId) {
      return of({ session, messages: [] });
    }

    const ensureAppointment = (): Observable<ChatSession> => {
      if (session.appointmentPublicId) return of(session);
      return this.appointmentService.getPatientAppointments(doctorCode, patientPublicId).pipe(
        map((resp: unknown) => {
          const r = resp as { appointments?: unknown[]; content?: unknown[]; data?: unknown[] } | unknown[];
          const list = Array.isArray(r)
            ? r
            : r?.appointments ?? r?.content ?? r?.data ?? [];
          const apt = list.length > 0 ? this.pickAppointment(list) : null;
          if (apt) {
            const aptId = apt.publicId ?? apt.appointmentPublicId ?? apt.id;
            const aptDate = apt.appointmentDate ?? apt.date ?? apt.scheduledDate;
            const aptStatus = apt.status ?? apt.appointmentStatus;
            return {
              ...session,
              appointmentPublicId: aptId,
              appointmentDate: aptDate ? new Date(aptDate) : undefined,
              appointmentStatus: aptStatus as ChatSession['appointmentStatus']
            };
          }
          return session;
        }),
        catchError(() => of(session))
      );
    };

    return ensureAppointment().pipe(
      tap((s) => {
        this.currentChatSession.next(s);
        this.updateSessionInList(s);
      }),
      switchMap((s) => {
        // Always attempt WebSocket when opening chat (use appointment id for sending)
        this.connectWebSocket(s);
        // Load unified conversation (all messages for this doctor–patient) so doctor messages do not disappear
        const doctorCode = this.auth.getDoctorPublicCode() ?? this.auth.getDoctorRegistrationNumber() ?? 'me';
        const patientPublicId = (s.patientPublicId ?? s.id ?? '').toString().trim();
        if (!patientPublicId) return of({ session: s, messages: [] });
        return this.chatApi.getConversationMessages(doctorCode, patientPublicId).pipe(
          map((msgs) => this.normalizeMessages(msgs, s)),
          tap((msgs) => {
            this.messages.next(msgs);
            const last = msgs.at(-1);
            if (last) {
              const nextSession: ChatSession = { ...s, lastMessage: last, lastActivity: last.timestamp ?? new Date() };
              this.currentChatSession.next(nextSession);
              this.updateSessionInList(nextSession);
            }
          }),
          map((messages) => ({ session: s, messages })),
          catchError(() => of({ session: s, messages: [] }))
        );
      })
    );
  }

  /** Pick the appointment with the most recent chat (so doctor sees patient messages in the same thread). */
  private pickAppointment(list: any[]): any {
    const sorted = [...list].sort((a, b) => {
      const lastA = a.lastMessageAt ?? a.last_message_at;
      const lastB = b.lastMessageAt ?? b.last_message_at;
      if (lastA && lastB) return new Date(lastB).getTime() - new Date(lastA).getTime();
      if (lastA) return -1;
      if (lastB) return 1;
      const da = a.appointmentDate ?? a.date ?? a.scheduledDate ?? 0;
      const db = b.appointmentDate ?? b.date ?? b.scheduledDate ?? 0;
      return new Date(db).getTime() - new Date(da).getTime();
    });
    return sorted[0];
  }

  private updateSessionInList(session: ChatSession): void {
    const list = this.chatSessions.value;
    const idx = list.findIndex((x) => x.id === session.id || x.patientPublicId === session.patientPublicId);
    if (idx !== -1) {
      const next = [...list];
      next[idx] = { ...next[idx], ...session };
      this.chatSessions.next(next);
    }
  }

  private connectWebSocket(session: ChatSession): void {
    // Backend requires a real appointment UUID for INIT; it will reject "Appointment not found" otherwise.
    if (!session.appointmentPublicId) {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        console.warn('[Chat] WebSocket skipped: no appointment for this patient — select a patient with an appointment to chat');
      }
      return;
    }
    const user = this.auth.getCurrentUser() as { publicId?: string; id?: string | number } | null;
    const userPublicId =
      (user?.publicId ?? user?.id ?? this.auth.getDoctorRegistrationNumber() ?? '').toString().trim();
    if (!userPublicId) {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        console.warn('[Chat] WebSocket skipped: missing userPublicId');
      }
      return;
    }
    this.chatApi.connectWebSocket({
      appointmentPublicId: session.appointmentPublicId,
      userPublicId,
      senderType: 'DOCTOR'
    });
  }

  private normalizeMessages(raw: any[], session?: ChatSession): ChatMessage[] {
    const patientName = session?.patientName ?? 'Patient';
    const doctorName = this.getDoctorName();
    return (raw ?? []).map((m) => {
      const senderType = (m.senderType ?? 'PATIENT') as 'DOCTOR' | 'PATIENT';
      const tsRaw = m.createdAt ?? m.timestamp ?? m.created_at ?? null;
      const ts = tsRaw ? new Date(tsRaw) : new Date();
      return {
        id: String(m.id ?? m.messageId ?? Date.now()),
        senderId: m.senderId ?? 0,
        senderType,
        senderName: m.senderName ?? (senderType === 'DOCTOR' ? doctorName : patientName),
        content: m.content ?? '',
        messageType: (m.messageType ?? 'TEXT') as 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'FILE',
        timestamp: ts,
        isRead: !!m.isRead,
        isDelivered: !!m.isDelivered,
        ...(m.fileUrl && { fileUrl: m.fileUrl }),
        ...(m.fileName && { fileName: m.fileName }),
        ...(m.fileSize && { fileSize: m.fileSize })
      } as ChatMessage;
    });
  }

  disconnectChat(): void {
    this.chatApi.disconnect();
  }

  /** Observable of WebSocket connection state (true when connected and INIT sent). */
  getIsConnected(): Observable<boolean> {
    return this.chatApi.isConnected$;
  }

  getChatSessions(filter: ChatFilter): Observable<ChatSession[]> {
    let sessions = this.chatSessions.value;
    if (filter.appointmentStatus && filter.appointmentStatus !== 'ALL') {
      sessions = sessions.filter((s) => s.appointmentStatus === filter.appointmentStatus);
    }
    if (filter.searchTerm) {
      sessions = sessions.filter((s) =>
        s.patientName.toLowerCase().includes(filter.searchTerm.toLowerCase())
      );
    }
    sessions = [...sessions].sort((a, b) => {
      let cmp = 0;
      switch (filter.sortBy) {
        case 'NAME':
          cmp = a.patientName.localeCompare(b.patientName);
          break;
        case 'LAST_ACTIVITY':
          cmp = a.lastActivity.getTime() - b.lastActivity.getTime();
          break;
        case 'UNREAD_COUNT':
          cmp = b.unreadCount - a.unreadCount;
          break;
        case 'APPOINTMENT_DATE':
          if (a.appointmentDate && b.appointmentDate) cmp = a.appointmentDate.getTime() - b.appointmentDate.getTime();
          break;
      }
      return filter.sortOrder === 'ASC' ? cmp : -cmp;
    });
    return of(sessions);
  }

  getChatSession(id: string): Observable<ChatSession | null> {
    const session = this.chatSessions.value.find((s) => s.id === id || s.patientPublicId === id);
    this.currentChatSession.next(session ?? null);
    return of(session ?? null);
  }

  getMessages(): Observable<ChatMessage[]> {
    return this.messages.asObservable();
  }

  sendMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead' | 'isDelivered'>): Observable<ChatMessage> {
    const sent = this.chatApi.sendTextMessage(message.content);
    if (sent) {
      const optimistic: ChatMessage = {
        ...message,
        id: `opt-${Date.now()}`,
        timestamp: new Date(),
        isRead: false,
        isDelivered: false
      };
      const current = this.messages.value;
      this.messages.next([...current, optimistic]);
      const sessions = this.chatSessions.value;
      const idx = sessions.findIndex((s) => s.id === sessionId);
      if (idx !== -1) {
        const next = [...sessions];
        next[idx] = { ...next[idx], lastMessage: optimistic, lastActivity: new Date() };
        this.chatSessions.next(next);
      }
      return of(optimistic);
    }
    // Fallback: optimistically add (no real send without WebSocket)
    const fallback: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false,
      isDelivered: false
    };
    const current = this.messages.value;
    this.messages.next([...current, fallback]);
    return of(fallback);
  }

  uploadFile(
    sessionId: string,
    file: File,
    senderId: number,
    senderType: 'DOCTOR' | 'PATIENT',
    senderName: string
  ): Observable<ChatMessage> {
    const fileMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId,
      senderType,
      senderName,
      content: `Sent ${file.name}`,
      messageType: this.getFileMessageType(file.type),
      fileUrl: URL.createObjectURL(file),
      fileName: file.name,
      fileSize: file.size,
      timestamp: new Date(),
      isRead: false,
      isDelivered: false
    };
    const current = this.messages.value;
    this.messages.next([...current, fileMessage]);
    const sessions = this.chatSessions.value;
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx !== -1) {
      const next = [...sessions];
      next[idx] = { ...next[idx], lastMessage: fileMessage, lastActivity: new Date() };
      this.chatSessions.next(next);
    }
    return of(fileMessage);
  }

  private getFileMessageType(mimeType: string): 'IMAGE' | 'DOCUMENT' | 'FILE' {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text/')) return 'DOCUMENT';
    return 'FILE';
  }

  markAsRead(sessionId: string, messageIds: string[]): Observable<void> {
    const current = this.messages.value;
    messageIds.forEach((id) => {
      const m = current.find((x) => x.id === id);
      if (m) m.isRead = true;
    });
    this.messages.next([...current]);
    const sessions = this.chatSessions.value;
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx !== -1) {
      const next = [...sessions];
      next[idx] = { ...next[idx], unreadCount: 0 };
      this.chatSessions.next(next);
    }
    return of(void 0);
  }

  getNotifications(): Observable<ChatNotification[]> {
    return this.notifications.asObservable();
  }

  markNotificationAsRead(notificationId: string): Observable<void> {
    const list = this.notifications.value;
    const n = list.find((x) => x.id === notificationId);
    if (n) {
      n.isRead = true;
      this.notifications.next([...list]);
    }
    return of(void 0);
  }

  getUnreadMessageCount(): Observable<number> {
    const total = this.chatSessions.value.reduce((s, x) => s + x.unreadCount, 0);
    return of(total);
  }
}
