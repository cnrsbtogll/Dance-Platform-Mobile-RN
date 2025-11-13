import { create } from 'zustand';
import { Booking } from '../types';
import { MockDataService } from '../services/mockDataService';
import { useAuthStore } from './useAuthStore';

interface BookingState {
  bookings: Booking[];
  selectedBooking: Booking | null;
  setBookings: (bookings: Booking[]) => void;
  setSelectedBooking: (booking: Booking | null) => void;
  getUserBookings: () => Booking[];
  createBooking: (lessonId: string, date: string, time: string, price: number) => Booking;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  refreshBookings: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: MockDataService.getBookings(),
  selectedBooking: null,
  
  setBookings: (bookings) => set({ bookings }),
  
  setSelectedBooking: (booking) => set({ selectedBooking: booking }),
  
  getUserBookings: () => {
    const user = useAuthStore.getState().user;
    if (!user) return [];
    return user.role === 'student'
      ? MockDataService.getBookingsByStudent(user.id)
      : MockDataService.getBookingsByInstructor(user.id);
  },
  
  createBooking: (lessonId, date, time, price) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User not authenticated');
    
    const lesson = MockDataService.getLessonById(lessonId);
    if (!lesson) throw new Error('Lesson not found');
    
    const newBooking: Booking = {
      id: `booking_${Date.now()}`,
      lessonId,
      studentId: user.id,
      instructorId: lesson.instructorId,
      date,
      time,
      status: 'pending',
      price,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    set(state => ({
      bookings: [...state.bookings, newBooking],
    }));
    
    return newBooking;
  },
  
  updateBookingStatus: (bookingId, status) => {
    set(state => ({
      bookings: state.bookings.map(booking =>
        booking.id === bookingId ? { ...booking, status } : booking
      ),
    }));
  },
  
  refreshBookings: () => {
    set({ bookings: MockDataService.getBookings() });
  },
}));

