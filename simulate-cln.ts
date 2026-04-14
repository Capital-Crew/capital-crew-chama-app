import { db } from './lib/db';
import { Decimal } from 'decimal.js';
import { CLNAccountingService } from './lib/services/CLN/CLNAccountingService';
import { CLNRepaymentService } from './lib/services/CLN/CLNRepaymentService';
import { v4 as uuidv4 } from 'uuid';

/**
 * End-to-End simulation of Loan Note Market Lifecycle
 */
async function simulateCLNLifecycle() {
    console.log('\n--- 🚀 CLN Lifecycle Simulation Started ---\n');

    // 1. Identify Test Actors
    const floater = await db.user.findFirst({ where: { email: 'gmwangi@capitalcrew.co.ke' } });
    const investor1 = await db.user.findFirst({ where: { email: 'snjoroge@capitalcrew.co.ke' } });
    const investor2 = await db.user.findFirst({ where: { email: 'bwanjeri@capitalcrew.co.ke' } });
    const admin = await db.user.findFirst({ where: { role: 'SYSTEM_ADMIN' } });

    if (!floater || !investor1 || !investor2 || !admin) {
        throw new Error('Test actors missing. Run environment audit first.');
    }

    console.log(`[Actors] Floater: ${floater.name}, Investors: ${investor1.name}, ${investor2.name}`);

    // --- PHASE 1: INITIATION ---
    console.log('\n[Phase 1] Initiating Loan Note...');
    const referenceNo = `SIM-${Date.now()}`;
    const note = await db.loanNote.create({
        data: {
            referenceNo,
            title: "Simulated Market Opportunity",
            floaterId: floater.id,
            requesterName: floater.name!,
            purpose: "Simulating end-to-end CLN market lifecycle for audit",
            totalAmount: new Decimal(10000),
            minSubscription: new Decimal(1000),
            interestRate: new Decimal(12), // 12% APR
            tenorValue: 3,
            tenorUnit: 'months',
            repaymentMode: 'COUPON',
            paymentIntervalMonths: 1,
            subscriptionDeadline: new Date(Date.now() + 86400000),
            repaymentSource: "Revenue from simulation",
            status: 'PENDING_APPROVAL'
        }
    });
    console.log(`[OK] Note Created: ${note.id} (Status: ${note.status})`);

    // --- PHASE 2: APPROVAL ---
    console.log('\n[Phase 2] Approving Note (Admin)...');
    await db.loanNote.update({
        where: { id: note.id },
        data: { status: 'OPEN', adminReviewComment: 'Simulation Approval' }
    });
    console.log(`[OK] Note Approved & Open for Subscription`);

    // --- PHASE 3: BIDDING (SUBSCRIPTION) ---
    console.log('\n[Phase 3] Simulating Bidding/Subscription...');
    
    const subs = [
        { user: investor1, amount: 6000 },
        { user: investor2, amount: 4000 }
    ];

    for (const s of subs) {
        console.log(`  > ${s.user.name} subscribing KES ${s.amount}...`);
        await db.$transaction(async (tx) => {
            await tx.loanNoteSubscription.create({
                data: {
                    loanNoteId: note.id,
                    subscriberId: s.user.id,
                    subscriberType: 'USER',
                    amount: new Decimal(s.amount),
                    status: 'ACTIVE',
                    businessDate: new Date()
                }
            });

            await tx.loanNote.update({
                where: { id: note.id },
                data: { subscribedAmount: { increment: new Decimal(s.amount) } }
            });

            await CLNAccountingService.postSubscription({
                userId: s.user.id,
                loanNoteId: note.id,
                amount: s.amount,
                idempotencyKey: uuidv4(),
                tx
            });
        });
    }
    console.log(`[OK] Note fully subscribed (10,000 / 10,000)`);

    // --- PHASE 4: CLOSURE & ACTIVATION ---
    console.log('\n[Phase 4] Releasing Escrow & Activating Note...');
    await db.$transaction(async (tx) => {
        // Post Escrow Release (Escrow -> Floater Wallet)
        await CLNAccountingService.postEscrowRelease({
            loanNoteId: note.id,
            floaterId: floater.id,
            amount: 10000,
            idempotencyKey: uuidv4(),
            tx
        });

        // Generate Schedule
        const events = CLNRepaymentService.generateSchedule({
            principal: 10000,
            annualInterestRate: 12,
            tenorMonths: 3,
            paymentIntervalMonths: 1,
            repaymentMode: 'COUPON',
            closureDate: new Date()
        });

        for (const event of events) {
            await tx.loanNotePaymentSchedule.create({
                data: {
                    loanNoteId: note.id,
                    eventNumber: event.eventNumber,
                    paymentType: event.paymentType as any,
                    dueDate: event.dueDate,
                    periodLabel: event.periodLabel,
                    groupAmount: new Decimal(event.groupAmount),
                    principalComponent: new Decimal(event.principalComponent),
                    interestComponent: new Decimal(event.interestComponent),
                    openingBalance: new Decimal(event.openingBalance),
                    closingBalance: new Decimal(event.closingBalance),
                    isStubPeriod: event.isStubPeriod,
                    status: 'UPCOMING'
                }
            });
        }

        await tx.loanNote.update({
            where: { id: note.id },
            data: { status: 'ACTIVE', escrowReleased: true, escrowReleasedAt: new Date() }
        });
    });
    console.log(`[OK] Note activated. Escrow released to Floater. Schedule generated.`);

    // --- PHASE 5: MATURITY & PAYOUTS ---
    console.log('\n[Phase 5] Executing Payout Schedule...');
    const schedules = await db.loanNotePaymentSchedule.findMany({
        where: { loanNoteId: note.id },
        orderBy: { eventNumber: 'asc' }
    });

    for (const schedule of schedules) {
        console.log(`  > Executing Event ${schedule.eventNumber} (${schedule.paymentType}): KES ${schedule.groupAmount}...`);
        
        // Simulating the disbursement logic
        const subscriptions = await db.loanNoteSubscription.findMany({
            where: { loanNoteId: note.id },
            include: { user: { include: { member: { include: { wallet: true } } } } }
        });

        const subscriberAllocations = CLNRepaymentService.allocateResiduals(
            Number(schedule.groupAmount),
            subscriptions.map(s => ({
                id: s.id,
                sharePct: Number(s.amount) / 10000 * 100,
                amount: Number(s.amount),
                subscribedAt: s.subscribedAt
            }))
        );

        await db.$transaction(async (tx) => {
            await CLNAccountingService.postPayout({
                paymentScheduleId: schedule.id,
                floaterId: floater.id,
                totalAmount: Number(schedule.groupAmount),
                disbursements: subscriberAllocations.map(a => ({
                    subscriberId: a.subscriberId,
                    amount: a.amount,
                    glAccountId: subscriptions.find(s => s.id === a.subscriberId)!.user!.member!.wallet!.glAccountId
                })),
                idempotencyKey: uuidv4(),
                tx
            });

            await tx.loanNotePaymentSchedule.update({
                where: { id: schedule.id },
                data: { status: 'PAID', executedAt: new Date() }
            });
        });
        console.log(`    [OK] Event ${schedule.eventNumber} distributed.`);
    }

    console.log('\n--- ✅ Simulation Complete! ---');
    
    // Final Audit Report
    const finalNote = await db.loanNote.findUnique({ where: { id: note.id } });
    console.log(`\nFinal Note Status: ${finalNote?.status}`);
    console.log(`Escrow Released: ${finalNote?.escrowReleased}`);
    console.log(`Total Payout Events Paid: ${schedules.length}`);
}

simulateCLNLifecycle().catch(e => {
    console.error('\n❌ Simulation Failed:', e);
});
