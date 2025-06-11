# Calendar Availability Web App

A web application for managing calendar availability with user and admin views.

## Features

- User view for checking available time slots
- Admin view for managing slot availability
- Responsive grid layout
- Week navigation (Next/Previous)
- Authentication for admin access

## Tech Stack

- Frontend: React.js
- Backend: Node.js, Express.js
- Database: MongoDB

## Project Structure

```
calendar-app/
├── client/             # React frontend
├── server/             # Node.js backend
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. Create a .env file in the server directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. Start the development servers:
   ```bash
   # Start backend server (from server directory)
   npm run dev

   # Start frontend server (from client directory)
   npm start
   ```

## Default Admin Credentials

- Username: jackjack
- Password: Idontknow0!

## License

MIT 