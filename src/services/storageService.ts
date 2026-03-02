/**
 * MinIO Storage Service
 *
 * Flow:
 *   1. (Optional) Compress image via expo-image-manipulator
 *   2. Request a presigned PUT URL from Cloud Function (generateUploadUrl)
 *   3. PUT the file binary directly to MinIO
 *   4. Return the public URL (public files) or path (private files)
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { auth } from './firebase/config';
import { minioConfig } from '../config/appConfig';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGE_SIZE_MB = 8;
const MAX_DOC_SIZE_MB = 15;
const MAX_IMAGE_DIMENSION = 1280; // px

// Firebase Cloud Functions base URL — set via env or infer from firebase project
const FUNCTIONS_BASE_URL =
  process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL ||
  'https://us-central1-danceplatform-7924a.cloudfunctions.net';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UploadCategory =
  | 'avatar'          // → public/avatars/{uid}/avatar.jpg
  | 'course-cover'    // → public/course-covers/{courseId}/cover.jpg
  | 'instructor-doc'; // → private/instructor-docs/{uid}/{docType}.{ext}

export interface UploadResult {
  url: string;       // Public URL (public files) or MinIO object key (private files)
  isPublic: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get current user Firebase ID token for authenticating with Cloud Functions */
async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user.getIdToken();
}

/** Map MIME type to file extension */
function mimeToExt(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/heic': 'heic',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  };
  return map[contentType] ?? 'bin';
}

/** Detect MIME type from URI (best-effort for React Native) */
function detectMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg'; // default
}

/** Check file size via fetch HEAD or from expo asset info */
async function checkFileSize(uri: string, maxMb: number): Promise<void> {
  try {
    const res = await fetch(uri, { method: 'HEAD' });
    const length = res.headers.get('Content-Length');
    if (length) {
      const sizeMb = parseInt(length, 10) / (1024 * 1024);
      if (sizeMb > maxMb) {
        throw new Error(`Dosya boyutu ${maxMb}MB sınırını aşıyor (${sizeMb.toFixed(1)}MB)`);
      }
    }
  } catch (err: any) {
    // If it's our own size error, re-throw
    if (err.message && err.message.includes('sınırını aşıyor')) throw err;
    // Otherwise ignore (HEAD might not be supported on local file URIs)
  }
}

// ─── Image Compression ────────────────────────────────────────────────────────

/**
 * Compresses + resizes an image URI.
 * Returns a new local URI pointing to the compressed file.
 */
export async function compressImage(uri: string, qualityHint = 0.82): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_IMAGE_DIMENSION } }],
    {
      compress: qualityHint,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );
  return result.uri;
}

// ─── Core Upload Engine ───────────────────────────────────────────────────────

/**
 * Requests a presigned URL from the Cloud Function and uploads the file binary
 * directly to MinIO. Returns the public URL or the private path.
 */
async function uploadWithPresignedUrl(
  localUri: string,
  remotePath: string,
  contentType: string,
  onProgress?: (p: UploadProgress) => void
): Promise<UploadResult> {
  console.log('[Storage] ▶ uploadWithPresignedUrl START');
  console.log('[Storage]   localUri:', localUri?.substring(0, 60));
  console.log('[Storage]   remotePath:', remotePath);
  console.log('[Storage]   contentType:', contentType);
  console.log('[Storage]   functionsUrl:', FUNCTIONS_BASE_URL);

  const user = auth.currentUser;
  console.log('[Storage]   currentUser uid:', user?.uid ?? 'NULL — NOT LOGGED IN');

  const idToken = await getIdToken();
  console.log('[Storage]   idToken acquired (length):', idToken?.length);

  // Step 1: Get presigned URL from Cloud Function
  const cfPayload = { path: remotePath, contentType };
  console.log('[Storage]   CF request body:', JSON.stringify(cfPayload));

  const cfRes = await fetch(`${FUNCTIONS_BASE_URL}/generateUploadUrl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(cfPayload),
  });

  console.log('[Storage]   CF response status:', cfRes.status);

  if (!cfRes.ok) {
    const errText = await cfRes.text();
    console.error('[Storage]   CF error body:', errText);
    let errJson: any = {};
    try { errJson = JSON.parse(errText); } catch { errJson = { error: errText }; }
    throw new Error(`URL alınamadı: ${errJson.error || cfRes.statusText}`);
  }

  const cfJson = await cfRes.json();
  console.log('[Storage]   CF response keys:', Object.keys(cfJson));
  const { uploadUrl, publicUrl } = cfJson;
  // Log full URL to verify presigned query params
  console.log('[Storage]   uploadUrl FULL:', uploadUrl);

  // Step 2: Read local file as Uint8Array via fetch
  console.log('[Storage]   Fetching local file...');
  const fileRes = await fetch(localUri);
  const arrayBuffer = await fileRes.arrayBuffer();
  console.log('[Storage]   ArrayBuffer byteLength:', arrayBuffer.byteLength);

  // Step 3: PUT directly to MinIO using fetch (more reliable than XHR in Expo Go)
  console.log('[Storage]   Starting PUT to MinIO...');
  onProgress?.({ loaded: 0, total: arrayBuffer.byteLength, percent: 0 });

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: arrayBuffer,
  });

  console.log('[Storage]   MinIO PUT status:', putRes.status);

  if (!putRes.ok) {
    const errText = await putRes.text();
    console.error('[Storage]   MinIO PUT error body:', errText);
    throw new Error(`Upload başarısız (HTTP ${putRes.status})`);
  }

  console.log('[Storage] ✅ Upload success');
  onProgress?.({ loaded: arrayBuffer.byteLength, total: arrayBuffer.byteLength, percent: 100 });

  const isPublic = remotePath.startsWith('public/');
  const finalUrl = publicUrl ?? `${minioConfig.publicBaseUrl}/${remotePath}`;
  console.log('[Storage]   finalUrl:', finalUrl);
  return { url: finalUrl, isPublic };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Upload a user avatar (profile photo).
 * Compresses the image, uploads to public/avatars/{uid}/avatar.jpg
 * Returns the permanent public URL.
 */
export async function uploadAvatar(
  userId: string,
  localUri: string,
  onProgress?: (p: UploadProgress) => void
): Promise<string> {
  console.log('[Storage] uploadAvatar — userId:', userId);
  await checkFileSize(localUri, MAX_IMAGE_SIZE_MB);

  const compressed = await compressImage(localUri);
  console.log('[Storage] uploadAvatar — compressed uri:', compressed?.substring(0, 60));
  const remotePath = `public/avatars/${userId}/avatar.jpg`;
  console.log('[Storage] uploadAvatar — remotePath:', remotePath);

  const result = await uploadWithPresignedUrl(compressed, remotePath, 'image/jpeg', onProgress);
  return result.url;
}

/**
 * Upload a course cover image.
 * Compresses the image, uploads to public/course-covers/{courseId}/cover.jpg
 * Returns the permanent public URL.
 */
export async function uploadCourseCover(
  courseId: string,
  userId: string,
  localUri: string,
  onProgress?: (p: UploadProgress) => void
): Promise<string> {
  console.log('[Storage] uploadCourseCover — courseId:', courseId, 'userId:', userId);
  await checkFileSize(localUri, MAX_IMAGE_SIZE_MB);

  const compressed = await compressImage(localUri, 0.85);
  console.log('[Storage] uploadCourseCover — compressed uri:', compressed?.substring(0, 60));
  const remotePath = `public/course-covers/${userId}/${courseId}/cover.jpg`;
  console.log('[Storage] uploadCourseCover — remotePath:', remotePath);

  const result = await uploadWithPresignedUrl(compressed, remotePath, 'image/jpeg', onProgress);
  return result.url;
}

/**
 * Upload an instructor verification document.
 * Uploads to private/instructor-docs/{uid}/{docType}.{ext}
 * Returns the MinIO object key (not a public URL).
 * Use getDocumentDownloadUrl() to get a time-limited access URL.
 */
export async function uploadInstructorDocument(
  userId: string,
  localUri: string,
  docType: 'id-front' | 'id-back' | 'certificate' | 'other',
  onProgress?: (p: UploadProgress) => void
): Promise<string> {
  await checkFileSize(localUri, MAX_DOC_SIZE_MB);

  const contentType = detectMimeType(localUri);
  const ext = mimeToExt(contentType);
  const remotePath = `private/instructor-docs/${userId}/${docType}.${ext}`;

  const result = await uploadWithPresignedUrl(localUri, remotePath, contentType, onProgress);
  // Return the object key (private path) — not a public URL
  return remotePath;
}

/**
 * Get a time-limited presigned download URL for a private document.
 * Expires in 1 hour.
 */
export async function getDocumentDownloadUrl(objectPath: string): Promise<string> {
  const idToken = await getIdToken();

  const res = await fetch(`${FUNCTIONS_BASE_URL}/generateDownloadUrl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ path: objectPath }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`İndirme URL'i alınamadı: ${err.error || res.statusText}`);
  }

  const { downloadUrl } = await res.json();
  return downloadUrl;
}

/**
 * Build a static public URL for a known public path.
 * No network call needed — use this when you already know the path.
 */
export function getPublicUrl(remotePath: string): string {
  return `${minioConfig.publicBaseUrl}/${remotePath}`;
}
