/**
 * Production-ready Structured Logger
 * Currently wraps console but provides a central point for PII sanitization
 * and future integration with observability tools (Sentry/Pino/Winston).
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private isProduction = process.env.NODE_ENV === 'production';

    private sanitize(message: string): string {
        // Basic PII masking (Emails)
        return message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
    }

    private format(level: LogLevel, message: string, data?: any) {
        const timestamp = new Date().toISOString();
        const sanitizedMessage = this.sanitize(message);

        const logObj = {
            timestamp,
            level: level.toUpperCase(),
            message: sanitizedMessage,
            ...(data && { data })
        };

        if (this.isProduction) {
            return JSON.stringify(logObj);
        }
        return logObj;
    }

    info(message: string, data?: any) {
        console.info(this.format('info', message, data));
    }

    warn(message: string, data?: any) {
        console.warn(this.format('warn', message, data));
    }

    error(message: string, data?: any) {
        console.error(this.format('error', message, data));
    }

    debug(message: string, data?: any) {
        if (!this.isProduction) {
            console.debug(this.format('debug', message, data));
        }
    }
}

export const logger = new Logger();
