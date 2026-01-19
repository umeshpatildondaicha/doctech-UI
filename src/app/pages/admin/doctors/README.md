# Doctor Management System

This module provides comprehensive doctor management functionality for hospital administrators.

## Features

### 1. Doctor List View
- Grid-based display of all doctors
- Search and filter capabilities
- Status indicators and availability tracking
- Quick action menu for each doctor

### 2. Doctor Creation
- Comprehensive form with validation
- Mandatory and optional fields support
- Real-time form validation
- API integration with backend

## API Integration

### Endpoint
```
POST https://doctech.solutions/api/doctors
```

### Mandatory Fields
```json
{
  "registrationNumber": "DOC-12345",
  "firstName": "Umesh",
  "lastName": "Patil",
  "specialization": "Cardiology",
  "password": "Doctor@123",
  "doctorStatus": "PENDING"
}
```

### All Available Fields
```json
{
  "registrationNumber": "DOC-12345",
  "firstName": "Aarav",
  "lastName": "Shah",
  "specialization": "Cardiology",
  "contactNumber": "+919876543210",
  "email": "aarav.shah@example.test",
  "password": "StrongPass123!",
  "qualifications": "MBBS, MD",
  "certifications": ["BLS", "ACLS"],
  "profileImageUrl": "https://example.test/img/doc123.jpg",
  "doctorStatus": "PENDING",
  "createdAt": "2025-08-31T12:00:00",
  "updatedAt": "2025-08-31T12:00:00",
  "approvals": [],
  "workingDays": [],
  "appointmentTimings": [],
  "careerHistories": [],
  "blogs": [],
  "hospitalAssociations": []
}
```

## Field Validation Rules

### Registration Number
- Format: `DOC-12345` (DOC- followed by 5 digits)
- Required field

### Password
- Minimum 8 characters
- Must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)

### Email
- Valid email format
- Optional field

### Contact Number
- Valid phone number format
- Optional field

### Specialization
- Must be selected from predefined list
- Required field

## Usage

### 1. Access Doctor Management
Navigate to `/admin/doctors` to access the main doctor management page.

### 2. Create New Doctor
1. Click the "Add New Doctor" button in the page header
2. Fill in the required fields (marked with *)
3. Optionally fill in additional information
4. Click "Create Doctor" to submit

### 3. Test the Creation Form
Navigate to `/admin/doctors/test` to access a test page for the doctor creation dialog.

## Components

### AdminDoctorCreateComponent
- Main doctor creation form component
- Handles form validation and submission
- Integrates with HTTP service for API calls

### DoctorsComponent
- Main doctor management page
- Displays doctor list and statistics
- Integrates doctor creation dialog

## Styling

The components use Material Design with custom styling:
- Responsive design for mobile and desktop
- Modern gradient headers
- Interactive form elements
- Professional color scheme
- Smooth animations and transitions

## Dependencies

- Angular Material (MatDialog, MatFormField, etc.)
- Angular Reactive Forms
- Angular HTTP Client
- Custom grid component
- Custom UI components (buttons, inputs, etc.)

## Error Handling

- Form validation with user-friendly error messages
- API error handling with snackbar notifications
- Loading states during form submission
- Graceful fallbacks for failed operations

## Future Enhancements

- Doctor editing functionality
- Bulk doctor import/export
- Advanced search and filtering
- Doctor scheduling integration
- Document upload support
- Multi-language support

