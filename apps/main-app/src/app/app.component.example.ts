import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

// Import from @lk/core
import { CoreEventService, AuthService } from '@lk/core';
// Import from @lk/template
import { TemplateModule } from '@lk/template';

/**
 * Example main app component showing how to use @lk/core and @lk/template
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TemplateModule],
  template: `
    <div class="app-container">
      <h1>Main App Example</h1>
      
      <!-- Example: Using CoreEventService signals -->
      <div class="signal-example">
        <h2>Signal-based Communication Example</h2>
        <p>Current Menu: {{ currentMenu() }}</p>
        <p>Auth State: {{ authState() | json }}</p>
        
        <button (click)="setMenu('dashboard')">Set Menu to Dashboard</button>
        <button (click)="clearMenu()">Clear Menu</button>
      </div>

      <!-- Example: Using AuthService from @lk/core -->
      <div class="auth-example">
        <h2>Auth Service Example</h2>
        <button (click)="checkAuth()">Check Auth Status</button>
        <p *ngIf="isAuthenticated">User is authenticated</p>
        <p *ngIf="!isAuthenticated">User is not authenticated</p>
      </div>

      <!-- Template components from @lk/template can be used here -->
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app-container {
      padding: 20px;
    }
    .signal-example, .auth-example {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      margin: 5px;
      padding: 8px 16px;
      cursor: pointer;
    }
  `]
})
export class AppComponent {
  // Inject services from @lk/core
  private eventService = inject(CoreEventService);
  private authService = inject(AuthService);

  // Use computed signals from CoreEventService
  currentMenu = computed(() => this.eventService.menu());
  authState = computed(() => this.eventService.authState());
  isAuthenticated = this.authService.isAuthenticated();

  setMenu(menu: string) {
    this.eventService.setMenu(menu);
  }

  clearMenu() {
    this.eventService.clearMenu();
  }

  checkAuth() {
    const user = this.authService.getCurrentUser();
    console.log('Current user:', user);
    console.log('Is authenticated:', this.authService.isAuthenticated());
  }
}

