import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
    selector: 'app-diet-selection-dialog',
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatChipsModule,
        MatTooltipModule,
        MatCheckboxModule
    ],
    templateUrl: './diet-selection-dialog.component.html',
    styleUrl: './diet-selection-dialog.component.scss'
})
export class DietSelectionDialogComponent implements OnInit {
  searchQuery: string = '';
  selectedDietType: string = '';
  selectedDiets: any[] = [];
  filteredDiets: any[] = [];
  selectAll: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<DietSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.filteredDiets = [...this.data.availableDiets];
  }

  onSearchChange() {
    this.filterDiets();
  }

  onDietTypeChange() {
    this.filterDiets();
  }

  filterDiets() {
    this.filteredDiets = this.data.availableDiets.filter((diet: any) => {
      const matchesSearch = !this.searchQuery || 
        diet.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        diet.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        diet.tags?.some((tag: string) => tag.toLowerCase().includes(this.searchQuery.toLowerCase()));
      
      const matchesType = !this.selectedDietType || 
        diet.dietType.toLowerCase() === this.selectedDietType.toLowerCase();
      
      return matchesSearch && matchesType;
    });
    this.updateSelectAllState();
  }

  toggleDietSelection(diet: any) {
    const index = this.selectedDiets.findIndex(d => d.dietId === diet.dietId);
    if (index > -1) {
      this.selectedDiets.splice(index, 1);
    } else {
      this.selectedDiets.push(diet);
    }
    this.updateSelectAllState();
  }

  isDietSelected(diet: any): boolean {
    return this.selectedDiets.some(d => d.dietId === diet.dietId);
  }

  toggleSelectAll() {
    if (this.selectAll) {
      // Select all filtered diets
      this.selectedDiets = [...this.filteredDiets];
    } else {
      // Deselect all
      this.selectedDiets = [];
    }
  }

  updateSelectAllState() {
    if (this.filteredDiets.length === 0) {
      this.selectAll = false;
    } else {
      this.selectAll = this.filteredDiets.every(diet => this.isDietSelected(diet));
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.selectedDiets.length > 0) {
      this.dialogRef.close({ selectedDiets: this.selectedDiets });
    }
  }

  getDietTypeColor(dietType: string): string {
    const colors: { [key: string]: string } = {
      'mediterranean': '#28a745',
      'keto': '#6f42c1',
      'vegan': '#20c997',
      'vegetarian': '#fd7e14',
      'paleo': '#e83e8c'
    };
    return colors[dietType.toLowerCase()] || '#6c757d';
  }

  getDietTypeIcon(dietType: string): string {
    const icons: { [key: string]: string } = {
      'mediterranean': 'restaurant',
      'keto': 'fitness_center',
      'vegan': 'eco',
      'vegetarian': 'spa',
      'paleo': 'forest'
    };
    return icons[dietType.toLowerCase()] || 'restaurant';
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedDietType = '';
    this.filterDiets();
  }

  getSelectedCount(): number {
    return this.selectedDiets.length;
  }

  getTotalCalories(): number {
    return this.selectedDiets.reduce((sum, diet) => sum + diet.calories, 0);
  }
}
