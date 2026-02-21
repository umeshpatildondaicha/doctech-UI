import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  Inject,
  PLATFORM_ID,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent, MenuService, AuthService } from '@lk/core';
import { Subscription } from 'rxjs';
import type { SidebarMenuItem } from '../../interfaces/sidebarmenu.interface';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.scss',
})
export class AppSidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  @Input() appTitle = 'Workflow orchestrator';
  @Output() toggle = new EventEmitter<void>();

  iconSizeOnCollapsed = 26;
  iconSizeOnExpanded = 28;
  menuList: SidebarMenuItem[] = [];
  private subscriptions = new Subscription();
  private hoverCloseTimeoutId: ReturnType<typeof setTimeout> | null = null;

  isMobile = false;
  isTablet = false;
  screenWidth = 0;
  hoverOpen = false;
  hoverClosing = false;

  constructor(
    private router: Router,
    private menuService: MenuService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.subscriptions.add(
      this.menuService.getMenu().subscribe((menu) => {
        this.menuList = menu;
      })
    );
    this.subscriptions.add(
      this.authService.currentUser$.subscribe((user) => {
        if (user) {
          let menuUserType: 'doctor' | 'admin' = 'doctor';
          if (user.userType === 'HOSPITAL') {
            menuUserType = 'admin';
          } else if (user.userType === 'DOCTOR') {
            menuUserType = 'doctor';
          }
          this.menuService.updateMenu(menuUserType);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.clearHoverCloseTimer();
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  getMenuItemsBySection(section: string): SidebarMenuItem[] {
    return this.menuList.filter((item) => item.section === section);
  }

  getSectionTitle(section: string): string {
    const sectionTitles: Record<string, string> = {
      main: 'Main',
      management: 'Management',
      services: 'Services',
      administration: 'Administration',
      tools: 'Tools',
    };
    return sectionTitles[section] ?? section;
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.screenWidth = 1024;
      this.isMobile = false;
      this.isTablet = false;
      return;
    }
    this.screenWidth = window.innerWidth;
    this.isMobile = this.screenWidth <= 768;
    this.isTablet = this.screenWidth > 768 && this.screenWidth <= 1024;
    if (this.isMobile || this.isTablet) {
      if (!this.collapsed) {
        this.toggle.emit();
      }
    }
  }

  getSidebarClasses(): string {
    let classes = 'sidebar';
    if (this.collapsed) classes += ' collapsed';
    if (this.isMobile) classes += ' mobile-overlay';
    else if (this.isTablet) classes += ' tablet-overlay';
    else classes += ' desktop-sidebar';
    return classes;
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
    if (this.isMobile && !this.collapsed) {
      this.toggle.emit();
    }
  }

  onBackdropClick(): void {
    if ((this.isMobile || this.isTablet) && !this.collapsed) {
      this.toggle.emit();
    }
  }

  onMenuAreaMouseEnter(): void {
    if (!this.shouldEnableHoverExpansion()) return;
    this.clearHoverCloseTimer();
    this.hoverOpen = true;
  }

  onMenuAreaMouseLeave(): void {
    if (!this.shouldEnableHoverExpansion()) return;
    this.scheduleHoverClose();
  }

  private shouldEnableHoverExpansion(): boolean {
    return this.collapsed && !this.isMobile && !this.isTablet;
  }

  private scheduleHoverClose(): void {
    this.clearHoverCloseTimer();
    this.hoverClosing = true;
    const closeDuration = 300;
    this.hoverCloseTimeoutId = globalThis.setTimeout(() => {
      this.hoverOpen = false;
      this.hoverClosing = false;
      this.hoverCloseTimeoutId = null;
    }, closeDuration);
  }

  private clearHoverCloseTimer(): void {
    if (this.hoverCloseTimeoutId != null) {
      globalThis.clearTimeout(this.hoverCloseTimeoutId);
      this.hoverCloseTimeoutId = null;
    }
    this.hoverClosing = false;
  }

  getIconSize(isExpandedView: boolean): number {
    return isExpandedView ? this.iconSizeOnExpanded : this.iconSizeOnCollapsed;
  }
}
