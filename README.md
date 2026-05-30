# Dr. Sara Galal Dental Clinic – Booking System

A full-stack dental clinic booking system with a public website, online appointment booking, and a secure admin dashboard.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt |
| Security | Helmet, CORS, Rate Limiting, express-mongo-sanitize |

## Features

### Public Website
- Home page with hero, services preview, statistics, and testimonials
- About page with doctor biography, qualifications, mission & vision
- Services page with cards (image, description, price, duration)
- Gallery with before/after and clinic photos
- Contact page with form, map, and working hours
- Multi-step appointment booking with validation and double-booking prevention

### Admin Dashboard
- JWT-secured login
- Dashboard statistics and charts (Chart.js)
- Appointment management (search, filter, confirm, cancel, complete, delete)
- Patient management (view, search, edit, delete)
- Service CRUD with image upload

## Project Structure

```
dentist-booking-system/
├── frontend/          # Static HTML/CSS/JS website
├── backend/           # Express REST API
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) running locally or MongoDB Atlas

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your MongoDB URI and JWT secret:

```env
MONGODB_URI=mongodb://localhost:27017/dr-sara-galal-dental
JWT_SECRET=your_super_secret_jwt_key_change_in_production
```

Seed the database (services + default admin):

```bash
npm run seed
```

Start the API server:

```bash
npm run dev
```

The API runs at **http://localhost:5000**

### 2. Frontend Setup

Serve the `frontend` folder with any static file server. Examples:

**VS Code Live Server** – open any HTML file and click "Go Live" (default port 5500)

**npx serve:**
```bash
cd frontend
npx serve .
```

Open **http://localhost:5500** (or your server's port) in the browser.

> Update `API_BASE_URL` in `frontend/js/config.js` if your backend runs on a different port.

### 3. Default Admin Credentials

After running `npm run seed`:

| Field | Value |
|-------|-------|
| Email | admin@drsaragalal.com |
| Password | Admin@123456 |

**Change these immediately in production.**

## API Endpoints

### Authentication
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register-admin` | Public |
| GET | `/api/auth/me` | Admin |

### Appointments
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/appointments/slots/available?date=YYYY-MM-DD` | Public |
| POST | `/api/appointments` | Public |
| GET | `/api/appointments` | Admin |
| GET | `/api/appointments/stats` | Admin |
| GET | `/api/appointments/:id` | Admin |
| PUT | `/api/appointments/:id` | Admin |
| DELETE | `/api/appointments/:id` | Admin |

### Patients
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/patients` | Admin |
| GET | `/api/patients/:id` | Admin |
| PUT | `/api/patients/:id` | Admin |
| DELETE | `/api/patients/:id` | Admin |

### Services
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/services` | Public |
| POST | `/api/services` | Admin |
| PUT | `/api/services/:id` | Admin |
| DELETE | `/api/services/:id` | Admin |

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens for admin authentication
- Helmet security headers
- Rate limiting (200 req/15min general, 20 req/15min auth)
- MongoDB injection protection via express-mongo-sanitize
- Input validation and sanitization
- Environment variables for secrets

## License

MIT – Built for Dr. Sara Galal Dental Clinic.
