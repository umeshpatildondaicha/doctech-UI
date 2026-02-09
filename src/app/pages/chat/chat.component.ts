import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { ChatSession, ChatMessage, ChatFilter } from '../../interfaces/chat.interface';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AppButtonComponent, DialogboxService, DialogFooterAction } from '@lk/core';
import { AuthService } from '../../services/auth.service';
import { PatientSearchDialogComponent, type PatientSearchResult } from '../patient-search-dialog/patient-search-dialog.component';

@Component({
    selector: 'app-chat',
    imports: [CommonModule, FormsModule,AppButtonComponent],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef;

  chatSessions: ChatSession[] = [];
  currentSession: ChatSession | null = null;
  messages: ChatMessage[] = [];
  newMessage = '';
  isTyping = false;
  selectedFiles: File[] = [];

  // Filter properties
  filter: ChatFilter = {
    appointmentStatus: 'ALL',
    searchTerm: '',
    sortBy: 'LAST_ACTIVITY',
    sortOrder: 'DESC'
  };

  // UI state
  showPatientList = false;
  isLoading = false;
  isMobile = window.innerWidth < 768;
  isMainSidebarCollapsed = false;
  /** WebSocket connected and INIT sent (messages will be saved to backend). */
  isWsConnected = false;
  // Default to ALL so connected patients (no appointmentStatus yet) are visible
  activeChatTab: 'ALL' | 'CURRENT' = 'ALL';

  private subscriptions = new Subscription();

  constructor(
    private readonly chatService: ChatService,
    private readonly router: Router,
    private readonly dialogService: DialogboxService,
    private readonly authService: AuthService
  ) {}

  openPatientPicker(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      { id: 'select', text: 'Select Patient', color: 'primary', appearance: 'raised', fontIcon: 'person_add' }
    ];

    const ref = this.dialogService.openDialog(PatientSearchDialogComponent, {
      title: 'Select Patient',
      data: {},
      width: '70%',
      footerActions
    });

    ref.afterClosed().subscribe((result) => {
      const patient = result?.patient as PatientSearchResult | null | undefined;
      if (!patient) return;

      const patientId = this.patientIdToNumber(patient.id);
      const patientName = patient.fullName || `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() || 'Patient';
      const patientAvatar = patient.profileImageUrl || 'assets/avatars/default-avatar.jpg';

      const existing = this.chatSessions.find(s => s.patientPublicId === patient.id || s.patientId === patientId);
      if (existing) {
        this.selectChatSession(existing);
        return;
      }

      const doctorName = this.getDoctorName();
      const newSession: ChatSession = {
        id: patient.id,
        patientId,
        patientName,
        patientAvatar,
        patientPublicId: patient.id,
        doctorId: 1,
        doctorName,
        doctorAvatar: 'assets/avatars/default-avatar.jpg',
        unreadCount: 0,
        isActive: true,
        lastActivity: new Date(),
        appointmentStatus: 'PENDING',
      };

      // Add on top and open it
      this.chatSessions = [newSession, ...this.chatSessions];
      this.selectChatSession(newSession);
    });
  }

  ngOnInit(): void {
    this.loadChatSessions();
    this.setupResponsiveBehavior();
    this.checkMainSidebarState();
    this.setupSidebarObserver();
    this.subscriptions.add(
      this.chatService.getMessages().subscribe(msgs => (this.messages = msgs))
    );
    this.subscriptions.add(
      this.chatService.getIsConnected().subscribe((connected: boolean) => (this.isWsConnected = connected))
    );
    window.addEventListener('resize', () => this.checkMainSidebarState());
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.chatService.disconnectChat();
    this.subscriptions.unsubscribe();
  }

  private setupResponsiveBehavior(): void {
    // On mobile, show chat list first when no conversation is selected
    this.showPatientList = this.isMobile;
  }

  private patientIdToNumber(id: string): number {
    const digits = (id || '').replace(/\D+/g, '');
    const n = Number.parseInt(digits || '0', 10);
    return Number.isFinite(n) ? n : 0;
  }

  get filteredChatSessions(): ChatSession[] {
    let list = this.chatSessions;
    if (this.activeChatTab === 'CURRENT') {
      // Treat scheduled/pending as “current/active” appointments
      list = list.filter(s =>
        !s.appointmentStatus ||
        s.appointmentStatus === 'SCHEDULED' ||
        s.appointmentStatus === 'PENDING'
      );
    }
    return list;
  }

  setActiveTab(tab: 'ALL' | 'CURRENT'): void {
    this.activeChatTab = tab;
  }

  loadChatSessions(): void {
    this.isLoading = true;
    // Backend /patients/doctor/{code}/connected expects public doctor code (e.g. DR1)
    // Use "me" so backend resolves the authenticated doctor (avoids "Access denied" when token has doctorPublicId but not publicDoctorCode)
    const doctorCode = 'me';
    this.subscriptions.add(
      this.chatService.loadConnectedPatientsAsSessions(doctorCode).subscribe({
        next: (sessions) => {
          this.chatSessions = sessions;
          this.isLoading = false;
        },
        error: () => {
          this.chatSessions = [];
          this.isLoading = false;
        }
      })
    );
  }

  selectChatSession(session: ChatSession): void {
    this.currentSession = session;
    this.showPatientList = false;
    this.subscriptions.add(
      this.chatService.openChatForPatient(session).subscribe({
        next: ({ session: updated, messages }) => {
          this.currentSession = updated;
          this.messages = messages;
          this.markMessagesAsRead(session.id, messages.map(m => m.id));
        },
        error: () => {
          this.messages = [];
        }
      })
    );
  }

  private getDoctorName(): string {
    const u = this.authService.getCurrentUser() as { firstName?: string; lastName?: string; name?: string } | null;
    if (!u) return 'Doctor';
    if (u.firstName || u.lastName) return `Dr. ${(u.firstName || '').trim()} ${(u.lastName || '').trim()}`.trim();
    return (u as any).name || 'Doctor';
  }

  sendMessage(): void {
    if (!this.newMessage.trim() && this.selectedFiles.length === 0) return;
    if (!this.currentSession) return;

    const doctorName = this.getDoctorName();
    if (this.newMessage.trim()) {
      this.subscriptions.add(
        this.chatService.sendMessage(this.currentSession.id, {
          senderId: 1,
          senderType: 'DOCTOR',
          senderName: doctorName,
          content: this.newMessage.trim(),
          messageType: 'TEXT'
        }).subscribe(() => {
          this.newMessage = '';
        })
      );
    }

    this.selectedFiles.forEach(file => {
      this.subscriptions.add(
        this.chatService.uploadFile(
          this.currentSession!.id,
          file,
          1,
          'DOCTOR',
          doctorName
        ).subscribe()
      );
    });

    this.selectedFiles = [];
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      this.selectedFiles = Array.from(files);
    }
  }

  removeFile(file: File): void {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('document') || fileType.includes('text/')) return 'description';
    return 'insert_drive_file';
  }

  markMessagesAsRead(sessionId: string, messageIds: string[]): void {
    this.subscriptions.add(
      this.chatService.markAsRead(sessionId, messageIds).subscribe()
    );
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'SCHEDULED': return '#2196F3';
      case 'COMPLETED': return '#4CAF50';
      case 'CANCELED': return '#F44336';
      case 'PENDING': return '#FF9800';
      default: return '#757575';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'SCHEDULED': return 'schedule';
      case 'COMPLETED': return 'check_circle';
      case 'CANCELED': return 'cancel';
      case 'PENDING': return 'pending';
      default: return 'help';
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  onFilterChange(): void {
    this.loadChatSessions();
  }

  togglePatientList(): void {
    this.showPatientList = !this.showPatientList;
  }

  backToPatientList(): void {
    this.showPatientList = true;
  }

  private scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private checkMainSidebarState(): void {
    // Check if screen is medium size (auto-collapsed) or if app layout has collapsed class
    const isScreenMedium = window.innerWidth <= 900;
    const appLayout = document.querySelector('.app-layout');
    const hasCollapsedClass = appLayout?.classList.contains('sidebar-collapsed');
    
    this.isMainSidebarCollapsed = isScreenMedium || hasCollapsedClass || false;
  }

  private setupSidebarObserver(): void {
    // Watch for changes to the app layout class
    const appLayout = document.querySelector('.app-layout');
    if (appLayout) {
      const observer = new MutationObserver(() => {
        this.checkMainSidebarState();
      });
      
      observer.observe(appLayout, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
  }

  // Handle image loading errors
  onImageError(event: Event, session: any): void {
    const img = event.target as HTMLImageElement;
    if (session?.patientName) {
      img.src = this.getDefaultAvatar(session.patientName);
    } else {
      img.src = this.generateInitialsAvatar('U');
    }
  }

  // Get count of online patients
  getOnlinePatientsCount(): number {
    return this.chatSessions.filter(session => session.isActive).length;
  }

  // Generate default avatar based on name
  getDefaultAvatar(name: string): string {
    if (!name) return this.generateInitialsAvatar('U');
    
    const initials = name.split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
    
    return this.generateInitialsAvatar(initials);
  }

  // Generate initials avatar as data URL
  private generateInitialsAvatar(initials: string): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';
    
    canvas.width = 100;
    canvas.height = 100;
    
    // Generate a consistent color based on initials
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ];
    const colorIndex = initials.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];
    
    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 100, 100);
    
    // Draw initials
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 50, 50);
    
    return canvas.toDataURL();
  }

  // Navigate to patient profile
  navigateToPatientProfile(patientId: number, event: Event): void {
    event.stopPropagation(); // Prevent triggering the chat selection
    this.router.navigate(['/patient', patientId], {
      queryParams: {
        patientId: patientId,
        patientName: this.chatSessions.find(s => s.patientId === patientId)?.patientName || 'Unknown Patient'
      }
    });
  }
}
