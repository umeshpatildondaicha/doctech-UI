import { Component, Inject, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { AppButtonComponent } from '@lk/core';

@Component({
    selector: 'app-meal-time-dialog',
    imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    AppButtonComponent
],
    templateUrl: './meal-time-dialog.component.html',
    styleUrl: './meal-time-dialog.component.scss'
})
export class MealTimeDialogComponent implements OnInit {
  mealTime: any = {
    label: '',
    time: ''
  };

  timeOptions: string[] = [
    '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
    '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
    '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
  ];

  constructor(
    public dialogRef: MatDialogRef<MealTimeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    // Set default time to next available slot
    this.mealTime.time = this.getNextAvailableTime();
  }

  getNextAvailableTime(): string {
    const existingTimes = this.data.mealTimes.map((mt: any) => mt.time);
    for (const time of this.timeOptions) {
      if (!existingTimes.includes(time)) {
        return time;
      }
    }
    return '12:00 PM'; // fallback
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.mealTime.label.trim() && this.mealTime.time) {
      this.dialogRef.close({ mealTime: this.mealTime });
    }
  }

  isFormValid(): boolean {
    return this.mealTime.label.trim().length > 0 && this.mealTime.time.length > 0;
  }
}
