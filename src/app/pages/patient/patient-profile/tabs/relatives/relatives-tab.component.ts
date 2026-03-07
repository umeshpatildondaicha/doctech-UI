import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, AppButtonComponent, DialogboxService, DialogFooterAction } from '@lk/core';
import { AddRelativeDialogComponent } from '../../../add-relative-dialog/add-relative-dialog.component';
import { PatientRelative } from '../../../../../interfaces/patient-relatives.interface';

@Component({
  selector: 'app-relatives-tab',
  standalone: true,
  imports: [CommonModule, IconComponent, AppButtonComponent],
  templateUrl: './relatives-tab.component.html',
  styleUrl: './relatives-tab.component.scss'
})
export class RelativesTabComponent implements OnInit {
  @Input() patientId: string = '';
  @Input() patientName: string = '';

  patientRelatives: PatientRelative[] = [];

  constructor(private readonly dialogService: DialogboxService) {}

  ngOnInit(): void {
    this.patientRelatives = [
      {
        id: 'REL001', patientId: this.patientId, patientName: this.patientName,
        relativeName: 'John Johnson', relationship: 'SPOUSE',
        contactNumber: '+1 (555) 987-6543', email: 'john.johnson@email.com',
        emergencyContact: true, canMakeDecisions: true, canReceiveUpdates: true, canVisit: true,
        visitingHours: { startTime: '9:00 AM', endTime: '8:00 PM', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] },
        addedBy: 'Dr. Michael Chen', addedDate: new Date('2024-01-15'),
        isActive: true, verificationStatus: 'VERIFIED'
      }
    ];
  }

  addRelative(): void {
    const footerActions: DialogFooterAction[] = [
      { id: 'cancel', text: 'Cancel', color: 'primary', appearance: 'flat' },
      { id: 'save', text: 'Add Relative', color: 'primary', appearance: 'raised' }
    ];
    const ref = this.dialogService.openDialog(AddRelativeDialogComponent, {
      title: 'Add Patient Relative', width: '600px',
      data: { patientId: this.patientId, patientName: this.patientName },
      footerActions
    });
    ref.afterClosed().subscribe(result => {
      if (result?.action === 'save' && result.formData) {
        const d = result.formData;
        this.patientRelatives.push({
          id: `REL${Date.now()}`, patientId: this.patientId, patientName: this.patientName,
          relativeName: d.relativeName, relationship: d.relationship,
          contactNumber: d.contactNumber, alternateContactNumber: d.alternateContactNumber,
          email: d.email, address: d.address,
          emergencyContact: d.emergencyContact || false,
          canMakeDecisions: d.canMakeDecisions || false,
          canReceiveUpdates: d.canReceiveUpdates || true,
          canVisit: d.canVisit || true,
          addedBy: 'Current User', addedDate: new Date(),
          isActive: true, verificationStatus: 'PENDING',
          notes: d.notes
        });
      }
    });
  }

  contactRelative(relative: PatientRelative): void {
    window.open(`tel:${relative.contactNumber}`);
  }

  verifyRelative(relative: PatientRelative): void {
    relative.verificationStatus = 'VERIFIED';
  }

  getRelativeRelationshipIcon(relationship: string): string {
    const map: Record<string, string> = {
      SPOUSE: 'favorite', PARENT: 'elderly', CHILD: 'child_care', SIBLING: 'people',
      GRANDPARENT: 'elderly', GUARDIAN: 'shield', FRIEND: 'person'
    };
    return map[relationship] ?? 'person';
  }

  getRelativeRelationshipColor(relationship: string): string {
    const map: Record<string, string> = {
      SPOUSE: '#ec4899', PARENT: '#8b5cf6', CHILD: '#3b82f6', SIBLING: '#10b981',
      GRANDPARENT: '#f59e0b', GUARDIAN: '#6b7280', FRIEND: '#06b6d4'
    };
    return map[relationship] ?? '#6b7280';
  }
}
