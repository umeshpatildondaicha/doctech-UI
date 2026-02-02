import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { AppInputComponent, IconComponent, CoreEventService, AuthService } from '@lk/core';
import { NotificationService } from '../../services/notification.service';

type BreadcrumbItem = { label: string; route?: string; path?: string; icon?: string };

@Component({
  selector: 'app-app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatButtonModule,
    RouterModule,
    AppInputComponent,
    IconComponent,
  ],
  templateUrl: './app-topbar.component.html',
  styleUrl: './app-topbar.component.scss',
})
export class AppTopbarComponent implements OnInit, OnDestroy {

  pageTitle = 'Process explorer';
  breadcrumbItems: BreadcrumbItem[] = [];
  searchText = '';
  userInitials = 'UV';

  private router = inject(Router);
  private eventService = inject(CoreEventService);
  private authService = inject(AuthService);
  protected notificationService = inject(NotificationService);
  private breadcrumbUnsubscribe?: () => void;

  ngOnInit() {
    this.updateTopbarContent();
    this.router.events.subscribe(() => this.updateTopbarContent());
    this.breadcrumbUnsubscribe = this.eventService.onBreadcrumbChange((breadcrumb) => {
      if (breadcrumb && Array.isArray(breadcrumb) && breadcrumb.length > 0) {
        this.breadcrumbItems = breadcrumb.map((item) => ({
          label: item.label,
          route: item.route,
          path: item.path,
          icon: item.icon,
        }));
      } else {
        this.breadcrumbItems = [];
      }
      this.updateTopbarContent();
    });
    const user = this.authService.getStoredUser();
    const name = user?.fullName || (user as { name?: string })?.name;
    if (name) {
      const parts = String(name).trim().split(/\s+/);
      this.userInitials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (name[0] || 'U').toUpperCase();
    }
  }

  ngOnDestroy() {
    this.breadcrumbUnsubscribe?.();
  }

  private updateTopbarContent() {
    const url = this.router.url.split('?')[0];
    const isDashboard = url === '/dashboard' || url === '/admin-dashboard';
    if (isDashboard) {
      this.pageTitle = url === '/admin-dashboard' ? 'Admin Dashboard' : 'Doctor Dashboard';
    } else if (this.breadcrumbItems.length === 0) {
      this.pageTitle = this.getPageTitleFromRoute(url);
    }
  }

  private getPageTitleFromRoute(url: string): string {
    const segment = url.split('/').filter(Boolean).pop() || '';
    return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Process explorer';
  }

  onBreadcrumbClick(item: BreadcrumbItem) {
    const path = item.route || item.path;
    if (path) {
      this.router.navigate([path]);
    }
  }

  onNotificationClick(event: Event) {
    const target = event.currentTarget as HTMLElement;
    const notifications = this.notificationService.getNotifications();
    this.notificationService.openNotificationPanel(notifications, target);
  }

  onProfileClick() {
    this.router.navigate(['/profile']);
  }

  onSettingsClick() {
    this.router.navigate(['/settings']);
  }

  onLogoutClick() {
    this.authService.logout();
  }

  onProfileMenuOpened() {
    requestAnimationFrame(() => {
      const box = document.querySelector(
        '.cdk-overlay-connected-position-bounding-box:has(.profile-menu), .cdk-overlay-connected-position-bounding-box:has(.profile-menu-panel)'
      ) as HTMLElement;
      if (box) {
        box.style.setProperty('top', '3.6em', 'important');
        box.style.setProperty('right', '10px', 'important');
        box.style.setProperty('left', 'auto', 'important');
        box.style.setProperty('width', 'auto', 'important');
        box.style.setProperty('height', 'auto', 'important');
      }
    });
  }
}
