import { CheckCircle2, Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  DEFAULT_OPERATIONS_SETTINGS,
  DEFAULT_STOREFRONT_SETTINGS,
} from '../../constants/catalogDefaults';
import {
  fetchOperationsSettings,
  fetchStorefrontSettings,
  saveOperationsSettings,
  saveStorefrontSettings,
} from '../../services/firestoreService';
import type { OperationsSettings, StorefrontSettings } from '../../types/models';
import { isValidEmail } from '../../utils/validation';

export function AdminSettingsPage() {
  const [storefront, setStorefront] = useState<StorefrontSettings>(DEFAULT_STOREFRONT_SETTINGS);
  const [operations, setOperations] = useState<OperationsSettings>(DEFAULT_OPERATIONS_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [sf, ops] = await Promise.all([
          fetchStorefrontSettings(),
          fetchOperationsSettings(),
        ]);
        if (!active) return;
        setStorefront(sf);
        setOperations(ops);
      } catch {
        if (active) setError('Gagal memuat pengaturan bisnis dari Firestore.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (storefront.businessName.trim().length < 2) {
      setError('Nama bisnis minimal 2 karakter.');
      return;
    }
    if (storefront.whatsappNumber.trim().length < 8) {
      setError('Nomor WhatsApp minimal 8 digit.');
      return;
    }
    if (!isValidEmail(operations.primaryOwnerEmail)) {
      setError('Email pemilik utama tidak valid.');
      return;
    }
    if (operations.secondaryOwnerEmail && !isValidEmail(operations.secondaryOwnerEmail)) {
      setError('Format email pemilik kedua tidak valid.');
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        saveStorefrontSettings({
          businessName: storefront.businessName,
          tagline: storefront.tagline,
          logoUrl: storefront.logoUrl,
          whatsappNumber: storefront.whatsappNumber,
          instagramHandle: storefront.instagramHandle,
          address: storefront.address,
          contactEmail: storefront.contactEmail,
          contactHours: storefront.contactHours,
          defaultCurrency: 'IDR',
        }),
        saveOperationsSettings({
          primaryOwnerEmail: operations.primaryOwnerEmail,
          secondaryOwnerEmail: operations.secondaryOwnerEmail,
          defaultQuotationValidityDays: Number(operations.defaultQuotationValidityDays) || 14,
          inquiryNumberFormat: operations.inquiryNumberFormat,
          quotationNumberFormat: operations.quotationNumberFormat,
          salesOrderNumberFormat: operations.salesOrderNumberFormat,
          purchaseOrderNumberFormat: operations.purchaseOrderNumberFormat,
        }),
      ]);
      setSuccess('Pengaturan bisnis berhasil disimpan ke Firestore.');
    } catch {
      setError('Gagal menyimpan pengaturan. Pastikan akun Anda berwenang.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E6DFD1] rounded-xl p-8 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-[#F3EFE6] rounded" />
        <div className="h-10 w-full bg-[#F3EFE6] rounded" />
        <div className="h-10 w-full bg-[#F3EFE6] rounded" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-[#1F2421]">
          Pengaturan Bisnis
        </h1>
        <p className="text-sm text-[#4A524C] mt-1">
          Kelola identitas brand publik, kontak WhatsApp, akses pemilik kedua, dan format penomoran
          dokumen resmi.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-[#E6ECE7] border border-[#CDD9CE] text-sm text-[#243027] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Storefront Section */}
      <div className="bg-white border border-[#E6DFD1] rounded-xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-[#1F2421] pb-3 border-b border-[#F3EFE6]">
          Identitas Brand & Kontak Publik
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="businessName" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              Nama Bisnis / Brand
            </label>
            <input
              id="businessName"
              type="text"
              required
              value={storefront.businessName}
              onChange={(e) => setStorefront({ ...storefront, businessName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm text-[#1F2421] focus:outline-none focus:border-[#4A5F4E]"
            />
          </div>

          <div>
            <label htmlFor="logoUrl" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              URL Logo Brand (Opsional)
            </label>
            <input
              id="logoUrl"
              type="text"
              value={storefront.logoUrl}
              onChange={(e) => setStorefront({ ...storefront, logoUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm text-[#1F2421] focus:outline-none focus:border-[#4A5F4E]"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="tagline" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              Deskripsi Singkat / Tagline
            </label>
            <input
              id="tagline"
              type="text"
              value={storefront.tagline}
              onChange={(e) => setStorefront({ ...storefront, tagline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm text-[#1F2421] focus:outline-none focus:border-[#4A5F4E]"
            />
          </div>

          <div>
            <label htmlFor="whatsappNumber" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              Nomor WhatsApp Bisnis
            </label>
            <input
              id="whatsappNumber"
              type="text"
              required
              value={storefront.whatsappNumber}
              onChange={(e) => setStorefront({ ...storefront, whatsappNumber: e.target.value })}
              placeholder="6281234567890"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm font-mono text-[#1F2421] focus:outline-none focus:border-[#4A5F4E]"
            />
          </div>

          <div>
            <label htmlFor="instagramHandle" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              Akun Instagram
            </label>
            <input
              id="instagramHandle"
              type="text"
              value={storefront.instagramHandle}
              onChange={(e) => setStorefront({ ...storefront, instagramHandle: e.target.value })}
              placeholder="@namabisnis"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm text-[#1F2421] focus:outline-none focus:border-[#4A5F4E]"
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              Email Kontak Bisnis
            </label>
            <input
              id="contactEmail"
              type="email"
              value={storefront.contactEmail}
              onChange={(e) => setStorefront({ ...storefront, contactEmail: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm text-[#1F2421] focus:outline-none focus:border-[#4A5F4E]"
            />
          </div>

          <div>
            <label htmlFor="contactHours" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              Jam Operasional
            </label>
            <input
              id="contactHours"
              type="text"
              value={storefront.contactHours}
              onChange={(e) => setStorefront({ ...storefront, contactHours: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm text-[#1F2421] focus:outline-none focus:border-[#4A5F4E]"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              Alamat Bisnis / Studio
            </label>
            <textarea
              id="address"
              rows={2}
              value={storefront.address}
              onChange={(e) => setStorefront({ ...storefront, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm text-[#1F2421] focus:outline-none focus:border-[#4A5F4E]"
            />
          </div>
        </div>
      </div>

      {/* Operations & Two-Owner Access Section */}
      <div className="bg-white border border-[#E6DFD1] rounded-xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-[#1F2421] pb-3 border-b border-[#F3EFE6]">
          Otorisasi Pemilik & Parameter Dokumen
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="primaryOwnerEmail" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              Email Google Pemilik 1 (Utama)
            </label>
            <input
              id="primaryOwnerEmail"
              type="email"
              required
              value={operations.primaryOwnerEmail}
              onChange={(e) =>
                setOperations({ ...operations, primaryOwnerEmail: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm text-[#1F2421] focus:outline-none focus:border-[#4A5F4E]"
            />
          </div>

          <div>
            <label htmlFor="secondaryOwnerEmail" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              Email Google Pemilik 2 (Opsional)
            </label>
            <input
              id="secondaryOwnerEmail"
              type="email"
              value={operations.secondaryOwnerEmail}
              onChange={(e) =>
                setOperations({ ...operations, secondaryOwnerEmail: e.target.value })
              }
              placeholder="mitra.pemilik@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm text-[#1F2421] focus:outline-none focus:border-[#4A5F4E]"
            />
          </div>

          <div>
            <label htmlFor="defaultCurrency" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              Mata Uang Default
            </label>
            <input
              id="defaultCurrency"
              type="text"
              readOnly
              value={storefront.defaultCurrency}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#F3EFE6] text-sm font-mono text-[#3E4641]"
            />
          </div>

          <div>
            <label htmlFor="validityDays" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              Masa Berlaku Penawaran Default (Hari)
            </label>
            <input
              id="validityDays"
              type="number"
              min={1}
              max={365}
              value={operations.defaultQuotationValidityDays}
              onChange={(e) =>
                setOperations({
                  ...operations,
                  defaultQuotationValidityDays: Number(e.target.value),
                })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums text-[#1F2421] focus:outline-none focus:border-[#4A5F4E]"
            />
          </div>

          <div>
            <label htmlFor="inqFmt" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              Format Nomor Inquiry
            </label>
            <input
              id="inqFmt"
              type="text"
              required
              value={operations.inquiryNumberFormat}
              onChange={(e) =>
                setOperations({ ...operations, inquiryNumberFormat: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm font-mono text-[#1F2421] focus:outline-none focus:border-[#4A5F4E]"
            />
          </div>

          <div>
            <label htmlFor="quoFmt" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              Format Nomor Penawaran (Quotation)
            </label>
            <input
              id="quoFmt"
              type="text"
              required
              value={operations.quotationNumberFormat}
              onChange={(e) =>
                setOperations({ ...operations, quotationNumberFormat: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm font-mono text-[#1F2421] focus:outline-none focus:border-[#4A5F4E]"
            />
          </div>

          <div>
            <label htmlFor="soFmt" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              Format Nomor Pesanan (Sales Order)
            </label>
            <input
              id="soFmt"
              type="text"
              required
              value={operations.salesOrderNumberFormat}
              onChange={(e) =>
                setOperations({ ...operations, salesOrderNumberFormat: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm font-mono text-[#1F2421] focus:outline-none focus:border-[#4A5F4E]"
            />
          </div>

          <div>
            <label htmlFor="poFmt" className="block text-xs font-medium text-[#1F2421] mb-1.5">
              Format Nomor Pembelian (Purchase Order)
            </label>
            <input
              id="poFmt"
              type="text"
              required
              value={operations.purchaseOrderNumberFormat}
              onChange={(e) =>
                setOperations({ ...operations, purchaseOrderNumberFormat: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm font-mono text-[#1F2421] focus:outline-none focus:border-[#4A5F4E]"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#4A5F4E] text-white text-sm font-medium hover:bg-[#3B4D3F] disabled:opacity-50 transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
        </button>
      </div>
    </form>
  );
}
