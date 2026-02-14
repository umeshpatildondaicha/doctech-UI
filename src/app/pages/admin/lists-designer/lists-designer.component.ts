import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AppInputComponent,
  AppSelectboxComponent,
  AppButtonComponent,
  IconComponent,
  GridComponent,
  ExtendedGridOptions,
  PageComponent,
  BreadcrumbItem
} from '@lk/core';
import { ColDef } from 'ag-grid-community';
import {
  ListsDesignerService,
  DataGridConfig,
  DataGridDetailsRequest,
  DataGridFilter
} from '../../../services/lists-designer.service';

const DUMMY_GRID_CONFIGS: DataGridConfig[] = [
  {
    id: 1,
    dataGridName: 'UsersList',
    displayName: 'Users Management',
    applicationPackage: 'com.doctech.admin',
    module: { name: 'Admin', displayName: 'Administration' },
    mode: 'Edit',
    deviceType: 'Web',
    gridScope: 'Global'
  },
  {
    id: 2,
    dataGridName: 'DocumentsList',
    displayName: 'Document Catalog',
    applicationPackage: 'com.doctech.documents',
    module: { name: 'Documents', displayName: 'Document Management' },
    mode: 'View',
    deviceType: 'Web',
    gridScope: 'Module'
  },
  {
    id: 3,
    dataGridName: 'TasksGrid',
    displayName: 'Task Board',
    applicationPackage: 'com.doctech.workflow',
    module: { name: 'Workflow', displayName: 'Workflow Engine' },
    mode: 'Edit',
    deviceType: 'All',
    gridScope: 'Global'
  },
  {
    id: 4,
    dataGridName: 'AuditLogGrid',
    displayName: 'Audit Trail',
    applicationPackage: 'com.doctech.base',
    module: { name: 'Base', displayName: 'Base Module' },
    mode: 'View',
    deviceType: 'Web',
    gridScope: 'Global'
  },
  {
    id: 5,
    dataGridName: 'SettingsList',
    displayName: 'Application Settings',
    applicationPackage: 'com.doctech.admin',
    module: { name: 'Admin', displayName: 'Administration' },
    mode: 'Edit',
    deviceType: 'Web',
    gridScope: 'Module'
  }
];
import { EntityToolbarComponent } from '../../../components/entity-toolbar/entity-toolbar.component';

@Component({
  selector: 'app-lists-designer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTooltipModule,
    AppInputComponent,
    AppSelectboxComponent,
    AppButtonComponent,
    IconComponent,
    GridComponent,
    PageComponent,
    EntityToolbarComponent
  ],
  templateUrl: './lists-designer.component.html',
  styleUrl: './lists-designer.component.scss'
})
export class ListsDesignerComponent implements OnInit {
  columnDefs: ColDef[] = [];
  gridOptions: ExtendedGridOptions = {};

  gridConfigs: DataGridConfig[] = [];
  totalCount = 0;
  isLoading = false;

  pageSize = 25;
  currentPage = 0;

  searchTerm = '';

  gridSearchHints = [
    'Search by grid name...',
    'Search by application package...',
    'Search by display name...'
  ];

  breadcrumb: BreadcrumbItem[] = [
    { label: 'Admin', route: '/admin-dashboard', icon: 'admin_panel_settings' },
    { label: 'Lists Designer', route: '/admin/lists-designer', icon: 'grid_on', isActive: true }
  ];

  constructor(
    private readonly listsDesignerService: ListsDesignerService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.setupGrid();
    this.loadGridConfigs();
  }

  setupGrid(): void {
    this.columnDefs = [
      {
        headerName: 'Grid Name',
        field: 'dataGridName',
        flex: 2,
        minWidth: 200,
        cellRenderer: (params: { value: string; data: DataGridConfig }) => {
          const name = params.value || '';
          const displayName = params.data?.displayName || name;
          return `
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <span class="material-icons" style="color: white; font-size: 18px;">grid_on</span>
              </div>
              <div>
                <div style="font-weight: 600; color: var(--primary-font-color);">${this.escapeHtml(name)}</div>
                ${displayName === name ? '' : `<div style="font-size: 12px; color: var(--secondary-font-color);">${this.escapeHtml(displayName)}</div>`}
              </div>
            </div>
          `;
        }
      },
      {
        headerName: 'Application Package',
        field: 'applicationPackage',
        flex: 1.5,
        minWidth: 160,
        cellRenderer: (params: { value: string }) => {
          return `<span style="display: inline-block; padding: 4px 12px; border-radius: 16px; background: var(--chip-bg, #e8eaf6); color: var(--chip-color, #3f51b5); font-size: 12px; font-weight: 500;">${this.escapeHtml(params.value || '')}</span>`;
        }
      },
      {
        headerName: 'Module',
        field: 'module.displayName',
        flex: 1.5,
        minWidth: 160,
        valueGetter: (params) => params.data?.module?.displayName ?? params.data?.module?.name ?? ''
      },
      {
        headerName: 'Mode',
        field: 'mode',
        flex: 0.8,
        minWidth: 90
      },
      {
        headerName: 'Device Type',
        field: 'deviceType',
        flex: 0.8,
        minWidth: 100
      },
      {
        headerName: 'Grid Scope',
        field: 'gridScope',
        flex: 0.8,
        minWidth: 100
      }
    ];

    this.gridOptions = {
      menuActions: [
        {
          title: 'View',
          icon: 'visibility',
          click: (param) => this.viewGridConfig(param.data)
        },
        {
          title: 'Edit',
          icon: 'edit',
          click: (param) => this.editGridConfig(param.data)
        },
        {
          title: 'Delete',
          icon: 'delete',
          click: (param) => this.deleteGridConfig(param.data)
        }
      ],
      filterConfig: {
        filterConfig: [
          { label: 'Grid Name', key: 'dataGridName', type: 'input' },
          { label: 'Application Package', key: 'applicationPackage', type: 'input' },
          { label: 'Mode', key: 'mode', type: 'input' },
          { label: 'Device Type', key: 'deviceType', type: 'input' }
        ]
      }
    };
  }

  loadGridConfigs(): void {
    this.isLoading = true;

    const filters: DataGridFilter[] = [];
    if (this.searchTerm) {
      filters.push({
        dataType: 'String',
        fieldName: 'dataGridName',
        operation: 'CONTAINS',
        value: this.searchTerm
      });
    }

    const request: DataGridDetailsRequest = {
      filters,
      projection: null,
      ulimit: this.pageSize,
      llimit: this.currentPage * this.pageSize,
      columnName: 'dataGridName',
      orderType: 'asc',
      searchType: null
    };

    this.listsDesignerService.getDataGridDetails(request).subscribe({
      next: (data) => {
        this.gridConfigs = (data?.length ? data : DUMMY_GRID_CONFIGS) || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading grid configurations:', err);
        this.gridConfigs = DUMMY_GRID_CONFIGS;
        this.isLoading = false;
      }
    });

    this.listsDesignerService.getCount(filters).subscribe({
      next: (count) => {
        this.totalCount = count;
      },
      error: () => {
        this.totalCount = this.gridConfigs.length || DUMMY_GRID_CONFIGS.length;
      }
    });
  }

  onEntitySearch(query: string): void {
    this.searchTerm = query;
    this.currentPage = 0;
    this.loadGridConfigs();
  }

  onFilterClick(): void {
    // Grid filter is in gridOptions.filterConfig
  }

  addGridConfig(): void {
    // TODO: open add grid configuration dialog / navigate to config page
  }

  viewGridConfig(config: DataGridConfig): void {
    // TODO: open view dialog or navigate to detail
    console.log('View grid config:', config);
  }

  editGridConfig(config: DataGridConfig): void {
    if (config.id != null) {
      this.router.navigate(['/admin/lists-designer/edit', config.id]);
    }
  }

  deleteGridConfig(config: DataGridConfig): void {
    if (!config.id) return;
    const name = config.dataGridName || config.displayName || 'this grid';
    if (confirm(`Are you sure you want to delete grid configuration "${name}"?`)) {
      // TODO: call delete API when available
      console.log('Delete grid config:', config);
      this.loadGridConfigs();
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
