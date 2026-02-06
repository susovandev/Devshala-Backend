# Devshala Backend

A production-grade, multi-role blog platform backend built with **Express.js**, **TypeScript**, **MongoDB**, and **Socket.IO**. Devshala is a comprehensive content management system that supports multiple user roles with advanced features like AI-powered blog analysis, real-time notifications, and sophisticated approval workflows.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Environment Configuration](#-environment-configuration)
- [Database Schema](#-database-schema)
- [API Architecture](#-api-architecture)
- [User Roles & Permissions](#-user-roles--permissions)
- [Key Features](#-key-features)
- [Middleware & Security](#-middleware--security)
- [Background Jobs & Queues](#-background-jobs--queues)
- [Real-time Features](#-real-time-features)
- [AI Integration](#-ai-integration)
- [Development](#-development)
- [Production Deployment](#-production-deployment)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 👥 Multi-Role User System

- **5 User Roles**: CLIENT (guest), USER (regular user), AUTHOR (content creator), PUBLISHER (content moderator), ADMIN (system administrator)
- Role-based access control (RBAC) with route guards
- Granular permission management for each role
- User status management (ACTIVE, BLOCKED, DISABLED, PENDING)

### 📝 Blog Management System

- Complete CRUD operations for blog posts
- Dual-approval workflow (Publisher & Admin approval)
- Blog status tracking (PENDING, APPROVED, REJECTED)
- Blog metadata: tags, categories, cover images
- SEO-friendly slug generation
- View count tracking and statistics

### 💬 Community Engagement

- Like/Unlike blog posts
- Add and manage bookmarks
- Comment system with nested replies
- Real-time comment notifications
- Author request system (USER → AUTHOR upgrade)
- Subscriber management

### 🤖 AI-Powered Features

- **Blog Summarization**: Generate AI summaries using Groq SDK
- **Blog Review**: AI-powered content review and suggestions
- Intelligent content analysis for quality improvement

### 🔔 Real-time Notifications

- Socket.IO integration for live updates
- Real-time notification delivery
- Event-driven architecture
- Notification dashboard for all user roles

### 👤 User Authentication & Authorization

- JWT-based authentication (Access & Refresh tokens)
- Email verification system
- Password reset with secure tokens
- Session management with Redis
- Bcrypt password hashing
- Forgot password recovery flow

### 🎯 Admin Dashboard

- Comprehensive user management
- Blog moderation and approval interface
- Category management
- Comment moderation
- Publisher management
- Notification management
- Dashboard analytics

### 📊 Analytics & Insights

- Author leaderboard ranking
- Blog view tracking
- User engagement metrics
- Content performance statistics

### 📧 Email System

- Email queue with job retry logic
- Verification emails
- Password reset emails
- Welcome emails
- Scheduled email delivery

### 🔐 Security Features

- Helmet.js for HTTP security headers
- Rate limiting on sensitive endpoints
- CSRF protection via method-override
- XSS prevention with Content Security Policy
- Session security with secure cookies
- SQL/NoSQL injection prevention via Zod validation
- Environment-based security configuration

## 🛠 Tech Stack

### Backend Framework

- **Express.js** (5.2.1) - Web framework
- **TypeScript** (5.9.3) - Type-safe JavaScript
- **Node.js** - Runtime environment

### Database & Caching

- **MongoDB** - Document database with Mongoose ODM
- **Redis** - In-memory caching & session store
- **Redis Adapter** - For distributing Socket.IO messages

### Authentication & Security

- **jsonwebtoken** (^9.0.3) - JWT token generation and verification
- **bcryptjs** (^3.0.3) - Password hashing
- **helmet** (^8.1.0) - HTTP security headers
- **express-rate-limit** (^8.2.1) - Rate limiting
- **rate-limit-redis** (^4.3.1) - Redis-backed rate limiting

### Real-time Communication

- **Socket.IO** (^4.8.3) - WebSocket communication
- **Socket.IO Client** (^4.8.3) - Client library

### Queue & Background Jobs

- **BullMQ** (^5.67.2) - Job queue management
- **ioredis** (^5.9.2) - Redis client

### File Upload & Storage

- **Cloudinary** (^2.9.0) - Image storage and CDN
- **multer** (^2.0.2) - File upload middleware

### Email Service

- **nodemailer** (^7.0.12) - Email sending
- **Gmail SMTP** - Configured via environment

### AI Integration

- **Groq SDK** (^0.37.0) - LLM API for AI features

### Frontend Rendering

- **EJS** (^4.0.1) - Templating engine
- **express-session** (^1.19.0) - Session management
- **connect-redis** (^9.0.0) - Redis session store
- **connect-flash** (^0.1.1) - Flash messages

### Data Validation & Serialization

- **zod** (^4.3.5) - Schema validation and TypeScript inference
- **mongoose-paginate-v2** (^1.9.1) - Pagination plugin
- **mongoose-aggregate-paginate-v2** (^1.1.4) - Aggregation pagination

### Logging & Monitoring

- **winston** (^3.19.0) - Structured logging
- **morgan** (^1.10.1) - HTTP request logging

### Development Tools

- **tsx** (^4.21.0) - TypeScript execution
- **tsc-alias** (^1.8.16) - Path alias resolution
- **prettier** (^3.8.1) - Code formatting
- **cross-env** (^10.1.0) - Cross-platform environment variables
- **supertest** (^7.2.2) - HTTP testing
- **mongodb-memory-server** (^11.0.1) - Testing database

## 📁 Project Structure

```
devshala-backend/
├── src/
│   ├── app.ts                    # Express app initialization
│   ├── main.ts                   # Application entry point
│   ├── routes.ts                 # Route configuration
│   │
│   ├── config/                   # Configuration modules
│   │   ├── database.ts           # MongoDB connection
│   │   ├── env.ts                # Environment validation (Zod)
│   │   ├── groq.ts               # Groq AI SDK setup
│   │   ├── logger.ts             # Winston logger configuration
│   │   ├── morgan.ts             # HTTP request logging
│   │   ├── multer.ts             # File upload configuration
│   │   ├── nodemailer.ts         # Email service setup
│   │   ├── queueRedis.ts         # Queue Redis connection
│   │   ├── redis.ts              # Session Redis connection
│   │   └── loadEnv.ts            # Environment loader
│   │
│   ├── features/                 # Feature modules by role
│   │   ├── client/               # Guest/unauthenticated views
│   │   │   ├── client.routes.ts
│   │   │   └── client.controller.ts
│   │   ├── user/                 # Regular user features
│   │   │   └── user.routes.ts
│   │   ├── author/               # Author-specific features
│   │   │   ├── author.routes.ts
│   │   │   ├── auth/
│   │   │   ├── blogs/
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── notifications/
│   │   │   └── leaderboard/
│   │   ├── publisher/            # Publisher/moderator features
│   │   │   └── publisher.routes.ts
│   │   ├── admin/                # Admin dashboard features
│   │   │   ├── admin.routes.ts
│   │   │   ├── auth/
│   │   │   ├── blog/
│   │   │   ├── categories/
│   │   │   ├── comments/
│   │   │   ├── dashboard/
│   │   │   ├── notifications/
│   │   │   ├── profile/
│   │   │   ├── publishers/
│   │   │   └── user/
│   │   └── notifications/        # Notification system
│   │
│   ├── models/                   # Mongoose schemas & interfaces
│   │   ├── user.model.ts         # User schema (username, email, role, status)
│   │   ├── blog.model.ts         # Blog schema (title, content, approval status)
│   │   ├── category.model.ts     # Blog categories
│   │   ├── comments.model.ts     # Blog comments
│   │   ├── bookmark.model.ts     # User bookmarks
│   │   ├── like.model.ts         # Blog likes
│   │   ├── notification.model.ts # Real-time notifications
│   │   ├── request.model.ts      # User role upgrade requests
│   │   ├── profile.model.ts      # User profile information
│   │   ├── email.model.ts        # Email queue items
│   │   ├── refreshToken.model.ts # JWT refresh tokens
│   │   ├── subscribe.model.ts    # Newsletter subscribers
│   │   ├── login.model.ts        # Login history
│   │   └── verificationCode.model.ts # Email verification tokens
│   │
│   ├── middlewares/              # Express middlewares
│   │   ├── auth.middleware.ts    # JWT authentication guard
│   │   ├── roleGuard.middleware.ts # Role-based access control
│   │   ├── validation.middleware.ts # Zod schema validation
│   │   ├── error.middleware.ts   # Global error handling
│   │   ├── flash.middleware.ts   # Flash message handling
│   │   ├── notfound.middleware.ts # 404 handler
│   │   └── rateLimit/            # Rate limiting strategies
│   │
│   ├── queues/                   # BullMQ Job Queues
│   │   ├── sendEmail.queue.ts    # Email sending jobs
│   │   ├── register.queue.ts     # User registration jobs
│   │   ├── loginTracker.queue.ts # Login tracking jobs
│   │   └── logoutCleanup.queue.ts # Session cleanup jobs
│   │
│   ├── workers/                  # BullMQ Job Workers
│   │   ├── sendEmail.worker.ts
│   │   ├── register.worker.ts
│   │   ├── loginTracker.worker.ts
│   │   └── logoutCleanup.worker.ts
│   │
│   ├── socket/                   # Socket.IO implementation
│   │   ├── index.ts              # Socket initialization
│   │   ├── socket.instance.ts    # Socket instance manager
│   │   ├── constants.ts          # Socket event constants
│   │   └── events/
│   │       └── notification.events.ts # Notification socket events
│   │
│   ├── libs/                     # Utility libraries
│   │   ├── apiResponse.ts        # Standardized API response wrapper
│   │   ├── errors.ts             # Custom error classes
│   │   ├── cloudinary.ts         # Cloudinary upload helper
│   │   ├── redis.ts              # Redis utility functions
│   │   ├── blogSummarizer.ts     # AI blog summarization
│   │   └── blogReviewer.ts       # AI blog review
│   │
│   ├── mail/                     # Email templates
│   │   ├── index.ts              # Email service
│   │   └── templates/            # Email template files
│   │
│   ├── validations/              # Zod validation schemas
│   │   ├── auth.validations.ts   # Login/register schemas
│   │   ├── blog.validations.ts   # Blog schemas
│   │   ├── user.validations.ts   # User schemas
│   │   └── category.validations.ts
│   │
│   ├── constants/
│   │   └── index.ts              # Application constants
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── express.d.ts          # Express request extensions
│   │   ├── express-flash.d.ts    # Flash message types
│   │   └── mongoose-aggregate-paginate.d.ts
│   │
│   └── modules/                  # Business logic modules
│       └── auth/                 # Authentication module
│
├── views/                        # EJS templates
│   ├── partials/                 # Reusable template partials
│   ├── admin/                    # Admin dashboard templates
│   ├── authors/                  # Author portal templates
│   ├── publishers/               # Publisher templates
│   ├── client/                   # Public website templates
│   └── users/                    # User dashboard templates
│
├── public/                       # Static assets
│   ├── images/
│   └── uploads/
│
├── logs/                         # Application logs
│
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Redis (local or cloud)
- Cloudinary account
- Gmail account (for email service)
- Groq API key

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd devshala-backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

```bash
cp .env.example .env
```

### Step 4: Start Services

```bash
# Development mode with watch
npm run dev

# Production build and start
npm run build
npm start
```

## ⚙️ Environment Configuration

Create a `.env` file from `.env.example` with the following variables:

### Server Configuration

```env
NODE_ENV=development
PORT=5555
HOST=127.0.0.1
BASE_URL=http://localhost:5555
SERVICE_NAME=DevshalaBackend
API_VERSION=1.0.0
```

### Client URLs

```env
CLIENT_URL=http://localhost:3000
CLIENT_PRODUCTION_URL=http://localhost:3001
```

### Database

```env
DATABASE_URI=mongodb://localhost:27017
DATABASE_NAME=devshala
```

### Redis Configuration

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional
```

### Authentication Secrets

```env
ACCESS_TOKEN_SECRET_KEY=your-secret-key-here
REFRESH_TOKEN_SECRET_KEY=your-refresh-secret-key
FORGOT_PASSWORD_SECRET_KEY=your-forgot-password-secret
SESSION_SECRET=your-session-secret
```

### Email Configuration (Gmail)

```env
MAIL_SERVICE=gmail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
SUPPORT_EMAIL=support@example.com
```

### Cloudinary (Image Storage)

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### AI Integration (Groq)

```env
GROQ_API_KEY=your-groq-api-key
```

## 📊 Database Schema

### User Document

```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  passwordHash: String,
  role: Enum[user, admin, publisher, author],
  isEmailVerified: Boolean,
  avatarUrl: { publicId, url },
  bio: String,
  socialLinks: { github, linkedin, twitter },
  status: Enum[ACTIVE, BLOCKED, DISABLED, PENDING],
  blockedAt: Date,
  blockedReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Blog Document

```javascript
{
  _id: ObjectId,
  title: String,
  slug: String (unique),
  content: String,
  excerpt: String,
  authorId: ObjectId (ref: User),
  publisherId: ObjectId (ref: User),
  categories: [ObjectId] (ref: Category),
  tags: [String],
  coverImage: { publicId, url },
  status: {
    adminApproved: Boolean,
    adminApprovalStatus: Enum[PENDING, APPROVED, REJECTED],
    adminRejectionReason: String,
    publisherApproved: Boolean,
    publisherApprovalStatus: Enum[PENDING, APPROVED, REJECTED],
    publisherRejectionReason: String
  },
  stats: { views: Number },
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Category Document

```javascript
{
  _id: ObjectId,
  name: String,
  slug: String (unique),
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Other Models

- **Comments**: Blog comments with author reference
- **Like**: Blog likes with user and blog references
- **Bookmark**: User bookmarks
- **Notification**: Real-time notifications
- **Request**: Author upgrade requests
- **RefreshToken**: JWT refresh token storage
- **Email**: Email queue items
- **VerificationCode**: Email verification tokens
- **Subscribe**: Newsletter subscribers
- **Login**: Login history tracking

## 🏗️ API Architecture

### Route Organization

The API is organized by user role with specific feature routes:

#### Client Routes (`/`)

Public routes for unauthenticated users:

- `GET /` - Home page
- `GET /about` - About page
- `GET /blogs/:id` - Blog details
- `POST /blogs/:id/like` - Toggle like (auth required)
- `POST /blogs/:id/bookmark` - Toggle bookmark (auth required)
- `POST /blogs/:id/comments` - Post comment (auth required)
- `POST /blogs/:id/views` - Track views
- `POST /ai/blog-summary/:id` - Generate AI summary
- `GET /authors/request` - Author upgrade form (auth + user role)
- `POST /authors/request` - Submit author request
- `POST /subscribe` - Newsletter subscription
- `GET /support` - Support page

#### User Routes (`/users`)

Regular user features (auth required, user role):

- Profile management
- Blog reading and interactions
- Notification management

#### Author Routes (`/authors`)

Content creator features (auth required, author role):

- `POST /auth/register` - Author registration
- `GET /dashboard` - Author dashboard
- `POST /blogs` - Create blog post
- `GET /blogs` - List my blogs
- `PUT /blogs/:id` - Update blog
- `DELETE /blogs/:id` - Delete blog
- `GET /profile` - View profile
- `PUT /profile` - Update profile
- `GET /notifications` - View notifications
- `GET /leaderboard` - Author rankings

#### Publisher Routes (`/publishers`)

Content moderation features (auth required, publisher role):

- Blog approval/rejection
- Comment moderation
- Notification management

#### Admin Routes (`/admins`)

System administration (auth required, admin role):

- User management and blocking
- Blog moderation
- Category management
- Comment moderation
- Publisher management
- Dashboard analytics
- System settings

### Response Format

All API responses follow a standardized format:

```typescript
{
  status: "success",
  statusCode: 200,
  message: "Operation successful",
  data: {...} // Optional
}
```

## 👥 User Roles & Permissions

### CLIENT (Guest)

- View public blogs
- Browse categories
- Subscribe to newsletter
- Request author role
- No authentication required

### USER (Regular User)

- All CLIENT permissions
- Create author upgrade request
- Like and bookmark blogs
- Comment on blogs
- View notifications
- Manage own profile

### AUTHOR (Content Creator)

- All USER permissions
- Create and edit blog posts
- Delete own blogs
- View author dashboard
- Access author leaderboard
- Submit blogs for publisher approval
- Receive notifications on blog status

### PUBLISHER (Content Moderator)

- All AUTHOR permissions
- Approve/reject author blogs
- Add rejection reasons
- Moderate comments
- View moderation dashboard

### ADMIN (System Administrator)

- All permissions
- User management (block, disable, unblock)
- Blog moderation and deletion
- Category management
- Comment management
- Publisher oversight
- System dashboard and analytics
- Email notifications

## 🔒 Middleware & Security

### Authentication Middleware

- `AttachCurrentUser`: Optionally attach user if authenticated
- `AuthGuardEJS`: Require authentication (EJS views)
- `AuthGuard`: Require authentication (API routes)

### Authorization Middleware

- `RoleGuardEJS`: Enforce role-based access (EJS views)
- `RoleGuard`: Enforce role-based access (API routes)

### Validation Middleware

- `validateRequest`: Zod schema validation for request body, params, query

### Security Measures

- **Helmet.js**: HTTP security headers
  - Content Security Policy (CSP) for XSS prevention
  - Image sources restricted to Cloudinary
  - Style sources restricted with unsafe-inline for dev
- **Rate Limiting**: Express rate limit with Redis backing
- **Session Security**:
  - HTTPOnly cookies (prevents XSS token theft)
  - Secure flag in production (HTTPS only)
  - SameSite=lax for CSRF protection
- **Input Validation**: Zod schemas on all inputs
- **Password Security**: Bcrypt with salt rounds
- **CORS**: Socket.IO configured with origin checking

### Error Handling

Global error middleware catches and formats all errors with:

- Error status code
- Error message
- Development stack trace (dev mode only)

## 🔄 Background Jobs & Queues

The application uses **BullMQ** with Redis for reliable background job processing:

### Send Email Queue

```typescript
// Job Type
interface ISendEmailJob {
  emailId: string;
}

// Configuration
- Retry attempts: 3
- Backoff strategy: Exponential (2s base delay)
- Remove on complete: true
```

**Triggers:**

- User registration (verification email)
- Password reset request
- Email verification
- Password change confirmation

### Register Queue

Handles post-registration tasks:

- Database cleanup
- Welcome email
- Initial profile setup

### Login Tracker Queue

Records login events:

- User login statistics
- Login history tracking
- Suspicious activity detection

### Logout Cleanup Queue

Performs cleanup on logout:

- Session cleanup
- Token invalidation
- Activity logging

### Job Processing

Each queue has a corresponding worker:

- [sendEmail.worker.ts] - Processes email jobs
- [register.worker.ts] - Processes registration jobs
- [loginTracker.worker.ts] - Logs login events
- [logoutCleanup.worker.ts] - Cleanup tasks

Workers run as separate processes and can be scaled horizontally.

## 🔌 Real-time Features

### Socket.IO Integration

Real-time bidirectional communication via WebSocket:

```typescript
// Initialization
const io = new Server(server, {
  cors: { origin: '*', credentials: true },
});

// Event Registration
registerNotificationEvents(socket, io);
```

### Notification Events

- `notification:new` - New notification received
- `notification:read` - Notification marked as read
- `notification:delete` - Notification deleted
- `comment:added` - New comment on blog
- `blog:approved` - Blog approval notification
- `blog:rejected` - Blog rejection notification

### Connection Management

- Automatic reconnection with exponential backoff
- Connection pooling for multiple clients
- Redis adapter for distributed Socket.IO

## 🤖 AI Integration

### Groq SDK Integration

Utilizing Groq's LLM API for content intelligence:

#### Blog Summarization

```typescript
// Generate concise summaries of long-form blog content
POST /ai/blog-summary/:id
- Input: Blog content, optional parameters
- Output: AI-generated summary
- Model: Groq's high-speed LLM
```

#### Blog Review

```typescript
// AI-powered content review and suggestions
POST /ai/blog-review/:id
- Input: Blog content, structure
- Output: Review feedback, improvements, SEO suggestions
```

### Libraries

- `blogSummarizer.ts` - Summary generation utility
- `blogReviewer.ts` - Review generation utility

## 📧 Email Service

### Nodemailer Configuration

Gmail SMTP for reliable email delivery:

```typescript
// Configuration
transport: {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASSWORD // App-specific password
  }
}
```

### Email Templates

Located in `src/mail/templates/`:

- Welcome email
- Email verification
- Password reset
- Blog approval/rejection
- Notification summaries

### Email Delivery Pipeline

1. Email triggered by user action
2. Email document created in MongoDB
3. Job added to BullMQ queue
4. Worker processes job with retries
5. Nodemailer sends via Gmail SMTP
6. Failure logged for investigation

## 👨‍💻 Development

### Development Server

```bash
npm run dev
```

Starts TypeScript development server with hot reload via `tsx watch`

### Code Formatting

```bash
# Check formatting
npm run format

# Fix formatting
npm run format:fix
```

### Build for Production

```bash
npm run build
```

Compiles TypeScript and resolves path aliases using `tsc-alias`

### Worker Development

```bash
# Run logout cleanup worker separately
npm run logout:worker
```

### Project Organization

- **Feature-based structure**: Code organized by user role/feature
- **Model-View-Controller pattern**: Routes → Controllers → Services → Models
- **Middleware composition**: Chain middlewares for cross-cutting concerns
- **Utility separation**: Business logic in `libs/`, shared constants in `constants/`

## 🔧 Production Deployment

### Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Database backups set up
- [ ] Redis cluster configured
- [ ] MongoDB replicas for HA
- [ ] CDN for static assets
- [ ] Email credentials tested
- [ ] Cloudinary account verified
- [ ] Groq API quota checked

### Deployment Steps

```bash
# 1. Build application
npm run build

# 2. Deploy dist folder
# 3. Set NODE_ENV=production
# 4. Restart application

NODE_ENV=production npm start
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5555
BASE_URL=https://api.devshala.com

# Use production MongoDB Atlas
DATABASE_URI=mongodb+srv://...

# Use production Redis (managed service)
REDIS_HOST=redis.example.com
REDIS_PASSWORD=...

# Use secure secrets
ACCESS_TOKEN_SECRET_KEY=<strong-random-secret>
SESSION_SECRET=<strong-random-secret>

# Enable secure cookies
COOKIE_SECURE=true
```

### Scaling Considerations

- **Horizontal scaling**: Multiple application instances behind load balancer
- **Redis cluster**: For session store and queue distribution
- **MongoDB sharding**: For data distribution across multiple servers
- **Socket.IO**: Use Redis adapter for multi-instance support
- **BullMQ**: Distributed job processing across worker instances

### Monitoring

- **Winston Logger**: Structured logs for debugging
- **Morgan**: HTTP request logging
- **Error tracking**: Aggregate errors from logs
- **Performance monitoring**: Response time tracking
- **Health checks**: Implement `/health` endpoint

## 🧪 Testing

### Test Setup

- **Framework**: Jest (via supertest)
- **Database**: MongoDB Memory Server for isolated tests
- **Runtime**: Node.js native test runner support

### Run Tests

```bash
npm test
```

### Test Structure

- Unit tests for utility functions
- Integration tests for API endpoints
- Database tests with isolated MongoDB instance
- Socket.IO event testing

## 🔗 Related Services

- **Frontend**: React application (separate repository)
- **Admin Dashboard**: Admin portal (separate repository)
- **Mobile App**: React Native application (separate repository)

## 📝 Contributing

### Guidelines

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -am 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards

- Use TypeScript for type safety
- Follow ESLint configuration
- Format code with Prettier
- Write tests for new features
- Document complex logic

## 📄 License

ISC License - See LICENSE file for details

## 📧 Support

For support, email: support@devshala.com

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Maintained by**: Devshala Team
