/**
 * Authentication Service for Shree Clinic Management System
 * Following enterprise-level standards with proper error handling, state management, and security
 */

import { Injectable, inject, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { 
  LoginRequest, 
  AuthResponse, 
  UserInfo, 
  CurrentUser, 
  AuthState, 
  UserType,
  AccountStatus 
} from '@lk/core';

/**
 * Service responsible for handling all authentication-related operations
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Private subjects for state management
  private readonly _authState = new BehaviorSubject<AuthState>({
    currentUser: null,
    isLoading: false,
    error: null,
    isAuthenticated: false
  });

  // Public observables for components to subscribe to
  public readonly authState$ = this._authState.asObservable();
  public readonly currentUser$ = this.authState$.pipe(map(state => state.currentUser));
  public readonly isAuthenticated$ = this.authState$.pipe(map(state => state.isAuthenticated));
  public readonly isLoading$ = this.authState$.pipe(map(state => state.isLoading));
  public readonly error$ = this.authState$.pipe(map(state => state.error));

  // Constants
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';
  private readonly REMEMBER_ME_KEY = 'remember_me';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.initializeAuthState();
  }

  /**
   * Initialize authentication state from stored data
   */
  private initializeAuthState(): void {
    try {
      const token = this.getStoredToken();
      const user = this.getStoredUser();
      const rememberMe = this.getRememberMeStatus();

      if (token && user && this.isTokenValid(token)) {
        const currentUser: CurrentUser = {
          user,
          token,
          tokenExpiresAt: this.getTokenExpiration(token),
          isAuthenticated: true,
          userType: user.userType
        };

        this.updateAuthState({
          currentUser,
          isLoading: false,
          error: null,
          isAuthenticated: true
        });
      } else if (token && user && !this.isTokenValid(token)) {
        // Token is expired, but we have user data - attempt to refresh
        const refreshToken = this.getStoredRefreshToken();
        if (refreshToken) {
          // Keep user authenticated while attempting refresh
          const currentUser: CurrentUser = {
            user,
            token,
            tokenExpiresAt: this.getTokenExpiration(token),
            isAuthenticated: true,
            userType: user.userType
          };

          this.updateAuthState({
            currentUser,
            isLoading: true,
            error: null,
            isAuthenticated: true
          });

          // Attempt to refresh token in background
          this.refreshToken().subscribe({
            next: (success) => {
              if (!success) {
                // Refresh failed, clear auth data
                this.clearStoredAuthData();
                this.updateAuthState({
                  currentUser: null,
                  isLoading: false,
                  error: null,
                  isAuthenticated: false
                });
              }
              // If refresh succeeds, handleSuccessfulLogin will update the state
            },
            error: () => {
              // Refresh failed, clear auth data
              this.clearStoredAuthData();
              this.updateAuthState({
                currentUser: null,
                isLoading: false,
                error: null,
                isAuthenticated: false
              });
            }
          });
        } else {
          // No refresh token available, but keep user authenticated
          // Let the guard decide whether to allow access or redirect
          // This prevents clearing data before the guard can check
          const currentUser: CurrentUser = {
            user,
            token,
            tokenExpiresAt: this.getTokenExpiration(token),
            isAuthenticated: true,
            userType: user.userType
          };

          this.updateAuthState({
            currentUser,
            isLoading: false,
            error: null,
            isAuthenticated: true
          });
        }
      } else {
        // No token or user data
        this.clearStoredAuthData();
        this.updateAuthState({
          currentUser: null,
          isLoading: false,
          error: null,
          isAuthenticated: false
        });
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this.clearStoredAuthData();
      this.updateAuthState({
        currentUser: null,
        isLoading: false,
        error: 'Failed to restore authentication state',
        isAuthenticated: false
      });
    }
  }

  /**
   * Authenticate user with email and password
   */
  public login(loginRequest: LoginRequest, rememberMe: boolean = false): Observable<boolean> {
    // Reset state and set loading
    this.updateAuthState({ 
      currentUser: null,
      isLoading: true, 
      error: null,
      isAuthenticated: false
    });

    // Create HTTP options with proper headers
    const httpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      withCredentials: false
    };

    console.log('Login request:', {
      url: `${environment.apiUrl}/api/auth/login`,
      email: loginRequest.email,
      rememberMe
    });

    return this.http.post<any>(`${environment.apiUrl}/api/auth/login`, loginRequest, httpOptions).pipe(
      tap((response: any) => {
        console.log('Login response received');
        // Validate response has required data
        if (!response) {
          throw new Error('Empty response from server');
        }
        this.handleSuccessfulLogin(response, rememberMe);
      }),
      map((): boolean => {
        // Verify authentication was successful
        const isAuth = this.isAuthenticated();
        if (!isAuth) {
          throw new Error('Authentication failed - user not authenticated after login');
        }
        return true;
      }),
      catchError((error: HttpErrorResponse | Error) => {
        console.error('Login error:', error);
        
        // Handle HTTP errors
        if (error instanceof HttpErrorResponse) {
          // Handle parsing errors (status 200 but can't parse JSON)
          if (error.status === 200 && error.message.includes('Http failure during parsing')) {
            const errorMessage = 'Server returned invalid response format';
            this.updateAuthState({ 
              currentUser: null,
              isLoading: false, 
              error: errorMessage,
              isAuthenticated: false
            });
            return throwError(() => new Error(errorMessage));
          }
          
          // Check if it's a connection error and try mock login
          if (error.status === 0 || error.status === 502 || error.status === 503) {
            console.log('Backend server unavailable, attempting mock login...');
            return this.handleMockLogin(loginRequest, rememberMe);
          }
          
          const errorMessage = this.handleLoginError(error);
          this.updateAuthState({ 
            currentUser: null,
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false
          });
          return throwError(() => new Error(errorMessage));
        }
        
        // Handle other errors
        const errorMessage = error.message || 'Login failed';
        this.updateAuthState({ 
          currentUser: null,
          isLoading: false, 
          error: errorMessage,
          isAuthenticated: false
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Handle successful login response
   */
  private handleSuccessfulLogin(response: any, rememberMe: boolean): void {
    console.log('Processing login response:', response);
    
    try {
      // Extract data from response - handle multiple response structures
      const data = response.data || response;
      
      // Extract token - check multiple possible locations
      const token = data.accessToken || data.token || data.access_token || response.accessToken || response.token;
      if (!token) {
        throw new Error('No access token found in login response');
      }

      // Extract refresh token - check multiple possible locations
      const refreshToken = data.refreshToken || data.refresh_token || response.refreshToken || response.refresh_token;
      console.log('Refresh token found:', !!refreshToken);

      // Extract expiresIn
      const expiresIn = data.expiresIn || data.expires_in || response.expiresIn || 3600;
      const expiresInSeconds = typeof expiresIn === 'number' ? expiresIn : parseInt(expiresIn, 10) || 3600;

      // Extract user data
      let user: UserInfo;
      if (data.user) {
        user = data.user;
      } else if (response.user) {
        user = response.user;
      } else {
        // Construct user from root level data
        user = {
          id: data.userId || data.id || response.userId || response.id || '1',
          email: data.email || response.email || '',
          fullName: data.fullName || data.name || data.displayName || response.fullName || response.name || 'User',
          userType: data.userType || data.user_type || response.userType || 'HOSPITAL',
          profilePicture: data.profilePicture || data.profile_picture || response.profilePicture || 'assets/avatars/default-avatar.jpg',
          phoneNumber: data.phoneNumber || data.phone_number || response.phoneNumber || '',
          role: data.role || response.role || 'ADMIN',
          permissions: data.permissions || response.permissions || [],
          createdAt: data.createdAt || data.created_at || response.createdAt || new Date().toISOString(),
          lastLoginAt: data.lastLoginAt || data.last_login_at || response.lastLoginAt || new Date().toISOString(),
          status: (data.status || data.active || response.status || response.active) ? 'ACTIVE' : 'INACTIVE'
        };
      }

      // Validate required user fields
      if (!user.id || !user.email) {
        throw new Error('Invalid user data in login response');
      }

      // Calculate token expiration
      const tokenExpiresAt = Date.now() + (expiresInSeconds * 1000);

      // Create current user object
      const currentUser: CurrentUser = {
        user,
        token,
        tokenExpiresAt,
        isAuthenticated: true,
        userType: user.userType || 'HOSPITAL'
      };

      console.log('Login successful - User:', user.email, 'Type:', currentUser.userType);
      console.log('Token expires at:', new Date(tokenExpiresAt).toISOString());
      console.log('Refresh token stored:', !!refreshToken);

      // Store authentication data FIRST (before state update)
      this.storeAuthData(token, refreshToken, user, rememberMe);

      // Update state AFTER storing data
      this.updateAuthState({
        currentUser,
        isLoading: false,
        error: null,
        isAuthenticated: true
      });

      // Navigation will be handled by the component via authState$ subscription
      // This keeps the service decoupled from routing
    } catch (error: any) {
      console.error('Error processing login response:', error);
      this.updateAuthState({
        currentUser: null,
        isLoading: false,
        error: error.message || 'Failed to process login response',
        isAuthenticated: false
      });
      throw error;
    }
  }

  /**
   * Handle login errors and return appropriate error messages
   */
  private handleLoginError(error: HttpErrorResponse): string {
    console.error('Login error details:', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      url: error.url,
      error: error.error
    });

    if (error.status === 0) {
      return 'Unable to connect to the server. Please check if the backend server is running on port 8080.';
    }

    // Check if it's a network error
    if (error.error instanceof ErrorEvent) {
      return 'Network error occurred. Please check your internet connection and ensure the backend server is running.';
    }

    switch (error.status) {
      case 400:
        return 'Invalid login credentials. Please check your email and password.';
      case 401:
        return 'Invalid email or password. Please try again.';
      case 403:
        return 'Account is suspended or inactive. Please contact support.';
      case 404:
        return 'User account not found. Please check your email and user type.';
      case 429:
        return 'Too many login attempts. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
        return 'Backend server is not responding. Please ensure the server is running on port 8080.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return `Server error (${error.status}). Please try again or contact support if the problem persists.`;
    }
  }

  /**
   * Handle mock login when backend is unavailable
   */
  private handleMockLogin(loginRequest: LoginRequest, rememberMe: boolean): Observable<boolean> {
    // Mock credentials for demo purposes
    const mockCredentials = {
      [UserType.HOSPITAL]: { email: 'u513107@gmail.com', password: 'Shree@123' },
      [UserType.DOCTOR]: { email: 'swapnil@gmail.com', password: 'Swapnil@123' },
      [UserType.PATIENT]: { email: 'patient@shreephysio.com', password: 'Patient@123' }
    };

    // Determine expected credentials by userType if provided, otherwise infer by email
    const expectedByType = loginRequest.userType ? mockCredentials[loginRequest.userType] : undefined;
    const inferredType = !loginRequest.userType
      ? (Object.keys(mockCredentials) as unknown as Array<keyof typeof mockCredentials>).find(
          (t) => mockCredentials[t].email === loginRequest.email
        )
      : loginRequest.userType;
    const expectedCredentials = expectedByType || (inferredType ? mockCredentials[inferredType] : undefined);
    
    if (expectedCredentials && 
        loginRequest.email === expectedCredentials.email && 
        loginRequest.password === expectedCredentials.password) {
      
      const resolvedType = inferredType || loginRequest.userType || UserType.HOSPITAL;
      console.log('Mock login successful for:', resolvedType);
      
      // Create mock response
      const getUserInfo = (userType: string) => {
        switch (userType) {
          case UserType.DOCTOR:
            return {
              id: 'DOC-12332',
              fullName: 'Dr. Swapnil',
              phoneNumber: '8788802334'
            };
          case UserType.HOSPITAL:
            return {
              id: 'ADMIN-001',
              fullName: 'Hospital Admin',
              phoneNumber: '+91-22-12345678'
            };
          case UserType.PATIENT:
            return {
              id: 'PAT-001',
              fullName: 'John Doe',
              phoneNumber: '+91-9876543210'
            };
          default:
            return {
              id: 'USER-001',
              fullName: 'Demo User',
              phoneNumber: '+91-0000000000'
            };
        }
      };

      const userInfo = getUserInfo(resolvedType);
      
      const mockResponse = {
        success: true,
        message: 'Login successful (Demo Mode)',
        data: {
          token: 'mock-jwt-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now(),
          user: {
            id: userInfo.id,
            email: loginRequest.email,
            fullName: userInfo.fullName,
            userType: resolvedType,
            status: 'ACTIVE',
            phoneNumber: userInfo.phoneNumber,
            profilePicture: 'assets/avatars/default-avatar.jpg',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          }
        }
      };
      
      this.handleSuccessfulLogin(mockResponse, rememberMe);
      return of(true);
    } else {
      const errorMessage = 'Invalid email or password. Please try again. (Demo Mode)';
      this.updateAuthState({ 
        ...this._authState.value, 
        isLoading: false, 
        error: errorMessage 
      });
      return throwError(() => new Error(errorMessage));
    }
  }

  /**
   * Navigate user to appropriate dashboard after successful login
   */
          private navigateAfterLogin(userType: string): void {
          console.log('Navigating for user type:', userType);
          switch (userType) {
            case 'HOSPITAL':
              console.log('Navigating to admin dashboard');
              this.router.navigate(['/admin-dashboard']);
              break;
            case 'DOCTOR':
              console.log('Navigating to doctor dashboard');
              this.router.navigate(['/dashboard']);
              break;
            case 'PATIENT':
              console.log('Navigating to patient dashboard');
              this.router.navigate(['/patient-dashboard']);
              break;
            default:
              console.log('Default navigation to dashboard');
              this.router.navigate(['/dashboard']);
          }
        }

  /**
   * Logout user and clear all authentication data
   */
  public logout(): void {
    // Clear stored data
    this.clearStoredAuthData();

    // Update state
    this.updateAuthState({
      currentUser: null,
      isLoading: false,
      error: null,
      isAuthenticated: false
    });

    // Navigate to login
    this.router.navigate(['/login']);
  }

  /**
   * Refresh authentication token
   */
  public refreshToken(): Observable<boolean> {
    const refreshToken = this.getStoredRefreshToken();
    
    if (!refreshToken) {
      console.warn('No refresh token available for token refresh');
      return of(false);
    }

    console.log('Attempting to refresh token...');

    return this.http.post<any>(`${environment.apiUrl}/api/auth/refresh`, { refreshToken }).pipe(
      tap((response: any) => {
        console.log('Token refresh successful');
        // Use the same login handler to process the refresh response
        this.handleSuccessfulLogin(response, this.getRememberMeStatus());
      }),
      map(() => true),
      catchError((error: HttpErrorResponse) => {
        console.error('Token refresh failed:', error);
        // Only logout if it's a real auth error, not a network error
        if (error.status === 401 || error.status === 403) {
          console.log('Refresh token invalid, logging out');
          this.logout();
        }
        return of(false);
      })
    );
  }

  /**
   * Check if current token is valid
   */
  public isTokenValid(token?: string): boolean {
    const tokenToCheck = token || this.getStoredToken();
    
    if (!tokenToCheck) {
      return false;
    }

    try {
      const expiration = this.getTokenExpiration(tokenToCheck);
      return Date.now() < expiration;
    } catch {
      return false;
    }
  }

  /**
   * Get token expiration time
   */
  private getTokenExpiration(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000;
    } catch {
      return 0;
    }
  }

  /**
   * Get current user information
   */
  public getCurrentUser(): UserInfo | null {
    return this._authState.value.currentUser?.user || null;
  }

  /**
   * Get current user type
   */
  public getUserType(): string | null {
    return this._authState.value.currentUser?.user.userType || null;
  }

  /**
   * Check if user has specific permission
   */
  public hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions?.includes(permission) || false;
  }

  /**
   * Check if user is of specific type
   */
  public isUserType(userType: UserType): boolean {
    return this.getUserType() === userType;
  }

  /**
   * Check if user is hospital admin
   */
  public isHospitalAdmin(): boolean {
    return this.isUserType(UserType.HOSPITAL);
  }

  /**
   * Check if user is doctor
   */
  public isDoctor(): boolean {
    return this.isUserType(UserType.DOCTOR);
  }

  /**
   * Check if user is patient
   */
  public isPatient(): boolean {
    return this.isUserType(UserType.PATIENT);
  }

  /**
   * Update authentication state
   */
  private updateAuthState(newState: Partial<AuthState>): void {
    const currentState = this._authState.value;
    const updatedState = { ...currentState, ...newState };
    console.log('Updating auth state:', { currentState, newState, updatedState });
    this._authState.next(updatedState);
  }

  /**
   * Store authentication data in storage
   */
  private storeAuthData(token: string, refreshToken: string | undefined, user: UserInfo, rememberMe: boolean): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip localStorage/sessionStorage operations during SSR
    }
    
    try {
      // Validate token before storing
      if (!token || token === 'dummy-token') {
        console.error('Invalid token provided for storage');
        throw new Error('Invalid token');
      }

      // Preserve existing refresh token if new one is not provided (for token refresh scenarios)
      const existingRefreshToken = this.getStoredRefreshToken();
      const tokenToStore = refreshToken || existingRefreshToken;
      
      const storage = rememberMe ? localStorage : sessionStorage;
      
      // Store token
      storage.setItem(this.TOKEN_KEY, token);
      
      // Store refresh token if available
      if (tokenToStore) {
        storage.setItem(this.REFRESH_TOKEN_KEY, tokenToStore);
        console.log('Refresh token stored in', rememberMe ? 'localStorage' : 'sessionStorage');
      } else {
        // Remove refresh token if not provided and not preserving existing
        storage.removeItem(this.REFRESH_TOKEN_KEY);
        console.warn('No refresh token provided or found');
      }
      
      // Store user data
      storage.setItem(this.USER_KEY, JSON.stringify(user));
      
      // Store remember me preference
      storage.setItem(this.REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');
      
      console.log('Auth data stored successfully:', {
        hasToken: !!token,
        hasRefreshToken: !!tokenToStore,
        rememberMe,
        storage: rememberMe ? 'localStorage' : 'sessionStorage'
      });
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  }

  /**
   * Clear all stored authentication data
   */
  private clearStoredAuthData(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip localStorage/sessionStorage operations during SSR
    }
    
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.REMEMBER_ME_KEY);
      
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
      sessionStorage.removeItem(this.REMEMBER_ME_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * Get stored authentication token
   */
  public getStoredToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null; // Return null during SSR
    }
    
    try {
      return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Get stored refresh token
   */
  public getStoredRefreshToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null; // Return null during SSR
    }
    
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY) || sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Get stored user data
   */
  public getStoredUser(): UserInfo | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null; // Return null during SSR
    }
    
    try {
      const userData = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get remember me status
   */
  private getRememberMeStatus(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false; // Return false during SSR
    }
    
    try {
      return localStorage.getItem(this.REMEMBER_ME_KEY) === 'true' || 
             sessionStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Check if user is currently authenticated (synchronous method for guards)
   */
  public isAuthenticated(): boolean {
    return this._authState.value.isAuthenticated;
  }

  /**
   * Get authentication headers for HTTP requests
   */
  public getAuthHeaders(): { [key: string]: string } {
    const token = this.getStoredToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Resolve the logged-in doctor's registration number (e.g. "DR1", "DOC-12345").
   * Backend timings APIs expect registration number in the path param.
   */
  public getDoctorRegistrationNumber(): string | null {
    const fromUser = (u: any): string | null => {
      if (!u) return null;
      return (
        u.registrationNumber ||
        u.registration_number ||
        u.registrationNo ||
        u.regNo ||
        u.doctorRegistrationNumber ||
        u.doctorRegNo ||
        u.publicDoctorCode ||
        u.doctorCode ||
        null
      );
    };

    // Prefer current in-memory user, then stored user (handles refresh/reload)
    const current = this.getCurrentUser() as any;
    const stored = this.getStoredUser() as any;
    const regFromUser = fromUser(current) || fromUser(stored);
    if (regFromUser) return String(regFromUser).trim() || null;

    // Fallback: inspect JWT payload if it contains registrationNumber
    const token = this.getStoredToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const regFromToken =
          payload.registrationNumber ||
          payload.registration_number ||
          payload.registrationNo ||
          payload.regNo ||
          payload.doctorRegistrationNumber ||
          payload.doctorRegNo ||
          payload.publicDoctorCode ||
          payload.doctorCode ||
          null;
        if (regFromToken) return String(regFromToken).trim() || null;
      } catch {
        // ignore parsing failures
      }
    }

    // If your backend uses user.id as registration number for doctors, allow it as last resort.
    const idCandidate = (current?.id || stored?.id || '').toString().trim();
    if (idCandidate && /^[A-Za-z]{1,6}[-]?\d{1,10}$/.test(idCandidate)) return idCandidate;

    return null;
  }
} 