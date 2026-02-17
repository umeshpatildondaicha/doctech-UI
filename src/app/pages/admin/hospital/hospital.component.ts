import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreadcrumbItem, PageComponent } from '@lk/core';

type NodeId = string;
type EdgeId = string;

type NodeType = 'hospital' | 'department' | 'subdepartment' | 'doctor' | 'staff';

interface Hospital {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  headName: string;
  active: boolean;
}

interface SubDepartment {
  id: string;
  name: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization?: string;
  avatar?: string;
  online?: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  role?: string;
}

interface Feature {
  id: string;
  name: string;
  icon: string;
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

interface FlowEdge {
  id: EdgeId;
  from: NodeId;
  to: NodeId;
}

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
    MatTooltipModule
  ],
  templateUrl: './hospital.component.html',
  styleUrl: './hospital.component.scss'
})
export class HospitalComponent implements OnInit {
  @ViewChild('canvasEl', { static: true }) canvasRef!: ElementRef<HTMLElement>;

  breadcrumb: BreadcrumbItem[] = [
    { label: 'Admin', route: '/admin-dashboard', icon: 'admin_panel_settings' },
    { label: 'Hospital', route: '/admin/hospital', icon: 'apartment', isActive: true }
  ];

  // Seed data
  readonly hospitals = signal<Hospital[]>([{ id: 'h1', name: 'Shree Clinic Hospital' }]);

  readonly departments = signal<Department[]>([
    { id: 'dep1', name: 'Cardiology Dept', code: 'DEPT-CRD-01', headName: 'Dr. Aris Thorne', active: true },
    { id: 'dep2', name: 'General Medicine Dept', code: 'DEPT-GEN-01', headName: 'Dr. Amit Deshmukh', active: true },
    { id: 'dep3', name: 'Pediatrics Dept', code: 'DEPT-PED-01', headName: 'Dr. Neha Rao', active: true },
    { id: 'dep4', name: 'Orthopedics Dept', code: 'DEPT-ORT-01', headName: 'Dr. Sameer Kulkarni', active: false }
  ]);

  readonly subDepartments = signal<SubDepartment[]>([
    { id: 'sub1', name: 'Surgery Sub-Dept' },
    { id: 'sub2', name: 'Diagnostics Sub-Dept' },
    { id: 'sub3', name: 'Rehab Sub-Dept' }
  ]);

  readonly doctors = signal<Doctor[]>([
    { id: 'd1', name: 'Dr. Amit Deshmukh', specialization: 'General Medicine', online: true },
    { id: 'd2', name: 'Dr. Neha Rao', specialization: 'Pediatrics', online: true },
    { id: 'd3', name: 'Dr. Sameer Kulkarni', specialization: 'Orthopedics', online: false }
  ]);

  readonly staff = signal<StaffMember[]>([
    { id: 's1', name: 'Aarav Kulkarni', role: 'Reception' },
    { id: 's2', name: 'Meera Iyer', role: 'Nurse' },
    { id: 's3', name: 'Kabir Sharma', role: 'Lab Tech' },
    { id: 's4', name: 'Anaya Singh', role: 'Billing' },
    { id: 's5', name: 'Rohan Patel', role: 'Pharmacist' }
  ]);

  // Available features
  readonly allFeatures = signal<Feature[]>([
    { id: 'feat_appointments', name: 'Appointments', icon: 'event' },
    { id: 'feat_billing', name: 'Billing', icon: 'receipt_long' },
    { id: 'feat_lab_reports', name: 'Lab Reports', icon: 'biotech' },
    { id: 'feat_pharmacy', name: 'Pharmacy', icon: 'medication' },
    { id: 'feat_telemedicine', name: 'Telemedicine', icon: 'videocam' },
    { id: 'feat_emr', name: 'EMR', icon: 'description' },
    { id: 'feat_insurance', name: 'Insurance', icon: 'health_and_safety' },
    { id: 'feat_inventory', name: 'Inventory', icon: 'inventory_2' }
  ]);

  // Feature IDs enabled for the hospital
  readonly hospitalFeatureIds = signal<string[]>([
    'feat_appointments', 'feat_billing', 'feat_lab_reports', 'feat_pharmacy'
  ]);

  // Feature IDs per doctor (keyed by doctor entityId)
  readonly doctorFeatureMap = signal<Record<string, string[]>>({});

  readonly hospitalFeatureCount = computed(() => this.hospitalFeatureIds().length);

  hospitalFeatures(): Feature[] {
    const ids = new Set(this.hospitalFeatureIds());
    return this.allFeatures().filter(f => ids.has(f.id));
  }

  doctorFeatureCount(entityId: string): number {
    return this.doctorFeatureMap()[entityId]?.length ?? 0;
  }

  doctorFeatures(entityId: string): Feature[] {
    const ids = new Set(this.doctorFeatureMap()[entityId] ?? []);
    return this.allFeatures().filter(f => ids.has(f.id));
  }

  isHospitalFeatureEnabled(featureId: string): boolean {
    return this.hospitalFeatureIds().includes(featureId);
  }

  isDoctorFeatureEnabled(entityId: string, featureId: string): boolean {
    return (this.doctorFeatureMap()[entityId] ?? []).includes(featureId);
  }

  toggleHospitalFeature(featureId: string): void {
    const current = this.hospitalFeatureIds();
    if (current.includes(featureId)) {
      this.hospitalFeatureIds.set(current.filter(id => id !== featureId));
      // Also remove from all doctors who had this feature
      const map = { ...this.doctorFeatureMap() };
      for (const key of Object.keys(map)) {
        map[key] = map[key].filter(id => id !== featureId);
      }
      this.doctorFeatureMap.set(map);
    } else {
      this.hospitalFeatureIds.set([...current, featureId]);
    }
    this.save();
  }

  toggleDoctorFeature(entityId: string, featureId: string): void {
    const map = { ...this.doctorFeatureMap() };
    const current = map[entityId] ?? [];
    if (current.includes(featureId)) {
      map[entityId] = current.filter(id => id !== featureId);
    } else {
      map[entityId] = [...current, featureId];
    }
    this.doctorFeatureMap.set(map);
    this.save();
  }

  readonly nodes = signal<FlowNode[]>([]);
  readonly edges = signal<FlowEdge[]>([]);

  // Zoom
  readonly zoom = signal(1);
  private readonly ZOOM_MIN = 0.25;
  private readonly ZOOM_MAX = 2;
  private readonly ZOOM_STEP = 0.1;
  readonly zoomPercent = computed(() => Math.round(this.zoom() * 100));

  // Layout constants
  readonly NODE_WIDTH = 280;
  readonly NODE_HEIGHT = 72;
  private readonly ROW_GAP = 100;
  private readonly COL_GAP = 300;
  private readonly CANVAS_PADDING = 80;

  nodeHeight(_type: NodeType): number {
    return this.NODE_HEIGHT;
  }

  private readonly MAX_NODE_HEIGHT = 72;

  // SVG canvas size (auto-grows to fit all nodes)
  readonly canvasWidth = computed(() => {
    const ns = this.nodes();
    if (ns.length === 0) return 4000;
    const maxX = Math.max(...ns.map(n => n.x + this.NODE_WIDTH));
    return Math.max(4000, maxX + this.CANVAS_PADDING * 4);
  });

  readonly canvasHeight = computed(() => {
    const ns = this.nodes();
    if (ns.length === 0) return 4000;
    const maxY = Math.max(...ns.map(n => n.y + this.MAX_NODE_HEIGHT));
    return Math.max(4000, maxY + this.CANVAS_PADDING * 4);
  });

  // Pan + Zoom (no scrollbars)
  readonly panX = signal(0);
  readonly panY = signal(0);
  readonly canvasTransform = computed(
    () => `translate(${this.panX()}px, ${this.panY()}px) scale(${this.zoom()})`
  );

  // Drag state (node drag vs canvas pan)
  private dragState: DragState | null = null;
  readonly isDragging = signal(false);
  private panState: { startX: number; startY: number; startPanX: number; startPanY: number } | null = null;
  readonly isPanning = signal(false);

  // Node picker panel (replaces individual add buttons)
  readonly showNodePicker = signal(false);
  readonly pickerCategory = signal<'all' | 'department' | 'subdepartment' | 'doctor' | 'staff'>('all');
  pickerSearch = '';

  readonly pickerItems = computed(() => {
    const q = this.pickerSearch.toLowerCase().trim();
    const cat = this.pickerCategory();
    const items: { id: string; name: string; type: NodeType; icon: string; sub?: string }[] = [];

    if (cat === 'all' || cat === 'department') {
      for (const d of this.departments()) {
        items.push({ id: d.id, name: d.name, type: 'department', icon: 'assets/flow-icons/dept.svg', sub: d.code });
      }
    }
    if (cat === 'all' || cat === 'subdepartment') {
      for (const s of this.subDepartments()) {
        items.push({ id: s.id, name: s.name, type: 'subdepartment', icon: 'assets/flow-icons/sub-dept.svg' });
      }
    }
    if (cat === 'all' || cat === 'doctor') {
      for (const d of this.doctors()) {
        items.push({ id: d.id, name: d.name, type: 'doctor', icon: 'assets/flow-icons/drmale.svg', sub: d.specialization });
      }
    }
    if (cat === 'all' || cat === 'staff') {
      for (const s of this.staff()) {
        items.push({ id: s.id, name: s.name, type: 'staff', icon: 'assets/flow-icons/staff.svg', sub: s.role });
      }
    }

    if (!q) return items;
    return items.filter(i => i.name.toLowerCase().includes(q) || (i.sub?.toLowerCase().includes(q) ?? false));
  });

  // Add new staff form
  readonly showAddStaffForm = signal(false);
  newStaffName = '';
  newStaffRole = '';

  // Linking mode (manual edge creation)
  readonly linkMode = signal(false);
  readonly linkSourceId = signal<NodeId | null>(null);

  // Selected edge (for deletion on canvas)
  readonly selectedEdgeId = signal<EdgeId | null>(null);

  // Selection
  readonly selectedNodeId = signal<NodeId | null>(null);
  readonly showConfigPanel = signal(true);

  readonly selectedNode = computed(() => {
    const id = this.selectedNodeId();
    return id ? this.nodes().find((n) => n.id === id) ?? null : null;
  });

  readonly hospitalRoot = computed(() => this.nodes().find((n) => n.type === 'hospital') ?? null);

  readonly connectedDepartments = computed(() => {
    const root = this.hospitalRoot();
    if (!root) return [];
    const childIds = new Set(this.edges().filter((e) => e.from === root.id).map((e) => e.to));
    return this.nodes().filter((n) => n.type === 'department' && childIds.has(n.id));
  });

  readonly connectedDoctorsForSelectedDept = computed(() => {
    const node = this.selectedNode();
    if (!node || node.type !== 'department') return [];
    const childIds = new Set(this.edges().filter((e) => e.from === node.id).map((e) => e.to));
    return this.nodes().filter((n) => n.type === 'doctor' && childIds.has(n.id));
  });

  readonly connectedStaffForSelectedDoctor = computed(() => {
    const node = this.selectedNode();
    if (!node || node.type !== 'doctor') return [];
    const staffIds = new Set(this.edges().filter((e) => e.from === node.id).map((e) => e.to));
    return this.nodes().filter((n) => n.type === 'staff' && staffIds.has(n.id));
  });

  readonly selectedNodeChildren = computed(() => {
    const node = this.selectedNode();
    if (!node) return [];
    const childIds = new Set(this.edges().filter((e) => e.from === node.id).map((e) => e.to));
    return this.nodes().filter((n) => childIds.has(n.id));
  });

  childTypeLabel(parentType: NodeType): string {
    switch (parentType) {
      case 'hospital': return 'Departments';
      case 'department': return 'Sub-departments';
      case 'subdepartment': return 'Doctors';
      case 'doctor': return 'Staff';
      default: return 'Children';
    }
  }

  nodeLabel(n: FlowNode): string {
    switch (n.type) {
      case 'hospital': return 'Hospital';
      case 'department': return 'Department';
      case 'subdepartment': return 'Sub-dept';
      case 'doctor': return 'Doctor';
      case 'staff': return 'Staff';
    }
  }

  nodeMeta(n: FlowNode): string {
    const count = this.edges().filter((e) => e.from === n.id).length;
    switch (n.type) {
      case 'hospital': return `${count} Dept${count !== 1 ? 's' : ''}`;
      case 'department': return `${count} Sub-dept${count !== 1 ? 's' : ''}`;
      case 'subdepartment': {
        const staffCount = this.descendantCountByType(n.id, 'staff');
        return `${staffCount} Staff Member${staffCount !== 1 ? 's' : ''}`;
      }
      case 'doctor': return `${count} Staff`;
      case 'staff': return n.subtitle ?? '—';
    }
  }

  departmentInfo(node: FlowNode): Department | null {
    if (node.type !== 'department') return null;
    return this.departments().find((d) => d.id === node.entityId) ?? null;
  }

  doctorInfo(node: FlowNode): Doctor | null {
    if (node.type !== 'doctor') return null;
    return this.doctors().find((d) => d.id === node.entityId) ?? null;
  }

  private descendantCountByType(startId: NodeId, type: NodeType): number {
    const edges = this.edges();
    const nodes = this.nodes();
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const seen = new Set<NodeId>();
    const q: NodeId[] = [startId];
    let count = 0;
    while (q.length) {
      const cur = q.shift()!;
      if (seen.has(cur)) continue;
      seen.add(cur);
      for (const e of edges) {
        if (e.from !== cur) continue;
        const child = nodeById.get(e.to);
        if (!child) continue;
        if (child.type === type) count += 1;
        q.push(child.id);
      }
    }
    return count;
  }

  getInitials(name: string): string {
    return name
      .replace(/^Dr\.\s*/i, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  nodeIcon(type: NodeType): string {
    switch (type) {
      case 'hospital': return 'assets/flow-icons/hospital.svg';
      case 'department': return 'assets/flow-icons/dept.svg';
      case 'subdepartment': return 'assets/flow-icons/sub-dept.svg';
      case 'doctor': return 'assets/flow-icons/drmale.svg';
      case 'staff': return 'assets/flow-icons/staff.svg';
    }
  }

  nodeColor(type: NodeType): string {
    switch (type) {
      case 'hospital': return '#6ee7b7';
      case 'department': return '#93c5fd';
      case 'subdepartment': return '#c4b5fd';
      case 'doctor': return '#67e8f9';
      case 'staff': return '#fdba74';
    }
  }

  ngOnInit(): void {
    this.load();

    const hasHospital = this.nodes().some((n) => n.type === 'hospital');
    if (!hasHospital) {
      const h = this.hospitals()[0];
      const root: FlowNode = {
        id: 'hospital_root',
        type: 'hospital',
        entityId: h?.id ?? 'h1',
        title: h?.name ?? 'Hospital',
        subtitle: 'Root',
        x: 0,
        y: 0
      };
      this.nodes.set([root, ...this.nodes()]);
      this.recomputeLayout();
    }
    this.save();
  }

  // --- Zoom at pointer ---
  zoomIn(): void {
    this.zoom.set(this.clampZoom(this.zoom() + this.ZOOM_STEP));
  }

  zoomOut(): void {
    this.zoom.set(this.clampZoom(this.zoom() - this.ZOOM_STEP));
  }

  zoomReset(): void {
    this.zoom.set(1);
    this.panX.set(0);
    this.panY.set(0);
  }

  private clampZoom(v: number): number {
    return Math.min(this.ZOOM_MAX, Math.max(this.ZOOM_MIN, Math.round(v * 100) / 100));
  }

  onCanvasWheel(ev: WheelEvent): void {
    ev.preventDefault();

    if (ev.ctrlKey || ev.metaKey) {
      // Zoom at pointer
      const el = this.canvasRef?.nativeElement;
      if (!el) return;

      const oldZoom = this.zoom();
      const dir = ev.deltaY > 0 ? -1 : 1;
      const newZoom = this.clampZoom(oldZoom + dir * this.ZOOM_STEP);
      if (newZoom === oldZoom) return;

      const rect = el.getBoundingClientRect();
      const mx = ev.clientX - rect.left;
      const my = ev.clientY - rect.top;

      // Point in canvas coords under cursor: (mx - panX) / oldZoom
      // After zoom, keep that same canvas point under cursor:
      // mx - newPanX = canvasPoint * newZoom  =>  newPanX = mx - canvasPoint * newZoom
      const cx = (mx - this.panX()) / oldZoom;
      const cy = (my - this.panY()) / oldZoom;
      this.panX.set(mx - cx * newZoom);
      this.panY.set(my - cy * newZoom);
      this.zoom.set(newZoom);
    } else {
      // Normal scroll → pan the canvas
      this.panX.set(this.panX() - ev.deltaX);
      this.panY.set(this.panY() - ev.deltaY);
    }
  }

  // --- Node dragging ---
  onNodeMouseDown(ev: MouseEvent, node: FlowNode): void {
    if ((ev.target as HTMLElement).closest('.node-x, .node-action')) return;
    ev.preventDefault();
    this.dragState = {
      nodeId: node.id,
      startMouseX: ev.clientX,
      startMouseY: ev.clientY,
      startNodeX: node.x,
      startNodeY: node.y,
      moved: false
    };
  }

  // Canvas panning (drag on empty space)
  onCanvasMouseDown(ev: MouseEvent): void {
    // Only start pan if click is directly on the canvas background (not on a node)
    if ((ev.target as HTMLElement).closest('.node')) return;
    ev.preventDefault();
    this.panState = {
      startX: ev.clientX,
      startY: ev.clientY,
      startPanX: this.panX(),
      startPanY: this.panY()
    };
  }

  @HostListener('document:mousemove', ['$event'])
  onDocMouseMove(ev: MouseEvent): void {
    // Canvas panning
    if (this.panState) {
      const dx = ev.clientX - this.panState.startX;
      const dy = ev.clientY - this.panState.startY;
      if (!this.isPanning() && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        this.isPanning.set(true);
      }
      if (this.isPanning()) {
        this.panX.set(this.panState.startPanX + dx);
        this.panY.set(this.panState.startPanY + dy);
      }
      return;
    }

    // Node dragging
    if (!this.dragState) return;
    const dx = (ev.clientX - this.dragState.startMouseX) / this.zoom();
    const dy = (ev.clientY - this.dragState.startMouseY) / this.zoom();

    if (!this.dragState.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      this.dragState.moved = true;
      this.isDragging.set(true);
    }

    if (this.dragState.moved) {
      const newX = Math.max(0, this.dragState.startNodeX + dx);
      const newY = Math.max(0, this.dragState.startNodeY + dy);
      this.nodes.set(
        this.nodes().map(n => n.id === this.dragState!.nodeId ? { ...n, x: newX, y: newY } : n)
      );
      this.edges.set([...this.edges()]);
    }
  }

  @HostListener('document:mouseup')
  onDocMouseUp(): void {
    if (this.dragState?.moved) {
      this.save();
    }
    this.dragState = null;
    this.panState = null;
    setTimeout(() => {
      this.isDragging.set(false);
      this.isPanning.set(false);
    });
  }

  // --- Node picker ---
  toggleNodePicker(): void {
    this.showNodePicker.set(!this.showNodePicker());
    if (this.showNodePicker()) {
      this.pickerSearch = '';
      this.pickerCategory.set('all');
    }
  }

  setPickerCategory(cat: 'all' | 'department' | 'subdepartment' | 'doctor' | 'staff'): void {
    this.pickerCategory.set(cat);
  }

  addFromPicker(item: { id: string; type: NodeType }): void {
    const sel = this.selectedNode();
    switch (item.type) {
      case 'department':
        this.addDepartmentNode(item.id);
        break;
      case 'subdepartment':
        if (sel?.type === 'department') {
          this.addSubDepartmentNode(item.id);
        }
        break;
      case 'doctor':
        if (sel?.type === 'subdepartment') {
          this.addDoctorNode(item.id);
        }
        break;
      case 'staff':
        if (sel?.type === 'doctor') {
          this.addStaffNode(item.id);
        }
        break;
    }
  }

  pickerItemDisabled(itemType: NodeType): boolean {
    const sel = this.selectedNode();
    switch (itemType) {
      case 'department': return false;
      case 'subdepartment': return sel?.type !== 'department';
      case 'doctor': return sel?.type !== 'subdepartment';
      case 'staff': return sel?.type !== 'doctor';
      default: return true;
    }
  }

  pickerItemHint(itemType: NodeType): string {
    switch (itemType) {
      case 'department': return '';
      case 'subdepartment': return 'Select a department first';
      case 'doctor': return 'Select a sub-department first';
      case 'staff': return 'Select a doctor first';
      default: return '';
    }
  }

  // --- Drag from picker to canvas ---
  private draggedPickerItem: { id: string; type: NodeType } | null = null;

  onPickerDragStart(ev: DragEvent, item: { id: string; type: NodeType; name: string }): void {
    this.draggedPickerItem = { id: item.id, type: item.type };
    ev.dataTransfer!.effectAllowed = 'copy';
    ev.dataTransfer!.setData('text/plain', item.name);
  }

  onCanvasDragOver(ev: DragEvent): void {
    if (this.draggedPickerItem) {
      ev.preventDefault();
      ev.dataTransfer!.dropEffect = 'copy';
    }
  }

  onCanvasDrop(ev: DragEvent): void {
    ev.preventDefault();
    if (!this.draggedPickerItem) return;

    const el = this.canvasRef?.nativeElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const canvasX = (ev.clientX - rect.left - this.panX()) / this.zoom();
    const canvasY = (ev.clientY - rect.top - this.panY()) / this.zoom();

    this.dropNodeAtPosition(this.draggedPickerItem, canvasX, canvasY);
    this.draggedPickerItem = null;
  }

  private dropNodeAtPosition(item: { id: string; type: NodeType }, x: number, y: number): void {
    switch (item.type) {
      case 'department': {
        const dept = this.departments().find(d => d.id === item.id);
        if (!dept) return;
        const nodeId = `dept_${item.id}_${Math.random().toString(16).slice(2)}`;
        const node: FlowNode = { id: nodeId, type: 'department', entityId: item.id, title: dept.name, subtitle: 'Department', x, y };
        this.nodes.set([...this.nodes(), node]);
        const root = this.hospitalRoot();
        if (root) this.addEdge(root.id, nodeId);
        this.selectedNodeId.set(nodeId);
        break;
      }
      case 'subdepartment': {
        const sub = this.subDepartments().find(s => s.id === item.id);
        if (!sub) return;
        const nodeId = `sub_${item.id}_${Math.random().toString(16).slice(2)}`;
        const node: FlowNode = { id: nodeId, type: 'subdepartment', entityId: item.id, title: sub.name.toUpperCase(), subtitle: 'Sub-department', x, y };
        this.nodes.set([...this.nodes(), node]);
        const sel = this.selectedNode();
        if (sel?.type === 'department') this.addEdge(sel.id, nodeId);
        this.selectedNodeId.set(nodeId);
        break;
      }
      case 'doctor': {
        const doc = this.doctors().find(d => d.id === item.id);
        if (!doc) return;
        const nodeId = `doctor_${item.id}_${Math.random().toString(16).slice(2)}`;
        const node: FlowNode = { id: nodeId, type: 'doctor', entityId: item.id, title: doc.name, subtitle: doc.specialization, x, y };
        this.nodes.set([...this.nodes(), node]);
        const sel = this.selectedNode();
        if (sel?.type === 'subdepartment') this.addEdge(sel.id, nodeId);
        this.selectedNodeId.set(nodeId);
        break;
      }
      case 'staff': {
        const s = this.staff().find(st => st.id === item.id);
        if (!s) return;
        const nodeId = `staff_${item.id}_${Math.random().toString(16).slice(2)}`;
        const node: FlowNode = { id: nodeId, type: 'staff', entityId: item.id, title: s.name, subtitle: s.role, x, y };
        this.nodes.set([...this.nodes(), node]);
        const sel = this.selectedNode();
        if (sel?.type === 'doctor') this.addEdge(sel.id, nodeId);
        this.selectedNodeId.set(nodeId);
        break;
      }
    }
    this.save();
  }

  // --- Add new staff ---
  toggleAddStaffForm(): void {
    this.showAddStaffForm.set(!this.showAddStaffForm());
    if (this.showAddStaffForm()) {
      this.newStaffName = '';
      this.newStaffRole = '';
    }
  }

  createNewStaff(): void {
    const name = this.newStaffName.trim();
    if (!name) return;
    const id = `s_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
    const role = this.newStaffRole.trim() || 'General';
    const newMember: StaffMember = { id, name, role };
    this.staff.set([...this.staff(), newMember]);
    this.showAddStaffForm.set(false);
    this.newStaffName = '';
    this.newStaffRole = '';
  }

  // --- Link mode ---
  toggleLinkMode(): void {
    const entering = !this.linkMode();
    this.linkMode.set(entering);
    this.linkSourceId.set(null);
    if (entering) this.selectedEdgeId.set(null);
  }

  cancelLinkMode(): void {
    this.linkMode.set(false);
    this.linkSourceId.set(null);
  }

  // --- Edge selection / removal on canvas ---
  selectEdge(edgeId: EdgeId): void {
    this.selectedEdgeId.set(this.selectedEdgeId() === edgeId ? null : edgeId);
  }

  removeEdgeById(edgeId: EdgeId): void {
    this.edges.set(this.edges().filter((e) => e.id !== edgeId));
    this.selectedEdgeId.set(null);
    this.save();
  }

  edgeMidpoint(e: FlowEdge): { x: number; y: number } | null {
    const fromNode = this.nodes().find((n) => n.id === e.from);
    const toNode = this.nodes().find((n) => n.id === e.to);
    if (!fromNode || !toNode) return null;
    const fromH = this.nodeHeight(fromNode.type);
    const toH = this.nodeHeight(toNode.type);
    return {
      x: (fromNode.x + this.NODE_WIDTH / 2 + toNode.x + this.NODE_WIDTH / 2) / 2,
      y: (fromNode.y + fromH + toNode.y) / 2
    };
  }

  // --- Selection ---
  selectNode(id: NodeId | null): void {
    if (this.isDragging()) return;

    // If in link mode, handle source/target selection
    if (this.linkMode() && id) {
      if (!this.linkSourceId()) {
        this.linkSourceId.set(id);
        return;
      }
      const sourceId = this.linkSourceId()!;
      if (sourceId !== id) {
        const exists = this.edges().some(
          (e) => (e.from === sourceId && e.to === id) || (e.from === id && e.to === sourceId)
        );
        if (!exists) {
          this.addEdge(sourceId, id);
          this.save();
        }
      }
      this.linkMode.set(false);
      this.linkSourceId.set(null);
      return;
    }

    this.selectedEdgeId.set(null);
    this.selectedNodeId.set(id);
    if (id) this.showConfigPanel.set(true);
  }

  toggleConfigPanel(): void {
    this.showConfigPanel.set(!this.showConfigPanel());
  }

  // --- Creation helpers ---
  addDepartmentNode(deptId: string): void {
    const dept = this.departments().find((d) => d.id === deptId);
    if (!dept) return;
    const id = `dept_${deptId}_${Math.random().toString(16).slice(2)}`;
    const root = this.hospitalRoot();
    const existingDepts = this.connectedDepartments().length;
    const node: FlowNode = {
      id,
      type: 'department',
      entityId: deptId,
      title: dept.name,
      subtitle: 'Department',
      x: (root?.x ?? this.CANVAS_PADDING) + existingDepts * this.COL_GAP,
      y: (root?.y ?? this.CANVAS_PADDING) + this.MAX_NODE_HEIGHT + this.ROW_GAP
    };
    this.nodes.set([...this.nodes(), node]);
    if (root) this.addEdge(root.id, node.id);
    this.selectedNodeId.set(node.id);
    this.save();
  }

  addSubDepartmentNode(subId: string): void {
    const sub = this.subDepartments().find((s) => s.id === subId);
    if (!sub) return;
    const parent = this.selectedNode();
    if (!parent || parent.type !== 'department') return;

    const existingChildren = this.edges().filter((e) => e.from === parent.id).length;
    const id = `sub_${subId}_${Math.random().toString(16).slice(2)}`;
    const node: FlowNode = {
      id,
      type: 'subdepartment',
      entityId: subId,
      title: sub.name.toUpperCase(),
      subtitle: 'Sub-department',
      x: parent.x + (existingChildren - 0.5) * this.COL_GAP * 0.6,
      y: parent.y + this.MAX_NODE_HEIGHT + this.ROW_GAP
    };
    this.nodes.set([...this.nodes(), node]);
    this.addEdge(parent.id, node.id);
    this.selectedNodeId.set(node.id);
    this.save();
  }

  addDoctorNode(doctorId: string): void {
    const doc = this.doctors().find((d) => d.id === doctorId);
    if (!doc) return;
    const parent = this.selectedNode();
    if (!parent || parent.type !== 'subdepartment') return;

    const existingChildren = this.edges().filter(e => e.from === parent.id).length;
    const id = `doctor_${doctorId}_${Math.random().toString(16).slice(2)}`;
    const node: FlowNode = {
      id,
      type: 'doctor',
      entityId: doctorId,
      title: doc.name,
      subtitle: doc.specialization,
      x: parent.x + (existingChildren - 0.5) * this.COL_GAP * 0.5,
      y: parent.y + this.MAX_NODE_HEIGHT + this.ROW_GAP
    };
    this.nodes.set([...this.nodes(), node]);
    this.addEdge(parent.id, node.id);
    this.selectedNodeId.set(node.id);
    this.save();
  }

  addStaffNode(staffId: string): void {
    const s = this.staff().find((st) => st.id === staffId);
    if (!s) return;
    const parent = this.selectedNode();
    if (!parent || parent.type !== 'doctor') return;

    const existingChildren = this.edges().filter(e => e.from === parent.id).length;
    const id = `staff_${staffId}_${Math.random().toString(16).slice(2)}`;
    const node: FlowNode = {
      id,
      type: 'staff',
      entityId: staffId,
      title: s.name,
      subtitle: s.role,
      x: parent.x + (existingChildren - 0.5) * this.COL_GAP * 0.5,
      y: parent.y + this.MAX_NODE_HEIGHT + this.ROW_GAP
    };
    this.nodes.set([...this.nodes(), node]);
    this.addEdge(parent.id, node.id);
    this.selectedNodeId.set(node.id);
    this.save();
  }

  removeNode(nodeId: NodeId): void {
    const node = this.nodes().find((n) => n.id === nodeId);
    if (!node || node.type === 'hospital') return;

    const toRemove = new Set<NodeId>();
    const queue = [nodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      toRemove.add(current);
      const childIds = this.edges()
        .filter((e) => e.from === current)
        .map((e) => e.to);
      for (const cid of childIds) {
        if (!toRemove.has(cid)) queue.push(cid);
      }
    }

    this.nodes.set(this.nodes().filter((n) => !toRemove.has(n.id)));
    this.edges.set(this.edges().filter((e) => !toRemove.has(e.from) && !toRemove.has(e.to)));
    if (toRemove.has(this.selectedNodeId() ?? '')) this.selectedNodeId.set(null);
    this.save();
  }

  removeConnection(from: NodeId, to: NodeId): void {
    this.edges.set(this.edges().filter((e) => !(e.from === from && e.to === to)));
    this.save();
  }

  addEdge(from: NodeId, to: NodeId): void {
    const exists = this.edges().some((e) => e.from === from && e.to === to);
    if (exists) return;
    const id = `e_${from}_${to}_${Math.random().toString(16).slice(2)}`;
    this.edges.set([...this.edges(), { id, from, to }]);
  }

  // --- Auto-arrange (on demand) ---
  autoArrange(): void {
    this.recomputeLayout();
    this.save();
  }

  private recomputeLayout(): void {
    const nodes = this.nodes();
    const edges = this.edges();
    if (nodes.length === 0) return;

    const childrenMap = new Map<NodeId, NodeId[]>();
    for (const e of edges) {
      const list = childrenMap.get(e.from) ?? [];
      list.push(e.to);
      childrenMap.set(e.from, list);
    }

    const root = nodes.find((n) => n.type === 'hospital');
    if (!root) return;

    const widthCache = new Map<NodeId, number>();
    const computeWidth = (nodeId: NodeId): number => {
      if (widthCache.has(nodeId)) return widthCache.get(nodeId)!;
      const children = childrenMap.get(nodeId) ?? [];
      if (children.length === 0) {
        widthCache.set(nodeId, 1);
        return 1;
      }
      const total = children.reduce((sum, cid) => sum + computeWidth(cid), 0);
      widthCache.set(nodeId, total);
      return total;
    };

    computeWidth(root.id);

    const posMap = new Map<NodeId, { x: number; y: number }>();
    const assignPositions = (nodeId: NodeId, row: number, leftSlot: number): void => {
      const subtreeWidth = widthCache.get(nodeId) ?? 1;
      const centerSlot = leftSlot + subtreeWidth / 2;
      const x = this.CANVAS_PADDING + (centerSlot - 0.5) * this.COL_GAP;
      const y = this.CANVAS_PADDING + row * (this.MAX_NODE_HEIGHT + this.ROW_GAP);
      posMap.set(nodeId, { x, y });

      const children = childrenMap.get(nodeId) ?? [];
      let childLeft = leftSlot;
      for (const cid of children) {
        assignPositions(cid, row + 1, childLeft);
        childLeft += widthCache.get(cid) ?? 1;
      }
    };

    assignPositions(root.id, 0, 0);

    const positioned = new Set(posMap.keys());
    let orphanX = this.CANVAS_PADDING;
    const orphanRow = 5;
    for (const n of nodes) {
      if (!positioned.has(n.id)) {
        const y = this.CANVAS_PADDING + orphanRow * (this.MAX_NODE_HEIGHT + this.ROW_GAP);
        posMap.set(n.id, { x: orphanX, y });
        orphanX += this.COL_GAP;
      }
    }

    this.nodes.set(
      nodes.map((n) => {
        const pos = posMap.get(n.id);
        return pos ? { ...n, x: pos.x, y: pos.y } : n;
      })
    );

    // Force edges to re-render with the new node positions.
    // Angular's @for tracks edges by id; unless the signal ref changes,
    // template expressions like edgePath(e) won't be re-evaluated.
    this.edges.set([...this.edges()]);
  }

  // --- Geometry for edges (adaptive routing) ---
  edgePath(e: FlowEdge): string {
    const fromNode = this.nodes().find((n) => n.id === e.from);
    const toNode = this.nodes().find((n) => n.id === e.to);
    if (!fromNode || !toNode) return '';

    const fromH = this.nodeHeight(fromNode.type);
    const toH = this.nodeHeight(toNode.type);
    const vertGap = toNode.y - (fromNode.y + fromH);

    if (vertGap > 30) {
      // Enough vertical space: route bottom → top (vertical bezier)
      const fx = fromNode.x + this.NODE_WIDTH / 2;
      const fy = fromNode.y + fromH;
      const tx = toNode.x + this.NODE_WIDTH / 2;
      const ty = toNode.y;
      const dy = vertGap * 0.45;
      return `M ${fx} ${fy} C ${fx} ${fy + dy}, ${tx} ${ty - dy}, ${tx} ${ty}`;
    }

    // Nodes are on the same row or overlapping: route right → left (horizontal bezier)
    const toIsRight = toNode.x >= fromNode.x;
    const fx = toIsRight ? fromNode.x + this.NODE_WIDTH : fromNode.x;
    const fy = fromNode.y + fromH / 2;
    const tx = toIsRight ? toNode.x : toNode.x + this.NODE_WIDTH;
    const ty = toNode.y + toH / 2;
    const hDist = Math.abs(tx - fx);
    const dx = Math.max(50, hDist * 0.4);
    const cx1 = toIsRight ? fx + dx : fx - dx;
    const cx2 = toIsRight ? tx - dx : tx + dx;
    return `M ${fx} ${fy} C ${cx1} ${fy}, ${cx2} ${ty}, ${tx} ${ty}`;
  }

  // --- Persistence ---
  private storageKey = 'adminHospitalFlow';

  save(): void {
    const payload = {
      nodes: this.nodes(),
      edges: this.edges(),
      hospitalFeatureIds: this.hospitalFeatureIds(),
      doctorFeatureMap: this.doctorFeatureMap()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(payload));
  }

  load(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.nodes)) this.nodes.set(parsed.nodes);
      if (Array.isArray(parsed?.edges)) this.edges.set(parsed.edges);
      if (Array.isArray(parsed?.hospitalFeatureIds)) this.hospitalFeatureIds.set(parsed.hospitalFeatureIds);
      if (parsed?.doctorFeatureMap && typeof parsed.doctorFeatureMap === 'object') {
        this.doctorFeatureMap.set(parsed.doctorFeatureMap);
      }
    } catch {
      // ignore
    }
  }

  reset(): void {
    const h = this.hospitals()[0];
    this.nodes.set([
      {
        id: 'hospital_root',
        type: 'hospital',
        entityId: h?.id ?? 'h1',
        title: h?.name ?? 'Hospital',
        subtitle: 'Root',
        x: 0,
        y: 0
      }
    ]);
    this.edges.set([]);
    this.hospitalFeatureIds.set(['feat_appointments', 'feat_billing', 'feat_lab_reports', 'feat_pharmacy']);
    this.doctorFeatureMap.set({});
    this.selectedNodeId.set('hospital_root');
    localStorage.removeItem(this.storageKey);
    this.recomputeLayout();
  }
}
