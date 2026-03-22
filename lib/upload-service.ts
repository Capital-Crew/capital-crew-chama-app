import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload Service Interface
 * Currently implements local storage, but can be swapped for S3/Cloudinary easily.
 */
export async function uploadFile(file: File): Promise<string> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    const relativePath = join('uploads', 'minutes', fileName);
    const absolutePath = join(process.cwd(), 'public', relativePath);

    try {
        // Ensure directory exists
        await mkdir(join(process.cwd(), 'public', 'uploads', 'minutes'), { recursive: true });

        // Write file
        await writeFile(absolutePath, buffer);

        // Return public URL path
        return `/${relativePath.replace(/\\/g, '/')}`;
    } catch (error) {
        throw new Error('Failed to upload file to storage');
    }
}
