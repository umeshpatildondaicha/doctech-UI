import { Component, OnInit, AfterViewInit, Input } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { AppButtonComponent, AppInputComponent, AppSelectboxComponent, IconComponent, DialogboxService, DialogFooterAction, PageComponent, BreadcrumbItem, TabsComponent, TabComponent } from '@lk/core';
import { RoomsService } from '../../../../services/rooms.service';
import { BedFormDialogComponent } from '../bed-form-dialog/bed-form-dialog.component';
import { FloorServicesService } from '../../../../services/floor-services.service';
import { Floor } from '../../../../interfaces/Floor.interface';
import { WardService } from '../../../../services/ward.service';
import { MatDialog } from '@angular/material/dialog';
import { FloorEditComponent } from './floor-edit/floor-edit.component';
import { BedService } from '../../../../services/bed.service';

// interface Floor {
//   id: number;
//   number: number;
//   name: string;
//   totalRooms: number;
//   totalBeds: number;
// }

interface Ward {
  wardId: number;
  wardName: string;
  wardType: string;
  description?: string;
  capacity: number;
  currentOccupancy: number;
  isActive: boolean;
  floorId: number;
  floorName: string;
  floorNumber: number;
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
  selectedFloorId: number | null = null;
  // Forms
  floorForm: FormGroup;
  wardForm: FormGroup;
  roomForm: FormGroup;
  bedForm: FormGroup;
  
  // Bed Management State
  isEditingBed = false;
  selectedRoom: any = null;
  selectedBed: any = null;
   beds:any[] =[];
   bedsByFloor :any[] =[];
  // Data
  // floors: Floor[] = [
  //   { id: 1, number: 0, name: 'Ground Floor', totalRooms: 15, totalBeds: 45 },
  //   { id: 2, number: 1, name: '1st Floor', totalRooms: 20, totalBeds: 60 },
  //   { id: 3, number: 2, name: '2nd Floor', totalRooms: 25, totalBeds: 75 },
  //   { id: 4, number: 3, name: '3rd Floor', totalRooms: 18, totalBeds: 54 }
  // ];
  @Input()floors:Floor[]=[];
  //floors : Floor[] =[];
  wards :Ward[]=[];
  
  roomData: any[] = [];
  
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
    private floorServices :FloorServicesService,
    private dialogService: DialogboxService,
    private wardService:WardService,
    private dialog : MatDialog,
    private bedService :BedService
  ) {
    this.floorForm = this.createFloorForm();
    this.wardForm = this.createWardForm();
    this.roomForm = this.createRoomForm();
    this.bedForm = this.createBedForm();
  }

  ngOnInit() {
    this.loadRooms();
    this.loadFloors();
    this.loadWards();
    this.loadBeds();

  }
  loadBeds() {
    this.bedService.getAllBeds().subscribe({
    
      next: (res :any) => {
        console.log("Beds Api response :",res);
        this.beds = res.data || res;
  
        // floor wise grouping + count
        this.bedsByFloor = this.groupBedsByFloor(this.beds);
      },
      error: (err) => {
        console.error('Beds API failed', err);
      }
    });
  }

  groupBedsByFloor(beds: any[]) {
  const map: any = {};

  beds.forEach(bed => {
    const floorName = bed.floorName || 'Unknown Floor';

    if (!map[floorName]) {
      map[floorName] = {
        floorName,
        totalBeds: 0,
        occupiedBeds: 0
      };
    }

    map[floorName].totalBeds += 1;

    if (bed.isOccupied) {
      map[floorName].occupiedBeds += 1;
    }
  });

  return Object.values(map);
}

  loadFloors() {
    this.floorServices.getFloors().subscribe({
      next: (res: any) => {
        this.floors = res.content.map((f: any) => ({
          id: f.id,
          floorNumber: f.floorNumber,
          floorName: f.floorName,
          totalRooms: f.totalRooms || 0,
          totalBeds: f.totalBeds || 0
        }));
      },
      error: (err) => {
        console.error('Failed to load floors', err);
      }
    });
  }
  

  createFloorForm(): FormGroup {
    return this.fb.group({
      number: ['', [Validators.required, Validators.min(0)]],
      name: ['', [Validators.required]]
    });
  }
  onEditFloor(floor: any) {
    console.log('editing floor',floor);
    const dialogRef = this.dialog.open(FloorEditComponent, {
      width: '420px',
      panelClass:'floor-edit-dialog',
      data: { floor }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.floorServices.updateFloor(result.id, result.payload)
          .subscribe(() => {
            this.loadFloors(); // refresh list
          });
      }
    });
  }
  
  onSubmitFloor() {
    if (this.floorForm.invalid) return;
  
    const payload = {
      floorNumber: this.floorForm.value.number,
      floorName: this.floorForm.value.name,
      updatedBy: 'ADMIN'
    };
  
    // 🔵 EDIT MODE → PUT
    if (this.selectedFloorId) {
      this.floorServices.updateFloor(this.selectedFloorId, payload)
        .subscribe(() => {
          this.resetFloorForm();
          this.loadFloors();
        });
  
    // 🟢 CREATE MODE → POST
    } else {
      const createPayload = {
        ...payload,
        createdBy: 'ADMIN'
      };
  
      this.floorServices.createFloor(createPayload)
        .subscribe(() => {
          this.resetFloorForm();
          this.loadFloors();
        });
    }
  }
  resetFloorForm() {
    this.floorForm.reset();
    this.selectedFloorId = null;   // ⭐ THIS FIXES CREATE/EDIT CONFUSION
  }
  

  removeFloors(floorId:number) {
    console.log('delete floor Id',floorId);
    if (!confirm('Delete this floor ?')) return;
    this.floorServices.deleteFloor(floorId).subscribe({
      next: (res) => {
        console.log('Floor deleted ✅', res);
        this.loadFloors();
      },
      error: (err) => {
        console.error('Delete failed ', err);
      }
    });
  }
  

  createWardForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      type: [this.wardTypeOptions[0]?.value || '', [Validators.required]],
      floor: ['', [Validators.required]],
      capacity: [1, [Validators.required, Validators.min(1)]]
    });
  }
  onAddFloor(){
    if (this.floorForm.invalid) {
      return;
    }
  
    const payload = {
      floorNumber: this.floorForm.value.number,
      floorName: this.floorForm.value.name,
      description: `Floor ${this.floorForm.value.number}`,
      createdBy: 'ADMIN',
      updatedBy: 'ADMIN'
    };
  
    console.log('CREATE FLOOR PAYLOAD 👉', payload);
  
    this.floorServices.createFloor(payload).subscribe({
      next: (res) => {
        console.log('Floor created successfully ✅', res);
        this.floorForm.reset();
        this.loadFloors(); // optional but recommended
      },
      error: (err) => {
        console.error('Error creating floor', err);
      }
    });
  }

  createRoomForm(): FormGroup {
    return this.fb.group({
      number: ['', [Validators.required]],
      type: ['ICU', [Validators.required]],
      floor: ['', [Validators.required]],
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
    this.roomsService.getRooms().subscribe({
      next: (res) => {
        this.roomData = res.content.map((r: any) => ({
          id: r.roomId,
          number: r.roomNumber,
          type: r.roomType,
          floor: r.floorNumber,
          capacity: r.capacity,
          occupied: r.currentOccupancy,
          status: r.status === 'ACTIVE' ? 'Available' : 'Maintenance'
        }));
      },
      error: (err) => {
        console.error('Failed to load rooms', err);
      }
    });
  }
  

  createRoom() {
    if (this.roomForm.invalid) return;
  
    const f = this.roomForm.value;
  
    const payload = {
      roomNumber: f.number,
      roomType: f.type,          // GENERAL / ICU / PRIVATE
      capacity: f.capacity,
      status: 'ACTIVE',
      floorId: f.floor,
      wardId: f.wardId,
      hospitalId: 'H1',
      createdBy: 'ADMIN'
    };
  
    this.roomsService.createdRoom(payload).subscribe({
      next: () => {
        console.log('Room created');
        this.roomForm.reset();
        this.loadRooms();
      },
      error: (err) => {
        console.error('Create room failed', err);
      }
    });
  }
  

  // removeFloor(floorId: number) {
  //   this.floors = this.floors.filter(f => f.floorId !== floorId);
  // }
  loadWards() {
    this.wardService.getWards().subscribe({
      next: (res: any) => {
        this.wards = res.content.map((w: any) => ({
          wardId: w.wardId,
          wardName: w.wardName,
          wardType: w.wardType,
          capacity: w.capacity,
          currentOccupancy: w.currentOccupancy,
          isActive: w.isActive,
          floorId: w.floorId,
          floorName: w.floorName,
          floorNumber: w.floorNumber
        }));
      },
      error: (err) => {
        console.error('Failed to load wards', err);
      }
    });
  }
  
  // Ward Management
  onAddWard() {
    if (this.wardForm.invalid) return;
  
    const form = this.wardForm.value;
  
    const payload = {
      wardName: form.name,
      wardType: form.type,
      capacity: form.capacity,
      floorId: form.floor,
      isActive: true,
      createdBy: 'ADMIN'
    };
  
    this.wardService.createWard(payload).subscribe({
      next: () => {
        console.log('Ward created');
        this.wardForm.reset();
        this.loadWards(); // 🔥 refresh from backend
      },
      error: (error:any) => {
        console.error('Failed to create ward', error.error.message);
      }
    });
  }
  

  removeWard(wardId: number) {
    this.wards = this.wards.filter(w => w.wardId !== wardId);
  }

  // Room Management
  onAddRoom() {
  if (this.roomForm.invalid) {
    this.roomForm.markAllAsTouched();
    return;
  }

  const roomData = this.roomForm.value;

  const newRoomData = {
    number: roomData.number,
    type: roomData.type,
    floorId: roomData.floor,   // 👈 IMPORTANT (floorId number)
    wing: 'A',
    capacity: roomData.capacity,
    occupied: 0,
    status: 'Available',
    facilities: {
      ac: roomData.type === 'ICU',
      oxygen: true,
      ventilator: roomData.type === 'ICU',
      monitor: roomData.type === 'ICU'
    },
    icuLevel: roomData.type === 'ICU' ? 'Level 1' : undefined,
    beds: this.generateBedsForRoom(roomData.number, roomData.capacity)
  };

  // ✅ CREATE API CALL
  this.roomsService.createdRoom(newRoomData).subscribe({
    next: (res) => {
      console.log('Room created ✅', res);
      this.loadRooms();
      this.roomForm.reset();
    },
    error: (err) => {
      console.error('Create room failed ❌', err);
    }
  });
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

  // removeRoom(roomId: number) {
  //   this.roomsService.deleteRoom(roomId);
  //   this.loadRooms();
  // }

  // Utility methods
  getFloorOptions() {
    return this.floors.map(f => ({
      label: `Floor ${f.floorNumber}`,
      value: Number(f.floorId )       // 🔥 IMPORTANT
    }));
  }

  getWardsByFloor(floorId: number) {
    return this.wards.filter(w => w.floorId === floorId);
  }
  

  getRoomsByFloor(floorNumber: number) {
    return this.roomData.filter(room => room.floorNumber === floorNumber);
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
        rooms: this.roomData,
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
    const targetRoom = this.roomData.find(room => room.id === roomId);
    
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
      const targetRoom = this.roomData.find(room => room.id === roomId);
      
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
    const selectedRoom = this.roomData.find(room => room.id === roomId);
    
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
    
    return this.roomData
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
    return this.roomData.reduce((total, room) => total + (room.beds?.length || 0), 0);
  }

  getAvailableBeds(): number {
    return this.roomData.reduce((total, room) => {
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
        rooms: this.roomData,
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
   return this.floors.find(f=>f.floorNumber ===floorNumber)?.floorName ?? '';

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
