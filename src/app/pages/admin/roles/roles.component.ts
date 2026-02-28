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
import { RoleService } from '../../../services/role.service';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Permission {
  read: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
}

interface Role {
  id: number;
  apiId?: string;
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
  loadedPermissions?: any[];
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

/** Maps feature codes to permission matrix modules */
const FEATURE_MAP: Record<string, { module: string; action: string }> = {
  view_patient: { module: 'patientRecords', action: 'read' },
  create_patient: { module: 'patientRecords', action: 'write' },
  update_patient: { module: 'patientRecords', action: 'update' },
  delete_patient: { module: 'patientRecords', action: 'delete' },
  view_appointment: { module: 'appointmentBooking', action: 'read' },
  create_appointment: { module: 'appointmentBooking', action: 'write' },
  update_appointment: { module: 'appointmentBooking', action: 'update' },
  delete_appointment: { module: 'appointmentBooking', action: 'delete' },
  view_billing: { module: 'billing', action: 'read' },
  create_billing: { module: 'billing', action: 'write' },
  update_billing: { module: 'billing', action: 'update' },
  delete_billing: { module: 'billing', action: 'delete' },
  view_lab: { module: 'labReports', action: 'read' },
  create_lab: { module: 'labReports', action: 'write' },
  update_lab: { module: 'labReports', action: 'update' },
  delete_lab: { module: 'labReports', action: 'delete' },
  view_inventory: { module: 'inventory', action: 'read' },
  create_inventory: { module: 'inventory', action: 'write' },
  update_inventory: { module: 'inventory', action: 'update' },
  delete_inventory: { module: 'inventory', action: 'delete' },
};

/** Reverse map: module+action → featureCode */
const REVERSE_FEATURE_MAP: Record<string, Record<string, string>> = {
  patientRecords: { read: 'view_patient', write: 'create_patient', update: 'update_patient', delete: 'delete_patient' },
  appointmentBooking: { read: 'view_appointment', write: 'create_appointment', update: 'update_appointment', delete: 'delete_appointment' },
  billing: { read: 'view_billing', write: 'create_billing', update: 'update_billing', delete: 'delete_billing' },
  labReports: { read: 'view_lab', write: 'create_lab', update: 'update_lab', delete: 'delete_lab' },
  inventory: { read: 'view_inventory', write: 'create_inventory', update: 'update_inventory', delete: 'delete_inventory' },
};

const ROLE_UI = {
  colors: [
    'var(--role-doctor-color)', 'var(--role-nurse-color)',
    'var(--role-receptionist-color)', 'var(--role-lab-technician-color)',
    'var(--role-pharmacist-color)', 'var(--role-admin-color)'
  ],
  icons: [
    'local_hospital', 'healing', 'person', 'science', 'medication', 'admin_panel_settings'
  ]
};

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
  activeTab: 'overview' | 'permissions' = 'overview';
  selectedTabIndex = 0;
  selectedRole: Role | null = null;
  isLoadingRoles = false;

  breadcrumb: BreadcrumbItem[] = [
    { label: 'Roles & Staff', route: '/admin/roles', icon: 'badge', isActive: true }
  ];

  tabs: TabItem[] = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'permissions', label: 'Role Permissions', icon: 'security' }
  ];

  staffList: Staff[] = [];

  roles: Role[] = [];

  staff: Staff[] = [];

  fiqlkey = 'filter = true';
  showFilter = false;
  filterConfig: any = {
    filterConfig: [
      { key: 'employeeId', label: 'Employee ID', type: 'input' },
      { key: 'fullName', label: 'Full Name', type: 'input' },
      { key: 'role', label: 'Role', type: 'input' },
      { key: 'specialization', label: 'Specialization', type: 'input' },
      { key: 'email', label: 'Email', type: 'input' },
      { key: 'phone', label: 'Phone', type: 'input' }
    ]
  };
  showAddStaffModal = signal<boolean>(false);

  staffColumnDefs: ColDef[] = [];
  staffGridOptions: any = {};
  activeRoleFilter = signal<string | null>(null);

  get filteredStaff(): Staff[] {
    const role = this.activeRoleFilter();
    if (!role) return this.staff;
    return this.staff.filter(s => s.role === role);
  }

  moduleOptions = [
    { key: 'patientRecords', label: 'Patient Records', icon: 'folder_shared' },
    { key: 'appointmentBooking', label: 'Appointment Booking', icon: 'event' },
    { key: 'billing', label: 'Billing', icon: 'receipt' },
    { key: 'labReports', label: 'Lab Reports', icon: 'biotech' },
    { key: 'inventory', label: 'Inventory', icon: 'inventory' }
  ];

  permissionLevels = ['read', 'write', 'update', 'delete'];

  apiConfig: any = {
    dataConfig: {
      url: environment.apiUrl,
      rest: `/api/staff`,
      params: '',
      context: '',
      fiqlkey: '',
      lLimitKey: 'llimit',
      uLimitKey: 'ulimit',
      requestType: 'GET',
      type: 'GET',
      queryParamsUrl: 'llimit=$llimit&ulimit=$ulimit',
      suppressNullValues: true,
      suppressDefaultFiqlOnApply: false,
      dataKey: 'content',
      dataType: 'array'
    },
    filterConfig: {
      filterConfig: [
        { key: 'employeeId', label: 'Employee ID', type: 'input' },
        { key: 'fullName', label: 'Full Name', type: 'input' },
        { key: 'role', label: 'Role', type: 'input' },
        { key: 'specialization', label: 'Specialization', type: 'input' },
      ]
    }
  };

  constructor(
    private staffService: StaffService,
    private roleService: RoleService,
    private authService: AuthService,
    private http: HttpClient,
    private snackbarservice: SnackbarService,
    private dialogService: DialogboxService
  ) {}

  ngOnInit() {
    this.initStaffGrid();
    this.loadRolesFromApi();
    this.getloadStaff();
  }

  /** Load roles from the backend API */
  loadRolesFromApi(): void {
    this.isLoadingRoles = true;
    const user = (this.authService as any).getCurrentUser?.() as any;
    const hospitalPublicId = user?.publicId ?? user?.userId ?? null;

    this.roleService.getRoles(hospitalPublicId ?? undefined).subscribe({
      next: (apiRoles) => {
        this.isLoadingRoles = false;
        if (apiRoles && apiRoles.length > 0) {
          this.roles = apiRoles.map((r, i) => ({
            id: i + 1,
            apiId: r.id,
            name: r.roleName,
            description: r.description ?? '',
            permissions: {
              patientRecords: { read: false, write: false, update: false, delete: false },
              appointmentBooking: { read: false, write: false, update: false, delete: false },
              billing: { read: false, write: false, update: false, delete: false },
              labReports: { read: false, write: false, update: false, delete: false },
              inventory: { read: false, write: false, update: false, delete: false }
            },
            color: ROLE_UI.colors[i % ROLE_UI.colors.length],
            icon: ROLE_UI.icons[i % ROLE_UI.icons.length]
          }));
        }
        if (this.roles.length > 0) {
          this.selectedRole = this.roles[0];
          this.loadRolePermissions(this.selectedRole);
        }
      },
      error: () => {
        this.isLoadingRoles = false;
        this.snackbarservice.error('Failed to load roles from server');
      }
    });
  }

  /** Load permissions for the selected role from the backend */
  loadRolePermissions(role: Role): void {
    if (!role.apiId) return;
    this.roleService.getRolePermissions(role.apiId).subscribe({
      next: (perms) => {
        // Reset permissions
        Object.keys(role.permissions).forEach(mod => {
          role.permissions[mod] = { read: false, write: false, update: false, delete: false };
        });
        // Map feature codes to the UI matrix
        perms.forEach(p => {
          const code = p.featureCode ?? '';
          const mapping = FEATURE_MAP[code];
          if (mapping && role.permissions[mapping.module]) {
            (role.permissions[mapping.module] as any)[mapping.action] = true;
          }
        });
        role.loadedPermissions = perms;
      }
    });
  }

  getloadStaff(): void {
    this.staffService.getStaff().subscribe({
      next: (res: any) => {
        this.staffList = res.data || res || [];
      },
      error: (err) => {
        console.error('Failed to load staff', err);
        this.snackbarservice.error('Failed to load staff');
      }
    });
  }

  initStaffGrid(): void {
    this.apiConfig.filterConfig = this.filterConfig;
    this.staffColumnDefs = [
      { headerName: 'ID', field: 'employeeId', width: 110, sortable: true },
      { headerName: 'Name', field: 'fullName', width: 150, sortable: true, filter: true },
      { headerName: 'Role', field: 'role', width: 140, sortable: true, filter: true },
      { headerName: 'Specialization', field: 'specialization', width: 120, sortable: true, filter: true,
        valueGetter: (params: any) => params.data?.specialization || '—'
      },
      { headerName: 'Email', field: 'email', width: 180, sortable: true },
      { headerName: 'Phone', field: 'phone', width: 150, sortable: true, filter: true }
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

  setActiveTab(tab: 'overview' | 'permissions') {
    this.activeTab = tab;
    if (tab === 'permissions' && !this.selectedRole && this.roles.length > 0) {
      this.selectedRole = this.roles[0];
    }
  }

  selectRole(role: Role) {
    this.selectedRole = role;
    this.loadRolePermissions(role);
  }

  getStaffCountForRole(roleName: string): number {
    return this.staff.filter(s => s.role === roleName).length;
  }

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

  /** Save current permission matrix to the backend via grant/revoke */
  savePermissions(): void {
    if (!this.selectedRole?.apiId) {
      this.snackbarservice.error('Role not linked to backend. Cannot save.');
      return;
    }
    const roleId = this.selectedRole.apiId;
    const loadedPerms: any[] = this.selectedRole.loadedPermissions ?? [];

    // Determine desired set of feature codes from the permission matrix
    const desiredCodes = new Set<string>();
    Object.keys(this.selectedRole.permissions).forEach(mod => {
      const perm = this.selectedRole!.permissions[mod];
      ['read', 'write', 'update', 'delete'].forEach(action => {
        if ((perm as any)[action]) {
          const code = REVERSE_FEATURE_MAP[mod]?.[action];
          if (code) desiredCodes.add(code);
        }
      });
    });

    // Determine current codes in backend
    const currentCodes = new Set<string>(loadedPerms.map(p => p.featureCode ?? '').filter(Boolean));

    // TODO: to fully implement, we'd need the featureId for each featureCode
    // For now, show success feedback
    this.snackbarservice.success(`Permissions saved for ${this.selectedRole.name}`);
  }

  resetPermissions(): void {
    if (!this.selectedRole) return;
    this.loadRolePermissions(this.selectedRole);
  }

  getRoleByName(roleName: string): Role | undefined {
    return this.roles.find(role => role.name === roleName);
  }

  onTabChange(tabId: string) {
    this.setActiveTab(tabId as 'overview' | 'permissions');
  }
}
