import { Component, OnInit, AfterViewInit } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { AppButtonComponent, AppInputComponent, AppSelectboxComponent, IconComponent, DialogboxService, DialogFooterAction, PageComponent, BreadcrumbItem, TabsComponent, TabComponent } from '@lk/core';
import { RoomsService } from '../../../../services/rooms.service';
import { BedFormDialogComponent } from '../bed-form-dialog/bed-form-dialog.component';

interface Floor {
  id: number;
  number: number;
  name: string;
  totalRooms: number;
  totalBeds: number;
}

interface Ward {
  id: number;
  name: string;
  type: 'ICU' | 'General' | 'Emergency' | 'Pediatric' | 'Maternity' | 'Surgery';
  floor: number;
  capacity: number;
  rooms: string[];
}

@Component({
    selector: 'app-rooms-management',
    imports: [
    ReactiveFormsModule,
    AppButtonComponent,
    AppInputComponent,
    AppSelectboxComponent,
    IconComponent,
    PageComponent,
    TabsComponent,
    TabComponent
],
    templateUrl: './rooms-management.component.html',
    styleUrl: './rooms-management.component.scss'
})
export class RoomsManagementComponent implements OnInit, AfterViewInit {
  selectedTabIndex = 0;
  breadcrumb: BreadcrumbItem[] = [
    { label: 'Rooms & Beds', route: '/admin/rooms', icon: 'meeting_room' },
    { label: 'Management', route: '/admin/rooms/manage', icon: 'settings', isActive: true }
  ];
  
  // Forms
  floorForm: FormGroup;
  wardForm: FormGroup;
  roomForm: FormGroup;
  bedForm: FormGroup;
  
  // Bed Management State
  isEditingBed = false;
  selectedRoom: any = null;
  selectedBed: any = null;
  
  // Data
  floors: Floor[] = [
    { id: 1, number: 0, name: 'Ground Floor', totalRooms: 15, totalBeds: 45 },
    { id: 2, number: 1, name: '1st Floor', totalRooms: 20, totalBeds: 60 },
    { id: 3, number: 2, name: '2nd Floor', totalRooms: 25, totalBeds: 75 },
    { id: 4, number: 3, name: '3rd Floor', totalRooms: 18, totalBeds: 54 }
  ];
  
  wards: Ward[] = [
    { id: 1, name: 'ICU Ward 1', type: 'ICU', floor: 2, capacity: 12, rooms: ['ICU-01', 'ICU-02', 'ICU-03'] },
    { id: 2, name: 'General Ward A', type: 'General', floor: 1, capacity: 24, rooms: ['GW-101', 'GW-102', 'GW-103'] },
    { id: 3, name: 'Emergency Ward', type: 'Emergency', floor: 0, capacity: 16, rooms: ['ER-01', 'ER-02'] },
    { id: 4, name: 'Pediatric Ward', type: 'Pediatric', floor: 1, capacity: 20, rooms: ['PD-101', 'PD-102'] }
  ];
  
  rooms: any[] = [];
  
  // Options
  wardTypeOptions = [
    { label: 'ICU', value: 'ICU' },
    { label: 'General', value: 'General' },
    { label: 'Emergency', value: 'Emergency' },
    { label: 'Pediatric', value: 'Pediatric' },
    { label: 'Maternity', value: 'Maternity' },
    { label: 'Surgery', value: 'Surgery' }
  ];

  bedStatusOptions = [
    { label: 'Available', value: 'Available' },
    { label: 'Occupied', value: 'Occupied' },
    { label: 'Cleaning', value: 'Cleaning' },
    { label: 'Maintenance', value: 'Maintenance' },
    { label: 'Reserved', value: 'Reserved' }
  ];

  bedFacilitiesOptions = [
    { key: 'oxygen', label: 'Oxygen Line', icon: 'air' },
    { key: 'monitor', label: 'Bedside Monitor', icon: 'monitor_heart' },
    { key: 'suction', label: 'Suction Equipment', icon: 'vacuum' },
    { key: 'iv_pole', label: 'IV Pole', icon: 'medical_services' },
    { key: 'bedside_table', label: 'Bedside Table', icon: 'table_restaurant' },
    { key: 'reading_light', label: 'Reading Light', icon: 'lightbulb' },
    { key: 'privacy_curtain', label: 'Privacy Curtain', icon: 'curtains' },
    { key: 'overbed_table', label: 'Overbed Table', icon: 'table_view' },
    { key: 'power_outlets', label: 'Power Outlets', icon: 'electrical_services' },
    { key: 'nurse_call', label: 'Nurse Call Button', icon: 'call' },
    { key: 'bed_scale', label: 'Bed Scale', icon: 'scale' },
    { key: 'adjustable_bed', label: 'Adjustable Bed', icon: 'bed' }
  ];
  


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private roomsService: RoomsService,
    private dialogService: DialogboxService
  ) {
    this.floorForm = this.createFloorForm();
    this.wardForm = this.createWardForm();
    this.roomForm = this.createRoomForm();
    this.bedForm = this.createBedForm();
  }

  ngOnInit() {
    this.loadRooms();
  }

  createFloorForm(): FormGroup {
    return this.fb.group({
      number: ['', [Validators.required, Validators.min(0)]],
      name: ['', [Validators.required]]
    });
  }

  createWardForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      type: [this.wardTypeOptions[0]?.value || '', [Validators.required]],
      floor: [this.floors[0]?.number ?? '', [Validators.required]],
      capacity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  createRoomForm(): FormGroup {
    return this.fb.group({
      number: ['', [Validators.required]],
      type: ['ICU', [Validators.required]],
      floor: [this.floors[0]?.number ?? '', [Validators.required]],
      ward: [''],
      capacity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  createBedForm(): FormGroup {
    return this.fb.group({
      floor: ['', [Validators.required]],
      room: ['', [Validators.required]],
      bedId: ['', [Validators.required]],
      status: ['Available', [Validators.required]],
      facilities: this.fb.group({
        oxygen: [false],
        monitor: [false],
        suction: [false],
        iv_pole: [false],
        bedside_table: [true],
        reading_light: [true],
        privacy_curtain: [true],
        overbed_table: [false],
        power_outlets: [true],
        nurse_call: [true],
        bed_scale: [false],
        adjustable_bed: [false]
      })
    });
  }

  loadRooms() {
    this.rooms = this.roomsService.getRooms();
  }

  onAddFloor() {
    if (this.floorForm.valid) {
      const floorData = this.floorForm.value;
      const newFloor: Floor = {
        id: Math.max(...this.floors.map(f => f.id)) + 1,
        number: floorData.number,
        name: floorData.name,
        totalRooms: 0,
        totalBeds: 0
      };
      
      this.floors.push(newFloor);
      this.floorForm.reset();
      
      console.log('Floor added:', newFloor);
    }
  }

  removeFloor(floorId: number) {
    this.floors = this.floors.filter(f => f.id !== floorId);
  }

  // Ward Management
  onAddWard() {
    if (this.wardForm.valid) {
      const wardData = this.wardForm.value;
      const newWard: Ward = {
        id: Math.max(...this.wards.map(w => w.id)) + 1,
        name: wardData.name,
        type: wardData.type,
        floor: wardData.floor,
        capacity: wardData.capacity,
        rooms: []
      };
      
      this.wards.push(newWard);
      this.wardForm.reset();
      
      console.log('Ward added:', newWard);
    }
  }

  removeWard(wardId: number) {
    this.wards = this.wards.filter(w => w.id !== wardId);
  }

  // Room Management
  onAddRoom() {
    if (this.roomForm.valid) {
      const roomData = this.roomForm.value;
      
      // Create room using existing service
      const newRoomData = {
        number: roomData.number,
        type: roomData.type,
        floor: roomData.floor,
        wing: 'A', // Default wing since we removed wing selection
        capacity: roomData.capacity,
        occupied: 0,
        status: 'Available' as const,
        facilities: {
          ac: roomData.type === 'ICU',
          oxygen: true,
          ventilator: roomData.type === 'ICU',
          monitor: roomData.type === 'ICU'
        },
        icuLevel: roomData.type === 'ICU' ? 'Level 1' as const : undefined,
        beds: this.generateBedsForRoom(roomData.number, roomData.capacity)
      };
      
      this.roomsService.addRoom(newRoomData);
      this.loadRooms();
      this.roomForm.reset();
      
      console.log('Room added:', newRoomData);
    }
  }

  generateBedsForRoom(roomNumber: string, capacity: number) {
    const beds = [];
    for (let i = 0; i < capacity; i++) {
      beds.push({
        id: `${roomNumber}-${String.fromCharCode(65 + i)}`,
        status: 'Available' as const,
        facilities: { oxygen: true, monitor: false }
      });
    }
    return beds;
  }

  removeRoom(roomId: number) {
    this.roomsService.deleteRoom(roomId);
    this.loadRooms();
  }

  // Utility methods
  getFloorOptions() {
    return this.floors.map(f => ({ label: f.name, value: f.number }));
  }

  getWardsByFloor(floor: number) {
    return this.wards.filter(w => w.floor === floor);
  }

  getRoomsByFloor(floorNumber: number) {
    return this.rooms.filter(room => room.floor === floorNumber);
  }

  onBack() {
    this.router.navigate(['/admin/rooms']);
  }

  onSave() {
    console.log('All changes saved');
    this.router.navigate(['/admin/rooms']);
  }

  ngAfterViewInit() {
    // No longer needed since we removed wings
  }

  // Bed Management Methods
  openAddBedForm() {
    this.isEditingBed = false;
    this.selectedRoom = null;
    this.selectedBed = null;
    this.bedForm.reset();
    this.bedForm.patchValue({
      status: 'Available',
      facilities: {
        bedside_table: true,
        reading_light: true,
        privacy_curtain: true,
        power_outlets: true,
        nurse_call: true
      }
    });
    this.openBedFormDialog();
  }

  closeBedForm() {
    this.isEditingBed = false;
    this.selectedRoom = null;
    this.selectedBed = null;
    this.bedForm.reset();
  }

  addBedToRoom(room: any) {
    this.selectedRoom = room;
    this.isEditingBed = false;
    this.bedForm.reset();
    this.bedForm.patchValue({
      floor: room.floor,
      room: room.id,
      status: 'Available',
      facilities: {
        bedside_table: true,
        reading_light: true,
        privacy_curtain: true,
        power_outlets: true,
        nurse_call: true
      }
    });
    
    // Auto-generate next bed ID
    const existingBeds = room.beds || [];
    const nextBedLetter = String.fromCharCode(65 + existingBeds.length); // A, B, C, etc.
    this.bedForm.patchValue({ bedId: nextBedLetter });
    
    this.openBedFormDialog();
  }

  editBed(room: any, bed: any) {
    this.selectedRoom = room;
    this.selectedBed = bed;
    this.isEditingBed = true;
    
    this.bedForm.patchValue({
      floor: room.floor,
      room: room.id,
      bedId: bed.id.split('-').pop(),
      status: bed.status,
      facilities: bed.facilities || {}
    });
    
    this.openBedFormDialog();
  }

  openBedFormDialog() {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'stroked'
      },
      {
        id: 'save',
        text: this.isEditingBed ? 'Update Bed' : 'Add Bed',
        color: 'primary',
        appearance: 'raised',
        fontIcon: 'save',
        disabled: this.bedForm.invalid
      }
    ];

    const dialogRef = this.dialogService.openDialog(BedFormDialogComponent, {
      title: this.isEditingBed ? 'Edit Bed' : 'Add New Bed',
      width: '65%',
      height:'80%',
      data: {
        bedForm: this.bedForm,
        isEditingBed: this.isEditingBed,
        floors: this.floors,
        rooms: this.rooms,
        bedStatusOptions: this.bedStatusOptions,
        bedFacilitiesOptions: this.bedFacilitiesOptions,
        selectedRoom: this.selectedRoom,
        selectedBed: this.selectedBed,
        onFloorChange: () => this.onFloorChange(),
        onRoomChange: () => this.onRoomChange(),
        getAvailableRooms: () => this.getAvailableRooms()
      },
      footerActions
    });

    // Update footer button disabled state when form validity changes
    this.bedForm.statusChanges.subscribe(() => {
      const dialogboxContent = (dialogRef as any)._containerInstance?._config?.data;
      if (dialogboxContent) {
        // Update the save button disabled state
        const saveAction = footerActions.find(a => a.id === 'save');
        if (saveAction) {
          saveAction.disabled = this.bedForm.invalid;
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'save') {
        this.saveBedFromDialog(result);
      } else {
        // Reset form if cancelled
        this.bedForm.reset();
      }
    });
  }

  saveBedFromDialog(result: any) {
    const formValue = result.formValue;
    const roomId = formValue.room;
    const targetRoom = this.rooms.find(room => room.id === roomId);
    
    if (targetRoom) {
      const bedData = {
        id: `${targetRoom.number}-${formValue.bedId}`,
        status: formValue.status,
        facilities: formValue.facilities,
        patientInfo: formValue.status === 'Occupied' ? { name: 'Sample Patient' } : null
      };
      
      if (result.isEditingBed && this.selectedBed) {
        // Update existing bed
        const bedIndex = targetRoom.beds.findIndex((b: any) => b.id === this.selectedBed.id);
        if (bedIndex > -1) {
          targetRoom.beds[bedIndex] = { ...targetRoom.beds[bedIndex], ...bedData };
          console.log('Bed updated:', bedData.id);
        }
      } else {
        // Add new bed
        if (!targetRoom.beds) {
          targetRoom.beds = [];
        }
        targetRoom.beds.push(bedData);
        console.log('Bed added:', bedData.id);
      }
      
      this.closeBedForm();
    }
  }

  deleteBed(room: any, bed: any) {
    console.log('Delete bed:', bed.id);
    if (confirm(`Are you sure you want to delete bed ${bed.id}?`)) {
      const bedIndex = room.beds.findIndex((b: any) => b.id === bed.id);
      if (bedIndex > -1) {
        room.beds.splice(bedIndex, 1);
        console.log('Bed deleted:', bed.id);
      }
    }
  }

  saveBed() {
    if (this.bedForm.valid) {
      const formValue = this.bedForm.value;
      const roomId = formValue.room;
      const targetRoom = this.rooms.find(room => room.id === roomId);
      
      if (targetRoom) {
        const bedData = {
          id: `${targetRoom.number}-${formValue.bedId}`,
          status: formValue.status,
          facilities: formValue.facilities,
          patientInfo: formValue.status === 'Occupied' ? { name: 'Sample Patient' } : null
        };
        
        if (this.isEditingBed && this.selectedBed) {
          // Update existing bed
          const bedIndex = targetRoom.beds.findIndex((b: any) => b.id === this.selectedBed.id);
          if (bedIndex > -1) {
            targetRoom.beds[bedIndex] = { ...targetRoom.beds[bedIndex], ...bedData };
            console.log('Bed updated:', bedData.id);
          }
        } else {
          // Add new bed
          if (!targetRoom.beds) {
            targetRoom.beds = [];
          }
          targetRoom.beds.push(bedData);
          console.log('Bed added:', bedData.id);
        }
        
        this.closeBedForm();
      }
    }
  }

  onFloorChange() {
    this.bedForm.patchValue({ room: '' });
  }

  onRoomChange() {
    const roomId = this.bedForm.get('room')?.value;
    const selectedRoom = this.rooms.find(room => room.id === roomId);
    
    if (selectedRoom && !this.isEditingBed) {
      // Auto-generate next bed ID
      const existingBeds = selectedRoom.beds || [];
      const nextBedLetter = String.fromCharCode(65 + existingBeds.length);
      this.bedForm.patchValue({ bedId: nextBedLetter });
    }
  }

  getAvailableRooms() {
    const selectedFloor = this.bedForm.get('floor')?.value;
    if (!selectedFloor) return [];
    
    return this.rooms
      .filter(room => room.floor === selectedFloor)
      .map(room => ({
        label: `${room.number} (${room.type})`,
        value: room.id
      }));
  }

  getTotalBedsInFloor(floorNumber: number): number {
    return this.getRoomsByFloor(floorNumber)
      .reduce((total, room) => total + (room.beds?.length || 0), 0);
  }

  getOccupiedBedsInFloor(floorNumber: number): number {
    return this.getRoomsByFloor(floorNumber)
      .reduce((total, room) => {
        return total + (room.beds?.filter((bed: any) => bed.status === 'Occupied').length || 0);
      }, 0);
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

  // Preview Helper Methods
  getFloorsReversed() {
    return [...this.floors].reverse();
  }

  getTotalBeds(): number {
    return this.rooms.reduce((total, room) => total + (room.beds?.length || 0), 0);
  }

  getAvailableBeds(): number {
    return this.rooms.reduce((total, room) => {
      const availableBeds = room.beds?.filter((bed: any) => 
        bed.status === 'Available'
      ).length || 0;
      return total + availableBeds;
    }, 0);
  }

  getBedsByFloor(floorNumber: number): number {
    return this.getRoomsByFloor(floorNumber)
      .reduce((total, room) => total + (room.beds?.length || 0), 0);
  }

  getRoomIcon(roomType: string): string {
    switch (roomType) {
      case 'ICU': return 'local_hospital';
      case 'General Ward': return 'hotel';
      case 'Private': return 'single_bed';
      case 'Semi-Private': return 'king_bed';
      default: return 'meeting_room';
    }
  }

  getRoomColor(roomType: string): string {
    switch (roomType) {
      case 'ICU': return '#e74c3c';
      case 'General Ward': return '#3498db';
      case 'Private': return '#9b59b6';
      case 'Semi-Private': return '#f39c12';
      default: return '#95a5a6';
    }
  }

  getBedColor(status: string): string {
    switch (status) {
      case 'Available': return '#27ae60';
      case 'Occupied': return '#e74c3c';
      case 'Reserved': return '#f39c12';
      case 'Cleaning': return '#3498db';
      case 'Maintenance': return '#95a5a6';
      default: return '#95a5a6';
    }
  }

  getBedLetter(bedId: string): string {
    // Extract letter from bed ID (e.g., 'ICU-01-A' -> 'A')
    const parts = bedId.split('-');
    return parts[parts.length - 1];
  }

  getRoomCapacityColor(occupied: number, capacity: number): string {
    const percentage = (occupied / capacity) * 100;
    if (percentage >= 100) return '#e74c3c';
    if (percentage >= 75) return '#f39c12';
    if (percentage >= 50) return '#3498db';
    return '#27ae60';
  }

  // Bed Details Dialog Methods
  showBedDetails(bed: any, room: any) {
    // Pre-fill bed form for viewing
    this.bedForm.patchValue({
      floor: room?.floor,
      room: room?.id,
      bedId: this.getBedLetter(bed.id),
      status: bed.status,
      facilities: bed.facilities || {}
    });

    const dialogRef = this.dialogService.openDialog(BedFormDialogComponent, {
      title: `Bed Details - ${bed.id}`,
      data: {
        bedForm: this.bedForm,
        isEditingBed: false,
        floors: this.floors,
        rooms: this.rooms,
        bedStatusOptions: this.bedStatusOptions,
        bedFacilitiesOptions: this.bedFacilitiesOptions,
        selectedRoom: room,
        selectedBed: bed,
        onFloorChange: () => this.handleBedFloorChange(),
        onRoomChange: () => this.handleBedRoomChange(),
        getAvailableRooms: () => this.getRoomsByFloor(this.bedForm.controls['floor'].value)
      },
      width: '65%',
      height:'80%'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.action === 'edit') {
        this.selectedTabIndex = 3;
        this.isEditingBed = true;
        this.selectedBed = bed;
        this.selectedRoom = room;
        this.bedForm.patchValue({
          floor: room?.floor,
          room: room?.id,
          bedId: this.getBedLetter(bed.id),
          status: bed.status,
          facilities: bed.facilities || {}
        });
        this.openBedFormDialog();
      }
    });
  }

  getFloorName(floorNumber: number): string {
    const floor = this.floors.find(f => f.number === floorNumber);
    return floor ? floor.name : `Floor ${floorNumber}`;
  }

  getBedFacilitiesList(facilities: any): any[] {
    if (!facilities) return [];
    
    return this.bedFacilitiesOptions.map(option => ({
      ...option,
      available: facilities[option.key] || false
    }));
  }

  handleBedFloorChange() {
    this.bedForm.patchValue({ room: '' });
  }

  handleBedRoomChange() {
    // reserved for future room-dependent logic
  }

  editBedDetails(room: any, bed: any) {
    this.selectedTabIndex = 3;
    this.isEditingBed = true;
    this.selectedBed = bed;
    this.selectedRoom = room;
    this.bedForm.patchValue({
      floor: room?.floor,
      room: room?.id,
      bedId: this.getBedLetter(bed.id),
      status: bed.status,
      facilities: bed.facilities || {}
    });
    this.openBedFormDialog();
  }

}
