import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AppButtonComponent,
  IconComponent,
  PageComponent,
  BreadcrumbItem
} from '@lk/core';
import {
  ListsDesignerService,
  DataGridConfig
} from '../../../../services/lists-designer.service';
import { sampleGridConfig } from './grid-config.sample';

@Component({
  selector: 'app-lists-designer-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    MatTabsModule,
    MatExpansionModule,
    MatTooltipModule,
    AppButtonComponent,
    IconComponent,
    PageComponent
  ],
  templateUrl: './lists-designer-editor.component.html',
  styleUrl: './lists-designer-editor.component.scss'
})
export class ListsDesignerEditorComponent implements OnInit {
  gridId: number | null = null;
  gridConfig: DataGridConfig | null = null;
  viewMode: 'visual' | 'code' = 'visual';
  selectedColumnId: string | null = null;

  /** Placeholder column list - replace with API/state when backend is ready */
  columns: { id: string; name: string; dataType: string }[] = [];

  breadcrumb: BreadcrumbItem[] = [];

  /** Code view: editable JSON config (initialized from sample or API) */
  codeViewJson: string = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly listsDesignerService: ListsDesignerService
  ) {
    this.codeViewJson = JSON.stringify(sampleGridConfig, null, 2);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.gridId = +id;
      this.loadGridConfig();
    } else {
      this.router.navigate(['/admin/lists-designer']);
    }
  }

  private loadGridConfig(): void {
    if (this.gridId == null) return;
    this.listsDesignerService.getById(this.gridId).subscribe({
      next: (config) => {
        this.gridConfig = config;
        this.updateBreadcrumb();
        this.loadColumnsPlaceholder();
      },
      error: () => {
        this.gridConfig = {
          id: this.gridId ?? undefined,
          dataGridName: `Grid_${this.gridId}`,
          displayName: `Grid ${this.gridId}`
        };
        this.updateBreadcrumb();
        this.loadColumnsPlaceholder();
      }
    });
  }

  private updateBreadcrumb(): void {
    const name = this.gridConfig?.dataGridName || this.gridConfig?.displayName || 'Edit';
    this.breadcrumb = [
      { label: 'Admin', route: '/admin-dashboard', icon: 'admin_panel_settings' },
      { label: 'Lists Designer', route: '/admin/lists-designer', icon: 'grid_on' },
      { label: name, route: '', icon: 'edit', isActive: true }
    ];
  }

  private loadColumnsPlaceholder(): void {
    this.columns = [
      { id: '1', name: 'NAME', dataType: 'Text' },
      { id: '2', name: 'TYPE_TEXT', dataType: 'Text' },
      { id: '3', name: 'DOMAIN_TEXT VENDOR_TEXT', dataType: 'Text' },
      { id: '4', name: 'NODE', dataType: 'Text' },
      { id: '5', name: 'TECHNOLOGY_TEXT', dataType: 'Text' },
      { id: '6', name: 'GEOGRAPHY LEVEL', dataType: 'Text' },
      { id: '7', name: 'CREATED_ON CREATOR', dataType: 'Text' },
      { id: '8', name: 'MODIFIED_ON MODIFIER', dataType: 'Text' },
      { id: '9', name: 'STATUS_TEXT', dataType: 'Text' }
    ];
  }

  get gridName(): string {
    return this.gridConfig?.dataGridName || this.gridConfig?.displayName || 'Grid';
  }

  /** Line count for code view line numbers */
  get codeViewLines(): string[] {
    return this.codeViewJson ? this.codeViewJson.split('\n') : [];
  }

  setViewMode(mode: 'visual' | 'code'): void {
    this.viewMode = mode;
  }

  onCancel(): void {
    this.router.navigate(['/admin/lists-designer']);
  }

  onUpdate(): void {
    // TODO: persist grid config and column definitions
    this.router.navigate(['/admin/lists-designer']);
  }

  onAddColumn(): void {
    // TODO: open add column dialog
  }

  selectColumn(id: string): void {
    this.selectedColumnId = this.selectedColumnId === id ? null : id;
  }

  removeColumn(id: string): void {
    this.columns = this.columns.filter((c) => c.id !== id);
    if (this.selectedColumnId === id) this.selectedColumnId = null;
  }

  onColumnDrop(event: CdkDragDrop<{ id: string; name: string; dataType: string }[]>): void {
    moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
  }
}
