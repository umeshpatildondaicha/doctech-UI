import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  SidebarComponent,
  RightSidebarComponent,
  PatientQueueService
} from '@lk/template';
import { AppPatientQueueContentComponent } from './components/app-patient-queue-content/app-patient-queue-content.component';
import { AuthService } from '@lk/core';
import { AppTopbarComponent } from './components/app-topbar/app-topbar.component';
import { Subject, takeUntil, filter } from 'rxjs';

@Component({
    selector: 'app-root',
    imports: [
    RouterOutlet,
    CommonModule,
    SidebarComponent,
    AppTopbarComponent,
    RightSidebarComponent,
    AppPatientQueueContentComponent
],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Shree Clinic Management System';
  sidebarCollapsed = true;
  rightSidebarOpen = false;
  isAuthenticated = false;
  private patientQueueService = inject(PatientQueueService);
  userType: string | null = null;
  currentRoute = '';
  isAuthInitialized = false; // Track if auth state has been initialized
  viewMode: 'login' | 'main' = 'login'; // Explicit property instead of getter
  private destroy$ = new Subject<void>();

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
    // Right sidebar should only exist for doctors
    if (this.userType !== 'DOCTOR') {
      this.rightSidebarOpen = false;
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

    // Load patient queue sample data when authenticated (template reference implementation)
    if (hasStoredAuth) {
      this.patientQueueService.loadSampleData();
    }

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
      // Right sidebar should only exist for doctors
      if (this.userType !== 'DOCTOR') {
        this.rightSidebarOpen = false;
      }

      if (state.isAuthenticated) {
        this.patientQueueService.loadSampleData();
      }
      
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

  onStartPatient(patient: { id: string; name: string }) {
    console.log('Start patient:', patient);
  }

  onQueuePatientClick(patient: { id: string; name: string }) {
    console.log('Queue patient clicked:', patient);
  }

  onViewSchedule() {
    console.log('View full schedule');
  }

}