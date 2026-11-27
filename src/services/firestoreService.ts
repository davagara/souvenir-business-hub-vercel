import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  DEFAULT_OPERATIONS_SETTINGS,
  DEFAULT_STOREFRONT_SETTINGS,
  DEV_SAMPLE_PRODUCTS,
  STANDARD_CATEGORIES,
} from '../constants/catalogDefaults';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import type {
  CatalogCategory,
  DashboardMetrics,
  Delivery,
  Inquiry,
  OperationsSettings,
  Product,
  PurchaseOrder,
  Quotation,
  SalesOrder,
  StorefrontSettings,
  UserAccount,
} from '../types/models';
import { formatDateID } from '../utils/formatters';
import { clampString } from '../utils/validation';

export async function fetchStorefrontSettings(): Promise<StorefrontSettings> {
  const path = 'business_settings/storefront';
  try {
    const snap = await getDoc(doc(db, 'business_settings', 'storefront'));
    if (!snap.exists()) {
      return DEFAULT_STOREFRONT_SETTINGS;
    }
    const data = snap.data() as Partial<StorefrontSettings>;
    return {
      ...DEFAULT_STOREFRONT_SETTINGS,
      ...data,
      businessName: data.businessName || DEFAULT_STOREFRONT_SETTINGS.businessName,
      logoUrl: data.logoUrl || DEFAULT_STOREFRONT_SETTINGS.logoUrl,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveStorefrontSettings(
  input: Omit<StorefrontSettings, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const path = 'business_settings/storefront';
  try {
    const ref = doc(db, 'business_settings', 'storefront');
    const existingSnap = await getDoc(ref);
    const payload = {
      businessName: clampString(input.businessName || DEFAULT_STOREFRONT_SETTINGS.businessName, 120),
      tagline: clampString(input.tagline || '', 200),
      logoUrl: clampString(input.logoUrl || '', 500),
      whatsappNumber: clampString(input.whatsappNumber || '', 25),
      instagramHandle: clampString(input.instagramHandle || '', 60),
      address: clampString(input.address || '', 300),
      contactEmail: clampString(input.contactEmail || '', 150),
      contactHours: clampString(input.contactHours || '', 120),
      defaultCurrency: 'IDR' as const,
      createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchOperationsSettings(): Promise<OperationsSettings> {
  const path = 'business_settings/operations';
  try {
    const snap = await getDoc(doc(db, 'business_settings', 'operations'));
    if (!snap.exists()) {
      return DEFAULT_OPERATIONS_SETTINGS;
    }
    return {
      ...DEFAULT_OPERATIONS_SETTINGS,
      ...(snap.data() as Partial<OperationsSettings>),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveOperationsSettings(
  input: Omit<OperationsSettings, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const path = 'business_settings/operations';
  try {
    const ref = doc(db, 'business_settings', 'operations');
    const existingSnap = await getDoc(ref);
    const validity = Math.min(365, Math.max(1, Math.round(Number(input.defaultQuotationValidityDays) || 14)));
    const payload = {
      primaryOwnerEmail: clampString(input.primaryOwnerEmail, 150).toLowerCase(),
      secondaryOwnerEmail: clampString(input.secondaryOwnerEmail || '', 150).toLowerCase(),
      defaultQuotationValidityDays: validity,
      inquiryNumberFormat: clampString(input.inquiryNumberFormat || 'INQ-YYYYMMDD-XXXX', 40),
      quotationNumberFormat: clampString(input.quotationNumberFormat || 'QUO-YYYYMM-XXXX', 40),
      salesOrderNumberFormat: clampString(input.salesOrderNumberFormat || 'SO-YYYYMM-XXXX', 40),
      purchaseOrderNumberFormat: clampString(input.purchaseOrderNumberFormat || 'PO-YYYYMM-XXXX', 40),
      createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncOwnerUserProfile(user: {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const ref = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(ref);
    const payload: UserAccount = {
      uid: user.uid,
      email: user.email,
      displayName: clampString(user.displayName || user.email.split('@')[0] || 'Pemilik Bisnis', 100),
      role: 'owner',
      isActive: true,
      photoUrl: clampString(user.photoURL || '', 500),
      createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchActiveCategories(): Promise<CatalogCategory[]> {
  const path = 'catalog_categories';
  try {
    const q = query(collection(db, path), where('isActive', '==', true), orderBy('sortOrder', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CatalogCategory, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAllCategories(): Promise<CatalogCategory[]> {
  const path = 'catalog_categories';
  try {
    const q = query(collection(db, path), orderBy('sortOrder', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CatalogCategory, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveCategory(
  id: string,
  data: {
    slug: string;
    name: string;
    description?: string;
    imageUrl?: string;
    sortOrder: number;
    isActive: boolean;
  }
): Promise<void> {
  const path = `catalog_categories/${id}`;
  try {
    const ref = doc(db, 'catalog_categories', id);
    const existingSnap = await getDoc(ref);
    await setDoc(ref, {
      slug: clampString(data.slug, 64),
      name: clampString(data.name, 80),
      description: clampString(data.description || '', 300),
      imageUrl: clampString(data.imageUrl || '', 500),
      sortOrder: Math.max(0, Math.min(1000, Math.round(data.sortOrder))),
      isActive: Boolean(data.isActive),
      createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function initializeStandardCategories(): Promise<number> {
  const path = 'catalog_categories';
  try {
    const batch = writeBatch(db);
    let createdCount = 0;
    for (const cat of STANDARD_CATEGORIES) {
      const ref = doc(db, 'catalog_categories', cat.id);
      const existingSnap = await getDoc(ref);
      if (!existingSnap.exists()) {
        batch.set(ref, {
          slug: cat.slug,
          name: cat.name,
          description: cat.description,
          imageUrl: cat.imageUrl,
          sortOrder: cat.sortOrder,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        createdCount += 1;
      }
    }
    if (createdCount > 0) {
      await batch.commit();
    }
    return createdCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchPublishedProducts(): Promise<Product[]> {
  const path = 'products';
  try {
    const q = query(collection(db, path), where('isPublished', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchPublishedProductById(productId: string): Promise<Product | null> {
  const path = `products/${productId}`;
  try {
    const snap = await getDoc(doc(db, 'products', productId));
    if (!snap.exists()) return null;
    const data = snap.data() as Omit<Product, 'id'>;
    if (!data.isPublished) return null;
    return { id: snap.id, ...data };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchCollectionCount(collectionName: string): Promise<number> {
  try {
    const snap = await getCountFromServer(collection(db, collectionName));
    return snap.data().count;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
  }
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const [inquiriesSnap, quotationsSnap, salesOrdersSnap, purchaseOrdersSnap, deliveriesSnap] =
      await Promise.all([
        getDocs(collection(db, 'inquiries')),
        getDocs(collection(db, 'quotations')),
        getDocs(collection(db, 'sales_orders')),
        getDocs(collection(db, 'purchase_orders')),
        getDocs(collection(db, 'deliveries')),
      ]);

    const inquiries = inquiriesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Inquiry, 'id'>) }));
    const quotations = quotationsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Quotation, 'id'>) }));
    const salesOrders = salesOrdersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SalesOrder, 'id'>) }));
    const purchaseOrders = purchaseOrdersSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<PurchaseOrder, 'id'>),
    }));
    const deliveries = deliveriesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Delivery, 'id'>) }));

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const newInquiries = inquiries.filter((inq) => inq.status === 'NEW').length;
    const activeOrders = salesOrders.filter(
      (so) => so.status !== 'DELIVERED' && so.status !== 'CANCELLED'
    ).length;
    const pendingQuotations = quotations.filter(
      (q) => q.status === 'DRAFT' || q.status === 'SENT'
    ).length;

    let monthlySalesTotal = 0;
    let outstandingCustomerPayments = 0;
    for (const so of salesOrders) {
      if (so.status !== 'CANCELLED') {
        const unpaid = Math.max(0, (so.totalAmount || 0) - (so.paidAmount || 0));
        outstandingCustomerPayments += unpaid;

        const created =
          so.createdAt && typeof so.createdAt === 'object' && 'toDate' in so.createdAt
            ? so.createdAt.toDate()
            : null;
        if (created && created.getMonth() === currentMonth && created.getFullYear() === currentYear) {
          monthlySalesTotal += so.totalAmount || 0;
        }
      }
    }

    let outstandingSupplierPayments = 0;
    for (const po of purchaseOrders) {
      if (po.status !== 'CANCELLED') {
        outstandingSupplierPayments += Math.max(0, (po.totalAmount || 0) - (po.paidAmount || 0));
      }
    }

    const upcomingDeliveries = deliveries
      .filter((d) => d.status !== 'DELIVERED')
      .slice(0, 5)
      .map((d) => ({
        id: d.id,
        label: d.courierName ? `${d.courierName} (${d.salesOrderId})` : `Order ${d.salesOrderId}`,
        customerOrRecipient: d.recipientName,
        deadline: formatDateID(d.scheduledDate),
        status: d.status,
      }));

    return {
      totalInquiries: inquiries.length,
      newInquiries,
      activeOrders,
      pendingQuotations,
      monthlySalesTotal,
      outstandingCustomerPayments,
      outstandingSupplierPayments,
      upcomingDeliveries,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'dashboard_metrics');
  }
}

export async function seedDevelopmentDemoCatalog(): Promise<void> {
  if (!import.meta.env.DEV) {
    throw new Error('Demo seeding hanya diperbolehkan di lingkungan pengembangan (development).');
  }
  try {
    await initializeStandardCategories();
    const batch = writeBatch(db);
    for (const product of DEV_SAMPLE_PRODUCTS) {
      const ref = doc(db, 'products', product.id);
      const snap = await getDoc(ref);
      batch.set(ref, {
        productCode: product.productCode,
        name: product.name,
        categoryId: product.categoryId,
        categoryName: product.categoryName,
        photos: product.photos,
        description: product.description,
        specifications: product.specifications,
        availableColors: product.availableColors,
        availableSizes: product.availableSizes,
        customizationOptions: product.customizationOptions,
        minimumOrderQty: product.minimumOrderQty,
        startingPrice: product.startingPrice,
        estimatedLeadTimeDays: product.estimatedLeadTimeDays,
        isFeatured: product.isFeatured,
        isPublished: product.isPublished,
        createdAt: snap.exists() ? snap.data().createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products');
  }
}
