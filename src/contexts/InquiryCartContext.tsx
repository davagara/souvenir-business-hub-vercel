import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { InquiryCartItem, Product } from '../types/models';

const CART_STORAGE_KEY = 'sbh_inquiry_cart_v1';

interface AddToCartOptions {
  quantity?: number;
  selectedColor?: string;
  selectedSize?: string;
  customizationDetails?: string;
  artworkReferenceUrl?: string;
}

interface InquiryCartContextValue {
  items: InquiryCartItem[];
  totalItemCount: number;
  addItem: (product: Product, options?: AddToCartOptions) => void;
  updateItemQuantity: (cartKey: string, quantity: number) => void;
  updateItemDetails: (
    cartKey: string,
    patch: Partial<Pick<InquiryCartItem, 'selectedColor' | 'selectedSize' | 'customizationDetails' | 'artworkReferenceUrl'>>
  ) => void;
  removeItem: (cartKey: string) => void;
  clearCart: () => void;
}

const InquiryCartContext = createContext<InquiryCartContextValue | undefined>(undefined);

function loadStoredCart(): InquiryCartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as InquiryCartItem[]) : [];
  } catch {
    return [];
  }
}

export function InquiryCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InquiryCartItem[]>(loadStoredCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors
    }
  }, [items]);

  const addItem = (product: Product, options?: AddToCartOptions) => {
    const selectedColor = options?.selectedColor || product.availableColors?.[0] || '';
    const selectedSize = options?.selectedSize || product.availableSizes?.[0] || '';
    const quantity = Math.max(product.minimumOrderQty || 1, options?.quantity || product.minimumOrderQty || 1);
    const cartKey = `${product.id}__${selectedColor}__${selectedSize}`;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.cartKey === cartKey);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
          customizationDetails:
            options?.customizationDetails || next[existingIndex].customizationDetails,
          artworkReferenceUrl:
            options?.artworkReferenceUrl || next[existingIndex].artworkReferenceUrl,
        };
        return next;
      }
      return [
        ...prev,
        {
          cartKey,
          productId: product.id,
          productCode: product.productCode,
          productName: product.name,
          photoUrl: product.photos?.[0] || '',
          minimumOrderQty: product.minimumOrderQty || 1,
          startingPrice: product.startingPrice || 0,
          quantity,
          selectedColor,
          selectedSize,
          customizationDetails: options?.customizationDetails || '',
          artworkReferenceUrl: options?.artworkReferenceUrl || '',
        },
      ];
    });
  };

  const updateItemQuantity = (cartKey: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.cartKey === cartKey
          ? { ...item, quantity: Math.max(1, Math.round(quantity || 1)) }
          : item
      )
    );
  };

  const updateItemDetails = (
    cartKey: string,
    patch: Partial<
      Pick<InquiryCartItem, 'selectedColor' | 'selectedSize' | 'customizationDetails' | 'artworkReferenceUrl'>
    >
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.cartKey === cartKey ? { ...item, ...patch } : item))
    );
  };

  const removeItem = (cartKey: string) => {
    setItems((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const clearCart = () => setItems([]);

  return (
    <InquiryCartContext.Provider
      value={{
        items,
        totalItemCount: items.length,
        addItem,
        updateItemQuantity,
        updateItemDetails,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </InquiryCartContext.Provider>
  );
}

export function useInquiryCart(): InquiryCartContextValue {
  const ctx = useContext(InquiryCartContext);
  if (!ctx) {
    throw new Error('useInquiryCart must be used within InquiryCartProvider');
  }
  return ctx;
}
