import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { DietSelectionDialogComponent } from '../diet-selection-dialog/diet-selection-dialog.component';
import { MealTimeDialogComponent } from '../meal-time-dialog/meal-time-dialog.component';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';

@Component({
    selector: 'app-diet-plan-create',
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatTabsModule,
        MatTooltipModule,
        MatProgressBarModule,
        BreadcrumbComponent
    ],
    templateUrl: './diet-plan-create.component.html',
    styleUrl: './diet-plan-create.component.scss'
})
export class DietPlanCreateComponent implements OnInit {
  isEditMode = false;
  editPlanId: string | null = null;

  newPlan: any = {
    name: '',
    description: '',
    schedule: {}
  };

  customBreadcrumbs = [
    { label: 'Diet Plans', path: '/diet/plans', icon: 'calendar_today' },
    { label: 'Create Diet Plan', icon: 'add_circle', isActive: true }
  ];

  mealTimes: any[] = [
    { label: 'Breakfast', time: '6:00 AM' },
    { label: 'Morning Snack', time: '9:00 AM' },
    { label: 'Lunch', time: '12:30 PM' },
    { label: 'Evening Snack', time: '4:00 PM' },
    { label: 'Dinner', time: '8:00 PM' }
  ];

  weekDays: any[] = [
    { name: 'Monday', date: 'Mon' },
    { name: 'Tuesday', date: 'Tue' },
    { name: 'Wednesday', date: 'Wed' },
    { name: 'Thursday', date: 'Thu' },
    { name: 'Friday', date: 'Fri' },
    { name: 'Saturday', date: 'Sat' },
    { name: 'Sunday', date: 'Sun' }
  ];

  dietList: any[] = [
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
      imageUrl: 'https://arohanyoga.com/wp-content/uploads/2024/03/The-Yogic-Diet-Food-for-Mind-and-Body-.jpg',
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
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
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
      imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop',
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
      imageUrl: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&h=300&fit=crop',
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
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
      tags: ['breakfast', 'protein-rich']
    },
    {
      dietId: '6',
      name: 'Grilled Salmon',
      description: 'Grilled salmon with steamed vegetables and quinoa.',
      dietType: 'Mediterranean',
      calories: 480,
      protein: 42,
      carbs: 25,
      fat: 22,
      fiber: 6,
      imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
      tags: ['dinner', 'omega-3']
    },
    {
      dietId: '7',
      name: 'Mixed Nuts Snack',
      description: 'Almonds, walnuts, and cashews with dried fruits.',
      dietType: 'Mediterranean',
      calories: 180,
      protein: 6,
      carbs: 12,
      fat: 14,
      fiber: 3,
      imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop',
      tags: ['snack', 'healthy-fats']
    },
    {
      dietId: '8',
      name: 'Vegetable Soup',
      description: 'Homemade vegetable soup with lentils and herbs.',
      dietType: 'Vegan',
      calories: 220,
      protein: 12,
      carbs: 35,
      fat: 4,
      fiber: 10,
      imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
      tags: ['lunch', 'soup']
    }
  ];

  constructor(
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.editPlanId = this.route.snapshot.params['id'] ?? null;
    this.isEditMode = !!this.editPlanId;

    if (this.isEditMode && this.editPlanId) {
      const statePlan = history.state?.plan;
      const plan = statePlan?.planId ? statePlan : this.getMockPlanForEdit(this.editPlanId);
      if (plan) {
        this.loadPlanIntoEditor(plan);
      }

      this.customBreadcrumbs = [
        { label: 'Diet Plans', path: '/diet/plans', icon: 'calendar_today' },
        { label: 'Edit Diet Plan', icon: 'edit', isActive: true }
      ];
    }
  }

  private loadPlanIntoEditor(plan: any): void {
    this.newPlan.name = plan?.name ?? '';
    this.newPlan.description = plan?.description ?? '';
    this.newPlan.schedule = this.normalizeSchedule(plan?.schedule ?? {});
  }

  private normalizeSchedule(schedule: any): any {
    const normalized: any = {};
    for (let dayIndex = 0; dayIndex < this.weekDays.length; dayIndex++) {
      const dayKey = `day_${dayIndex}`;
      const daySlots = Array.isArray(schedule?.[dayKey]) ? schedule[dayKey] : [];
      normalized[dayKey] = [];
      for (let mealIndex = 0; mealIndex < this.mealTimes.length; mealIndex++) {
        normalized[dayKey][mealIndex] = Array.isArray(daySlots?.[mealIndex]) ? daySlots[mealIndex] : [];
      }
    }
    return normalized;
  }

  private getMockPlanForEdit(planId: string): Record<string, unknown> | null {
    // Minimal mock so edit works in demo mode
    const pickDiet = (dietId: string) => {
      const d: any = this.dietList.find(x => x.dietId === dietId);
      if (!d) return null;
      return { dietId: d.dietId, name: d.name, calories: d.calories, imageUrl: d.imageUrl };
    };

    if (planId === 'plan1') {
      return {
        planId,
        name: 'Weekly Mediterranean Plan',
        description: 'A balanced 7-day Mediterranean diet plan for healthy eating with focus on whole grains, lean proteins, and healthy fats.',
        schedule: {
          day_0: [
            [pickDiet('4')].filter(Boolean),
            [],
            [pickDiet('1')].filter(Boolean),
            [],
            [pickDiet('6')].filter(Boolean)
          ]
        }
      };
    }

    if (planId === 'plan2') {
      return {
        planId,
        name: 'Keto Weight Loss Diet',
        description: 'A low-carb, high-fat diet plan designed to support fast and healthy weight loss.',
        schedule: {
          day_0: [
            [pickDiet('5')].filter(Boolean),
            [pickDiet('7')].filter(Boolean),
            [pickDiet('2')].filter(Boolean),
            [],
            [pickDiet('6')].filter(Boolean)
          ]
        }
      };
    }

    if (planId === 'plan3') {
      return {
        planId,
        name: 'Vegan Wellness Diet',
        description: 'A plant-based diet plan focused on overall wellness and balanced nutrition.',
        schedule: {
          day_0: [
            [pickDiet('4')].filter(Boolean),
            [],
            [pickDiet('8')].filter(Boolean),
            [pickDiet('7')].filter(Boolean),
            [pickDiet('3')].filter(Boolean)
          ]
        }
      };
    }

    if (planId === 'plan4') {
      return {
        planId,
        name: 'Cardiac Care Diet',
        description: 'A heart-friendly diet plan designed to manage cholesterol and blood pressure.',
        schedule: {
          day_0: [
            [pickDiet('4')].filter(Boolean),
            [],
            [pickDiet('1')].filter(Boolean),
            [],
            [pickDiet('6')].filter(Boolean)
          ]
        }
      };
    }

    return null;
  }

  addMealTime() {
    console.log('Opening meal time dialog...');
    try {
      const dialogRef = this.dialog.open(MealTimeDialogComponent, {
        width: '400px',
        maxWidth: '90vw',
        data: { mealTimes: this.mealTimes },
        disableClose: true,
        panelClass: 'meal-time-dialog'
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('Meal time dialog closed with result:', result);
        const mealTime = result?.mealTime;
        if (mealTime) this.mealTimes.push(mealTime);
      });
    } catch (error) {
      console.error('Error opening meal time dialog:', error);
      alert('Error opening meal time dialog. Please try again.');
    }
  }

  removeMealTime(index: number) {
    if (this.mealTimes.length > 1) {
      this.mealTimes.splice(index, 1);
      // Remove diets from this meal time slot
      this.removeDietsFromMealTime(index);
    }
  }

  removeDietsFromMealTime(mealTimeIndex: number) {
    for (let dayIndex = 0; dayIndex < this.weekDays.length; dayIndex++) {
      const dayKey = `day_${dayIndex}`;
      if (this.newPlan.schedule[dayKey]) {
        this.newPlan.schedule[dayKey] = this.newPlan.schedule[dayKey].filter((_: any, mealIndex: number) => mealIndex !== mealTimeIndex);
      }
    }
  }

  getSelectedDiets(dayIndex: number, mealIndex: number): any[] {
    const dayKey = `day_${dayIndex}`;
    return this.newPlan?.schedule?.[dayKey]?.[mealIndex] ?? [];
  }

  openDietSelector(dayIndex: number, mealIndex: number) {
    console.log('Opening diet selector dialog...', { dayIndex, mealIndex });
    try {
      const availableDiets = this.dietList.filter(diet => {
        const selectedDiets = this.getSelectedDiets(dayIndex, mealIndex);
        return !selectedDiets.some(selected => selected.dietId === diet.dietId);
      });

      if (availableDiets.length === 0) {
        alert('No more diets available to add. Create new diets first.');
        return;
      }

      // Open diet selection dialog
      const dialogRef = this.dialog.open(DietSelectionDialogComponent, {
        width: '800px',
        maxWidth: '90vw',
        data: { 
          availableDiets,
          selectedDiets: this.getSelectedDiets(dayIndex, mealIndex),
          dayIndex,
          mealIndex
        },
        disableClose: true,
        panelClass: 'diet-selection-dialog'
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('Diet selection dialog closed with result:', result);
        const selectedDiets = result?.selectedDiets;
        if (!Array.isArray(selectedDiets) || selectedDiets.length === 0) return;
        // Add all selected diets to the slot
        selectedDiets.forEach((diet: any) => {
          this.addDietToSlot(dayIndex, mealIndex, diet);
        });
      });
    } catch (error) {
      console.error('Error opening diet selection dialog:', error);
      alert('Error opening diet selection dialog. Please try again.');
    }
  }

  addDietToSlot(dayIndex: number, mealIndex: number, diet: any) {
    const dayKey = `day_${dayIndex}`;
    
    if (!this.newPlan.schedule[dayKey]) {
      this.newPlan.schedule[dayKey] = [];
    }
    
    if (!this.newPlan.schedule[dayKey][mealIndex]) {
      this.newPlan.schedule[dayKey][mealIndex] = [];
    }
    
    this.newPlan.schedule[dayKey][mealIndex].push(diet);
  }

  removeDietFromSlot(dayIndex: number, mealIndex: number, dietIndex: number) {
    const dayKey = `day_${dayIndex}`;
    this.newPlan?.schedule?.[dayKey]?.[mealIndex]?.splice(dietIndex, 1);
  }

  clearAllSchedules() {
    this.newPlan.schedule = {};
  }

  saveWeeklyPlan() {
    if (!this.newPlan.name.trim()) {
      alert('Please enter a plan name');
      return;
    }

    // Calculate total diets and validate
    let totalDiets = 0;
    let hasSchedules = false;
    
    for (const dayKey in this.newPlan.schedule) {
      const daySchedule = this.newPlan.schedule[dayKey];
      for (const mealSchedule of daySchedule) {
        if (mealSchedule && mealSchedule.length > 0) {
          totalDiets += mealSchedule.length;
          hasSchedules = true;
        }
      }
    }

    if (!hasSchedules) {
      alert('Please add at least one diet to the schedule');
      return;
    }

    if (this.isEditMode && this.editPlanId) {
      const updatedPlan = {
        planId: this.editPlanId,
        name: this.newPlan.name,
        description: this.newPlan.description,
        type: 'weekly',
        status: 'active',
        duration: 7,
        dietsCount: totalDiets,
        schedule: this.newPlan.schedule,
        updatedAt: new Date()
      };

      console.log('Weekly plan updated:', updatedPlan);
      this.router.navigate(['/diet-plan-view', this.editPlanId]);
      return;
    }

    const plan = {
      planId: 'plan_' + Date.now(),
      name: this.newPlan.name,
      description: this.newPlan.description,
      type: 'weekly',
      status: 'draft',
      duration: 7,
      dietsCount: totalDiets,
      progress: 0,
      schedule: this.newPlan.schedule,
      createdAt: new Date()
    };

    console.log('Weekly plan created:', plan);
    this.router.navigate(['/diet']);
  }
}
