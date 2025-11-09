# E-BloodBank

A comprehensive Blood Bank Management System built with Django REST Framework (Backend) and React (Frontend).

## Features

- **User Management**: Support for Donors, Blood Banks, and Admins
- **Blood Inventory Management**: Track blood stock levels by blood group
- **Donation Management**: Record and track blood donations
- **Blood Request System**: Request blood with urgency levels
- **Donation Camps**: Organize and manage blood donation camps
- **Appointments**: Schedule appointments for blood donation
- **Real-time Geolocation**: Auto-fill addresses using GPS location
- **JWT Authentication**: Secure token-based authentication with auto-refresh

## Tech Stack

### Backend
- Django 4.2
- Django REST Framework
- PostgreSQL
- JWT Authentication (Simple JWT)
- Django Filter

### Frontend
- React 18
- Vite
- Ant Design
- React Router
- Axios
- Tailwind CSS

## Project Structure

```
E_BloodBank/
├── backend/          # Django REST API
│   ├── accounts/     # User management
│   ├── bloodbank/    # Blood bank management
│   ├── donors/       # Donor and donation management
│   ├── inventory/    # Blood inventory
│   └── requests/      # Blood requests
├── frontend/         # React application
│   └── src/
│       ├── api/      # API client
│       ├── components/
│       ├── pages/
│       └── utils/
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
```

3. Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Create superuser:
```bash
python manage.py createsuperuser
```

7. Run development server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional):
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

4. Run development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/token/by-username-or-email/` - Login
- `POST /api/auth/refresh/` - Refresh token
- `POST /api/accounts/signup/` - Signup
- `GET /api/accounts/me/` - Get current user

### Blood Banks
- `GET /api/bloodbank/bloodbanks/` - List blood banks
- `GET /api/bloodbank/bloodbanks/my_inventory/` - Get my inventory
- `POST /api/bloodbank/camps/` - Create donation camp

### Donors
- `GET /api/donors/donors/` - List donors
- `POST /api/donors/donations/` - Create donation
- `POST /api/donors/appointments/` - Create appointment

### Inventory
- `GET /api/inventory/inventory/` - List inventory
- `POST /api/inventory/inventory/` - Create inventory entry

### Requests
- `GET /api/requests/requests/` - List blood requests
- `POST /api/requests/requests/` - Create blood request

## Environment Variables

### Backend
Create a `.env` file in the backend directory:
```
DATABASE_NAME=ebloodbank_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_PORT=5432
SECRET_KEY=your_secret_key
DEBUG=True
```

### Frontend
Create a `.env` file in the frontend directory:
```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Authors

- Daksh Verma

## Acknowledgments

- Inspired by the official e-BloodBank system (https://ebloodbank.gov.in)

