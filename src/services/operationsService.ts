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
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import type {
  Customer,
  CustomerPayment,
  Delivery,
  DeliveryStatus,
  Expense,
  Inspection,
  InspectionStatus,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  Quotation,
  QuotationItem,
  QuotationStatus,
  SalesOrder,
  SalesOrderItem,
  SalesOrderStatus,
  Supplier,
  SupplierPayment,
  SupplierProduct,
} from '../types/models';
import { clampString } from '../utils/validation';

function makeDocId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

async function logAdminActivity(action: string, entityType: string, entityId: string, summary: string) {
  const user = auth.currentUser;
  if (!user || !user.email) return;
  try {
    const id = makeDocId('log');
    await setDoc(doc(db, 'activity_logs', id), {
      actorUid: user.uid,
      actorEmail: user.email,
      action: clampString(action, 120),
      entityType: clampString(entityType, 60),
      entityId: clampString(entityId, 128),
      summary: clampString(summary, 500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Non-blocking audit log
  }
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
export async function fetchAllCustomers(): Promise<Customer[]> {
  const path = 'customers';
  try {
    const q = query(collection(db, path), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Customer, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveCustomer(
  customerId: string | null,
  input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = customerId || makeDocId('cust');
  const path = `customers/${id}`;
  try {
    const ref = doc(db, 'customers', id);
    const snap = await getDoc(ref);
    await setDoc(ref, {
      name: clampString(input.name, 120),
      whatsappNumber: clampString(input.whatsappNumber, 25),
      email: clampString(input.email || '', 150),
      companyOrEventName: clampString(input.companyOrEventName || '', 150),
      city: clampString(input.city || '', 80),
      notes: clampString(input.notes || '', 1000),
      createdAt: snap.exists() ? snap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logAdminActivity(snap.exists() ? 'UPDATE_CUSTOMER' : 'CREATE_CUSTOMER', 'customers', id, input.name);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const path = `customers/${customerId}`;
  try {
    await deleteDoc(doc(db, 'customers', customerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// Suppliers & Confidential Supplier Products
// ---------------------------------------------------------------------------
export async function fetchAllSuppliers(): Promise<Supplier[]> {
  const path = 'suppliers';
  try {
    const q = query(collection(db, path), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Supplier, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveSupplier(
  supplierId: string | null,
  input: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = supplierId || makeDocId('sup');
  const path = `suppliers/${id}`;
  try {
    const ref = doc(db, 'suppliers', id);
    const snap = await getDoc(ref);
    await setDoc(ref, {
      supplierCode: clampString(input.supplierCode.toUpperCase(), 40),
      name: clampString(input.name, 140),
      contactPerson: clampString(input.contactPerson || '', 100),
      phone: clampString(input.phone, 25),
      city: clampString(input.city || '', 80),
      specialty: clampString(input.specialty || '', 200),
      isActive: Boolean(input.isActive),
      notes: clampString(input.notes || '', 1000),
      createdAt: snap.exists() ? snap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logAdminActivity(snap.exists() ? 'UPDATE_SUPPLIER' : 'CREATE_SUPPLIER', 'suppliers', id, input.name);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchAllSupplierProducts(): Promise<SupplierProduct[]> {
  const path = 'supplier_products';
  try {
    const q = query(collection(db, path), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SupplierProduct, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveSupplierProduct(
  spId: string | null,
  input: Omit<SupplierProduct, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = spId || makeDocId('sp');
  const path = `supplier_products/${id}`;
  try {
    const ref = doc(db, 'supplier_products', id);
    const snap = await getDoc(ref);
    await setDoc(ref, {
      supplierId: input.supplierId,
      productId: input.productId,
      supplierSku: clampString(input.supplierSku || '', 60),
      baseCostPrice: Math.max(0, Number(input.baseCostPrice) || 0),
      printingCostPerUnit: Math.max(0, Number(input.printingCostPerUnit) || 0),
      minOrderQty: Math.max(1, Math.round(Number(input.minOrderQty) || 1)),
      leadTimeDays: Math.max(1, Math.round(Number(input.leadTimeDays) || 7)),
      notes: clampString(input.notes || '', 500),
      createdAt: snap.exists() ? snap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSupplierProduct(spId: string): Promise<void> {
  const path = `supplier_products/${spId}`;
  try {
    await deleteDoc(doc(db, 'supplier_products', spId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// Quotations
// ---------------------------------------------------------------------------
export async function fetchAllQuotations(): Promise<Quotation[]> {
  const path = 'quotations';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Quotation, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchQuotationItems(quotationId: string): Promise<QuotationItem[]> {
  const path = 'quotation_items';
  try {
    const q = query(collection(db, path), where('quotationId', '==', quotationId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<QuotationItem, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createQuotationWithItems(input: {
  quotationNumber: string;
  inquiryId?: string;
  customerId: string;
  customerName: string;
  validUntil: string;
  discountAmount: number;
  notes: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    customizationSummary?: string;
  }>;
}): Promise<string> {
  const quotationId = makeDocId('quo');
  const path = `quotations/${quotationId}`;
  try {
    const batch = writeBatch(db);
    const subtotal = input.items.reduce(
      (sum, item) => sum + Math.max(0, item.quantity) * Math.max(0, item.unitPrice),
      0
    );
    const discount = Math.max(0, Number(input.discountAmount) || 0);
    const totalAmount = Math.max(0, subtotal - discount);

    const quoPayload: Record<string, unknown> = {
      quotationNumber: clampString(input.quotationNumber, 40),
      customerId: input.customerId,
      customerName: clampString(input.customerName, 120),
      status: 'DRAFT',
      validUntil: clampString(input.validUntil, 25),
      subtotal,
      discountAmount: discount,
      totalAmount,
      notes: clampString(input.notes || '', 1500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input.inquiryId) {
      quoPayload.inquiryId = input.inquiryId;
    }

    batch.set(doc(db, 'quotations', quotationId), quoPayload);

    input.items.forEach((item, idx) => {
      const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
      const price = Math.max(0, Number(item.unitPrice) || 0);
      batch.set(doc(db, 'quotation_items', `${quotationId}-item-${idx + 1}`), {
        quotationId,
        productId: item.productId,
        productName: clampString(item.productName, 140),
        quantity: qty,
        unitPrice: price,
        lineTotal: qty * price,
        customizationSummary: clampString(item.customizationSummary || '', 500),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    await logAdminActivity('CREATE_QUOTATION', 'quotations', quotationId, input.quotationNumber);
    return quotationId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateQuotationStatus(quotationId: string, status: QuotationStatus): Promise<void> {
  const path = `quotations/${quotationId}`;
  try {
    const ref = doc(db, 'quotations', quotationId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Penawaran tidak ditemukan.');
    const existing = snap.data();
    await setDoc(ref, {
      ...existing,
      status,
      updatedAt: serverTimestamp(),
    });
    await logAdminActivity('UPDATE_QUOTATION_STATUS', 'quotations', quotationId, status);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------------------------------------------------------------------
// Sales Orders, Inspections & Deliveries
// ---------------------------------------------------------------------------
export async function fetchAllSalesOrders(): Promise<SalesOrder[]> {
  const path = 'sales_orders';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SalesOrder, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchSalesOrderItems(salesOrderId: string): Promise<SalesOrderItem[]> {
  const path = 'sales_order_items';
  try {
    const q = query(collection(db, path), where('salesOrderId', '==', salesOrderId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SalesOrderItem, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createSalesOrderWithItems(input: {
  orderNumber: string;
  quotationId?: string;
  customerId: string;
  customerName: string;
  eventDate?: string;
  deliveryDeadline?: string;
  notes?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitSellingPrice: number;
    customizationSummary?: string;
  }>;
}): Promise<string> {
  const orderId = makeDocId('so');
  const path = `sales_orders/${orderId}`;
  try {
    const batch = writeBatch(db);
    const totalAmount = input.items.reduce(
      (sum, item) => sum + Math.max(1, item.quantity) * Math.max(0, item.unitSellingPrice),
      0
    );

    const orderPayload: Record<string, unknown> = {
      orderNumber: clampString(input.orderNumber, 40),
      customerId: input.customerId,
      customerName: clampString(input.customerName, 120),
      eventDate: clampString(input.eventDate || '', 25),
      deliveryDeadline: clampString(input.deliveryDeadline || '', 25),
      status: 'CONFIRMED',
      totalAmount,
      paidAmount: 0,
      notes: clampString(input.notes || '', 1500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input.quotationId) {
      orderPayload.quotationId = input.quotationId;
    }

    batch.set(doc(db, 'sales_orders', orderId), orderPayload);

    input.items.forEach((item, idx) => {
      const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
      const price = Math.max(0, Number(item.unitSellingPrice) || 0);
      batch.set(doc(db, 'sales_order_items', `${orderId}-item-${idx + 1}`), {
        salesOrderId: orderId,
        productId: item.productId,
        productName: clampString(item.productName, 140),
        quantity: qty,
        unitSellingPrice: price,
        lineTotal: qty * price,
        customizationSummary: clampString(item.customizationSummary || '', 500),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    await logAdminActivity('CREATE_SALES_ORDER', 'sales_orders', orderId, input.orderNumber);
    return orderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateSalesOrderStatus(orderId: string, status: SalesOrderStatus): Promise<void> {
  const path = `sales_orders/${orderId}`;
  try {
    const ref = doc(db, 'sales_orders', orderId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Pesanan penjualan tidak ditemukan.');
    await setDoc(ref, {
      ...snap.data(),
      status,
      updatedAt: serverTimestamp(),
    });
    await logAdminActivity('UPDATE_SALES_ORDER_STATUS', 'sales_orders', orderId, status);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchAllInspections(): Promise<Inspection[]> {
  const path = 'inspections';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Inspection, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveInspection(input: {
  salesOrderId: string;
  purchaseOrderId?: string;
  status: InspectionStatus;
  inspectedBy: string;
  inspectionDate: string;
  notes: string;
}): Promise<string> {
  const id = makeDocId('qc');
  const path = `inspections/${id}`;
  try {
    const payload: Record<string, unknown> = {
      salesOrderId: input.salesOrderId,
      status: input.status,
      inspectedBy: clampString(input.inspectedBy, 120),
      inspectionDate: clampString(input.inspectionDate, 25),
      notes: clampString(input.notes, 1000),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (input.purchaseOrderId) payload.purchaseOrderId = input.purchaseOrderId;
    await setDoc(doc(db, 'inspections', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchAllDeliveries(): Promise<Delivery[]> {
  const path = 'deliveries';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Delivery, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveDelivery(
  deliveryId: string | null,
  input: {
    salesOrderId: string;
    recipientName: string;
    address: string;
    scheduledDate: string;
    status: DeliveryStatus;
    courierName?: string;
    trackingNumber?: string;
  }
): Promise<string> {
  const id = deliveryId || makeDocId('del');
  const path = `deliveries/${id}`;
  try {
    const ref = doc(db, 'deliveries', id);
    const snap = await getDoc(ref);
    await setDoc(ref, {
      salesOrderId: input.salesOrderId,
      recipientName: clampString(input.recipientName, 120),
      address: clampString(input.address, 300),
      scheduledDate: clampString(input.scheduledDate, 25),
      status: input.status,
      courierName: clampString(input.courierName || '', 100),
      trackingNumber: clampString(input.trackingNumber || '', 100),
      createdAt: snap.exists() ? snap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------------------------------------------------------------------
// Purchase Orders
// ---------------------------------------------------------------------------
export async function fetchAllPurchaseOrders(): Promise<PurchaseOrder[]> {
  const path = 'purchase_orders';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PurchaseOrder, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchPurchaseOrderItems(poId: string): Promise<PurchaseOrderItem[]> {
  const path = 'purchase_order_items';
  try {
    const q = query(collection(db, path), where('purchaseOrderId', '==', poId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PurchaseOrderItem, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createPurchaseOrderWithItems(input: {
  poNumber: string;
  salesOrderId: string;
  supplierId: string;
  supplierName: string;
  expectedCompletionDate?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPurchasePrice: number;
  }>;
}): Promise<string> {
  const poId = makeDocId('po');
  const path = `purchase_orders/${poId}`;
  try {
    const batch = writeBatch(db);
    const totalAmount = input.items.reduce(
      (sum, item) => sum + Math.max(1, item.quantity) * Math.max(0, item.unitPurchasePrice),
      0
    );

    batch.set(doc(db, 'purchase_orders', poId), {
      poNumber: clampString(input.poNumber, 40),
      salesOrderId: input.salesOrderId,
      supplierId: input.supplierId,
      supplierName: clampString(input.supplierName, 140),
      status: 'ORDERED',
      totalAmount,
      paidAmount: 0,
      expectedCompletionDate: clampString(input.expectedCompletionDate || '', 25),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    input.items.forEach((item, idx) => {
      const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
      const price = Math.max(0, Number(item.unitPurchasePrice) || 0);
      batch.set(doc(db, 'purchase_order_items', `${poId}-item-${idx + 1}`), {
        purchaseOrderId: poId,
        productId: item.productId,
        productName: clampString(item.productName, 140),
        quantity: qty,
        unitPurchasePrice: price,
        lineTotal: qty * price,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    await logAdminActivity('CREATE_PURCHASE_ORDER', 'purchase_orders', poId, input.poNumber);
    return poId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updatePurchaseOrderStatus(poId: string, status: PurchaseOrderStatus): Promise<void> {
  const path = `purchase_orders/${poId}`;
  try {
    const ref = doc(db, 'purchase_orders', poId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Purchase Order tidak ditemukan.');
    await setDoc(ref, {
      ...snap.data(),
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------------------------------------------------------------------
// Finance: Customer Payments, Supplier Payments, Expenses
// ---------------------------------------------------------------------------
export async function fetchAllCustomerPayments(): Promise<CustomerPayment[]> {
  const path = 'customer_payments';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CustomerPayment, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function recordCustomerPayment(input: {
  salesOrderId: string;
  customerId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
}): Promise<string> {
  const id = makeDocId('cpay');
  const path = `customer_payments/${id}`;
  try {
    const soRef = doc(db, 'sales_orders', input.salesOrderId);
    const soSnap = await getDoc(soRef);
    const batch = writeBatch(db);

    const amount = Math.max(0, Number(input.amount) || 0);
    batch.set(doc(db, 'customer_payments', id), {
      salesOrderId: input.salesOrderId,
      customerId: input.customerId,
      amount,
      paymentMethod: clampString(input.paymentMethod, 60),
      paymentDate: clampString(input.paymentDate, 25),
      referenceNumber: clampString(input.referenceNumber || '', 80),
      notes: clampString(input.notes || '', 500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (soSnap.exists()) {
      const soData = soSnap.data();
      batch.set(soRef, {
        ...soData,
        paidAmount: Math.max(0, (Number(soData.paidAmount) || 0) + amount),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchAllSupplierPayments(): Promise<SupplierPayment[]> {
  const path = 'supplier_payments';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SupplierPayment, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function recordSupplierPayment(input: {
  purchaseOrderId: string;
  supplierId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
}): Promise<string> {
  const id = makeDocId('spay');
  const path = `supplier_payments/${id}`;
  try {
    const poRef = doc(db, 'purchase_orders', input.purchaseOrderId);
    const poSnap = await getDoc(poRef);
    const batch = writeBatch(db);

    const amount = Math.max(0, Number(input.amount) || 0);
    batch.set(doc(db, 'supplier_payments', id), {
      purchaseOrderId: input.purchaseOrderId,
      supplierId: input.supplierId,
      amount,
      paymentMethod: clampString(input.paymentMethod, 60),
      paymentDate: clampString(input.paymentDate, 25),
      referenceNumber: clampString(input.referenceNumber || '', 80),
      notes: clampString(input.notes || '', 500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (poSnap.exists()) {
      const poData = poSnap.data();
      batch.set(poRef, {
        ...poData,
        paidAmount: Math.max(0, (Number(poData.paidAmount) || 0) + amount),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchAllExpenses(): Promise<Expense[]> {
  const path = 'expenses';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Expense, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveExpense(input: {
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
}): Promise<string> {
  const id = makeDocId('exp');
  const path = `expenses/${id}`;
  try {
    await setDoc(doc(db, 'expenses', id), {
      category: clampString(input.category, 80),
      description: clampString(input.description, 300),
      amount: Math.max(0, Number(input.amount) || 0),
      expenseDate: clampString(input.expenseDate, 25),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
