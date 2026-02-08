export interface ChatMessage {
  id: string;
  senderId: number;
  senderType: 'DOCTOR' | 'PATIENT';
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'FILE';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: Date;
  isRead: boolean;
  isDelivered: boolean;
}

export interface ChatSession {
  id: string;
  patientId: number;
  patientName: string;
  patientAvatar?: string;
  /** Patient publicId (UUID) – used for API calls */
  patientPublicId?: string;
  doctorId: number;
  doctorName: string;
  doctorAvatar?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  isActive: boolean;
  lastActivity: Date;
  appointmentId?: number;
  appointmentDate?: Date;
  appointmentStatus?: 'SCHEDULED' | 'COMPLETED' | 'CANCELED' | 'PENDING';
  /** Appointment publicId (UUID) – required for chat API and WebSocket INIT */
  appointmentPublicId?: string;
}

export interface ChatFilter {
  appointmentStatus: 'ALL' | 'ACTIVE' | 'PAST' | 'SCHEDULED' | 'COMPLETED' | 'CANCELED';
  searchTerm: string;
  sortBy: 'NAME' | 'LAST_ACTIVITY' | 'UNREAD_COUNT' | 'APPOINTMENT_DATE';
  sortOrder: 'ASC' | 'DESC';
}

export interface ChatNotification {
  id: string;
  type: 'NEW_MESSAGE' | 'FILE_UPLOAD' | 'APPOINTMENT_REMINDER';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  chatSessionId?: string;
  patientId?: number;
}
