import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { IconComponent, AppButtonComponent, DialogboxService, DialogFooterAction } from '@lk/core';
import { DietAssignmentDialogComponent } from '../../../../diet-assignment-dialog/diet-assignment-dialog.component';
import { DietPlanCardComponent } from '../../../../../components/diet-plan-card/diet-plan-card.component';
import { DietCardComponent } from '../../../../../components/diet-card/diet-card.component';
import { Diet } from '../../../../../interfaces/diet.interface';

@Component({
  selector: 'app-diet-assignment-tab',
  standalone: true,
  imports: [CommonModule, MatIconModule, IconComponent, AppButtonComponent, DietPlanCardComponent, DietCardComponent],
  templateUrl: './diet-assignment-tab.component.html',
  styleUrl: './diet-assignment-tab.component.scss'
})
export class DietAssignmentTabComponent implements OnInit {
  @Input() patientId: string = '';
  @Input() patientName: string = '';

  dietAssignments: any[] = [];

  constructor(private readonly dialogService: DialogboxService) {}

  ngOnInit(): void {}

  getIndividualDietAssignments(): any[] {
    return this.dietAssignments.filter(a => !a.planId);
  }

  getWeeklyDietAssignments(): any[] {
    return this.dietAssignments.filter(a => !!a.planId);
  }

  getTotalIndividualDiets(): number {
    return this.getIndividualDietAssignments()
      .reduce((sum, a) => sum + (a.diets?.length || 0), 0);
  }

  getIndividualDietsFromAssignment(assignment: any): Diet[] {
    return assignment.diets || [];
  }

  getDietsByDay(assignment: any): Record<string, any[]> {
    const result: Record<string, any[]> = {};
    const schedule = assignment.schedule || {};
    this.getWeekDays().forEach(day => {
      result[day] = schedule[day] || [];
    });
    return result;
  }

  getWeekDays(): string[] {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }

  formatDateShort(date: Date): string {
    const d = new Date(date);
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
  }

  openDietAssignmentDialog(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'primary', appearance: 'basic' },
      { id: 'assign', text: 'Assign Diet', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(DietAssignmentDialogComponent, {
      title: `Assign Diet to ${this.patientName}`,
      data: { patientName: this.patientName, patientId: this.patientId, type: 'individual', dietPlans: [] },
      width: '90%', height: '95%', footerActions
    });
    ref.afterClosed().subscribe(result => {
      if (result?.action === 'assign' && result.assignment) {
        this.dietAssignments.push(result.assignment);
      }
    });
  }

  createWeeklyPlan(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'primary', appearance: 'basic' },
      { id: 'assign', text: 'Create Plan', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(DietAssignmentDialogComponent, {
      title: `New Weekly Plan for ${this.patientName}`,
      data: { patientName: this.patientName, patientId: this.patientId, type: 'weekly', dietPlans: [] },
      width: '90%', height: '95%', footerActions
    });
    ref.afterClosed().subscribe(result => {
      if (result?.action === 'assign' && result.assignment) {
        this.dietAssignments.push(result.assignment);
      }
    });
  }

  viewDietAssignment(assignment: any): void {}
  editDietAssignment(assignment: any): void {}
  removeDietAssignment(assignment: any): void {
    this.dietAssignments = this.dietAssignments.filter(a => a !== assignment);
  }
  viewDietDetails(diet: any): void {}
}
