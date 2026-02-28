import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  ChangeDetectorRef, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageComponent, BreadcrumbItem } from '@lk/core';
import { AdminTabsComponent, type TabItem } from '../../../components';
import { StaffService, StaffMember, StaffInviteRequest } from '../../../services/staff.service';
import { DepartmentService, Department } from '../../../services/department.service';
import { ReplacePipe } from '../../../pipes/replace.pipe';

export type StaffStatus = 'Active' | 'Off Duty' | 'On Break' | 'On Leave';
export type ShiftLabel = 'Morning' | 'Evening' | 'Night' | 'Rotating' | 'Flexible' | '-';
export type AssignmentType = 'hospital' | 'doctor' | 'unassigned';

export interface DisplayStaff {
  raw: StaffMember;
  id: number;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
  department: string;
  shift: ShiftLabel;
  shiftIcon: string;
  status: StaffStatus;
  employeeId: string;
  assignmentType: AssignmentType;
  assignedDoctorName?: string;
  onboardingStep: number;   // 0–4
  loginActivity: LoginEvent[];
  documents: StaffDocument[];
  username: string;
  twoFaEnabled: boolean;
}

export interface LoginEvent {
  type: 'success' | 'failed';
  device: string;
  time: string;
  ip: string;
}

export interface StaffDocument {
  name: string;
  filename: string;
  date: string;
  status: 'verified' | 'pending' | 'rejected';
}

const AVATAR_COLORS = [
  '#3b82f6','#22c55e','#f59e0b','#8b5cf6',
  '#ef4444','#14b8a6','#f97316','#0ea5e9',
];

@Component({
  selector: 'app-staff-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    PageComponent,
    AdminTabsComponent,
    ReplacePipe,
  ],
  templateUrl: './staff-management.component.html',
  styleUrl: './staff-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffManagementComponent implements OnInit, OnDestroy {

  // ── State ──────────────────────────────────────────────────────────────────
  isLoading        = signal(false);
  showAddPanel     = signal(false);
  showInvitePanel  = signal(false);
  selectedStaff    = signal<DisplayStaff | null>(null);
  activeDetailTab  = signal<'overview' | 'security' | 'documents'>('overview');

  searchQuery      = signal('');
  statusFilter     = signal<StaffStatus | 'All'>('All');

  rawStaff: StaffMember[]   = [];
  departments: Department[] = [];
  displayStaff: DisplayStaff[] = [];

  breadcrumb: BreadcrumbItem[] = [
    { label: 'Staff Management', route: '/admin/staff', icon: 'groups', isActive: true }
  ];

  readonly adminTabs: TabItem[] = [
    { id: '/admin/doctors', label: 'Doctors',  icon: 'medical_services' },
    { id: '/admin/staff',   label: 'Staff',    icon: 'groups'           },
    { id: '/admin/roles',   label: 'Roles',    icon: 'manage_accounts'  },
    { id: '/admin/hospital',label: 'Hospital', icon: 'apartment'        },
    { id: '/admin/plans',   label: 'Plans',    icon: 'workspace_premium'},
    { id: '/admin/billing', label: 'Billing',  icon: 'credit_card'      },
  ];

  readonly shiftPatterns = ['MORNING', 'EVENING', 'NIGHT', 'ROTATING', 'FLEXIBLE'];
  readonly defaultRoles  = ['Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist',
                             'Admin', 'Physiotherapist', 'Nutritionist', 'Ward Boy'];

  addForm!: FormGroup;
  inviteForm!: FormGroup;

  private readonly destroy$ = new Subject<void>();

  // ── Computed lists ─────────────────────────────────────────────────────────
  get filteredStaff(): DisplayStaff[] {
    const q   = this.searchQuery().toLowerCase();
    const sf  = this.statusFilter();
    return this.displayStaff.filter(s => {
      const matchSearch = !q
        || s.name.toLowerCase().includes(q)
        || s.role.toLowerCase().includes(q)
        || s.department.toLowerCase().includes(q)
        || s.employeeId.toLowerCase().includes(q);
      const matchStatus = sf === 'All' || s.status === sf;
      return matchSearch && matchStatus;
    });
  }

  get totalActive(): number { return this.displayStaff.filter(s => s.status === 'Active').length; }
  get totalOffDuty(): number { return this.displayStaff.filter(s => s.status === 'Off Duty').length; }
  get totalOnLeave(): number { return this.displayStaff.filter(s => s.status === 'On Leave').length; }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  constructor(
    private readonly staffService:     StaffService,
    private readonly departmentService: DepartmentService,
    private readonly fb:               FormBuilder,
    private readonly snackBar:         MatSnackBar,
    private readonly cdr:              ChangeDetectorRef,
    private readonly router:           Router
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  onAdminTabChange(tabId: string): void {
    this.router.navigate([tabId]);
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  openDetail(staff: DisplayStaff): void {
    this.selectedStaff.set(staff);
    this.activeDetailTab.set('overview');
  }

  closeDetail(): void {
    this.selectedStaff.set(null);
  }

  // ── Staff actions ──────────────────────────────────────────────────────────

  approveStaff(staff: DisplayStaff, event: Event): void {
    event.stopPropagation();
    this.staffService.approveStaff(staff.id, 'Approved by admin')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Staff approved', 'Close', { duration: 3000 });
          this.loadData();
        },
        error: () => this.snackBar.open('Failed to approve', 'Close', { duration: 3000 })
      });
  }

  toggleStatus(staff: DisplayStaff, event: Event): void {
    event.stopPropagation();
    const isActive = staff.status === 'Active';
    this.staffService.updateAvailability(staff.id, !isActive)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(isActive ? 'Staff set Off Duty' : 'Staff set Active', 'Close', { duration: 3000 });
          this.loadData();
        },
        error: () => this.snackBar.open('Failed to update status', 'Close', { duration: 3000 })
      });
  }

  deleteStaff(staff: DisplayStaff, event: Event): void {
    event.stopPropagation();
    this.staffService.deleteStaff(staff.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Staff removed', 'Close', { duration: 3000 });
          if (this.selectedStaff()?.id === staff.id) this.closeDetail();
          this.loadData();
        },
        error: () => this.snackBar.open('Failed to remove', 'Close', { duration: 3000 })
      });
  }

  // ── Forms ──────────────────────────────────────────────────────────────────

  private initForms(): void {
    const baseFields = {
      firstName:    ['', Validators.required],
      lastName:     ['', Validators.required],
      email:        ['', [Validators.required, Validators.email]],
      contactNumber:[''],
      roles:        [[]],
      departmentId: [null],
      specialization:[''],
      shiftPattern: [''],
    };
    this.addForm    = this.fb.group({ ...baseFields, experienceYears: [0] });
    this.inviteForm = this.fb.group(baseFields);
  }

  toggleRole(form: FormGroup, role: string): void {
    const current: string[] = form.get('roles')?.value ?? [];
    const idx = current.indexOf(role);
    idx >= 0 ? current.splice(idx, 1) : current.push(role);
    form.get('roles')?.setValue([...current]);
  }

  addStaff(): void {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    this.isLoading.set(true);
    this.staffService.createStaff(this.addForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.showAddPanel.set(false);
          this.addForm.reset({ roles: [] });
          this.snackBar.open('Staff created!', 'Close', { duration: 3000 });
          this.loadData();
        },
        error: err => {
          this.isLoading.set(false);
          this.snackBar.open(err?.error?.message ?? 'Failed to create staff', 'Close', { duration: 3000 });
          this.cdr.markForCheck();
        }
      });
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) { this.inviteForm.markAllAsTouched(); return; }
    this.isLoading.set(true);
    const dto: StaffInviteRequest = this.inviteForm.value;
    this.staffService.inviteStaff(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.isLoading.set(false);
          this.showInvitePanel.set(false);
          this.inviteForm.reset({ roles: [] });
          this.snackBar.open(res.message ?? 'Invitation sent!', 'Close', { duration: 4000 });
          this.loadData();
        },
        error: err => {
          this.isLoading.set(false);
          this.snackBar.open(err?.error?.message ?? 'Failed to send invitation', 'Close', { duration: 3000 });
          this.cdr.markForCheck();
        }
      });
  }

  hasError(form: FormGroup, field: string, error: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl?.hasError(error) && ctrl?.touched);
  }

  getDepartmentName(id: number | undefined): string {
    if (!id) return '—';
    return this.departments.find(d => d.departmentId === id)?.name ?? String(id);
  }

  getOnboardingSteps(staff: DisplayStaff): { label: string; done: boolean; date?: string; sub?: string }[] {
    return [
      { label: 'Account Created',       done: true,                    date: 'Jan 10, 2024' },
      { label: 'Personal Info Verified',done: true,                    date: 'Jan 12, 2024' },
      { label: 'Document Verification', done: staff.onboardingStep > 2, sub: staff.onboardingStep <= 2 ? 'Pending admin review of certifications.' : undefined },
      { label: 'Badge Issuance',        done: staff.onboardingStep > 3, sub: staff.onboardingStep <= 3 ? 'Locked' : undefined },
    ];
  }

  get onboardingPercent(): number {
    const s = this.selectedStaff();
    if (!s) return 0;
    return Math.round((s.onboardingStep / 4) * 100);
  }

  // ── Data loading ───────────────────────────────────────────────────────────

  private loadData(): void {
    this.isLoading.set(true);
    forkJoin({
      staff:   this.staffService.getStaff({ active: false }).pipe(catchError(() => of({ staffDetails: [] }))),
      depts:   this.departmentService.getDepartments().pipe(catchError(() => of([])))
    }).pipe(takeUntil(this.destroy$))
      .subscribe(({ staff, depts }) => {
        this.rawStaff    = staff.staffDetails ?? [];
        this.departments = depts;
        this.displayStaff = this.rawStaff
          .filter(s => !(s.roles ?? []).some(r => r.toLowerCase().includes('doctor')))
          .map((s, i) => this.toDisplay(s, i));
        this.isLoading.set(false);
        this.cdr.markForCheck();
      });
  }

  private toDisplay(s: StaffMember, idx: number): DisplayStaff {
    const fullName = `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim();
    const initials = `${(s.firstName ?? ' ')[0]}${(s.lastName ?? ' ')[0]}`.toUpperCase();
    const roles    = (s.roles ?? []).filter(r => !r.toLowerCase().includes('doctor'));
    const role     = roles[0] ?? 'Staff';

    const shiftMap: Record<string, ShiftLabel> = {
      MORNING: 'Morning', EVENING: 'Evening', NIGHT: 'Night',
      ROTATING: 'Rotating', FLEXIBLE: 'Flexible'
    };
    const shiftIconMap: Record<string, string> = {
      Morning: 'wb_sunny', Evening: 'wb_twilight', Night: 'dark_mode',
      Rotating: 'update', Flexible: 'schedule', '-': 'remove'
    };
    const shift     = shiftMap[s.shiftPattern?.toUpperCase() ?? ''] ?? '-' as ShiftLabel;
    const shiftIcon = shiftIconMap[shift] ?? 'schedule';

    // Mock status cycling for demo
    let status: StaffStatus;
    if (s.isActive === false) {
      status = 'On Leave';
    } else if (!s.isAvailable) {
      status = 'Off Duty';
    } else {
      const statusCycle: StaffStatus[] = ['Active', 'Active', 'On Break'];
      status = statusCycle[idx % 3];
    }

    // Assignment mock
    const assignmentTypes: AssignmentType[] = ['hospital', 'doctor', 'unassigned'];
    const assignmentType = assignmentTypes[idx % 3];
    const doctorNames = ['Dr. Emily Chen', 'Dr. Anika Singh', 'Dr. Marcus Thorne'];

    const mockDocs: StaffDocument[] = [
      { name: 'Medical License',    filename: 'License-MD-998822.pdf', date: 'Jan 15, 2024', status: 'verified' },
      { name: 'National ID Proof',  filename: 'Passport-Copy-Scan.jpg', date: 'Jan 15, 2024', status: 'verified' },
      { name: 'ACLS Certification', filename: 'ACLS-Cert-8822.pdf',    date: 'Feb 10, 2024', status: 'pending'  },
    ];
    const mockLogins: LoginEvent[] = [
      { type: 'success', device: 'Chrome (Win)', time: 'Today, 09:41 AM', ip: '183.168.11' },
      { type: 'success', device: 'Mobile App',   time: 'Yesterday, 08:30 PM', ip: '10.0.0.14' },
      { type: 'failed',  device: 'Unknown',      time: 'Jan 26, 11:30 AM', ip: '143.22.14' },
    ];

    return {
      raw: s,
      id:   s.staffId ?? idx,
      name: fullName || 'Unknown Staff',
      initials,
      avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
      role,
      department: this.getDepartmentName(s.departmentId),
      shift,
      shiftIcon,
      status,
      employeeId: s.employeeId ?? `MS-${String(1000 + idx).padStart(4, '0')}`,
      assignmentType,
      assignedDoctorName: assignmentType === 'doctor' ? doctorNames[idx % doctorNames.length] : undefined,
      onboardingStep: s.approvedByHospitalAdmin ? 4 : 2,
      loginActivity: mockLogins,
      documents: mockDocs,
      username: `${s.firstName?.toLowerCase() ?? 'user'}.${(s.lastName?.substring(0,1) ?? '').toLowerCase()}`,
      twoFaEnabled: idx % 2 === 0,
    };
  }
}
