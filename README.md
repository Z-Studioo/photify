# Photify

A professional full-stack photo management editor application built with React frontend and Node.js
backend, featuring modern development practices and tools.

## 🏗️ Architecture

This is a monorepo containing:

- **Frontend (`app/`)**: React + TypeScript + Vite application
- **Backend (`server/`)**: Node.js + Express + TypeScript API server

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Git

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd photify
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Setup environment files:**

   ```bash
   # Frontend
   cp app/.env.example app/.env

   # Backend
   cp server/.env.example server/.env
   ```

4. **Start development servers:**

   ```bash
   npm run dev
   ```

   This starts both frontend (port 3000) and backend (port 5000) concurrently.

## 📁 Project Structure

```
photify/
├── app/                          # React frontend application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/               # Application pages
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Utility functions
│   │   └── types/               # TypeScript type definitions
│   ├── public/                  # Static assets
│   ├── package.json             # Frontend dependencies
│   └── vite.config.ts           # Vite configuration
├── server/                      # Node.js backend API
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   ├── middleware/          # Express middleware
│   │   ├── routes/              # API routes
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Utility functions
│   ├── package.json             # Backend dependencies
│   └── tsconfig.json            # TypeScript configuration
├── .husky/                      # Git hooks
├── docs/                        # Project documentation
├── package.json                 # Root package.json (workspace)
├── commitlint.config.js         # Commit linting rules
└── CONVENTIONAL_COMMITS.md      # Commit guidelines
```

## 🛠️ Available Scripts

### Root Level

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:app          # Start only frontend
npm run dev:server       # Start only backend

# Building
npm run build            # Build both projects
npm run build:app        # Build frontend only
npm run build:server     # Build backend only

# Code Quality
npm run lint             # Lint all code (app + server)
npm run lint:fix         # Fix linting issues in both projects
npm run lint:app         # Lint frontend only
npm run lint:server      # Lint backend only
npm run format           # Format code in both projects
npm run format:check     # Check code formatting in both projects

# Type Checking
npm run type-check       # Check TypeScript in both projects
npm run type-check:app   # Check frontend TypeScript
npm run type-check:server # Check backend TypeScript

# Git & Releases
npm run commit           # Interactive commit with Commitizen
npm run release          # Generate changelog and bump version
```

### Individual Projects

Navigate to `app/` or `server/` directories to run project-specific scripts.

## 🔧 Development Workflow

### 1. Code Quality

This project enforces code quality through:

- **Individual Project Linting**: Each project (app/ and server/) has its own ESLint and Prettier configuration
- **TypeScript**: Static type checking in both frontend and backend
- **Husky**: Git hooks for pre-commit checks
- **Commitlint**: Enforces conventional commit messages

### 2. Commit Standards

We use [Conventional Commits](./CONVENTIONAL_COMMITS.md):

```bash
# Use interactive commit helper
npm run commit

# Or manual format
git commit -m "feat(auth): add user authentication"
git commit -m "fix(api): resolve database connection issue"
git commit -m "docs(readme): update setup instructions"
```

### 3. Pre-commit Hooks

Automatic checks run before each commit:

- Code linting and fixing (per project)
- Code formatting (per project)
- Commit message validation

### 4. Development Server

```bash
# Start both services
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

## 🏛️ Technology Stack

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework

### Backend

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Commitlint** - Commit message linting
- **Commitizen** - Interactive commit helper
- **Concurrently** - Run multiple commands

## 🔒 Security Features

### Backend Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation
- Error handling middleware
- Environment variable validation

### Frontend Security

- Content Security Policy ready
- XSS protection through React
- Secure environment variable handling

## 🧪 Testing

```bash
# Run all tests
npm test

# Run frontend tests
cd app && npm test

# Run backend tests
cd server && npm test

# Run tests in watch mode
npm run test:watch
```

## 📚 Documentation

- [Conventional Commits Guide](./CONVENTIONAL_COMMITS.md)
- [Frontend Documentation](./app/README.md)
- [Backend Documentation](./server/README.md)
- [API Documentation](./docs/api.md) (if available)

## 🌍 Environment Variables

### Frontend (`app/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Photify
```

### Backend (`server/.env`)

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-secret-key
DB_URL=your-database-url
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)

```bash
cd app
npm run build
# Deploy dist/ directory
```

### Backend (Railway/Heroku/DigitalOcean)

```bash
cd server
npm run build
npm start
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feat/amazing-feature`
3. **Make changes and commit**: `npm run commit`
4. **Push to branch**: `git push origin feat/amazing-feature`
5. **Create Pull Request**

### Guidelines

- Follow [Conventional Commits](./CONVENTIONAL_COMMITS.md)
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all checks pass

## 🐛 Issues and Support

- **Bug Reports**: Use GitHub Issues
- **Feature Requests**: Use GitHub Discussions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
