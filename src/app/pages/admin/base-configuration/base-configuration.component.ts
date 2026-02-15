import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AppInputComponent,
  AppSelectboxComponent,
  AppButtonComponent,
  IconComponent,
  DialogFooterAction,
  GridComponent,
  ExtendedGridOptions,
  DialogboxService,
  PageComponent,
  BreadcrumbItem
} from '@lk/core';
import { ColDef } from 'ag-grid-community';
import {
  BaseConfigurationService,
  BaseConfiguration,
  BaseConfigDetailsRequest,
  BaseConfigFilter
} from '../../../services/base-configuration.service';
import { BaseConfigurationFormComponent } from './base-configuration-form/base-configuration-form.component';
import { EntityToolbarComponent } from '../../../components/entity-toolbar/entity-toolbar.component';

@Component({
  selector: 'app-base-configuration',
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
  templateUrl: './base-configuration.component.html',
  styleUrl: './base-configuration.component.scss'
})
export class BaseConfigurationComponent implements OnInit {
  // Grid configuration
  columnDefs: ColDef[] = [];
  gridOptions: ExtendedGridOptions = {};

  // Data
  configurations: BaseConfiguration[] = [];
  totalCount = 0;
  isLoading = false;

  // Pagination
  pageSize = 25;
  currentPage = 0;

  // Search & Filter
  searchTerm = '';
  selectedAppFilter = '';

  /** Search bar hint texts (typing animation) */
  configSearchHints = [
    'Search by config key...',
    'Search by application name...',
    'Search by config tag...'
  ];

  // Breadcrumb
  breadcrumb: BreadcrumbItem[] = [
    { label: 'Admin', route: '/admin-dashboard', icon: 'admin_panel_settings' },
    { label: 'Base Configuration', route: '/admin/base-configuration', icon: 'settings', isActive: true }
  ];

  constructor(
    private readonly baseConfigService: BaseConfigurationService,
    private readonly dialogService: DialogboxService
  ) {}

  ngOnInit(): void {
    this.setupGrid();
    this.loadConfigurations();
  }

  setupGrid(): void {
    this.columnDefs = [
      {
        headerName: 'Config Key',
        field: 'configKey',
        flex: 2,
        minWidth: 180,
        cellRenderer: (params: any) => {
          return `
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <span class="material-icons" style="color: white; font-size: 18px;">settings</span>
              </div>
              <div>
                <div style="font-weight: 600; color: var(--primary-font-color);">${params.value || ''}</div>
              </div>
            </div>
          `;
        }
      },
      {
        headerName: 'Config Tag',
        field: 'configTag',
        flex: 1,
        minWidth: 120,
        cellRenderer: (params: any) => {
          return `<span style="display: inline-block; padding: 4px 12px; border-radius: 16px; background: var(--chip-bg, #e8eaf6); color: var(--chip-color, #3f51b5); font-size: 12px; font-weight: 500;">${params.value || ''}</span>`;
        }
      },
      {
        headerName: 'Application',
        field: 'applicationName',
        flex: 1.5,
        minWidth: 150
      },
      {
        headerName: 'Config Value',
        field: 'configValue',
        flex: 2,
        minWidth: 200,
        cellRenderer: (params: any) => {
          const value = params.value || '';
          const truncated = value.length > 60 ? value.substring(0, 60) + '...' : value;
          return `<span style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--secondary-font-color);" title="${this.escapeHtml(value)}">${this.escapeHtml(truncated)}</span>`;
        }
      },
      {
        headerName: 'Customer ID',
        field: 'customerId',
        flex: 0.8,
        minWidth: 110,
        cellRenderer: (params: any) => {
          return `<span style="font-weight: 500;">${params.value ?? ''}</span>`;
        }
      }
    ];

    this.gridOptions = {
      menuActions: [
        {
          title: 'View',
          icon: 'visibility',
          click: (param) => this.viewConfiguration(param.data)
        },
        {
          title: 'Edit',
          icon: 'edit',
          click: (param) => this.editConfiguration(param.data)
        },
        {
          title: 'Delete',
          icon: 'delete',
          click: (param) => this.deleteConfiguration(param.data)
        }
      ],
      filterConfig: {
        filterConfig: [
          { label: 'Config Key', key: 'configKey', type: 'input' },
          { label: 'Config Tag', key: 'configTag', type: 'input' },
          { label: 'Application Name', key: 'applicationName', type: 'input' },
          { label: 'Customer ID', key: 'customerId', type: 'input' }
        ]
      }
    };
  }

  /**
   * Load configurations from the backend
   */
  loadConfigurations(): void {
    this.isLoading = true;

    const filters: BaseConfigFilter[] = [];
    if (this.searchTerm) {
      filters.push({
        dataType: 'String',
        fieldName: 'configKey',
        operation: 'CONTAINS',
        value: this.searchTerm
      });
    }
    if (this.selectedAppFilter) {
      filters.push({
        dataType: 'String',
        fieldName: 'applicationName',
        operation: 'EQUALS',
        value: this.selectedAppFilter
      });
    }

    const request: BaseConfigDetailsRequest = {
      filters,
      projection: null,
      ulimit: this.pageSize,
      llimit: this.currentPage * this.pageSize,
      columnName: 'configKey',
      orderType: 'asc',
      searchType: null
    };

    // Load configurations
    this.baseConfigService.getBaseConfigurationDetails(request).subscribe({
      next: (data) => {
        this.configurations = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading configurations:', err);
        this.isLoading = false;
      }
    });

    // Load count
    this.baseConfigService.getCount(filters).subscribe({
      next: (count) => {
        this.totalCount = count;
      },
      error: (err) => {
        console.error('Error loading count:', err);
      }
    });
  }

  /**
   * Entity bar search - reload list with search term
   */
  onEntitySearch(query: string): void {
    this.searchTerm = query;
    this.currentPage = 0;
    this.loadConfigurations();
  }

  /**
   * Entity bar filter click - grid filter is available via grid options menu
   */
  onFilterClick(): void {
    // Grid filter is in gridOptions.filterConfig; user can use column filters in grid menu
  }

  /**
   * Open dialog to add a new configuration
   */
  addConfiguration(): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'stroked'
      },
      {
        id: 'save',
        text: 'Save Configuration',
        color: 'primary',
        appearance: 'raised',
        fontIcon: 'save'
      }
    ];

    this.dialogService.openDialog(BaseConfigurationFormComponent, {
      title: 'Add Base Configuration',
      width: '680px',
      height: 'auto',
      maxWidth: '90vw',
      data: {
        config: undefined,
        isEditMode: false,
        isViewMode: false,
        onSave: (formData: BaseConfiguration) => {
          const payload = {
            configKey: formData.configKey,
            configValue: formData.configValue,
            configTag: formData.configTag,
            applicationName: formData.applicationName,
            customerId: formData.customerId
          };
          this.baseConfigService.create(payload).subscribe({
            next: () => this.loadConfigurations(),
            error: (err) => console.error('Error creating configuration:', err)
          });
        }
      },
      footerActions
    });
  }

  /**
   * Open dialog to edit a configuration
   */
  editConfiguration(config: BaseConfiguration): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Cancel',
        color: 'secondary',
        appearance: 'stroked'
      },
      {
        id: 'save',
        text: 'Update Configuration',
        color: 'primary',
        appearance: 'raised',
        fontIcon: 'save'
      }
    ];

    this.dialogService.openDialog(BaseConfigurationFormComponent, {
      title: `Edit Configuration - ${config.configKey}`,
      width: '680px',
      height: 'auto',
      maxWidth: '90vw',
      data: {
        config,
        isEditMode: true,
        isViewMode: false,
        onSave: (formData: BaseConfiguration) => {
          this.baseConfigService.update(formData).subscribe({
            next: () => this.loadConfigurations(),
            error: (err) => console.error('Error updating configuration:', err)
          });
        }
      },
      footerActions
    });

  }

  /**
   * Open dialog to view a configuration (read-only)
   */
  viewConfiguration(config: BaseConfiguration): void {
    const footerActions: DialogFooterAction[] = [
      {
        id: 'cancel',
        text: 'Close',
        color: 'secondary',
        appearance: 'stroked'
      }
    ];

    const dialogRef = this.dialogService.openDialog(BaseConfigurationFormComponent, {
      title: `View Configuration - ${config.configKey}`,
      width: '680px',
      height: 'auto',
      maxWidth: '90vw',
      data: {
        config,
        isEditMode: false,
        isViewMode: true
      },
      footerActions
    });

    // After dialog opens, populate and disable form
    dialogRef.afterOpened().subscribe(() => {
      const formComp = dialogRef.componentInstance as unknown as BaseConfigurationFormComponent;
      if (formComp) {
        formComp.populateForm(config);
        formComp.setViewMode();
      }
    });
  }

  /**
   * Delete a configuration
   */
  deleteConfiguration(config: BaseConfiguration): void {
    if (!config.id) return;

    const confirmed = confirm(`Are you sure you want to delete configuration "${config.configKey}"?`);
    if (confirmed) {
      this.baseConfigService.delete(config.id).subscribe({
        next: () => {
          this.loadConfigurations();
        },
        error: (err) => {
          console.error('Error deleting configuration:', err);
        }
      });
    }
  }

  /**
   * Handle search
   */
  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 0;
    this.loadConfigurations();
  }

  /**
   * Escape HTML for safe rendering in cells
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
