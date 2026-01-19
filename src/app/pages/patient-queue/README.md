# Patient Queue System

## Overview
The Patient Queue System is a comprehensive dashboard designed to manage patient flow in medical clinics. It serves as the main operational hub for healthcare staff to efficiently manage patient consultations, track wait times, and maintain queue order.

## Features

### 🏥 **Queue Management**
- **Real-time Queue Display**: Live view of all patients in the queue
- **Priority Queue System**: Emergency, High, Normal, and Low priority levels
- **Status Tracking**: Waiting, In Progress, Completed, No-show, Cancelled
- **Auto-refresh**: Updates every 30 seconds automatically

### 📊 **Dashboard Statistics**
- **Total Patients**: Current count in the system
- **Waiting**: Number of patients waiting
- **In Progress**: Currently being consulted
- **Completed**: Finished consultations
- **Average Wait Time**: Calculated wait time metrics
- **Estimated Completion**: Time projection for queue completion

### 👥 **Patient Information**
- **Quick Patient Cards**: Essential info at a glance
- **Medical Alerts**: Allergies, chronic conditions, special needs
- **Appointment Details**: Doctor assignment, room number, duration
- **Patient History**: Previous visits, medications, test results

### ⚡ **Operational Actions**
- **Call Patient**: Send notification to waiting area
- **Start Consultation**: Begin patient session
- **Complete Consultation**: End and move to next patient
- **Add Notes**: Quick medical notes and observations
- **Reschedule**: Move appointments to different times

### 🔍 **Search & Filtering**
- **Patient Search**: Find patients by name or reason for visit
- **Status Filtering**: Filter by queue status
- **Sorting Options**: By position, priority, wait time, check-in time

## Architecture

### Components
```
patient-queue/
├── patient-queue.component.ts      # Main component logic
├── patient-queue.component.html    # Template with responsive design
├── patient-queue.component.scss    # Professional medical theme styles
└── README.md                       # This documentation
```

### Services
- **PatientQueueService**: Manages queue data, statistics, and operations
- **CustomEventsService**: Handles breadcrumb navigation
- **DialogboxComponent**: For user interactions and notes

### Interfaces
- **PatientQueue**: Core queue information
- **PatientQueueDisplay**: Extended patient data with queue info
- **QueueStatistics**: Dashboard metrics and analytics

## Usage Guide

### 1. **Accessing the Queue**
Navigate to `/patient-queue` in your application. The page requires authentication.

### 2. **Viewing Queue Status**
- **Statistics Cards**: Top section shows real-time metrics
- **Current Patient**: Highlighted section for active consultation
- **Queue List**: Left sidebar with all patients and their status

### 3. **Managing Patients**

#### **Call Patient**
- Click the phone icon on a waiting patient
- Patient status changes to "In Progress"
- Automatically becomes the current patient

#### **Start Consultation**
- Click "Start Consultation" button on current patient
- Redirects to consultation page with patient details

#### **Complete Consultation**
- Click "Complete" button when consultation ends
- Patient status changes to "Completed"
- Next waiting patient automatically becomes current

#### **Add Notes**
- Click notes icon or use context menu
- Add medical observations and instructions
- Notes are saved and displayed in patient details

### 4. **Searching & Filtering**
- **Search Box**: Type patient name or visit reason
- **Status Filter**: Select specific queue statuses
- **Sort Options**: Choose sorting criteria

### 5. **Patient Details**
- Click on any patient in the queue
- Right sidebar shows comprehensive patient information
- Includes medical history, allergies, medications, and queue details

## Data Structure

### Patient Queue Entry
```typescript
{
  queueId: number,
  patientId: number,
  appointmentId: number,
  queuePosition: number,
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED',
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY',
  estimatedDuration: number, // minutes
  checkInTime: string,
  waitTime: number, // minutes
  reasonForVisit: string,
  roomNumber: string,
  doctorId: number
}
```

### Priority Levels
- **EMERGENCY**: Immediate attention required (red)
- **HIGH**: Urgent cases (orange)
- **NORMAL**: Standard appointments (blue)
- **LOW**: Non-urgent follow-ups (green)

## Responsive Design

### **Desktop (1200px+)**
- Full dashboard layout with sidebars
- Statistics cards in grid format
- Patient details sidebar visible

### **Tablet (768px - 1199px)**
- Compact queue view
- Patient details stack above queue
- Optimized touch interactions

### **Mobile (< 768px)**
- Single column layout
- Collapsible sections
- Swipe-friendly patient cards

## Integration Points

### **Navigation Flow**
```
Patient Queue → Patient Details → Consultation → Complete → Next Patient
     ↓
Patient History, Medical Records, Prescriptions, Follow-ups
```

### **Related Components**
- **Patient Management**: Add/edit patient information
- **Appointment System**: Schedule and reschedule
- **Consultation Module**: Medical consultation interface
- **Billing System**: Payment status tracking

## Customization

### **Theme Colors**
The system uses a professional medical color scheme:
- Primary: Medical Blue (#2563eb)
- Secondary: Medical Teal (#0891b2)
- Success: Health Green (#059669)
- Warning: Medical Orange (#d97706)
- Danger: Medical Red (#dc2626)

### **Adding New Features**
1. Extend the `PatientQueueDisplay` interface
2. Update the service methods
3. Modify the template and styles
4. Add new action buttons and handlers

## Performance Considerations

### **Auto-refresh**
- Queue updates every 30 seconds
- Manual refresh available
- Optimized data loading

### **Data Management**
- Reactive data streams with RxJS
- Efficient filtering and sorting
- Minimal API calls

## Security

### **Authentication**
- Route protected with `AuthGuard`
- User role-based access control
- Secure data transmission

### **Data Privacy**
- Patient information encryption
- HIPAA compliance considerations
- Audit trail for all operations

## Troubleshooting

### **Common Issues**

#### **Queue Not Updating**
- Check network connectivity
- Verify service subscriptions
- Use manual refresh button

#### **Patient Status Not Changing**
- Ensure proper permissions
- Check service method calls
- Verify data binding

#### **Performance Issues**
- Reduce auto-refresh frequency
- Implement pagination for large queues
- Optimize search algorithms

## Future Enhancements

### **Planned Features**
- **Drag & Drop**: Reorder patients in queue
- **Real-time Notifications**: WebSocket integration
- **Digital Signage**: Waiting room displays
- **Mobile App**: Native mobile application
- **Analytics Dashboard**: Advanced reporting

### **Integration Opportunities**
- **Electronic Health Records**: Direct EHR integration
- **Patient Portal**: Self-service check-in
- **SMS/Email Alerts**: Automated patient notifications
- **Resource Management**: Room and equipment allocation

## Support

For technical support or feature requests, please contact the development team or refer to the main application documentation.

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Compatibility**: Angular 17+, Angular Material 17+

