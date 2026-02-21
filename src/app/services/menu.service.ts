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
    { 
      label: 'Dashboard', 
      icon: 'dashboard', 
      iconSrc: 'assets/icons/dashboard.svg',
      route: '/dashboard', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Appointments', 
      icon: 'event', 
      iconSrc: 'assets/icons/appointment.svg',
      route: '/appointment', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Schedule', 
      icon: 'schedule', 
      iconSrc: 'assets/icons/schedule.svg',
      route: '/schedule', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Patients', 
      icon: 'groups', 
      iconSrc: 'assets/icons/patients.svg',
      route: '/patient', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Chat', 
      icon: 'chat', 
      iconSrc: 'assets/icons/chat.svg',
      route: '/chat', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Blogs', 
      icon: 'rss_feed', 
      iconSrc: 'assets/icons/blogs.svg',
      route: '/blogs', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Exercises', 
      icon: 'fitness_center', 
      iconSrc: 'assets/icons/exercise.svg',
      route: '/exercises', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Diet Plans', 
      icon: 'track_changes', 
      iconSrc: 'assets/icons/diet.svg',
      route: '/diet', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Billing', 
      icon: 'credit_card', 
      iconSrc: 'assets/icons/bills.svg',
      route: '/billing', 
      section: 'main',
      userTypes: ['doctor']
    },
    {
      label: 'Base Configuration',
      icon: 'settings',
      iconSrc: 'assets/icons/settings.svg',
      route: '/admin/base-configuration',
      section: 'main',
      userTypes: ['doctor']
    },
  ];

  // Admin menu items
  private adminMenu: SidebarMenuItem[] = [
    { 
      label: 'Dashboard', 
      icon: 'dashboard', 
      route: '/admin-dashboard', 
      section: 'main',
      userTypes: ['admin']
    },
    {
      label: 'Billing',
      icon: 'credit_card',
      route: '/admin/billing',
      section: 'main',
      userTypes: ['admin']
    },
    {
      label: 'Doctors Management',
      icon: 'local_hospital',
      route: '/admin/doctors',
      section: 'management',
      userTypes: ['admin']
    },
    { 
      label: 'Role Management', 
      icon: 'security', 
      route: '/admin/roles', 
      section: 'administration',
      userTypes: ['admin']
    },
    { 
      label: 'Plans & Offers', 
      icon: 'card_giftcard', 
      route: '/admin/plans', 
      section: 'administration',
      userTypes: ['admin']
    },
    {
      label: 'Hospital Flow',
      icon: 'apartment',
      route: '/admin/hospital',
      section: 'administration',
      userTypes: ['admin']
    },
    {
      label: 'Base Configuration',
      icon: 'settings',
      route: '/admin/base-configuration',
      section: 'administration',
      userTypes: ['admin']
    },
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