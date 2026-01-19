import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { IconComponent } from "@lk/core";
import { DIALOG_DATA_TOKEN } from "@lk/core";

export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  duration: number;
  color: string;
  icon: string;
}

export interface QuickAddDialogData {
  selectedTime: string;
  templates: ScheduleTemplate[];
  formatTimeForDisplay: (time: string) => string;
}

@Component({
  selector: 'app-quick-add-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './quick-add-dialog.component.html',
  styleUrl: './quick-add-dialog.component.scss'
})
export class QuickAddDialogComponent {
  dialogRef = inject(MatDialogRef<QuickAddDialogComponent>);
  data = inject<QuickAddDialogData>(DIALOG_DATA_TOKEN);

  get selectedTime(): string {
    return this.data.selectedTime;
  }

  get templates(): ScheduleTemplate[] {
    return this.data.templates;
  }

  formatTimeForDisplay(time: string): string {
    return this.data.formatTimeForDisplay(time);
  }

  onTemplateClick(template: ScheduleTemplate) {
    this.dialogRef.close({ template, selectedTime: this.selectedTime });
  }

  onClose() {
    this.dialogRef.close();
  }
}

