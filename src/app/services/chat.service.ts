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
  private chatSessions = new BehaviorSubject<ChatSession[]>([]);
  private currentChatSession = new BehaviorSubject<ChatSession | null>(null);
  private messages = new BehaviorSubject<ChatMessage[]>([]);
  private notifications = new BehaviorSubject<ChatNotification[]>([]);

  constructor(
    private readonly patientService: PatientService,
    private readonly appointmentService: AppointmentService,
    private readonly chatApi: ChatApiService,
    private readonly auth: AuthService
  ) {
    this.chatApi.messages$.subscribe((msg) => {
      const current = this.messages.value;
      if (!current.some((m) => m.id === msg.id)) {
        this.messages.next([...current, msg]);
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
    // Backend appointment API expects public doctor code (e.g. DR1), not registration number (e.g. DOC002)
    const doctorCode = this.auth.getDoctorPublicCode() ?? this.auth.getDoctorRegistrationNumber();
    const patientPublicId = session.patientPublicId ?? session.id;
    if (!doctorCode || !patientPublicId) {
      return of({ session, messages: [] });
    }

    const ensureAppointment = (): Observable<ChatSession> => {
      if (session.appointmentPublicId) return of(session);
      return this.appointmentService.getPatientAppointments(doctorCode, patientPublicId).pipe(
        map((resp) => {
          const list = Array.isArray(resp)
            ? resp
            : resp?.appointments ?? resp?.content ?? resp?.data ?? [];
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
        // Always attempt WebSocket when opening chat (use appointment id or fallback to patient/session id)
        this.connectWebSocket(s);
        if (!s.appointmentPublicId) return of({ session: s, messages: [] });
        return this.chatApi.getAppointmentMessages(s.appointmentPublicId).pipe(
          map((msgs) => this.normalizeMessages(msgs)),
          tap((msgs) => this.messages.next(msgs)),
          map((messages) => ({ session: s, messages })),
          catchError(() => of({ session: s, messages: [] }))
        );
      })
    );
  }

  private pickAppointment(list: any[]): any {
    const sorted = [...list].sort((a, b) => {
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

  private normalizeMessages(raw: any[]): ChatMessage[] {
    return (raw ?? []).map((m) => ({
      id: String(m.id ?? m.messageId ?? Date.now()),
      senderId: m.senderId ?? 0,
      senderType: (m.senderType ?? 'PATIENT') as 'DOCTOR' | 'PATIENT',
      senderName: m.senderName ?? (m.senderType === 'DOCTOR' ? this.getDoctorName() : 'Patient'),
      content: m.content ?? '',
      messageType: (m.messageType ?? 'TEXT') as 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'FILE',
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      isRead: !!m.isRead,
      isDelivered: !!m.isDelivered,
      ...(m.fileUrl && { fileUrl: m.fileUrl }),
      ...(m.fileName && { fileName: m.fileName }),
      ...(m.fileSize && { fileSize: m.fileSize })
    }));
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
