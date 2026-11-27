import type { FieldValue, Timestamp } from 'firebase/firestore';

export type FirestoreDate = Timestamp | FieldValue | string | Date | null | undefined;

export type InquiryStatus = 'NEW' | 'REVIEWED' | 'QUOTED' | 'CONVERTED' | 'CLOSED';
export type QuotationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type SalesOrderStatus =
  | 'CONFIRMED'
  | 'IN_PRODUCTION'
  | 'QC_PENDING'
  | 'READY_TO_SHIP'
  | 'DELIVERED'
  | 'CANCELLED';
export type PurchaseOrderStatus = 'DRAFT' | 'ORDERED' | 'IN_PRODUCTION' | 'COMPLETED' | 'CANCELLED';
export type InspectionStatus = 'PENDING' | 'PASSED' | 'REVISION_NEEDED';
export type DeliveryStatus = 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED';

export interface UserAccount {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'owner';
  isActive: boolean;
  photoUrl?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface StorefrontSettings {
  businessName: string;
  tagline: string;
  logoUrl: string;
  whatsappNumber: string;
  instagramHandle: string;
  address: string;
  contactEmail: string;
  contactHours: string;
  defaultCurrency: 'IDR';
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface OperationsSettings {
  primaryOwnerEmail: string;
  secondaryOwnerEmail: string;
  defaultQuotationValidityDays: number;
  inquiryNumberFormat: string;
  quotationNumberFormat: string;
  salesOrderNumberFormat: string;
  purchaseOrderNumberFormat: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface CatalogCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface Product {
  id: string;
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
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface Customer {
  id: string;
  name: string;
  whatsappNumber: string;
  email?: string;
  companyOrEventName?: string;
  city?: string;
  notes?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  contactPerson?: string;
  phone: string;
  city?: string;
  specialty?: string;
  isActive: boolean;
  notes?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface SupplierProduct {
  id: string;
  supplierId: string;
  productId: string;
  supplierSku?: string;
  baseCostPrice: number;
  printingCostPerUnit?: number;
  minOrderQty: number;
  leadTimeDays: number;
  notes?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface Inquiry {
  id: string;
  inquiryNumber: string;
  customerName: string;
  whatsappNumber: string;
  eventType: string;
  eventDate: string;
  notes?: string;
  status: InquiryStatus;
  itemCount: number;
  customerId?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface InquiryItem {
  id: string;
  inquiryId: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  customizationDetails?: string;
  artworkReferenceUrl?: string;
  indicativeUnitPrice: number;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  inquiryId?: string;
  customerId: string;
  customerName: string;
  status: QuotationStatus;
  validUntil: string;
  subtotal: number;
  discountAmount?: number;
  totalAmount: number;
  notes?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  customizationSummary?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  quotationId?: string;
  customerId: string;
  customerName: string;
  eventDate?: string;
  deliveryDeadline?: string;
  status: SalesOrderStatus;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitSellingPrice: number;
  lineTotal: number;
  customizationSummary?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  salesOrderId: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  paidAmount: number;
  expectedCompletionDate?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPurchasePrice: number;
  lineTotal: number;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface CustomerPayment {
  id: string;
  salesOrderId: string;
  customerId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface SupplierPayment {
  id: string;
  purchaseOrderId: string;
  supplierId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface Inspection {
  id: string;
  salesOrderId: string;
  purchaseOrderId?: string;
  status: InspectionStatus;
  inspectedBy?: string;
  inspectionDate?: string;
  notes?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface Delivery {
  id: string;
  salesOrderId: string;
  recipientName: string;
  address: string;
  scheduledDate: string;
  status: DeliveryStatus;
  courierName?: string;
  trackingNumber?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface ActivityLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface InquiryCartItem {
  cartKey: string;
  productId: string;
  productCode: string;
  productName: string;
  photoUrl: string;
  minimumOrderQty: number;
  startingPrice: number;
  quantity: number;
  selectedColor: string;
  selectedSize: string;
  customizationDetails: string;
  artworkReferenceUrl: string;
}

export interface DashboardMetrics {
  totalInquiries: number;
  newInquiries: number;
  activeOrders: number;
  pendingQuotations: number;
  monthlySalesTotal: number;
  outstandingCustomerPayments: number;
  outstandingSupplierPayments: number;
  upcomingDeliveries: Array<{
    id: string;
    label: string;
    customerOrRecipient: string;
    deadline: string;
    status: string;
  }>;
}
