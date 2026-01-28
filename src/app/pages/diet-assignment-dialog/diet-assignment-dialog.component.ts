import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Diet } from '../../interfaces/diet.interface';

export interface DietAssignmentDialogData {
  patientName: string;
  patientId?: string;
  availableDietPlans?: DietPlan[];
  individualDiets?: Diet[];
  patientAllergies?: string[];
}

export interface DietPlan {
  planId: string;
  name: string;
  description: string;
  type: string;
  status: string;
  duration: number; // days
  dietsCount: number;
  progress?: number;
  createdAt?: Date;
  isCompatible?: boolean;
}

export interface AssignedDietPlan {
  planId?: string;
  dietIds?: string[];
  name: string;
  duration: number;
  description: string;
  startDate: Date;
  endDate: Date;
  assignmentType: 'weekly' | 'individual';
}

@Component({
    selector: 'app-diet-assignment-dialog',
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatRadioModule,
        MatCardModule,
        MatTooltipModule
    ],
    templateUrl: './diet-assignment-dialog.component.html',
    styleUrl: './diet-assignment-dialog.component.scss'
})
export class DietAssignmentDialogComponent implements OnInit {
  assignmentType: 'weekly' | 'individual' = 'weekly';
  searchQuery: string = '';
  selectedPlan: DietPlan | null = null;
  selectedDiets: Diet[] = [];
  startDate: Date = new Date();
  endDate: Date = new Date();
  dietPlans: DietPlan[] = [];
  individualDiets: Diet[] = [];
  patientAllergies: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<DietAssignmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DietAssignmentDialogData
  ) {}

  ngOnInit() {
    // Initialize with provided data or use defaults
    if (this.data.availableDietPlans) {
      this.dietPlans = this.data.availableDietPlans;
    } else {
      this.dietPlans = this.getDefaultDietPlans();
    }

    if (this.data.individualDiets) {
      this.individualDiets = this.data.individualDiets;
    } else {
      this.individualDiets = this.getDefaultIndividualDiets();
    }

    if (this.data.patientAllergies) {
      this.patientAllergies = this.data.patientAllergies;
    }

    // Check compatibility for each plan
    this.checkCompatibility();

    // Set default date to today
    this.startDate = new Date();
    // Default end date = +7 days from start
    this.endDate = new Date(this.startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  getDefaultDietPlans(): DietPlan[] {
    return [
      {
        planId: 'plan1',
        name: 'Weekly Mediterranean Plan',
        description: 'A balanced 7-day Mediterranean diet plan for healthy eating',
        type: 'weekly',
        status: 'active',
        duration: 7,
        dietsCount: 21,
        progress: 75,
        createdAt: new Date('2024-01-15'),
        isCompatible: true
      },
      {
        planId: 'plan2',
        name: 'Keto Weight Loss Plan',
        description: '4-week ketogenic diet plan for weight loss',
        type: 'monthly',
        status: 'active',
        duration: 28,
        dietsCount: 84,
        progress: 45,
        createdAt: new Date('2024-01-10'),
        isCompatible: true
      },
      {
        planId: 'plan3',
        name: 'Vegan Wellness Plan',
        description: 'Plant-based diet plan for overall wellness',
        type: 'custom',
        status: 'active',
        duration: 14,
        dietsCount: 42,
        progress: 0,
        createdAt: new Date('2024-01-20'),
        isCompatible: true
      }
    ];
  }

  getDefaultIndividualDiets(): Diet[] {
    return [
      {
        dietId: '1',
        name: 'Balanced Veg Bowl',
        description: 'Quinoa, chickpeas, mixed veggies, olive oil dressing.',
        dietType: 'Mediterranean',
        calories: 520,
        protein: 22,
        carbs: 68,
        fat: 18,
        fiber: 11,
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        tags: ['lunch', 'quick']
      },
      {
        dietId: '2',
        name: 'Keto Chicken Salad',
        description: 'Grilled chicken, avocado, mixed greens, olive oil.',
        dietType: 'Keto',
        calories: 450,
        protein: 35,
        carbs: 8,
        fat: 32,
        fiber: 6,
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        tags: ['lunch', 'high-protein']
      },
      {
        dietId: '3',
        name: 'Vegan Buddha Bowl',
        description: 'Brown rice, tofu, vegetables, tahini dressing.',
        dietType: 'Vegan',
        calories: 380,
        protein: 18,
        carbs: 45,
        fat: 15,
        fiber: 12,
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        tags: ['dinner', 'plant-based']
      },
      {
        dietId: '4',
        name: 'Morning Oatmeal',
        description: 'Steel-cut oats with berries, nuts, and honey.',
        dietType: 'Mediterranean',
        calories: 320,
        protein: 12,
        carbs: 55,
        fat: 8,
        fiber: 8,
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        tags: ['breakfast', 'fiber-rich']
      },
      {
        dietId: '5',
        name: 'Greek Yogurt Parfait',
        description: 'Greek yogurt with granola, honey, and fresh fruits.',
        dietType: 'Mediterranean',
        calories: 280,
        protein: 20,
        carbs: 35,
        fat: 6,
        fiber: 4,
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        tags: ['breakfast', 'protein-rich']
      }
    ];
  }

  checkCompatibility(): void {
    // Check if each diet plan is compatible with patient allergies
    // For now, we'll mark all as compatible (in production, this would check against allergies)
    for (const plan of this.dietPlans) {
      plan.isCompatible = true; // Simplified - in production, check against patientAllergies
    }
  }

  getFilteredPlans(): DietPlan[] {
    if (!this.searchQuery) {
      return this.dietPlans.filter(plan => plan.status === 'active');
    }
    const query = this.searchQuery.toLowerCase();
    return this.dietPlans.filter(plan =>
      plan.status === 'active' && (
        plan.name.toLowerCase().includes(query) ||
        plan.description.toLowerCase().includes(query)
      )
    );
  }

  getFilteredIndividualDiets(): Diet[] {
    if (!this.searchQuery) {
      return this.individualDiets.filter(diet => diet.isActive);
    }
    const query = this.searchQuery.toLowerCase();
    return this.individualDiets.filter(diet =>
        diet.isActive && (
          diet.name.toLowerCase().includes(query) ||
          diet.description.toLowerCase().includes(query) ||
          diet.dietType.toLowerCase().includes(query) ||
          diet.tags?.some(tag => tag.toLowerCase().includes(query))
        )
    );
  }

  selectPlan(plan: DietPlan): void {
    this.selectedPlan = plan;
  }

  removePlan(): void {
    this.selectedPlan = null;
  }

  viewPlan(plan: DietPlan, event: Event): void {
    event.stopPropagation();
    // In production, this would open a detailed view dialog
    console.log('View plan details:', plan);
    // For now, just select it
    this.selectPlan(plan);
  }

  addPlan(plan: DietPlan, event: Event): void {
    event.stopPropagation();
    this.selectPlan(plan);
  }

  onCancel(): void {
    this.dialogRef.close();
  }


  isPlanSelected(plan: DietPlan): boolean {
    return this.selectedPlan?.planId === plan.planId;
  }

  isDietSelected(diet: Diet): boolean {
    return this.selectedDiets.some(d => d.dietId === diet.dietId);
  }

  toggleDietSelection(diet: Diet): void {
    const index = this.selectedDiets.findIndex(d => d.dietId === diet.dietId);
    if (index > -1) {
      this.selectedDiets.splice(index, 1);
    } else {
      this.selectedDiets.push(diet);
    }
  }

  removeDiet(index: number): void {
    this.selectedDiets.splice(index, 1);
  }

  getSelectedItemsCount(): number {
    if (this.assignmentType === 'weekly') {
      return this.selectedPlan ? 1 : 0;
    } else {
      return this.selectedDiets.length;
    }
  }

  onConfirm(): void {
    if (this.assignmentType === 'weekly' && this.selectedPlan && this.startDate && this.endDate) {
      const assignedPlan: AssignedDietPlan = {
        planId: this.selectedPlan.planId,
        name: this.selectedPlan.name,
        duration: this.selectedPlan.duration,
        description: this.selectedPlan.description,
        startDate: this.startDate,
        endDate: this.endDate,
        assignmentType: 'weekly'
      };

      this.dialogRef.close({
        assignedPlan: assignedPlan,
        assignmentType: this.assignmentType,
        startDate: this.startDate,
        endDate: this.endDate
      });
    } else if (this.assignmentType === 'individual' && this.selectedDiets.length > 0 && this.startDate && this.endDate) {
      const assignedPlan: AssignedDietPlan = {
        dietIds: this.selectedDiets.map(d => d.dietId),
        name: `${this.selectedDiets.length} Selected Diet${this.selectedDiets.length > 1 ? 's' : ''}`,
        duration: Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24)),
        description: this.selectedDiets.map(d => d.name).join(', '),
        startDate: this.startDate,
        endDate: this.endDate,
        assignmentType: 'individual'
      };

      this.dialogRef.close({
        assignedPlan: assignedPlan,
        selectedDiets: this.selectedDiets,
        assignmentType: this.assignmentType,
        startDate: this.startDate,
        endDate: this.endDate
      });
    }
  }
}

