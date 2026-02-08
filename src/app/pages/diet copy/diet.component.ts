import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';

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
  CoreEventService,
  BreadcrumbItem,
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
import { DietService } from '../../services/diet.service';

@Component({
  selector: 'app-diet',
  imports: [
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
export class DietComponent implements OnInit, OnDestroy {
  breadcrumb: BreadcrumbItem[] = [];
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
  @Input() diet!: Diet;
  @Input() showActions = false;
  @Input() clickable = false;

  @Output() cardClick = new EventEmitter<Diet>();
  @Output() viewClick = new EventEmitter<Diet>();
  @Output() editClick = new EventEmitter<Diet>();
  @Output() deleteClick = new EventEmitter<Diet>();
  @Output() videoClick = new EventEmitter<string>();
  @Output() pdfClick = new EventEmitter<string>();
  private editingDietId!: number;


  // Diets Tab
  dietList: Diet[] = [];
  filteredDiets: Diet[] = [];
  columnDefs: ColDef[] = [];
  gridOptions: any = {};

  // Table columns for list view
  displayedColumns: string[] = ['image', 'name', 'type', 'calories', 'protein', 'actions'];

  // Diet Plans Tab
  doctorCode = 'DR1';
  totalDietCount = 0;
  weeklyDietCount =0;
  dietPlans: any[] = [];
  filteredDietPlans: any[] = [];
  selectedPlanType: string = '';
  selectedPlanStatus: string = '';
  planSearchQuery: string = '';
  // Weekly preview state
  selectedPlanPreview: any | null = null;
  selectedPlanDayIndex: number = new Date().getDay();
  mode: 'create' | 'edit' = 'create';
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
    private dialogService: DialogboxService,
    private dietservice: DietService,
    private eventService: CoreEventService
  ) { }

  private updateBreadcrumb() {
    const url = this.router.url;
    if (url.includes('/diet/plans')) {
      this.breadcrumb = [
        { label: 'Diet', route: '/diet' },
        { label: 'Diet Plans', route: '/diet/plans' }
      ];
    } else {
      this.breadcrumb = [{ label: 'Diet', route: '/diet' }];
    }
    this.eventService.setBreadcrumb(this.breadcrumb);
  }

  ngOnInit() {
    this.updateBreadcrumb();
    this.initializeDietData();
    this.loadDietPlans();
    this.loadDietsFromApi();
    // default preview: first weekly plan if available
    const firstWeekly = this.dietPlans.find(p => p.type === 'weekly') || null;
    this.selectedPlanPreview = firstWeekly;

    // Handle tab navigation from route
    const currentUrl = this.router.url;
    if (currentUrl.includes('/diet/plans')) {
      this.selectedTabIndex = 1; // Diet Plans tab index (second tab)
    }
    this.loadWeeklyPlansCount();
    this.loadDietCounts();
    this.GetWeeklyDietCount();
  }

  ngOnDestroy() {
    this.eventService.clearBreadcrumb();
  }
  loadDietCounts() {
    const doctorCode = this.doctorCode;
  
    this.dietservice.getDietPlansCount(doctorCode).subscribe({
      next: (res: any) => {
        this.totalDietCount = res?.count ?? res ?? 0;
      },
      error: () => this.totalDietCount = 0
    });
  }
  GetWeeklyDietCount() {
    const doctorCode = this.doctorCode;
  
    this.dietservice.getWeeklyDietPlansCount(doctorCode).subscribe({
      next: (res: any) => {
        console.log('Weekly Diet plans count api =>', res);
  
        // 🔥 ONLY number assign कर
        if (typeof res === 'number') {
          this.weeklyDietCount = res;
        } else if (typeof res?.count === 'number') {
          this.weeklyDietCount = res.count;
        } else {
          this.weeklyDietCount = 0;
        }
      },
      error: () => this.weeklyDietCount = 0
    });
  }
  
  onTabChange(index: number) {
    this.selectedTabIndex = index;

    // Update URL and breadcrumb based on selected tab
    if (index === 1) {
      this.router.navigate(['/diet/plans']);
      this.breadcrumb = [
        { label: 'Diet', route: '/diet' },
        { label: 'Diet Plans', route: '/diet/plans' }
      ];
    } else {
      this.router.navigate(['/diet']);
      this.breadcrumb = [{ label: 'Diet', route: '/diet' }];
    }
    this.eventService.setBreadcrumb(this.breadcrumb);
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

  loadDietsFromApi() {
    this.dietservice.getDietPlans(this.doctorCode)
      .subscribe({
        next: (res) => {

          const rawList = res.data || res;

          this.dietList = rawList.map((diet: any) => ({
            ...diet,

            //  FLATTEN nutrition for UI
            calories: diet.nutritionalInformation?.caloriesKcal ?? 0,
            protein: diet.nutritionalInformation?.protein ?? 0,
            carbs: diet.nutritionalInformation?.carbohydrates ?? 0,
            fat: diet.nutritionalInformation?.fat ?? 0,
            fiber: diet.nutritionalInformation?.fiber ?? 0
          }));

          this.filteredDiets = [...this.dietList];
        },
        error: (err) => {
          console.error('Diet API error', err);
        }
      });
  }





  // Diets Tab Methods
  initializeDietData() {
    this.initializeDietColumnDefs();
    this.initializeDietGridOptions();
  }

  initializeDietGridOptions() {
    this.gridOptions.menuActions = [
      {
        title: "View",
        icon: "visibility",
        click: (param: any) => { this.onViewDiet(param?.data) }
      },
      {
        title: "Edit",
        icon: "edit",
        click: (param: any) => { this.onEditDiet(param?.data) }
      },
      {
        title: "Delete",
        icon: "delete",
        click: (param: any) => { this.onDeleteDiet(param?.data) }
      }

    ];
  }

  onCreateDiet(mode: 'create' | 'edit' = 'create', diet?: any) {

    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      {
        id: 'save',
        text: mode === 'edit' ? 'Save Changes' : 'Create Diet',
        color: 'primary',
        appearance: 'raised',
        fontIcon: 'save'
      }
    ];


    // 🔥 Edit mode मध्ये ID + full object lock कर
    const editingDietId = mode === 'edit' ? diet?.id : null;
    const editingDiet = mode === 'edit' ? { ...diet } : null;

    const dialogRef = this.dialogService.openDialog(DietCreateComponent, {
      title: mode === 'edit' ? 'Edit Diet' : 'Create Diet',
      data: { mode, diet: editingDiet },
      width: '90%',
      height: '90%',
      footerActions
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog result', result);
      if (!result || result === false || result?.action === 'cancel') {
        return;
      }

      const payload = result?.data || result;

      // ADD THIS BLOCK ONLY FOR CREATE
      if (mode === 'create') {

        // REMOVE ALL IDs
        delete payload.id;

        payload.nutritionalInformation && delete payload.nutritionalInformation.id;

        payload.mediaLinks?.forEach((m: any) => delete m.id);
        payload.ingredients?.forEach((i: any) => delete i.id);

        if (payload.recipe) {
          delete payload.recipe.id;
        }

        // NOW CALL CREATE API
        this.dietservice.createDietPlan(this.doctorCode, payload).subscribe({
          next: () => {
            console.log(' Diet created successfully');
            this.filterDiets();
          },
          error: err => console.error(' Diet create failed', err)
        });
      }

      // EDIT PART unchanged
    });

  }


  private editingDiet!: any;
  onEditDiet(diet: any) {

    const mode: 'create' | 'edit' = 'create';
    this.editingDietId = diet.id;


    this.editingDiet = { ...diet };

    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'secondary', appearance: 'flat' },
      {
        id: 'save',
        text: 'Save Changes',
        color: 'primary',
        appearance: 'raised',
        fontIcon: 'save'
      }
    ];

    const dialogRef = this.dialogService.openDialog(DietCreateComponent, {
      title: 'Create Diet',
      data: { mode, diet },
      width: '90%',
      height: '90%',
      footerActions
    });



    dialogRef.afterClosed().subscribe(result => {
      if (!result || result === false || result?.action === 'cancel') {
        return;
      }

      const updatePayload = {
        ...this.editingDiet,
        ...result
      };

      console.log('FINAL UPDATE PAYLOAD =>', updatePayload);
      console.log('UPDATE ID =>', this.editingDietId);

      this.dietservice
        .updateDietPlan(this.doctorCode, this.editingDietId, updatePayload)
        .subscribe({
          next: () => {
            console.log('Diet updated');
            this.filterDiets();   // UI refresh
          },
          error: err => {
            console.error('Update failed', err);
          }
        });
    });
  }




  onViewDiet(diet: any) {
    const dietId = diet.id || diet.dietId; // correct field

    if (!dietId) {
      console.error('Diet ID missing', diet);
      return;
    }

    console.log('Navigating to diet view:', dietId);
    this.router.navigate(['/diet/view', dietId]);
  }


  onVideoClick(videoUrl: string) {
    // Open video in new tab
    window.open(videoUrl, '_blank');
  }

  onPdfClick(pdfUrl: string) {
    // Open PDF in new tab
    window.open(pdfUrl, '_blank');
  }

  onDeleteDiet(diet: any) {
    console.log('FULL DIET OBJECT =>', JSON.stringify(diet));

    const dietId1 = diet?.id;

    console.log(' DIET ID =>', dietId1);
    console.log('Delete clicked diet:', diet);

    const dietId = diet?.id;

    if (dietId === null || dietId === undefined) {
      console.error('Diet ID missing', diet);
      return;
    }

    this.dietservice
      .deleteDietPlan(this.doctorCode, Number(dietId))
      .subscribe({
        next: () => {
          console.log(' Diet deleted');
          this.filterDiets();
        },
        error: err => {
          console.error(' Delete failed', err);
        }
      });
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
  loadDietPlans() {
    this.dietservice.getWeeklyDietPlans(this.doctorCode)
      .subscribe({
        next: (res: any) => {
          console.log('weekly diet plans res', res);
          this.dietPlans = res.data || res;
          this.filteredDietPlans = [...this.dietPlans];
        },
        error: (err: any) => {
          console.log('weekly diet plans AIP errer ', err)
        }

      });
  }

  weeklyPlansCount = 0;
  getActivePlansCount(): number {
    return this.dietPlans.filter(plan => plan.status === 'active').length;
  }

  // getWeeklyPlansCount(): number {
  //   return this.dietPlans.filter(plan => plan.type === 'weekly').length;
  // }
  loadWeeklyPlansCount() {
    this.dietservice.getWeeklyDietPlansCount(this.doctorCode).subscribe({
      next: (count: number) => {
        this.weeklyPlansCount = count;
        console.log("success");
      },
      error: err => {
        console.error('Weekly plans count failed', err);
        this.weeklyPlansCount = 0;
      }
    });
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
    if (!plan?.planId) {
      console.error('Plan Id Missing');
      return;
    }
    this.router.navigate(['/diet/edit', plan.planId],);
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
      imageUrl: item?.imageUrl || '',
      videoUrl: item?.videoUrl || '',
      documentUrl: item?.documentUrl || '',

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
