import { Injectable, Injector, signal, computed } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  NotificationComponent,
  type NotificationItem,
} from '@lk/template';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private overlayRef: ReturnType<Overlay['create']> | null = null;
  private _notifications = signal<NotificationItem[]>(this.getSampleNotifications());

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = computed(
    () => this._notifications().filter((n) => !n.isRead).length
  );
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  constructor(
    private overlay: Overlay,
    private injector: Injector
  ) {}

  openNotificationPanel(
    notifications: NotificationItem[],
    targetElement: HTMLElement
  ): void {
    if (this.overlayRef) {
      this.closeNotificationPanel();
    }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(targetElement)
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetY: 8,
        },
        {
          originX: 'end',
          originY: 'top',
          overlayX: 'end',
          overlayY: 'bottom',
          offsetY: -8,
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'notification-backdrop',
    });

    const portal = new ComponentPortal(
      NotificationComponent,
      null,
      this.injector
    );
    const componentRef = this.overlayRef.attach(portal);
    componentRef.instance.notifications = notifications;

    componentRef.instance.closeNotification.subscribe(() => {
      this.closeNotificationPanel();
    });

    componentRef.instance.markAsRead.subscribe((notificationId: string) => {
      const list = this._notifications();
      const notification = list.find((n) => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
        this._notifications.set([...list]);
      }
    });

    componentRef.instance.markAllAsRead.subscribe(() => {
      const list = this._notifications();
      list.forEach((n) => (n.isRead = true));
      this._notifications.set([...list]);
    });

    this.overlayRef.backdropClick().subscribe(() => {
      this.closeNotificationPanel();
    });
  }

  closeNotificationPanel(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  getNotifications(): NotificationItem[] {
    return this._notifications();
  }

  private getSampleNotifications(): NotificationItem[] {
    return [
      {
        id: '1',
        title: 'New Patient Appointment',
        message:
          'Patient John Doe has scheduled an appointment for tomorrow at 10:00 AM',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        isRead: false,
        type: 'info',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      },
      {
        id: '2',
        title: 'Lab Results Ready',
        message:
          'Blood test results for patient Sarah Smith are now available',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isRead: false,
        type: 'success',
      },
      {
        id: '3',
        title: 'System Maintenance',
        message:
          'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isRead: true,
        type: 'warning',
      },
      {
        id: '4',
        title: 'Emergency Alert',
        message: 'Patient in Room 302 requires immediate attention',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        isRead: false,
        type: 'error',
      },
    ];
  }
}
