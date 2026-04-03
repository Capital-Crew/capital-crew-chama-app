import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db as prisma } from "@/lib/db";
import sharp from "sharp";
import { revalidatePath } from "next/cache";

/**
 * Handle secure profile picture upload with cropping processing
 */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const memberId = formData.get("memberId") as string;

        if (!file || !memberId) {
            return NextResponse.json({ error: "Missing file or member ID" }, { status: 400 });
        }

        // Convert the File to a Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Process image with Sharp
        // 1. Resize to exactly 300x300
        // 2. Optimize for web usage
        // 3. Strip all sensitive metadata
        const processedBuffer = await sharp(buffer)
            .resize(300, 300, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({
                quality: 80,
                progressive: true
            })
            .toBuffer();

        const base64Image = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;

        // Find the user linked to the member
        const member = await prisma.member.findUnique({
            where: { id: memberId },
            include: { user: true }
        });

        if (!member?.user?.id) {
            return NextResponse.json({ error: "Member not found or user account disconnected" }, { status: 404 });
        }

        // Update the user's image
        await prisma.user.update({
            where: { id: member.user.id },
            data: { image: base64Image }
        });

        // Trigger revalidation
        revalidatePath(`/members/${memberId}`);
        revalidatePath("/", "layout");

        return NextResponse.json({
            success: true,
            imageUrl: base64Image
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
    }
}
