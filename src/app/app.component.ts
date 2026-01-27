import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SidebarComponent, TopbarComponent, RightSidebarComponent, TemplateComponent, } from '@lk/template';
import { AppButtonComponent, AuthService } from '@lk/core';
import { Subject, takeUntil, filter } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

export interface PatientQueueItem {
  id: string;
  name: string;
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  estimatedTime: string;
  avatar?: string;
  reason: string;
  room?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent, TopbarComponent, RightSidebarComponent, MatIconModule, AppButtonComponent, MatChipsModule, MatDividerModule,
    TemplateComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Shree Clinic Management System';
  sidebarCollapsed = false;
  rightSidebarOpened = false;
  isAuthenticated = false;
  userType: string | null = null;
  currentRoute = '';
  isAuthInitialized = false; // Track if auth state has been initialized
  viewMode: 'login' | 'main' = 'login'; // Explicit property instead of getter
  private destroy$ = new Subject<void>();

    // Keep these methods and data for backward compatibility if needed
    patientQueue: PatientQueueItem[] = [
      {
        id: '1',
        name: 'John Doe',
        status: 'waiting',
        priority: 'medium',
        estimatedTime: '10:30 AM',
        reason: 'Regular checkup',
        room: '101',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
      },
      {
        id: '2',
        name: 'Sarah Smith',
        status: 'in-progress',
        priority: 'high',
        estimatedTime: '10:45 AM',
        reason: 'Follow-up consultation',
        room: '102',
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
      },
      {
        id: '3',
        name: 'Mike Johnson',
        status: 'waiting',
        priority: 'low',
        estimatedTime: '11:00 AM',
        reason: 'Prescription refill',
        room: '103',
        avatar: 'https://randomuser.me/api/portraits/men/3.jpg'
      },
      {
        id: '4',
        name: 'Emily Davis',
        status: 'waiting',
        priority: 'emergency',
        estimatedTime: 'ASAP',
        reason: 'Chest pain',
        room: '104',
        avatar: 'https://randomuser.me/api/portraits/women/4.jpg'
      },
      {
        id: '5',
        name: 'Robert Wilson',
        status: 'completed',
        priority: 'medium',
        estimatedTime: '10:15 AM',
        reason: 'Blood test results',
        room: '105',
        avatar: 'https://randomuser.me/api/portraits/men/5.jpg'
      }
    ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // Get initial route
    const initialUrl = this.router.url || (isPlatformBrowser(this.platformId) ? window.location.pathname : '/');
    this.currentRoute = initialUrl;
    
    // Check storage directly to avoid timing issues with state initialization
    // This prevents the login flash on page refresh
    const token = this.authService.getStoredToken();
    const user = this.authService.getStoredUser();
    const hasStoredAuth = !!(token && user);
    this.isAuthenticated = hasStoredAuth;
    
    if (this.isAuthenticated) {
      this.userType = user?.userType || null;
    }

    // Set initial view mode synchronously to prevent both views showing
    // Check if route is root (/) or login - show login view initially
    // Root route will redirect to /login, so we should show login view
    const isLoginRoute = initialUrl === '/login' || initialUrl.startsWith('/login') || initialUrl === '/';
    if (isLoginRoute) {
      // Always show login view for login route or root route
      // LoginGuard will redirect authenticated users away from login
      this.viewMode = 'login';
    } else {
      // For all other routes, show main layout
      // AuthGuard will redirect unauthenticated users to login
      this.viewMode = 'main';
    }
    
    // Update view mode after initial setup (will be called again when state initializes)
    this.updateViewMode();

    // Subscribe to auth state changes
    this.authService.authState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      // Mark as initialized after first state update
      if (!this.isAuthInitialized) {
        this.isAuthInitialized = true;
      }
      
      const wasAuthenticated = this.isAuthenticated;
      this.isAuthenticated = state.isAuthenticated;
      this.userType = state.currentUser?.user?.userType || null;
      
      // Update current route
      this.currentRoute = this.router.url || (isPlatformBrowser(this.platformId) ? window.location.pathname : '/');
      
      // Update view mode when auth state changes
      this.updateViewMode();
      
      // Force change detection
      this.cdr.detectChanges();
      
      // If authentication state changed, handle navigation
      if (wasAuthenticated !== this.isAuthenticated) {
        if (!this.isAuthenticated) {
          // User logged out, ensure we're on login page
          const currentUrl = this.router.url || (isPlatformBrowser(this.platformId) ? window.location.pathname : '/');
          if (!currentUrl.includes('/login')) {
            this.router.navigate(['/login']);
          }
        }
      }
    });

    // Listen to route changes
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event) => {
      this.currentRoute = event.url;
      
      // Check authentication from storage to avoid timing issues
      const token = this.authService.getStoredToken();
      const user = this.authService.getStoredUser();
      const hasStoredAuth = !!(token && user);
      
      // Use stored auth during initialization, state after
      const isAuth = this.isAuthInitialized ? this.isAuthenticated : hasStoredAuth;
      
      // If user is authenticated and tries to access login or root, redirect to dashboard
      if ((event.url === '/login' || event.url.startsWith('/login') || event.url === '/') && isAuth) {
        const userType = user?.userType || this.authService.getUserType();
        if (userType === 'HOSPITAL') {
          this.router.navigate(['/admin-dashboard']);
        } else if (userType === 'DOCTOR') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
        return; // Don't update viewMode yet, wait for navigation
      }
      
      // Update view mode when route changes
      this.updateViewMode();
      
      // Force change detection
      this.cdr.detectChanges();
    });
  }

  /**
   * Update the view mode based on current route and authentication state
   * This ensures only one view is rendered at a time
   */
  private updateViewMode(): void {
    // Explicitly check route first
    // Include root route (/) as it redirects to /login
    const isLoginRoute = this.currentRoute === '/login' 
      || this.currentRoute.startsWith('/login') 
      || this.currentRoute === '/';
    
    // Check storage directly to avoid timing issues during initialization
    const token = this.authService.getStoredToken();
    const user = this.authService.getStoredUser();
    const hasStoredAuth = !!(token && user);
    
    // Determine authentication status
    // During initialization, use stored auth data
    // After initialization, use the state (which may have been updated by token refresh)
    const isAuth = this.isAuthInitialized 
      ? this.isAuthenticated 
      : hasStoredAuth;
    
    // ONLY show login view if we're actually on the login route or root route
    // LoginGuard will handle redirecting authenticated users away from login
    if (isLoginRoute) {
      // Always show login view when on login route or root route
      // LoginGuard will redirect authenticated users to their dashboard
      this.viewMode = 'login';
    } else {
      // For all other routes, always show main layout
      // Route guards will handle authentication checks and redirects
      this.viewMode = 'main';
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  openPatientQueue(event: any) {
    this.rightSidebarOpened = true;
  }

  closeRightSidebar() {
    this.rightSidebarOpened = false;
  }


  getStatusColor(status: string): string {
    switch (status) {
      case 'waiting': return '#ff9800';
      case 'in-progress': return '#2196f3';
      case 'completed': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#888';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      case 'emergency': return '#9c27b0';
      default: return '#888';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'waiting': return 'schedule';
      case 'in-progress': return 'play_circle';
      case 'completed': return 'check_circle';
      case 'cancelled': return 'cancel';
      default: return 'help';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'low': return 'arrow_downward';
      case 'medium': return 'remove';
      case 'high': return 'arrow_upward';
      case 'emergency': return 'warning';
      default: return 'help';
    }
  }

  getFilteredPatients(status?: string): PatientQueueItem[] {
    if (!status) return this.patientQueue;
    return this.patientQueue.filter(patient => patient.status === status);
  }

  getStatusCount(status: string): number {
    return this.patientQueue.filter(patient => patient.status === status).length;
  }

  onPatientClick(patient: PatientQueueItem) {
    console.log('Patient clicked:', patient);
    // Handle patient selection
  }
  onClose() {
    this.closeRightSidebar();
  }
  onOpenPatientQueue(event: any) {
    this.rightSidebarOpened = true;
  }
}