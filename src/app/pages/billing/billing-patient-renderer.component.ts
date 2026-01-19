import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-billing-patient-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cell-two-line">
      <div class="primary clickable" (click)="navigateToPatient($event)">{{ name }}</div>
      <div class="secondary" *ngIf="sub">{{ sub }}</div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 4px 0;
    }

    .cell-two-line {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 48px;
      width: 100%;
      overflow: hidden;
    }

    .primary {
      color: #333;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;

      &.clickable {
        color: #1976d2;
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
          color: #1565c0;
          text-decoration: underline;
        }
      }
    }

    .secondary {
      color: #999;
      font-size: 11px;
      font-weight: 400;
      line-height: 1.4;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
  `]
})
export class BillingPatientRendererComponent {
  params: any;
  name = '';
  sub = '';
  patientId: string = '';

  constructor(private readonly router: Router) {}

  agInit(params: any): void {
    this.params = params;
    this.update(params.data);
  }

  refresh(params: any): boolean {
    this.update(params.data);
    return true;
  }

  private update(row: any) {
    this.name = row?.patientName || '';
    this.sub = row?.invoiceNo || '';
    this.patientId = row?.patientId || '';
  }

  navigateToPatient(event: Event): void {
    event.stopPropagation(); // Prevent row click event
    if (this.patientId) {
      // Navigate to patient profile with billing tab
      this.router.navigate(['/patient', this.patientId], {
        queryParams: { tab: 'billing' }
      });
    }
  }
}


