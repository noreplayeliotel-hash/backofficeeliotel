export type UserRole = 'guest' | 'host' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  rib?: string;
  ribImage?: string;
}

export type ListingStatus = 'draft' | 'active' | 'inactive' | 'suspended' | 'pending';

export interface Listing {
  _id: string;
  title: string;
  description: string;
  host: User | string;
  propertyType: string;
  roomType: string;
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
  };
  capacity: {
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
  };
  pricing: {
    basePrice: number;
    currency: 'EUR' | 'TND';
    cleaningFee?: number;
    serviceFee?: number;
  };
  images: {
    _id?: string;
    url: string;
    caption?: string;
    isPrimary: boolean;
  }[];
  amenities?: string[];
  status: ListingStatus;
  pendingEdit?: any;
  ratings: {
    average: number;
    count: number;
  };
  createdAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
export type CancellationPolicy = 'flexible' | 'moderate' | 'strict';
export type CancellationRefundStatus = 'none' | 'pending' | 'processed' | 'completed';

export interface BookingCancellation {
  cancelledBy?: User | string;
  cancelledByRole?: 'host' | 'guest';
  cancelledAt?: string;
  cancellationPolicy?: CancellationPolicy;
  reason?: string;
  refundAmount?: number;
  travelerRefundAmount?: number;
  hostPayoutAmount?: number;
  stripeFeeDeducted?: number;
  rib?: string;
  refundStatus?: CancellationRefundStatus;
  refundProcessedAt?: string | null;
  hostCancellationFee?: number;
  hostCancellationFeeRate?: number;
  datesBlocked?: boolean;
}

export interface Booking {
  _id: string;
  listing: Listing | string;
  guest: User | string;
  host: User | string;
  checkIn: string;
  checkOut: string;
  pricing: {
    total: number;
    currency: string;
  };
  status: BookingStatus;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentMethod?: 'cash' | 'konnect' | 'stripe';
  paymentLink?: string;
  cancellationPolicy?: CancellationPolicy;
  cancellation?: BookingCancellation;
  eliotelPaid?: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}
