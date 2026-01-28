import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, ActivatedRoute } from '@angular/router';
import {
  AppButtonComponent,
  AppInputComponent,
  DialogboxService,
  DialogFooterAction,
  GridComponent,
  IconComponent
} from "@lk/core";
import { DietCreateComponent } from '../diet-create/diet-create.component';
import { Diet } from '../../interfaces/diet.interface';
import { ColDef } from 'ag-grid-community';

import { DietSelectionDialogComponent } from '../diet-selection-dialog/diet-selection-dialog.component';
import { MealTimeDialogComponent } from '../meal-time-dialog/meal-time-dialog.component';
import { DietCardComponent } from '../../components/diet-card/diet-card.component';
import { DietPlanCardComponent } from '../../components/diet-plan-card/diet-plan-card.component';

@Component({
    selector: 'app-diet',
    imports: [
        CommonModule,
        FormsModule,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatTooltipModule,
        MatProgressBarModule,
        MatDialogModule,
        GridComponent,
        AppButtonComponent,
        AppInputComponent,
        IconComponent,
        DietSelectionDialogComponent,
        MealTimeDialogComponent,
        DietCardComponent,
        DietPlanCardComponent
    ],
    templateUrl: './diet.component.html',
    styleUrl: './diet.component.scss'
})
export class DietComponent implements OnInit {
  selectedTabIndex = 0;
  searchQuery: string = '';
  selectedDietType: string = '';
  selectedMealType: string = '';

  mealTypes: { label: string; value: string }[] = [
    { label: 'All', value: '' },
    { label: 'Breakfast', value: 'breakfast' },
    { label: 'Lunch', value: 'lunch' },
    { label: 'Dinner', value: 'dinner' },
    { label: 'Snack', value: 'snack' }
  ];
  

  
  // Diets Tab
  dietList: Diet[] = [];
  filteredDiets: Diet[] = [];
  columnDefs: ColDef[] = [];
  gridOptions: any = {};

  // Table columns for list view
  displayedColumns: string[] = ['image', 'name', 'type', 'calories', 'protein', 'actions'];

  // Diet Plans Tab
  dietPlans: any[] = [];
  filteredDietPlans: any[] = [];
  selectedPlanType: string = '';
  selectedPlanStatus: string = '';
  planSearchQuery: string = '';
  // Weekly preview state
  selectedPlanPreview: any | null = null;
  selectedPlanDayIndex: number = new Date().getDay();

  // Computed properties for stats
  get avgCalories(): number {
    if (!this.dietList.length) return 0;
    const sum = this.dietList.reduce((acc, diet) => acc + (diet.calories || 0), 0);
    return Math.round(sum / this.dietList.length);
  }

  get avgProtein(): number {
    if (!this.dietList.length) return 0;
    const sum = this.dietList.reduce((acc, diet) => acc + (diet.protein || 0), 0);
    return Math.round(sum / this.dietList.length);
  }

  // Mock (screenshot-style) stat
  get patientsOnDiets(): number {
    return 36;
  }

  constructor(
    private dialog: MatDialog, 
    private router: Router, 
    private route: ActivatedRoute,
    private dialogService: DialogboxService
  ) {}

  ngOnInit() {
    this.initializeDietData();
    this.loadMockData();
    this.loadMockDietPlans();
    // default preview: first weekly plan if available
    const firstWeekly = this.dietPlans.find(p => p.type === 'weekly') || null;
    this.selectedPlanPreview = firstWeekly;
    
    // Handle tab navigation from route
    const currentUrl = this.router.url;
    if (currentUrl.includes('/diet/plans')) {
      this.selectedTabIndex = 1; // Diet Plans tab index (second tab)
    }
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    
    // Update URL based on selected tab
    if (index === 1) { // Diet Plans tab (second tab)
      this.router.navigate(['/diet/plans']);
    } else {
      // Navigate to main diet page for other tabs
      this.router.navigate(['/diet']);
    }
  }

  onSearchChange(event: any) {
    this.filterDiets();
  }

  onDietTypeChange(event: any) {
    this.filterDiets();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedDietType = '';
    this.selectedMealType = '';
    this.filterDiets();
  }

  filterDiets() {
    this.filteredDiets = this.dietList.filter(diet => {
      const matchesSearch = !this.searchQuery || 
        diet.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        diet.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        diet.tags?.some(tag => tag.toLowerCase().includes(this.searchQuery.toLowerCase()));
      
      const matchesType = !this.selectedDietType || 
        diet.dietType.toLowerCase() === this.selectedDietType.toLowerCase();

      const matchesMeal =
        !this.selectedMealType ||
        (diet.tags || []).some(tag => tag.toLowerCase() === this.selectedMealType.toLowerCase());
      
      return matchesSearch && matchesType && matchesMeal;
    });
  }

  loadMockData() {
    // Mock data for demonstration
    this.dietList = [
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
        imageUrl: 'https://arohanyoga.com/wp-content/uploads/2024/03/The-Yogic-Diet-Food-for-Mind-and-Body-.jpg',
        videoUrl: 'https://youtu.be/oX_iH0CbZzg?si=jkzW8WP0xBasAYdB',
        documentUrl: 'https://morth.nic.in/sites/default/files/dd12-13_0.pdf',
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
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        videoUrl: 'https://youtu.be/oX_iH0CbZzg?si=jkzW8WP0xBasAYdB',
        documentUrl: 'https://morth.nic.in/sites/default/files/dd12-13_0.pdf',
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
        imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop',
        videoUrl: 'https://youtu.be/oX_iH0CbZzg?si=jkzW8WP0xBasAYdB',
        documentUrl: 'https://morth.nic.in/sites/default/files/dd12-13_0.pdf',
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
        imageUrl: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&h=300&fit=crop',
        videoUrl: '',
        documentUrl: '',
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
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
        videoUrl: '',
        documentUrl: '',
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
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
        videoUrl: '',
        documentUrl: '',
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
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop',
        videoUrl: '',
        documentUrl: '',
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
        createdByDoctorId: 'doc1',
        createdAt: new Date(),
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
        videoUrl: '',
        documentUrl: '',
        tags: ['lunch', 'soup']
      }
    ];
    this.filteredDiets = [...this.dietList];
  }



  // Diets Tab Methods
  initializeDietData() {
    this.initializeDietColumnDefs();
    this.initializeDietGridOptions();
  }

  initializeDietGridOptions() {
    this.gridOptions.menuActions = [
      {
        "title": "View",
        "icon": "remove_red_eye",
        "click": (param: any) => { this.onViewDiet(param?.data) }
      },
      {
        "title": "Edit",
        "icon": "edit",
        "click": (param: any) => { this.onEditDiet(param?.data) }
      },
      {
        "title": "Delete",
        "icon": "delete",
        "click": (param: any) => { this.onDeleteDiet(param?.data) }
      },
    ];
  }

  onCreateDiet() {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      { id: 'save', text: 'Create Diet', color: 'primary', appearance: 'raised', fontIcon: 'save', disabled: false }
    ];

    const dialogRef = this.dialogService.openDialog(DietCreateComponent, {
      title: 'Create Diet',
      data: { mode: 'create' },
      width: '90%',
      height: '90%',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result !== false) {
        // Refresh diet list
        this.loadMockData();
        this.filterDiets();
      }
    });
  }

  onEditDiet(diet: Diet) {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      { id: 'save', text: 'Save Changes', color: 'primary', appearance: 'raised', fontIcon: 'save', disabled: false }
    ];

    const dialogRef = this.dialogService.openDialog(DietCreateComponent, {
      title: 'Edit Diet',
      data: { diet, mode: 'edit' },
      width: '90%',
      height: '90%',
      footerActions: footerActions
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result !== false) {
        // Refresh diet list
        this.loadMockData();
        this.filterDiets();
      }
    });
  }

  onViewDiet(diet: Diet) {
    // Navigate to the diet view page
    console.log('Navigating to diet view:', diet.dietId);
    this.router.navigate(['/diet/view', diet.dietId]);
  }

  onVideoClick(videoUrl: string) {
    // Open video in new tab
    window.open(videoUrl, '_blank');
  }

  onPdfClick(pdfUrl: string) {
    // Open PDF in new tab
    window.open(pdfUrl, '_blank');
  }

  onDeleteDiet(diet: Diet) {
    console.log('Delete diet:', diet);
    // Implement delete diet functionality with confirmation dialog
  }

  onDietRowClick(event: any) {
    console.log('Diet row clicked:', event);
  }

  initializeDietColumnDefs() {
    this.columnDefs = [
      { field: 'name', headerName: 'Name', sortable: true, filter: true },
      { field: 'description', headerName: 'Description', sortable: true, filter: true },
      { field: 'dietType', headerName: 'Type', sortable: true, filter: true },
      { field: 'calories', headerName: 'Calories', sortable: true, filter: true },
      { field: 'protein', headerName: 'Protein (g)', sortable: true, filter: true },
      { field: 'carbs', headerName: 'Carbs (g)', sortable: true, filter: true },
      { field: 'fat', headerName: 'Fat (g)', sortable: true, filter: true },
      { field: 'fiber', headerName: 'Fiber (g)', sortable: true, filter: true }
    ];
  }

  // Diet Plans Methods
  loadMockDietPlans() {
    this.dietPlans = [
      {
        planId: 'plan1',
        name: 'Weekly Mediterranean Diet',
        description: 'A balanced 7-day diet plan focused on heart health and weight management.',
        type: 'weekly',
        status: 'active',
        duration: 7,
        dietsCount: 21,
        progress: 72,
        goal: 'Weight Loss',
        mealsIncluded: [
          {
            title: 'Breakfast',
            subtitle: 'Oats with fruits & nuts',
            tags: ['High fiber', 'Heart healthy'],
            imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=120&h=120&fit=crop'
          },
          {
            title: 'Lunch',
            subtitle: 'Grilled vegetables with olive oil',
            tags: ['Low fat', 'Mediterranean'],
            imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=120&h=120&fit=crop'
          },
          {
            title: 'Dinner',
            subtitle: 'Baked salmon with quinoa',
            tags: ['High protein', 'Omega-3'],
            imageUrl: 'https://images.unsplash.com/photo-1546069901-eacef0df6022?w=120&h=120&fit=crop'
          },
          {
            title: 'Snack',
            subtitle: 'Greek yogurt with berries',
            tags: ['High protein', 'Low sugar'],
            imageUrl: 'https://images.unsplash.com/photo-1514996937319-344454492b37?w=120&h=120&fit=crop'
          }
        ],
        reviewedByName: 'Dr. Umesh',
        reviewedAt: new Date('2024-10-24T10:30:00'),
        createdAt: new Date('2024-01-15')
      },
      {
        planId: 'plan2',
        name: 'Keto Weight Loss Diet',
        description: 'A low-carb, high-fat diet plan designed to support fast and healthy weight loss.',
        type: 'monthly',
        status: 'active',
        duration: 14,
        dietsCount: 42,
        progress: 64,
        goal: 'Weight Loss',
        mealsIncluded: [
          {
            title: 'Breakfast',
            subtitle: 'Boiled eggs with avocado',
            tags: ['Low carb', 'High fat'],
            imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=120&h=120&fit=crop'
          },
          {
            title: 'Lunch',
            subtitle: 'Quinoa salad with vegetables',
            tags: ['Protein rich', 'Keto friendly'],
            imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=120&h=120&fit=crop'
          },
          {
            title: 'Dinner',
            subtitle: 'Grilled chicken with greens',
            tags: ['Low carb', 'High protein'],
            imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=120&h=120&fit=crop'
          },
          {
            title: 'Snack',
            subtitle: 'Nuts & cheese plate',
            tags: ['High fat', 'Keto'],
            imageUrl: 'https://images.unsplash.com/photo-1604909053199-0edc0f6c09e0?w=120&h=120&fit=crop'
          }
        ],
        reviewedByName: 'Dr. Umesh',
        reviewedAt: new Date('2024-10-24T10:30:00'),
        createdAt: new Date('2024-01-10')
      },
      {
        planId: 'plan3',
        name: 'Vegan Wellness Diet',
        description: 'A plant-based diet plan focused on overall wellness and balanced nutrition.',
        type: 'custom',
        status: 'active',
        duration: 7,
        dietsCount: 21,
        progress: 78,
        goal: 'Wellness',
        mealsIncluded: [
          {
            title: 'Breakfast',
            subtitle: 'Smoothie with banana & chia seeds',
            tags: ['Plant protein', 'High fiber'],
            imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a90a0868?w=120&h=120&fit=crop'
          },
          {
            title: 'Dinner',
            subtitle: 'Vegetable stir-fry with tofu & brown rice',
            tags: ['Plant protein', 'Low fat', 'High fiber'],
            imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc500f?w=120&h=120&fit=crop'
          },
          {
            title: 'Lunch',
            subtitle: 'Chickpea salad bowl',
            tags: ['Plant protein', 'Iron rich'],
            imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=120&h=120&fit=crop'
          },
          {
            title: 'Snack',
            subtitle: 'Hummus with veggies',
            tags: ['High fiber', 'Low fat'],
            imageUrl: 'https://images.unsplash.com/photo-1546069901-eacef0df6022?w=120&h=120&fit=crop'
          }
        ],
        reviewedByName: 'Dr. Umesh',
        reviewedAt: new Date('2024-10-24T10:30:00'),
        createdAt: new Date('2024-01-20')
      },
      {
        planId: 'plan4',
        name: 'Cardiac Care Diet',
        description: 'A heart-friendly diet plan designed to manage cholesterol and blood pressure.',
        type: 'weekly',
        status: 'active',
        duration: 7,
        dietsCount: 21,
        progress: 72,
        goal: 'Heart Health',
        mealsIncluded: [
          {
            title: 'Lunch',
            subtitle: 'Steamed vegetables with olive oil',
            tags: ['Heart healthy', 'Low fat'],
            imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=120&h=120&fit=crop'
          },
          {
            title: 'Dinner',
            subtitle: 'Lentil soup with whole-grain roti',
            tags: ['Low sodium', 'High fiber', 'Heart healthy'],
            imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=120&h=120&fit=crop'
          },
          {
            title: 'Breakfast',
            subtitle: 'Oatmeal with banana',
            tags: ['High fiber', 'Low sodium'],
            imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=120&h=120&fit=crop'
          },
          {
            title: 'Snack',
            subtitle: 'Fresh fruit bowl',
            tags: ['Low fat', 'Heart healthy'],
            imageUrl: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=120&h=120&fit=crop'
          }
        ],
        reviewedByName: 'Dr. Umesh',
        reviewedAt: new Date('2024-10-24T10:30:00'),
        createdAt: new Date('2024-01-22')
      }
    ];
    this.filteredDietPlans = [...this.dietPlans];
  }

  getActivePlansCount(): number {
    return this.dietPlans.filter(plan => plan.status === 'active').length;
  }

  getWeeklyPlansCount(): number {
    return this.dietPlans.filter(plan => plan.type === 'weekly').length;
  }

  getAvgAdherence(): number {
    if (!this.dietPlans || this.dietPlans.length === 0) return 0;
    const total = this.dietPlans.reduce((sum, plan) => sum + (plan?.progress ?? 0), 0);
    return Math.round(total / this.dietPlans.length);
  }

  onPlanTypeChange(event: any) {
    this.filterDietPlans();
  }

  onPlanStatusChange(event: any) {
    this.filterDietPlans();
  }

  onPlanSearchChange(event: any) {
    this.filterDietPlans();
  }

  clearPlanFilters() {
    this.selectedPlanType = '';
    this.selectedPlanStatus = '';
    this.planSearchQuery = '';
    this.filterDietPlans();
  }

  filterDietPlans() {
    this.filteredDietPlans = this.dietPlans.filter(plan => {
      const matchesType = !this.selectedPlanType || plan.type === this.selectedPlanType;
      const matchesStatus = !this.selectedPlanStatus || plan.status === this.selectedPlanStatus;
      const matchesSearch = !this.planSearchQuery || 
        plan.name.toLowerCase().includes(this.planSearchQuery.toLowerCase()) ||
        plan.description.toLowerCase().includes(this.planSearchQuery.toLowerCase());
      
      return matchesType && matchesStatus && matchesSearch;
    });
    // keep preview valid
    if (this.selectedPlanPreview) {
      const stillExists = this.filteredDietPlans.find(p => p.planId === this.selectedPlanPreview.planId);
      if (!stillExists) {
        this.selectedPlanPreview = this.filteredDietPlans.find(p => p.type === 'weekly') || this.filteredDietPlans[0] || null;
      }
    }
  }

  onCreateDietPlan() {
    this.router.navigate(['/diet-plan-create']);
  }

  onViewPlan(plan: any) {
    this.router.navigate(['/diet-plan-view', plan.planId]);
  }

  onEditPlan(plan: any) {
    // Reuse create page UI for editing
    this.router.navigate(['/diet-plan-edit', plan.planId], { state: { plan } });
  }

  onDeletePlan(plan: any) {
    console.log('Delete plan:', plan);
    // Implement plan deletion with confirmation
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'check_circle';
      case 'inactive':
        return 'cancel';
      case 'draft':
        return 'edit';
      default:
        return 'help';
    }
  }

  // Weekly preview helpers (mock schedule same as patient profile)
  private getMockScheduleForPlan(planId: string): any {
    const mockSchedules: any = {
      'plan1': {
        day_0: [[{ dietId: '4', name: 'Morning Oatmeal', calories: 320 }], [], [{ dietId: '1', name: 'Balanced Veg Bowl', calories: 520 }], [], [{ dietId: '6', name: 'Grilled Salmon', calories: 480 }]],
        day_1: [[{ dietId: '5', name: 'Greek Yogurt Parfait', calories: 280 }], [{ dietId: '7', name: 'Apple with Almonds', calories: 150 }], [{ dietId: '1', name: 'Balanced Veg Bowl', calories: 520 }], [], [{ dietId: '8', name: 'Chicken Salad', calories: 450 }]],
        day_2: [[{ dietId: '4', name: 'Morning Oatmeal', calories: 320 }], [], [{ dietId: '2', name: 'Keto Chicken Salad', calories: 450 }], [{ dietId: '9', name: 'Trail Mix', calories: 200 }], [{ dietId: '3', name: 'Vegan Buddha Bowl', calories: 380 }]],
        day_3: [[{ dietId: '5', name: 'Greek Yogurt Parfait', calories: 280 }], [], [{ dietId: '1', name: 'Balanced Veg Bowl', calories: 520 }], [], [{ dietId: '6', name: 'Grilled Salmon', calories: 480 }]],
        day_4: [[{ dietId: '4', name: 'Morning Oatmeal', calories: 320 }], [{ dietId: '7', name: 'Apple with Almonds', calories: 150 }], [{ dietId: '2', name: 'Keto Chicken Salad', calories: 450 }], [], [{ dietId: '8', name: 'Chicken Salad', calories: 450 }]],
        day_5: [[{ dietId: '5', name: 'Greek Yogurt Parfait', calories: 280 }], [], [{ dietId: '1', name: 'Balanced Veg Bowl', calories: 520 }], [{ dietId: '9', name: 'Trail Mix', calories: 200 }], [{ dietId: '3', name: 'Vegan Buddha Bowl', calories: 380 }]],
        day_6: [[{ dietId: '4', name: 'Morning Oatmeal', calories: 320 }], [], [{ dietId: '2', name: 'Keto Chicken Salad', calories: 450 }], [], [{ dietId: '6', name: 'Grilled Salmon', calories: 480 }]]
      }
    };
    return mockSchedules[planId] || {};
  }

  getWeekDays(): string[] {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }

  getShortDayName(dayName: string): string {
    const m: any = { Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };
    return m[dayName] || dayName;
  }

  getDietsForPreviewSelectedDay(): any[] {
    if (!this.selectedPlanPreview) return [];
    const schedule = this.getMockScheduleForPlan(this.selectedPlanPreview.planId);
    const dayKey = `day_${this.selectedPlanDayIndex}`;
    const meals: any[][] = schedule[dayKey] || [];
    const flat: any[] = [];
    meals.forEach(slot => { if (slot && slot.length) { flat.push(...slot); } });
    return flat;
  }

  selectPreviewDay(i: number): void {
    this.selectedPlanDayIndex = i;
  }

  formatDateShort(date: Date): string {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
  }

  getSelectedPlanStartDateShort(): string {
    const start = this.selectedPlanPreview?.startDate ? new Date(this.selectedPlanPreview.startDate) : new Date();
    return this.formatDateShort(start);
    }

  getSelectedPlanEndDateShort(): string {
    const end = this.selectedPlanPreview?.endDate ? new Date(this.selectedPlanPreview.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return this.formatDateShort(end);
  }

  getDietObjectFromPreviewSchedule(item: any): Diet {
    return {
      dietId: item?.dietId || 'temp',
      name: item?.name || 'Diet',
      description: item?.description || '',
      dietType: 'Mediterranean',
      calories: item?.calories || 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      createdByDoctorId: 'doc',
      createdAt: new Date(),
      isActive: true
    };
  }
}
