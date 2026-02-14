import { create } from 'zustand';
import { Booking } from '../types';
import { FirestoreService } from '../services/firebase/firestore';
import { useAuthStore } from './useAuthStore';

interface BookingState {
  bookings: Booking[];
  selectedBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
  
  setBookings: (bookings: Booking[]) => void;
  setSelectedBooking: (booking: Booking | null) => void;
  
  fetchUserBookings: () => Promise<void>;
  getUserBookings: () => Booking[]; // Returns current state
  createBooking: (lessonId: string, date: string, time: string, price: number) => Promise<Booking | null>;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => Promise<void>;
  refreshBookings: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [], // Initial state empty
  selectedBooking: null,
  isLoading: false,
  error: null,
  
  setBookings: (bookings) => set({ bookings }),
  
  setSelectedBooking: (booking) => set({ selectedBooking: booking }),
  
  getUserBookings: () => {
    return get().bookings;
  },

  fetchUserBookings: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ bookings: [] });
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      let bookings: Booking[] = [];
      if (user.role === 'instructor') {
        bookings = await FirestoreService.getBookingsByInstructor(user.id);
      } else {
        bookings = await FirestoreService.getBookingsByStudent(user.id);
      }
      set({ bookings, isLoading: false });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      set({ error: 'Failed to fetch bookings', isLoading: false });
    }
  },
  
  createBooking: async (lessonId, date, time, price) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: 'User not authenticated' });
      return null;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      // Fetch lesson details to get instructorId
      const lesson = await FirestoreService.getLessonById(lessonId);
      if (!lesson) throw new Error('Lesson not found');
      
      const bookingData: Partial<Booking> = {
        lessonId,
        studentId: user.id,
        instructorId: lesson.instructorId,
        date,
        time,
        price,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      const bookingId = await FirestoreService.createBooking(bookingData);
      
      const newBooking = { 
        id: bookingId, 
        ...bookingData,
      } as Booking;
      
      set(state => ({
        bookings: [newBooking, ...state.bookings],
        isLoading: false
      }));
      
      return newBooking;
    } catch (error: any) {
      console.error('Error creating booking:', error);
      set({ error: error.message || 'Failed to create booking', isLoading: false });
      return null;
    }
  },
  
  updateBookingStatus: async (bookingId, status) => {
    set({ isLoading: true, error: null });
    try {
      await FirestoreService.updateBookingStatus(bookingId, status);
      set(state => ({
        bookings: state.bookings.map(booking =>
          booking.id === bookingId ? { ...booking, status } : booking
        ),
        isLoading: false
      }));
    } catch (error: any) {
        console.error('Error updating booking status:', error);
        set({ error: error.message || 'Failed to update status', isLoading: false });
    }
  },
  
  refreshBookings: () => {
    get().fetchUserBookings();
  },
}));
