import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import type { Inquiry, InquiryCartItem, InquiryItem, InquiryStatus } from '../types/models';
import { clampString } from '../utils/validation';

export interface PublicInquirySubmissionInput {
  customerName: string;
  whatsappNumber: string;
  eventType: string;
  eventDate: string;
  notes: string;
  items: InquiryCartItem[];
}

export interface InquirySubmissionResult {
  inquiryId: string;
  inquiryNumber: string;
  customerName: string;
  whatsappNumber: string;
  eventType: string;
  eventDate: string;
  itemCount: number;
}

export async function uploadInquiryArtwork(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || 'png';
  const filePath = `inquiry_artwork/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const ref = storageRef(storage, filePath);
  await uploadBytes(ref, file);
  return await getDownloadURL(ref);
}

export async function submitPublicInquiry(
  input: PublicInquirySubmissionInput
): Promise<InquirySubmissionResult> {
  // 1. Validate & generate unique inquiry number via secure backend endpoint
  const response = await fetch('/api/inquiries/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: input.customerName,
      whatsappNumber: input.whatsappNumber,
      eventType: input.eventType,
      eventDate: input.eventDate,
      notes: input.notes,
      items: input.items.map((item) => ({
        productId: item.productId,
        productCode: item.productCode,
        productName: item.productName,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        customizationDetails: item.customizationDetails,
        artworkReferenceUrl: item.artworkReferenceUrl,
        indicativeUnitPrice: item.startingPrice,
      })),
    }),
  });

  const validationData = (await response.json()) as {
    valid?: boolean;
    error?: string;
    errors?: string[];
    inquiryNumber?: string;
    sanitizedPayload?: {
      inquiryNumber: string;
      customerName: string;
      whatsappNumber: string;
      eventType: string;
      eventDate: string;
      notes: string;
      status: 'NEW';
      itemCount: number;
      items: Array<{
        productId: string;
        productCode: string;
        productName: string;
        quantity: number;
        selectedColor: string;
        selectedSize: string;
        customizationDetails: string;
        artworkReferenceUrl: string;
        indicativeUnitPrice: number;
      }>;
    };
  };

  if (!response.ok || !validationData.valid || !validationData.sanitizedPayload) {
    const msg =
      validationData.errors?.join(' ') ||
      validationData.error ||
      'Data inquiry tidak valid. Silakan periksa kembali formulir Anda.';
    throw new Error(msg);
  }

  const clean = validationData.sanitizedPayload;
  const inquiryId = `inq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  // 2. Atomically save inquiry + inquiry_items in Firestore batch
  try {
    const batch = writeBatch(db);
    const inquiryRef = doc(db, 'inquiries', inquiryId);

    batch.set(inquiryRef, {
      inquiryNumber: clean.inquiryNumber,
      customerName: clean.customerName,
      whatsappNumber: clean.whatsappNumber,
      eventType: clean.eventType,
      eventDate: clean.eventDate,
      notes: clean.notes,
      status: 'NEW',
      itemCount: clean.items.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    clean.items.forEach((item, index) => {
      const itemId = `${inquiryId}-item-${index + 1}`;
      const itemRef = doc(db, 'inquiry_items', itemId);
      batch.set(itemRef, {
        inquiryId,
        productId: item.productId,
        productCode: item.productCode,
        productName: item.productName,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        customizationDetails: item.customizationDetails,
        artworkReferenceUrl: item.artworkReferenceUrl,
        indicativeUnitPrice: item.indicativeUnitPrice,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();

    return {
      inquiryId,
      inquiryNumber: clean.inquiryNumber,
      customerName: clean.customerName,
      whatsappNumber: clean.whatsappNumber,
      eventType: clean.eventType,
      eventDate: clean.eventDate,
      itemCount: clean.items.length,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `inquiries/${inquiryId}`);
  }
}

export async function fetchAllInquiriesAdmin(): Promise<Inquiry[]> {
  const path = 'inquiries';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Inquiry, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchInquiryItemsAdmin(inquiryId: string): Promise<InquiryItem[]> {
  const path = 'inquiry_items';
  try {
    const q = query(collection(db, path), where('inquiryId', '==', inquiryId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InquiryItem, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateInquiryStatusAdmin(
  inquiryId: string,
  status: InquiryStatus,
  customerId?: string
): Promise<void> {
  const path = `inquiries/${inquiryId}`;
  try {
    const ref = doc(db, 'inquiries', inquiryId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Inquiry tidak ditemukan.');
    const existing = snap.data() as Omit<Inquiry, 'id'>;

    const payload: Record<string, unknown> = {
      inquiryNumber: existing.inquiryNumber,
      customerName: existing.customerName,
      whatsappNumber: existing.whatsappNumber,
      eventType: existing.eventType,
      eventDate: existing.eventDate,
      notes: clampString(existing.notes || '', 1500),
      status,
      itemCount: existing.itemCount,
      createdAt: existing.createdAt,
      updatedAt: serverTimestamp(),
    };
    const finalCustomerId = customerId || existing.customerId;
    if (finalCustomerId) {
      payload.customerId = finalCustomerId;
    }

    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
