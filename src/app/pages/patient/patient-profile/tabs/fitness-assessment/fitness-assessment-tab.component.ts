import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { FitnessAssessmentService, FitnessAssessmentDTO } from '../../../../../services/fitness-assessment.service';

@Component({
  selector: 'app-fitness-assessment-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './fitness-assessment-tab.component.html',
  styleUrl: './fitness-assessment-tab.component.scss'
})
export class FitnessAssessmentTabComponent implements OnInit, OnChanges {
  @Input() patientId: string = '';
  @Input() patientName: string = '';
  @Input() patientPublicId: string | null = null;

  assessment: FitnessAssessmentDTO | null = null;
  history: FitnessAssessmentDTO[] = [];
  loading = false;
  error: string | null = null;

  constructor(private readonly service: FitnessAssessmentService) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientPublicId'] && !changes['patientPublicId'].firstChange) {
      this.load();
    }
  }

  load(): void {
    if (!this.patientPublicId) return;
    this.loading = true;
    this.error = null;

    this.service.getLatest(this.patientPublicId).subscribe({
      next: (data) => {
        this.assessment = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 404) {
          this.assessment = null;
        } else {
          this.error = 'Failed to load fitness assessment.';
        }
      }
    });

    this.service.listAll(this.patientPublicId).subscribe({
      next: (list) => { this.history = list; },
      error: () => { this.history = []; }
    });
  }

  getFitnessGoalStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  getTopGoals(): { goal: string; rating: number }[] {
    if (!this.assessment?.goalRatings) return [];
    return Object.entries(this.assessment.goalRatings)
      .filter(([, r]) => r > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([goal, rating]) => ({ goal, rating }));
  }
}
