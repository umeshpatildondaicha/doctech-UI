import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PatientQueueDisplay, QueueStatistics } from '../interfaces/patient-queue.interface';

@Injectable({
  providedIn: 'root'
})
export class PatientQueueService {
  
  private readonly queueDataSubject = new BehaviorSubject<PatientQueueDisplay[]>([]);
  private readonly currentPatientSubject = new BehaviorSubject<PatientQueueDisplay | null>(null);
  private readonly statisticsSubject = new BehaviorSubject<QueueStatistics>({
    totalPatients: 0,
    waiting: 0,
    inProgress: 0,
    completed: 0,
    averageWaitTime: 0,
    estimatedCompletionTime: '',
    doctorWorkload: []
  });

  public queueData$ = this.queueDataSubject.asObservable();
  public currentPatient$ = this.currentPatientSubject.asObservable();
  public statistics$ = this.statisticsSubject.asObservable();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock data initialization
    const mockData: PatientQueueDisplay[] = [
      {
        patientId: 1,
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        contact: 1234567890,
        email: 'john.doe@email.com',
        address: '123 Main St, Anytown, USA',
        bloodGroup: 'A_POSITIVE',
        profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        createdDate: '2024-01-15',
        updatedDate: '2024-01-15',
        queueInfo: {
          queueId: 1,
          patientId: 1,
          appointmentId: 101,
          queuePosition: 1,
          status: 'IN_PROGRESS',
          priority: 'NORMAL',
          estimatedDuration: 30,
          doctorId: 1,
          roomNumber: 'A101',
          checkInTime: '09:00',
          waitTime: 15,
          reasonForVisit: 'Regular checkup',
          isUrgent: false,
          hasInsurance: true,
          paymentStatus: 'COMPLETED',
          appointmentTime: '09:15'
        },
        medicalAlerts: ['Penicillin allergy'],
        lastVisitDate: '2024-01-10',
        upcomingTests: ['Blood test', 'X-ray'],
        currentMedications: ['Vitamin D', 'Iron supplements'],
        insuranceProvider: 'Blue Cross',
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '1234567891'
        },
        allergies: ['Penicillin', 'Dairy'],
        chronicConditions: ['Hypertension']
      },
      {
        patientId: 2,
        firstName: 'Sarah',
        lastName: 'Wilson',
        dateOfBirth: '1992-03-20',
        gender: 'Female',
        contact: 1234567892,
        email: 'sarah.wilson@email.com',
        address: '101 Pine St, Anytown, USA',
        bloodGroup: 'AB_NEGATIVE',
        profilePhoto: '',
        createdDate: '2024-12-16',
        updatedDate: '2024-12-16',
        queueInfo: {
          queueId: 2,
          patientId: 2,
          appointmentId: 102,
          queuePosition: 2,
          status: 'WAITING',
          priority: 'HIGH',
          estimatedDuration: 45,
          doctorId: 2,
          roomNumber: 'B102',
          checkInTime: '09:15',
          waitTime: 30,
          reasonForVisit: 'Chest pain',
          isUrgent: true,
          hasInsurance: true,
          paymentStatus: 'PENDING',
          appointmentTime: '09:30'
        },
        medicalAlerts: ['Heart condition'],
        lastVisitDate: '2024-01-05',
        upcomingTests: ['ECG', 'Blood pressure'],
        currentMedications: ['Aspirin', 'Blood pressure medication'],
        insuranceProvider: 'Aetna',
        emergencyContact: {
          name: 'Mike Wilson',
          relationship: 'Husband',
          phone: '1234567893'
        },
        allergies: ['Latex'],
        chronicConditions: ['Hypertension', 'Diabetes']
      },
      {
        patientId: 3,
        firstName: 'Mike',
        lastName: 'Johnson',
        dateOfBirth: '1988-12-15',
        gender: 'Male',
        contact: 1234567894,
        email: 'mike.johnson@email.com',
        address: '789 Oak St, Anytown, USA',
        bloodGroup: 'O_POSITIVE',
        profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        createdDate: '2024-01-18',
        updatedDate: '2024-01-18',
        queueInfo: {
          queueId: 3,
          patientId: 3,
          appointmentId: 103,
          queuePosition: 3,
          status: 'WAITING',
          priority: 'NORMAL',
          estimatedDuration: 25,
          doctorId: 1,
          roomNumber: 'A101',
          checkInTime: '09:30',
          waitTime: 45,
          reasonForVisit: 'Follow-up consultation',
          isUrgent: false,
          hasInsurance: false,
          paymentStatus: 'PENDING',
          appointmentTime: '10:00'
        },
        medicalAlerts: [],
        lastVisitDate: '2024-01-12',
        upcomingTests: [],
        currentMedications: [],
        insuranceProvider: undefined,
        emergencyContact: {
          name: 'Lisa Johnson',
          relationship: 'Wife',
          phone: '1234567895'
        },
        allergies: [],
        chronicConditions: []
      },
      {
        patientId: 4,
        firstName: 'Emily',
        lastName: 'Davis',
        dateOfBirth: '1995-07-10',
        gender: 'Female',
        contact: 1234567896,
        email: 'emily.davis@email.com',
        address: '456 Elm St, Anytown, USA',
        bloodGroup: 'B_POSITIVE',
        profilePhoto: '', // No profile photo - will show fallback icon
        createdDate: '2024-01-20',
        updatedDate: '2024-01-20',
        queueInfo: {
          queueId: 4,
          patientId: 4,
          appointmentId: 104,
          queuePosition: 4,
          status: 'WAITING',
          priority: 'NORMAL',
          estimatedDuration: 20,
          doctorId: 2,
          roomNumber: 'B103',
          checkInTime: '10:00',
          waitTime: 60,
          reasonForVisit: 'Annual checkup',
          isUrgent: false,
          hasInsurance: true,
          paymentStatus: 'COMPLETED',
          appointmentTime: '10:30'
        },
        medicalAlerts: [],
        lastVisitDate: '2024-01-15',
        upcomingTests: ['Blood test'],
        currentMedications: [],
        insuranceProvider: 'Cigna',
        emergencyContact: {
          name: 'Robert Davis',
          relationship: 'Father',
          phone: '1234567897'
        },
        allergies: [],
        chronicConditions: []
      },
      {
        patientId: 5,
        firstName: 'David',
        lastName: 'Brown',
        dateOfBirth: '1985-11-25',
        gender: 'Male',
        contact: 1234567898,
        email: 'david.brown@email.com',
        address: '789 Pine St, Anytown, USA',
        bloodGroup: 'O_NEGATIVE',
        profilePhoto: '', // No profile photo - will show fallback icon
        createdDate: '2024-01-22',
        updatedDate: '2024-01-22',
        queueInfo: {
          queueId: 5,
          patientId: 5,
          appointmentId: 105,
          queuePosition: 5,
          status: 'WAITING',
          priority: 'LOW',
          estimatedDuration: 15,
          doctorId: 1,
          roomNumber: 'A102',
          checkInTime: '10:15',
          waitTime: 75,
          reasonForVisit: 'Prescription renewal',
          isUrgent: false,
          hasInsurance: true,
          paymentStatus: 'PENDING',
          appointmentTime: '11:00'
        },
        medicalAlerts: [],
        lastVisitDate: '2024-01-18',
        upcomingTests: [],
        currentMedications: ['Blood pressure medication'],
        insuranceProvider: 'UnitedHealth',
        emergencyContact: {
          name: 'Mary Brown',
          relationship: 'Wife',
          phone: '1234567899'
        },
        allergies: [],
        chronicConditions: ['Hypertension']
      }
    ];

    this.queueDataSubject.next(mockData);
    this.updateCurrentPatient();
    this.calculateStatistics();
  }

  // Get all queue data
  getQueueData(): Observable<PatientQueueDisplay[]> {
    return this.queueData$;
  }

  // Get current patient
  getCurrentPatient(): Observable<PatientQueueDisplay | null> {
    return this.currentPatient$;
  }

  // Get statistics
  getStatistics(): Observable<QueueStatistics> {
    return this.statistics$;
  }

  // Add patient to queue
  addPatientToQueue(patient: PatientQueueDisplay): void {
    const currentQueue = this.queueDataSubject.value;
    const newQueueId = Math.max(...currentQueue.map(p => p.queueInfo.queueId)) + 1;
    
    patient.queueInfo.queueId = newQueueId;
    patient.queueInfo.queuePosition = currentQueue.length + 1;
    patient.queueInfo.status = 'WAITING';
    patient.queueInfo.checkInTime = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    patient.queueInfo.waitTime = 0;
    
    const updatedQueue = [...currentQueue, patient];
    this.queueDataSubject.next(updatedQueue);
    this.updateCurrentPatient();
    this.calculateStatistics();
  }

  // Call patient (move to IN_PROGRESS)
  callPatient(patientId: number): void {
    const currentQueue = this.queueDataSubject.value;
    const updatedQueue = currentQueue.map(patient => {
      if (patient.patientId === patientId) {
        return {
          ...patient,
          queueInfo: {
            ...patient.queueInfo,
            status: 'IN_PROGRESS' as const,
            actualStartTime: new Date().toLocaleTimeString()
          }
        };
      }
      return patient;
    });

    this.queueDataSubject.next(updatedQueue);
    this.updateCurrentPatient();
    this.calculateStatistics();
  }

  // Complete consultation
  completeConsultation(patientId: number): void {
    const currentQueue = this.queueDataSubject.value;
    let updatedQueue = currentQueue.map(patient => {
      if (patient.patientId === patientId) {
        return {
          ...patient,
          queueInfo: {
            ...patient.queueInfo,
            status: 'COMPLETED' as const,
            actualEndTime: new Date().toLocaleTimeString()
          }
        };
      }
      return patient;
    });

    // Automatically move next waiting patient to IN_PROGRESS
    const nextPatient = this.getNextWaitingPatient(updatedQueue);
    if (nextPatient) {
      updatedQueue = updatedQueue.map(patient => {
        if (patient.patientId === nextPatient.patientId) {
          return {
            ...patient,
            queueInfo: {
              ...patient.queueInfo,
              status: 'IN_PROGRESS' as const,
              actualStartTime: new Date().toLocaleTimeString()
            }
          };
        }
        return patient;
      });
    }

    this.queueDataSubject.next(updatedQueue);
    this.updateCurrentPatient();
    this.calculateStatistics();
    
    // Emit event for automatic progression
    if (nextPatient) {
      this.emitPatientProgressionEvent(nextPatient);
    }
  }

  // Update patient notes
  updatePatientNotes(patientId: number, notes: string): void {
    const currentQueue = this.queueDataSubject.value;
    const updatedQueue = currentQueue.map(patient => {
      if (patient.patientId === patientId) {
        return {
          ...patient,
          queueInfo: {
            ...patient.queueInfo,
            notes
          }
        };
      }
      return patient;
    });

    this.queueDataSubject.next(updatedQueue);
  }

  // Remove patient from queue
  removePatientFromQueue(patientId: number): void {
    const currentQueue = this.queueDataSubject.value;
    const updatedQueue = currentQueue.filter(patient => patient.patientId !== patientId);
    
    // Reorder queue positions
    updatedQueue.forEach((patient, index) => {
      patient.queueInfo.queuePosition = index + 1;
    });

    this.queueDataSubject.next(updatedQueue);
    this.updateCurrentPatient();
    this.calculateStatistics();
  }

  // Reorder queue (drag and drop)
  reorderQueue(newOrder: PatientQueueDisplay[]): void {
    const updatedQueue = newOrder.map((patient, index) => ({
      ...patient,
      queueInfo: {
        ...patient.queueInfo,
        queuePosition: index + 1
      }
    }));

    this.queueDataSubject.next(updatedQueue);
    this.calculateStatistics();
  }

  // Search patients
  searchPatients(searchTerm: string): PatientQueueDisplay[] {
    const currentQueue = this.queueDataSubject.value;
    if (!searchTerm) return currentQueue;

    const search = searchTerm.toLowerCase();
    return currentQueue.filter(patient => 
      patient.firstName.toLowerCase().includes(search) ||
      patient.lastName.toLowerCase().includes(search) ||
      patient.queueInfo.reasonForVisit?.toLowerCase().includes(search) ||
      patient.queueInfo.roomNumber?.toLowerCase().includes(search)
    );
  }

  // Filter patients by status
  filterPatientsByStatus(status: string): PatientQueueDisplay[] {
    const currentQueue = this.queueDataSubject.value;
    if (status === 'ALL') return currentQueue;
    
    return currentQueue.filter(patient => patient.queueInfo.status === status);
  }

  // Sort patients
  sortPatients(sortBy: string): PatientQueueDisplay[] {
    const currentQueue = this.queueDataSubject.value;
    
    return [...currentQueue].sort((a, b) => {
      switch (sortBy) {
        case 'queuePosition':
          return a.queueInfo.queuePosition - b.queueInfo.queuePosition;
        case 'priority': {
          const priorityOrder = { 'EMERGENCY': 4, 'HIGH': 3, 'NORMAL': 2, 'LOW': 1 };
          return priorityOrder[b.queueInfo.priority] - priorityOrder[a.queueInfo.priority];
        }
        case 'waitTime':
          return b.queueInfo.waitTime - a.queueInfo.waitTime;
        case 'checkInTime':
          return a.queueInfo.checkInTime.localeCompare(b.queueInfo.checkInTime);
        default:
          return 0;
      }
    });
  }

  // Get next waiting patient in queue
  private getNextWaitingPatient(queue: PatientQueueDisplay[]): PatientQueueDisplay | null {
    const waitingPatients = queue
      .filter(p => p.queueInfo.status === 'WAITING')
      .sort((a, b) => a.queueInfo.queuePosition - b.queueInfo.queuePosition);
    
    return waitingPatients.length > 0 ? waitingPatients[0] : null;
  }

  // Emit patient progression event
  private emitPatientProgressionEvent(nextPatient: PatientQueueDisplay): void {
    // This could be used to show notifications or update UI
    console.log(`Next patient automatically started: ${nextPatient.firstName} ${nextPatient.lastName}`);
  }

  // Update current patient
  private updateCurrentPatient(): void {
    const currentQueue = this.queueDataSubject.value;
    const currentPatient = currentQueue.find(p => p.queueInfo.status === 'IN_PROGRESS') || null;
    this.currentPatientSubject.next(currentPatient);
  }

  // Calculate statistics
  private calculateStatistics(): void {
    const currentQueue = this.queueDataSubject.value;
    const waiting = currentQueue.filter(p => p.queueInfo.status === 'WAITING').length;
    const inProgress = currentQueue.filter(p => p.queueInfo.status === 'IN_PROGRESS').length;
    const completed = currentQueue.filter(p => p.queueInfo.status === 'COMPLETED').length;

    const statistics: QueueStatistics = {
      totalPatients: currentQueue.length,
      waiting,
      inProgress,
      completed,
      averageWaitTime: this.calculateAverageWaitTime(currentQueue),
      estimatedCompletionTime: this.calculateEstimatedCompletionTime(currentQueue),
      doctorWorkload: this.calculateDoctorWorkload(currentQueue)
    };

    this.statisticsSubject.next(statistics);
  }

  // Calculate average wait time
  private calculateAverageWaitTime(queue: PatientQueueDisplay[]): number {
    const waitingPatients = queue.filter(p => p.queueInfo.status === 'WAITING');
    if (waitingPatients.length === 0) return 0;
    
    const totalWaitTime = waitingPatients.reduce((sum, p) => sum + p.queueInfo.waitTime, 0);
    return Math.round(totalWaitTime / waitingPatients.length);
  }

  // Calculate estimated completion time
  private calculateEstimatedCompletionTime(queue: PatientQueueDisplay[]): string {
    const now = new Date();
    const totalRemainingTime = queue
      .filter(p => p.queueInfo.status === 'WAITING')
      .reduce((sum, p) => sum + p.queueInfo.estimatedDuration, 0);
    
    const estimatedTime = new Date(now.getTime() + totalRemainingTime * 60000);
    return estimatedTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // Calculate doctor workload
  private calculateDoctorWorkload(queue: PatientQueueDisplay[]): any[] {
    const doctorMap = new Map();
    
    queue.forEach(patient => {
      const doctorId = patient.queueInfo.doctorId;
      if (!doctorMap.has(doctorId)) {
        doctorMap.set(doctorId, {
          doctorId,
          doctorName: `Dr. ${patient.firstName}`, // Mock doctor name
          currentPatients: 0,
          estimatedWaitTime: 0
        });
      }
      
      const doctor = doctorMap.get(doctorId);
      if (patient.queueInfo.status === 'IN_PROGRESS') {
        doctor.currentPatients++;
      } else if (patient.queueInfo.status === 'WAITING') {
        doctor.estimatedWaitTime += patient.queueInfo.estimatedDuration;
      }
    });

    return Array.from(doctorMap.values());
  }

  // Refresh queue data (simulate API call)
  refreshQueue(): Observable<PatientQueueDisplay[]> {
    // Simulate API delay
    return new Observable(observer => {
      setTimeout(() => {
        // Update wait times
        const currentQueue = this.queueDataSubject.value;
        const updatedQueue = currentQueue.map(patient => {
          if (patient.queueInfo.status === 'WAITING') {
            return {
              ...patient,
              queueInfo: {
                ...patient.queueInfo,
                waitTime: patient.queueInfo.waitTime + 1
              }
            };
          }
          return patient;
        });

        this.queueDataSubject.next(updatedQueue);
        this.calculateStatistics();
        observer.next(updatedQueue);
        observer.complete();
      }, 1000);
    });
  }

  // Export queue data
  exportQueueData(): string {
    const currentQueue = this.queueDataSubject.value;
    const exportData = currentQueue.map(patient => ({
      name: `${patient.firstName} ${patient.lastName}`,
      status: patient.queueInfo.status,
      priority: patient.queueInfo.priority,
      checkInTime: patient.queueInfo.checkInTime,
      waitTime: patient.queueInfo.waitTime,
      reasonForVisit: patient.queueInfo.reasonForVisit,
      roomNumber: patient.queueInfo.roomNumber
    }));

    return JSON.stringify(exportData, null, 2);
  }
}
