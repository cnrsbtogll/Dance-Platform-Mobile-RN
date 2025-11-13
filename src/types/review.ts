export interface Review {
  id: string;
  lessonId: string;
  studentId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

