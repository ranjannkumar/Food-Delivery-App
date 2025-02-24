# Food Delivery App

## Overview
This is a **full-stack Food Delivery Application** that allows users to browse menus, add items to their cart, place orders, and make payments. The application consists of three main components:
- **Frontend (User Interface)**: Built using React for a seamless user experience.
- **Backend (Server & Database)**: Powered by Express and MongoDB for handling API requests and managing data.
- **Admin Panel**: Developed for managing orders, menus, and users efficiently.

## Tech Stack
### Backend
- **Node.js & Express**: Handles API requests and server-side logic.
- **MongoDB & Mongoose**: NoSQL database for storing users, orders, and menu items.
- **JWT & bcrypt**: Secure authentication and password hashing.
- **Multer**: Handles file uploads for product images.
- **Stripe**: Integrated for handling secure payments.
- **Validator & Body-parser**: For validating and parsing incoming requests.
- **CORS & dotenv**: Enhances security and manages environment variables.

### User Interface (Frontend)
- **React.js**: Component-based frontend development.
- **React Router DOM**: Enables smooth navigation.
- **Axios**: Handles API requests efficiently.

### Admin Panel
- **React.js**: Enables admin functionalities.
- **React Router DOM**: Implements page navigation.
- **Axios**: Fetches and updates data dynamically.
- **React Toastify**: Displays notifications and alerts.

## Features
### User Features
✅ **Browse menu** - Users can explore various food items.
✅ **Add to cart** - Users can add or remove items from the cart.
✅ **Secure authentication** - Login & Signup using JWT authentication.
✅ **Order placement** - Users can place orders and make payments via Stripe.
✅ **Order tracking** - Users can track their order status in real time.

### Admin Features
✅ **Dashboard** - View sales and user analytics.
✅ **Order management** - Accept or reject orders.
✅ **Menu management** - Add, update, or remove food items.
✅ **User management** - Manage customer details.
✅ **Notifications** - Use React Toastify for real-time updates.

## Installation & Setup

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/ranjannkumar/Food-Delivery-App.git
cd Food-Delivery-App/backend

# Install dependencies
npm install

# Create a .env file and add the required environment variables
# Run the server
npm start
```

### Frontend (User UI) Setup
```bash
cd ../frontend
npm install
npm run dev
```

### Admin Panel Setup
```bash
cd ../admin
npm install
npm run dev
```

## Future Enhancements
🚀 Implementing real-time order tracking using WebSockets.  
🚀 Adding AI-based recommendations for food choices.  
🚀 Improving UI/UX with enhanced animations.



