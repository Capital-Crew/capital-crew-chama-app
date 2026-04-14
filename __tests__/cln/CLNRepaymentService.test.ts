import { describe, it, expect } from '@jest/globals';
import { CLNRepaymentService } from '@/lib/services/CLN/CLNRepaymentService';

describe('CLNRepaymentService - Schedule Generation', () => {
    
    it('should generate a correct AT_MATURITY (Bullet) schedule', () => {
        const schedule = CLNRepaymentService.generateSchedule({
            principal: 100000,
            annualInterestRate: 12, // 1% per month
            tenorMonths: 12,
            paymentIntervalMonths: 12, // Single payment at end
            repaymentMode: 'AT_MATURITY',
            closureDate: new Date('2024-01-01')
        });

        expect(schedule).toHaveLength(1);
        expect(schedule[0].groupAmount).toBe(112000); // 100k principal + 12k interest
        expect(schedule[0].principalComponent).toBe(100000);
        expect(schedule[0].interestComponent).toBe(12000);
    });

    it('should generate a correct COUPON (Interest Only) schedule', () => {
        const schedule = CLNRepaymentService.generateSchedule({
            principal: 100000,
            annualInterestRate: 12, // 1% per month
            tenorMonths: 3,
            paymentIntervalMonths: 1,
            repaymentMode: 'COUPON',
            closureDate: new Date('2024-01-01')
        });

        expect(schedule).toHaveLength(4); // 3 coupons + 1 principal
        
        // Month 1, 2, 3 should be 1000 interest
        expect(schedule[0].groupAmount).toBe(1000);
        expect(schedule[1].groupAmount).toBe(1000);
        expect(schedule[2].groupAmount).toBe(1000);
        
        // Final payment should be 100k principal
        expect(schedule[3].groupAmount).toBe(100000);
        expect(schedule[3].paymentType).toBe('PRINCIPAL');
    });

    it('should handle EMI_REDUCING (Reducing Balance) correctly', () => {
        const schedule = CLNRepaymentService.generateSchedule({
            principal: 1000,
            annualInterestRate: 12,
            tenorMonths: 10,
            paymentIntervalMonths: 1,
            repaymentMode: 'EMI_REDUCING',
            closureDate: new Date('2024-01-01')
        });

        expect(schedule).toHaveLength(10);
        
        // Sum of principal should equal exactly 1000
        const totalPrincipal = schedule.reduce((sum, e) => sum + e.principalComponent, 0);
        expect(totalPrincipal).toBe(1000);
        
        // Closing balance of last payment should be 0
        expect(schedule[9].closingBalance).toBe(0);
    });
});

describe('CLNRepaymentService - Residual Allocation (Largest Remainder Method)', () => {
    
    it('should allocate residual cents to the largest remainder', () => {
        const totalAmount = 100.01; // 1 extra cent
        const subscribers = [
            { id: 'sub1', sharePct: 50 }, // 50.005
            { id: 'sub2', sharePct: 50 }  // 50.005
        ];

        const allocations = CLNRepaymentService.allocateResiduals(totalAmount, subscribers as any);

        expect(allocations[0].amount + allocations[1].amount).toBe(100.01);
        // One of them should have 50.01
        const hasExtraCent = allocations.some(a => a.amount === 50.01);
        expect(hasExtraCent).toBe(true);
    });

    it('should correctly allocate when shares are unequal', () => {
        const totalAmount = 1000;
        const subscribers = [
            { id: 'sub1', sharePct: 33.333333333 }, 
            { id: 'sub2', sharePct: 33.333333333 },
            { id: 'sub3', sharePct: 33.333333333 }
        ];

        const allocations = CLNRepaymentService.allocateResiduals(totalAmount, subscribers as any);
        const sum = allocations.reduce((s, a) => s + a.amount, 0);
        
        expect(sum).toBe(1000);
    });
});
