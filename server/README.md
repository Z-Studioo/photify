# Photify Server

A professional Node.js Express TypeScript server with comprehensive error handling, security middleware, and development tooling.

## 🚀 Features

- **TypeScript**: Full TypeScript support with strict type checking
- **Express.js**: Fast, unopinionated web framework
- **Security**: Helmet, CORS, and rate limiting middleware
- **Error Handling**: Comprehensive error handling with custom error classes
- **Code Quality**: ESLint and Prettier for consistent code formatting
- **Development**: Hot reloading with Nodemon and TypeScript compilation
- **Logging**: Request logging and error tracking
- **Environment**: Environment variable validation and configuration

## 📁 Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── environment.ts      # Environment configuration
│   ├── middleware/
│   │   ├── errorHandler.ts     # Error handling middleware
│   │   └── requestLogger.ts    # Request logging middleware
│   ├── routes/
│   │   └── index.ts           # API routes
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── app.ts                 # Express app configuration
│   └── index.ts              # Server entry point
├── dist/                     # Compiled JavaScript output
├── .env.example             # Environment variables example
├── .eslintrc.js             # ESLint configuration
├── .prettierrc              # Prettier configuration
├── nodemon.json             # Nodemon configuration
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)

### Installation

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables:**
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   CLIENT_URL=http://localhost:3000
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-at-least-32-characters-long
   LOG_LEVEL=info
   ```

### Development

**Start development server:**
```bash
npm run dev
```

The server will start on `http://localhost:5000` with hot reloading enabled.

### Production

**Build the project:**
```bash
npm run build
```

**Start production server:**
```bash
npm start
```

## 📜 Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build the project for production
- `npm start` - Start production server
- `npm run build:watch` - Build and watch for changes
- `npm run clean` - Remove dist directory
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `5000` | No |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` | No |
| `JWT_SECRET` | JWT secret key | - | Yes (production) |
| `DB_URL` | Database connection string | - | No |
| `LOG_LEVEL` | Logging level | `info` | No |

### Security Features

- **Helmet**: Sets various HTTP headers to secure the app
- **CORS**: Configured for cross-origin requests
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Request body size limits (10mb)
- **Error Handling**: Sanitized error responses in production

## 🛡️ Error Handling

The server includes comprehensive error handling with custom error classes:

- `AppError` - Base application error
- `ValidationError` - Input validation errors (400)
- `NotFoundError` - Resource not found errors (404)
- `UnauthorizedError` - Authentication errors (401)
- `ForbiddenError` - Authorization errors (403)
- `ConflictError` - Resource conflict errors (409)

### Example Usage

```typescript
import { NotFoundError, ValidationError } from '@/middleware/errorHandler';

// Throw custom errors
throw new NotFoundError('User not found');
throw new ValidationError('Invalid email format');
```

## 🚦 API Endpoints

### Health Check
- `GET /health` - Server health status
- `GET /api/health` - API health status
- `GET /api/` - API information

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "statusCode": 400,
    "stack": "Stack trace (development only)"
  }
}
```

## 🧪 Development Best Practices

### Code Quality
- ESLint enforces consistent code style
- Prettier formats code automatically
- TypeScript provides type safety
- Strict TypeScript configuration enabled

### Error Handling
- Use custom error classes for different error types
- Always use `asyncHandler` for async route handlers
- Validate input data using express-validator
- Log errors appropriately

### Security
- Never expose sensitive data in error messages
- Use environment variables for configuration
- Implement proper authentication and authorization
- Keep dependencies updated

## 🔍 Monitoring and Logging

The server includes request logging middleware that tracks:
- HTTP method and URL
- Response status code
- Response time
- Content length
- Client IP address
- User agent

Log levels:
- `error` - Errors only
- `warn` - Warnings and errors
- `info` - General information, warnings, and errors
- `debug` - All requests and detailed information

## 🚀 Deployment

### Docker (Optional)
Create a `Dockerfile` for containerized deployment:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure all required environment variables
3. Ensure JWT_SECRET is set and secure
4. Set up proper database connections
5. Configure reverse proxy (nginx) if needed

## 📝 Contributing

1. Follow the existing code style
2. Write meaningful commit messages
3. Add tests for new features
4. Update documentation as needed
5. Run linting and formatting before committing

## 📄 License

MIT License - see LICENSE file for details