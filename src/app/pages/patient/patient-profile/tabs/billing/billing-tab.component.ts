import { Component, Input } from '@angular/core';
import { PatientBillingDashboardComponent } from '../../../../billing/patient-billing-dashboard.component';

@Component({
  selector: 'app-billing-tab',
  standalone: true,
  imports: [PatientBillingDashboardComponent],
  templateUrl: './billing-tab.component.html',
  styleUrl: './billing-tab.component.scss'
})
export class BillingTabComponent {
  @Input() patientId: string = '';
  @Input() patientName: string = '';
  @Input() openInvoiceId: string = '';
}
