import {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  DatabaseError,
} from '@/lib/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an instance with correct properties', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400);
      expect(error.message).toBe('Test error');
      expect(error.errorCode).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('AppError');
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400);
      expect(error.stack).toBeDefined();
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error with default status 400', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('NotFoundError', () => {
    it('should create a not found error with default status 404', () => {
      const error = new NotFoundError('Resource');
      expect(error.message).toBe('Resource not found');
      expect(error.errorCode).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('AuthenticationError', () => {
    it('should create an authentication error with default status 401', () => {
      const error = new AuthenticationError('Unauthorized');
      expect(error.message).toBe('Unauthorized');
      expect(error.errorCode).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthenticationError');
    });
  });

  describe('DatabaseError', () => {
    it('should create a database error with default status 500', () => {
      const error = new DatabaseError('DB connection failed');
      expect(error.message).toBe('DB connection failed');
      expect(error.errorCode).toBe('DATABASE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('DatabaseError');
    });
  });
});
