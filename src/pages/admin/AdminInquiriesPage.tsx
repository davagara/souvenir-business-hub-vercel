import { ExternalLink, FilePlus, MessageCircle, Search, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorefront } from '../../contexts/StorefrontContext';
import {
  fetchAllInquiriesAdmin,
  fetchInquiryItemsAdmin,
  updateInquiryStatusAdmin,
} from '../../services/inquiryService';
import { createQuotationWithItems, saveCustomer } from '../../services/operationsService';
import type { Inquiry, InquiryItem, InquiryStatus } from '../../types/models';
import { formatDateID, formatIDR, formatWhatsAppUrl } from '../../utils/formatters';

const INQUIRY_STATUSES: InquiryStatus[] = ['NEW', 'REVIEWED', 'QUOTED', 'CONVERTED', 'CLOSED'];

export function AdminInquiriesPage() {
  const { settings } = useStorefront();
  const navigate = useNavigate();

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [selectedItems, setSelectedItems] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | InquiryStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAllInquiriesAdmin();
      setInquiries(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInquiries();
  }, [loadInquiries]);

  const handleSelectInquiry = async (inq: Inquiry) => {
    setSelectedInquiry(inq);
    setLoadingItems(true);
    setMessage(null);
    try {
      const items = await fetchInquiryItemsAdmin(inq.id);
      setSelectedItems(items);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleStatusChange = async (inq: Inquiry, status: InquiryStatus) => {
    await updateInquiryStatusAdmin(inq.id, status);
    setMessage(`Status inquiry ${inq.inquiryNumber} diperbarui menjadi ${status}.`);
    setSelectedInquiry({ ...inq, status });
    await loadInquiries();
  };

  const handleSaveAsCustomer = async (inq: Inquiry) => {
    const customerId = await saveCustomer(inq.customerId || null, {
      name: inq.customerName,
      whatsappNumber: inq.whatsappNumber,
      companyOrEventName: inq.eventType,
      notes: `Dibuat dari Inquiry ${inq.inquiryNumber}`,
    });
    await updateInquiryStatusAdmin(inq.id, inq.status, customerId);
    setSelectedInquiry({ ...inq, customerId });
    setMessage(`Pelanggan "${inq.customerName}" berhasil disimpan dan ditautkan ke inquiry.`);
    await loadInquiries();
  };

  const handleCreateQuotation = async (inq: Inquiry) => {
    let customerId = inq.customerId;
    if (!customerId) {
      customerId = await saveCustomer(null, {
        name: inq.customerName,
        whatsappNumber: inq.whatsappNumber,
        companyOrEventName: inq.eventType,
      });
    }

    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 14);
    const quoNumber = `QUO-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    await createQuotationWithItems({
      quotationNumber: quoNumber,
      inquiryId: inq.id,
      customerId,
      customerName: inq.customerName,
      validUntil: validDate.toISOString().slice(0, 10),
      discountAmount: 0,
      notes: inq.notes || `Penawaran dari ${inq.inquiryNumber}`,
      items: selectedItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.indicativeUnitPrice,
        customizationSummary: [item.selectedColor, item.selectedSize, item.customizationDetails]
          .filter(Boolean)
          .join(' · '),
      })),
    });

    await updateInquiryStatusAdmin(inq.id, 'QUOTED', customerId);
    navigate('/admin/penawaran');
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return inquiries.filter((inq) => {
      if (statusFilter !== 'ALL' && inq.status !== statusFilter) return false;
      if (!q) return true;
      return (
        inq.inquiryNumber.toLowerCase().includes(q) ||
        inq.customerName.toLowerCase().includes(q) ||
        inq.whatsappNumber.toLowerCase().includes(q)
      );
    });
  }, [inquiries, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-[#1F2421]">
          Manajemen Inquiry
        </h1>
        <p className="text-sm text-[#4A524C] mt-1">
          Tinjau permintaan penawaran masuk, ubah status, simpan profil pelanggan, atau buat
          penawaran resmi.
        </p>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-[#E6ECE7] border border-[#CDD9CE] text-sm text-[#243027]">
          {message}
        </div>
      )}

      <div className="bg-white border border-[#E6DFD1] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#666F69] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor inquiry, nama, atau WhatsApp..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-[#4A5F4E] text-white' : 'bg-[#F3EFE6] text-[#3E4641]'
            }`}
          >
            Semua
          </button>
          {INQUIRY_STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                statusFilter === st ? 'bg-[#4A5F4E] text-white' : 'bg-[#F3EFE6] text-[#3E4641]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-[#E6DFD1] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-sm text-[#666F69]">Memuat daftar inquiry...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-[#1F2421] mb-1">Belum ada inquiry</p>
              <p className="text-xs text-[#666F69]">
                Inquiry yang dikirim pelanggan melalui keranjang publik akan tampil di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E6DFD1] bg-[#FAF8F4] text-xs text-[#666F69]">
                    <th className="py-3 px-4 font-medium">No. Inquiry</th>
                    <th className="py-3 px-4 font-medium">Pelanggan</th>
                    <th className="py-3 px-4 font-medium">Acara</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFE6]">
                  {filtered.map((inq) => (
                    <tr
                      key={inq.id}
                      onClick={() => void handleSelectInquiry(inq)}
                      className={`cursor-pointer transition-colors ${
                        selectedInquiry?.id === inq.id ? 'bg-[#E6ECE7]/60' : 'hover:bg-[#FAF8F4]'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-xs font-medium text-[#1F2421]">
                        {inq.inquiryNumber}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-[#1F2421]">{inq.customerName}</p>
                        <p className="text-xs font-mono text-[#666F69]">{inq.whatsappNumber}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#3E4641]">
                        <p>{inq.eventType}</p>
                        <p className="tabular-nums text-[#666F69]">{formatDateID(inq.eventDate)}</p>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-[#4A5F4E]">
                        {inq.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Drawer */}
        <div className="lg:col-span-5 bg-white border border-[#E6DFD1] rounded-xl p-6">
          {!selectedInquiry ? (
            <p className="text-sm text-[#666F69] text-center py-8">
              Pilih salah satu inquiry di sebelah kiri untuk melihat rincian produk dan tindakan.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#F3EFE6]">
                <div>
                  <p className="font-mono text-xs text-[#4A5F4E] font-medium">
                    {selectedInquiry.inquiryNumber}
                  </p>
                  <h2 className="text-lg font-semibold text-[#1F2421] mt-0.5">
                    {selectedInquiry.customerName}
                  </h2>
                  <p className="text-xs text-[#666F69] mt-0.5">
                    {selectedInquiry.eventType} · Acara {formatDateID(selectedInquiry.eventDate)}
                  </p>
                </div>

                <select
                  value={selectedInquiry.status}
                  onChange={(e) =>
                    void handleStatusChange(selectedInquiry, e.target.value as InquiryStatus)
                  }
                  className="px-2.5 py-1.5 rounded-lg border border-[#CDD9CE] bg-[#FAF8F4] text-xs font-semibold text-[#1F2421]"
                >
                  {INQUIRY_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInquiry.notes && (
                <div className="bg-[#FAF8F4] border border-[#E6DFD1] rounded-lg p-3 text-xs text-[#3E4641]">
                  <span className="font-semibold">Catatan: </span>
                  {selectedInquiry.notes}
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-[#1F2421] mb-2">
                  Item Produk ({selectedInquiry.itemCount})
                </h3>
                {loadingItems ? (
                  <p className="text-xs text-[#666F69]">Memuat rincian item...</p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-xs space-y-1"
                      >
                        <div className="flex justify-between gap-2 font-medium text-[#1F2421]">
                          <span>
                            {item.productName} ({item.productCode})
                          </span>
                          <span className="tabular-nums shrink-0">{item.quantity} pcs</span>
                        </div>
                        <p className="text-[#4A524C]">
                          {[item.selectedColor, item.selectedSize].filter(Boolean).join(' · ') ||
                            'Standar'}{' '}
                          · Est. {formatIDR(item.indicativeUnitPrice)}/pcs
                        </p>
                        {item.customizationDetails && (
                          <p className="text-[#3E4641]">Kustom: {item.customizationDetails}</p>
                        )}
                        {item.artworkReferenceUrl && (
                          <a
                            href={item.artworkReferenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#4A5F4E] underline"
                          >
                            <span>Lihat Referensi Desain</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={formatWhatsAppUrl(
                    selectedInquiry.whatsappNumber,
                    `Halo Kak ${selectedInquiry.customerName}, kami dari ${settings.businessName} menindaklanjuti inquiry ${selectedInquiry.inquiryNumber}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium hover:bg-[#3B4D3F]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Hubungi Pelanggan via WhatsApp</span>
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveAsCustomer(selectedInquiry)}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-[#CDD9CE] text-xs font-medium text-[#1F2421] hover:bg-[#FAF8F4] cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Simpan Pelanggan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCreateQuotation(selectedInquiry)}
                    disabled={loadingItems || selectedItems.length === 0}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#1F2421] text-white text-xs font-medium hover:bg-[#3E4641] disabled:opacity-50 cursor-pointer"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>Buat Penawaran</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
