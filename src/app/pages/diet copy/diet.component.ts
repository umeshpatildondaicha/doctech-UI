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
  IconComponent,
  SnackbarService
} from "@lk/core";
import { DietCreateComponent } from '../diet-create/diet-create.component';
import { Diet } from '../../interfaces/diet.interface';
import { ColDef } from 'ag-grid-community';

import { DietSelectionDialogComponent } from '../diet-selection-dialog/diet-selection-dialog.component';
import { MealTimeDialogComponent } from '../meal-time-dialog/meal-time-dialog.component';
import { DietCardComponent } from '../../components/diet-card/diet-card.component';
import { DietPlanCardComponent } from '../../components/diet-plan-card/diet-plan-card.component';
import { DietService } from '../../services/diet.service';
import { AuthService } from '../../services/auth.service';
import { EntityToolbarComponent } from '../../components/entity-toolbar/entity-toolbar.component';
import { AdminStatsCardComponent, StatCard } from '../../components/admin-stats-card/admin-stats-card.component';

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
    DietPlanCardComponent,
    EntityToolbarComponent,
    AdminStatsCardComponent
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


  // Diets Tab
  dietList: Diet[] = [];
  filteredDiets: Diet[] = [];
  columnDefs: ColDef[] = [];
  gridOptions: any = {};

  // Table columns for list view
  displayedColumns: string[] = ['image', 'name', 'type', 'calories', 'protein', 'actions'];

  // Diet Plans Tab
  doctorCode = '';
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

  get dietsOverviewCards(): StatCard[] {
    return [
      { label: 'Total Diets', value: this.dietList.length, icon: 'restaurant_menu', type: 'info' },
      { label: 'Avg Calories', value: this.avgCalories, icon: 'local_fire_department', type: 'warning' },
      { label: 'Avg Protein', value: this.avgProtein, icon: 'fitness_center', type: 'success' },
      { label: 'Patients on Diets', value: this.patientsOnDiets, icon: 'groups', type: 'info' }
    ];
  }

  get dietPlansOverviewCards(): StatCard[] {
    return [
      { label: 'Total Plans', value: this.dietPlans.length, icon: 'calendar_today', type: 'info' },
      { label: 'Active Plans', value: this.getActivePlansCount(), icon: 'check_circle', type: 'success' },
      { label: 'Weekly Plans', value: this.getWeeklyPlansCount(), icon: 'date_range', type: 'warning' },
      { label: 'Avg Adherence', value: `${this.getAvgAdherence()}%`, icon: 'bar_chart', type: 'info' }
    ];
  }

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: DialogboxService,
    private dietservice: DietService,
    private eventService: CoreEventService,
    private authService: AuthService,
    private snackbarservice :SnackbarService
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
    this.doctorCode = this.authService.getDoctorRegistrationNumber() || 'DR1';
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
  }

  ngOnDestroy() {
    this.eventService.clearBreadcrumb();
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

  onSearchChange(query: string) {
    this.searchQuery = query;
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

  openDietFilters() {
    console.log('Open diet filters (toolbar)');
    // Open filter dialog or side panel if needed
  }

  getDietGroupTabs(): { label: string; value: string; count: number }[] {
    const counts: Record<string, number> = { '': this.dietList.length };
    this.mealTypes.filter(mt => mt.value).forEach(mt => {
      counts[mt.value] = this.dietList.filter(d =>
        (d.tags || []).some((t: string) => t.toLowerCase() === mt.value.toLowerCase())
      ).length;
    });
    return this.mealTypes.map(mt => ({
      label: mt.label,
      value: mt.value,
      count: counts[mt.value] ?? 0
    }));
  }

  selectMealTypeTab(value: string): void {
    this.selectedMealType = value;
    this.filterDiets();
  }

  getPlanGroupTabs(): { label: string; value: string; count: number }[] {
    const types = [
      { label: 'All', value: '' },
      { label: 'Weekly', value: 'weekly' },
      { label: 'Monthly', value: 'monthly' },
      { label: 'Custom', value: 'custom' }
    ];
    return types.map(t => ({
      ...t,
      count: t.value ? this.dietPlans.filter(p => p.type === t.value).length : this.dietPlans.length
    }));
  }

  selectPlanTypeTab(value: string): void {
    this.selectedPlanType = value;
    this.filterDietPlans();
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
            dietId: diet.dietId ?? diet.id ?? '',
            // FLATTEN nutrition for UI
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
  
    const dialogRef = this.dialogService.openDialog(DietCreateComponent, {
      title: mode === 'edit' ? 'Edit Diet' : 'Create Diet',
      data: { mode, diet },
      width: '90%',
      height: '90%',
      footerActions
    });
    
  
    dialogRef.afterClosed().subscribe(result => {
      // cancel / invalid
      

      if (!result || result === false || result?.action === 'cancel') {
        return;
        

      }
      // Extract payload (component may close with { action: 'save', payload } or raw payload)
      const payload = result?.payload ?? result;
      if (!payload || typeof payload !== 'object' || !payload.name) {
        return;

      }

      //  CREATE
      if (mode === 'create') {
        this.dietservice.createDietPlan(this.doctorCode, payload).subscribe({
          next: () => {
            console.log(' Diet plan created successfully');
            this.loadDietsFromApi();
            this.snackbarservice.success('Diet Plan Created Successfully');
          },
          error: (err) => {
            console.error(' Diet plan create failed', err);
            this.snackbarservice.error('Diet Plan Creation Failed');
          }

        });
        return;
      }

      //  EDIT
      if (mode === 'edit') {
        const dietId = diet?.id ?? diet?.dietId;
        if (!dietId) {
          console.error(' Diet plan id missing for update');
          return;
        }
        this.dietservice.updateDietPlan(this.doctorCode, Number(dietId), payload).subscribe({
          next: () => {
            console.log(' Diet plan updated successfully');
            this.snackbarservice.success('Diet Plan Updated Successfully');
             this.loadDietsFromApi();
          },
          error: (err) => {
            console.error('Diet plan update failed', err);
            this.snackbarservice.error('Diet Plan Update Failed');
          }
        });
      }
    });
  }
  

  onEditDiet(diet: Diet) {
    this.onCreateDiet('edit', diet);
  }

  onViewDiet(diet: Diet | any) {
    const id = diet?.dietId ?? diet?.id;
    if (id == null || id === '') {
      console.warn('Diet view: missing diet id', diet);
      return;
    }
    const idStr = String(id);
    this.router.navigate(['/diet/view', idStr]);
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
    const id = diet?.dietId ?? (diet as any)?.id;
    if (id == null || id === '') {
      this.snackbarservice.error('Cannot delete: diet id is missing.');
      return;
    }
    const confirmed = confirm(`Are you sure you want to delete "${diet.name || 'this diet'}"? This action cannot be undone.`);
    if (!confirmed) return;
    const numId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (Number.isNaN(numId)) {
      this.snackbarservice.error('Invalid diet id.');
      return;
    }
    this.dietservice.deleteDietPlan(this.doctorCode, numId).subscribe({
      next: () => {
        this.snackbarservice.success('Diet deleted successfully.');
        this.loadDietsFromApi();
      },
      error: (err) => {
        console.error('Delete diet failed', err);
        const msg = err?.error?.message ?? err?.error?.error ?? (err?.status === 500 ? 'Server error. Please try again or contact support.' : 'Failed to delete diet.');
        this.snackbarservice.error(msg);
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
          const rawPlans = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
          this.dietPlans = rawPlans.map((plan: any) => ({
            ...plan,
            planId: plan.planId ?? (plan.id != null ? String(plan.id) : '')
          }));
          this.filteredDietPlans = [...this.dietPlans];
        },
        error: (err: any) => {
          console.log('weekly diet plans AIP errer ', err)
        }

      });
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

  onPlanSearchChange(query: string) {
    this.planSearchQuery = query;
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

  openDietPlanFilters() {
    console.log('Open diet plan filters (toolbar)');
    // Open filter dialog or side panel if needed
  }

  onViewPlan(plan: any) {
    const id = plan?.planId ?? plan?.id;
    if (id == null || id === '') {
      console.warn('Diet plan view: missing plan id', plan);
      return;
    }
    this.router.navigate(['/diet-plan-view', String(id)]);
  }

  onEditPlan(plan: any) {
    const id = plan?.planId ?? plan?.id;
    if (id == null || id === '') {
      console.warn('Diet plan edit: missing plan id', plan);
      return;
    }
    this.router.navigate(['/diet-plan-edit', String(id)], { state: { plan } });
  }

  onDeletePlan(plan: any) {
    const id = plan?.planId ?? plan?.id;
    if (id == null || id === '') {
      this.snackbarservice.error('Cannot delete: plan id is missing.');
      return;
    }
    const confirmed = confirm(`Are you sure you want to delete "${plan.name || 'this plan'}"? This action cannot be undone.`);
    if (!confirmed) return;
    const numId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (Number.isNaN(numId)) {
      this.snackbarservice.error('Invalid plan id.');
      return;
    }
    this.dietservice.deleteDietPlan(this.doctorCode, numId).subscribe({
      next: () => {
        this.snackbarservice.success('Diet plan deleted successfully.');
        this.loadDietPlans();
      },
      error: (err) => {
        console.error('Delete diet plan failed', err);
        const msg = err?.error?.message ?? err?.error?.error ?? (err?.status === 500 ? 'Server error. Please try again or contact support.' : 'Failed to delete diet plan.');
        this.snackbarservice.error(msg);
      }
    });
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
