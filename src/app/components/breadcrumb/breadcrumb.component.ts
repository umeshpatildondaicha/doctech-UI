import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbItem } from '@lk/core';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent implements OnInit {
  @Input() customBreadcrumbs: BreadcrumbItem[] = [];
  @Input() showHome: boolean = true;
  @Input() maxItems: number = 5;
  @Output() breadcrumbClick = new EventEmitter<BreadcrumbItem>();

  breadcrumbs: BreadcrumbItem[] = [];
  currentPath: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.generateBreadcrumbs();
      });

    this.generateBreadcrumbs();
  }

  private generateBreadcrumbs(): void {
    if (this.customBreadcrumbs.length > 0) {
      this.breadcrumbs = [...this.customBreadcrumbs];
      return;
    }

    const breadcrumbs: BreadcrumbItem[] = [];
    
    if (this.showHome) {
      breadcrumbs.push({
        label: 'Home',
        path: '/',
        icon: 'home',
        isActive: false
      });
    }

    // Get current route segments
    let currentRoute = this.route;
    let url = '';

    while (currentRoute.children.length > 0) {
      const childrenRoutes = currentRoute.children;
      let breadcrumbRoute = null;

      for (const route of childrenRoutes) {
        if (route.outlet === 'primary') {
          const routeSnapshot = route.snapshot;
          url += '/' + routeSnapshot.url.map(segment => segment.path).join('/');
          
          const label = this.getBreadcrumbLabel(routeSnapshot);
          if (label) {
            breadcrumbs.push({
              label: label,
              path: url,
              icon: this.getBreadcrumbIcon(routeSnapshot),
              isActive: false
            });
          }
          breadcrumbRoute = route;
          break;
        }
      }

      if (!breadcrumbRoute) {
        break;
      }

      currentRoute = breadcrumbRoute;
    }

    // Mark the last item as active
    if (breadcrumbs.length > 0) {
      breadcrumbs[breadcrumbs.length - 1].isActive = true;
    }

    // Limit the number of breadcrumbs
    if (breadcrumbs.length > this.maxItems) {
      const start = breadcrumbs.length - this.maxItems + 1;
      breadcrumbs.splice(1, start, {
        label: '...',
        icon: 'more_horiz',
        isActive: false
      });
    }

    this.breadcrumbs = breadcrumbs;
    this.currentPath = url;
  }

  private getBreadcrumbLabel(routeSnapshot: any): string {
    // Try to get label from route data
    if (routeSnapshot.data && routeSnapshot.data['breadcrumb']) {
      return routeSnapshot.data['breadcrumb'];
    }

    // Try to get label from route params
    if (routeSnapshot.params && routeSnapshot.params['id']) {
      return this.getParamLabel(routeSnapshot.params['id']);
    }

    // Default label from URL segment
    const urlSegment = routeSnapshot.url[routeSnapshot.url.length - 1];
    if (urlSegment) {
      return this.formatLabel(urlSegment.path);
    }

    return '';
  }

  private getBreadcrumbIcon(routeSnapshot: any): string {
    // Try to get icon from route data
    if (routeSnapshot.data && routeSnapshot.data['breadcrumbIcon']) {
      return routeSnapshot.data['breadcrumbIcon'];
    }

    // Default icons based on route
    const path = routeSnapshot.url.map((segment: any) => segment.path).join('/');
    
    const iconMap: { [key: string]: string } = {
      'admin': 'admin_panel_settings',
      'services': 'medical_services',
      'doctors': 'person',
      'patients': 'people',
      'appointments': 'event',
      'dashboard': 'dashboard',
      'settings': 'settings',
      'rooms': 'meeting_room',
      'roles': 'security',
      'plans': 'card_membership',
      'schemes': 'local_offer',
      'billing': 'receipt',
      'diet': 'restaurant',
      'exercise': 'fitness_center',
      'help': 'help',
      'profile': 'account_circle',
      'login': 'login'
    };

    return iconMap[path] || 'chevron_right';
  }

  private getParamLabel(param: string): string {
    // Try to get meaningful label from parameter
    if (param === 'new') {
      return 'New';
    }
    
    // For IDs, you might want to fetch the actual name from a service
    // For now, we'll show a generic label
    return 'Details';
  }

  private formatLabel(label: string): string {
    return label
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  onBreadcrumbClick(item: BreadcrumbItem, index: number): void {
    if (item.path && !item.isActive) {
      this.router.navigate([item.path]);
    }
    
    this.breadcrumbClick.emit(item);
  }

  goBack(): void {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // If no history, navigate to the previous breadcrumb item or home
      const previousItem = this.breadcrumbs.find(item => !item.isActive && item.path);
      if (previousItem && previousItem.path) {
        this.router.navigate([previousItem.path]);
      } else {
        this.router.navigate(['/']);
      }
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  trackByFn(index: number, item: BreadcrumbItem): string {
    return item.label + (item.path || '');
  }
}
