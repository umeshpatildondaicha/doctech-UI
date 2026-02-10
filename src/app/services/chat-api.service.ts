import { Injectable } from '@angular/core';
import { HttpService } from '@lk/core';
import { environment } from '../../environments/environment';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { ChatMessage } from '../interfaces/chat.interface';

/** WebSocket INIT payload for chat */
export interface ChatWsInitPayload {
  appointmentPublicId: string;
  userPublicId: string;
  senderType: 'DOCTOR' | 'PATIENT';
}

/** Incoming WebSocket message shape (matches Java backend: INIT_OK, CHAT, ERROR) */
export interface ChatWsMessage {
  type: 'NEW_MESSAGE' | 'INIT_ACK' | 'INIT_OK' | 'CHAT' | 'ERROR';
  payload?: ChatMessage | { id: string } | { message: string };
  /** Backend sends CHAT with these at top level */
  content?: string;
  senderType?: string;
  senderPublicId?: string;
  id?: number | string;
  createdAt?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatApiService {
  private readonly baseUrl = `${environment.apiUrl}/api`;
  /** Use explicit chat.ws if set; otherwise derive from apiUrl. Backend handler is at /ws/chat. */
  private readonly wsBaseUrl =
    (environment.endpoints as any)?.chat?.ws ??
    `${environment.apiUrl.replace(/^http/, 'ws').replace(/^https/, 'wss')}/ws/chat`;
  private ws: WebSocket | null = null;
  private readonly messageSubject = new Subject<ChatMessage>();
  private readonly connectionSubject = new BehaviorSubject<boolean>(false);
  private readonly isDev = !environment.production;

  /** Stream of new messages from WebSocket */
  readonly messages$ = this.messageSubject.asObservable();
  readonly isConnected$ = this.connectionSubject.asObservable();

  constructor(private readonly httpService: HttpService) {}

  /**
   * Load chat history for an appointment.
   * GET /api/chat/appointments/{appointmentPublicId}/messages
   */
  getAppointmentMessages(appointmentPublicId: string): Observable<ChatMessage[]> {
    const safeId = encodeURIComponent((appointmentPublicId || '').trim());
    return this.httpService.sendGETRequest(`${this.baseUrl}/chat/appointments/${safeId}/messages`);
  }

  /**
   * Load unified conversation (all messages for doctor–patient across appointments).
   * GET /api/chat/doctor/{doctorCode}/patient/{patientPublicId}/messages
   * Use this so doctor messages do not disappear when switching chat.
   */
  getConversationMessages(doctorCode: string, patientPublicId: string): Observable<ChatMessage[]> {
    const safeDoctor = encodeURIComponent((doctorCode || '').trim());
    const safePatient = encodeURIComponent((patientPublicId || '').trim());
    return this.httpService.sendGETRequest(`${this.baseUrl}/chat/doctor/${safeDoctor}/patient/${safePatient}/messages`);
  }

  /**
   * Connect WebSocket and send INIT with appointmentId (appointment's public UUID), userPublicId, senderType.
   * Backend expects: type "INIT", appointmentId, userPublicId, senderType ("DOCTOR" | "PATIENT").
   * appointmentId must be a real appointment UUID from the DB or backend responds "Appointment not found".
   */
  connectWebSocket(init: ChatWsInitPayload): void {
    this.disconnect();
    const token = this.getAuthToken();
    const url = `${this.wsBaseUrl}?token=${encodeURIComponent(token || '')}`;
    if (this.isDev) {
      console.log('[Chat] WebSocket connecting to', this.wsBaseUrl);
    }
    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      if (this.isDev) console.warn('[Chat] WebSocket create failed', err);
      this.connectionSubject.next(false);
      return;
    }

    this.ws.onopen = () => {
      this.connectionSubject.next(true);
      // Backend expects key "appointmentId" (appointment's public UUID) and type "CHAT" for messages
      this.ws?.send(JSON.stringify({
        type: 'INIT',
        appointmentId: init.appointmentPublicId,
        userPublicId: init.userPublicId,
        senderType: init.senderType
      }));
      if (this.isDev) console.log('[Chat] WebSocket connected, sent INIT');
    };

    this.ws.onmessage = (event) => {
      try {
        const data: ChatWsMessage = JSON.parse(event.data);
        if (data.type === 'CHAT' && data.content != null) {
          // Backend echoes saved message as { type: 'CHAT', id, content, senderType, senderPublicId, createdAt }
          this.messageSubject.next(this.normalizeMessage({
            id: data.id != null ? String(data.id) : undefined,
            content: data.content,
            senderType: (data.senderType === 'DOCTOR' || data.senderType === 'PATIENT' ? data.senderType : 'PATIENT') as 'DOCTOR' | 'PATIENT',
            senderName: data.senderType === 'DOCTOR' ? 'Doctor' : 'Patient',
            timestamp: data.createdAt ? new Date(data.createdAt) : new Date()
          }));
        } else if (data.type === 'NEW_MESSAGE' && data.payload && this.isChatMessage(data.payload)) {
          this.messageSubject.next(this.normalizeMessage(data.payload));
        } else if ((data.type === 'INIT_OK' || data.type === 'INIT_ACK') && this.isDev) {
          console.log('[Chat] INIT OK received');
        } else if (data.type === 'ERROR' && this.isDev) {
          console.warn('[Chat] Server error:', data.message ?? data.payload);
        }
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onclose = (ev) => {
      if (this.isDev) console.warn('[Chat] WebSocket closed', ev.code, ev.reason || '');
      this.connectionSubject.next(false);
      this.ws = null;
    };

    this.ws.onerror = () => {
      if (this.isDev) console.warn('[Chat] WebSocket error');
      this.connectionSubject.next(false);
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connectionSubject.next(false);
    }
  }

  /** Send a text message over WebSocket (when connected). Backend expects type: "CHAT" and content. */
  sendTextMessage(content: string): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify({ type: 'CHAT', content: content?.trim() ?? '' }));
    return true;
  }

  private getAuthToken(): string {
    try {
      return (localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token')) ?? '';
    } catch {
      return '';
    }
  }

  private isChatMessage(v: unknown): v is Partial<ChatMessage> {
    return typeof v === 'object' && v !== null && 'content' in v && 'senderType' in v;
  }

  private normalizeMessage(raw: Partial<ChatMessage>): ChatMessage {
    return {
      id: (raw.id ?? Date.now().toString()) as string,
      senderId: raw.senderId ?? 0,
      senderType: (raw.senderType ?? 'PATIENT') as 'DOCTOR' | 'PATIENT',
      senderName: raw.senderName ?? 'Unknown',
      content: raw.content ?? '',
      messageType: (raw.messageType ?? 'TEXT') as 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'FILE',
      timestamp: raw.timestamp ? new Date(raw.timestamp as string | Date) : new Date(),
      isRead: !!raw.isRead,
      isDelivered: !!raw.isDelivered,
      ...(raw.fileUrl && { fileUrl: raw.fileUrl }),
      ...(raw.fileName && { fileName: raw.fileName }),
      ...(raw.fileSize && { fileSize: raw.fileSize })
    };
  }
}
