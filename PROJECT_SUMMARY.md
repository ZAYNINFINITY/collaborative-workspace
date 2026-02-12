# Collaborative Workspace Platform - Project Summary

## Overview

A real-time collaborative workspace platform built with React, Node.js, Express, and Socket.io. Features GitHub integration, role-based access control, and responsive design.

## Current Status

✅ **Fully Operational** - Both backend and frontend servers are running successfully.

- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- Health Check: http://localhost:5000/api/health

## Recent Fixes Applied

### 1. Frontend React Hook Errors (Fixed)

**Issue**: React Hook "useColorModeValue" called conditionally, violating rules-of-hooks.

**Solution**: Replaced conditional useColorModeValue calls with static light-mode color values:

- `useColorModeValue("gray.50", "gray.900")` → `"gray.50"`
- `useColorModeValue("white", "gray.800")` → `"white"`
- `useColorModeValue("gray.200", "gray.700")` → `"gray.200"`

**Files Modified**:

- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/Repositories.jsx`
- `frontend/src/pages/Workspace.jsx`
- `frontend/src/pages/Workspaces.jsx`

### 2. Backend Database Configuration (Fixed)

**Issue**: Package.json configured for better-sqlite3 instead of duckdb.

**Solution**: Updated backend/package.json:

- Changed dependency from `better-sqlite3` to `duckdb`
- Added `nodemon` as dev dependency
- Added `"dev": "nodemon server.js"` script

### 3. Frontend Build Configuration (Fixed)

**Issue**: SKIP_PREFLIGHT_CHECK environment variable not set correctly on Windows.

**Solution**: Updated frontend/package.json start script:

- Changed from: `"start": "SKIP_PREFLIGHT_CHECK=true react-scripts start"`
- To: `"start": "set SKIP_PREFLIGHT_CHECK=true && react-scripts start"`

## Architecture

### Backend (Node.js/Express)

- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js with GitHub OAuth
- **Real-time**: Socket.io for live collaboration
- **Security**: Helmet, CORS, session management
- **API**: RESTful endpoints for workspaces, tasks, notes, messages

### Frontend (React)

- **UI Framework**: Chakra UI with Tailwind CSS
- **Routing**: React Router
- **State Management**: React hooks
- **Real-time**: Socket.io client
- **API Client**: Axios for HTTP requests

## Key Features Implemented

### ✅ Real-time Collaboration

- Live notes, tasks, and chat in workspaces
- Socket.io integration for instant updates
- User presence indicators

### ✅ GitHub Integration

- OAuth authentication via GitHub
- Repository management and display
- User profile integration

### ✅ Role-based Access Control

- Admin, member, and viewer roles
- Workspace permissions
- Secure API endpoints

### ✅ Responsive Design

- Mobile-first approach
- Chakra UI components
- Tailwind CSS styling

### ✅ Secure Authentication

- Passport.js middleware
- Session management
- Protected routes

## API Endpoints

### Authentication

- `GET /api/auth/github` - GitHub OAuth login
- `GET /api/auth/github/callback` - OAuth callback
- `GET /api/auth/user` - Get current user
- `GET /api/auth/logout` - Logout

### Workspaces

- `GET /api/workspaces` - Get user's workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace details
- `POST /api/workspaces/:id/join` - Join workspace
- `POST /api/workspaces/:id/invite` - Invite user

### Notes

- `GET /api/workspaces/:id/notes` - Get notes
- `POST /api/workspaces/:id/notes` - Create note

### Tasks

- `GET /api/workspaces/:id/tasks` - Get tasks
- `POST /api/workspaces/:id/tasks` - Create task
- `PUT /api/workspaces/:id/tasks/:taskId` - Update task

### Messages

- `GET /api/workspaces/:id/messages` - Get messages
- `POST /api/workspaces/:id/messages` - Send message

## Environment Setup

### Prerequisites

- Node.js v18+
- MongoDB (local or cloud)
- GitHub OAuth App credentials

### Installation

```bash
# Install all dependencies
npm run install-all

# Set up environment variables in backend/.env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/collaborative-workspace
SESSION_SECRET=your-secret-key
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
CLIENT_URL=http://localhost:3000
```

### Running the Application

```bash
# Start both servers
npm start

# Or start individually
npm run backend  # Terminal 1
npm run frontend # Terminal 2
```

## Project Structure

```
collaborative-workspace/
├── backend/                 # Express.js API server
│   ├── controllers/         # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── config/             # Configuration files
│   └── server.js           # Main server file
├── frontend/                # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── api.js          # API client
│   │   └── socket.js       # Socket.io client
│   └── public/             # Static assets
├── package.json             # Root package.json with dev scripts
└── README.md                # Project documentation
```

## Technologies Used

- **Frontend**: React, Chakra UI, React Router, Socket.io Client, Axios
- **Backend**: Node.js, Express, MongoDB, Mongoose, Passport.js, Socket.io
- **Authentication**: GitHub OAuth
- **Styling**: Tailwind CSS, Framer Motion
- **Development**: Nodemon, Concurrently, Wait-on

## Next Steps

1. Set up GitHub OAuth application and configure credentials
2. Configure MongoDB connection
3. Test all features end-to-end
4. Deploy to production environment
5. Add additional features as needed

## Support

For issues or questions, please check the main README.md or create an issue in the repository.
