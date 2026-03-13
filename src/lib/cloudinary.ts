// src/lib/cloudinary.ts
// Uploads multiple image files to Cloudinary using an unsigned upload preset.
// No server needed — uses Cloudinary's free unsigned upload endpoint.

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export interface UploadProgress {
    file: string;
    index: number;
    total: number;
}

/**
 * Upload a single File to Cloudinary.
 * Returns the secure CDN URL string.
 */
export const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'turfs');

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
            method: 'POST',
            body: formData,
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Cloudinary upload failed');
    }

    const data = await response.json();
    return data.secure_url as string;
};

/**
 * Upload multiple Files to Cloudinary in parallel.
 * Returns an array of secure CDN URLs in the same order as input files.
 * Optionally accepts an onProgress callback to track per-file completion.
 */
export const uploadImagesToCloudinary = async (
    files: File[],
    onProgress?: (progress: UploadProgress) => void
): Promise<string[]> => {
    const total = files.length;
    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress?.({ file: file.name, index: i + 1, total });
        const url = await uploadImageToCloudinary(file);
        urls.push(url);
    }

    return urls;
};
