import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppButtonComponent, AppInputComponent, AppSelectboxComponent, IconComponent, PageComponent, BreadcrumbItem } from '@lk/core';
import { ButtonCheckboxComponent } from '@lk/core';
import { RoomsService } from '../../../../services/rooms.service';

interface RoomFormModel {
  number: string;
  type: 'ICU' | 'General Ward' | 'Private' | 'Semi-Private';
  floor: number;
  capacity: number;
  status: 'Available' | 'Full' | 'Maintenance';
  facilities: {
    ac: boolean;
    oxygen: boolean;
    ventilator: boolean;
    monitor: boolean;
    wifi: boolean;
    tv: boolean;
    telephone: boolean;
    bathroom: boolean;
    refrigerator: boolean;
    microwave: boolean;
    recliningChair: boolean;
    emergencyCall: boolean;
    isolation: boolean;
    soundProof: boolean;
  };
  icuLevel?: 'Level 1' | 'Level 2' | 'Level 3';
  beds: Array<{
    id: string;
    status: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance' | 'Reserved';
    facilities: {
      oxygen: boolean;
      monitor: boolean;
      suction: boolean;
      iv_pole: boolean;
      bedside_table: boolean;
      reading_light: boolean;
      privacy_curtain: boolean;
      overbed_table: boolean;
      power_outlets: boolean;
      nurse_call: boolean;
      bed_scale: boolean;
      adjustable_bed: boolean;
    };
  }>;
}

@Component({
  selector: 'app-room-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    AppButtonComponent, 
    AppInputComponent, 
    AppSelectboxComponent, 
    IconComponent,
    PageComponent,
    ButtonCheckboxComponent
  ],
  templateUrl: './room-form.component.html',
  styleUrl: './room-form.component.scss'
})
export class RoomFormComponent implements OnInit {
  roomForm: FormGroup;
  isEditMode = false;
  roomId: number | null = null;
  breadcrumb: BreadcrumbItem[] = [
    { label: 'Rooms & Beds', route: '/admin/rooms', icon: 'meeting_room' },
    { label: 'Add Room', route: '/admin/rooms/add', icon: 'add', isActive: true }
  ];
  
  roomTypeOptions = [
    { label: 'ICU', value: 'ICU' },
    { label: 'General Ward', value: 'General Ward' },
    { label: 'Private', value: 'Private' },
    { label: 'Semi-Private', value: 'Semi-Private' }
  ];
  
  floorOptions = [
    { label: 'Ground Floor', value: 0 },
    { label: '1st Floor', value: 1 },
    { label: '2nd Floor', value: 2 },
    { label: '3rd Floor', value: 3 },
    { label: '4th Floor', value: 4 },
    { label: '5th Floor', value: 5 }
  ];
  

  
  statusOptions = [
    { label: 'Available', value: 'Available' },
    { label: 'Full', value: 'Full' },
    { label: 'Maintenance', value: 'Maintenance' }
  ];
  
  icuLevelOptions = [
    { label: 'Level 1', value: 'Level 1' },
    { label: 'Level 2', value: 'Level 2' },
    { label: 'Level 3', value: 'Level 3' }
  ];

  roomFacilities = [
    { key: 'ac', label: 'Air Conditioning', icon: 'ac_unit' },
    { key: 'oxygen', label: 'Oxygen Supply', icon: 'air' },
    { key: 'ventilator', label: 'Ventilator', icon: 'respiratory_rate' },
    { key: 'monitor', label: 'Patient Monitor', icon: 'monitor_heart' },
    { key: 'wifi', label: 'WiFi Access', icon: 'wifi' },
    { key: 'tv', label: 'Television', icon: 'tv' },
    { key: 'telephone', label: 'Telephone', icon: 'phone' },
    { key: 'bathroom', label: 'Private Bathroom', icon: 'bathroom' },
    { key: 'refrigerator', label: 'Refrigerator', icon: 'kitchen' },
    { key: 'microwave', label: 'Microwave', icon: 'microwave' },
    { key: 'recliningChair', label: 'Reclining Chair', icon: 'chair' },
    { key: 'emergencyCall', label: 'Emergency Call', icon: 'emergency' },
    { key: 'isolation', label: 'Isolation Capable', icon: 'shield' },
    { key: 'soundProof', label: 'Sound Proof', icon: 'volume_off' }
  ];

  bedFacilities = [
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
    private route: ActivatedRoute,
    private router: Router,
    private roomsService: RoomsService
  ) {
    this.roomForm = this.createForm();
    // Initialize with one bed
    this.generateBeds();
  }

  ngOnInit() {
    this.roomId = this.route.snapshot.params['id'] ? +this.route.snapshot.params['id'] : null;
    this.isEditMode = !!this.roomId;
    
    if (this.isEditMode && this.roomId) {
      this.loadRoom(this.roomId);
      this.breadcrumb = [
        { label: 'Rooms & Beds', route: '/admin/rooms', icon: 'meeting_room' },
        { label: 'Edit Room', route: `/admin/rooms/edit/${this.roomId}`, icon: 'edit', isActive: true }
      ];
    } else {
      this.generateBeds();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      number: ['', [Validators.required]],
      type: ['', [Validators.required]],
      floor: [1, [Validators.required, Validators.min(0)]],

      capacity: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      status: ['Available', [Validators.required]],
      facilities: this.fb.group({
        ac: [false],
        oxygen: [false],
        ventilator: [false],
        monitor: [false],
        wifi: [false],
        tv: [false],
        telephone: [false],
        bathroom: [false],
        refrigerator: [false],
        microwave: [false],
        recliningChair: [false],
        emergencyCall: [false],
        isolation: [false],
        soundProof: [false]
      }),
      icuLevel: [''],
      beds: this.fb.array([])
    });
  }

  get bedsFormArray(): FormArray {
    return this.roomForm.get('beds') as FormArray;
  }

  loadRoom(id: number) {
    const room = this.roomsService.getRoomById(id);
    if (room) {
      this.roomForm.patchValue({
        number: room.number,
        type: room.type,
        floor: room.floor,

        capacity: room.capacity,
        status: room.status,
        facilities: room.facilities,
        icuLevel: room.icuLevel || ''
      });
      
      // Load beds
      this.bedsFormArray.clear();
      room.beds.forEach(bed => {
        this.bedsFormArray.push(this.createBedFormGroup(bed));
      });
    }
  }

  createBedFormGroup(bed?: any): FormGroup {
    return this.fb.group({
      id: [bed?.id || '', [Validators.required]],
      status: [bed?.status || 'Available', [Validators.required]],
      facilities: this.fb.group({
        oxygen: [bed?.facilities?.oxygen || false],
        monitor: [bed?.facilities?.monitor || false],
        suction: [bed?.facilities?.suction || false],
        iv_pole: [bed?.facilities?.iv_pole || false],
        bedside_table: [bed?.facilities?.bedside_table || false],
        reading_light: [bed?.facilities?.reading_light || false],
        privacy_curtain: [bed?.facilities?.privacy_curtain || false],
        overbed_table: [bed?.facilities?.overbed_table || false],
        power_outlets: [bed?.facilities?.power_outlets || false],
        nurse_call: [bed?.facilities?.nurse_call || false],
        bed_scale: [bed?.facilities?.bed_scale || false],
        adjustable_bed: [bed?.facilities?.adjustable_bed || false]
      })
    });
  }

  onCapacityChange() {
    const capacity = this.roomForm.get('capacity')?.value;
    if (capacity) {
      this.generateBeds();
    }
  }

  generateBeds() {
    const capacity = this.roomForm.get('capacity')?.value || 1;
    const roomNumber = this.roomForm.get('number')?.value || 'ROOM';
    const roomType = this.roomForm.get('type')?.value;
    
    this.bedsFormArray.clear();
    
    for (let i = 0; i < capacity; i++) {
      const bedId = `${roomNumber}-${String.fromCharCode(65 + i)}`; // A, B, C, etc.
      
      // Set default bed facilities based on room type
      let defaultBedFacilities = {
        oxygen: false,
        monitor: false,
        suction: false,
        iv_pole: false,
        bedside_table: true,
        reading_light: true,
        privacy_curtain: true,
        overbed_table: false,
        power_outlets: true,
        nurse_call: true,
        bed_scale: false,
        adjustable_bed: false
      };

      if (roomType === 'ICU') {
        defaultBedFacilities = {
          ...defaultBedFacilities,
          oxygen: true,
          monitor: true,
          suction: true,
          iv_pole: true,
          adjustable_bed: true,
          bed_scale: true
        };
      } else if (roomType === 'Private') {
        defaultBedFacilities = {
          ...defaultBedFacilities,
          overbed_table: true,
          adjustable_bed: true
        };
      }
      
      this.bedsFormArray.push(this.createBedFormGroup({ 
        id: bedId, 
        status: 'Available',
        facilities: defaultBedFacilities
      }));
    }
  }

  onRoomNumberChange() {
    this.generateBeds();
  }

  onRoomTypeChange() {
    const roomType = this.roomForm.get('type')?.value;
    
    // Auto-fill facilities based on room type
    if (roomType === 'ICU') {
      this.roomForm.patchValue({
        facilities: {
          ac: true,
          oxygen: true,
          ventilator: true,
          monitor: true,
          wifi: true,
          emergencyCall: true,
          isolation: true,
          bathroom: true,
          telephone: true
        },
        icuLevel: 'Level 1'
      });
      
      // Update bed facilities for ICU
      this.bedsFormArray.controls.forEach(bedControl => {
        bedControl.patchValue({
          facilities: {
            oxygen: true,
            monitor: true,
            suction: true,
            iv_pole: true,
            nurse_call: true,
            adjustable_bed: true,
            power_outlets: true,
            privacy_curtain: true
          }
        });
      });
    } else if (roomType === 'Private') {
      this.roomForm.patchValue({
        facilities: {
          ac: true,
          wifi: true,
          tv: true,
          telephone: true,
          bathroom: true,
          refrigerator: true,
          recliningChair: true,
          emergencyCall: true
        },
        icuLevel: ''
      });
    } else if (roomType === 'Semi-Private') {
      this.roomForm.patchValue({
        facilities: {
          ac: true,
          wifi: true,
          tv: true,
          bathroom: true,
          emergencyCall: true
        },
        icuLevel: ''
      });
    } else {
      this.roomForm.patchValue({
        icuLevel: ''
      });
    }
  }

  addBed() {
    console.log('Adding bed...', this.bedsFormArray.length);
    const roomNumber = this.roomForm.get('number')?.value || 'ROOM';
    const bedIndex = this.bedsFormArray.length;
    const bedId = `${roomNumber}-${String.fromCharCode(65 + bedIndex)}`;
    
    // Set default bed facilities based on room type
    const roomType = this.roomForm.get('type')?.value;
    let defaultBedFacilities = {
      oxygen: false,
      monitor: false,
      suction: false,
      iv_pole: false,
      bedside_table: true,
      reading_light: true,
      privacy_curtain: true,
      overbed_table: false,
      power_outlets: true,
      nurse_call: true,
      bed_scale: false,
      adjustable_bed: false
    };

    if (roomType === 'ICU') {
      defaultBedFacilities = {
        ...defaultBedFacilities,
        oxygen: true,
        monitor: true,
        suction: true,
        iv_pole: true,
        adjustable_bed: true,
        bed_scale: true
      };
    } else if (roomType === 'Private') {
      defaultBedFacilities = {
        ...defaultBedFacilities,
        overbed_table: true,
        adjustable_bed: true
      };
    }

    this.bedsFormArray.push(this.createBedFormGroup({ 
      id: bedId, 
      status: 'Available',
      facilities: defaultBedFacilities
    }));
    
    // Update capacity
    this.roomForm.patchValue({ capacity: this.bedsFormArray.length });
    console.log('Bed added successfully. Total beds:', this.bedsFormArray.length);
  }

  removeBed(index: number) {
    if (this.bedsFormArray.length > 1) {
      this.bedsFormArray.removeAt(index);
      this.roomForm.patchValue({ capacity: this.bedsFormArray.length });
    }
  }

  onSubmit() {
    if (this.roomForm.valid) {
      const formData = this.roomForm.value;
      
      try {
        if (this.isEditMode && this.roomId) {
          // Update existing room
          this.roomsService.updateRoom(this.roomId, formData);
          console.log('Room updated successfully');
        } else {
          // Add new room
          this.roomsService.addRoom(formData);
          console.log('Room added successfully');
        }
        
        // Navigate back to rooms list
        this.router.navigate(['/admin/rooms']);
      } catch (error) {
        console.error('Error saving room:', error);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    this.router.navigate(['/admin/rooms']);
  }

  onBack() {
    this.router.navigate(['/admin/rooms']);
  }

  private markFormGroupTouched() {
    Object.keys(this.roomForm.controls).forEach(key => {
      const control = this.roomForm.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            Object.keys(arrayControl.controls).forEach(nestedKey => {
              arrayControl.get(nestedKey)?.markAsTouched();
            });
          }
        });
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.roomForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.roomForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return `${fieldName} must be at least ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName} must be at most ${field.errors['max'].max}`;
    }
    return '';
  }

  getBedLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
