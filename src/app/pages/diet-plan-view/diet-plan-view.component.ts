import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-diet-plan-view',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressBarModule,
    BreadcrumbComponent
  ],
  templateUrl: './diet-plan-view.component.html',
  styleUrl: './diet-plan-view.component.scss'
})
export class DietPlanViewComponent implements OnInit {
  planId: string = '';
  dietPlan: any = null;
  selectedDayIndex = 0;

  customBreadcrumbs = [
    { label: 'Diet Plans', path: '/diet/plans', icon: 'calendar_today' },
    { label: 'View Diet Plan', icon: 'visibility', isActive: true }
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

  mealTimes: any[] = [
    { label: 'Breakfast', time: '6:00 AM' },
    { label: 'Morning Snack', time: '9:00 AM' },
    { label: 'Lunch', time: '12:30 PM' },
    { label: 'Evening Snack', time: '4:00 PM' },
    { label: 'Dinner', time: '8:00 PM' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.planId = this.route.snapshot.params['id'];
    this.loadDietPlan();
  }

  get isActive(): boolean {
    return (this.dietPlan?.status || '').toLowerCase() === 'active';
  }

  loadDietPlan() {
    // Mock data - in real app, this would come from a service
    this.dietPlan = {
      planId: this.planId,
      name: 'Weekly Mediterranean Plan',
      description: 'A balanced 7-day Mediterranean diet plan for healthy eating with focus on whole grains, lean proteins, and healthy fats.',
      type: 'weekly',
      status: 'active',
      duration: 7,
      dietsCount: 21,
      progress: 75,
      createdAt: new Date('2024-01-15'),
      schedule: {
        day_0: [
          [
            {
              dietId: '1',
              name: 'Morning Oatmeal',
              calories: 320,
              imageUrl: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&h=300&fit=crop'
            }
          ],
          [],
          [
            {
              dietId: '2',
              name: 'Balanced Veg Bowl',
              calories: 520,
              imageUrl: 'https://arohanyoga.com/wp-content/uploads/2024/03/The-Yogic-Diet-Food-for-Mind-and-Body-.jpg'
            }
          ],
          [],
          [
            {
              dietId: '6',
              name: 'Grilled Salmon',
              calories: 480,
              imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop'
            }
          ]
        ],
        day_1: [
          [
            {
              dietId: '4',
              name: 'Morning Oatmeal',
              calories: 320,
              imageUrl: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&h=300&fit=crop'
            }
          ],
          [],
          [
            {
              dietId: '3',
              name: 'Vegan Buddha Bowl',
              calories: 380,
              imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop'
            }
          ],
          [],
          [
            {
              dietId: '5',
              name: 'Greek Yogurt Parfait',
              calories: 280,
              imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop'
            }
          ]
        ]
      }
    };

    // Update breadcrumbs with plan name
    this.customBreadcrumbs = [
      { label: 'Diet Plans', path: '/diet/plans', icon: 'calendar_today' },
      { label: 'View Diet Plan', path: '/diet-plan-view/' + this.planId, icon: 'visibility' },
      { label: this.dietPlan.name, icon: 'restaurant_menu', isActive: true }
    ];
  }

  getSelectedDiets(dayIndex: number, mealIndex: number): any[] {
    const dayKey = `day_${dayIndex}`;
    return this.dietPlan?.schedule?.[dayKey]?.[mealIndex] ?? [];
  }

  getMealCalories(dayIndex: number, mealIndex: number): number {
    const diets = this.getSelectedDiets(dayIndex, mealIndex);
    return diets.reduce((sum, diet) => sum + (diet.calories || 0), 0);
  }

  getTotalCaloriesForDay(dayIndex: number): number {
    let totalCalories = 0;
    for (let mealIndex = 0; mealIndex < this.mealTimes.length; mealIndex++) {
      const diets = this.getSelectedDiets(dayIndex, mealIndex);
      totalCalories += diets.reduce((sum, diet) => sum + diet.calories, 0);
    }
    return totalCalories;
  }

  getTotalCaloriesForPlan(): number {
    let totalCalories = 0;
    for (let dayIndex = 0; dayIndex < this.weekDays.length; dayIndex++) {
      totalCalories += this.getTotalCaloriesForDay(dayIndex);
    }
    return totalCalories;
  }

  selectDay(dayIndex: number): void {
    this.selectedDayIndex = dayIndex;
  }

  onEdit() {
    // Reuse the create page UI for editing
    this.router.navigate(['/diet-plan-edit', this.planId], { state: { plan: this.dietPlan } });
  }

  onDelete() {
    console.log('Delete plan:', this.dietPlan);
    // Show confirmation dialog and delete plan
  }
}
