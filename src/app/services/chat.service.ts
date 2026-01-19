import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ChatMessage, ChatSession, ChatFilter, ChatNotification } from '../interfaces/chat.interface';
import { Patient } from '../interfaces/patient.interface';
import { Appointment } from '../interfaces/appointment.interface';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private chatSessions = new BehaviorSubject<ChatSession[]>([]);
  private currentChatSession = new BehaviorSubject<ChatSession | null>(null);
  private messages = new BehaviorSubject<ChatMessage[]>([]);
  private notifications = new BehaviorSubject<ChatNotification[]>([]);

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock chat sessions
    const mockSessions: ChatSession[] = [
      {
        id: '1',
        patientId: 1,
        patientName: 'John Smith',
        patientAvatar: 'assets/avatars/default-avatar.jpg',
        doctorId: 1,
        doctorName: 'Dr. Sarah Johnson',
        doctorAvatar: 'assets/avatars/default-avatar.jpg',
        unreadCount: 2,
        isActive: true,
        lastActivity: new Date(),
        appointmentId: 1,
        appointmentDate: new Date('2024-02-15'),
        appointmentStatus: 'SCHEDULED',
        lastMessage: {
          id: '1',
          senderId: 1,
          senderType: 'PATIENT',
          senderName: 'John Smith',
          content: 'I have some questions about my medication',
          messageType: 'TEXT',
          timestamp: new Date(),
          isRead: false,
          isDelivered: true
        }
      },
      {
        id: '2',
        patientId: 2,
        patientName: 'Emily Davis',
        patientAvatar: 'assets/avatars/default-avatar.jpg',
        doctorId: 1,
        doctorName: 'Dr. Sarah Johnson',
        doctorAvatar: 'assets/avatars/default-avatar.jpg',
        unreadCount: 0,
        isActive: true,
        lastActivity: new Date(Date.now() - 86400000), // 1 day ago
        appointmentId: 2,
        appointmentDate: new Date('2024-02-10'),
        appointmentStatus: 'COMPLETED',
        lastMessage: {
          id: '2',
          senderId: 1,
          senderType: 'DOCTOR',
          senderName: 'Dr. Sarah Johnson',
          content: 'Your test results look good',
          messageType: 'TEXT',
          timestamp: new Date(Date.now() - 86400000),
          isRead: true,
          isDelivered: true
        }
      },
      {
        id: '3',
        patientId: 3,
        patientName: 'Michael Brown',
        patientAvatar: 'assets/avatars/default-avatar.jpg',
        doctorId: 1,
        doctorName: 'Dr. Sarah Johnson',
        doctorAvatar: 'assets/avatars/default-avatar.jpg',
        unreadCount: 1,
        isActive: true,
        lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
        appointmentId: 3,
        appointmentDate: new Date('2024-02-20'),
        appointmentStatus: 'SCHEDULED',
        lastMessage: {
          id: '3',
          senderId: 3,
          senderType: 'PATIENT',
          senderName: 'Michael Brown',
          content: 'Can I reschedule my appointment?',
          messageType: 'TEXT',
          timestamp: new Date(Date.now() - 3600000),
          isRead: false,
          isDelivered: true
        }
      }
    ];

    this.chatSessions.next(mockSessions);
  }

  getChatSessions(filter: ChatFilter): Observable<ChatSession[]> {
    let sessions = this.chatSessions.value;

    // Filter by appointment status
    if (filter.appointmentStatus !== 'ALL') {
      sessions = sessions.filter(session => session.appointmentStatus === filter.appointmentStatus);
    }

    // Filter by search term
    if (filter.searchTerm) {
      sessions = sessions.filter(session => 
        session.patientName.toLowerCase().includes(filter.searchTerm.toLowerCase())
      );
    }

    // Sort sessions
    sessions.sort((a, b) => {
      let comparison = 0;
      
      switch (filter.sortBy) {
        case 'NAME':
          comparison = a.patientName.localeCompare(b.patientName);
          break;
        case 'LAST_ACTIVITY':
          comparison = a.lastActivity.getTime() - b.lastActivity.getTime();
          break;
        case 'UNREAD_COUNT':
          comparison = b.unreadCount - a.unreadCount;
          break;
        case 'APPOINTMENT_DATE':
          if (a.appointmentDate && b.appointmentDate) {
            comparison = a.appointmentDate.getTime() - b.appointmentDate.getTime();
          }
          break;
      }

      return filter.sortOrder === 'ASC' ? comparison : -comparison;
    });

    return of(sessions);
  }

  getChatSession(id: string): Observable<ChatSession | null> {
    const session = this.chatSessions.value.find(s => s.id === id);
    this.currentChatSession.next(session || null);
    return of(session || null);
  }

  getMessages(sessionId: string): Observable<ChatMessage[]> {
    // Mock messages for the session
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        senderId: 1,
        senderType: 'PATIENT',
        senderName: 'John Smith',
        content: 'Hello Doctor, I have some questions about my medication',
        messageType: 'TEXT',
        timestamp: new Date(Date.now() - 3600000),
        isRead: true,
        isDelivered: true
      },
      {
        id: '2',
        senderId: 1,
        senderType: 'DOCTOR',
        senderName: 'Dr. Sarah Johnson',
        content: 'Hello John! Of course, I\'m here to help. What would you like to know?',
        messageType: 'TEXT',
        timestamp: new Date(Date.now() - 3500000),
        isRead: true,
        isDelivered: true
      },
      {
        id: '3',
        senderId: 1,
        senderType: 'PATIENT',
        senderName: 'John Smith',
        content: 'I\'ve been experiencing some side effects. Should I be concerned?',
        messageType: 'TEXT',
        timestamp: new Date(Date.now() - 3400000),
        isRead: true,
        isDelivered: true
      },
      {
        id: '4',
        senderId: 1,
        senderType: 'DOCTOR',
        senderName: 'Dr. Sarah Johnson',
        content: 'Can you describe the side effects you\'re experiencing? Also, please send me a photo if there are any visible symptoms.',
        messageType: 'TEXT',
        timestamp: new Date(Date.now() - 3300000),
        isRead: false,
        isDelivered: true
      }
    ];

    this.messages.next(mockMessages);
    return of(mockMessages);
  }

  sendMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead' | 'isDelivered'>): Observable<ChatMessage> {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false,
      isDelivered: false
    };

    const currentMessages = this.messages.value;
    currentMessages.push(newMessage);
    this.messages.next([...currentMessages]);

    // Update last message in chat session
    const sessions = this.chatSessions.value;
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].lastMessage = newMessage;
      sessions[sessionIndex].lastActivity = new Date();
      this.chatSessions.next([...sessions]);
    }

    // Simulate delivery and read status
    setTimeout(() => {
      newMessage.isDelivered = true;
      this.messages.next([...currentMessages]);
    }, 1000);

    return of(newMessage);
  }

  uploadFile(sessionId: string, file: File, senderId: number, senderType: 'DOCTOR' | 'PATIENT', senderName: string): Observable<ChatMessage> {
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

    const currentMessages = this.messages.value;
    currentMessages.push(fileMessage);
    this.messages.next([...currentMessages]);

    // Update last message in chat session
    const sessions = this.chatSessions.value;
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].lastMessage = fileMessage;
      sessions[sessionIndex].lastActivity = new Date();
      this.chatSessions.next([...sessions]);
    }

    return of(fileMessage);
  }

  private getFileMessageType(mimeType: string): 'IMAGE' | 'DOCUMENT' | 'FILE' {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text/')) return 'DOCUMENT';
    return 'FILE';
  }

  markAsRead(sessionId: string, messageIds: string[]): Observable<void> {
    const currentMessages = this.messages.value;
    messageIds.forEach(id => {
      const message = currentMessages.find(m => m.id === id);
      if (message) {
        message.isRead = true;
      }
    });
    this.messages.next([...currentMessages]);

    // Update unread count in chat session
    const sessions = this.chatSessions.value;
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].unreadCount = 0;
      this.chatSessions.next([...sessions]);
    }

    return of(void 0);
  }

  getNotifications(): Observable<ChatNotification[]> {
    return this.notifications.asObservable();
  }

  markNotificationAsRead(notificationId: string): Observable<void> {
    const currentNotifications = this.notifications.value;
    const notification = currentNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.notifications.next([...currentNotifications]);
    }
    return of(void 0);
  }

  getUnreadMessageCount(): Observable<number> {
    const sessions = this.chatSessions.value;
    const totalUnread = sessions.reduce((sum, session) => sum + session.unreadCount, 0);
    return of(totalUnread);
  }
}
