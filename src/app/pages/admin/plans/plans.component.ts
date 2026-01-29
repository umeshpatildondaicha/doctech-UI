import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ColDef } from 'ag-grid-community';
import { 
  AdminPageHeaderComponent, 
  AdminActionBarComponent,
  type HeaderAction
} from '../../../components';
import {
  ListingCardComponent,
  type ListingCardAction,
  type ListingCardStat,
  type ListingCardBadge
} from '../../../components/listing-card/listing-card.component';
import { GridComponent, StatusCellRendererComponent, ChipCellRendererComponent, PageComponent, BreadcrumbItem, DialogboxService, AppButtonComponent } from '@lk/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-plans',
    imports: [
      FormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatIconModule,
      AdminPageHeaderComponent,
      AdminActionBarComponent,
      GridComponent,
      PageComponent,
      ListingCardComponent,
      AppButtonComponent
    ],
    templateUrl: './plans.component.html',
    styleUrl: './plans.component.scss'
})
export class PlansComponent implements OnInit {
  breadcrumb: BreadcrumbItem[] = [
    { label: 'Plans & Offers', route: '/admin/plans', icon: 'payments', isActive: true }
  ];
  // Grid configuration (kept for optional grid view)
  columnDefs: ColDef[] = [];
  gridOptions: any = {};

  // Card view state (same pattern as diet)
  searchQuery = '';
  selectedStatus = '';
  filteredPlans: any[] = [];

  primaryPlanAction: ListingCardAction = {
    id: 'view',
    label: 'View',
    icon: 'visibility',
    tooltip: 'View plan details'
  };

  planIconActions: ListingCardAction[] = [
    { id: 'edit', label: 'Edit', icon: 'edit', tooltip: 'Edit plan' },
    { id: 'toggle', label: 'Toggle status', icon: 'power_settings_new', tooltip: 'Activate/Deactivate' },
    { id: 'delete', label: 'Delete', icon: 'delete', tooltip: 'Delete plan' }
  ];
  
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
    this.filterPlans();
  }

  // Card view: filter and stats (same pattern as diet)
  filterPlans() {
    let list = [...this.plans];
    if (this.searchQuery?.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(p => (p.name || '').toLowerCase().includes(q));
    }
    if (this.selectedStatus) {
      list = list.filter(p => (p.status || '') === this.selectedStatus);
    }
    this.filteredPlans = list;
  }

  onSearchChange() {
    this.filterPlans();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.filterPlans();
  }

  getActivePlansCount(): number {
    return this.plans.filter(p => (p.status || '').toLowerCase() === 'active').length;
  }

  getTotalSubscribers(): number {
    return this.plans.reduce((sum, p) => sum + (p.subscribers || 0), 0);
  }

  getTotalFeaturesCount(): number {
    return this.plans.reduce((sum, p) => sum + (p.featuresCount || 0), 0);
  }

  getPlanCardStats(plan: any): ListingCardStat[] {
    return [
      { label: 'Subscribers', value: plan.subscribers ?? 0, icon: 'groups' },
      { label: 'Status', value: plan.status ?? '—', icon: 'info' },
      { label: 'Features', value: plan.featuresCount ?? 0, unit: 'features', icon: 'featured_play_list' }
    ];
  }

  getPlanStatusBadge(plan: any): ListingCardBadge {
    const isActive = (plan?.status || '').toLowerCase() === 'active';
    return {
      text: plan?.status || '—',
      backgroundColor: isActive ? '#2e7d32' : '#6c757d'
    };
  }

  onPlanCardAction(action: ListingCardAction, plan: any) {
    switch (action.id) {
      case 'view': this.viewPlan(plan); break;
      case 'edit': this.editPlan(plan); break;
      case 'toggle': this.togglePlanStatus(plan); break;
      case 'delete': this.deletePlan(plan); break;
    }
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