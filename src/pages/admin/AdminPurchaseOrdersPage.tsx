import { Plus, X } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  createPurchaseOrderWithItems,
  fetchAllPurchaseOrders,
  fetchAllSalesOrders,
  fetchAllSuppliers,
  updatePurchaseOrderStatus,
} from '../../services/operationsService';
import { fetchAllProductsAdmin } from '../../services/productService';
import type {
  Product,
  PurchaseOrder,
  PurchaseOrderStatus,
  SalesOrder,
  Supplier,
} from '../../types/models';
import { formatDateID, formatIDR } from '../../utils/formatters';

const PO_STATUSES: PurchaseOrderStatus[] = [
  'DRAFT',
  'ORDERED',
  'IN_PRODUCTION',
  'COMPLETED',
  'CANCELLED',
];

export function AdminPurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [salesOrderId, setSalesOrderId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(50);
  const [unitPurchasePrice, setUnitPurchasePrice] = useState(20000);
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pos, sos, sups, prods] = await Promise.all([
        fetchAllPurchaseOrders(),
        fetchAllSalesOrders(),
        fetchAllSuppliers(),
        fetchAllProductsAdmin(),
      ]);
      setPurchaseOrders(pos);
      setSalesOrders(sos);
      setSuppliers(sups);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === supplierId);
    const prod = products.find((p) => p.id === productId);
    if (!sup || !prod || !salesOrderId) return;

    const poNumber = `PO-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    await createPurchaseOrderWithItems({
      poNumber,
      salesOrderId,
      supplierId: sup.id,
      supplierName: sup.name,
      expectedCompletionDate,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          quantity,
          unitPurchasePrice,
        },
      ],
    });
    setShowForm(false);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#1F2421]">
            Manajemen Pembelian (Purchase Order)
          </h1>
          <p className="text-sm text-[#4A524C] mt-1">
            Terbitkan PO produksi ke mitra pemasok berdasarkan pesanan penjualan aktif.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSalesOrderId(salesOrders[0]?.id || '');
            setSupplierId(suppliers[0]?.id || '');
            setProductId(products[0]?.id || '');
            setExpectedCompletionDate(new Date().toISOString().slice(0, 10));
            setShowForm(true);
          }}
          disabled={salesOrders.length === 0 || suppliers.length === 0 || products.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Purchase Order</span>
        </button>
      </div>

      {(salesOrders.length === 0 || suppliers.length === 0) && (
        <div className="p-4 rounded-xl bg-[#F3EFE6] border border-[#E6DFD1] text-xs text-[#3E4641]">
          Untuk membuat PO baru, pastikan sudah tersedia minimal 1 Pesanan Penjualan dan 1 Pemasok.
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-[#E6DFD1] rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#F3EFE6] pb-3">
            <h2 className="text-base font-semibold">Purchase Order Baru</h2>
            <button type="button" onClick={() => setShowForm(false)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Sales Order Terkait *</label>
              <select
                required
                value={salesOrderId}
                onChange={(e) => setSalesOrderId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              >
                {salesOrders.map((so) => (
                  <option key={so.id} value={so.id}>
                    {so.orderNumber} - {so.customerName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Pemasok *</label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Produk *</label>
              <select
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
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
              <label className="block text-xs font-medium mb-1">Harga Beli / Unit (IDR)</label>
              <input
                type="number"
                min={0}
                required
                value={unitPurchasePrice}
                onChange={(e) => setUnitPurchasePrice(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Target Selesai</label>
              <input
                type="date"
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium cursor-pointer"
            >
              Terbitkan PO
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-[#E6DFD1] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-[#666F69]">Memuat Purchase Order...</div>
        ) : purchaseOrders.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#666F69]">
            Belum ada Purchase Order pemasok.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E6DFD1] bg-[#FAF8F4] text-xs text-[#666F69]">
                  <th className="py-3 px-4 font-medium">No. PO</th>
                  <th className="py-3 px-4 font-medium">Pemasok</th>
                  <th className="py-3 px-4 font-medium">Target Selesai</th>
                  <th className="py-3 px-4 font-medium">Total / Dibayar</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE6]">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-[#FAF8F4]">
                    <td className="py-3 px-4 font-mono text-xs font-medium">{po.poNumber}</td>
                    <td className="py-3 px-4 font-medium text-[#1F2421]">{po.supplierName}</td>
                    <td className="py-3 px-4 tabular-nums text-xs text-[#666F69]">
                      {formatDateID(po.expectedCompletionDate)}
                    </td>
                    <td className="py-3 px-4 tabular-nums text-xs">
                      <p className="font-semibold text-[#1F2421]">{formatIDR(po.totalAmount)}</p>
                      <p className="text-[#4A5F4E]">Dibayar: {formatIDR(po.paidAmount)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={po.status}
                        onChange={(e) =>
                          void updatePurchaseOrderStatus(
                            po.id,
                            e.target.value as PurchaseOrderStatus
                          ).then(load)
                        }
                        className="px-2.5 py-1 rounded-lg border border-[#CDD9CE] bg-[#FAF8F4] text-xs font-semibold"
                      >
                        {PO_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
