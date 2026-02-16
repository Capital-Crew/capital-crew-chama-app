import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/upload-service';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
        }

        // Validate file size (e.g., 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size too large (max 10MB)' }, { status: 400 });
        }

        const url = await uploadFile(file);

        return NextResponse.json({ url });
    } catch (error: any) {
        console.error('Upload API Error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
