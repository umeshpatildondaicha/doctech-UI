import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppButtonComponent, IconComponent } from '@lk/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-service-details-dialog',
  standalone: true,
  imports: [CommonModule, AppButtonComponent, IconComponent],
  templateUrl: './service-details-dialog.component.html',
  styleUrls: ['./service-details-dialog.component.scss']
})
export class ServiceDetailsDialogComponent {
  stars = '';
  categoryLabel = '';

  constructor(
    private readonly dialogRef: MatDialogRef<ServiceDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly router: Router
  ) {
    const rating = Number(data?.rating) || 0;
    const int = Math.max(0, Math.min(5, Math.floor(rating)));
    this.stars = '★'.repeat(int) + '☆'.repeat(5 - int);

    const map: Record<string, string> = {
      consultation: 'Consultation',
      therapy: 'Therapy',
      diagnostic: 'Diagnostic',
      surgical: 'Surgical'
    };
    this.categoryLabel = map[(data?.category || '').toLowerCase()] || data?.category || '';
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onEdit(): void {
    if (this.data?.id) {
      this.dialogRef.close();
      this.router.navigate(['/admin/services/edit', this.data.id], { state: { service: this.data } });
    }
  }

  availabilityClass(): string {
    const a = (this.data?.availability || '').toLowerCase();
    if (a === 'available') return 'available';
    if (a === 'limited') return 'limited';
    if (a === 'unavailable') return 'unavailable';
    return 'neutral';
  }
}


