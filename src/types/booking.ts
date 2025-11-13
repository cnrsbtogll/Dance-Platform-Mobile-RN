export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Booking {
  id: string;
  lessonId: string;
  studentId: string;
  instructorId: string;
  date: string; // ISO date
  time: string; // HH:mm
  status: BookingStatus;
  price: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt?: string;
}

