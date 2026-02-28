import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageComponent, BreadcrumbItem } from '@lk/core';
import { AdminTabsComponent, type TabItem } from '../../../components';
import { RoleService, Role, FeatureCatalog, RolePermission } from '../../../services/role.service';

export type ActionKey = 'read' | 'write' | 'update' | 'delete';

const ALL_ACTIONS: ActionKey[] = ['read', 'write', 'update', 'delete'];

export interface ActionState {
  read:   boolean;
  write:  boolean;
  update: boolean;
  delete: boolean;
}

export interface GroupedFeatures {
  serviceCode: string;
  features:    FeatureCatalog[];
  expanded:    boolean;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    PageComponent,
    AdminTabsComponent,
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RolesComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // ── State ─────────────────────────────────────────────────────────────────
  roles           = signal<Role[]>([]);
  catalog         = signal<FeatureCatalog[]>([]);
  permissions     = signal<RolePermission[]>([]);
  selectedRole    = signal<Role | null>(null);
  isLoading       = signal(false);
  isSaving        = signal(false);
  showCreatePanel = signal(false);
  roleSearch      = signal('');
  featureSearch   = signal('');

  readonly allActions: ActionKey[] = ALL_ACTIONS;

  /** featureId → per-action booleans (current, possibly unsaved) */
  private readonly localState      = new Map<string, ActionState>();
  /** Snapshot of last-saved state for dirty-checking */
  private readonly savedState      = new Map<string, ActionState>();
  private readonly collapsedGroups = new Set<string>();

  breadcrumb: BreadcrumbItem[] = [
    { label: 'Roles & Permissions', route: '/admin/roles', icon: 'badge', isActive: true }
  ];

  readonly adminTabs: TabItem[] = [
    { id: '/admin/doctors',  label: 'Doctors',  icon: 'medical_services'  },
    { id: '/admin/staff',    label: 'Staff',    icon: 'groups'            },
    { id: '/admin/roles',    label: 'Roles',    icon: 'badge'             },
    { id: '/admin/hospital', label: 'Hospital', icon: 'local_hospital'    },
    { id: '/admin/plans',    label: 'Plans',    icon: 'workspace_premium' },
    { id: '/admin/billing',  label: 'Billing',  icon: 'receipt_long'      },
  ];

  createForm!: FormGroup;

  // ── Computed getters ──────────────────────────────────────────────────────

  get groupedFeatures(): GroupedFeatures[] {
    const q = this.featureSearch().toLowerCase().trim();
    const items = q
      ? this.catalog().filter(f =>
          f.featureName.toLowerCase().includes(q) ||
          (f.serviceCode ?? '').toLowerCase().includes(q) ||
          f.featureCode.toLowerCase().includes(q)
        )
      : this.catalog();

    const map = new Map<string, FeatureCatalog[]>();
    for (const f of items) {
      const key = f.serviceCode ?? 'General';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }

    return Array.from(map.entries()).map(([serviceCode, features]) => ({
      serviceCode,
      features,
      expanded: !this.collapsedGroups.has(serviceCode)
    }));
  }

  get filteredRoles(): Role[] {
    const q = this.roleSearch().toLowerCase().trim();
    return q
      ? this.roles().filter(r => r.roleName.toLowerCase().includes(q))
      : this.roles();
  }

  get hasUnsavedChanges(): boolean {
    for (const [featureId, state] of this.localState) {
      const saved = this.savedState.get(featureId);
      if (saved) {
        for (const a of ALL_ACTIONS) {
          if (state[a] !== saved[a]) return true;
        }
      } else if (Object.values(state).some(Boolean)) {
        return true;
      }
    }
    return false;
  }

  get grantedCount(): number {
    let count = 0;
    for (const state of this.localState.values()) {
      if (Object.values(state).some(Boolean)) count++;
    }
    return count;
  }

  get totalRoles():  number { return this.roles().length; }
  get systemRoles(): number { return this.roles().filter(r => r.roleType === 'SYSTEM').length; }
  get customRoles(): number { return this.roles().filter(r => r.roleType !== 'SYSTEM').length; }

  get donutPercent(): number {
    const total = this.catalog().length;
    if (!total) return 0;
    return Math.round((this.grantedCount / total) * 100);
  }

  get donutDasharray(): string {
    const r = 36;
    const c = 2 * Math.PI * r;
    const fill = (this.donutPercent / 100) * c;
    return `${fill.toFixed(2)} ${c.toFixed(2)}`;
  }

  constructor(
    private readonly roleService: RoleService,
    private readonly fb: FormBuilder,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      roleName:    ['', [Validators.required, Validators.minLength(2)]],
      roleType:    ['CUSTOM'],
      description: [''],
    });
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  private loadData(): void {
    this.isLoading.set(true);
    forkJoin({
      roles:   this.roleService.getRoles().pipe(catchError(() => of([]))),
      catalog: this.roleService.getFeatureCatalog().pipe(catchError(() => of([]))),
    }).pipe(takeUntil(this.destroy$))
      .subscribe(({ roles, catalog }) => {
        this.roles.set(roles);
        this.catalog.set(catalog);
        if (roles.length > 0) {
          this.selectRole(roles[0]);
        }
        this.isLoading.set(false);
        this.cdr.markForCheck();
      });
  }

  selectRole(role: Role): void {
    this.selectedRole.set(role);
    this.localState.clear();
    this.savedState.clear();
    this.loadRolePermissions(role);
  }

  private loadRolePermissions(role: Role): void {
    if (!role.id) { this.cdr.markForCheck(); return; }
    this.roleService.getRolePermissions(role.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (perms) => {
          this.permissions.set(perms);
          this.localState.clear();
          this.savedState.clear();
          for (const p of perms) {
            const fid = p.featureId ?? p.featureCode ?? '';
            if (!fid) continue;
            const state: ActionState = { read: true, write: true, update: true, delete: true };
            this.localState.set(fid, { ...state });
            this.savedState.set(fid, { ...state });
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.permissions.set([]);
          this.cdr.markForCheck();
        }
      });
  }

  // ── Permission helpers ────────────────────────────────────────────────────

  isActionEnabled(featureId: string, action: ActionKey): boolean {
    return this.localState.get(featureId)?.[action] ?? false;
  }

  toggleAction(featureId: string, action: ActionKey): void {
    const current = this.localState.get(featureId) ?? { read: false, write: false, update: false, delete: false };
    this.localState.set(featureId, { ...current, [action]: !current[action] });
    this.cdr.markForCheck();
  }

  isFeatureGranted(featureId: string): boolean {
    const s = this.localState.get(featureId);
    return s ? Object.values(s).some(Boolean) : false;
  }

  isAllActionsForGroup(serviceCode: string): boolean {
    const features = this.catalog().filter(f => (f.serviceCode ?? 'General') === serviceCode);
    return features.length > 0 && features.every(f => ALL_ACTIONS.every(a => this.isActionEnabled(f.id, a)));
  }

  isSomeActionsForGroup(serviceCode: string): boolean {
    const features = this.catalog().filter(f => (f.serviceCode ?? 'General') === serviceCode);
    const some = features.some(f => ALL_ACTIONS.some(a => this.isActionEnabled(f.id, a)));
    return some && !this.isAllActionsForGroup(serviceCode);
  }

  toggleGroup(serviceCode: string): void {
    const features = this.catalog().filter(f => (f.serviceCode ?? 'General') === serviceCode);
    const allOn = this.isAllActionsForGroup(serviceCode);
    for (const f of features) {
      this.localState.set(f.id, { read: !allOn, write: !allOn, update: !allOn, delete: !allOn });
    }
    this.cdr.markForCheck();
  }

  toggleGroupExpand(serviceCode: string): void {
    if (this.collapsedGroups.has(serviceCode)) {
      this.collapsedGroups.delete(serviceCode);
    } else {
      this.collapsedGroups.add(serviceCode);
    }
    this.cdr.markForCheck();
  }

  isGroupExpanded(serviceCode: string): boolean {
    return !this.collapsedGroups.has(serviceCode);
  }

  grantAll(): void {
    for (const f of this.catalog()) {
      this.localState.set(f.id, { read: true, write: true, update: true, delete: true });
    }
    this.cdr.markForCheck();
  }

  revokeAll(): void {
    this.localState.clear();
    this.cdr.markForCheck();
  }

  // ── Save / Discard ────────────────────────────────────────────────────────

  saveChanges(): void {
    const role = this.selectedRole();
    if (!role?.id || this.isSaving()) return;
    this.isSaving.set(true);

    const perms = this.permissions();
    const toGrant = this.catalog().filter(f => {
      const savedEntry = this.savedState.get(f.id);
      const wasGranted = savedEntry ? Object.values(savedEntry).some(Boolean) : false;
      const isGranted  = this.isFeatureGranted(f.id);
      return isGranted && !wasGranted;
    });
    const toRevoke = perms.filter(p => {
      const fid = p.featureId ?? p.featureCode ?? '';
      return !this.isFeatureGranted(fid);
    });

    const ops = [
      ...toGrant.map(f  => this.roleService.grantPermission(role.id!, f.id).pipe(catchError(() => of(null)))),
      ...toRevoke.map(p => this.roleService.revokePermission(role.id!, String(p.id)).pipe(catchError(() => of(null)))),
    ];

    forkJoin(ops.length > 0 ? ops : [of(null)])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          for (const [k, v] of this.localState.entries()) {
            this.savedState.set(k, { ...v });
          }
          this.snackBar.open('Permissions saved successfully', 'Close', { duration: 3000 });
          this.loadRolePermissions(role);
          this.cdr.markForCheck();
        },
        error: () => {
          this.isSaving.set(false);
          this.snackBar.open('Failed to save some permissions', 'Close', { duration: 3000 });
          this.cdr.markForCheck();
        }
      });
  }

  discardChanges(): void {
    this.localState.clear();
    for (const [k, v] of this.savedState.entries()) {
      this.localState.set(k, { ...v });
    }
    this.cdr.markForCheck();
  }

  // ── Create / Delete role ──────────────────────────────────────────────────

  submitCreateRole(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    const { roleName, roleType, description } = this.createForm.value as { roleName: string; roleType: string; description: string };
    this.roleService.createRole({ roleName, roleType, description })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (role) => {
          this.roles.update(list => [...list, role]);
          this.showCreatePanel.set(false);
          this.createForm.reset({ roleType: 'CUSTOM' });
          this.snackBar.open(`Role "${role.roleName}" created`, 'Close', { duration: 3000 });
          this.selectRole(role);
          this.cdr.markForCheck();
        },
        error: (err: { error?: { message?: string } }) => {
          this.snackBar.open(err?.error?.message ?? 'Failed to create role', 'Close', { duration: 3000 });
        }
      });
  }

  deleteRole(role: Role): void {
    if (!role.id || role.roleType === 'SYSTEM') return;
    this.roleService.deleteRole(role.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.roles.update(list => list.filter(r => r.id !== role.id));
          const remaining = this.roles();
          this.selectedRole.set(remaining[0] ?? null);
          if (remaining[0]) this.loadRolePermissions(remaining[0]);
          this.snackBar.open('Role deleted', 'Close', { duration: 3000 });
          this.cdr.markForCheck();
        },
        error: () => {
          this.snackBar.open('Failed to delete role', 'Close', { duration: 3000 });
        }
      });
  }

  // ── Utility helpers ───────────────────────────────────────────────────────

  getServiceIcon(serviceCode: string): string {
    const icons: Record<string, string> = {
      PATIENT:     'folder_shared',
      APPOINTMENT: 'event',
      BILLING:     'receipt',
      LAB:         'biotech',
      INVENTORY:   'inventory',
      PHARMACY:    'medication',
      STAFF:       'groups',
      ADMIN:       'admin_panel_settings',
      REPORTS:     'assessment',
      CHAT:        'chat',
      SCHEDULE:    'calendar_month',
    };
    return icons[serviceCode?.toUpperCase()] ?? 'widgets';
  }

  getGrantedCountForGroup(serviceCode: string): number {
    return this.catalog()
      .filter(f => (f.serviceCode ?? 'General') === serviceCode && this.isFeatureGranted(f.id))
      .length;
  }

  getTotalCountForGroup(serviceCode: string): number {
    return this.catalog().filter(f => (f.serviceCode ?? 'General') === serviceCode).length;
  }

  trackByFeatureId(_i: number, f: FeatureCatalog): string { return f.id; }
  trackByGroup(_i: number, g: GroupedFeatures):    string { return g.serviceCode; }
  trackByRole(_i: number, r: Role):                string { return r.id ?? r.roleName; }
}
