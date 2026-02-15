import { Component, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

import { IconComponent } from "@lk/core";
import { AppInputComponent } from "@lk/core";
import { AppButtonComponent } from "@lk/core";
import { AppSelectboxComponent } from "@lk/core";
import { AdminStatsCardComponent, StatCard } from '../../components/admin-stats-card/admin-stats-card.component';

interface Doctor {
  id: string;
  name: string;
  profilePic: string;
  specialization: string;
  hospital: string;
  availability: 'Available' | 'On Leave' | 'Emergency Only' | 'Inactive';
  status: 'Active' | 'Inactive' | 'On Leave';
  phone: string;
  email: string;
  experience: string;
  qualifications: string;
  joinedDate: string;
  lastLogin?: string;
  hasUserAccount: boolean;
  tags: string[];
}

interface DoctorStats {
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
  specializations: { [key: string]: number };
}

@Component({
    selector: 'app-doctor',
    imports: [
    FormsModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule,
    MatCheckboxModule,
    MatProgressBarModule,
    IconComponent,
    AppInputComponent,
    AppButtonComponent,
    AppSelectboxComponent
    ,
    AdminStatsCardComponent
],
    templateUrl: './doctor.component.html',
    styleUrl: './doctor.component.scss'
})
export class DoctorComponent implements OnInit {
  // View modes
  viewMode: 'table' | 'cards' = 'table';
  
  // Search and filters
  searchTerm: string = '';
  selectedSpecializations: string[] = [];
  selectedHospitals: string[] = [];
  selectedStatuses: string[] = [];
  selectedAvailability: string[] = [];
  
  // Sorting
  sortBy: string = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  
  // Bulk actions
  selectedDoctors: string[] = [];
  selectAll: boolean = false;
  
  // Stats
  stats: DoctorStats = {
    total: 0,
    active: 0,
    onLeave: 0,
    inactive: 0,
    specializations: {}
  };

  // Sample data
  doctors: Doctor[] = [
    {
      id: 'DOC001',
      name: 'Dr. Amit Sharma',
      profilePic: 'https://randomuser.me/api/portraits/men/1.jpg',
      specialization: 'Cardiology',
      hospital: 'Main Hospital',
      availability: 'Available',
      status: 'Active',
      phone: '+91 98765 43210',
      email: 'amit.sharma@hospital.com',
      experience: '8 years',
      qualifications: 'MBBS, MD (Cardiology)',
      joinedDate: '2020-03-15',
      lastLogin: '2024-01-15 09:30',
      hasUserAccount: true,
      tags: ['Cardiologist', 'Telemedicine', 'Emergency Care']
    },
    {
      id: 'DOC002',
      name: 'Dr. Priya Verma',
      profilePic: 'https://randomuser.me/api/portraits/women/2.jpg',
      specialization: 'Neurology',
      hospital: 'City Branch',
      availability: 'On Leave',
      status: 'On Leave',
      phone: '+91 98765 43211',
      email: 'priya.verma@hospital.com',
      experience: '12 years',
      qualifications: 'MBBS, DM (Neurology)',
      joinedDate: '2018-07-22',
      hasUserAccount: false,
      tags: ['Neurologist', 'Stroke Specialist']
    },
    {
      id: 'DOC003',
      name: 'Dr. Rajesh Kumar',
      profilePic: 'https://randomuser.me/api/portraits/men/3.jpg',
      specialization: 'Orthopedics',
      hospital: 'Main Hospital',
      availability: 'Emergency Only',
      status: 'Active',
      phone: '+91 98765 43212',
      email: 'rajesh.kumar@hospital.com',
      experience: '15 years',
      qualifications: 'MBBS, MS (Orthopedics)',
      joinedDate: '2015-11-08',
      lastLogin: '2024-01-14 16:45',
      hasUserAccount: true,
      tags: ['Orthopedic Surgeon', 'Sports Medicine']
    },
    {
      id: 'DOC004',
      name: 'Dr. Sneha Patel',
      profilePic: 'https://randomuser.me/api/portraits/women/4.jpg',
      specialization: 'Pediatrics',
      hospital: 'City Branch',
      availability: 'Available',
      status: 'Active',
      phone: '+91 98765 43213',
      email: 'sneha.patel@hospital.com',
      experience: '6 years',
      qualifications: 'MBBS, MD (Pediatrics)',
      joinedDate: '2021-09-12',
      lastLogin: '2024-01-15 08:15',
      hasUserAccount: true,
      tags: ['Pediatrician', 'Child Care']
    },
    {
      id: 'DOC005',
      name: 'Dr. Vikram Singh',
      profilePic: 'https://randomuser.me/api/portraits/men/5.jpg',
      specialization: 'Dermatology',
      hospital: 'Main Hospital',
      availability: 'Available',
      status: 'Inactive',
      phone: '+91 98765 43214',
      email: 'vikram.singh@hospital.com',
      experience: '10 years',
      qualifications: 'MBBS, MD (Dermatology)',
      joinedDate: '2019-05-20',
      hasUserAccount: false,
      tags: ['Dermatologist', 'Cosmetic Surgery']
    }
  ];

  filteredDoctors: Doctor[] = [];
  
  // Available options for filters
  specializations: string[] = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'General Medicine', 'Surgery', 'Psychiatry'];
  hospitals: string[] = ['Main Hospital', 'City Branch', 'North Branch', 'South Branch'];
  statuses: string[] = ['Active', 'Inactive', 'On Leave'];
  availabilityOptions: string[] = ['Available', 'On Leave', 'Emergency Only', 'Inactive'];

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.calculateStats();
    this.applyFilters();
  }

  // Filter and search methods
  applyFilters() {
    this.filteredDoctors = this.doctors.filter(doctor => {
      const matchesSearch = !this.searchTerm || 
        doctor.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        doctor.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        doctor.phone.includes(this.searchTerm) ||
        doctor.specialization.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesSpecialization = this.selectedSpecializations.length === 0 || 
        this.selectedSpecializations.includes(doctor.specialization);
      
      const matchesHospital = this.selectedHospitals.length === 0 || 
        this.selectedHospitals.includes(doctor.hospital);
      
      const matchesStatus = this.selectedStatuses.length === 0 || 
        this.selectedStatuses.includes(doctor.status);
      
      const matchesAvailability = this.selectedAvailability.length === 0 || 
        this.selectedAvailability.includes(doctor.availability);
      
      return matchesSearch && matchesSpecialization && matchesHospital && matchesStatus && matchesAvailability;
    });

    this.sortDoctors();
    this.calculateStats();
  }

  sortDoctors() {
    this.filteredDoctors.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'specialization':
          aValue = a.specialization;
          bValue = b.specialization;
          break;
        case 'hospital':
          aValue = a.hospital;
          bValue = b.hospital;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'joinedDate':
          aValue = new Date(a.joinedDate);
          bValue = new Date(b.joinedDate);
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  calculateStats() {
    this.stats.total = this.doctors.length;
    this.stats.active = this.doctors.filter(d => d.status === 'Active').length;
    this.stats.onLeave = this.doctors.filter(d => d.status === 'On Leave').length;
    this.stats.inactive = this.doctors.filter(d => d.status === 'Inactive').length;
    
    this.stats.specializations = {};
    this.doctors.forEach(doctor => {
      this.stats.specializations[doctor.specialization] = 
        (this.stats.specializations[doctor.specialization] || 0) + 1;
    });
  }

  // Action methods
  addNewDoctor() {
    this.showSnackBar('Add New Doctor functionality will be implemented');
  }

  linkExistingDoctor() {
    this.showSnackBar('Link Existing Doctor functionality will be implemented');
  }

  bulkUpload() {
    this.showSnackBar('Bulk Upload functionality will be implemented');
  }

  exportDoctors() {
    this.showSnackBar('Export functionality will be implemented');
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'table' ? 'cards' : 'table';
  }

  onDoctorSelect(doctorId: string) {
    const index = this.selectedDoctors.indexOf(doctorId);
    if (index > -1) {
      this.selectedDoctors.splice(index, 1);
    } else {
      this.selectedDoctors.push(doctorId);
    }
    this.updateSelectAll();
  }

  onSelectAll() {
    if (this.selectAll) {
      this.selectedDoctors = this.filteredDoctors.map(d => d.id);
    } else {
      this.selectedDoctors = [];
    }
  }

  updateSelectAll() {
    this.selectAll = this.selectedDoctors.length === this.filteredDoctors.length && this.filteredDoctors.length > 0;
  }

  editDoctor(doctor: Doctor) {
    this.showSnackBar(`Edit doctor: ${doctor.name}`);
  }

  deleteDoctor(doctor: Doctor) {
    if (confirm(`Are you sure you want to delete ${doctor.name}?`)) {
      this.doctors = this.doctors.filter(d => d.id !== doctor.id);
      this.applyFilters();
      this.showSnackBar(`Doctor ${doctor.name} deleted successfully`);
    }
  }

  viewDoctor(doctor: Doctor) {
    this.showSnackBar(`View doctor: ${doctor.name}`);
  }

  scheduleDoctor(doctor: Doctor) {
    this.showSnackBar(`Schedule doctor: ${doctor.name}`);
  }

  toggleDoctorStatus(doctor: Doctor) {
    const newStatus = doctor.status === 'Active' ? 'Inactive' : 'Active';
    doctor.status = newStatus;
    doctor.availability = newStatus === 'Active' ? 'Available' : 'Inactive';
    this.applyFilters();
    this.showSnackBar(`Doctor ${doctor.name} status updated to ${newStatus}`);
  }

  getAvailabilityColor(availability: string): string {
    switch (availability) {
      case 'Available': return '#28a745';
      case 'On Leave': return '#ffc107';
      case 'Emergency Only': return '#fd7e14';
      case 'Inactive': return '#dc3545';
      default: return '#6c757d';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Active': return '#28a745';
      case 'On Leave': return '#ffc107';
      case 'Inactive': return '#dc3545';
      default: return '#6c757d';
    }
  }

  getSpecializationCount(): number {
    return Object.keys(this.stats.specializations).length;
  }

  private showSnackBar(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  get overviewStatsCards(): StatCard[] {
    return [
      { label: 'Total Doctors', value: this.stats.total ?? 0, icon: 'groups', type: 'info' },
      { label: 'Active Today', value: this.stats.active ?? 0, icon: 'check_circle', type: 'success' },
      { label: 'On Leave', value: this.stats.onLeave ?? 0, icon: 'pause_circle', type: 'warning' },
      { label: 'Inactive', value: this.stats.inactive ?? 0, icon: 'block', type: 'danger' },
      { label: 'Specializations', value: this.getSpecializationCount() ?? 0, icon: 'category', type: 'info' },
    ];
  }
}
