// Vercel Serverless Function: POST /api/inquiries/validate
// Port dari endpoint Express di server.ts (versi AI Studio).
import crypto from 'node:crypto';

interface Req {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

// Rate limiter in-memory (best effort: per instance serverless).
const inquiryRateMap = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 15;

function checkRateLimit(clientKey: string): boolean {
  const now = Date.now();
  const timestamps = (inquiryRateMap.get(clientKey) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_MAX_REQUESTS) {
    inquiryRateMap.set(clientKey, timestamps);
    return false;
  }
  timestamps.push(now);
  inquiryRateMap.set(clientKey, timestamps);
  return true;
}

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function generateInquiryNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `INQ-${yyyy}${mm}${dd}-${suffix}`;
}

interface InquiryItemInput {
  productId?: unknown;
  productCode?: unknown;
  productName?: unknown;
  quantity?: unknown;
  selectedColor?: unknown;
  selectedSize?: unknown;
  customizationDetails?: unknown;
  artworkReferenceUrl?: unknown;
  indicativeUnitPrice?: unknown;
}

function clientIp(req: Req): string {
  const fwd = req.headers['x-forwarded-for'];
  const first = Array.isArray(fwd) ? fwd[0] : fwd;
  if (first) return first.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export default function handler(req: Req, res: Res): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ valid: false, error: 'Method tidak diizinkan.' });
    return;
  }

  if (!checkRateLimit(clientIp(req))) {
    res.status(429).json({
      valid: false,
      error: 'Terlalu banyak permintaan. Silakan tunggu satu menit sebelum mengirim inquiry lagi.',
    });
    return;
  }

  let raw: unknown = req.body;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = {};
    }
  }
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const customerName = sanitizeText(body.customerName, 120);
  const whatsappNumber = sanitizeText(body.whatsappNumber, 25).replace(/[^\d+]/g, '');
  const eventType = sanitizeText(body.eventType, 80);
  const eventDate = sanitizeText(body.eventDate, 20);
  const notes = sanitizeText(body.notes, 1500);
  const items = Array.isArray(body.items) ? (body.items as InquiryItemInput[]) : [];

  const errors: string[] = [];
  if (customerName.length < 2) errors.push('Nama kontak minimal 2 karakter.');
  if (whatsappNumber.length < 8 || whatsappNumber.length > 25) errors.push('Nomor WhatsApp tidak valid.');
  if (eventType.length < 2) errors.push('Jenis acara wajib diisi.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) && !/^\d{2}\/\d{2}\/\d{4}$/.test(eventDate)) {
    errors.push('Format tanggal acara tidak valid.');
  }
  if (items.length < 1 || items.length > 50) {
    errors.push('Pilih minimal 1 produk untuk inquiry.');
  }

  const sanitizedItems = items.slice(0, 50).map((item) => {
    const qty = Number(item.quantity);
    const price = Number(item.indicativeUnitPrice);
    const productId = sanitizeText(item.productId, 128);
    const productCode = sanitizeText(item.productCode, 40);
    const productName = sanitizeText(item.productName, 140);

    if (!productId || !/^[a-zA-Z0-9_-]+$/.test(productId)) {
      errors.push('ID produk tidak valid.');
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 1_000_000) {
      errors.push(`Jumlah pesanan tidak valid untuk ${productName || 'produk'}.`);
    }

    const rawArtwork = sanitizeText(item.artworkReferenceUrl, 500);
    const artworkReferenceUrl =
      rawArtwork && (rawArtwork.startsWith('https://') || rawArtwork.startsWith('http://'))
        ? rawArtwork
        : '';

    return {
      productId,
      productCode,
      productName,
      quantity: Number.isInteger(qty) ? qty : 1,
      selectedColor: sanitizeText(item.selectedColor, 60),
      selectedSize: sanitizeText(item.selectedSize, 60),
      customizationDetails: sanitizeText(item.customizationDetails, 1000),
      artworkReferenceUrl,
      indicativeUnitPrice: Number.isFinite(price) && price >= 0 ? price : 0,
    };
  });

  if (errors.length > 0) {
    res.status(400).json({ valid: false, errors });
    return;
  }

  const inquiryNumber = generateInquiryNumber();
  res.status(200).json({
    valid: true,
    inquiryNumber,
    sanitizedPayload: {
      inquiryNumber,
      customerName,
      whatsappNumber,
      eventType,
      eventDate,
      notes,
      status: 'NEW',
      itemCount: sanitizedItems.length,
      items: sanitizedItems,
    },
  });
}
