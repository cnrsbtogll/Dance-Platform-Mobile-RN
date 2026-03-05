export interface CourseAnnouncement {
  id: string;
  courseId: string;
  senderId: string; // The instructor or school admin who sent it
  senderName: string;
  message: string;
  createdAt: string;
  reactions: {
    like: number;
    heart: number;
  };
  userReactions?: Record<string, string>; // userUID -> 'like' or 'heart' to track who reacted with what
}
