import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AppButtonComponent, AppInputComponent, AppSelectboxComponent, IconComponent, CheckboxComponent, DialogboxService, PageComponent, BreadcrumbItem, TabComponent, TabsComponent } from '@lk/core';
import { 
  AdminPageHeaderComponent, 
  AdminStatsCardComponent, 
  AdminTabsComponent,
  type HeaderAction,
  type StatCard,
  type TabItem
} from '../../../components';

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: {
    [key: string]: Permission;
    patientRecords: Permission;
    appointmentBooking: Permission;
    billing: Permission;
    labReports: Permission;
    inventory: Permission;
  };
  color: string;
  icon: string;
}

interface Permission {
  read: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
}

interface Staff {
  id: number;
  fullName: string;
  employeeId: string;
  role: string;
  profilePicture: string;
  email: string;
  phone: string;
  specialization?: string;
  shift: {
    start: string;
    end: string;
    days: string[];
  };
  assignedDoctors: number[];
  attendance: {
    status: 'on-duty' | 'off-duty' | 'late' | 'absent';
    inTime?: string;
    outTime?: string;
    totalHours?: number;
    date: string;
  };
  attendanceHistory: any[];
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  department: string;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppButtonComponent,
    AppInputComponent,
    AppSelectboxComponent,
    IconComponent,
    TabComponent,
    TabsComponent,
    CheckboxComponent,
    AdminPageHeaderComponent,
    AdminStatsCardComponent,
    AdminTabsComponent,
    PageComponent
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss'
})
export class RolesComponent implements OnInit {
  // State Management
  activeTab: 'overview' | 'permissions' | 'staff' | 'assignments' | 'attendance' = 'overview';
  selectedTabIndex = 0;
  selectedRole: Role | null = null;
  selectedStaff: Staff | null = null;
  showStaffDetails = false;
  searchTerm = '';
  selectedRoleFilter = '';
  selectedStatusFilter = '';
  attendanceSearchTerm = '';
  selectedDate = new Date().toISOString().split('T')[0];
  bulkSelectedStaff: Set<number> = new Set();
  showBulkActions = false;

  breadcrumb: BreadcrumbItem[] = [
    { label: 'Roles & Staff', route: '/admin/roles', icon: 'badge', isActive: true }
  ];

  // Page header configuration
  headerActions: HeaderAction[] = [
    {
      text: 'Add Staff',
      color: 'primary',
      fontIcon: 'person_add',
      action: 'add-staff'
    },
    {
      text: 'Reports',
      color: 'accent',
      fontIcon: 'analytics',
      action: 'reports'
    }
  ];

  // Tab configuration
  tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'dashboard'
    },
    {
      id: 'permissions',
      label: 'Role Permissions',
      icon: 'security'
    },
    {
      id: 'staff',
      label: 'Staff Management',
      icon: 'groups'
    },
    {
      id: 'assignments',
      label: 'Assignments',
      icon: 'assignment_ind'
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: 'schedule'
    }
  ];

  // Stats configuration
  statsCards: StatCard[] = [];

  // Forms
  staffForm: FormGroup;

  // Data
  roles: Role[] = [
    {
      id: 1,
      name: 'Doctor',
      description: 'Medical practitioners with full patient access',
      permissions: {
        patientRecords: { read: true, write: true, update: true, delete: false },
        appointmentBooking: { read: true, write: true, update: true, delete: true },
        billing: { read: true, write: false, update: false, delete: false },
        labReports: { read: true, write: true, update: true, delete: false },
        inventory: { read: true, write: false, update: false, delete: false }
      },
      color: 'var(--role-doctor-color)',
      icon: 'local_hospital'
    },
    {
      id: 2,
      name: 'Nurse',
      description: 'Healthcare support staff with patient care access',
      permissions: {
        patientRecords: { read: true, write: true, update: true, delete: false },
        appointmentBooking: { read: true, write: true, update: false, delete: false },
        billing: { read: false, write: false, update: false, delete: false },
        labReports: { read: true, write: false, update: false, delete: false },
        inventory: { read: true, write: true, update: true, delete: false }
      },
      color: 'var(--role-nurse-color)',
      icon: 'healing'
    },
    {
      id: 3,
      name: 'Receptionist',
      description: 'Front desk staff managing appointments and billing',
      permissions: {
        patientRecords: { read: true, write: true, update: false, delete: false },
        appointmentBooking: { read: true, write: true, update: true, delete: false },
        billing: { read: true, write: true, update: true, delete: false },
        labReports: { read: false, write: false, update: false, delete: false },
        inventory: { read: false, write: false, update: false, delete: false }
      },
      color: 'var(--role-receptionist-color)',
      icon: 'person'
    },
    {
      id: 4,
      name: 'Lab Technician',
      description: 'Laboratory staff managing test results',
      permissions: {
        patientRecords: { read: true, write: false, update: false, delete: false },
        appointmentBooking: { read: false, write: false, update: false, delete: false },
        billing: { read: false, write: false, update: false, delete: false },
        labReports: { read: true, write: true, update: true, delete: false },
        inventory: { read: true, write: true, update: true, delete: false }
      },
      color: 'var(--role-lab-technician-color)',
      icon: 'science'
    },
    {
      id: 5,
      name: 'Pharmacist',
      description: 'Pharmacy staff managing medications and inventory',
      permissions: {
        patientRecords: { read: true, write: false, update: false, delete: false },
        appointmentBooking: { read: false, write: false, update: false, delete: false },
        billing: { read: true, write: true, update: false, delete: false },
        labReports: { read: false, write: false, update: false, delete: false },
        inventory: { read: true, write: true, update: true, delete: true }
      },
      color: 'var(--role-pharmacist-color)',
      icon: 'medication'
    },
    {
      id: 6,
      name: 'Admin',
      description: 'System administrators with full access',
      permissions: {
        patientRecords: { read: true, write: true, update: true, delete: true },
        appointmentBooking: { read: true, write: true, update: true, delete: true },
        billing: { read: true, write: true, update: true, delete: true },
        labReports: { read: true, write: true, update: true, delete: true },
        inventory: { read: true, write: true, update: true, delete: true }
      },
      color: 'var(--role-admin-color)',
      icon: 'admin_panel_settings'
    }
  ];

  staff: Staff[] = [
    {
      id: 1,
      fullName: 'Dr. Sarah Johnson',
      employeeId: 'DOC001',
      role: 'Doctor',
      profilePicture: 'assets/profiles/doctor1.jpg',
      email: 'sarah.johnson@hospital.com',
      phone: '+1-555-0101',
      specialization: 'Cardiology',
      shift: { start: '08:00', end: '16:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
      assignedDoctors: [],
      attendance: { status: 'on-duty', inTime: '07:55', outTime: '', totalHours: 0, date: '2024-01-15' },
      attendanceHistory: []
    },
    {
      id: 2,
      fullName: 'Emily Davis',
      employeeId: 'NUR001',
      role: 'Nurse',
      profilePicture: 'assets/profiles/nurse1.jpg',
      email: 'emily.davis@hospital.com',
      phone: '+1-555-0102',
      specialization: 'ICU',
      shift: { start: '06:00', end: '18:00', days: ['Monday', 'Wednesday', 'Friday'] },
      assignedDoctors: [1],
      attendance: { status: 'on-duty', inTime: '05:58', outTime: '', totalHours: 0, date: '2024-01-15' },
      attendanceHistory: []
    },
    {
      id: 3,
      fullName: 'Michael Chen',
      employeeId: 'REC001',
      role: 'Receptionist',
      profilePicture: 'assets/profiles/receptionist1.jpg',
      email: 'michael.chen@hospital.com',
      phone: '+1-555-0103',
      shift: { start: '07:00', end: '15:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
      assignedDoctors: [],
      attendance: { status: 'late', inTime: '07:15', outTime: '', totalHours: 0, date: '2024-01-15' },
      attendanceHistory: []
    },
    {
      id: 4,
      fullName: 'Lisa Rodriguez',
      employeeId: 'LAB001',
      role: 'Lab Technician',
      profilePicture: 'assets/profiles/lab1.jpg',
      email: 'lisa.rodriguez@hospital.com',
      phone: '+1-555-0104',
      specialization: 'Pathology',
      shift: { start: '08:00', end: '16:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
      assignedDoctors: [],
      attendance: { status: 'off-duty', inTime: '', outTime: '', totalHours: 0, date: '2024-01-15' },
      attendanceHistory: []
    }
  ];

  doctors: Doctor[] = [
    { id: 1, name: 'Dr. Sarah Johnson', specialization: 'Cardiology', department: 'Cardiology' },
    { id: 2, name: 'Dr. Robert Smith', specialization: 'Neurology', department: 'Neurology' },
    { id: 3, name: 'Dr. Amanda Wilson', specialization: 'Pediatrics', department: 'Pediatrics' },
    { id: 4, name: 'Dr. James Brown', specialization: 'Orthopedics', department: 'Orthopedics' }
  ];

  // Options
  moduleOptions = [
    { key: 'patientRecords', label: 'Patient Records', icon: 'folder_shared' },
    { key: 'appointmentBooking', label: 'Appointment Booking', icon: 'event' },
    { key: 'billing', label: 'Billing', icon: 'receipt' },
    { key: 'labReports', label: 'Lab Reports', icon: 'biotech' },
    { key: 'inventory', label: 'Inventory', icon: 'inventory' }
  ];

  permissionLevels = ['read', 'write', 'update', 'delete'];

  // Filter Options
  get statusFilterOptions() {
    return [
      { label: 'All Status', value: '' },
      { label: 'On Duty', value: 'on-duty' },
      { label: 'Off Duty', value: 'off-duty' },
      { label: 'Late', value: 'late' },
      { label: 'Absent', value: 'absent' }
    ];
  }

  get attendanceStatusOptions() {
    return [
      { label: 'All', value: '' },
      { label: 'Present', value: 'on-duty' },
      { label: 'Late', value: 'late' },
      { label: 'Absent', value: 'absent' }
    ];
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogService: DialogboxService
  ) {
    this.staffForm = this.createStaffForm();
  }

  ngOnInit() {
    this.generateAttendanceHistory();
    this.updateStatsCards();
    // Select the first role by default for a better user experience
    if (this.roles.length > 0) {
      this.selectedRole = this.roles[0];
    }
  }



  createStaffForm(): FormGroup {
    return this.fb.group({
      fullName: ['', [Validators.required]],
      employeeId: ['', [Validators.required]],
      role: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      specialization: [''],
      assignedDoctors: [[]]
    });
  }

  // Tab Management
  setActiveTab(tab: 'overview' | 'permissions' | 'staff' | 'assignments' | 'attendance') {
    console.log('Setting active tab to:', tab);
    this.activeTab = tab;
    if (tab === 'permissions' && !this.selectedRole && this.roles.length > 0) {
      this.selectedRole = this.roles[0];
    }
  }

  // Role Management Methods
  selectRole(role: Role) {
    this.selectedRole = role;
  }

  // Staff Management Methods
  selectStaff(staff: Staff) {
    this.selectedStaff = staff;
    this.showStaffDetails = true;
  }

  closeStaffDetails() {
    this.showStaffDetails = false;
    this.selectedStaff = null;
    document.body.style.overflow = 'auto';
  }

  assignStaffToDoctor(staffId: number, doctorId: number) {
    const staff = this.staff.find(s => s.id === staffId);
    if (staff && !staff.assignedDoctors.includes(doctorId)) {
      staff.assignedDoctors.push(doctorId);
    }
  }

  removeStaffFromDoctor(staffId: number, doctorId: number) {
    const staff = this.staff.find(s => s.id === staffId);
    if (staff) {
      staff.assignedDoctors = staff.assignedDoctors.filter(id => id !== doctorId);
    }
  }

  // Bulk Actions
  toggleStaffSelection(staffId: number) {
    if (this.bulkSelectedStaff.has(staffId)) {
      this.bulkSelectedStaff.delete(staffId);
    } else {
      this.bulkSelectedStaff.add(staffId);
    }
    this.showBulkActions = this.bulkSelectedStaff.size > 0;
  }

  selectAllStaff() {
    this.filteredStaff.forEach(staff => this.bulkSelectedStaff.add(staff.id));
    this.showBulkActions = true;
  }

  clearSelection() {
    this.bulkSelectedStaff.clear();
    this.showBulkActions = false;
  }

  bulkAssignToDoctor(doctorId: number) {
    this.bulkSelectedStaff.forEach(staffId => {
      this.assignStaffToDoctor(staffId, doctorId);
    });
    this.clearSelection();
  }

  // Computed Properties
  get filteredStaff(): Staff[] {
    return this.staff.filter(staff => {
      const matchesSearch = staff.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           staff.employeeId.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRole = !this.selectedRoleFilter || staff.role === this.selectedRoleFilter;
      return matchesSearch && matchesRole;
    });
  }

  get unassignedStaff(): Staff[] {
    return this.staff.filter(staff => staff.assignedDoctors.length === 0);
  }

  get roleOptions() {
    return this.roles.map(role => ({ label: role.name, value: role.name }));
  }

  get doctorOptions() {
    return this.doctors.map(doctor => ({ label: doctor.name, value: doctor.id }));
  }

  get allRoleOptions() {
    return [{ label: 'All Roles', value: '' }, ...this.roleOptions];
  }

  getStaffCountForDoctor(doctorId: number): number {
    return this.staff.filter(s => s.assignedDoctors.includes(doctorId)).length;
  }

  getStaffForDoctor(doctorId: number): Staff[] {
    return this.staff.filter(s => s.assignedDoctors.includes(doctorId));
  }

  getStaffCountForRole(roleName: string): number {
    return this.staff.filter(s => s.role === roleName).length;
  }

  // Permission handling methods
  getPermissionValue(moduleKey: string, permissionType: string): boolean {
    if (!this.selectedRole) return false;
    const permission = this.selectedRole.permissions[moduleKey];
    return permission ? (permission as any)[permissionType] : false;
  }

  updatePermission(moduleKey: string, permissionType: string, event: Event): void {
    if (!this.selectedRole) return;
    const target = event.target as HTMLInputElement;
    const permission = this.selectedRole.permissions[moduleKey];
    if (permission) {
      (permission as any)[permissionType] = target.checked;
    }
  }

  // Utility Methods
  getRoleByName(roleName: string): Role | undefined {
    return this.roles.find(role => role.name === roleName);
  }

  getDoctorById(doctorId: number): Doctor | undefined {
    return this.doctors.find(doctor => doctor.id === doctorId);
  }

  getAttendanceStatusColor(status: string): string {
    switch (status) {
      case 'on-duty': return 'var(--attendance-on-duty-color)';
      case 'off-duty': return 'var(--attendance-off-duty-color)';
      case 'late': return 'var(--attendance-late-color)';
      case 'absent': return 'var(--attendance-absent-color)';
      default: return 'var(--attendance-off-duty-color)';
    }
  }

  generateAttendanceHistory() {
    // Generate mock attendance history for demonstration
    this.staff.forEach(staff => {
      staff.attendanceHistory = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        inTime: '08:00',
        outTime: '16:00',
        totalHours: 8,
        status: i === 0 ? staff.attendance.status : 'on-duty'
      }));
    });
  }

  // Navigation Methods
  navigateToStaffForm() {
    // Navigate to staff form
    console.log('Navigate to staff form');
  }

  navigateToReports() {
    // Navigate to reports
    console.log('Navigate to reports');
  }

  exportReports() {
    // Export reports logic
    console.log('Export reports');
  }

  // Staff Management Methods
  editStaff(staff: Staff) {
    console.log('Edit staff:', staff);
  }

  manageAssignments(staff: Staff) {
    console.log('Manage assignments for:', staff);
  }

  trackByStaffId(index: number, staff: Staff): number {
    return staff.id;
  }

  // Assignment Methods
  openBulkAssignDialog() {
    console.log('Open bulk assign dialog');
  }

  openAssignmentDialog(doctor: any) {
    console.log('Open assignment dialog for doctor:', doctor);
  }

  viewSchedule(staff: Staff) {
    console.log('View schedule for:', staff);
  }

  removeAssignment(staffId: number, doctorId: number) {
    const staff = this.staff.find(s => s.id === staffId);
    if (staff) {
      staff.assignedDoctors = staff.assignedDoctors.filter(id => id !== doctorId);
    }
  }

  assignAllUnassigned() {
    console.log('Assign all unassigned staff');
  }

  quickAssignStaff(staffId: number, doctorId: number) {
    this.assignStaffToDoctor(staffId, doctorId);
  }

  // Attendance Methods
  setToday() {
    this.selectedDate = new Date().toISOString().split('T')[0];
  }

  getActiveStaffCount(): number {
    return this.staff.filter(s => s.attendance.status === 'on-duty').length;
  }

  getPresentStaffCount(): number {
    return this.staff.filter(s => s.attendance.status === 'on-duty').length;
  }

  getLateStaffCount(): number {
    return this.staff.filter(s => s.attendance.status === 'late').length;
  }

  getAbsentStaffCount(): number {
    return this.staff.filter(s => s.attendance.status === 'absent').length;
  }

  // New methods for standardized components
  updateStatsCards() {
    this.statsCards = [
      {
        label: 'Total Roles',
        value: this.roles.length,
        icon: 'shield',
        type: 'info',
        valueColor: 'var(--admin-text-primary)'
      },
      {
        label: 'Total Staff',
        value: this.staff.length,
        icon: 'groups',
        type: 'info',
        valueColor: 'var(--admin-text-primary)'
      },
      {
        label: 'Active Today',
        value: this.getActiveStaffCount(),
        icon: 'check_circle',
        type: 'success',
        valueColor: 'var(--admin-text-primary)'
      },
      {
        label: 'Unassigned',
        value: this.getUnassignedStaffCount(),
        icon: 'warning',
        type: 'warning',
        valueColor: 'var(--admin-text-primary)'
      }
    ];
  }

  getUnassignedStaffCount(): number {
    return this.staff.filter(s => s.assignedDoctors.length === 0).length;
  }

  onHeaderAction(action: string) {
    switch (action) {
      case 'add-staff':
        this.navigateToStaffForm();
        break;
      case 'reports':
        this.navigateToReports();
        break;
    }
  }

  onTabChange(tabId: string) {
    this.setActiveTab(tabId as 'overview' | 'permissions' | 'staff' | 'assignments' | 'attendance');
  }

  getAttendancePercentage(): number {
    const present = this.getPresentStaffCount();
    const total = this.staff.length;
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }

  getFilteredAttendanceStaff(): Staff[] {
    return this.staff.filter(staff => {
      const matchesSearch = staff.fullName.toLowerCase().includes(this.attendanceSearchTerm.toLowerCase()) ||
                           staff.employeeId.toLowerCase().includes(this.attendanceSearchTerm.toLowerCase());
      return matchesSearch;
    });
  }

  isLateArrival(staff: Staff): boolean {
    return staff.attendance.status === 'late';
  }

  viewAttendanceHistory(staff: Staff) {
    console.log('View attendance history for:', staff);
  }

  editAttendance(staff: Staff) {
    console.log('Edit attendance for:', staff);
  }
} 