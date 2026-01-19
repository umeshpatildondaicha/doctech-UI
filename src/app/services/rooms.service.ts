import { Injectable } from '@angular/core';

interface Room {
  id: number;
  number: string;
  type: 'ICU' | 'General Ward' | 'Private' | 'Semi-Private';
  floor: number;
  wing: string;
  capacity: number;
  occupied: number;
  status: 'Available' | 'Full' | 'Maintenance';
  facilities?: { ac?: boolean; oxygen?: boolean; ventilator?: boolean; monitor?: boolean };
  icuLevel?: 'Level 1' | 'Level 2' | 'Level 3';
  ventilators?: number;
  monitors?: number;
  beds: Array<{
    id: string;
    status: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance' | 'Reserved';
    facilities?: { oxygen?: boolean; monitor?: boolean };
    patient?: string;
    patientInfo?: {
      name: string;
      age: number;
      gender: string;
      admission: string;
      doctor: string;
      diagnosis: string;
      expectedDischarge: string;
      guardian: string;
    };
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class RoomsService {
  private readonly rooms: Room[] = [
    {
      id: 1, number: 'ICU-01', type: 'ICU', floor: 2, wing: 'A', capacity: 2, occupied: 2, status: 'Full',
      facilities: { ac: true, oxygen: true, ventilator: true, monitor: true },
      icuLevel: 'Level 3', ventilators: 2, monitors: 2,
      beds: [
        { 
          id: 'ICU-01-A', 
          status: 'Occupied', 
          facilities: { oxygen: true, monitor: true }, 
          patient: 'Jacob R', 
          patientInfo: { 
            name: 'Jacob R', 
            age: 62, 
            gender: 'M', 
            admission: '2025-08-04 10:15', 
            doctor: 'Dr. Singh', 
            diagnosis: 'Acute MI', 
            expectedDischarge: '2025-08-11', 
            guardian: 'Maria R, +1 555 0102' 
          } 
        },
        { 
          id: 'ICU-01-B', 
          status: 'Occupied', 
          facilities: { oxygen: true, monitor: true }, 
          patient: 'Anita S', 
          patientInfo: { 
            name: 'Anita S', 
            age: 48, 
            gender: 'F', 
            admission: '2025-08-06 08:40', 
            doctor: 'Dr. Patel', 
            diagnosis: 'Sepsis', 
            expectedDischarge: 'TBD', 
            guardian: 'S. Sharma, +1 555 0199' 
          } 
        }
      ]
    },
    {
      id: 2, number: 'GW-101', type: 'General Ward', floor: 1, wing: 'B', capacity: 4, occupied: 2, status: 'Available',
      facilities: { ac: false, oxygen: true, ventilator: false, monitor: false },
      beds: [
        { 
          id: 'GW-101-A', 
          status: 'Occupied', 
          facilities: { oxygen: true }, 
          patient: 'Rahul K', 
          patientInfo: { 
            name: 'Rahul K', 
            age: 35, 
            gender: 'M', 
            admission: '2025-08-05 12:00', 
            doctor: 'Dr. Lee', 
            diagnosis: 'Pneumonia', 
            expectedDischarge: '2025-08-09', 
            guardian: 'K. Rao, +1 555 0108' 
          } 
        },
        { 
          id: 'GW-101-B', 
          status: 'Occupied', 
          facilities: { oxygen: true }, 
          patient: 'Priya N', 
          patientInfo: { 
            name: 'Priya N', 
            age: 29, 
            gender: 'F', 
            admission: '2025-08-07 09:30', 
            doctor: 'Dr. Das', 
            diagnosis: 'Dengue', 
            expectedDischarge: '2025-08-10', 
            guardian: 'N. Nair, +1 555 0177' 
          } 
        },
        { id: 'GW-101-C', status: 'Available', facilities: { oxygen: true } },
        { id: 'GW-101-D', status: 'Cleaning', facilities: { oxygen: false } }
      ]
    },
    {
      id: 3, number: 'PR-201', type: 'Private', floor: 2, wing: 'C', capacity: 1, occupied: 0, status: 'Available',
      facilities: { ac: true, oxygen: true, monitor: true },
      beds: [
        { id: 'PR-201-A', status: 'Available', facilities: { oxygen: true, monitor: true } }
      ]
    },
    {
      id: 4, number: 'SP-104', type: 'Semi-Private', floor: 1, wing: 'D', capacity: 2, occupied: 1, status: 'Available',
      facilities: { ac: true },
      beds: [
        { id: 'SP-104-A', status: 'Reserved', facilities: { oxygen: false } },
        { id: 'SP-104-B', status: 'Available', facilities: { oxygen: false } }
      ]
    }
  ];

  constructor() { }

  getRooms(): Room[] {
    return [...this.rooms];
  }

  getRoomById(id: number): Room | undefined {
    return this.rooms.find(room => room.id === id);
  }

  addRoom(roomData: Omit<Room, 'id'>): Room {
    const newId = Math.max(...this.rooms.map(r => r.id)) + 1;
    const newRoom: Room = {
      id: newId,
      ...roomData
    };
    this.rooms.push(newRoom);
    return newRoom;
  }

  updateRoom(id: number, roomData: Partial<Room>): Room | null {
    const roomIndex = this.rooms.findIndex(room => room.id === id);
    if (roomIndex !== -1) {
      this.rooms[roomIndex] = { ...this.rooms[roomIndex], ...roomData };
      return this.rooms[roomIndex];
    }
    return null;
  }

  deleteRoom(id: number): boolean {
    const roomIndex = this.rooms.findIndex(room => room.id === id);
    if (roomIndex !== -1) {
      this.rooms.splice(roomIndex, 1);
      return true;
    }
    return false;
  }
}