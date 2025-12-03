export interface Event {
  id: string;
  name: string;
  date: string;
  location?: string;
  description?: string;
  created_at: string;
}

export interface Attendee {
  id: string;
  event_id: string;
  name: string;
  phone: string;
  status: 'registered' | 'checked_in' | 'redeemed';
  check_in_time?: string;
  redeem_time?: string;
  created_at: string;
  event?: Event;
}

export type AttendeeStatus = Attendee['status'];