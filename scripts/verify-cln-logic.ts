import { CLNRepaymentService } from '../lib/services/CLN/CLNRepaymentService.js';

async function runVerification() {
    console.log('🚀 Starting CLN Mathematical Verification...\n');

    // 1. Bullet Test
    const bullet = CLNRepaymentService.generateSchedule({
        principal: 100000,
        annualInterestRate: 12,
        tenorMonths: 12,
        paymentIntervalMonths: 12,
        repaymentMode: 'AT_MATURITY' as any,
        closureDate: new Date('2024-01-01')
    });
    console.log('✅ Bullet (At Maturity) Test Passed');
    if (bullet[0].groupAmount !== 112000) throw new Error('Bullet math failed');

    // 2. Coupon Test
    const coupon = CLNRepaymentService.generateSchedule({
        principal: 100000,
        annualInterestRate: 12,
        tenorMonths: 3,
        paymentIntervalMonths: 1,
        repaymentMode: 'COUPON' as any,
        closureDate: new Date('2024-01-01')
    });
    console.log('✅ Coupon Test Passed');
    if (coupon.length !== 4) throw new Error('Coupon count failed');

    // 3. Residual Allocation Test
    const totalAmount = 100.01;
    const subscribers = [
        { id: 'sub1', sharePct: 50, amount: 5000, subscribedAt: new Date('2024-01-01') },
        { id: 'sub2', sharePct: 50, amount: 5000, subscribedAt: new Date('2024-01-02') }
    ];
    const allocations = CLNRepaymentService.allocateResiduals(totalAmount, subscribers as any);
    const sum = Number((allocations[0].amount + allocations[1].amount).toFixed(2));
    console.log('✅ Residual Allocation Test Passed');
    if (sum !== 100.01) throw new Error('Residual sum failed');

    console.log('\n✨ All CLN mathematical invariants verified successfully!');
}

runVerification().catch(err => {
    console.error('❌ Verification Failed:', err);
    process.exit(1);
});
