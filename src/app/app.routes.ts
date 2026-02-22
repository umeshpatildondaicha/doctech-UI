import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AppointmentComponent } from './pages/appointment/appointment.component';
import { DoctorComponent } from './pages/doctor/doctor.component';
import { PatientComponent } from './pages/patient/patient.component';
import { PatientProfileComponent } from './pages/patient/patient-profile/patient-profile.component';
import { BillingComponent } from './pages/billing/billing.component';
import { HelpComponent } from './pages/help/help.component';
import { PatientListComponent } from './components/patient-list/patient-list.component';
import { PatientFormComponent } from './components/patient-form/patient-form.component';
import { ExerciseComponent } from './pages/exercise copy/exercise.component';
import { DietComponent } from './pages/diet copy/diet.component';
import { ChatComponent } from './pages/chat/chat.component';
import { BlogsComponent } from './pages/blogs/blogs.component';
import { BlogsDashboardComponent } from './pages/blogs-dashboard/blogs-dashboard.component';
import { ProfileComponent } from "@lk/template";
import { SettingsComponent } from "@lk/template";
import { LoginComponent } from './pages/login/login.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { DoctorsComponent } from './pages/admin/doctors/doctors.component';
import { DoctorCreateTestComponent } from './pages/admin/doctors/doctor-create-test/doctor-create-test.component';
import { RolesComponent } from './pages/admin/roles/roles.component';
import { PlansComponent } from './pages/admin/plans/plans.component';
import { ExerciseCreateComponent } from './pages/exercise-create/exercise-create.component';
import { ExerciseSetCreateComponent } from './pages/exercise-set-create/exercise-set-create.component';
import { DietCreateComponent } from './pages/diet-create/diet-create.component';
import { DietViewComponent } from './pages/diet-view/diet-view.component';
import { DietPlanViewComponent } from './pages/diet-plan-view/diet-plan-view.component';
import { DietPlanCreateComponent } from './pages/diet-plan-create/diet-plan-create.component';
import { DoctorCreateComponent } from './pages/docter-create/doctor-create.component';
import { PatientCreateComponent } from './pages/patient-create/patient-create.component';
import { ScheduleComponent } from './pages/schedule/schedule.component';
import { MyScheduleComponent } from './pages/my-schedule/my-schedule.component';
import { PatientBillingDashboardComponent } from './pages/billing/patient-billing-dashboard.component';
import { InvoiceDetailComponent } from './pages/billing/invoice-detail.component';
import { AdminBillingComponent } from './pages/billing/admin-billing.component';
import { AuthGuard, LoginGuard } from "@lk/core";

import { BaseConfigurationComponent } from './pages/admin/base-configuration/base-configuration.component';
import { HospitalComponent } from './pages/admin/hospital/hospital.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
  
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'appointment', component: AppointmentComponent, canActivate: [AuthGuard] },
  { path: 'schedule', component: ScheduleComponent, canActivate: [AuthGuard] },
  { path: 'my-schedule', component: MyScheduleComponent, canActivate: [AuthGuard] },
  { path: 'doctor', component: DoctorComponent, canActivate: [AuthGuard] },
  { path: 'patient', component: PatientComponent, canActivate: [AuthGuard] },
  { path: 'patient/:id', component: PatientProfileComponent, canActivate: [AuthGuard] },
  { path: 'patient-profile', component: PatientProfileComponent, canActivate: [AuthGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
  { path: 'blogs', component: BlogsDashboardComponent, canActivate: [AuthGuard] },
  { path: 'blogs/manage', component: BlogsComponent, canActivate: [AuthGuard], data: { breadcrumb: 'Manage Blogs', breadcrumbIcon: 'rss_feed' } },
  { path: 'exercises', component: ExerciseComponent, canActivate: [AuthGuard] },
  { path: 'diet', component: DietComponent, canActivate: [AuthGuard] },
  { path: 'diet/plans', component: DietComponent, canActivate: [AuthGuard], data: { breadcrumb: 'Diet Plans', breadcrumbIcon: 'calendar_today' } },
  { path: 'diet/view/:id', component: DietViewComponent, canActivate: [AuthGuard] },

  { path: 'billing', component: BillingComponent, canActivate: [AuthGuard] },
  { path: 'billing/patient/:patientId', component: PatientBillingDashboardComponent, canActivate: [AuthGuard] },
  { path: 'billing/invoice/:id', component: InvoiceDetailComponent, canActivate: [AuthGuard] },
  { path: 'help', component: HelpComponent, canActivate: [AuthGuard] },
  { path: 'patients', component: PatientListComponent, canActivate: [AuthGuard] },
  { path: 'add-patient', component: PatientFormComponent, canActivate: [AuthGuard] },
  { path: 'edit-patient/:id', component: PatientFormComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  { 
    path: 'admin-dashboard', 
    component: AdminDashboardComponent, 
    canActivate: [AuthGuard],
    data: { breadcrumb: 'Admin Dashboard', breadcrumbIcon: 'admin_panel_settings' }
  },
  { path: 'admin/doctors', component: DoctorsComponent, canActivate: [AuthGuard] },
  { path: 'admin/doctors/test', component: DoctorCreateTestComponent, canActivate: [AuthGuard] },
  { path: 'admin/roles', component: RolesComponent, canActivate: [AuthGuard] },
  { path: 'admin/plans', component: PlansComponent, canActivate: [AuthGuard] },

  { path: 'admin/billing', component: AdminBillingComponent, canActivate: [AuthGuard], data: { breadcrumb: 'Billing', breadcrumbIcon: 'credit_card' } },
  { path: 'admin/hospital', component: HospitalComponent, canActivate: [AuthGuard], data: { breadcrumb: 'Hospital', breadcrumbIcon: 'apartment' } },
  {
    path: 'admin/base-configuration',
    component: BaseConfigurationComponent,
    canActivate: [AuthGuard],
    data: { breadcrumb: 'Base Configuration', breadcrumbIcon: 'settings' }
  },
  // Additional routes for better navigation
  { path: 'exercise-create', component: ExerciseCreateComponent, canActivate: [AuthGuard] },
  { path: 'exercise-set-create', component: ExerciseSetCreateComponent, canActivate: [AuthGuard] },
  { path: 'diet-create', component: DietCreateComponent, canActivate: [AuthGuard] },
  { path: 'doctor-create', component: DoctorCreateComponent, canActivate: [AuthGuard] },
  { path: 'patient-create', component: PatientCreateComponent, canActivate: [AuthGuard] },
  { path: 'diet-plan-view/:id', component: DietPlanViewComponent, canActivate: [AuthGuard], data: { breadcrumb: 'View Diet Plan', breadcrumbIcon: 'visibility' } },
  { path: 'diet-plan-create', component: DietPlanCreateComponent, canActivate: [AuthGuard], data: { breadcrumb: 'Create Diet Plan', breadcrumbIcon: 'add_circle' } },
  { path: 'diet-plan-edit/:id', component: DietPlanCreateComponent, canActivate: [AuthGuard], data: { breadcrumb: 'Edit Diet Plan', breadcrumbIcon: 'edit' } },
  { path: '**', redirectTo: '/dashboard' }
];
