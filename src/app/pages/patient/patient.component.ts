import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GridComponent, SnackbarService } from "@lk/core";
import { Patient } from '../../interfaces/patient.interface';
import { ColDef } from 'ag-grid-community';
import { IconComponent ,ExtendedGridOptions} from "@lk/core";
import { PatientCreateComponent } from '../patient-create/patient-create.component';
import { StatusCellRendererComponent } from "@lk/core";
import { CoreEventService, DialogboxService, DialogFooterAction } from "@lk/core";
import { PatientService } from '../../services/patient.service';
import { environment } from '../../../environments/environment';
import { JsonPipe } from '@angular/common';

@Component({
    selector: 'app-patient',
    imports: [GridComponent, IconComponent,JsonPipe],
    templateUrl: './patient.component.html',
    styleUrl: './patient.component.scss'
})
export class PatientComponent  implements OnInit{
  patientData: Patient[] = [];

  columnDefs: ColDef[] = [
    { field: 'bloodGroup', headerName: 'Blood Group', width: 140, sortable: true, filter: true, cellRenderer: StatusCellRendererComponent },
    { field: 'firstName', headerName: 'First Name', width: 150, sortable: true, filter: true },
    { field: 'lastName', headerName: 'Last Name', width: 80, sortable: true, filter: true },
    { field: 'dateOfBirth', headerName: 'Date of Birth', width: 140, sortable: true, filter: true },
    { field: 'gender', headerName: 'Gender', width: 140, sortable: true, filter: true },
    { field: 'contact', headerName: 'Contact', width: 120, sortable: true, filter: true },
    { field: 'email', headerName: 'Email', width: 200, sortable: true, filter: true },
    { field: 'address', headerName: 'Address', width: 150, sortable: true, filter: true },
    { field: 'createdDate', headerName: 'Created Date', width: 120, sortable: true, filter: true },
    { field: 'updatedDate', headerName: 'Updated Date', width: 120, sortable: true, filter: true }
  ];

  
  
  loading=false;
 
  selectedPatientId!: number; 

  constructor(private dialogService: DialogboxService,
     private router: Router,
      private eventService: CoreEventService,
      private patientService: PatientService,
      private snackbarService :SnackbarService
    
    ) {
    // this.initializeGridOptions();
    this.eventService.setBreadcrumb({
      label: 'Patients',
      icon: 'groups'
    });
  }
  // apiConfig:any = {
  //   dataConfig: {
  //     url: environment.apiUrl,
  //     rest: '/api/patients', // New format - API endpoint path
  //     params: "",
  //     context: "",
  //     fiqlKey: "", // Key name for FIQL filter parameter
  //     lLimitKey: 'llimit',
  //     uLimitKey: 'ulimit',
  //     requestType: 'GET',
  //     type: 'GET', // Alternative format
  //     queryParamsUrl: 'llimit=0&ulimit=100',
  //     suppressNullValues: true,
  //     suppressDefaultFiqlOnApply: false,
  //     dataKey: "content",
  //     countKey:"totalElements", // Key to extract data from response
  //     dataType: 'object', 
  //   },
  //   countConfig: {
  //     rest: '/api/patients/doctor/DR1/connected/count',
  //     type: 'GET',
  //     queryParamsUrl: '',
  //     suppressNullValues: true
  //   },
  //   filterConfig: {
  //     filterConfig: [
  //       { key: 'bloodGroup', label: 'Blood Group', type: 'input' },
  //       { key: 'firstName', label: 'First Name', type: 'input' },
  //       { key: 'lastName', label: 'Last Name', type: 'input' },
  //       { key: 'dateOfBirth', label: 'Date of Birth', type: 'input' },
  //       {key :'email',label:'Email',type:'input'},
  //       {
  //         key: 'gender',
  //         label: 'Gender',
  //         type: 'select',
  //         optionList: [
  //           { name: 'Male', value: 'MALE' },
  //           { name: 'Female', value: 'FEMALE' },
  //           { name: 'Other', value: 'OTHER' }
  //         ]
  //       },
  //       { key: 'contact', label: 'Contact', type: 'input' },
  //       { key: 'address', label: 'Address', type: 'input' }
  //     ]
  //   }
   
  // }

  ngOnInit(): void {
    this.initializeGridOptions();
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.patientService.getPatients().subscribe({
      next: (res: any) => {
        this.patientData = res?.content || res?.data || (Array.isArray(res) ? res : []);
        this.loading = false;
        console.log('[Patient] GET patients success', { count: this.patientData?.length ?? 0, raw: res });
      },
      error: (err) => {
        this.loading = false;
        console.error('[Patient] GET patients failed', err);
        this.snackbarService.error('Failed to load patients');
      }
    });
  }

  
  appointmentGridOptions!: ExtendedGridOptions;

  initializeGridOptions() {
    this.appointmentGridOptions  ={
    paginationMode :'infinite',

      menuActions: [
        {
          "title":"View",
          "icon":"remove_red_eye",
          "click": (param:any)=> {this.onViewPatient(param)}
        },
        {
          "title":"Edit",
          "icon":"edit",
          "click": (param:any)=> {this.onEditPatient(param)}
        },
        {
          "title":"Delete",
          "icon":"delete",
          "click": (param:any)=> {this.onDeletePatient(param)}
        },
      ]
    };
  }

  onViewPatient(param: any) {
    this.router.navigate(['/patient-profile'], { 
      queryParams: { 
        patientId: param?.data?.patientId,
        patientName: `${param?.data?.firstName} ${param?.data?.lastName}`
      }
    });
  }
  onEditPatient(param: any) {
    this.selectedPatientId = param?.data?.patientId;
    this.onCreatePatient('edit', param?.data)
  }
  onDeletePatient(param: any) {
    this.patientService.deletePatient(param?.data?.patientId).subscribe({
      next: () => {
        console.log('[Patient] DELETE patient success', param?.data?.patientId);
        this.snackbarService.success('Patient deleted successfully');
        this.loadPatients();
      },
      error: (err) => {
        console.error('[Patient] DELETE patient failed', err);
        this.snackbarService.error('Failed to delete patient');
      }
    });
  }


  /** Normalize gender to backend enum (MALE, FEMALE, OTHER). */
  private normalizeGender(value: string | undefined): string {
    if (!value) return 'OTHER';
    const v = String(value).toLowerCase();
    if (v === 'male') return 'MALE';
    if (v === 'female') return 'FEMALE';
    return value.toUpperCase();
  }

  /** Normalize blood group to backend enum (e.g. A_POSITIVE). */
  private normalizeBloodGroup(value: string | undefined): string {
    if (!value) return 'A_POSITIVE';
    const map: Record<string, string> = {
      'A+': 'A_POSITIVE', 'A-': 'A_NEGATIVE',
      'B+': 'B_POSITIVE', 'B-': 'B_NEGATIVE',
      'AB+': 'AB_POSITIVE', 'AB-': 'AB_NEGATIVE',
      'O+': 'O_POSITIVE', 'O-': 'O_NEGATIVE'
    };
    return map[value] ?? value;
  }

  /** True when dialog closed with real form data (not just footer action). */
  private hasFormData(result: any): boolean {
    return result && typeof result === 'object' && result.firstName != null && result.lastName != null;
  }

  onCreatePatient(mode: string = 'create', param?: Patient) {
    const isViewMode = mode === 'view';
    const footerActions: DialogFooterAction[] = [];

    if (!isViewMode) {
      footerActions.push({
        id: 'cancel',
        text: 'Cancel',
        color: 'primary',
        appearance: 'basic'
      });
    }
    footerActions.push({
      id: 'submit',
      text: isViewMode ? 'Close' : mode === 'create' ? 'Create Patient' : 'Save Changes',
      color: 'primary',
      appearance: isViewMode ? 'basic' : 'raised'

    });

    const dialogRef = this.dialogService.openDialog(PatientCreateComponent, {
      title: mode === 'create' ? 'Create Patient' : mode === 'edit' ? 'Edit Patient' : 'View Patient',
      width: '70%',
      data: {
        mode,
        patient: param,
        onSubmit: (payload: any, submitMode: string, patientId?: number) => {
          console.log('[Patient] Dialog onSubmit called', { submitMode, patientId, hasPayload: !!payload?.firstName });
          const apiPayload = {
            firstName: payload.firstName,
            lastName: payload.lastName,
            dateOfBirth: payload.dateOfBirth,
            gender: this.normalizeGender(payload.gender),
            contact: payload.contact,
            email: payload.email,
            password: payload.password,
            address: payload.address,
            city: payload.city,
            bloodGroup: this.normalizeBloodGroup(payload.bloodGroup)
          };
          if (submitMode === 'create') {
            console.log('[Patient] POST create patient', apiPayload);
            this.patientService.createPatient(apiPayload).subscribe({
              next: (res) => {
                console.log('[Patient] POST create patient success', res);
                this.snackbarService.success('Patient created successfully');
                this.loadPatients();
                dialogRef.close();
              },
              error: (err) => {
                console.error('[Patient] POST create patient failed', err);
                this.snackbarService.error('Failed to create patient');
              }
            });
          } else if (submitMode === 'edit' && patientId != null) {
            console.log('[Patient] PUT update patient', patientId, apiPayload);
            this.patientService.updatePatient(patientId, apiPayload).subscribe({
              next: (res) => {
                console.log('[Patient] PUT update patient success', res);
                this.snackbarService.success('Patient updated successfully');
                this.loadPatients();
                dialogRef.close();
              },
              error: (err) => {
                console.error('[Patient] PUT update patient failed', err);
                this.snackbarService.error('Failed to update patient');
              }
            });
          }
        }
      },
      footerActions
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) return;
      if (!result || result === false || result?.action === 'cancel') return;
      if (this.hasFormData(result)) {
        const payload = {
          firstName: result.firstName,
          lastName: result.lastName,
          dateOfBirth: result.dateOfBirth,
          gender: this.normalizeGender(result.gender),
          contact: result.contact,
          email: result.email,
          password: result.password,
          address: result.address,
          city: result.city,
          bloodGroup: this.normalizeBloodGroup(result.bloodGroup)
        };
        if (mode === 'create') {
          console.log('[Patient] POST create (from afterClosed)', payload);
          this.patientService.createPatient(payload).subscribe({
            next: (res) => {
              console.log('[Patient] POST create patient success', res);
              this.snackbarService.success('Patient created successfully');
              this.loadPatients();
            },
            error: (err) => {
              console.error('[Patient] POST create patient failed', err);
              this.snackbarService.error('Failed to create patient');
            }
          });
        } else if (mode === 'edit' && this.selectedPatientId != null) {
          console.log('[Patient] PUT update (from afterClosed)', this.selectedPatientId, payload);
          this.patientService.updatePatient(this.selectedPatientId, payload).subscribe({
            next: (res) => {
              console.log('[Patient] PUT update patient success', res);
              this.snackbarService.success('Patient updated successfully');
              this.loadPatients();
            },
            error: (err) => {
              console.error('[Patient] PUT update patient failed', err);
              this.snackbarService.error('Failed to update patient');
            }
          });
        }
      }
    });
  }
  
}
