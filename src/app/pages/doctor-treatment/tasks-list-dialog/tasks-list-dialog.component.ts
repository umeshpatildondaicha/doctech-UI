import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { DIALOG_DATA_TOKEN, ExtendedGridOptions, GridComponent, DialogboxService } from "@lk/core";
import { ColDef } from 'ag-grid-community';
import { Subject, takeUntil, filter } from 'rxjs';

export interface TasksListDialogData {
  tasks: any[];
  onTaskComplete?: (task: any) => void;
  onTaskDelete?: (task: any) => void;
}

@Component({
    selector: 'app-tasks-list-dialog',
    imports: [
        CommonModule,
        GridComponent
    ],
    templateUrl: './tasks-list-dialog.component.html',
    styleUrls: ['./tasks-list-dialog.component.scss']
})
export class TasksListDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<TasksListDialogComponent>);
  data = inject<TasksListDialogData>(DIALOG_DATA_TOKEN);
  private destroy$ = new Subject<void>();
  private dialogService = inject(DialogboxService);

  columnDefs: ColDef[] = [];
  gridOptions: ExtendedGridOptions = {};
  tasksList: any[] = [];

  constructor() {
    this.initializeGrid();
  }

  ngOnInit(): void {
    // Initialize tasks list
    this.tasksList = [...(this.data?.tasks || [])];
    
    // Listen for footer action clicks before dialog closes
    this.dialogRef.beforeClosed().pipe(
      takeUntil(this.destroy$),
      filter(result => result?.action === 'close' || result?.action === 'cancel')
    ).subscribe((result) => {
      if (result?.action === 'close' || result?.action === 'cancel') {
        setTimeout(() => {
          this.dialogRef.close({ action: 'close', updatedTasks: this.tasksList });
        }, 0);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeGrid(): void {
    this.columnDefs = [
      {
        headerName: 'Status',
        field: 'completed',
        width: 100,
        cellRenderer: (params: any) => {
          const completed = params.value;
          const icon = completed ? 'check_circle' : 'radio_button_unchecked';
          const color = completed ? '#10b981' : '#6b7280';
          return `
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="material-icons" style="color: ${color}; font-size: 20px;">${icon}</i>
              <span style="color: ${color}; font-size: 12px; font-weight: 500;">
                ${completed ? 'Completed' : 'Pending'}
              </span>
            </div>
          `;
        }
      },
      {
        headerName: 'Task Title',
        field: 'title',
        flex: 2,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          const completed = params.data.completed;
          const style = completed ? 'text-decoration: line-through; color: #9ca3af;' : 'color: #1f2937; font-weight: 500;';
          return `<div style="${style}">${params.value || ''}</div>`;
        }
      },
      {
        headerName: 'Due Date',
        field: 'due',
        width: 150,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          return `<div style="color: #6b7280; font-size: 13px;">${params.value || 'No due date'}</div>`;
        }
      },
      {
        headerName: 'Priority',
        field: 'priority',
        width: 120,
        sortable: true,
        filter: 'agSetColumnFilter',
        cellRenderer: (params: any) => {
          if (!params.value) return '-';
          const priority = params.value.toUpperCase();
          let color = '#6b7280';
          let bgColor = '#f3f4f6';
          
          switch (priority) {
            case 'URGENT':
              color = '#ef4444';
              bgColor = '#fee2e2';
              break;
            case 'HIGH':
              color = '#f59e0b';
              bgColor = '#fef3c7';
              break;
            case 'MEDIUM':
              color = '#3b82f6';
              bgColor = '#dbeafe';
              break;
            case 'LOW':
              color = '#10b981';
              bgColor = '#d1fae5';
              break;
          }
          
          return `
            <span style="background: ${bgColor}; color: ${color}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
              ${priority}
            </span>
          `;
        }
      },
      {
        headerName: 'Type',
        field: 'taskType',
        width: 140,
        sortable: true,
        filter: 'agSetColumnFilter',
        cellRenderer: (params: any) => {
          if (!params.value) return '-';
          return `<div style="color: #6b7280; font-size: 13px;">${params.value}</div>`;
        }
      }
    ];

    this.gridOptions = {
      rowHeight: 50,
      headerHeight: 40,
      filterConfig: {
        filterConfig: [
          { 
            label: 'Status', 
            key: 'completed', 
            type: 'select',
            optionList: [
              { name: 'Completed', value: true },
              { name: 'Pending', value: false }
            ]
          },
          { label: 'Task Title', key: 'title', type: 'input' },
          { label: 'Due Date', key: 'due', type: 'daterangetimepicker' },
          { 
            label: 'Priority', 
            key: 'priority', 
            type: 'select',
            optionList: [
              { name: 'Urgent', value: 'URGENT' },
              { name: 'High', value: 'HIGH' },
              { name: 'Medium', value: 'MEDIUM' },
              { name: 'Low', value: 'LOW' }
            ]
          },
          { 
            label: 'Type', 
            key: 'taskType', 
            type: 'select'
          }
        ]
      },
      pagination: true,
      paginationPageSize: 20,
      paginationPageSizeSelector: [10, 20, 50, 100],
      suppressRowClickSelection: false,
      animateRows: true,
      menuActions: [
        {
          title: 'Complete',
          icon: 'check_circle',
          click: (param: any) => this.completeTask(param.data)
        },
        {
          title: 'Delete',
          icon: 'delete',
          click: (param: any) => this.deleteTask(param.data)
        }
      ]
    };
  }

  completeTask(task: any): void {
    const index = this.tasksList.findIndex(t => 
      t.title === task.title && t.due === task.due
    );
    
    if (index !== -1 && !this.tasksList[index].completed) {
      this.tasksList[index].completed = true;
      
      // Call parent callback if provided
      if (this.data.onTaskComplete) {
        this.data.onTaskComplete(task);
      }
      
      // Refresh grid
      this.refreshGrid();
    }
  }

  deleteTask(task: any): void {
    const confirmDialogRef = this.dialogService.openConfirmationDialog({
      message: 'Are you sure you want to delete this task?',
      title: 'Delete Task',
      icon: 'delete',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    confirmDialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.confirmed) {
        const index = this.tasksList.findIndex(t => 
          t.title === task.title && t.due === task.due
        );
        
        if (index !== -1) {
          this.tasksList.splice(index, 1);
          
          // Call parent callback if provided
          if (this.data.onTaskDelete) {
            this.data.onTaskDelete(task);
          }
          
          // Refresh grid
          this.refreshGrid();
        }
      }
    });
  }

  private refreshGrid(): void {
    // Trigger change detection by creating a new array reference
    this.tasksList = [...this.tasksList];
  }

  get tasks(): any[] {
    return this.tasksList;
  }
}

