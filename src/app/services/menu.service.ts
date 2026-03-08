import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SidebarMenuItem } from '../interfaces/sidebarmenu.interface';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menuSubject = new BehaviorSubject<SidebarMenuItem[]>([]);

  // Doctor menu items (custom SVG icons for left listing)
  private doctorMenu: SidebarMenuItem[] = [
    { label: 'Dashboard', labelKey: 'MENU_DASHBOARD', icon: 'dashboard', iconSrc: 'assets/icons/dashboard.svg', route: '/dashboard', section: 'main', userTypes: ['doctor'] },
    { label: 'Appointments', labelKey: 'MENU_APPOINTMENTS', icon: 'event', iconSrc: 'assets/icons/appointment.svg', route: '/appointment', section: 'main', userTypes: ['doctor'] },
    { label: 'Schedule', labelKey: 'MENU_SCHEDULE', icon: 'schedule', iconSrc: 'assets/icons/schedule.svg', route: '/schedule', section: 'main', userTypes: ['doctor'] },
    { label: 'Patients', labelKey: 'MENU_PATIENTS', icon: 'groups', iconSrc: 'assets/icons/patients.svg', route: '/patient', section: 'main', userTypes: ['doctor'] },
    { label: 'Chat', labelKey: 'MENU_CHAT', icon: 'chat', iconSrc: 'assets/icons/chat.svg', route: '/chat', section: 'main', userTypes: ['doctor'] },
    { label: 'Blogs', labelKey: 'MENU_BLOGS', icon: 'rss_feed', iconSrc: 'assets/icons/blogs.svg', route: '/blogs', section: 'main', userTypes: ['doctor'] },
    { label: 'Exercises', labelKey: 'MENU_EXERCISES', icon: 'fitness_center', iconSrc: 'assets/icons/exercise.svg', route: '/exercises', section: 'main', userTypes: ['doctor'] },
    { label: 'Diet Plans', labelKey: 'MENU_DIET_PLANS', icon: 'track_changes', iconSrc: 'assets/icons/diet.svg', route: '/diet', section: 'main', userTypes: ['doctor'] },
    { label: 'Billing', labelKey: 'MENU_BILLING', icon: 'credit_card', iconSrc: 'assets/icons/bills.svg', route: '/billing', section: 'main', userTypes: ['doctor'] },
    { label: 'Base Configuration', labelKey: 'MENU_BASE_CONFIGURATION', icon: 'settings', iconSrc: 'assets/icons/settings.svg', route: '/admin/base-configuration', section: 'main', userTypes: ['doctor'] },
    { label: 'Multilingual', labelKey: 'MENU_MULTILINGUAL', icon: 'translate', iconSrc: 'assets/icons/settings.svg', route: '/admin/multilingual', section: 'main', userTypes: ['doctor'] },
  ];

  // Admin menu items
  private adminMenu: SidebarMenuItem[] = [
    { label: 'Dashboard', labelKey: 'MENU_DASHBOARD', icon: 'dashboard', route: '/admin-dashboard', section: 'main', userTypes: ['admin'] },
    { label: 'Billing', labelKey: 'MENU_BILLING', icon: 'credit_card', route: '/admin/billing', section: 'main', userTypes: ['admin'] },
    { label: 'Doctors Management', labelKey: 'MENU_DOCTORS_MANAGEMENT', icon: 'local_hospital', route: '/admin/doctors', section: 'management', userTypes: ['admin'] },
    { label: 'Staff Management', labelKey: 'MENU_STAFF_MANAGEMENT', icon: 'groups', route: '/admin/staff', section: 'management', userTypes: ['admin'] },
    { label: 'Role Management', labelKey: 'MENU_ROLE_MANAGEMENT', icon: 'security', route: '/admin/roles', section: 'administration', userTypes: ['admin'] },
    { label: 'Plans', labelKey: 'MENU_PLANS', icon: 'card_giftcard', route: '/admin/plans', section: 'administration', userTypes: ['admin'] },
    { label: 'Hospital Flow', labelKey: 'MENU_HOSPITAL_FLOW', icon: 'apartment', route: '/admin/hospital', section: 'administration', userTypes: ['admin'] },
    { label: 'Base Configuration', labelKey: 'MENU_BASE_CONFIGURATION', icon: 'settings', route: '/admin/base-configuration', section: 'administration', userTypes: ['admin'] },
    { label: 'Multilingual', labelKey: 'MENU_MULTILINGUAL', icon: 'translate', route: '/admin/multilingual', section: 'administration', userTypes: ['admin'] },
  ];

  constructor() {}

  getMenuForUserType(userType: 'doctor' | 'admin'): SidebarMenuItem[] {
    if (userType === 'doctor') {
      return this.doctorMenu;
    } else if (userType === 'admin') {
      return this.adminMenu;
    }
    return [];
  }

  updateMenu(userType: 'doctor' | 'admin'): void {
    const menu = this.getMenuForUserType(userType);
    this.menuSubject.next(menu);
  }

  getMenu(): Observable<SidebarMenuItem[]> {
    return this.menuSubject.asObservable();
  }

  getCurrentMenu(): SidebarMenuItem[] {
    return this.menuSubject.value;
  }
} 