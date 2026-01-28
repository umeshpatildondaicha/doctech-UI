import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import { 
  AdminPageHeaderComponent,
  type HeaderAction
} from '../../../components';
import { GridComponent, StatusCellRendererComponent, PageComponent, BreadcrumbItem } from '@lk/core';
import { ConfirmDialogComponentComponent } from './confirm-dialog-component/confirm-dialog-component.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-schemes',
    imports: [CommonModule, ConfirmDialogComponentComponent, AdminPageHeaderComponent, GridComponent, PageComponent],
    templateUrl: './schemes.component.html',
    styleUrl: './schemes.component.scss'
})
export class SchemesComponent implements OnInit {
  breadcrumb: BreadcrumbItem[] = [
    { label: 'Schemes', route: '/admin/schemes', icon: 'local_activity', isActive: true }
  ];

  constructor(private dialog :MatDialog){}
  // Grid configuration
  columnDefs: ColDef[] = [];
  gridOptions: any = {};
  
  schemes = [
    { 
      id: 1, 
      name: 'Ayushman Bharat', 
      description: 'Health coverage for poor families', 
      status: 'Active', 
      beneficiaries: 500,
      coverageAmount: 500000,
      launchDate: '2018-09-23',
      lastUpdated: '2024-01-15',
      state: 'All India',
      eligibilityCriteria: 'Below Poverty Line'
    },
    { 
      id: 2, 
      name: 'PM-JAY', 
      description: 'Pradhan Mantri Jan Arogya Yojana', 
      status: 'Active', 
      beneficiaries: 300,
      coverageAmount: 500000,
      launchDate: '2018-09-23',
      lastUpdated: '2024-02-01',
      state: 'All India',
      eligibilityCriteria: 'SECC Database'
    },
    { 
      id: 3, 
      name: 'CGHS', 
      description: 'Central Government Health Scheme', 
      status: 'Active', 
      beneficiaries: 150,
      coverageAmount: 300000,
      launchDate: '1954-04-01',
      lastUpdated: '2024-01-20',
      state: 'Multiple Cities',
      eligibilityCriteria: 'Central Govt Employees'
    },
    { 
      id: 4, 
      name: 'ESIC', 
      description: 'Employees State Insurance Scheme', 
      status: 'Active', 
      beneficiaries: 200,
      coverageAmount: 100000,
      launchDate: '1952-02-24',
      lastUpdated: '2024-01-10',
      state: 'All India',
      eligibilityCriteria: 'Wage earners below ₹25k'
    },
    { 
      id: 5, 
      name: 'Rashtriya Swasthya Bima Yojana', 
      description: 'Health insurance for BPL families', 
      status: 'Inactive', 
      beneficiaries: 75,
      coverageAmount: 30000,
      launchDate: '2008-04-01',
      lastUpdated: '2023-12-31',
      state: 'Selected States',
      eligibilityCriteria: 'BPL Families'
    }
  ];

  headerActions: HeaderAction[] = [
    {
      text: 'Add New Scheme',
      color: 'primary',
      fontIcon: 'add',
      action: 'add-scheme'
    }
  ];

  ngOnInit() {
    this.setupGrid();
  }

  setupGrid() {
    this.columnDefs = [
      {
        headerName: 'Scheme ID',
        field: 'id',
        width: 100,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Scheme Name',
        field: 'name',
        width: 200,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Description',
        field: 'description',
        width: 250,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Beneficiaries',
        field: 'beneficiaries',
        width: 120,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Coverage Amount',
        field: 'coverageAmount',
        width: 150,
        sortable: true,
        filter: true,
        valueFormatter: (params: any) => `₹${params.value.toLocaleString()}`
      },
      {
        headerName: 'State/Region',
        field: 'state',
        width: 140,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Status',
        field: 'status',
        width: 120,
        sortable: true,
        filter: true,
        cellRenderer: StatusCellRendererComponent
      },
      {
        headerName: 'Launch Date',
        field: 'launchDate',
        width: 140,
        sortable: true,
        filter: true,
        valueFormatter: (params: any) => {
          return new Date(params.value).toLocaleDateString();
        }
      },
      {
        headerName: 'Last Updated',
        field: 'lastUpdated',
        width: 140,
        sortable: true,
        filter: true,
        valueFormatter: (params: any) => {
          return new Date(params.value).toLocaleDateString();
        }
      }
    ];

    this.gridOptions = {
      menuActions: [
        {
          title: 'View Details',
          icon: 'visibility',
          click: (param: any) => { this.viewScheme(param.data); }
        },
        {
          title: 'Edit Scheme',
          icon: 'edit',
          click: (param: any) => { this.editScheme(param.data); }
        },
        {
          title: 'Activate/Deactivate',
          icon: 'power_settings_new',
          click: (param: any) => { this.toggleSchemeStatus(param.data); }
        },
        {
          title: 'View Beneficiaries',
          icon: 'group',
          click: (param: any) => { this.viewBeneficiaries(param.data); }
        },
        {
          title: 'Delete',
          icon: 'delete',
          click: (param: any) => { this.deleteScheme(param.data); }
        }
      ]
    };
  }

  onHeaderAction(action: string) {
    switch (action) {
      case 'add-scheme':
        this.addNewScheme();
        break;
    }
  }

  addNewScheme() {
    console.log('Add new scheme');
  }

  viewScheme(scheme: any) {
    console.log('View scheme details:', scheme);
  }

  editScheme(scheme: any) {
    console.log('Edit scheme:', scheme);
  }

  toggleSchemeStatus(scheme: any) {
    scheme.status = scheme.status === 'Active' ? 'Inactive' : 'Active';
    console.log('Toggled scheme status:', scheme);
  }

  viewBeneficiaries(scheme: any) {
    console.log('View beneficiaries for:', scheme);
  }

  deleteScheme(scheme: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponentComponent, {
    width: '400px',
    panelClass : 'custom-dialog-container',
    data: scheme
  });

  dialogRef.afterClosed().subscribe((confirmed: boolean) => {
    if (confirmed) {
      this.schemes = this.schemes.filter(s => s.id !== scheme.id);
      console.log('Deleted scheme:', scheme);
    }
  });
}
} 