'use server'

import { db as prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextOfKinSchema } from "@/lib/validators/nok-schema";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function updateNextOfKin(data: any) {
    const session = await auth();
    if (!session) {
        throw new Error("Unauthorized");
    }

    // Role check - Only officials can update member details?
    // Or can the member update their own? 
    // Usually in SACCOs, officials update after verification.
    const isOfficial = ['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(session.user?.role || '');
    const isOwner = session.user?.memberId === data.memberId;

    if (!isOfficial && !isOwner) {
        throw new Error("You do not have permission to update this information.");
    }

    const validatedData = NextOfKinSchema.parse(data);

    try {
        // Allocation Sum Check
        if (data.memberId) {
            const currentKins = await prisma.nextOfKin.findMany({
                where: { memberId: data.memberId }
            });

            const currentSum = currentKins.reduce((acc, k) => {
                // If updating, don't count the old value of the record being updated
                if (validatedData.id && k.id === validatedData.id) return acc;
                return acc + Number(k.allocation);
            }, 0);

            if (currentSum + validatedData.allocation > 100) {
                return {
                    success: false,
                    error: `Total allocation cannot exceed 100%. Current sum: ${currentSum}%. You are trying to add ${validatedData.allocation}%.`
                };
            }
        }

        if (validatedData.id) {
            // Update existing
            await prisma.nextOfKin.update({
                where: { id: validatedData.id },
                data: {
                    fullName: validatedData.fullName,
                    relationship: validatedData.relationship,
                    phoneNumber: validatedData.phoneNumber,
                    allocation: new Prisma.Decimal(validatedData.allocation),
                    nationality: validatedData.nationality || 'KE',
                    altPhone: validatedData.altPhone && validatedData.altPhone.trim() !== '' ? validatedData.altPhone : null,
                },
            });
        } else {
            // Create new if memberId is provided
            if (!data.memberId) throw new Error("Member ID is required for new record.");
            await prisma.nextOfKin.create({
                data: {
                    memberId: data.memberId,
                    fullName: validatedData.fullName,
                    relationship: validatedData.relationship,
                    phoneNumber: validatedData.phoneNumber,
                    allocation: new Prisma.Decimal(validatedData.allocation),
                    nationality: validatedData.nationality || 'KE',
                    altPhone: validatedData.altPhone && validatedData.altPhone.trim() !== '' ? validatedData.altPhone : null,
                },
            });
        }

        if (data.memberId) {
            revalidatePath(`/members/${data.memberId}`);
            revalidatePath(`/dashboard`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Failed to update Next of Kin:", error);
        return { success: false, error: error.message || "Failed to save changes." };
    }
}
