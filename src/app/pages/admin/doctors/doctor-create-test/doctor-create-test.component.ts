import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminDoctorCreateComponent } from '../doctor-create/doctor-create.component';

@Component({
  selector: 'app-doctor-create-test',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="test-container">
      <h1>Doctor Creation Test</h1>
      <p>Click the button below to test the doctor creation dialog:</p>
      
      <button mat-raised-button 
              color="primary" 
              (click)="openDoctorCreateDialog()"
              class="test-button">
        <mat-icon>person_add</mat-icon>
        Create New Doctor
      </button>
      
      <div class="info-section">
        <h3>API Endpoint:</h3>
        <code>POST https://doctech.solutions/api/doctors</code>
        
        <h3>Mandatory Fields:</h3>
        <ul>
          <li>registrationNumber (format: DOC-12345)</li>
          <li>firstName</li>
          <li>lastName</li>
          <li>specialization</li>
          <li>password (min 8 chars, with uppercase, lowercase, number & special char)</li>
          <li>doctorStatus</li>
        </ul>
        
        <h3>Optional Fields:</h3>
        <ul>
          <li>contactNumber</li>
          <li>email</li>
          <li>qualifications</li>
          <li>certifications (array)</li>
          <li>profileImageUrl</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    h1 {
      color: #2c3e50;
      text-align: center;
      margin-bottom: 30px;
    }
    
    .test-button {
      display: block;
      margin: 30px auto;
      padding: 15px 30px;
      font-size: 16px;
    }
    
    .info-section {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      margin-top: 30px;
    }
    
    .info-section h3 {
      color: #2c3e50;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    .info-section h3:first-child {
      margin-top: 0;
    }
    
    code {
      background: #e9ecef;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      color: #495057;
    }
    
    ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    
    li {
      margin: 5px 0;
      color: #495057;
    }
  `]
})
export class DoctorCreateTestComponent {
  constructor(private dialog: MatDialog) {}

  openDoctorCreateDialog() {
    const dialogRef = this.dialog.open(AdminDoctorCreateComponent, {
      width: '900px',
      maxHeight: '90vh',
      disableClose: true,
      data: {},
      panelClass: 'doctor-create-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Doctor created successfully:', result);
        alert('Doctor created successfully! Check console for details.');
      }
    });
  }
}

