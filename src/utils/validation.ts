export const BLUEPRINT_LIMITS = {
  idPattern: /^[a-zA-Z0-9_-]+$/,
  slugPattern: /^[a-z0-9-]+$/,
  codePattern: /^[A-Z0-9-]+$/,
  businessNameMax: 120,
  taglineMax: 200,
  urlMax: 500,
  phoneMax: 25,
  emailMax: 150,
  addressMax: 300,
  categoryNameMax: 80,
  categoryDescMax: 300,
  productNameMax: 140,
  productDescMax: 2000,
  formatMax: 40,
};

export function clampString(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64);
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= BLUEPRINT_LIMITS.emailMax;
}

export function isSafeHttpUrl(url: string): boolean {
  if (!url) return true;
  if (url.startsWith('/src/assets/') || url.startsWith('/assets/')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
