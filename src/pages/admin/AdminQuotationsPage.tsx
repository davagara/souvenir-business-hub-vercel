import { ArrowRightCircle, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createQuotationWithItems,
  createSalesOrderWithItems,
  fetchAllCustomers,
  fetchAllQuotations,
  fetchQuotationItems,
  updateQuotationStatus,
} from '../../services/operationsService';
import { fetchAllProductsAdmin } from '../../services/productService';
import type { Customer, Product, Quotation, QuotationItem, QuotationStatus } from '../../types/models';
import { formatDateID, formatIDR } from '../../utils/formatters';

const QUOTATION_STATUSES: QuotationStatus[] = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'];

export function AdminQuotationsPage() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [selectedItems, setSelectedItems] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(50);
  const [unitPrice, setUnitPrice] = useState(35000);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [quos, custs, prods] = await Promise.all([
        fetchAllQuotations(),
        fetchAllCustomers(),
        fetchAllProductsAdmin(),
      ]);
      setQuotations(quos);
      setCustomers(custs);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSelect = async (q: Quotation) => {
    setSelectedQuotation(q);
    const items = await fetchQuotationItems(q.id);
    setSelectedItems(items);
  };

  const openNew = () => {
    const valid = new Date();
    valid.setDate(valid.getDate() + 14);
    setCustomerId(customers[0]?.id || '');
    setProductId(products[0]?.id || '');
    setQuantity(products[0]?.minimumOrderQty || 50);
    setUnitPrice(products[0]?.startingPrice || 35000);
    setDiscountAmount(0);
    setValidUntil(valid.toISOString().slice(0, 10));
    setNotes('');
    setShowForm(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId);
    const prod = products.find((p) => p.id === productId);
    if (!cust || !prod) return;

    const quoNumber = `QUO-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    await createQuotationWithItems({
      quotationNumber: quoNumber,
      customerId: cust.id,
      customerName: cust.name,
      validUntil,
      discountAmount,
      notes,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          quantity,
          unitPrice,
        },
      ],
    });
    setShowForm(false);
    setMessage(`Penawaran ${quoNumber} berhasil dibuat.`);
    await load();
  };

  const handleConvertToOrder = async (q: Quotation) => {
    const items = selectedItems.length ? selectedItems : await fetchQuotationItems(q.id);
    const orderNumber = `SO-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    await createSalesOrderWithItems({
      orderNumber,
      quotationId: q.id,
      customerId: q.customerId,
      customerName: q.customerName,
      notes: q.notes || `Dikonversi dari ${q.quotationNumber}`,
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitSellingPrice: item.unitPrice,
        customizationSummary: item.customizationSummary,
      })),
    });
    await updateQuotationStatus(q.id, 'APPROVED');
    navigate('/admin/pesanan');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#1F2421]">
            Manajemen Penawaran (Quotation)
          </h1>
          <p className="text-sm text-[#4A524C] mt-1">
            Buat penawaran harga resmi untuk pelanggan dan konversikan ke Pesanan Penjualan.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          disabled={customers.length === 0 || products.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Penawaran</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-[#E6ECE7] border border-[#CDD9CE] text-sm text-[#243027]">
          {message}
        </div>
      )}

      {(customers.length === 0 || products.length === 0) && (
        <div className="p-4 rounded-xl bg-[#F3EFE6] border border-[#E6DFD1] text-xs text-[#3E4641]">
          Untuk membuat penawaran baru, pastikan sudah ada minimal 1 data Pelanggan dan 1 data
          Produk (atau konversi langsung dari menu Manajemen Inquiry).
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-[#E6DFD1] rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#F3EFE6] pb-3">
            <h2 className="text-base font-semibold">Buat Penawaran Baru</h2>
            <button type="button" onClick={() => setShowForm(false)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Pelanggan *</label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Produk *</label>
              <select
                required
                value={productId}
                onChange={(e) => {
                  const p = products.find((item) => item.id === e.target.value);
                  setProductId(e.target.value);
                  if (p) {
                    setQuantity(p.minimumOrderQty);
                    setUnitPrice(p.startingPrice);
                  }
                }}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.productCode} - {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Berlaku Hingga *</label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Jumlah (pcs)</label>
              <input
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Harga Jual / Unit (IDR)</label>
              <input
                type="number"
                min={0}
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Diskon (IDR)</label>
              <input
                type="number"
                min={0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Catatan syarat & ketentuan penawaran..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium cursor-pointer"
            >
              Simpan Penawaran
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-[#E6DFD1] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-sm text-[#666F69]">Memuat penawaran...</div>
          ) : quotations.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#666F69]">Belum ada penawaran.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E6DFD1] bg-[#FAF8F4] text-xs text-[#666F69]">
                    <th className="py-3 px-4 font-medium">No. Penawaran</th>
                    <th className="py-3 px-4 font-medium">Pelanggan</th>
                    <th className="py-3 px-4 font-medium">Total</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFE6]">
                  {quotations.map((q) => (
                    <tr
                      key={q.id}
                      onClick={() => void handleSelect(q)}
                      className={`cursor-pointer ${
                        selectedQuotation?.id === q.id ? 'bg-[#E6ECE7]/60' : 'hover:bg-[#FAF8F4]'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-xs font-medium">{q.quotationNumber}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-[#1F2421]">{q.customerName}</p>
                        <p className="text-xs text-[#666F69] tabular-nums">
                          s/d {formatDateID(q.validUntil)}
                        </p>
                      </td>
                      <td className="py-3 px-4 tabular-nums font-medium">
                        {formatIDR(q.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-[#4A5F4E]">{q.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E6DFD1] rounded-xl p-6">
          {!selectedQuotation ? (
            <p className="text-sm text-[#666F69] text-center py-8">
              Pilih penawaran di sebelah kiri untuk melihat rincian dan tindakan.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-[#F3EFE6] pb-3">
                <div>
                  <p className="font-mono text-xs text-[#4A5F4E]">{selectedQuotation.quotationNumber}</p>
                  <h2 className="text-lg font-semibold text-[#1F2421]">
                    {selectedQuotation.customerName}
                  </h2>
                </div>
                <select
                  value={selectedQuotation.status}
                  onChange={(e) => {
                    const st = e.target.value as QuotationStatus;
                    void updateQuotationStatus(selectedQuotation.id, st).then(() => {
                      setSelectedQuotation({ ...selectedQuotation, status: st });
                      void load();
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-[#CDD9CE] bg-[#FAF8F4] text-xs font-semibold"
                >
                  {QUOTATION_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-[#FAF8F4] border border-[#E6DFD1] text-xs flex justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium text-[#1F2421]">{item.productName}</p>
                      <p className="text-[#666F69] tabular-nums">
                        {item.quantity} pcs x {formatIDR(item.unitPrice)}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums">{formatIDR(item.lineTotal)}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#F3EFE6] text-sm flex justify-between font-semibold">
                <span>Total Penawaran</span>
                <span className="tabular-nums text-[#4A5F4E]">
                  {formatIDR(selectedQuotation.totalAmount)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => void handleConvertToOrder(selectedQuotation)}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium hover:bg-[#3B4D3F] cursor-pointer"
              >
                <ArrowRightCircle className="w-4 h-4" />
                <span>Konversi ke Pesanan Penjualan</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
