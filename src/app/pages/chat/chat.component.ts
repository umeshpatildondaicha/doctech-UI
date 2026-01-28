import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { ChatSession, ChatMessage, ChatFilter } from '../../interfaces/chat.interface';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AppButtonComponent } from '@lk/core';

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
  showPatientList = false; // Start with patient list hidden
  isLoading = false;
  isMobile = window.innerWidth < 768;
  isMainSidebarCollapsed = false;

  private subscriptions = new Subscription();

  constructor(private chatService: ChatService, private router: Router) {}

  ngOnInit(): void {
    this.loadChatSessions();
    this.setupResponsiveBehavior();
    this.checkMainSidebarState();
    this.setupSidebarObserver();
    
    // Listen for window resize to detect sidebar changes
    window.addEventListener('resize', () => {
      this.checkMainSidebarState();
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupResponsiveBehavior(): void {
    // Patient list starts closed for both mobile and desktop
    this.showPatientList = false;
  }

  loadChatSessions(): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.chatService.getChatSessions(this.filter).subscribe(sessions => {
        this.chatSessions = sessions;
        this.isLoading = false;
      })
    );
  }

  selectChatSession(session: ChatSession): void {
    this.currentSession = session;
    this.loadMessages(session.id);
    
    // Always close patient list after selection
    this.showPatientList = false;
  }

  loadMessages(sessionId: string): void {
    this.subscriptions.add(
      this.chatService.getMessages(sessionId).subscribe(messages => {
        this.messages = messages;
        this.markMessagesAsRead(sessionId, messages.map(m => m.id));
      })
    );
  }

  sendMessage(): void {
    if (!this.newMessage.trim() && this.selectedFiles.length === 0) return;
    if (!this.currentSession) return;

    // Send text message
    if (this.newMessage.trim()) {
      this.subscriptions.add(
        this.chatService.sendMessage(this.currentSession.id, {
          senderId: 1, // Doctor ID
          senderType: 'DOCTOR',
          senderName: 'Dr. Sarah Johnson',
          content: this.newMessage.trim(),
          messageType: 'TEXT'
        }).subscribe(() => {
          this.newMessage = '';
        })
      );
    }

    // Send files
    this.selectedFiles.forEach(file => {
      this.subscriptions.add(
        this.chatService.uploadFile(
          this.currentSession!.id,
          file,
          1, // Doctor ID
          'DOCTOR',
          'Dr. Sarah Johnson'
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
