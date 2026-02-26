# Smart Cafeteria Management System

A comprehensive digital solution for managing cafeteria operations, designed to streamline the food ordering process, reduce wait times, and improve the overall dining experience for students and staff.

## Overview

The Smart Cafeteria Management System is a full-stack application that enables students to pre-book meals, view real-time queue status, and manage their orders efficiently. The system provides role-based access for students, staff, and administrators, each with tailored functionalities to support smooth cafeteria operations.

Students can browse the menu, place orders, and receive token numbers for pickup. Staff members can manage order fulfillment and update order statuses in real-time. Administrators have complete oversight of the system, including menu management, user administration, and analytics dashboards to track cafeteria performance.

## Key Features

- **User Authentication**: Secure registration and login system with JWT-based authentication
- **Role-Based Access Control**: Separate interfaces and permissions for students, staff, and administrators
- **Menu Management**: Dynamic menu system with item availability and pricing
- **Booking System**: Pre-order meals with token-based queue management
- **Real-Time Updates**: Live status tracking for orders and queue positions
- **Admin Dashboard**: Comprehensive analytics including active tokens, served orders, revenue tracking, and user statistics
- **Staff Interface**: Efficient order management and fulfillment workflow
- **Profile Management**: User profile viewing and management capabilities

## Tech Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Password Security**: bcryptjs for password hashing
- **Validation**: express-validator
- **Environment Management**: dotenv
- **CORS**: Cross-Origin Resource Sharing enabled
- **Development Tools**: Nodemon for hot reloading

### Frontend

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Native Stack & Bottom Tabs)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **UI Components**: Custom components with React Native
- **Charts**: react-native-chart-kit for data visualization
- **Secure Storage**: expo-secure-store for token management
- **Platform Support**: iOS, Android, and Web

## Project Structure

```
smart-cafetria-model-2/
│
├── backend/
│   ├── config/
│   │   └── db.js                    # Database connection configuration
│   │
│   ├── controllers/
│   │   ├── adminController.js       # Admin operations logic
│   │   ├── authController.js        # Authentication logic
│   │   ├── bookingController.js     # Booking management logic
│   │   ├── menuController.js        # Menu operations logic
│   │   └── staffController.js       # Staff operations logic
│   │
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication middleware
│   │   └── roleCheck.js             # Role-based authorization middleware
│   │
│   ├── models/
│   │   ├── Booking.js               # Booking schema
│   │   ├── Menu.js                  # Menu schema
│   │   ├── MenuItem.js              # Menu item schema
│   │   ├── Slot.js                  # Time slot schema
│   │   └── User.js                  # User schema
│   │
│   ├── routes/
│   │   ├── admin.js                 # Admin routes
│   │   ├── auth.js                  # Authentication routes
│   │   ├── booking.js               # Booking routes
│   │   ├── menu.js                  # Menu routes
│   │   └── staff.js                 # Staff routes
│   │
│   ├── scripts/
│   │   └── seedAdmin.js             # Database seeding script
│   │
│   ├── utils/
│   │   └── validators.js            # Input validation utilities
│   │
│   ├── .env                         # Environment variables
│   ├── .gitignore                   # Git ignore rules
│   ├── package.json                 # Backend dependencies
│   └── server.js                    # Application entry point
│
├── frontend/
│   ├── assets/                      # Images and static assets
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── BookingCard.js       # Booking display component
│   │   │   ├── LoadingSpinner.js    # Loading indicator
│   │   │   ├── MenuItemCard.js      # Menu item display
│   │   │   ├── OrderCard.js         # Order display component
│   │   │   └── StatCard.js          # Statistics card component
│   │   │
│   │   ├── config/
│   │   │   └── api.js               # API configuration
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.js       # Authentication context
│   │   │
│   │   ├── navigation/
│   │   │   └── AppNavigator.js      # Navigation configuration
│   │   │
│   │   ├── screens/
│   │   │   ├── admin/
│   │   │   │   ├── AdminHomeScreen.js
│   │   │   │   ├── ManageMenuScreen.js
│   │   │   │   └── ManageUsersScreen.js
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.js
│   │   │   │   └── RegisterScreen.js
│   │   │   │
│   │   │   ├── staff/
│   │   │   │   ├── OrderManagementScreen.js
│   │   │   │   └── StaffHomeScreen.js
│   │   │   │
│   │   │   └── student/
│   │   │       ├── BookingScreen.js
│   │   │       ├── ProfileScreen.js
│   │   │       ├── StudentHomeScreen.js
│   │   │       └── ViewMenuScreen.js
│   │   │
│   │   ├── services/
│   │   │   └── api.js               # API service layer
│   │   │
│   │   ├── styles/
│   │   │   ├── colors.js            # Color palette
│   │   │   ├── commonStyles.js      # Shared styles
│   │   │   └── typography.js        # Typography definitions
│   │   │
│   │   └── utils/
│   │       ├── storage.js           # Secure storage utilities
│   │       └── validators.js        # Form validation
│   │
│   ├── .env                         # Frontend environment variables
│   ├── .gitignore                   # Git ignore rules
│   ├── App.js                       # Application root component
│   ├── app.json                     # Expo configuration
│   ├── index.js                     # Entry point
│   └── package.json                 # Frontend dependencies
│
├── QUICKSTART.md                    # Quick start guide
└── README.md                        # This file
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- Expo CLI (for frontend development)
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

4. Seed the admin user (optional):
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the API endpoint in `src/config/api.js` to point to your backend server

4. Start the Expo development server:
   ```bash
   npm start
   ```

5. Run on your preferred platform:
   - Press `a` for Android
   - Press `i` for iOS
   - Press `w` for Web

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Cancel booking

### Menu
- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Add menu item (Admin only)
- `PUT /api/menu/:id` - Update menu item (Admin only)
- `DELETE /api/menu/:id` - Delete menu item (Admin only)

### Staff
- `GET /api/staff/orders` - Get pending orders
- `PUT /api/staff/orders/:id` - Update order status

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user details

## User Roles

### Student
- Browse menu items
- Place food orders
- View booking history
- Track order status
- Manage profile

### Staff
- View pending orders
- Update order status (preparing, ready, completed)
- Manage order queue
- View order details

### Administrator
- Full system access
- Manage menu items (add, edit, delete)
- View analytics and statistics
- Manage users
- Monitor system performance
- Track revenue and bookings

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the ISC License.

## Contact

For questions or support, please open an issue in the repository.
