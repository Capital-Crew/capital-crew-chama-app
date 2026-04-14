import winston from 'winston';

/**
 * Production-ready Structured Logger using Winston.
 * Implements PII redaction and JSON output for financial safety.
 */

const PII_FIELDS = ['password', 'cvv', 'pan', 'ssn', 'accountNumber', 'pin', 'secret'];

/**
 * Custom format to redact sensitive fields from log objects.
 */
const redactFormat = winston.format((info) => {
    const redactValue = (val: any): any => {
        if (typeof val === 'string') {
            // Basic masking for strings that look like emails (already partially implemented in previous logger)
            return val.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
        }
        return val;
    };

    const redactObject = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return redactValue(obj);
        
        const newObj = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
            if (PII_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                (newObj as any)[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object') {
                (newObj as any)[key] = redactObject(obj[key]);
            } else {
                (newObj as any)[key] = redactValue(obj[key]);
            }
        }
        return newObj;
    };

    // Apply redaction to the entire metadata object
    if (info.metadata) {
        info.metadata = redactObject(info.metadata);
    }
    
    // Also check the root object (excluding internal winston fields)
    for (const key in info) {
        if (['level', 'message', 'timestamp', 'requestId', 'userId', 'endpoint', 'method', 'errorCode'].includes(key)) continue;
        if (PII_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            (info as any)[key] = '[REDACTED]';
        }
    }

    return info;
});

const loggerInstance = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        redactFormat(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console()
    ],
});

export const logger = {
    info: (message: string, meta?: any) => loggerInstance.info(message, meta),
    warn: (message: string, meta?: any) => loggerInstance.warn(message, meta),
    error: (message: string, meta?: any) => loggerInstance.error(message, meta),
    debug: (message: string, meta?: any) => loggerInstance.debug(message, meta),
};
