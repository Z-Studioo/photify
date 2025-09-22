import { Request, Response, NextFunction } from 'express';
import { CustomError, ErrorResponse } from '@/types';

export class AppError extends Error implements CustomError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

export const errorHandler = (
  err: Error | CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err } as CustomError;
  error.message = err.message;

  // Log error
  console.error(`Error: ${err.message}`, err.stack);

  // Default error
  let message = 'Internal Server Error';
  let statusCode = 500;

  // Custom error
  if (error.statusCode) {
    message = error.message;
    statusCode = error.statusCode;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message = 'Invalid resource ID';
    statusCode = 400;
  }

  // Mongoose duplicate key
  if (err.name === 'MongoServerError' && 'code' in err && err.code === 11000) {
    message = 'Duplicate field value';
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = 'Validation Error';
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
  }

  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      statusCode,
    },
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  const error = new NotFoundError('Route not found');
  next(error);
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);