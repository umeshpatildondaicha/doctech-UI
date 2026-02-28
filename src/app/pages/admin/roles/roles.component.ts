import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { AppButtonComponent, AppInputComponent, IconComponent, CheckboxComponent, PageComponent, BreadcrumbItem, TabComponent, TabsComponent, GridComponent, FilterComponent, SnackbarService, DialogboxService } from '@lk/core';
import { AppCardComponent } from '../../../core/components/app-card/app-card.component';
import { AppCardActionsDirective } from '../../../core/components/app-card/app-card-actions.directive';
import { 
  AdminTabsComponent,
  type TabItem
} from '../../../components';
import { StaffService } from '../../../services/staff.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
}

@Component({
    selector: 'app-roles',
    imports: [
        CommonModule,
        AppButtonComponent,
        AppInputComponent,
        IconComponent,
        TabComponent,
        TabsComponent,
        CheckboxComponent,
        AdminTabsComponent,
        PageComponent,
        GridComponent,
        AppCardComponent,
        AppCardActionsDirective,
        FilterComponent
    ],
    templateUrl: './roles.component.html',
    styleUrl: './roles.component.scss'
})
export class RolesComponent implements OnInit {
  // State Management
  activeTab: 'overview' | 'permissions' = 'overview';
  selectedTabIndex = 0;
  selectedRole: Role | null = null;

  breadcrumb: BreadcrumbItem[] = [
    { label: 'Roles & Staff', route: '/admin/roles', icon: 'badge', isActive: true }
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
    }
  ];
 staffList :Staff[]=[];

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
    { id: 1, fullName: 'Dr. Sarah Johnson', employeeId: 'DOC001', role: 'Doctor', profilePicture: '', email: 'sarah.johnson@hospital.com', phone: '+1-555-0101', specialization: 'Cardiology' },
    { id: 2, fullName: 'Dr. Robert Wilson', employeeId: 'DOC002', role: 'Doctor', profilePicture: '', email: 'robert.wilson@hospital.com', phone: '+1-555-0110', specialization: 'Neurology' },
    { id: 3, fullName: 'Dr. Priya Sharma', employeeId: 'DOC003', role: 'Doctor', profilePicture: '', email: 'priya.sharma@hospital.com', phone: '+1-555-0111', specialization: 'Pediatrics' },
    { id: 4, fullName: 'Dr. James Miller', employeeId: 'DOC004', role: 'Doctor', profilePicture: '', email: 'james.miller@hospital.com', phone: '+1-555-0112', specialization: 'Orthopedics' },
    { id: 5, fullName: 'Emily Davis', employeeId: 'NUR001', role: 'Nurse', profilePicture: '', email: 'emily.davis@hospital.com', phone: '+1-555-0102', specialization: 'ICU' },
    { id: 6, fullName: 'Maria Lopez', employeeId: 'NUR002', role: 'Nurse', profilePicture: '', email: 'maria.lopez@hospital.com', phone: '+1-555-0113', specialization: 'Emergency' },
    { id: 7, fullName: 'Anita Patel', employeeId: 'NUR003', role: 'Nurse', profilePicture: '', email: 'anita.patel@hospital.com', phone: '+1-555-0114', specialization: 'OT' },
    { id: 8, fullName: 'Michael Chen', employeeId: 'REC001', role: 'Receptionist', profilePicture: '', email: 'michael.chen@hospital.com', phone: '+1-555-0103' },
    { id: 9, fullName: 'Sophie Turner', employeeId: 'REC002', role: 'Receptionist', profilePicture: '', email: 'sophie.turner@hospital.com', phone: '+1-555-0115' },
    { id: 10, fullName: 'Lisa Rodriguez', employeeId: 'LAB001', role: 'Lab Technician', profilePicture: '', email: 'lisa.rodriguez@hospital.com', phone: '+1-555-0104', specialization: 'Pathology' },
    { id: 11, fullName: 'Raj Kumar', employeeId: 'LAB002', role: 'Lab Technician', profilePicture: '', email: 'raj.kumar@hospital.com', phone: '+1-555-0116', specialization: 'Radiology' },
    { id: 12, fullName: 'David Park', employeeId: 'PHR001', role: 'Pharmacist', profilePicture: '', email: 'david.park@hospital.com', phone: '+1-555-0117' },
    { id: 13, fullName: 'Aisha Khan', employeeId: 'PHR002', role: 'Pharmacist', profilePicture: '', email: 'aisha.khan@hospital.com', phone: '+1-555-0118' },
    { id: 14, fullName: 'Admin User', employeeId: 'ADM001', role: 'Admin', profilePicture: '', email: 'admin@hospital.com', phone: '+1-555-0100' }
  ];
    fiqlkey :string ='filter = true'
    showFilter = false;
    filterConfig :any={
      filterConfig:[
        { key: 'employeeId', label: 'Employee ID', type: 'input' },
        { key: 'fullName', label: 'Full Name', type: 'input' },
        { key: 'role', label: 'Role', type: 'input' },
        { key: 'specialization', label: 'Specialization', type: 'input' },
        { key: 'email', label: 'Email', type: 'input' },
        { key: 'phone', label: 'Phone', type: 'input' }
      ]
    }
    showAddStaffModal = signal<boolean>(false);
    

  // Staff grid
  staffColumnDefs: ColDef[] = [];
  staffGridOptions: any = {};
  activeRoleFilter = signal<string | null>(null);

  get filteredStaff(): Staff[] {
    const role = this.activeRoleFilter();
    if (!role) return this.staff;
    return this.staff.filter(s => s.role === role);
  }

  // Options
  moduleOptions = [
    { key: 'patientRecords', label: 'Patient Records', icon: 'folder_shared' },
    { key: 'appointmentBooking', label: 'Appointment Booking', icon: 'event' },
    { key: 'billing', label: 'Billing', icon: 'receipt' },
    { key: 'labReports', label: 'Lab Reports', icon: 'biotech' },
    { key: 'inventory', label: 'Inventory', icon: 'inventory' }
  ];

  permissionLevels = ['read', 'write', 'update', 'delete'];

  constructor(
    private staffService: StaffService,
    private http: HttpClient,
    private snackbarservice: SnackbarService,
    private dialogService: DialogboxService
  ) {}

  apiConfig :any ={
    dataConfig:{
      url:environment.apiUrl,
      rest:`/api/staff`,
      params:"",
      context:"",
      fiqlkey:"",
      lLimitKey:"llimit",
      uLimitKey:"ulimit",
      requestType:"GET",
      type:"GET",
      queryParamsUrl:"llimit=$llimit&ulimit=$ulimit",
      suppressNullValues:true,
      suppressDefaultFiqlOnApply:false,
      dataKey:"content",
      dataType:"array"

    },
     filterConfig:{
      filterConfig:[
        {
          key:"employeeId",label:"Employee ID",type:"input"
        },
        {
          key:"fullName",label:"Full Name",type:"input"
        },
        {
          key:"role",label:"Role",type:"input"
        },
        {
          key:"specialization",label:"Specialization",type:"input"
        },
      ]
     }
  }
  ngOnInit() {
    this.initStaffGrid();
    if (this.roles.length > 0) {
      this.selectedRole = this.roles[0];
    }
    this.getloadStaff();
  }
  getloadStaff():void{
    this.staffService.getStaff().subscribe({
      next:(res:any)=>{
        this.staffList = res.data || res || [];
        console.log('Staff loaded successfully', this.staffList.length);
      },
      error:(err)=>{
        console.error('Failed to load staff', err);
        this.snackbarservice.error('Failed to load staff');
      }
    })
  }

  initStaffGrid(): void {
    this.apiConfig.filterConfig = this.filterConfig;
    this.staffColumnDefs = [
      { headerName: 'ID', field: 'employeeId', width: 110, sortable: true },
      { headerName: 'Name', field: 'fullName', width:150, sortable: true, filter: true },
      { headerName: 'Role', field: 'role', width: 140, sortable: true, filter: true },
      { headerName: 'Specialization', field: 'specialization', width: 120, sortable: true, filter:true,
        valueGetter: (params: any) => params.data?.specialization || '—'
      },
      { headerName: 'Email', field: 'email', width:180, sortable: true },
      { headerName: 'Phone', field: 'phone', width: 150,sortable :true,filter:true }
    ];
    this.staffGridOptions = {
      menuActions: [
        { title: 'View', icon: 'visibility', click: (_p: any) => {} },
        { title: 'Edit', icon: 'edit', click: (_p: any) => {} },
        { title: 'Delete', icon: 'delete', click: (_p: any) => {} }
      ]
    };
  }

  filterByRole(roleName: string): void {
    const current = this.activeRoleFilter();
    this.activeRoleFilter.set(current === roleName ? null : roleName);
  }

  // Tab Management
  setActiveTab(tab: 'overview' | 'permissions') {
    this.activeTab = tab;
    if (tab === 'permissions' && !this.selectedRole && this.roles.length > 0) {
      this.selectedRole = this.roles[0];
    }
  }

  // Role Management Methods
  selectRole(role: Role) {
    this.selectedRole = role;
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



  // New methods for standardized components

  onTabChange(tabId: string) {
    this.setActiveTab(tabId as 'overview' | 'permissions');
  }
} 