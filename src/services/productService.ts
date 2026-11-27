import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import type { Product } from '../types/models';
import { clampString } from '../utils/validation';

export interface ProductInput {
  productCode: string;
  name: string;
  categoryId: string;
  categoryName: string;
  photos: string[];
  description: string;
  specifications?: string;
  availableColors?: string[];
  availableSizes?: string[];
  customizationOptions?: string[];
  minimumOrderQty: number;
  startingPrice: number;
  estimatedLeadTimeDays: number;
  isFeatured: boolean;
  isPublished: boolean;
}

export async function fetchAllProductsAdmin(): Promise<Product[]> {
  const path = 'products';
  try {
    const q = query(collection(db, path), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveProductAdmin(productId: string | null, input: ProductInput): Promise<string> {
  const cleanId =
    productId ||
    `prod-${input.productCode.toLowerCase().replace(/[^a-z0-9-]+/g, '-')}-${Date.now().toString(36)}`;
  const path = `products/${cleanId}`;

  try {
    const docRef = doc(db, 'products', cleanId);
    const existingSnap = await getDoc(docRef);

    const photos = input.photos
      .map((u) => clampString(u, 500))
      .filter(Boolean)
      .slice(0, 10);

    const colors = (input.availableColors || [])
      .map((c) => clampString(c, 60))
      .filter(Boolean)
      .slice(0, 20);

    const sizes = (input.availableSizes || [])
      .map((s) => clampString(s, 60))
      .filter(Boolean)
      .slice(0, 20);

    const customizations = (input.customizationOptions || [])
      .map((o) => clampString(o, 120))
      .filter(Boolean)
      .slice(0, 20);

    const payload: Record<string, unknown> = {
      productCode: clampString(input.productCode.toUpperCase().replace(/[^A-Z0-9-]/g, '-'), 40),
      name: clampString(input.name, 140),
      categoryId: clampString(input.categoryId, 128),
      categoryName: clampString(input.categoryName, 80),
      photos,
      description: clampString(input.description, 2000),
      specifications: clampString(input.specifications || '', 1000),
      availableColors: colors,
      availableSizes: sizes,
      customizationOptions: customizations,
      minimumOrderQty: Math.max(1, Math.min(100000, Math.round(Number(input.minimumOrderQty) || 1))),
      startingPrice: Math.max(0, Number(input.startingPrice) || 0),
      estimatedLeadTimeDays: Math.max(
        1,
        Math.min(365, Math.round(Number(input.estimatedLeadTimeDays) || 7))
      ),
      isFeatured: Boolean(input.isFeatured),
      isPublished: Boolean(input.isPublished),
      createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, payload);
    return cleanId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function toggleProductPublish(product: Product): Promise<void> {
  await saveProductAdmin(product.id, {
    productCode: product.productCode,
    name: product.name,
    categoryId: product.categoryId,
    categoryName: product.categoryName,
    photos: product.photos || [],
    description: product.description || '',
    specifications: product.specifications || '',
    availableColors: product.availableColors || [],
    availableSizes: product.availableSizes || [],
    customizationOptions: product.customizationOptions || [],
    minimumOrderQty: product.minimumOrderQty,
    startingPrice: product.startingPrice,
    estimatedLeadTimeDays: product.estimatedLeadTimeDays,
    isFeatured: product.isFeatured,
    isPublished: !product.isPublished,
  });
}

export async function toggleProductFeatured(product: Product): Promise<void> {
  await saveProductAdmin(product.id, {
    productCode: product.productCode,
    name: product.name,
    categoryId: product.categoryId,
    categoryName: product.categoryName,
    photos: product.photos || [],
    description: product.description || '',
    specifications: product.specifications || '',
    availableColors: product.availableColors || [],
    availableSizes: product.availableSizes || [],
    customizationOptions: product.customizationOptions || [],
    minimumOrderQty: product.minimumOrderQty,
    startingPrice: product.startingPrice,
    estimatedLeadTimeDays: product.estimatedLeadTimeDays,
    isFeatured: !product.isFeatured,
    isPublished: product.isPublished,
  });
}

export async function deleteProductAdmin(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function uploadProductPhotoToStorage(file: File, productCode: string): Promise<string> {
  const safeCode = (productCode || 'product').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30) || 'product';
  const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || 'jpg';
  const filePath = `products/${safeCode}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const ref = storageRef(storage, filePath);
  await uploadBytes(ref, file);
  return await getDownloadURL(ref);
}
