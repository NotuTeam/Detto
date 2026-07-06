export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface UserSession {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  relationshipId?: string | null;
}

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEventDot[];
}

export interface CalendarEventDot {
  id: string;
  category: string;
  status: string;
}

export interface PartnerInfo {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}
