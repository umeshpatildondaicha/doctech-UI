import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, OnDestroy, ViewChild, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreadcrumbItem, PageComponent, DialogboxService } from '@lk/core';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DepartmentService } from '../../../services/department.service';
import { StaffService } from '../../../services/staff.service';
import { AuthService } from '../../../services/auth.service';

type NodeId = string;
type EdgeId = string;
type NodeType = 'hospital' | 'department' | 'subdepartment' | 'doctor' | 'staff';

// Optional hierarchy: departments and sub-departments are optional.
// Valid parent types for each node type:
//   doctor → hospital | department | subdepartment  (dept & sub-dept are optional)
//   subdepartment → department                      (sub-dept is optional)
//   staff → doctor
const VALID_PARENT_TYPES: Partial<Record<NodeType, NodeType[]>> = {
  department:    ['hospital'],
  subdepartment: ['department'],
  doctor:        ['hospital', 'department', 'subdepartment'],
  staff:         ['doctor'],
};

interface Hospital     { id: string; name: string; }
interface Department   { id: string; name: string; code: string; headName: string; active: boolean; }
interface SubDepartment{ id: string; name: string; }
interface Doctor       { id: string; name: string; specialization?: string; online?: boolean; }
interface StaffMember  { id: string; name: string; role?: string; }

interface Feature {
  id: string;
  name: string;
  icon: string;
  service: string;
  serviceColor: string;
}

interface ServiceGroup {
  service: string;
  color: string;
  features: Feature[];
}

interface FlowNode {
  id: NodeId;
  type: NodeType;
  entityId: string;
  title: string;
  subtitle?: string;
  x: number;
  y: number;
}

interface FlowEdge { id: EdgeId; from: NodeId; to: NodeId; }

interface DragState {
  nodeId: NodeId;
  startMouseX: number;
  startMouseY: number;
  startNodeX: number;
  startNodeY: number;
  moved: boolean;
}

@Component({
  selector: 'app-admin-hospital',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageComponent,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatMenuModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './hospital.component.html',
  styleUrl: './hospital.component.scss',
})
export class HospitalComponent implements OnInit, OnDestroy {
  @ViewChild('canvasEl', { static: true }) canvasRef!: ElementRef<HTMLElement>;

  breadcrumb: BreadcrumbItem[] = [
    { label: 'Admin', route: '/admin-dashboard', icon: 'admin_panel_settings' },
    { label: 'Hospital', route: '/admin/hospital', icon: 'apartment', isActive: true },
  ];

  // ── Seed data ────────────────────────────────────────────────────────────────
  readonly hospitals = signal<Hospital[]>([{ id: 'h1', name: 'Shree Clinic Hospital' }]);

  readonly departments = signal<Department[]>([
    { id: 'dep1', name: 'Cardiology',       code: 'DEPT-CRD-01', headName: 'Dr. Aris Thorne',     active: true },
    { id: 'dep2', name: 'General Medicine', code: 'DEPT-GEN-01', headName: 'Dr. Amit Deshmukh',   active: true },
    { id: 'dep3', name: 'Pediatrics',       code: 'DEPT-PED-01', headName: 'Dr. Neha Rao',         active: true },
    { id: 'dep4', name: 'Orthopedics',      code: 'DEPT-ORT-01', headName: 'Dr. Sameer Kulkarni', active: false },
  ]);

  readonly subDepartments = signal<SubDepartment[]>([
    { id: 'sub1', name: 'Surgery'     },
    { id: 'sub2', name: 'Diagnostics' },
    { id: 'sub3', name: 'Rehab'       },
  ]);

  readonly doctors = signal<Doctor[]>([
    { id: 'd1', name: 'Dr. Amit Deshmukh',   specialization: 'General Medicine', online: true  },
    { id: 'd2', name: 'Dr. Neha Rao',         specialization: 'Pediatrics',       online: true  },
    { id: 'd3', name: 'Dr. Sameer Kulkarni', specialization: 'Orthopedics',      online: false },
  ]);

  readonly staff = signal<StaffMember[]>([
    { id: 's1', name: 'Aarav Kulkarni', role: 'Reception'  },
    { id: 's2', name: 'Meera Iyer',     role: 'Nurse'      },
    { id: 's3', name: 'Kabir Sharma',   role: 'Lab Tech'   },
    { id: 's4', name: 'Anaya Singh',    role: 'Billing'    },
    { id: 's5', name: 'Rohan Patel',    role: 'Pharmacist' },
  ]);

  // ── Features (mirrors Plans page services) ────────────────────────────────
  readonly allFeatures = signal<Feature[]>([
    // Basic Service (Blue)
    { id: 'appointments',  name: 'Appointment Scheduling', icon: 'event',          service: 'Basic Service',    serviceColor: '#2563eb' },
    { id: 'chat',          name: 'Doctor–Patient Chat',    icon: 'chat',           service: 'Basic Service',    serviceColor: '#2563eb' },
    { id: 'prescriptions', name: 'Digital Prescriptions',  icon: 'description',    service: 'Basic Service',    serviceColor: '#2563eb' },
    { id: 'patient-mgmt',  name: 'Patient Management',     icon: 'people',         service: 'Basic Service',    serviceColor: '#2563eb' },
    { id: 'reports',       name: 'Analytics & Reports',    icon: 'bar_chart',      service: 'Basic Service',    serviceColor: '#2563eb' },
    { id: 'notifications', name: 'Smart Notifications',    icon: 'notifications',  service: 'Basic Service',    serviceColor: '#2563eb' },
    // Physiotherapy (Green)
    { id: 'exercise-plans',    name: 'Exercise Plan Creator',    icon: 'fitness_center', service: 'Physiotherapy', serviceColor: '#059669' },
    { id: 'diet-basic',        name: 'Basic Diet Guidance',      icon: 'restaurant',     service: 'Physiotherapy', serviceColor: '#059669' },
    { id: 'progress-tracking', name: 'Progress Tracking',        icon: 'trending_up',    service: 'Physiotherapy', serviceColor: '#059669' },
    { id: 'assessment',        name: 'Patient Assessment Forms', icon: 'assignment',     service: 'Physiotherapy', serviceColor: '#059669' },
    { id: 'video-library',     name: 'Exercise Video Library',   icon: 'play_circle',    service: 'Physiotherapy', serviceColor: '#059669' },
    // Nutrition Service (Amber)
    { id: 'diet-planning',      name: 'Advanced Diet Planning',   icon: 'menu_book',     service: 'Nutrition Service', serviceColor: '#d97706' },
    { id: 'custom-forms',       name: 'Custom Assessment Forms',  icon: 'dynamic_form',  service: 'Nutrition Service', serviceColor: '#d97706' },
    { id: 'meal-builder',       name: 'Meal Plan Builder',        icon: 'kitchen',       service: 'Nutrition Service', serviceColor: '#d97706' },
    { id: 'nutrition-analysis', name: 'Nutritional Analysis',     icon: 'analytics',     service: 'Nutrition Service', serviceColor: '#d97706' },
    { id: 'food-database',      name: 'Food Database Access',     icon: 'library_books', service: 'Nutrition Service', serviceColor: '#d97706' },
    // Mental Wellness (Purple)
    { id: 'mental-assessment',     name: 'Mental Health Assessments',  icon: 'psychology_alt',      service: 'Mental Wellness', serviceColor: '#7c3aed' },
    { id: 'therapy-schedule',      name: 'Therapy Session Scheduling', icon: 'calendar_today',      service: 'Mental Wellness', serviceColor: '#7c3aed' },
    { id: 'mood-tracking',         name: 'Mood & Emotion Tracking',    icon: 'sentiment_satisfied', service: 'Mental Wellness', serviceColor: '#7c3aed' },
    { id: 'custom-questionnaires', name: 'Custom Questionnaires',      icon: 'quiz',                service: 'Mental Wellness', serviceColor: '#7c3aed' },
  ]);

  readonly hospitalFeatureIds = signal<string[]>([
    'appointments', 'chat', 'prescriptions', 'patient-mgmt', 'reports',
    'exercise-plans', 'diet-basic', 'progress-tracking', 'assessment',
  ]);

  readonly doctorFeatureMap = signal<Record<string, string[]>>({});

  readonly hospitalFeatureCount = computed(() => this.hospitalFeatureIds().length);

  // ── Org stats ────────────────────────────────────────────────────────────────
  readonly statDepts   = computed(() => this.nodes().filter(n => n.type === 'department').length);
  readonly statSubDepts= computed(() => this.nodes().filter(n => n.type === 'subdepartment').length);
  readonly statDoctors = computed(() => this.nodes().filter(n => n.type === 'doctor').length);
  readonly statStaff   = computed(() => this.nodes().filter(n => n.type === 'staff').length);
  readonly statOnline  = computed(() =>
    this.nodes().filter(n =>
      n.type === 'doctor' && (this.doctors().find(d => d.id === n.entityId)?.online ?? false)
    ).length
  );

  // ── Service group collapse state ─────────────────────────────────────────────
  readonly collapsedServices = signal<Set<string>>(new Set());

  toggleServiceGroup(key: string): void {
    const s = new Set(this.collapsedServices());
    if (s.has(key)) s.delete(key); else s.add(key);
    this.collapsedServices.set(s);
  }

  isServiceCollapsed(key: string): boolean {
    return this.collapsedServices().has(key);
  }

  // ── Feature helpers ───────────────────────────────────────────────────────────
  allFeaturesByService(): ServiceGroup[] {
    const map = new Map<string, ServiceGroup>();
    for (const f of this.allFeatures()) {
      if (!map.has(f.service)) map.set(f.service, { service: f.service, color: f.serviceColor, features: [] });
      map.get(f.service)!.features.push(f);
    }
    return Array.from(map.values());
  }

  hospitalFeaturesByService(): ServiceGroup[] {
    const ids = new Set(this.hospitalFeatureIds());
    const map = new Map<string, ServiceGroup>();
    for (const f of this.allFeatures()) {
      if (!ids.has(f.id)) continue;
      if (!map.has(f.service)) map.set(f.service, { service: f.service, color: f.serviceColor, features: [] });
      map.get(f.service)!.features.push(f);
    }
    return Array.from(map.values());
  }

  hospitalFeatures(): Feature[] {
    const ids = new Set(this.hospitalFeatureIds());
    return this.allFeatures().filter(f => ids.has(f.id));
  }

  doctorFeatureCount(entityId: string): number {
    return this.doctorFeatureMap()[entityId]?.length ?? 0;
  }

  isHospitalFeatureEnabled(featureId: string): boolean {
    return this.hospitalFeatureIds().includes(featureId);
  }

  isDoctorFeatureEnabled(entityId: string, featureId: string): boolean {
    return (this.doctorFeatureMap()[entityId] ?? []).includes(featureId);
  }

  areAllHospitalServiceFeaturesEnabled(grp: ServiceGroup): boolean {
    return grp.features.every(f => this.isHospitalFeatureEnabled(f.id));
  }

  areAllDoctorServiceFeaturesEnabled(grp: ServiceGroup, entityId: string): boolean {
    return grp.features.every(f => this.isDoctorFeatureEnabled(entityId, f.id));
  }

  toggleAllHospitalServiceFeatures(grp: ServiceGroup): void {
    const allOn = this.areAllHospitalServiceFeaturesEnabled(grp);
    const ids = new Set(grp.features.map(f => f.id));
    if (allOn) {
      this.hospitalFeatureIds.set(this.hospitalFeatureIds().filter(id => !ids.has(id)));
      const map = { ...this.doctorFeatureMap() };
      for (const key of Object.keys(map)) map[key] = map[key].filter(id => !ids.has(id));
      this.doctorFeatureMap.set(map);
    } else {
      const toAdd = grp.features.map(f => f.id).filter(id => !this.hospitalFeatureIds().includes(id));
      this.hospitalFeatureIds.set([...this.hospitalFeatureIds(), ...toAdd]);
    }
    this.save();
  }

  toggleAllDoctorServiceFeatures(grp: ServiceGroup, entityId: string): void {
    const allOn = this.areAllDoctorServiceFeaturesEnabled(grp, entityId);
    const map = { ...this.doctorFeatureMap() };
    const current = map[entityId] ?? [];
    const ids = new Set(grp.features.map(f => f.id));
    if (allOn) {
      map[entityId] = current.filter(id => !ids.has(id));
    } else {
      const toAdd = grp.features.map(f => f.id).filter(id => !current.includes(id));
      map[entityId] = [...current, ...toAdd];
    }
    this.doctorFeatureMap.set(map);
    this.save();
  }

  toggleHospitalFeature(featureId: string): void {
    const current = this.hospitalFeatureIds();
    if (current.includes(featureId)) {
      this.hospitalFeatureIds.set(current.filter(id => id !== featureId));
      const map = { ...this.doctorFeatureMap() };
      for (const key of Object.keys(map)) map[key] = map[key].filter(id => id !== featureId);
      this.doctorFeatureMap.set(map);
    } else {
      this.hospitalFeatureIds.set([...current, featureId]);
    }
    this.save();
  }

  toggleDoctorFeature(entityId: string, featureId: string): void {
    const map = { ...this.doctorFeatureMap() };
    const current = map[entityId] ?? [];
    map[entityId] = current.includes(featureId)
      ? current.filter(id => id !== featureId)
      : [...current, featureId];
    this.doctorFeatureMap.set(map);
    this.save();
  }

  // ── Flow state ────────────────────────────────────────────────────────────────
  readonly nodes = signal<FlowNode[]>([]);
  readonly edges = signal<FlowEdge[]>([]);

  readonly zoom        = signal(1);
  readonly panX        = signal(0);
  readonly panY        = signal(0);
  readonly isDragging  = signal(false);
  readonly isPanning   = signal(false);
  readonly linkMode    = signal(false);
  readonly linkSourceId= signal<NodeId | null>(null);
  readonly selectedEdgeId   = signal<EdgeId | null>(null);
  readonly selectedNodeId   = signal<NodeId | null>(null);
  readonly showConfigPanel  = signal(true);
  readonly showNodePicker   = signal(false);
  readonly showAddStaffForm = signal(false);
  readonly showAddDoctorForm= signal(false);

  readonly lastSavedAt = signal<Date | null>(null);

  private readonly ZOOM_MIN  = 0.25;
  private readonly ZOOM_MAX  = 2;
  private readonly ZOOM_STEP = 0.1;
  readonly NODE_WIDTH        = 280;
  readonly NODE_HEIGHT       = 72;
  private readonly ROW_GAP   = 100;
  private readonly COL_GAP   = 320;
  private readonly CANVAS_PADDING = 80;
  private readonly MAX_NODE_HEIGHT = 72;

  private dragState: DragState | null = null;
  private panState: { startX: number; startY: number; startPanX: number; startPanY: number } | null = null;
  private draggedPickerItem: { id: string; type: NodeType } | null = null;

  readonly pickerCategory = signal<'all' | NodeType>('all');
  pickerSearch = '';

  newStaffName  = '';
  newStaffRole  = '';
  newDoctorName = '';
  newDoctorSpec = '';

  readonly zoomPercent = computed(() => Math.round(this.zoom() * 100));

  readonly canvasWidth = computed(() => {
    const ns = this.nodes();
    if (ns.length === 0) return 4000;
    return Math.max(4000, Math.max(...ns.map(n => n.x + this.NODE_WIDTH)) + this.CANVAS_PADDING * 4);
  });

  readonly canvasHeight = computed(() => {
    const ns = this.nodes();
    if (ns.length === 0) return 4000;
    return Math.max(4000, Math.max(...ns.map(n => n.y + this.MAX_NODE_HEIGHT)) + this.CANVAS_PADDING * 4);
  });

  readonly canvasTransform = computed(
    () => `translate(${this.panX()}px, ${this.panY()}px) scale(${this.zoom()})`
  );

  readonly selectedNode = computed(() => {
    const id = this.selectedNodeId();
    return id ? (this.nodes().find(n => n.id === id) ?? null) : null;
  });

  readonly hospitalRoot = computed(() => this.nodes().find(n => n.type === 'hospital') ?? null);

  readonly selectedNodeChildren = computed(() => {
    const node = this.selectedNode();
    if (!node) return [];
    const childIds = new Set(this.edges().filter(e => e.from === node.id).map(e => e.to));
    return this.nodes().filter(n => childIds.has(n.id));
  });

  readonly connectedDepartments = computed(() => {
    const root = this.hospitalRoot();
    if (!root) return [];
    const childIds = new Set(this.edges().filter(e => e.from === root.id).map(e => e.to));
    return this.nodes().filter(n => n.type === 'department' && childIds.has(n.id));
  });

  readonly pickerItems = computed(() => {
    const q = this.pickerSearch.toLowerCase().trim();
    const cat = this.pickerCategory();
    const items: { id: string; name: string; type: NodeType; sub?: string }[] = [];
    if (cat === 'all' || cat === 'department')    this.departments().forEach(d => items.push({ id: d.id, name: d.name, type: 'department', sub: d.code }));
    if (cat === 'all' || cat === 'subdepartment') this.subDepartments().forEach(s => items.push({ id: s.id, name: s.name, type: 'subdepartment' }));
    if (cat === 'all' || cat === 'doctor')        this.doctors().forEach(d => items.push({ id: d.id, name: d.name, type: 'doctor', sub: d.specialization }));
    if (cat === 'all' || cat === 'staff')         this.staff().forEach(s => items.push({ id: s.id, name: s.name, type: 'staff', sub: s.role }));
    if (!q) return items;
    return items.filter(i => i.name.toLowerCase().includes(q) || (i.sub?.toLowerCase().includes(q) ?? false));
  });

  // ── Node helpers ──────────────────────────────────────────────────────────────
  nodeMatIcon(type: NodeType): string {
    switch (type) {
      case 'hospital':     return 'local_hospital';
      case 'department':   return 'business';
      case 'subdepartment':return 'account_tree';
      case 'doctor':       return 'stethoscope';
      case 'staff':        return 'badge';
    }
  }

  nodeColor(type: NodeType): string {
    switch (type) {
      case 'hospital':     return '#0d9488';
      case 'department':   return '#2563eb';
      case 'subdepartment':return '#7c3aed';
      case 'doctor':       return '#0891b2';
      case 'staff':        return '#d97706';
    }
  }

  nodeHeight(_type: NodeType): number { return this.NODE_HEIGHT; }

  nodeLabel(n: FlowNode): string {
    switch (n.type) {
      case 'hospital':     return 'Hospital';
      case 'department':   return 'Department';
      case 'subdepartment':return 'Sub-dept';
      case 'doctor':       return 'Doctor';
      case 'staff':        return 'Staff';
    }
  }

  nodeMeta(n: FlowNode): string {
    const count = this.edges().filter(e => e.from === n.id).length;
    switch (n.type) {
      case 'hospital':      return `${count} Dept${count === 1 ? '' : 's'}`;
      case 'department':    return `${count} child${count === 1 ? '' : 'ren'}`;
      case 'subdepartment': return `${this.descendantCountByType(n.id, 'staff')} Staff`;
      case 'doctor':        return `${count} Staff`;
      case 'staff':         return n.subtitle ?? '—';
    }
  }

  departmentInfo(node: FlowNode): Department | null {
    if (node.type !== 'department') return null;
    return this.departments().find(d => d.id === node.entityId) ?? null;
  }

  doctorInfo(node: FlowNode): Doctor | null {
    if (node.type !== 'doctor') return null;
    return this.doctors().find(d => d.id === node.entityId) ?? null;
  }

  getInitials(name: string): string {
    return name.replace(/^Dr\.\s*/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }

  configPanelTitle(): string {
    const n = this.selectedNode();
    if (!n) return 'Org Overview';
    switch (n.type) {
      case 'hospital':     return 'Hospital Settings';
      case 'department':   return 'Department Details';
      case 'subdepartment':return 'Sub-Dept Details';
      case 'doctor':       return 'Doctor Profile';
      case 'staff':        return 'Staff Profile';
    }
  }

  childTypeLabel(parentType: NodeType): string {
    switch (parentType) {
      case 'hospital':     return 'Departments & Doctors';
      case 'department':   return 'Sub-Depts & Doctors';
      case 'subdepartment':return 'Doctors';
      case 'doctor':       return 'Staff Members';
      default:             return 'Children';
    }
  }

  // ── Optional hierarchy – picker ───────────────────────────────────────────────
  pickerItemDisabled(itemType: NodeType): boolean {
    const sel = this.selectedNode();
    switch (itemType) {
      case 'department':    return false;  // always allowed – auto-connects to hospital root
      case 'subdepartment': return sel?.type !== 'department';
      case 'doctor':        return !sel || !(VALID_PARENT_TYPES['doctor'] as NodeType[]).includes(sel.type);
      case 'staff':         return sel?.type !== 'doctor';
      default:              return true;
    }
  }

  pickerItemHint(itemType: NodeType): string {
    switch (itemType) {
      case 'subdepartment': return 'Select a Department node first';
      case 'doctor':        return 'Select Hospital, Dept or Sub-dept node first';
      case 'staff':         return 'Select a Doctor node first';
      default:              return '';
    }
  }

  setPickerCategory(cat: 'all' | NodeType): void {
    this.pickerCategory.set(cat);
  }

  // ── Quick add child from node button ─────────────────────────────────────────
  quickAddChild(node: FlowNode, ev: Event): void {
    ev.stopPropagation();
    this.selectedNodeId.set(node.id);
    this.showNodePicker.set(true);
    this.pickerSearch = '';
    switch (node.type) {
      case 'hospital':     this.setPickerCategory('department');    break;
      case 'department':   this.setPickerCategory('doctor');        break;
      case 'subdepartment':this.setPickerCategory('doctor');        break;
      case 'doctor':       this.setPickerCategory('staff');         break;
    }
  }

  quickAddLabel(type: NodeType): string {
    switch (type) {
      case 'hospital':     return 'Add Department or Doctor';
      case 'department':   return 'Add Sub-Dept or Doctor';
      case 'subdepartment':return 'Add Doctor';
      case 'doctor':       return 'Add Staff';
      default:             return 'Add';
    }
  }

  // ── Delete selected node ──────────────────────────────────────────────────────
  deleteSelectedNode(): void {
    const id = this.selectedNodeId();
    if (id) this.removeNode(id);
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  @HostListener('document:keydown', ['$event'])
  onKeyDown(ev: KeyboardEvent): void {
    const tag = (ev.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (ev.key === 'Escape') {
      if (this.linkMode()) this.cancelLinkMode();
      else { this.selectedNodeId.set(null); this.selectedEdgeId.set(null); }
      ev.preventDefault();
      return;
    }

    if (ev.key === 'Delete' || ev.key === 'Backspace') {
      const selEdge = this.selectedEdgeId();
      if (selEdge) { this.removeEdgeById(selEdge); ev.preventDefault(); return; }
      const selNode = this.selectedNodeId();
      if (selNode) {
        const node = this.nodes().find(n => n.id === selNode);
        if (node?.type !== 'hospital') { this.removeNode(selNode); ev.preventDefault(); }
      }
    }
  }

  // ── Fit to screen ─────────────────────────────────────────────────────────────
  fitToScreen(): void {
    const ns = this.nodes();
    if (ns.length === 0) return;
    const el = this.canvasRef?.nativeElement;
    if (!el) return;
    const pad = 64;
    const minX = Math.min(...ns.map(n => n.x));
    const minY = Math.min(...ns.map(n => n.y));
    const maxX = Math.max(...ns.map(n => n.x + this.NODE_WIDTH));
    const maxY = Math.max(...ns.map(n => n.y + this.NODE_HEIGHT));
    const contentW = maxX - minX + pad * 2;
    const contentH = maxY - minY + pad * 2;
    const rect = el.getBoundingClientRect();
    const newZoom = this.clampZoom(Math.min(rect.width / contentW, rect.height / contentH, 1));
    this.zoom.set(newZoom);
    this.panX.set((rect.width  - contentW * newZoom) / 2 + (pad - minX) * newZoom);
    this.panY.set((rect.height - contentH * newZoom) / 2 + (pad - minY) * newZoom);
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────────
  zoomIn():    void { this.zoom.set(this.clampZoom(this.zoom() + this.ZOOM_STEP)); }
  zoomOut():   void { this.zoom.set(this.clampZoom(this.zoom() - this.ZOOM_STEP)); }
  zoomReset(): void { this.zoom.set(1); this.panX.set(0); this.panY.set(0); }

  private clampZoom(v: number): number {
    return Math.min(this.ZOOM_MAX, Math.max(this.ZOOM_MIN, Math.round(v * 100) / 100));
  }

  onCanvasWheel(ev: WheelEvent): void {
    ev.preventDefault();
    const el = this.canvasRef?.nativeElement;
    if (!el) return;

    if (ev.ctrlKey || ev.metaKey) {
      const oldZoom = this.zoom();
      const dir = ev.deltaY > 0 ? -1 : 1;
      const newZoom = this.clampZoom(oldZoom + dir * this.ZOOM_STEP);
      if (newZoom === oldZoom) return;
      const rect = el.getBoundingClientRect();
      const cx = (ev.clientX - rect.left - this.panX()) / oldZoom;
      const cy = (ev.clientY - rect.top  - this.panY()) / oldZoom;
      this.panX.set(ev.clientX - rect.left  - cx * newZoom);
      this.panY.set(ev.clientY - rect.top   - cy * newZoom);
      this.zoom.set(newZoom);
    } else {
      this.panX.set(this.panX() - ev.deltaX);
      this.panY.set(this.panY() - ev.deltaY);
    }
  }

  // ── Node drag ─────────────────────────────────────────────────────────────────
  onNodeMouseDown(ev: MouseEvent, node: FlowNode): void {
    if ((ev.target as HTMLElement).closest('.n-add, .node-action')) return;
    ev.preventDefault();
    this.dragState = { nodeId: node.id, startMouseX: ev.clientX, startMouseY: ev.clientY, startNodeX: node.x, startNodeY: node.y, moved: false };
  }

  onCanvasMouseDown(ev: MouseEvent): void {
    if ((ev.target as HTMLElement).closest('.node')) return;
    ev.preventDefault();
    this.panState = { startX: ev.clientX, startY: ev.clientY, startPanX: this.panX(), startPanY: this.panY() };
  }

  @HostListener('document:mousemove', ['$event'])
  onDocMouseMove(ev: MouseEvent): void {
    if (this.panState) {
      const dx = ev.clientX - this.panState.startX;
      const dy = ev.clientY - this.panState.startY;
      if (!this.isPanning() && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) this.isPanning.set(true);
      if (this.isPanning()) { this.panX.set(this.panState.startPanX + dx); this.panY.set(this.panState.startPanY + dy); }
      return;
    }
    if (!this.dragState) return;
    const dx = (ev.clientX - this.dragState.startMouseX) / this.zoom();
    const dy = (ev.clientY - this.dragState.startMouseY) / this.zoom();
    if (!this.dragState.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) { this.dragState.moved = true; this.isDragging.set(true); }
    if (this.dragState.moved) {
      const newX = Math.max(0, this.dragState.startNodeX + dx);
      const newY = Math.max(0, this.dragState.startNodeY + dy);
      this.nodes.set(this.nodes().map(n => n.id === this.dragState!.nodeId ? { ...n, x: newX, y: newY } : n));
      this.edges.set([...this.edges()]);
    }
  }

  @HostListener('document:mouseup')
  onDocMouseUp(): void {
    if (this.dragState?.moved) this.save();
    this.dragState = null;
    this.panState  = null;
    setTimeout(() => { this.isDragging.set(false); this.isPanning.set(false); });
  }

  // ── Picker drag-and-drop ─────────────────────────────────────────────────────
  onPickerDragStart(ev: DragEvent, item: { id: string; type: NodeType; name: string }): void {
    this.draggedPickerItem = { id: item.id, type: item.type };
    ev.dataTransfer!.effectAllowed = 'copy';
    ev.dataTransfer!.setData('text/plain', item.name);
  }

  onCanvasDragOver(ev: DragEvent): void {
    if (this.draggedPickerItem) { ev.preventDefault(); ev.dataTransfer!.dropEffect = 'copy'; }
  }

  onCanvasDrop(ev: DragEvent): void {
    ev.preventDefault();
    if (!this.draggedPickerItem) return;
    const el = this.canvasRef?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    this.dropNodeAtPosition(this.draggedPickerItem, (ev.clientX - rect.left - this.panX()) / this.zoom(), (ev.clientY - rect.top - this.panY()) / this.zoom());
    this.draggedPickerItem = null;
  }

  private buildDroppedNode(item: { id: string; type: NodeType }, x: number, y: number): FlowNode | null {
    const uid = `${item.type}_${item.id}_${Math.random().toString(16).slice(2)}`;
    switch (item.type) {
      case 'department': {
        const e = this.departments().find(d => d.id === item.id);
        return e ? { id: uid, type: 'department', entityId: item.id, title: e.name, subtitle: e.code, x, y } : null;
      }
      case 'subdepartment': {
        const e = this.subDepartments().find(s => s.id === item.id);
        return e ? { id: uid, type: 'subdepartment', entityId: item.id, title: e.name, subtitle: 'Sub-department', x, y } : null;
      }
      case 'doctor': {
        const e = this.doctors().find(d => d.id === item.id);
        return e ? { id: uid, type: 'doctor', entityId: item.id, title: e.name, subtitle: e.specialization, x, y } : null;
      }
      case 'staff': {
        const e = this.staff().find(s => s.id === item.id);
        return e ? { id: uid, type: 'staff', entityId: item.id, title: e.name, subtitle: e.role, x, y } : null;
      }
      default: return null;
    }
  }

  private resolveDropParentId(nodeType: NodeType, sel: FlowNode | null): NodeId | undefined {
    switch (nodeType) {
      case 'department':    return this.hospitalRoot()?.id;
      case 'subdepartment': return sel?.type === 'department' ? sel.id : undefined;
      case 'doctor':        return sel && (VALID_PARENT_TYPES['doctor'] as NodeType[]).includes(sel.type) ? sel.id : undefined;
      case 'staff':         return sel?.type === 'doctor' ? sel.id : undefined;
      default:              return undefined;
    }
  }

  private dropNodeAtPosition(item: { id: string; type: NodeType }, x: number, y: number): void {
    const node = this.buildDroppedNode(item, x, y);
    if (!node) return;
    const parentId = this.resolveDropParentId(item.type, this.selectedNode());
    this.nodes.set([...this.nodes(), node]);
    if (parentId) this.addEdge(parentId, node.id);
    this.selectedNodeId.set(node.id);
    this.save();
  }

  // ── Add from picker (click) ───────────────────────────────────────────────────
  addFromPicker(item: { id: string; type: NodeType }): void {
    const sel = this.selectedNode();
    switch (item.type) {
      case 'department':    this.addDepartmentNode(item.id); break;
      case 'subdepartment': if (sel?.type === 'department')  this.addSubDepartmentNode(item.id); break;
      case 'doctor':        if (sel && (VALID_PARENT_TYPES['doctor'] as NodeType[]).includes(sel.type)) this.addDoctorNode(item.id); break;
      case 'staff':         if (sel?.type === 'doctor')      this.addStaffNode(item.id); break;
    }
  }

  toggleNodePicker(): void {
    this.showNodePicker.set(!this.showNodePicker());
    if (this.showNodePicker()) { this.pickerSearch = ''; this.pickerCategory.set('all'); }
  }

  // ── Add Staff / Doctor forms ──────────────────────────────────────────────────
  toggleAddStaffForm(): void {
    this.showAddStaffForm.set(!this.showAddStaffForm());
    if (this.showAddStaffForm()) { this.newStaffName = ''; this.newStaffRole = ''; }
  }

  createNewStaff(): void {
    const name = this.newStaffName.trim();
    if (!name) return;
    const id = `s_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
    this.staff.set([...this.staff(), { id, name, role: this.newStaffRole.trim() || 'General' }]);
    this.showAddStaffForm.set(false);
    this.newStaffName = '';
    this.newStaffRole = '';
  }

  toggleAddDoctorForm(): void {
    this.showAddDoctorForm.set(!this.showAddDoctorForm());
    if (this.showAddDoctorForm()) { this.newDoctorName = ''; this.newDoctorSpec = ''; }
  }

  createNewDoctor(): void {
    const name = this.newDoctorName.trim();
    if (!name) return;
    const id = `d_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
    this.doctors.set([...this.doctors(), { id, name, specialization: this.newDoctorSpec.trim() || 'General', online: false }]);
    this.showAddDoctorForm.set(false);
    this.newDoctorName = '';
    this.newDoctorSpec = '';
  }

  // ── Link mode ─────────────────────────────────────────────────────────────────
  toggleLinkMode(): void {
    const entering = !this.linkMode();
    this.linkMode.set(entering);
    this.linkSourceId.set(null);
    if (entering) this.selectedEdgeId.set(null);
  }

  cancelLinkMode(): void { this.linkMode.set(false); this.linkSourceId.set(null); }

  selectEdge(edgeId: EdgeId): void {
    this.selectedEdgeId.set(this.selectedEdgeId() === edgeId ? null : edgeId);
  }

  removeEdgeById(edgeId: EdgeId): void {
    this.edges.set(this.edges().filter(e => e.id !== edgeId));
    this.selectedEdgeId.set(null);
    this.save();
  }

  edgeMidpoint(e: FlowEdge): { x: number; y: number } | null {
    const from = this.nodes().find(n => n.id === e.from);
    const to   = this.nodes().find(n => n.id === e.to);
    if (!from || !to) return null;
    return {
      x: (from.x + this.NODE_WIDTH / 2 + to.x + this.NODE_WIDTH / 2) / 2,
      y: (from.y + this.NODE_HEIGHT + to.y) / 2,
    };
  }

  // ── Selection ─────────────────────────────────────────────────────────────────
  selectNode(id: NodeId | null): void {
    if (this.isDragging()) return;
    if (this.linkMode() && id) {
      if (!this.linkSourceId()) { this.linkSourceId.set(id); return; }
      const src = this.linkSourceId()!;
      if (src !== id && !this.edges().some(e => (e.from === src && e.to === id) || (e.from === id && e.to === src))) {
        this.addEdge(src, id);
        this.save();
      }
      this.linkMode.set(false);
      this.linkSourceId.set(null);
      return;
    }
    this.selectedEdgeId.set(null);
    this.selectedNodeId.set(id);
    if (id) this.showConfigPanel.set(true);
  }

  toggleConfigPanel(): void { this.showConfigPanel.set(!this.showConfigPanel()); }

  // ── Node creation helpers ─────────────────────────────────────────────────────
  addDepartmentNode(deptId: string): void {
    const dept = this.departments().find(d => d.id === deptId);
    if (!dept) return;
    const id   = `dept_${deptId}_${Math.random().toString(16).slice(2)}`;
    const root = this.hospitalRoot();
    const existingDepts = this.connectedDepartments().length;
    const node: FlowNode = {
      id, type: 'department', entityId: deptId, title: dept.name, subtitle: dept.code,
      x: (root?.x ?? this.CANVAS_PADDING) + existingDepts * this.COL_GAP,
      y: (root?.y ?? this.CANVAS_PADDING) + this.MAX_NODE_HEIGHT + this.ROW_GAP,
    };
    this.nodes.set([...this.nodes(), node]);
    if (root) this.addEdge(root.id, node.id);
    this.selectedNodeId.set(node.id);
    this.save();
  }

  addSubDepartmentNode(subId: string): void {
    const sub    = this.subDepartments().find(s => s.id === subId);
    const parent = this.selectedNode();
    if (!sub || parent?.type !== 'department') return;
    const existingChildren = this.edges().filter(e => e.from === parent.id).length;
    const id = `sub_${subId}_${Math.random().toString(16).slice(2)}`;
    const node: FlowNode = {
      id, type: 'subdepartment', entityId: subId, title: sub.name, subtitle: 'Sub-department',
      x: parent.x + (existingChildren - 0.5) * this.COL_GAP * 0.6,
      y: parent.y + this.MAX_NODE_HEIGHT + this.ROW_GAP,
    };
    this.nodes.set([...this.nodes(), node]);
    this.addEdge(parent.id, node.id);
    this.selectedNodeId.set(node.id);
    this.save();
  }

  addDoctorNode(doctorId: string): void {
    const doc    = this.doctors().find(d => d.id === doctorId);
    const parent = this.selectedNode();
    const validParents = VALID_PARENT_TYPES['doctor'] as NodeType[];
    if (!doc || !parent || !validParents.includes(parent.type)) return;
    const existingChildren = this.edges().filter(e => e.from === parent.id).length;
    const id = `doctor_${doctorId}_${Math.random().toString(16).slice(2)}`;
    const node: FlowNode = {
      id, type: 'doctor', entityId: doctorId, title: doc.name, subtitle: doc.specialization,
      x: parent.x + (existingChildren - 0.5) * this.COL_GAP * 0.5,
      y: parent.y + this.MAX_NODE_HEIGHT + this.ROW_GAP,
    };
    this.nodes.set([...this.nodes(), node]);
    this.addEdge(parent.id, node.id);
    this.selectedNodeId.set(node.id);
    this.save();
  }

  addStaffNode(staffId: string): void {
    const s      = this.staff().find(st => st.id === staffId);
    const parent = this.selectedNode();
    if (!s || parent?.type !== 'doctor') return;
    const existingChildren = this.edges().filter(e => e.from === parent.id).length;
    const id = `staff_${staffId}_${Math.random().toString(16).slice(2)}`;
    const node: FlowNode = {
      id, type: 'staff', entityId: staffId, title: s.name, subtitle: s.role,
      x: parent.x + (existingChildren - 0.5) * this.COL_GAP * 0.5,
      y: parent.y + this.MAX_NODE_HEIGHT + this.ROW_GAP,
    };
    this.nodes.set([...this.nodes(), node]);
    this.addEdge(parent.id, node.id);
    this.selectedNodeId.set(node.id);
    this.save();
  }

  removeNode(nodeId: NodeId): void {
    const node = this.nodes().find(n => n.id === nodeId);
    if (!node || node.type === 'hospital') return;
    const toRemove = new Set<NodeId>();
    const queue = [nodeId];
    while (queue.length) {
      const cur = queue.shift()!;
      toRemove.add(cur);
      this.edges().filter(e => e.from === cur).forEach(e => { if (!toRemove.has(e.to)) queue.push(e.to); });
    }
    this.nodes.set(this.nodes().filter(n => !toRemove.has(n.id)));
    this.edges.set(this.edges().filter(e => !toRemove.has(e.from) && !toRemove.has(e.to)));
    if (toRemove.has(this.selectedNodeId() ?? '')) this.selectedNodeId.set(null);
    this.save();
  }

  removeConnection(from: NodeId, to: NodeId): void {
    this.edges.set(this.edges().filter(e => !(e.from === from && e.to === to)));
    this.save();
  }

  addEdge(from: NodeId, to: NodeId): void {
    if (this.edges().some(e => e.from === from && e.to === to)) return;
    const id = `e_${from}_${to}_${Math.random().toString(16).slice(2)}`;
    this.edges.set([...this.edges(), { id, from, to }]);
  }

  // ── Auto-arrange ──────────────────────────────────────────────────────────────
  autoArrange(): void { this.recomputeLayout(); this.save(); }

  private buildChildrenMap(edges: FlowEdge[]): Map<NodeId, NodeId[]> {
    const map = new Map<NodeId, NodeId[]>();
    for (const e of edges) {
      const list = map.get(e.from) ?? [];
      list.push(e.to);
      map.set(e.from, list);
    }
    return map;
  }

  private computeSubtreeWidths(rootId: NodeId, childrenMap: Map<NodeId, NodeId[]>): Map<NodeId, number> {
    const cache = new Map<NodeId, number>();
    const compute = (nid: NodeId): number => {
      if (cache.has(nid)) return cache.get(nid)!;
      const children = childrenMap.get(nid) ?? [];
      const total = children.length === 0 ? 1 : children.reduce((s, c) => s + compute(c), 0);
      cache.set(nid, total);
      return total;
    };
    compute(rootId);
    return cache;
  }

  private assignPositions(rootId: NodeId, childrenMap: Map<NodeId, NodeId[]>, widthCache: Map<NodeId, number>): Map<NodeId, { x: number; y: number }> {
    const posMap = new Map<NodeId, { x: number; y: number }>();
    const assign = (nid: NodeId, row: number, leftSlot: number): void => {
      const w = widthCache.get(nid) ?? 1;
      posMap.set(nid, {
        x: this.CANVAS_PADDING + (leftSlot + w / 2 - 0.5) * this.COL_GAP,
        y: this.CANVAS_PADDING + row * (this.MAX_NODE_HEIGHT + this.ROW_GAP),
      });
      let childLeft = leftSlot;
      for (const cid of (childrenMap.get(nid) ?? [])) {
        assign(cid, row + 1, childLeft);
        childLeft += widthCache.get(cid) ?? 1;
      }
    };
    assign(rootId, 0, 0);
    return posMap;
  }

  private recomputeLayout(): void {
    const nodes = this.nodes();
    if (nodes.length === 0) return;
    const root = nodes.find(n => n.type === 'hospital');
    if (!root) return;
    const childrenMap = this.buildChildrenMap(this.edges());
    const widthCache  = this.computeSubtreeWidths(root.id, childrenMap);
    const posMap      = this.assignPositions(root.id, childrenMap, widthCache);
    const positioned  = new Set(posMap.keys());
    let orphanX = this.CANVAS_PADDING;
    for (const n of nodes) {
      if (!positioned.has(n.id)) {
        posMap.set(n.id, { x: orphanX, y: this.CANVAS_PADDING + 5 * (this.MAX_NODE_HEIGHT + this.ROW_GAP) });
        orphanX += this.COL_GAP;
      }
    }
    this.nodes.set(nodes.map(n => { const p = posMap.get(n.id); return p ? { ...n, ...p } : n; }));
    this.edges.set([...this.edges()]);
  }

  // ── Edge geometry ─────────────────────────────────────────────────────────────
  edgePath(e: FlowEdge): string {
    const from = this.nodes().find(n => n.id === e.from);
    const to   = this.nodes().find(n => n.id === e.to);
    if (!from || !to) return '';
    const vertGap = to.y - (from.y + this.NODE_HEIGHT);
    if (vertGap > 30) {
      const fx = from.x + this.NODE_WIDTH / 2, fy = from.y + this.NODE_HEIGHT;
      const tx = to.x   + this.NODE_WIDTH / 2, ty = to.y;
      const dy = vertGap * 0.45;
      return `M ${fx} ${fy} C ${fx} ${fy + dy}, ${tx} ${ty - dy}, ${tx} ${ty}`;
    }
    const toRight = to.x >= from.x;
    const fx = toRight ? from.x + this.NODE_WIDTH : from.x;
    const fy = from.y + this.NODE_HEIGHT / 2;
    const tx = toRight ? to.x : to.x + this.NODE_WIDTH;
    const ty = to.y + this.NODE_HEIGHT / 2;
    const dx = Math.max(50, Math.abs(tx - fx) * 0.4);
    return `M ${fx} ${fy} C ${toRight ? fx + dx : fx - dx} ${fy}, ${toRight ? tx - dx : tx + dx} ${ty}, ${tx} ${ty}`;
  }

  // ── Persistence ───────────────────────────────────────────────────────────────
  private readonly storageKey = 'adminHospitalFlow';

  save(): void {
    localStorage.setItem(this.storageKey, JSON.stringify({
      nodes: this.nodes(), edges: this.edges(),
      hospitalFeatureIds: this.hospitalFeatureIds(), doctorFeatureMap: this.doctorFeatureMap(),
    }));
    this.lastSavedAt.set(new Date());
  }

  load(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (Array.isArray(p?.nodes))  this.nodes.set(p.nodes);
      if (Array.isArray(p?.edges))  this.edges.set(p.edges);
      if (Array.isArray(p?.hospitalFeatureIds))            this.hospitalFeatureIds.set(p.hospitalFeatureIds);
      if (p?.doctorFeatureMap && typeof p.doctorFeatureMap === 'object') this.doctorFeatureMap.set(p.doctorFeatureMap);
    } catch { /* ignore */ }
  }

  resetWithConfirm(): void {
    const dialogRef = this.dialogService.openConfirmationDialog({
      title: 'Reset Flow',
      message: 'This will remove all departments, doctors, and staff from the canvas. This action cannot be undone.',
      confirmText: 'Reset',
      cancelText: 'Cancel',
      icon: 'delete_forever',
      showConfirm: true,
      showCancel: true,
    });
    dialogRef.afterClosed().subscribe((result: unknown) => {
      const confirmed = result === 'confirm' || (result as { action?: string })?.action === 'confirm' || result === true;
      if (confirmed) this.reset();
    });
  }

  reset(): void {
    const h = this.hospitals()[0];
    this.nodes.set([{ id: 'hospital_root', type: 'hospital', entityId: h?.id ?? 'h1', title: h?.name ?? 'Hospital', subtitle: 'Root', x: 0, y: 0 }]);
    this.edges.set([]);
    this.hospitalFeatureIds.set(['appointments', 'chat', 'prescriptions', 'patient-mgmt', 'reports', 'exercise-plans', 'diet-basic', 'progress-tracking', 'assessment']);
    this.doctorFeatureMap.set({});
    this.selectedNodeId.set('hospital_root');
    localStorage.removeItem(this.storageKey);
    this.recomputeLayout();
    this.lastSavedAt.set(null);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const user = (this.authService as any).getCurrentUser?.() as any;
    this.hospitalPublicId = user?.publicId ?? user?.userId ?? null;
    this.load();
    if (!this.nodes().some(n => n.type === 'hospital')) {
      const h = this.hospitals()[0];
      this.nodes.set([{ id: 'hospital_root', type: 'hospital', entityId: h?.id ?? 'h1', title: h?.name ?? 'Hospital', subtitle: 'Root', x: 0, y: 0 }, ...this.nodes()]);
      this.recomputeLayout();
    }
    this.save();
    this.loadApiData();
  }

  private loadApiData(): void {
    const deptObs = this.hospitalPublicId
      ? this.departmentService.getDepartmentsByHospital(this.hospitalPublicId).pipe(catchError(() => of([])))
      : this.departmentService.getDepartments().pipe(catchError(() => of([])));

    const staffObs = this.hospitalPublicId
      ? this.staffService.getStaffByHospital(this.hospitalPublicId).pipe(catchError(() => of({ staffDetails: [] })))
      : this.staffService.getStaff().pipe(catchError(() => of({ staffDetails: [] })));

    forkJoin({
      departments: deptObs,
      staff: staffObs
    }).pipe(takeUntil(this.destroy$))
      .subscribe(({ departments, staff }) => {
        if (departments.length > 0) {
          const mapped = departments.map((d, i) => ({
            id: `dep${d.departmentId ?? i}`,
            name: d.name,
            code: `DEPT-${(d.name ?? '').substring(0, 3).toUpperCase()}-${(d.departmentId ?? i).toString().padStart(2, '0')}`,
            headName: '',
            active: d.active !== false
          } as Department));
          this.departments.set(mapped);
        }
        const staffList = (staff as { staffDetails?: any[] }).staffDetails ?? [];
        if (staffList.length > 0) {
          const mapped = staffList.map((s: any) => ({
            id: `s${s.staffId ?? Math.random()}`,
            name: `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim(),
            role: (s.roles ?? []).join(', ') || s.specialization || 'Staff'
          } as StaffMember));
          this.staff.set(mapped);
        }
      });
  }

  // ── Private helpers ───────────────────────────────────────────────────────────
  private descendantCountByType(startId: NodeId, type: NodeType): number {
    const nodeById = new Map(this.nodes().map(n => [n.id, n]));
    const seen = new Set<NodeId>();
    const q = [startId];
    let count = 0;
    while (q.length) {
      const cur = q.shift()!;
      if (seen.has(cur)) continue;
      seen.add(cur);
      for (const e of this.edges()) {
        if (e.from !== cur) continue;
        const child = nodeById.get(e.to);
        if (!child) continue;
        if (child.type === type) count++;
        q.push(child.id);
      }
    }
    return count;
  }

  private readonly destroy$ = new Subject<void>();

  private hospitalPublicId: string | null = null;

  constructor(
    private readonly dialogService: DialogboxService,
    private readonly departmentService: DepartmentService,
    private readonly staffService: StaffService,
    private readonly authService: AuthService,
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
