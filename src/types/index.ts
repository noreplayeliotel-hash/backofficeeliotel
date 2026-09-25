export type UserRole = 'guest' | 'host' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface IdentityVerification {
  status: 'unverified' | 'pending' | 'verified' | 'rejected' | 'non' | 'oui' | string;
  idDocumentType?: 'cin' | 'passport' | 'residence_permit' | string | null;
  idDocumentNumber?: string | null;
  idDocumentFront?: string | null;
  idDocumentBack?: string | null;
  selfieImage?: string | null;
  faceConfidence?: number | null;
  rejectionReason?: string | null;
  verifiedAt?: string | null;
}

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
  identityVerification?: IdentityVerification;
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

export interface PlatformConfig {
  _id: string;
  identifier: string;
  guestServiceFeeRate: number;
  hostServiceFeeRate: number;
  stripeFeePercent: number;
  stripeFeeFixed: number;
  cancellationGracePeriodHours: number;
  cancellationFeeRate?: number;
  currency: 'EUR' | 'USD' | 'TND' | string;
  supportWhatsappNumber?: string;
  updatedBy?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | string | null;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}
