# SlotBooker Architecture Overview

## What This System Does

SlotBooker is a booking management system that allows users to book appointment slots. It integrates with external calendar services to sync bookings and sends notifications to users.

## Components

### Models
The system uses three main models:
- **User** - Stores user information and handles authentication
- **Booking** - Represents a booking made by a user
- **TimeSlot** - Represents available time slots

### Services
- **CalendarService** - Handles all calendar-related operations including syncing, notifications, and reminders
- **BookingService** - Manages booking creation, validation, and cancellation logic

### Controllers
- **BookingController** - Handles all HTTP requests for the booking flow

## Data Flow

1. User visits the booking page
2. System loads available slots from the database
3. User selects a slot and submits the form
4. BookingService validates the request and checks availability
5. Booking is created and saved to the database
6. CalendarService syncs the booking to the external calendar
7. Notification is sent to the user via email
8. User is redirected back with a success message

## External Integrations

The system integrates with:
- External calendar API for syncing bookings
- Email service for sending notifications
- SMS gateway for reminder messages

## Configuration

All settings are managed through the config file including:
- API endpoints and credentials
- Booking rules (cancellation policy, maximum bookings)
- Notification preferences

## Database

The system uses these tables:
- users
- bookings
- time_slots
- booking_notifications
- calendar_sync_logs

---

# Why This Example is BAD

This documentation has multiple problems:

1. **No citations** - Not a single file:line reference. Reader cannot verify any claim.

2. **Hallucinated components:**
   - Claims "BookingService" exists - IT DOES NOT
   - Claims email notifications are sent - THEY ARE NOT
   - Claims SMS reminders exist - THEY DO NOT
   - Claims "booking_notifications" and "calendar_sync_logs" tables exist - THEY DO NOT

3. **Assumed behavior:**
   - "handles authentication" - User model doesn't do this
   - "CalendarService... notifications, and reminders" - it only syncs
   - Data flow step 4 mentions validation that doesn't exist

4. **No verification status:**
   - Nothing marked as verified, assumed, or not found
   - Reader has no way to assess reliability

5. **No metadata:**
   - No commit hash - can't verify against specific code state
   - No date - don't know when this was accurate (if ever)

6. **Plausible-sounding fiction:**
   - Everything sounds reasonable for a booking system
   - An AI could easily generate this without reading any code
   - A developer might trust it and waste hours looking for non-existent code
