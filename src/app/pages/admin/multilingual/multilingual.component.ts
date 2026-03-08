import { Component, OnInit } from '@angular/core';
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
  BreadcrumbItem,
} from '@lk/core';
import { ColDef } from 'ag-grid-community';
import {
  MultilingualService,
  MultiLingualConfiguration,
  MultiLingualFilter,
  MultiLingualDataRequest,
  SUPPORTED_LANGUAGES,
} from '../../../services/multilingual.service';
import { MultilingualFormComponent } from './multilingual-form/multilingual-form.component';
import { CreateTranslationKeyDialogComponent } from './create-translation-key-dialog/create-translation-key-dialog.component';
import { EntityToolbarComponent } from '../../../components/entity-toolbar/entity-toolbar.component';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-multilingual',
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
    EntityToolbarComponent,
    TranslatePipe,
  ],
  templateUrl: './multilingual.component.html',
  styleUrl: './multilingual.component.scss',
})
export class MultilingualComponent implements OnInit {
  // Grid
  columnDefs: ColDef[] = [];
  gridOptions: ExtendedGridOptions = {};

  // Data
  entries: MultiLingualConfiguration[] = [];
  totalCount = 0;
  isLoading = false;

  // Pagination
  pageSize = 25;
  currentPage = 0;

  // Filters
  searchTerm = '';
  selectedLanguage = 'en';
  selectedAppName = 'DocTech';

  // Stats
  activeLanguagesCount = 0;
  missingCount = 0;
  completionPct = 100;

  // Language selector options
  languageOptions = SUPPORTED_LANGUAGES.map((l) => ({
    label: `${l.flag} ${l.label}`,
    value: l.code,
  }));

  // App name options
  appNameOptions = [
    { label: 'DocTech', value: 'DocTech' },
    { label: 'All', value: '' },
  ];

  searchHints = [
    'Search by message key...',
    'Search by translated value...',
    'Search by category...',
  ];

  breadcrumb: BreadcrumbItem[] = [
    { label: 'Admin', route: '/admin-dashboard', icon: 'admin_panel_settings' },
    { label: 'Multilingual', route: '/admin/multilingual', icon: 'translate', isActive: true },
  ];

  constructor(
    private readonly multilingualService: MultilingualService,
    private readonly dialogService: DialogboxService
  ) {}

  ngOnInit(): void {
    this.setupGrid();
    this.loadEntries();
  }

  setupGrid(): void {
    this.columnDefs = [
      {
        headerName: 'Message Key',
        field: 'lingualKey',
        flex: 2,
        minWidth: 220,
        cellRenderer: (params: any) => `
          <div style="display:flex;align-items:center;gap:10px;padding:4px 0;">
            <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <span class="material-icons" style="color:white;font-size:18px;">key</span>
            </div>
            <div>
              <div style="font-weight:600;color:var(--primary-font-color);font-family:'JetBrains Mono',monospace;font-size:12px;">${params.value || ''}</div>
            </div>
          </div>
        `,
      },
      {
        headerName: 'Translated Value',
        field: 'value',
        flex: 2.5,
        minWidth: 240,
        cellRenderer: (params: any) => {
          const v = params.value || '';
          const short = v.length > 80 ? v.substring(0, 80) + '…' : v;
          return `<span style="color:var(--primary-font-color);font-size:13px;" title="${this.escapeHtml(v)}">${this.escapeHtml(short)}</span>`;
        },
      },
      {
        headerName: 'Language',
        field: 'languageType',
        flex: 0.8,
        minWidth: 100,
        cellRenderer: (params: any) => {
          const lang = SUPPORTED_LANGUAGES.find((l) => l.code === params.value);
          const flag = lang?.flag ?? '🌐';
          const label = lang?.label ?? params.value ?? '';
          return `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;background:rgba(99,102,241,0.1);color:#6366f1;font-size:12px;font-weight:500;">${flag} ${label}</span>`;
        },
      },
      {
        headerName: 'Category',
        field: 'category',
        flex: 1,
        minWidth: 120,
        cellRenderer: (params: any) =>
          params.value
            ? `<span style="display:inline-block;padding:4px 12px;border-radius:16px;background:var(--chip-bg,#e8eaf6);color:var(--chip-color,#3f51b5);font-size:12px;font-weight:500;">${params.value}</span>`
            : `<span style="color:var(--secondary-font-color);font-size:12px;">—</span>`,
      },
      {
        headerName: 'Default (EN)',
        field: 'defaultValue',
        flex: 1.5,
        minWidth: 150,
        cellRenderer: (params: any) => {
          const v = params.value || '';
          const short = v.length > 50 ? v.substring(0, 50) + '…' : v;
          return `<span style="color:var(--secondary-font-color);font-size:12px;font-style:italic;">${this.escapeHtml(short) || '—'}</span>`;
        },
      },
      {
        headerName: 'Modified',
        field: 'modifiedTime',
        flex: 1,
        minWidth: 110,
        cellRenderer: (params: any) => {
          if (!params.value) return '—';
          const d = new Date(params.value);
          return `<span style="font-size:12px;color:var(--secondary-font-color);">${d.toLocaleDateString()}</span>`;
        },
      },
    ];

    this.gridOptions = {
      menuActions: [
        { title: 'Edit', icon: 'edit', click: (p) => this.editEntry(p.data) },
        { title: 'View', icon: 'visibility', click: (p) => this.viewEntry(p.data) },
        { title: 'Delete', icon: 'delete', click: (p) => this.deleteEntry(p.data) },
      ],
      filterConfig: {
        filterConfig: [
          { label: 'Message Key', key: 'lingualKey', type: 'input' },
          { label: 'Language', key: 'languageType', type: 'input' },
          { label: 'Category', key: 'category', type: 'input' },
          { label: 'App Name', key: 'appName', type: 'input' },
        ],
      },
    };
  }

  loadEntries(): void {
    this.isLoading = true;

    const filters: MultiLingualFilter[] = [];

    if (this.selectedAppName) {
      filters.push({ fieldName: 'appName', operation: 'EQUALS', value: this.selectedAppName });
    }
    if (this.selectedLanguage) {
      filters.push({ fieldName: 'languageType', operation: 'EQUALS', value: this.selectedLanguage });
    }
    if (this.searchTerm?.trim()) {
      filters.push({ fieldName: 'lingualKey', operation: 'LIKE', value: this.searchTerm.trim() });
    }

    const request: MultiLingualDataRequest = {
      filters,
      projection: null,
      uLimit: this.pageSize + this.currentPage * this.pageSize,
      lLimit: this.currentPage * this.pageSize,
      orderByColumnName: 'lingualKey',
      orderType: 'ASC',
    };

    this.multilingualService.getMultiLingualData(request).subscribe({
      next: (data) => {
        // Flatten the map response into a flat list for the grid
        const flatEntries: MultiLingualConfiguration[] = [];
        for (const [appName, keys] of Object.entries(data)) {
          for (const [lingualKey, value] of Object.entries(keys)) {
            flatEntries.push({ appName, lingualKey, value, languageType: this.selectedLanguage });
          }
        }
        this.entries = flatEntries;
        this.totalCount = flatEntries.length;
        this.activeLanguagesCount = new Set(flatEntries.map((e) => e.languageType)).size;
        this.missingCount = 0;
        this.completionPct = flatEntries.length > 0 ? 100 : 0;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading multilingual entries:', err);
        this.isLoading = false;
      },
    });
  }

  onEntitySearch(query: string): void {
    this.searchTerm = query;
    this.currentPage = 0;
    this.loadEntries();
  }

  onLanguageChange(lang: string): void {
    this.selectedLanguage = lang;
    this.currentPage = 0;
    this.loadEntries();
  }

  onFilterClick(): void {
    // Grid column filters are used
  }

  addEntry(): void {
    this.dialogService.openDialog(CreateTranslationKeyDialogComponent, {
      title: 'Create new translation key',
      width: '820px',
      height: 'auto',
      maxWidth: '94vw',
      data: {
        componentData: {
          onCreated: () => this.loadEntries(),
        },
      },
      footerActions: [],
    });
  }

  editEntry(entry: MultiLingualConfiguration): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'primary', appearance: 'flat' },
      { id: 'save', text: 'Save Changes', color: 'primary', appearance: 'raised', fontIcon: 'save' },
    ];

    this.dialogService.openDialog(MultilingualFormComponent, {
      title: `Edit Translation — ${entry.lingualKey}`,
      width: '720px',
      height: 'auto',
      maxWidth: '94vw',
      data: {
        entry,
        isEditMode: true,
        isViewMode: false,
        onSave: (formData: MultiLingualConfiguration) => {
          if (formData.id) {
            this.multilingualService.updateEntry(formData).subscribe({
              next: () => this.loadEntries(),
              error: (err) => console.error('Error updating entry:', err),
            });
          }
        },
      },
      footerActions,
    });
  }

  viewEntry(entry: MultiLingualConfiguration): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Close', color: 'primary', appearance: 'flat' },
    ];

    this.dialogService.openDialog(MultilingualFormComponent, {
      title: `View Translation — ${entry.lingualKey}`,
      width: '720px',
      height: 'auto',
      maxWidth: '94vw',
      data: { entry, isEditMode: false, isViewMode: true },
      footerActions,
    });
  }

  deleteEntry(entry: MultiLingualConfiguration): void {
    if (!entry.id) return;
    const confirmed = confirm(
      `Delete translation key "${entry.lingualKey}" (${entry.languageType})?`
    );
    if (confirmed) {
      this.multilingualService.deleteEntry(entry.id).subscribe({
        next: () => this.loadEntries(),
        error: (err) => console.error('Error deleting entry:', err),
      });
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  get currentLanguageLabel(): string {
    return SUPPORTED_LANGUAGES.find((l) => l.code === this.selectedLanguage)?.label ?? 'English';
  }
}
