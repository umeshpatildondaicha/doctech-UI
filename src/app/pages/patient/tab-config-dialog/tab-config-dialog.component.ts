import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DIALOG_DATA_TOKEN, IconComponent, AppButtonComponent } from "@lk/core";
import { Subject, takeUntil, filter } from 'rxjs';

export interface TabConfigItem {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  builtIn: boolean;
  badge?: number;
}

export interface TabConfigDialogData {
  tabConfigItems: TabConfigItem[];
}

@Component({
    selector: 'app-tab-config-dialog',
    imports: [
    FormsModule,
    MatSlideToggleModule,
    IconComponent,
    AppButtonComponent
],
    templateUrl: './tab-config-dialog.component.html',
    styleUrls: ['./tab-config-dialog.component.scss']
})
export class TabConfigDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<TabConfigDialogComponent>);
  data = inject<TabConfigDialogData>(DIALOG_DATA_TOKEN);
  private destroy$ = new Subject<void>();

  tabConfigItems: TabConfigItem[] = [];

  constructor() {
    // Create a deep copy of the items to avoid mutating the original
    this.tabConfigItems = JSON.parse(JSON.stringify(this.data.tabConfigItems || []));
  }

  ngOnInit(): void {
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'save' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'cancel' });
        }, 0);
        return;
      }
      
      if (result?.action === 'save') {
        setTimeout(() => {
          this.dialogRef.close({
            action: 'save',
            tabConfigItems: this.tabConfigItems
          });
        }, 0);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  moveTabUp(index: number): void {
    if (index <= 0) return;
    if (this.tabConfigItems[index].id === 'overview') return;
    if (this.tabConfigItems[index - 1].id === 'overview') return; // keep overview at top
    const tmp = this.tabConfigItems[index - 1];
    this.tabConfigItems[index - 1] = this.tabConfigItems[index];
    this.tabConfigItems[index] = tmp;
  }

  moveTabDown(index: number): void {
    if (index >= this.tabConfigItems.length - 1) return;
    if (this.tabConfigItems[index].id === 'overview') return;
    const tmp = this.tabConfigItems[index + 1];
    this.tabConfigItems[index + 1] = this.tabConfigItems[index];
    this.tabConfigItems[index] = tmp;
  }

  toggleTabEnabled(item: TabConfigItem): void {
    // Overview is unchangeable: always enabled
    if (item.id === 'overview') return;
    item.enabled = !item.enabled;
  }
}

