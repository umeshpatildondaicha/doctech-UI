import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { IconComponent, AppButtonComponent, DialogboxService, DialogFooterAction } from '@lk/core';
import { MedicineRequestDialogComponent } from '../../../medicine-request-dialog/medicine-request-dialog.component';
import { MedicineRequest } from '../../../../../interfaces/medicine-request.interface';

@Component({
  selector: 'app-medicine-requests-tab',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, IconComponent, AppButtonComponent],
  templateUrl: './medicine-requests-tab.component.html',
  styleUrl: './medicine-requests-tab.component.scss'
})
export class MedicineRequestsTabComponent implements OnInit {
  @Input() patientId: string = '';
  @Input() patientName: string = '';

  medicineRequests: MedicineRequest[] = [];

  constructor(private readonly dialogService: DialogboxService) {}

  ngOnInit(): void {
    this.medicineRequests = [
      {
        id: 'MR001', patientId: this.patientId, patientName: this.patientName,
        requestedBy: 'Patient', requestedById: this.patientId, requestedByRole: 'PATIENT',
        requestDate: new Date(), requestTime: new Date(Date.now() - 10800000),
        medicineName: 'Pain Relief', dosage: '500mg', frequency: 'As needed', route: 'Oral',
        quantity: 10, urgency: 'MEDIUM', reason: 'Headache and body pain',
        currentSymptoms: ['Headache', 'Body aches'], status: 'APPROVED',
        approvedBy: 'Dr. Sarah Johnson', approvedById: 'DOC001',
        approvedDate: new Date(Date.now() - 7200000), isPrescriptionRequired: true,
        pharmacyNotes: 'Dispensed successfully'
      }
    ];
  }

  addMedicineRequest(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'primary', appearance: 'flat' },
      { id: 'submit', text: 'Submit Request', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(MedicineRequestDialogComponent, {
      title: 'Request Medicine', width: '700px',
      data: { patientId: this.patientId, patientName: this.patientName },
      footerActions
    });
    ref.afterClosed().subscribe(result => {
      if (result?.action === 'submit' && result.formData) {
        const d = result.formData;
        this.medicineRequests.unshift({
          id: `MR${Date.now()}`, patientId: this.patientId, patientName: this.patientName,
          ...d, requestedById: this.patientId, requestDate: new Date(), requestTime: new Date(),
          currentSymptoms: d.currentSymptoms ? d.currentSymptoms.split(',').map((s: string) => s.trim()) : [],
          status: 'PENDING', isPrescriptionRequired: d.isPrescriptionRequired || true
        });
      }
    });
  }

  approveMedicineRequest(request: MedicineRequest): void {
    request.status = 'APPROVED';
    request.approvedBy = 'Dr. Sarah Johnson';
    request.approvedById = 'DOC001';
    request.approvedDate = new Date();
  }

  rejectMedicineRequest(request: MedicineRequest): void {
    request.status = 'REJECTED';
    request.rejectionReason = 'Not medically necessary at this time';
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = { PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444', DISPENSED: '#3b82f6', CANCELLED: '#6b7280' };
    return map[status] ?? '#6b7280';
  }

  formatTimeAgo(date: Date): string {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
}
