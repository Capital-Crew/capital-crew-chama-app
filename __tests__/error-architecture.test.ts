import { AppError, ErrorCodes } from '../lib/errors';
import { mapPrismaError } from '../lib/prisma-mapper';
import { validateBody } from '../lib/api-wrapper';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

describe('Error Architecture Verification', () => {
    
    describe('AppError & Taxonomy', () => {
        it('should correctly identify operational errors', () => {
            const err = new AppError('Insufficient funds', 422, ErrorCodes.INSUFFICIENT_FUNDS, true);
            expect(err.isOperational).toBe(true);
            expect(err.errorCode).toBe('BIZ-4001');
        });

        it('should default to operational errors', () => {
            const err = new AppError('Something went wrong', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
            expect(err.isOperational).toBe(true);
        });
    });

    describe('Prisma Error Mapper', () => {
        it('should map P2002 to DUPLICATE_RECORD', () => {
            const prismaErr = new Prisma.PrismaClientKnownRequestError('Duplicate key', {
                code: 'P2002',
                clientVersion: '5.0.0',
                meta: { target: ['email'] }
            });
            const mapped = mapPrismaError(prismaErr);
            expect(mapped.errorCode).toBe(ErrorCodes.DUPLICATE_RECORD);
            expect(mapped.statusCode).toBe(409);
            expect(mapped.message).toContain('email');
        });

        it('should map P2025 to RECORD_NOT_FOUND', () => {
            const prismaErr = new Prisma.PrismaClientKnownRequestError('Not found', {
                code: 'P2025',
                clientVersion: '5.0.0'
            });
            const mapped = mapPrismaError(prismaErr);
            expect(mapped.errorCode).toBe(ErrorCodes.RECORD_NOT_FOUND);
            expect(mapped.statusCode).toBe(404);
        });

        it('should treat unknown Prisma errors as non-operational/system errors', () => {
            const prismaErr = new Prisma.PrismaClientKnownRequestError('Random error', {
                code: 'P9999',
                clientVersion: '5.0.0'
            });
            const mapped = mapPrismaError(prismaErr);
            expect(mapped.isOperational).toBe(false);
            expect(mapped.errorCode).toBe(ErrorCodes.DATABASE_ERROR);
        });
    });

    describe('Zod Validation Helper', () => {
        const schema = z.object({
            amount: z.number().positive(),
            email: z.string().email(),
        });

        it('should return data if valid', () => {
            const data = { amount: 100, email: 'test@example.com' };
            const result = validateBody(schema, data);
            expect(result).toEqual(data);
        });

        it('should throw AppError with field errors if invalid', () => {
            const data = { amount: -5, email: 'invalid-email' };
            try {
                validateBody(schema, data);
                fail('Should have thrown AppError');
            } catch (err: any) {
                expect(err).toBeInstanceOf(AppError);
                expect(err.errorCode).toBe(ErrorCodes.INVALID_INPUT);
                expect(err.fieldErrors).toHaveProperty('amount');
                expect(err.fieldErrors).toHaveProperty('email');
            }
        });
    });
});
