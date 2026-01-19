/**
 * ICOMOON ICONS - TYPESCRIPT DEMO
 * 
 * This file demonstrates how to use Icomoon icons in your Angular components.
 * Copy the relevant sections into your own components.
 */

import { Component } from '@angular/core';
import { IconComponent } from './app/tools/app-icon/icon.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icomoon-demo',
  standalone: true,
  imports: [IconComponent, CommonModule],
  template: `
    <div class="demo-container">
      <h1>Icomoon Icons Demo</h1>

      <!-- Section 1: Basic Icons -->
      <section class="demo-section">
        <h2>Basic Icons</h2>
        <div class="icon-grid">
          <div class="icon-item">
            <app-icon 
              iconType="icomoon"
              icomoonClass="icon-home"
              [size]="24"
              color="#667eea"
            ></app-icon>
            <span>Home</span>
          </div>
          
          <div class="icon-item">
            <app-icon 
              iconType="icomoon"
              icomoonClass="icon-user"
              [size]="24"
              color="#667eea"
            ></app-icon>
            <span>User</span>
          </div>
          
          <div class="icon-item">
            <app-icon 
              iconType="icomoon"
              icomoonClass="icon-calendar"
              [size]="24"
              color="#667eea"
            ></app-icon>
            <span>Calendar</span>
          </div>
          
          <div class="icon-item">
            <app-icon 
              iconType="icomoon"
              icomoonClass="icon-settings"
              [size]="24"
              color="#667eea"
            ></app-icon>
            <span>Settings</span>
          </div>
        </div>
      </section>

      <!-- Section 2: Interactive Icons -->
      <section class="demo-section">
        <h2>Interactive Icons</h2>
        <div class="icon-grid">
          <app-icon 
            iconType="icomoon"
            icomoonClass="icon-heart"
            [size]="32"
            [color]="isLiked ? '#e91e63' : '#ccc'"
            (iconClick)="toggleLike()"
          ></app-icon>
          
          <app-icon 
            iconType="icomoon"
            icomoonClass="icon-notification"
            [size]="24"
            [counter]="notificationCount"
            color="#667eea"
            (iconClick)="showNotifications()"
          ></app-icon>
          
          <app-icon 
            iconType="icomoon"
            icomoonClass="icon-menu"
            [size]="24"
            color="#667eea"
            (iconClick)="toggleMenu()"
          ></app-icon>
        </div>
        <p>Clicked: {{ lastAction }}</p>
      </section>

      <!-- Section 3: Covered Icons -->
      <section class="demo-section">
        <h2>Covered Icons</h2>
        <div class="icon-grid">
          <app-icon 
            iconType="icomoon"
            icomoonClass="icon-edit"
            [size]="20"
            [isCovered]="true"
            color="#3498db"
            (iconClick)="handleEdit()"
          ></app-icon>
          
          <app-icon 
            iconType="icomoon"
            icomoonClass="icon-delete"
            [size]="20"
            [isCovered]="true"
            color="#e74c3c"
            (iconClick)="handleDelete()"
          ></app-icon>
          
          <app-icon 
            iconType="icomoon"
            icomoonClass="icon-check"
            [size]="20"
            [isCovered]="true"
            color="#27ae60"
          ></app-icon>
        </div>
      </section>

      <!-- Section 4: Size Variations -->
      <section class="demo-section">
        <h2>Size Variations</h2>
        <div class="icon-grid">
          <app-icon 
            iconType="icomoon"
            icomoonClass="icon-star"
            [size]="16"
            color="#667eea"
          ></app-icon>
          
          <app-icon 
            iconType="icomoon"
            icomoonClass="icon-star"
            [size]="24"
            color="#667eea"
          ></app-icon>
          
          <app-icon 
            iconType="icomoon"
            icomoonClass="icon-star"
            [size]="32"
            color="#667eea"
          ></app-icon>
          
          <app-icon 
            iconType="icomoon"
            icomoonClass="icon-star"
            [size]="48"
            color="#667eea"
          ></app-icon>
        </div>
      </section>

      <!-- Section 5: Blinking Icons -->
      <section class="demo-section">
        <h2>Animated Icons</h2>
        <div class="icon-grid">
          <app-icon 
            iconType="icomoon"
            icomoonClass="icon-notification"
            [size]="24"
            [isBlink]="true"
            color="#e74c3c"
          ></app-icon>
          
          <app-icon 
            iconType="icomoon"
            icomoonClass="icon-heart"
            [size]="24"
            [isBlink]="isHeartBeating"
            color="#e91e63"
          ></app-icon>
        </div>
        <button (click)="toggleHeartBeat()">
          {{ isHeartBeating ? 'Stop' : 'Start' }} Heart Beat
        </button>
      </section>

      <!-- Section 6: Navigation -->
      <section class="demo-section">
        <h2>Navigation Example</h2>
        <div class="navigation-demo">
          <app-icon 
            iconType="icomoon"
            icomoonClass="icon-arrow-left"
            [size]="20"
            color="#667eea"
            (iconClick)="previousPage()"
          ></app-icon>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <app-icon 
            iconType="icomoon"
            icomoonClass="icon-arrow-right"
            [size]="20"
            color="#667eea"
            (iconClick)="nextPage()"
          ></app-icon>
        </div>
      </section>

      <!-- Section 7: Action Buttons -->
      <section class="demo-section">
        <h2>Action Buttons</h2>
        <div class="button-demo">
          <button class="primary-btn">
            <app-icon 
              iconType="icomoon"
              icomoonClass="icon-plus"
              [size]="18"
              color="#fff"
            ></app-icon>
            Add New
          </button>
          
          <button class="secondary-btn">
            <app-icon 
              iconType="icomoon"
              icomoonClass="icon-search"
              [size]="18"
              color="#667eea"
            ></app-icon>
            Search
          </button>
          
          <button class="danger-btn">
            <app-icon 
              iconType="icomoon"
              icomoonClass="icon-delete"
              [size]="18"
              color="#fff"
            ></app-icon>
            Delete
          </button>
        </div>
      </section>

      <!-- Section 8: Contact Info -->
      <section class="demo-section">
        <h2>Contact Info</h2>
        <div class="contact-demo">
          <div class="contact-item">
            <app-icon 
              iconType="icomoon"
              icomoonClass="icon-phone"
              [size]="20"
              color="#667eea"
            ></app-icon>
            <span>+1 234 567 890</span>
          </div>
          
          <div class="contact-item">
            <app-icon 
              iconType="icomoon"
              icomoonClass="icon-email"
              [size]="20"
              color="#667eea"
            ></app-icon>
            <span>info@shreeclinic.com</span>
          </div>
        </div>
      </section>

      <!-- Section 9: Dynamic Icons -->
      <section class="demo-section">
        <h2>Dynamic Icons</h2>
        <div class="dynamic-demo">
          <app-icon 
            iconType="icomoon"
            [icomoonClass]="currentIcon"
            [size]="32"
            [color]="currentColor"
          ></app-icon>
          
          <div class="controls">
            <button (click)="changeIcon('icon-home')">Home</button>
            <button (click)="changeIcon('icon-user')">User</button>
            <button (click)="changeIcon('icon-settings')">Settings</button>
          </div>
          
          <div class="controls">
            <button (click)="changeColor('#667eea')">Blue</button>
            <button (click)="changeColor('#e74c3c')">Red</button>
            <button (click)="changeColor('#27ae60')">Green</button>
          </div>
        </div>
      </section>

      <!-- Section 10: Comparison with Material Icons -->
      <section class="demo-section">
        <h2>Material vs Icomoon</h2>
        <div class="comparison">
          <div class="comparison-item">
            <h3>Material Icon</h3>
            <app-icon 
              fontIcon="home"
              [size]="32"
              color="#667eea"
            ></app-icon>
          </div>
          
          <div class="comparison-item">
            <h3>Icomoon Icon</h3>
            <app-icon 
              iconType="icomoon"
              icomoonClass="icon-home"
              [size]="32"
              color="#667eea"
            ></app-icon>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      color: #2c3e50;
      margin-bottom: 2rem;
    }

    .demo-section {
      margin-bottom: 3rem;
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    h2 {
      color: #667eea;
      margin-bottom: 1.5rem;
    }

    .icon-grid {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .icon-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .navigation-demo {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .button-demo {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .primary-btn {
      background: #667eea;
      color: white;
    }

    .primary-btn:hover {
      background: #5a6fd8;
      transform: translateY(-2px);
    }

    .secondary-btn {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .secondary-btn:hover {
      background: #f0f2ff;
    }

    .danger-btn {
      background: #e74c3c;
      color: white;
    }

    .danger-btn:hover {
      background: #c0392b;
    }

    .contact-demo {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .dynamic-demo {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .controls {
      display: flex;
      gap: 0.5rem;
    }

    .comparison {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }

    .comparison-item {
      text-align: center;
      padding: 1rem;
      background: white;
      border-radius: 8px;
    }
  `]
})
export class IcomoonDemoComponent {
  // State for interactive examples
  isLiked = false;
  notificationCount = 5;
  lastAction = 'None';
  isHeartBeating = false;
  currentPage = 1;
  totalPages = 10;
  currentIcon = 'icon-home';
  currentColor = '#667eea';

  // Toggle methods
  toggleLike() {
    this.isLiked = !this.isLiked;
    this.lastAction = this.isLiked ? 'Liked' : 'Unliked';
  }

  showNotifications() {
    this.lastAction = `Showing ${this.notificationCount} notifications`;
    this.notificationCount = 0;
  }

  toggleMenu() {
    this.lastAction = 'Menu toggled';
  }

  toggleHeartBeat() {
    this.isHeartBeating = !this.isHeartBeating;
  }

  // Action handlers
  handleEdit() {
    this.lastAction = 'Edit clicked';
    console.log('Edit action');
  }

  handleDelete() {
    this.lastAction = 'Delete clicked';
    console.log('Delete action');
  }

  // Navigation
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.lastAction = `Navigate to page ${this.currentPage}`;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.lastAction = `Navigate to page ${this.currentPage}`;
    }
  }

  // Dynamic changes
  changeIcon(iconClass: string) {
    this.currentIcon = iconClass;
  }

  changeColor(color: string) {
    this.currentColor = color;
  }
}

/**
 * USAGE IN YOUR ROUTES:
 * 
 * Add to app.routes.ts:
 * 
 * {
 *   path: 'icomoon-demo',
 *   component: IcomoonDemoComponent
 * }
 * 
 */

/**
 * SIMPLE EXAMPLE FOR YOUR COMPONENTS:
 */

// Example 1: Basic icon in a component
/*
@Component({
  selector: 'app-my-component',
  template: `
    <app-icon 
      iconType="icomoon"
      icomoonClass="icon-home"
      [size]="24"
      color="#667eea"
    ></app-icon>
  `
})
export class MyComponent {}
*/

// Example 2: Icon with click handler
/*
@Component({
  selector: 'app-my-component',
  template: `
    <app-icon 
      iconType="icomoon"
      icomoonClass="icon-settings"
      [size]="24"
      color="#667eea"
      (iconClick)="openSettings()"
    ></app-icon>
  `
})
export class MyComponent {
  openSettings() {
    console.log('Settings clicked');
  }
}
*/

// Example 3: Dynamic icon
/*
@Component({
  selector: 'app-my-component',
  template: `
    <app-icon 
      iconType="icomoon"
      [icomoonClass]="userIcon"
      [size]="24"
      [color]="userColor"
    ></app-icon>
  `
})
export class MyComponent {
  userIcon = 'icon-user';
  userColor = '#667eea';
}
*/

