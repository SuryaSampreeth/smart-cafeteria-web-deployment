# Quick Start Guide - Smart Cafeteria Management System

## 🚀 Get Started in 5 Minutes

### Step 1: Start MongoDB
Make sure MongoDB is running on your system.

**Windows:**
```bash
# If MongoDB is installed as a service, it should already be running
# Otherwise, start it manually
mongod
```

### Step 2: Start Backend

Open a terminal and run:

```bash
cd c:\smart-cafetria-model-2\backend

# Seed the database (creates admin, slots, menu items)
npm run seed

# Start the server
npm run dev
```

✅ You should see:
```
🚀 Server running on port 5000
MongoDB Connected: localhost
```

### Step 3: Start Frontend

Open a **NEW** terminal and run:

```bash
cd c:\smart-cafetria-model-2\frontend

# For web (recommended for first test)
npx expo start --web
```

✅ Browser should open automatically at `http://localhost:8081`

### Step 4: Test the Application

#### Test Admin Login:
1. Click on the login screen
2. Email: `chsairithivik@gmail.com`
3. Password: `abcdefgh`
4. Click "Login"
5. ✅ You should see the Admin Dashboard

#### Test Student Registration:
1. Logout (click Logout button in header)
2. Click "Register" link
3. Fill in the form:
   - Name: Your Name
   - Email: student@example.com
   - Registration Number: REG001
   - Password: password123
   - Confirm Password: password123
4. Click "Register"
5. ✅ You should auto-login and see Student Dashboard

---

## 📱 Test on Mobile

### Option 1: Using Expo Go App (Easiest)

1. Install "Expo Go" app on your phone (iOS/Android)

2. Get your computer's local IP address:
   - Windows: Run `ipconfig` and look for "IPv4 Address"
   - Example: 192.168.1.100

3. Update frontend/.env:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
   ```

4. Start frontend:
   ```bash
   cd c:\smart-cafetria-model-2\frontend
   npx expo start
   ```

5. Scan the QR code with:
   - iOS: Camera app
   - Android: Expo Go app

### Option 2: Using Android Emulator

```bash
cd c:\smart-cafetria-model-2\frontend
npx expo start --android
```

---

## 🧪 Test API Endpoints

You can test the backend API directly using tools like Postman or Thunder Client.

### Get All Slots
```http
GET http://localhost:5000/api/menu/slots
```

### Get Menu Items
```http
GET http://localhost:5000/api/menu/items
```

### Login
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "chsairithivik@gmail.com",
  "password": "abcdefgh"
}
```

---

## 🎨 What's Implemented

### ✅ Backend (100% Complete)
- Full REST API with all endpoints
- Authentication & Authorization
- Queue management logic
- Token generation
- Database models
- Seeding script

### ✅ Frontend (Foundation Complete)
- Authentication (Login/Register)
- Role-based navigation
- Design system (Cream & Brownie theme)
- Common components
- API integration
- Secure token storage

### 🚧 Frontend (To Be Implemented)
- Student booking flow
- My Tokens screen
- Profile with booking management
- Staff queue management
- Admin analytics dashboard
- Admin staff management
- Admin menu management

---

## 🔧 Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Check if port 5000 is available
- Run `npm install` in backend folder

### Frontend won't start
- Run `npm install` in frontend folder
- Clear cache: `npx expo start -c`
- Check Node.js version (should be 14+)

### Can't login
- Make sure backend is running
- Check browser console for errors
- Verify API_URL in frontend/.env

### Mobile app can't connect
- Use local IP instead of localhost
- Ensure phone and computer are on same WiFi
- Check firewall settings

---

## 📚 Next Steps

1. **Implement Student Booking Flow**
   - Slot selection screen
   - Menu selection with quantities
   - Booking confirmation

2. **Implement My Tokens Screen**
   - Display active tokens
   - Show queue position
   - Real-time status updates

3. **Implement Staff Queue Management**
   - View tokens by slot
   - Call next token
   - Mark as served

4. **Implement Admin Features**
   - Analytics dashboard with charts
   - Staff registration
   - Menu management

---

## 📞 Support

If you encounter any issues:
1. Check the walkthrough.md for detailed documentation
2. Check the README.md for setup instructions
3. Review the implementation_plan.md for architecture details

---

## 🎉 Success Criteria

You'll know everything is working when:
- ✅ Backend server starts without errors
- ✅ Frontend opens in browser
- ✅ You can login as admin
- ✅ You can register as student
- ✅ Navigation changes based on user role
- ✅ Logout works correctly

Happy coding! 🚀
