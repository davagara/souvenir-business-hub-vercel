// Vercel Serverless Function: POST /api/admin/verify
// Verifikasi Firebase ID token untuk portal admin.
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

// Project ID Firebase. Bisa di-override lewat env var FIREBASE_PROJECT_ID.
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'neon-ripsaw-c8p5g';

// Email pemilik yang berwenang. Bisa di-override lewat env var OWNER_EMAILS
// (pisahkan dengan koma). Email pertama dianggap primary owner.
const DEFAULT_OWNER_EMAILS = ['david.qc.op@gmail.com', 'amico.official22@gmail.com'];
const OWNER_EMAILS = (process.env.OWNER_EMAILS
  ? process.env.OWNER_EMAILS.split(',')
  : DEFAULT_OWNER_EMAILS
)
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function handler(req: Req, res: Res): Promise<void> {
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ authorized: false, error: 'Method tidak diizinkan.' });
    return;
  }

  const rawAuth = req.headers.authorization;
  const authHeader = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ authorized: false, error: 'Token otentikasi tidak ditemukan.' });
    return;
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    res.status(401).json({ authorized: false, error: 'Token otentikasi kosong.' });
    return;
  }

  try {
    if (getApps().length === 0) {
      initializeApp({ projectId: FIREBASE_PROJECT_ID });
    }
    const decoded = await getAuth(getApp()).verifyIdToken(idToken);
    if (!decoded.email || decoded.email_verified !== true) {
      res.status(403).json({ authorized: false, error: 'Email akun harus terverifikasi.' });
      return;
    }

    const emailLower = decoded.email.toLowerCase();
    res.status(200).json({
      authorized: OWNER_EMAILS.includes(emailLower),
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: true,
      isPrimaryOwner: emailLower === OWNER_EMAILS[0],
    });
  } catch {
    res.status(401).json({ authorized: false, error: 'Sesi login tidak valid atau kedaluwarsa.' });
  }
}
