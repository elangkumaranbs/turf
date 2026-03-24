import { Turf } from '@/lib/firebase/firestore';

// Define the Cloudinary Cloud Name from env variables. 
// Fallback is left empty so it doesn't break if env var isn't set yet.
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // If no cloudinary account is set, just return the original firebase URL
  if (!CLOUDINARY_CLOUD_NAME) {
    return src;
  }

  // Cloudinary Fetch API format:
  // https://res.cloudinary.com/<cloud_name>/image/fetch/f_auto,q_auto,w_<width>/<remote_url>
  const params = ['f_auto', 'c_limit', `w_${width}`];
  
  if (quality) {
    params.push(`q_${quality}`);
  } else {
    params.push('q_auto');
  }

  const paramsString = params.join(',');
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch/${paramsString}/${src}`;
}
