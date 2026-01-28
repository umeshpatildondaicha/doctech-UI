import { Component, OnInit } from '@angular/core';

import { ColDef } from 'ag-grid-community';
import { 
  AdminPageHeaderComponent, 
  AdminActionBarComponent,
  type HeaderAction
} from '../../../components';
import { GridComponent, StatusCellRendererComponent, ChipCellRendererComponent, PageComponent, BreadcrumbItem, DialogboxService } from '@lk/core';

@Component({
    selector: 'app-plans',
    imports: [AdminPageHeaderComponent, AdminActionBarComponent, GridComponent, PageComponent],
    templateUrl: './plans.component.html',
    styleUrl: './plans.component.scss'
})
export class PlansComponent implements OnInit {
  breadcrumb: BreadcrumbItem[] = [
    { label: 'Plans & Offers', route: '/admin/plans', icon: 'payments', isActive: true }
  ];
  // Grid configuration
  columnDefs: ColDef[] = [];
  gridOptions: any = {};
  
  plans = [
    { 
      id: 1, 
      name: 'Basic Health Plan', 
      price: 999, 
      priceDisplay: '₹999/month',
      features: ['General Consultation', 'Basic Tests'], 
      featuresCount: 2,
      status: 'Active',
      subscribers: 150,
      createdDate: '2024-01-15',
      validUntil: '2024-12-31'
    },
    { 
      id: 2, 
      name: 'Premium Health Plan', 
      price: 1999, 
      priceDisplay: '₹1999/month',
      features: ['All Consultations', 'All Tests', 'Priority Care'], 
      featuresCount: 3,
      status: 'Active',
      subscribers: 85,
      createdDate: '2024-01-20',
      validUntil: '2024-12-31'
    },
    { 
      id: 3, 
      name: 'Family Health Plan', 
      price: 3999, 
      priceDisplay: '₹3999/month',
      features: ['Family Coverage', 'All Services', '24/7 Support'], 
      featuresCount: 3,
      status: 'Active',
      subscribers: 65,
      createdDate: '2024-02-01',
      validUntil: '2024-12-31'
    },
    { 
      id: 4, 
      name: 'Student Health Plan', 
      price: 499, 
      priceDisplay: '₹499/month',
      features: ['Basic Consultation', 'Student Discount'], 
      featuresCount: 2,
      status: 'Inactive',
      subscribers: 25,
      createdDate: '2024-01-10',
      validUntil: '2024-06-30'
    }
  ];

  headerActions: HeaderAction[] = [
    {
      text: 'Add New Plan',
      color: 'primary',
      fontIcon: 'add',
      action: 'add-plan'
    }
  ];

  constructor(private readonly dialogService: DialogboxService) {}

  ngOnInit() {
    this.setupGrid();
  }

  setupGrid() {
    this.columnDefs = [
      {
        headerName: 'Plan ID',
        field: 'id',
        width: 100,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Plan Name',
        field: 'name',
        width: 200,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Price',
        field: 'priceDisplay',
        width: 140,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Features',
        field: 'featuresCount',
        width: 120,
        sortable: true,
        filter: true,
        valueFormatter: (params: any) => `${params.value} features`
      },
      {
        headerName: 'Subscribers',
        field: 'subscribers',
        width: 120,
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
        headerName: 'Created Date',
        field: 'createdDate',
        width: 140,
        sortable: true,
        filter: true,
        valueFormatter: (params: any) => {
          return new Date(params.value).toLocaleDateString();
        }
      },
      {
        headerName: 'Valid Until',
        field: 'validUntil',
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
          click: (param: any) => { this.viewPlan(param.data); }
        },
        {
          title: 'Edit Plan',
          icon: 'edit',
          click: (param: any) => { this.editPlan(param.data); }
        },
        {
          title: 'Activate/Deactivate',
          icon: 'power_settings_new',
          click: (param: any) => { this.togglePlanStatus(param.data); }
        },
        {
          title: 'Delete',
          icon: 'delete',
          click: (param: any) => { this.deletePlan(param.data); }
        }
      ]
    };
  }

  onHeaderAction(action: string) {
    switch (action) {
      case 'add-plan':
        this.addNewPlan();
        break;
    }
  }

  addNewPlan() {
    console.log('Add new plan');
  }

  viewPlan(plan: any) {
    console.log('View plan details:', plan);
  }

  editPlan(plan: any) {
    console.log('Edit plan:', plan);
  }

  togglePlanStatus(plan: any) {
    plan.status = plan.status === 'Active' ? 'Inactive' : 'Active';
    console.log('Toggled plan status:', plan);
  }

  deletePlan(plan: any) {
    const dialogRef = this.dialogService.openConfirmationDialog({
      title: 'Delete Plan',
      message: `Are you sure you want to delete "${plan.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: 'delete',
      showConfirm: true,
      showCancel: true
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result === 'confirm' || result?.action === 'confirm' || result === true) {
        this.plans = this.plans.filter(p => p.id !== plan.id);
        console.log('Deleted plan:', plan);
      }
    });
  }
} 