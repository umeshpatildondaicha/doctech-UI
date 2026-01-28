import { Component, OnInit } from '@angular/core';

import { ColDef } from 'ag-grid-community';
import { AppButtonComponent, IconComponent, GridComponent, PageComponent, BreadcrumbItem } from '@lk/core';
import { Router } from '@angular/router';
import { RoomsService } from '../../../services/rooms.service';
import { 
  AdminPageHeaderComponent, 
  AdminStatsCardComponent,
  type HeaderAction,
  type StatCard
} from '../../../components';

@Component({
    selector: 'app-rooms',
    imports: [GridComponent, AppButtonComponent, IconComponent, AdminPageHeaderComponent, AdminStatsCardComponent, PageComponent],
    templateUrl: './rooms.component.html',
    styleUrl: './rooms.component.scss'
})
export class RoomsComponent implements OnInit {
  // Extended options to work with app-grid
  interface!: any;
  columnDefs: ColDef[] = [];
  gridOptions: any = {};

  rooms: any[] = [];

  // Header actions configuration
  headerActions: HeaderAction[] = [
    {
      text: 'Manage Rooms & Beds',
      color: 'primary',
      fontIcon: 'settings',
      action: 'manage-rooms'
    }
  ];

  // Stats configuration
  statsCards: StatCard[] = [];

  breadcrumb: BreadcrumbItem[] = [
    { label: 'Rooms & Beds', route: '/admin/rooms', icon: 'meeting_room', isActive: true }
  ];

  // KPIs
  totalRooms = 0;
  totalBeds = 0;
  occupiedBeds = 0;
  availableBeds = 0;
  icuBeds = 0;
  icuBedsAvailable = 0;
  occupancyRate = 0;

  constructor(
    private readonly router: Router,
    private readonly roomsService: RoomsService
  ) {}

  ngOnInit() {
    this.rooms = this.roomsService.getRooms();
    this.setupGrid();
    this.computeKpis();
    this.updateStatsCards();
  }

  setupGrid() {
    this.columnDefs = [
      { headerName: 'Room No', field: 'number', minWidth: 120, flex: 1 },
      { headerName: 'Type', field: 'type', minWidth: 140, flex: 1 },
      { headerName: 'Floor', field: 'floor', minWidth: 80, width: 100 },

      { headerName: 'Capacity', field: 'capacity', minWidth: 90, width: 110 },
      { headerName: 'Occupied', field: 'occupied', minWidth: 90, width: 110 },
      { headerName: 'Status', field: 'status', minWidth: 120, flex: 1 },
      { headerName: 'Facilities', field: 'facilities', minWidth: 150, flex: 1, cellRenderer: (p: any) => this.facilityIcons(p.data?.facilities) },
      { headerName: 'ICU Level', field: 'icuLevel', minWidth: 110, flex: 1 }
    ];

    this.gridOptions = {
      menuActions: [
        { title: 'View Details', icon: 'visibility', click: (p: any) => this.onView(p.data) },
        { title: 'Edit Room', icon: 'edit', click: (p: any) => this.onEdit(p.data) },
        { title: 'Mark Maintenance', icon: 'build', click: (p: any) => this.onMaintenance(p.data) }
      ],
      filterConfig: {
        fields: [
          { label: 'Room No', value: 'number', inputType: 'input' },
          { label: 'Type', value: 'type', inputType: 'select' },
          { label: 'Floor', value: 'floor', inputType: 'number' },

          { label: 'Status', value: 'status', inputType: 'select' },
          { label: 'ICU Level', value: 'icuLevel', inputType: 'select' }
        ],
        valuesMap: {
          type: ['ICU', 'General Ward', 'Private', 'Semi-Private'],

          status: ['Available', 'Full', 'Maintenance'],
          icuLevel: ['Level 1', 'Level 2', 'Level 3']
        }
      }
    };
  }

  computeKpis() {
    this.totalRooms = this.rooms.length;
    this.totalBeds = this.rooms.reduce((a, r) => a + r.capacity, 0);
    this.occupiedBeds = this.rooms.reduce((a, r) => a + r.occupied, 0);
    this.availableBeds = this.totalBeds - this.occupiedBeds;
    this.icuBeds = this.rooms
      .filter(r => r.type === 'ICU')
      .reduce((a, r) => a + r.capacity, 0);
    this.icuBedsAvailable = this.rooms
      .filter(r => r.type === 'ICU')
      .reduce((a, r) => a + (r.capacity - r.occupied), 0);
    this.occupancyRate = this.totalBeds ? Math.round((this.occupiedBeds / this.totalBeds) * 100) : 0;
  }

  // Actions
  onManageRooms() {
    this.router.navigate(['/admin/rooms/manage']);
  }



  onView(room: any) {
    this.router.navigate(['/admin/rooms', room.id], { state: { room } });
  }
  
  onEdit(room: any) { 
    this.router.navigate(['/admin/rooms/edit', room.id], { state: { room } });
  }
  
  onMaintenance(room: any) { 
    console.log('Mark maintenance', room); 
  }

  onBedClick(bed: any, room: any) {
    // Placeholder for future inline page navigation for a specific bed
    if (bed.status === 'Occupied') {
      this.router.navigate(['/admin/rooms', room.id], { state: { room, bed } });
    }
  }

  assignBed(bed: any, room: any) {
    if (bed.status !== 'Available') return;
    bed.status = 'Reserved';
  }

  unassignBed(bed: any, room: any) {
    if (bed.status === 'Reserved') bed.status = 'Available';
  }

  facilityIcons(f?: { ac?: boolean; oxygen?: boolean; ventilator?: boolean; monitor?: boolean }) {
    if (!f) return '';
    const parts: string[] = [];
    if (f.ac) parts.push('<span class="material-icons" style="font-size:16px;vertical-align:middle;opacity:.7">ac_unit</span>');
    if (f.oxygen) parts.push('<span class="material-icons" style="font-size:16px;vertical-align:middle;opacity:.7">medication</span>');
    if (f.ventilator) parts.push('<span class="material-icons" style="font-size:16px;vertical-align:middle;opacity:.7">air</span>');
    if (f.monitor) parts.push('<span class="material-icons" style="font-size:16px;vertical-align:middle;opacity:.7">monitor_heart</span>');
    return parts.join(' ');
  }

  exportCSV() {
    const headers = ['Room No','Type','Floor','Wing','Capacity','Occupied','Status','ICU Level'];
    const rows = this.rooms.map(r => [r.number, r.type, r.floor, r.wing, r.capacity, r.occupied, r.status, r.icuLevel || '']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'rooms-occupancy.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  updateStatsCards() {
    this.statsCards = [
      {
        label: 'Total Rooms',
        value: this.totalRooms,
        icon: 'meeting_room',
        type: 'info',
        valueColor: 'var(--admin-text-primary)'
      },
      {
        label: 'Total Beds',
        value: this.totalBeds,
        icon: 'hotel',
        type: 'info',
        valueColor: 'var(--admin-text-primary)'
      },
      {
        label: 'Occupied Beds',
        value: this.occupiedBeds,
        icon: 'person',
        type: 'warning',
        valueColor: 'var(--admin-text-primary)'
      },
      {
        label: 'Available Beds',
        value: this.availableBeds,
        icon: 'check_circle',
        type: 'success',
        valueColor: 'var(--admin-text-primary)'
      },
      {
        label: 'ICU Beds',
        value: this.icuBeds,
        icon: 'local_hospital',
        type: 'danger',
        valueColor: 'var(--admin-text-primary)'
      },
      {
        label: 'ICU Available',
        value: this.icuBedsAvailable,
        icon: 'emergency',
        type: this.icuBedsAvailable === 0 ? 'danger' : 'success',
        valueColor: this.icuBedsAvailable === 0 ? 'var(--status-danger-color)' : 'var(--admin-text-primary)'
      },
      {
        label: 'Occupancy',
        value: `${this.occupancyRate}%`,
        icon: 'analytics',
        type: 'info',
        valueColor: 'var(--admin-text-primary)'
      }
    ];
  }

  onHeaderAction(action: string) {
    switch (action) {
      case 'manage-rooms':
        this.onManageRooms();
        break;
    }
  }
}