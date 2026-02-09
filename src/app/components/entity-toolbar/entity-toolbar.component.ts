import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
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
export class EntityToolbarComponent implements OnInit {
  @Input() title: string | undefined;
  @Input() subtitle: string | undefined;
  @Input() showCounts = true;
  @Input() currentCount: number | undefined;
  @Input() totalCount: number | undefined;
  @Input() newLabel = 'New agent';
  @Input() showNew = true;
  @Input() showRefresh = true;
  @Input() showFilter = true;

  @Output() newClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() filterClick = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  @Output() segmentChange = new EventEmitter<string>();

  searchQuery = '';
  searchSegments: SearchSegment[] = [];

  ngOnInit() {
    // Initialize with default segments as shown in screenshot
    this.searchSegments = [
      { name: 'All', count: 187, active: true },
      { name: 'Chat', count: 50, active: false },
      { name: 'Voice', count: 136, active: false },
      { name: 'Flow driven', count: 1, active: false }
    ];
  }

  onSearchInput(value: string) {
    this.searchQuery = value;
    this.search.emit(value);
  }

  selectSegment(segment: SearchSegment) {
    this.searchSegments.forEach(s => s.active = false);
    segment.active = true;
    this.segmentChange.emit(segment.name);
  }

  emitNew() {
    this.newClick.emit();
  }

  emitRefresh() {
    this.refreshClick.emit();
  }

  emitFilter() {
    this.filterClick.emit();
  }
}