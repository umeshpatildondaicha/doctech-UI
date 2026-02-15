import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SidebarMenuItem } from '../interfaces/sidebarmenu.interface';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menuSubject = new BehaviorSubject<SidebarMenuItem[]>([]);

  // Doctor menu items
  private doctorMenu: SidebarMenuItem[] = [
    { 
      label: 'Dashboard', 
      icon: 'dashboard', 
      route: '/dashboard', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Appointments', 
      icon: 'event', 
      route: '/appointment', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Schedule', 
      icon: 'schedule', 
      route: '/schedule', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Patients', 
      icon: 'groups', 
      route: '/patient', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Chat', 
      icon: 'chat', 
      route: '/chat', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Blogs', 
      icon: 'rss_feed', 
      route: '/blogs', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Exercises', 
      icon: 'fitness_center', 
      route: '/exercises', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Diet Plans', 
      icon: 'track_changes', 
      route: '/diet', 
      section: 'main',
      userTypes: ['doctor']
    },
    { 
      label: 'Billing', 
      icon: 'credit_card', 
      route: '/billing', 
      section: 'main',
      userTypes: ['doctor']
    },
    {
      label: 'Base Configuration',
      icon: 'settings',
      route: '/admin/base-configuration',
      section: 'main',
      userTypes: ['doctor']
    },
    {
      label: 'Lists Designer',
      icon: 'grid_on',
      route: '/admin/lists-designer',
      section: 'main',
      userTypes: ['doctor']
    }
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
      label: 'Doctors Management', 
      icon: 'local_hospital', 
      route: '/admin/doctors', 
      section: 'management',
      userTypes: ['admin']
    },
    { 
      label: 'Doctor Permissions', 
      icon: 'tune', 
      route: '/admin/doctor-permissions', 
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
      label: 'Base Configuration',
      icon: 'settings',
      route: '/admin/base-configuration',
      section: 'administration',
      userTypes: ['admin']
    },
    {
      label: 'Lists Designer',
      icon: 'grid_on',
      route: '/admin/lists-designer',
      section: 'administration',
      userTypes: ['admin']
    }
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