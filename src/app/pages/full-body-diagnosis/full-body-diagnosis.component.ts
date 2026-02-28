import { Component, OnInit, OnDestroy, Inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppButtonComponent, IconComponent, DialogboxService, DialogFooterAction, AppInputComponent, DIALOG_DATA_TOKEN } from '@lk/core';
import { Subject, takeUntil } from 'rxjs';
import { DatePipe } from '@angular/common';

export interface BodyPartComment {
  id: string;
  bodyPart: string;
  comment: string;
  timestamp: Date;
  doctorName: string;
}

@Component({
    selector: 'app-full-body-diagnosis',
    imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    AppButtonComponent,
    IconComponent,
    DatePipe

],
    templateUrl: './full-body-diagnosis.component.html',
    styleUrl: './full-body-diagnosis.component.scss'
})
export class FullBodyDiagnosisComponent implements OnInit, OnDestroy {
  isClickModeEnabled = false;
  comments: BodyPartComment[] = [];
  private destroy$ = new Subject<void>();

  // Body parts configuration
  bodyParts = [
    { id: 'head', name: 'Head', x: 50, y: 5 },
    { id: 'neck', name: 'Neck', x: 50, y: 15 },
    { id: 'left-shoulder', name: 'Left Shoulder', x: 35, y: 20 },
    { id: 'right-shoulder', name: 'Right Shoulder', x: 65, y: 20 },
    { id: 'left-elbow', name: 'Left Elbow', x: 30, y: 35 },
    { id: 'right-elbow', name: 'Right Elbow', x: 70, y: 35 },
    { id: 'chest', name: 'Chest', x: 50, y: 25 },
    { id: 'abdomen', name: 'Abdomen', x: 50, y: 40 },
    { id: 'left-hand', name: 'Left Hand', x: 25, y: 45 },
    { id: 'right-hand', name: 'Right Hand', x: 75, y: 45 },
    { id: 'left-hip', name: 'Left Hip', x: 42, y: 50 },
    { id: 'right-hip', name: 'Right Hip', x: 58, y: 50 },
    { id: 'left-knee', name: 'Left Knee', x: 45, y: 65 },
    { id: 'right-knee', name: 'Right Knee', x: 55, y: 65 },
    { id: 'left-foot', name: 'Left Foot', x: 45, y: 85 },
    { id: 'right-foot', name: 'Right Foot', x: 55, y: 85 }
  ];

  constructor(
    private dialog: MatDialog,
    private dialogService: DialogboxService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Load existing comments if any
    this.loadComments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleClickMode(): void {
    this.isClickModeEnabled = !this.isClickModeEnabled;
  }

  onBodyPartClick(bodyPartId: string): void {
    if (!this.isClickModeEnabled) {
      return;
    }

    const bodyPart = this.bodyParts.find(bp => bp.id === bodyPartId);
    if (!bodyPart) return;

    this.openCommentDialog(bodyPart.name, bodyPartId);
  }

  openCommentDialog(bodyPartName: string, bodyPartId: string): void {
    const config = {
      title: `Add Comment - ${bodyPartName}`,
      data: {
        bodyPartName,
        bodyPartId
      },
      footerActions: [
        {
          id: 'cancel',
          text: 'Cancel',
          color: 'primary' as const,
          appearance: 'flat' as const
        },
        {
          id: 'save',
          text: 'Add Comment',
          color: 'primary' as const,
          appearance: 'flat' as const,
          disabled: false
        }
      ],
      width: '500px'
    };
    
    const dialogRef = this.dialogService.openDialog(CommentDialogComponent, config);

    dialogRef.beforeClosed().pipe(takeUntil(this.destroy$)).subscribe((result: any) => {
      if (result?.action === 'save' && result?.comment) {
        const newComment: BodyPartComment = {
          id: this.generateId(),
          bodyPart: bodyPartId,
          comment: result.comment,
          timestamp: new Date(),
          doctorName: 'Dr. Current User' // Replace with actual doctor name
        };
        this.comments.push(newComment);
        this.saveComments();
      }
    });
  }

  getCommentsForBodyPart(bodyPartId: string): BodyPartComment[] {
    return this.comments.filter(c => c.bodyPart === bodyPartId);
  }

  getBodyPartName(bodyPartId: string): string {
    const part = this.bodyParts.find(bp => bp.id === bodyPartId);
    return part ? part.name : bodyPartId;
  }

  deleteComment(commentId: string): void {
    this.comments = this.comments.filter(c => c.id !== commentId);
    this.saveComments();
  }

  private generateId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadComments(): void {
    // Load from localStorage or API
    const saved = localStorage.getItem(`body_diagnosis_comments_${this.getPatientId()}`);
    if (saved) {
      try {
        this.comments = JSON.parse(saved).map((c: any) => ({
          ...c,
          timestamp: new Date(c.timestamp)
        }));
      } catch (e) {
        console.error('Error loading comments:', e);
      }
    }
  }

  private saveComments(): void {
    // Save to localStorage or API
    localStorage.setItem(`body_diagnosis_comments_${this.getPatientId()}`, JSON.stringify(this.comments));
  }

  private getPatientId(): string {
    // Get from route or input
    return 'default'; // Replace with actual patient ID
  }
}

// Comment Dialog Component
@Component({
    selector: 'app-comment-dialog',
    imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    AppInputComponent
],
    template: `
    <div class="comment-dialog-content">
      <div class="dialog-body">
        <p class="body-part-label">Body Part: <strong>{{ data.bodyPartName }}</strong></p>
        <div [formGroup]="commentForm">
          <app-input
            label="Comment"
            formControlName="comment"
            [multiline]="true"
            [rows]="4"
            placeholder="Enter your comment about this body part..."
            [required]="true">
          </app-input>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .comment-dialog-content {
      padding: 0;
    }
    .dialog-body {
      padding: 16px;
    }
    .body-part-label {
      margin-bottom: 16px;
      color: var(--text-muted);
      font-size: 14px;
    }
  `]
})
export class CommentDialogComponent implements OnInit, OnDestroy {
  commentForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    @Inject(DIALOG_DATA_TOKEN) public data: { bodyPartName: string; bodyPartId: string },
    private dialogRef: MatDialogRef<CommentDialogComponent>,
    private fb: FormBuilder
  ) {
    this.commentForm = this.fb.group({
      comment: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit(): void {
    // Update footer button state based on form validity
    this.commentForm.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      setTimeout(() => {
        try {
          const container = (this.dialogRef as any)._containerInstance;
          if (container) {
            const overlayRef = (container as any)._overlayRef;
            if (overlayRef) {
              const componentRef = (overlayRef as any)._componentRef;
              if (componentRef?.instance?.setFooterActionDisabled) {
                componentRef.instance.setFooterActionDisabled('save', !this.commentForm.valid);
              }
            }
          }
        } catch (e) {
          // Silently fail
        }
      }, 0);
    });

    // Handle dialog close - intercept before close to add form data
    const originalClose = this.dialogRef.close.bind(this.dialogRef);
    this.dialogRef.close = (result?: any) => {
      if (result?.action === 'save' && this.commentForm.valid) {
        originalClose({
          action: 'save',
          comment: this.commentForm.value.comment
        });
      } else {
        originalClose(result);
      }
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

