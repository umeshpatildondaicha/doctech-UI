import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

interface SearchSegment {
  name: string;
  count: number;
  active: boolean;
}

@Component({
  selector: 'app-entity-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './entity-toolbar.component.html',
  styleUrls: ['./entity-toolbar.component.scss']
})
export class EntityToolbarComponent implements OnInit, OnDestroy, OnChanges {
  @Input() title: string | undefined;
  @Input() subtitle: string | undefined;
  @Input() showCounts = true;
  @Input() currentCount: number | undefined;
  @Input() totalCount: number | undefined;
  @Input() newLabel = 'New agent';
  @Input() showNew = true;
  @Input() showRefresh = true;
  @Input() showFilter = true;
  /** Static placeholder when no suggestions are provided */
  @Input() searchPlaceholder = 'Search';
  /**
   * List of placeholder texts to cycle through every 1 second.
   * e.g. ['Search by patient name...', 'Search by patient number...']
   */
  @Input() searchSuggestions: string[] = [];
  /** Interval in ms between placeholder changes (default 1000 = 1 sec) */
  @Input() placeholderRotateInterval = 1000;

  @Output() newClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() filterClick = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  @Output() segmentChange = new EventEmitter<string>();

  searchQuery = '';
  searchSegments: SearchSegment[] = [];
  displayPlaceholder = '';

  private suggestionIndex = 0;
  private rotateIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.applyPlaceholderFromSuggestions();
    this.searchSegments = [
      { name: 'All', count: 187, active: true },
      { name: 'Chat', count: 50, active: false },
      { name: 'Voice', count: 136, active: false },
      { name: 'Flow driven', count: 1, active: false }
    ];
    this.startRotateInterval();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchSuggestions']) {
      this.applyPlaceholderFromSuggestions();
      this.stopRotateInterval();
      this.startRotateInterval();
    }
  }

  ngOnDestroy(): void {
    this.stopRotateInterval();
  }

  private applyPlaceholderFromSuggestions(): void {
    this.displayPlaceholder =
      this.searchSuggestions?.length > 0
        ? this.searchSuggestions[this.suggestionIndex]
        : this.searchPlaceholder;
    this.cdr?.detectChanges();
  }

  private startRotateInterval(): void {
    if (this.rotateIntervalId != null || !this.searchSuggestions?.length) return;
    const intervalMs = this.placeholderRotateInterval;
    this.rotateIntervalId = setInterval(() => {
      if (this.searchQuery.trim() !== '') return;
      this.ngZone.run(() => {
        this.suggestionIndex =
          (this.suggestionIndex + 1) % this.searchSuggestions.length;
        this.displayPlaceholder =
          this.searchSuggestions[this.suggestionIndex];
        this.cdr?.detectChanges();
      });
    }, intervalMs);
  }

  private stopRotateInterval(): void {
    if (this.rotateIntervalId != null) {
      clearInterval(this.rotateIntervalId);
      this.rotateIntervalId = null;
    }
  }

  onSearchFocus(): void {
    this.stopRotateInterval();
  }

  onSearchBlur(): void {
    if (this.searchQuery.trim() === '') {
      this.startRotateInterval();
    }
  }

  onSearchInput(value: string): void {
    this.searchQuery = value;
    this.search.emit(value);
  }

  selectSegment(segment: SearchSegment): void {
    this.searchSegments.forEach((s) => (s.active = false));
    segment.active = true;
    this.segmentChange.emit(segment.name);
  }

  emitNew(): void {
    this.newClick.emit();
  }

  emitRefresh(): void {
    this.refreshClick.emit();
  }

  emitFilter(): void {
    this.filterClick.emit();
  }
}
