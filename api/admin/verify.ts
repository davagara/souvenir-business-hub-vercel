// Vercel Serverless Function: POST /api/admin/verify
// Verifikasi Firebase ID token untuk portal admin.
// Memakai Firebase Auth REST API (accounts:lookup) sehingga tidak butuh
// firebase-admin / service account. Token hanya valid jika diterbitkan
// oleh project Firebase milik API key di bawah.

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

// API key web Firebase (publik, sama dengan di firebase-applet-config.json).
// Bisa di-override lewat env var FIREBASE_API_KEY.
const FIREBASE_API_KEY =
  process.env.FIREBASE_API_KEY || 'AIzaSyBKZPyOQ8aFqK_7DhVi-ovvRf4iP2hzhPA';

// Email pemilik yang berwenang. Bisa di-override lewat env var OWNER_EMAILS
// (pisahkan dengan koma). Email pertama dianggap primary owner.
const DEFAULT_OWNER_EMAILS = ['david.qc.op@gmail.com', 'amico.official22@gmail.com'];
const OWNER_EMAILS = (process.env.OWNER_EMAILS
  ? process.env.OWNER_EMAILS.split(',')
  : DEFAULT_OWNER_EMAILS
)
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

interface LookupUser {
  localId?: string;
  email?: string;
  emailVerified?: boolean;
}

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
    const lookup = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!lookup.ok) {
      res.status(401).json({ authorized: false, error: 'Sesi login tidak valid atau kedaluwarsa.' });
      return;
    }

    const data = (await lookup.json()) as { users?: LookupUser[] };
    const user = data.users?.[0];
    if (!user || !user.email || user.emailVerified !== true) {
      res.status(403).json({ authorized: false, error: 'Email akun harus terverifikasi.' });
      return;
    }

    const emailLower = user.email.toLowerCase();
    res.status(200).json({
      authorized: OWNER_EMAILS.includes(emailLower),
      uid: user.localId,
      email: user.email,
      emailVerified: true,
      isPrimaryOwner: emailLower === OWNER_EMAILS[0],
    });
  } catch {
    res.status(401).json({ authorized: false, error: 'Sesi login tidak valid atau kedaluwarsa.' });
  }
}
