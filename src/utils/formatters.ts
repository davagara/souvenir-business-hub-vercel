import type { FirestoreDate } from '../types/models';

export function formatIDR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return `Rp ${safe.toLocaleString('id-ID')}`;
}

export function formatStartingPrice(amount: number): string {
  return `Mulai dari ${formatIDR(amount)}`;
}

export function formatDateID(value: FirestoreDate): string {
  if (!value) return '-';
  let dateObj: Date | null = null;

  if (value instanceof Date) {
    dateObj = value;
  } else if (typeof value === 'string') {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) dateObj = parsed;
  } else if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    dateObj = value.toDate();
  }

  if (!dateObj || Number.isNaN(dateObj.getTime())) return '-';
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function normalizeWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('62')) return digits;
  return digits;
}

export function formatWhatsAppUrl(phone: string, message?: string): string {
  const normalized = normalizeWhatsAppNumber(phone);
  if (!normalized) return 'https://wa.me/';
  if (!message) return `https://wa.me/${normalized}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
