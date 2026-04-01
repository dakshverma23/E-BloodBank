# E-BloodBank API Endpoints Documentation

## Base URL
- Local: `http://127.0.0.1:8000`
- Production: `https://your-domain.com`

## General Endpoints

### Health Check
- **GET** `/health/` - Health check endpoint
- **GET** `/` - Root endpoint with API info

### Admin
- **GET** `/admin/` - Django admin interface

---

## Authentication Endpoints

### Token Management
- **POST** `/api/auth/token/` - Standard JWT token obtain (username + password)
- **POST** `/api/auth/token/by-username-or-email/` - JWT token obtain (username OR email + password)
- **POST** `/api/auth/refresh/` - Refresh access token

### Account Management
- **POST** `/api/accounts/signup/` - User registration
  - Body: `username`, `email`, `phone`, `password`, `user_type` (`donor`, `bloodbank`, `admin`)
  - For donors: `full_name`, `blood_group`, `date_of_birth`, `gender`, `address`, `city`, `state`, `pincode`, `weight`, `emergency_contact`
  - For bloodbanks: `name`, `registration_number`, `address`, `city`, `state`, `pincode`
- **GET** `/api/accounts/me/` - Get current user profile (authenticated)
- **POST** `/api/accounts/search-by-email/` - Search user by email
  - Body: `{"email": "user@example.com"}`

### OTP Endpoints (Optional)
- **POST** `/api/accounts/otp/send/` - Send OTP to email/phone
- **POST** `/api/accounts/otp/verify/` - Verify OTP code

### User Management (Admin/Staff)
- **GET** `/api/accounts/users/` - List all users
- **GET** `/api/accounts/users/{id}/` - Get user details
- **PUT** `/api/accounts/users/{id}/` - Update user
- **DELETE** `/api/accounts/users/{id}/` - Delete user

### Profile Management
- **GET** `/api/accounts/profiles/` - List all profiles
- **GET** `/api/accounts/profiles/{id}/` - Get profile details
- **PUT** `/api/accounts/profiles/{id}/` - Update profile

---

## Blood Bank Endpoints

### Blood Banks
- **GET** `/api/bloodbank/bloodbanks/` - List all blood banks
  - Query params: `?city=`, `?state=`, `?status=`, `?is_operational=`, `?search=`, `?ordering=`
- **GET** `/api/bloodbank/bloodbanks/{id}/` - Get blood bank details
- **POST** `/api/bloodbank/bloodbanks/` - Create blood bank (authenticated, bloodbank user)
- **PUT** `/api/bloodbank/bloodbanks/{id}/` - Update blood bank
- **DELETE** `/api/bloodbank/bloodbanks/{id}/` - Delete blood bank
- **GET** `/api/bloodbank/bloodbanks/my_inventory/` - Get my blood bank's inventory (authenticated, bloodbank user)

### Donation Camps
- **GET** `/api/bloodbank/camps/` - List all donation camps
  - Query params: `?mine=true` (for bloodbank users to see their camps), `?city=`, `?search=`, `?ordering=`
- **GET** `/api/bloodbank/camps/{id}/` - Get camp details
- **POST** `/api/bloodbank/camps/` - Create donation camp (authenticated, bloodbank user)
- **PUT** `/api/bloodbank/camps/{id}/` - Update camp
- **DELETE** `/api/bloodbank/camps/{id}/` - Delete camp

### Camp Registrations
- **GET** `/api/bloodbank/camp-registrations/` - List camp registrations
  - Query params: `?camp=`, `?status=`, `?blood_group=`, `?search=`, `?ordering=`
  - Bloodbank users see their camp registrations
  - Donor users see their own registrations
- **GET** `/api/bloodbank/camp-registrations/{id}/` - Get registration details
- **POST** `/api/bloodbank/camp-registrations/` - Register for a camp (authenticated)
- **PUT** `/api/bloodbank/camp-registrations/{id}/` - Update registration
- **DELETE** `/api/bloodbank/camp-registrations/{id}/` - Cancel registration

---

## Donor Endpoints

### Donors
- **GET** `/api/donors/donors/` - List all donors
  - Query params: `?blood_group=`, `?city=`, `?state=`, `?is_eligible=`, `?user=`, `?search=`, `?ordering=`
- **GET** `/api/donors/donors/{id}/` - Get donor details
- **POST** `/api/donors/donors/` - Create donor profile
- **PUT** `/api/donors/donors/{id}/` - Update donor
- **DELETE** `/api/donors/donors/{id}/` - Delete donor

### Donations
- **GET** `/api/donors/donations/` - List donations
  - Query params: `?donor=`, `?bloodbank=`, `?donation_date=`, `?search=`, `?ordering=`
  - Bloodbank users see donations at their bank
  - Donor users see only their own donations
- **GET** `/api/donors/donations/{id}/` - Get donation details
- **POST** `/api/donors/donations/` - Create donation record (authenticated, bloodbank user only)
  - Body: `donor` (ID), OR `user_id`, OR `email`, `blood_group`, `units_donated`, `donation_date`, `verified_by`
  - Auto-updates inventory
- **PUT** `/api/donors/donations/{id}/` - Update donation
- **DELETE** `/api/donors/donations/{id}/` - Delete donation

### Appointments
- **GET** `/api/donors/appointments/` - List appointments
  - Donor users see their appointments
  - Bloodbank users see appointments to their bank
- **GET** `/api/donors/appointments/{id}/` - Get appointment details
- **POST** `/api/donors/appointments/` - Create appointment (authenticated, donor user)
  - Body: `bloodbank` (ID), `appointment_date`, `reason`
- **PUT** `/api/donors/appointments/{id}/` - Update appointment
  - Bloodbanks can update status only
- **DELETE** `/api/donors/appointments/{id}/` - Delete appointment
- **POST** `/api/donors/appointments/{id}/approve/` - Approve appointment (bloodbank only)
- **POST** `/api/donors/appointments/{id}/reject/` - Reject appointment (bloodbank only)
- **POST** `/api/donors/appointments/{id}/complete/` - Mark appointment as completed (bloodbank only)

---

## Inventory Endpoints

### Inventory
- **GET** `/api/inventory/inventory/` - List inventory
  - Query params: `?bloodbank=`, `?blood_group=`, `?search=`, `?ordering=`
  - Bloodbank users see only their inventory
- **GET** `/api/inventory/inventory/{id}/` - Get inventory details
- **POST** `/api/inventory/inventory/` - Create/Update inventory entry (authenticated, bloodbank user)
  - Body: `blood_group`, `units_available`, `min_stock_level`
  - If entry exists for blood_group, updates it instead of creating new
- **PUT** `/api/inventory/inventory/{id}/` - Update inventory
- **DELETE** `/api/inventory/inventory/{id}/` - Delete inventory entry

---

## Blood Request Endpoints

### Blood Requests
- **GET** `/api/requests/requests/` - List blood requests
  - Query params: `?bloodbank=`, `?blood_group=`, `?urgency=`, `?status=`, `?search=`, `?ordering=`
  - Donor users see their own requests
  - Bloodbank users see all requests
- **GET** `/api/requests/requests/{id}/` - Get request details
- **POST** `/api/requests/requests/` - Create blood request (authenticated, donor user only)
  - Body: `bloodbank` (ID), `blood_group`, `units_required`, `urgency`, `patient_name`, `hospital_name`, `doctor_name`, `reason`, `required_date`
- **PUT** `/api/requests/requests/{id}/` - Update request
  - Bloodbanks can update status only
- **DELETE** `/api/requests/requests/{id}/` - Delete request
- **POST** `/api/requests/requests/{id}/approve/` - Approve request (bloodbank only)
- **POST** `/api/requests/requests/{id}/reject/` - Reject request (bloodbank only)

---

## Authentication

All endpoints (except signup, login, health, and public endpoints) require JWT authentication:
```
Authorization: Bearer {access_token}
```

### Getting Access Token
1. Register: `POST /api/accounts/signup/`
2. Login: `POST /api/auth/token/by-username-or-email/` with `username` or `email` and `password`
3. Use `access` token in Authorization header
4. Refresh when expired: `POST /api/auth/refresh/` with `refresh` token

---

## Common Query Parameters

- `search` - Search across searchable fields
- `ordering` - Order by fields (e.g., `?ordering=-created_at` for descending)
- `page` - Page number for pagination
- `page_size` - Items per page

## Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
