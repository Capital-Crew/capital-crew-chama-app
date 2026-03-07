import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db as prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { memberId, beneficiaries } = await request.json();

        // Validate total allocation
        const totalAllocation = beneficiaries.reduce((sum: number, b: any) => sum + Number(b.allocation || 0), 0);
        if (totalAllocation !== 100) {
            return NextResponse.json({
                success: false,
                error: `Total allocation must equal 100%. Current: ${totalAllocation}%`
            }, { status: 400 });
        }

        // Delete existing beneficiaries and create new ones in a transaction
        await prisma.$transaction(async (tx) => {
            // Delete all existing Next of Kin for this member
            await tx.nextOfKin.deleteMany({
                where: { memberId }
            });

            // Create new beneficiaries
            for (const beneficiary of beneficiaries) {
                await tx.nextOfKin.create({
                    data: {
                        memberId,
                        fullName: beneficiary.fullName,
                        relationship: beneficiary.relationship,
                        phoneNumber: beneficiary.phoneNumber,
                        allocation: new Prisma.Decimal(beneficiary.allocation),
                        nationality: beneficiary.nationality || 'KE',
                        altPhone: beneficiary.altPhone || null
                    }
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to save beneficiaries'
        }, { status: 500 });
    }
}
