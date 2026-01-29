# Enterprise SaaS Admin Platform

A complete multi-tenant SaaS Admin Platform built with Next.js, MongoDB, and role-based access control.

## 🏗️ Project Structure

```
/app/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── [[...path]]/         # Central API router
│   │       └── route.js         # All API endpoints
│   ├── page.js                  # Main application (Login + Dashboard)
│   ├── layout.js                # Root layout
│   └── globals.css              # Global styles
│
├── libs/                         # Core libraries (Nx-style structure)
│   ├── db/                      # Database layer
│   │   ├── mongodb.js           # MongoDB connection
│   │   └── models/              # Database models
│   │       ├── User.js          # User model with CRUD
│   │       ├── AuditLog.js      # Audit logging model
│   │       └── Session.js       # Session management
│   ├── auth/                    # Authentication & Authorization
│   │   ├── jwt.js               # JWT token utilities
│   │   ├── rbac.js              # Role-based access control
│   │   └── middleware.js        # Auth middleware
│   └── shared/                  # Shared utilities
│       └── utils.js             # Common utilities
│
├── components/                   # React components
│   └── ui/                      # shadcn/ui components
│       ├── card.jsx
│       ├── button.jsx
│       ├── input.jsx
│       ├── table.jsx
│       └── badge.jsx
│
├── .env                         # Environment variables
├── package.json                 # Dependencies
├── tailwind.config.js           # Tailwind configuration
└── README.md                    # This file
```

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Three user roles: Admin, Manager, User
- Secure password hashing with bcrypt
- Session management

### 👥 User Management
- Complete CRUD operations
- User listing with pagination
- Role assignment
- Status management (active/inactive)
- Search and filter capabilities

### 📊 Dashboard Analytics
- Real-time user statistics
- Activity tracking
- Role distribution metrics
- Recent activity feed

### 📝 Audit Logging
- Comprehensive activity tracking
- IP address and user agent logging
- Filterable audit logs
- Timestamp tracking for all actions

### 🎨 Beautiful UI
- Modern, responsive design
- Built with Tailwind CSS
- shadcn/ui components
- Dark sidebar navigation
- Mobile-friendly layout

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: JWT (jsonwebtoken)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users (Admin/Manager)
- `GET /api/users` - List all users (with pagination)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Dashboard (Admin/Manager)
- `GET /api/dashboard/stats` - Get dashboard statistics

### Audit Logs (Admin)
- `GET /api/audit-logs` - Get audit logs (with filters)

## 🔐 Role Permissions

### Admin
- Full system access
- User management (CRUD)
- View all audit logs
- Manage roles

### Manager
- Read and write access
- View users
- View dashboard
- Manage team members

### User
- Read-only access
- View own profile

## 🛠️ Environment Variables

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=enterprise_saas_admin
NEXT_PUBLIC_BASE_URL=https://your-domain.com
JWT_SECRET=your-secret-key
CORS_ORIGINS=*
```

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
sudo supervisorctl restart all
```

3. Access the application:
```
http://localhost:3000
```

## 👤 Default Admin Account

To create an admin account, register through the UI or use the API:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "name": "System Admin",
    "role": "admin"
  }'
```

## 🧪 Testing

### Register a new user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "name": "Test User",
    "role": "user"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

### Get current user (requires token):
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🏢 Enterprise Features

- **Multi-tenant ready**: Designed for SaaS applications
- **Scalable architecture**: Modular design with separation of concerns
- **Security first**: JWT authentication, password hashing, audit logging
- **Production ready**: Error handling, logging, CORS configuration
- **API versioning ready**: Structure supports easy versioning
- **Monitoring**: Built-in audit logs for compliance and debugging

## 📁 Nx Monorepo Style Structure

This project follows Nx monorepo conventions:

- `libs/` - Shared libraries and utilities
- `libs/db/` - Database layer (equivalent to Nx libs)
- `libs/auth/` - Authentication layer
- `libs/shared/` - Shared utilities
- `components/` - UI components library

This structure makes it easy to:
- Share code between multiple apps
- Maintain clear boundaries
- Scale to multiple applications
- Migrate to full Nx if needed

## 🚢 Deployment

### Production Checklist
1. Set strong JWT_SECRET in environment
2. Configure MONGO_URL for production database
3. Set CORS_ORIGINS to your domain
4. Enable MongoDB authentication
5. Set up SSL/TLS
6. Configure rate limiting
7. Set up monitoring and logging

## 📈 Scalability

The platform is designed to scale:
- Stateless API design
- JWT for distributed auth
- MongoDB with connection pooling
- Ready for horizontal scaling
- Can be deployed on Kubernetes

## 🤝 Contributing

This is an enterprise SaaS platform template. Feel free to:
- Add more features
- Enhance security
- Improve UI/UX
- Add tests
- Optimize performance

## 📝 License

MIT License - feel free to use for your projects!

## 🎯 Future Enhancements

- [ ] Email verification
- [ ] Password reset flow
- [ ] Two-factor authentication
- [ ] Advanced analytics dashboard
- [ ] Team management
- [ ] Organization/Tenant management
- [ ] API rate limiting
- [ ] Webhook support
- [ ] Export audit logs
- [ ] Advanced filtering and search
- [ ] Real-time notifications
- [ ] File upload support

---

Built with ❤️ using Next.js, MongoDB, and modern web technologies.
