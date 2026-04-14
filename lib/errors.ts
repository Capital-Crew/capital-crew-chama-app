export enum ErrorCategory {
  VALIDATION = 'VAL',
  AUTHENTICATION = 'AUTH',
  AUTHORIZATION = 'AUTHZ',
  BUSINESS = 'BIZ',
  CONFLICT = 'CONF',
  INFRASTRUCTURE = 'SYS',
  GATEWAY = 'GW',
}

/**
 * Centrally defined Error Codes following {CATEGORY}-{4-digit-code}
 */
export const ErrorCodes = {
  // Validation
  INVALID_INPUT: 'VAL-1001',
  MISSING_FIELD: 'VAL-1002',
  
  // Authentication
  UNAUTHENTICATED: 'AUTH-2001',
  TOKEN_EXPIRED: 'AUTH-2002',
  
  // Authorization
  UNAUTHORIZED: 'AUTHZ-3001',
  INSUFFICIENT_ROLE: 'AUTHZ-3002',
  
  // Business Logic
  INSUFFICIENT_FUNDS: 'BIZ-4001',
  RECORD_NOT_FOUND: 'BIZ-4002',
  INVALID_STATUS: 'BIZ-4003',
  
  // Conflict
  DUPLICATE_RECORD: 'CONF-5001',
  CONCURRENCY_ERROR: 'CONF-5002',
  
  // Infrastructure
  DATABASE_ERROR: 'SYS-6001',
  INTERNAL_SERVER_ERROR: 'SYS-6002',
  
  // Third-party Gateway
  GATEWAY_TIMEOUT: 'GW-7001',
  GATEWAY_ERROR: 'GW-7002',
} as const;

export type AppErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export interface AppErrorPayload {
  success: false;
  errorCode: string;
  message: string;
  requestId: string;
  timestamp: string;
  errors?: Record<string, string>; // Specifically for VAL- field errors
}

export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number,
    public errorCode: AppErrorCode,
    public isOperational = true,
    public fieldErrors?: Record<string, string>
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
