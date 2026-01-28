import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppButtonComponent, IconComponent, DialogboxService, DialogFooterAction, PageComponent, BreadcrumbItem } from '@lk/core';
import { RoomsService } from '../../../../services/rooms.service';
import { PatientDetailsDialogComponent } from '../patient-details-dialog/patient-details-dialog.component';

interface Room {
  id: number;
  number: string;
  type: 'ICU' | 'General Ward' | 'Private' | 'Semi-Private';
  floor: number;
  wing: string;
  capacity: number;
  occupied: number;
  status: 'Available' | 'Full' | 'Maintenance';
  facilities?: { ac?: boolean; oxygen?: boolean; ventilator?: boolean; monitor?: boolean };
  icuLevel?: 'Level 1' | 'Level 2' | 'Level 3';
  ventilators?: number;
  monitors?: number;
  beds: Array<{
    id: string;
    status: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance' | 'Reserved';
    facilities?: { oxygen?: boolean; monitor?: boolean };
    patient?: string;
    patientInfo?: {
      name: string;
      age: number;
      gender: string;
      admission: string;
      doctor: string;
      diagnosis: string;
      expectedDischarge: string;
      guardian: string;
    };
  }>;
}

@Component({
    selector: 'app-room-details',
    imports: [CommonModule, AppButtonComponent, IconComponent, PageComponent],
    templateUrl: './room-details.component.html',
    styleUrl: './room-details.component.scss'
})
export class RoomDetailsComponent implements OnInit {
  room: Room | null = null;
  loading = true;
  selectedBed: any = null;
  showPatientDetails = false;
  breadcrumb: BreadcrumbItem[] = [
    { label: 'Rooms & Beds', route: '/admin/rooms', icon: 'meeting_room' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roomsService: RoomsService,
    private dialogService: DialogboxService
  ) {}

  ngOnInit() {
    const roomId = this.route.snapshot.paramMap.get('id');
    
    // Try to get room from navigation state first
    const navigationState = history.state;
    if (navigationState && navigationState.room) {
      this.room = navigationState.room;
      this.loading = false;
      this.updateBreadcrumb();
    } else if (roomId) {
      // Fallback: fetch room by ID (for direct navigation/refresh)
      this.room = this.roomsService.getRoomById(+roomId) || null;
      this.loading = false;
      this.updateBreadcrumb();
    }
    
    if (!this.room) {
      // Room not found, redirect back to rooms list
      this.router.navigate(['/admin/rooms']);
    }
  }

  back() {
    this.router.navigate(['/admin/rooms']);
  }

  onEditRoom() {
    console.log('Edit room:', this.room);
    // TODO: Navigate to edit room page
  }

  private updateBreadcrumb() {
    if (this.room) {
      this.breadcrumb = [
        { label: 'Rooms & Beds', route: '/admin/rooms', icon: 'meeting_room' },
        { label: this.room.number, route: `/admin/rooms/${this.room.id}`, icon: 'meeting_room', isActive: true }
      ];
    }
  }

  onBedClick(bed: any) {
    if (bed.status === 'Occupied' && bed.patientInfo) {
      this.openPatientDetailsDialog(bed);
    }
  }

  openPatientDetailsDialog(bed: any) {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'admit',
        text: 'Admit',
        color: 'primary',
        appearance: 'raised'
      },
      {
        id: 'transfer',
        text: 'Transfer',
        color: 'accent',
        appearance: 'raised'
      },
      {
        id: 'discharge',
        text: 'Discharge',
        color: 'warn',
        appearance: 'raised'
      }
    ];

    const dialogRef = this.dialogService.openDialog(PatientDetailsDialogComponent, {
      title: 'Patient Details',
      width: '700px',
      height: '800px',
      maxWidth: '90vw',
      data: {
        bed: bed,
        room: this.room
      },
      footerActions
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action) {
        this.onPatientAction(result.action, result.bed);
      }
    });
  }

  onPatientAction(action: string, bed: any) {
    switch (action) {
      case 'admit':
        console.log('Admit patient:', bed);
        // TODO: Implement admit logic
        break;
      case 'transfer':
        console.log('Transfer patient:', bed);
        // TODO: Implement transfer logic
        break;
      case 'discharge':
        console.log('Discharge patient:', bed);
        // TODO: Implement discharge logic
        break;
    }
  }

  closePatientDetails() {
    this.showPatientDetails = false;
    this.selectedBed = null;
  }

  onBedAction(bed: any, action: string) {
    switch (action) {
      case 'assign':
        if (bed.status === 'Available') {
          bed.status = 'Reserved';
        }
        break;
      case 'unassign':
        if (bed.status === 'Reserved') {
          bed.status = 'Available';
        }
        break;
      case 'maintenance':
        bed.status = 'Maintenance';
        break;
      case 'clean':
        bed.status = 'Cleaning';
        break;
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'available': return 'status-available';
      case 'occupied': return 'status-occupied';
      case 'reserved': return 'status-reserved';
      case 'cleaning': return 'status-cleaning';
      case 'maintenance': return 'status-maintenance';
      default: return '';
    }
  }

  getBedTypeLabel(status: string): string {
    switch (status.toLowerCase()) {
      case 'available': return 'Normal Bed';
      case 'reserved': return 'Reserved';
      case 'cleaning': return 'Cleaning';
      case 'maintenance': return 'Maintenance';
      default: return 'Normal Bed';
    }
  }

  facilityIcons(f?: { ac?: boolean; oxygen?: boolean; ventilator?: boolean; monitor?: boolean }) {
    if (!f) return [];
    const icons: string[] = [];
    if (f.ac) icons.push('ac_unit');
    if (f.oxygen) icons.push('medication');
    if (f.ventilator) icons.push('air');
    if (f.monitor) icons.push('monitor_heart');
    return icons;
  }

  getBedStatusColor(status: string): string {
    switch (status) {
      case 'Available': return 'var(--room-available-color)';
      case 'Occupied': return 'var(--room-occupied-color)';
      case 'Cleaning': return 'var(--room-cleaning-color)';
      case 'Maintenance': return 'var(--room-maintenance-color)';
      case 'Reserved': return 'var(--room-reserved-color)';
      default: return 'var(--room-available-color)';
    }
  }

  getRoomStatusColor(status: string): string {
    switch (status) {
      case 'Available': return 'var(--room-available-color)';
      case 'Full': return 'var(--room-occupied-color)';
      case 'Maintenance': return 'var(--room-maintenance-color)';
      default: return 'var(--room-available-color)';
    }
  }

  getBedLabel(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, etc.
  }
}
