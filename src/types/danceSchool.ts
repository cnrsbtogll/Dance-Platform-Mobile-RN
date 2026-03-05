export interface DanceSchool {
  id: string;
  userId?: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  imageUrl?: string;
  contactPerson?: string;
  instagramHandle?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}
