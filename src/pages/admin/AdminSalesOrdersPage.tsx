import { ClipboardCheck, Plus, Truck, X } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  createSalesOrderWithItems,
  fetchAllCustomers,
  fetchAllDeliveries,
  fetchAllInspections,
  fetchAllSalesOrders,
  fetchSalesOrderItems,
  saveDelivery,
  saveInspection,
  updateSalesOrderStatus,
} from '../../services/operationsService';
import { fetchAllProductsAdmin } from '../../services/productService';
import type {
  Customer,
  Delivery,
  DeliveryStatus,
  Inspection,
  InspectionStatus,
  Product,
  SalesOrder,
  SalesOrderItem,
  SalesOrderStatus,
} from '../../types/models';
import { formatDateID, formatIDR } from '../../utils/formatters';

const ORDER_STATUSES: SalesOrderStatus[] = [
  'CONFIRMED',
  'IN_PRODUCTION',
  'QC_PENDING',
  'READY_TO_SHIP',
  'DELIVERED',
  'CANCELLED',
];

export function AdminSalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [selectedItems, setSelectedItems] = useState<SalesOrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(50);
  const [unitPrice, setUnitPrice] = useState(35000);
  const [deliveryDeadline, setDeliveryDeadline] = useState('');

  const [qcStatus, setQcStatus] = useState<InspectionStatus>('PASSED');
  const [qcNotes, setQcNotes] = useState('');

  const [delRecipient, setDelRecipient] = useState('');
  const [delAddress, setDelAddress] = useState('');
  const [delDate, setDelDate] = useState('');
  const [delCourier, setDelCourier] = useState('');
  const [delStatus, setDelStatus] = useState<DeliveryStatus>('SCHEDULED');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [soList, custs, prods, qcList, delList] = await Promise.all([
        fetchAllSalesOrders(),
        fetchAllCustomers(),
        fetchAllProductsAdmin(),
        fetchAllInspections(),
        fetchAllDeliveries(),
      ]);
      setOrders(soList);
      setCustomers(custs);
      setProducts(prods);
      setInspections(qcList);
      setDeliveries(delList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSelectOrder = async (order: SalesOrder) => {
    setSelectedOrder(order);
    setDelRecipient(order.customerName);
    setDelDate(order.deliveryDeadline || new Date().toISOString().slice(0, 10));
    setSelectedItems(await fetchSalesOrderItems(order.id));
  };

  const handleCreateOrder = async (e: FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId);
    const prod = products.find((p) => p.id === productId);
    if (!cust || !prod) return;

    const orderNumber = `SO-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    await createSalesOrderWithItems({
      orderNumber,
      customerId: cust.id,
      customerName: cust.name,
      deliveryDeadline,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          quantity,
          unitSellingPrice: unitPrice,
        },
      ],
    });
    setShowOrderForm(false);
    await load();
  };

  const handleSaveQc = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    await saveInspection({
      salesOrderId: selectedOrder.id,
      status: qcStatus,
      inspectedBy: 'Pemilik Bisnis',
      inspectionDate: new Date().toISOString().slice(0, 10),
      notes: qcNotes,
    });
    setQcNotes('');
    await load();
  };

  const handleSaveDelivery = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    await saveDelivery(null, {
      salesOrderId: selectedOrder.id,
      recipientName: delRecipient,
      address: delAddress,
      scheduledDate: delDate,
      status: delStatus,
      courierName: delCourier,
    });
    setDelAddress('');
    setDelCourier('');
    await load();
  };

  const orderInspections = selectedOrder
    ? inspections.filter((i) => i.salesOrderId === selectedOrder.id)
    : [];
  const orderDeliveries = selectedOrder
    ? deliveries.filter((d) => d.salesOrderId === selectedOrder.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#1F2421]">
            Pesanan Penjualan, QC & Pengiriman
          </h1>
          <p className="text-sm text-[#4A524C] mt-1">
            Pantau status pesanan aktif, hasil inspeksi kualitas, serta jadwal pengiriman.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCustomerId(customers[0]?.id || '');
            setProductId(products[0]?.id || '');
            setQuantity(products[0]?.minimumOrderQty || 50);
            setUnitPrice(products[0]?.startingPrice || 35000);
            setDeliveryDeadline(new Date().toISOString().slice(0, 10));
            setShowOrderForm(true);
          }}
          disabled={customers.length === 0 || products.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pesanan Baru</span>
        </button>
      </div>

      {showOrderForm && (
        <form
          onSubmit={handleCreateOrder}
          className="bg-white border border-[#E6DFD1] rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#F3EFE6] pb-3">
            <h2 className="text-base font-semibold">Pesanan Penjualan Baru</h2>
            <button type="button" onClick={() => setShowOrderForm(false)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              required
              value={deliveryDeadline}
              onChange={(e) => setDeliveryDeadline(e.target.value)}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            />
            <input
              type="number"
              min={1}
              required
              placeholder="Jumlah"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
            />
            <input
              type="number"
              min={0}
              required
              placeholder="Harga Jual / Unit"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium cursor-pointer"
            >
              Simpan Pesanan
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-[#E6DFD1] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-sm text-[#666F69]">Memuat pesanan...</div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#666F69]">
              Belum ada pesanan penjualan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E6DFD1] bg-[#FAF8F4] text-xs text-[#666F69]">
                    <th className="py-3 px-4 font-medium">No. Order</th>
                    <th className="py-3 px-4 font-medium">Pelanggan</th>
                    <th className="py-3 px-4 font-medium">Total / Lunas</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFE6]">
                  {orders.map((so) => (
                    <tr
                      key={so.id}
                      onClick={() => void handleSelectOrder(so)}
                      className={`cursor-pointer ${
                        selectedOrder?.id === so.id ? 'bg-[#E6ECE7]/60' : 'hover:bg-[#FAF8F4]'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-xs font-medium">{so.orderNumber}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-[#1F2421]">{so.customerName}</p>
                        <p className="text-xs text-[#666F69] tabular-nums">
                          Deadline: {formatDateID(so.deliveryDeadline)}
                        </p>
                      </td>
                      <td className="py-3 px-4 tabular-nums text-xs">
                        <p className="font-semibold text-[#1F2421]">{formatIDR(so.totalAmount)}</p>
                        <p className="text-[#4A5F4E]">Dibayar: {formatIDR(so.paidAmount)}</p>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-[#4A5F4E]">{so.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          {!selectedOrder ? (
            <div className="bg-white border border-[#E6DFD1] rounded-xl p-8 text-center text-sm text-[#666F69]">
              Pilih pesanan di sebelah kiri untuk mengelola status, QC, dan pengiriman.
            </div>
          ) : (
            <>
              <div className="bg-white border border-[#E6DFD1] rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between border-b border-[#F3EFE6] pb-3">
                  <div>
                    <p className="font-mono text-xs text-[#4A5F4E]">{selectedOrder.orderNumber}</p>
                    <h2 className="text-base font-semibold text-[#1F2421]">
                      {selectedOrder.customerName}
                    </h2>
                  </div>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => {
                      const st = e.target.value as SalesOrderStatus;
                      void updateSalesOrderStatus(selectedOrder.id, st).then(() => {
                        setSelectedOrder({ ...selectedOrder, status: st });
                        void load();
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-[#CDD9CE] bg-[#FAF8F4] text-xs font-semibold"
                  >
                    {ORDER_STATUSES.map((st) => (
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
                      className="p-2.5 rounded-lg bg-[#FAF8F4] border border-[#E6DFD1] text-xs flex justify-between"
                    >
                      <span>
                        {item.productName} ({item.quantity} pcs)
                      </span>
                      <span className="font-semibold tabular-nums">{formatIDR(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QC Inspection */}
              <form
                onSubmit={handleSaveQc}
                className="bg-white border border-[#E6DFD1] rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2421]">
                  <ClipboardCheck className="w-4 h-4 text-[#4A5F4E]" />
                  <span>Inspeksi Kualitas ({orderInspections.length})</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={qcStatus}
                    onChange={(e) => setQcStatus(e.target.value as InspectionStatus)}
                    className="px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-xs"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PASSED">PASSED</option>
                    <option value="REVISION_NEEDED">REVISION_NEEDED</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-[#1F2421] text-white text-xs font-medium cursor-pointer"
                  >
                    Catat QC
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Catatan pengecekan cetak / kemasan..."
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-xs"
                />
                {orderInspections.map((qc) => (
                  <p key={qc.id} className="text-xs text-[#3E4641] border-t border-[#F3EFE6] pt-2">
                    <span className="font-semibold text-[#4A5F4E]">{qc.status}</span> ·{' '}
                    {formatDateID(qc.inspectionDate)} — {qc.notes || 'Tanpa catatan'}
                  </p>
                ))}
              </form>

              {/* Delivery Schedule */}
              <form
                onSubmit={handleSaveDelivery}
                className="bg-white border border-[#E6DFD1] rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2421]">
                  <Truck className="w-4 h-4 text-[#4A5F4E]" />
                  <span>Jadwal Pengiriman ({orderDeliveries.length})</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Nama Penerima"
                  value={delRecipient}
                  onChange={(e) => setDelRecipient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Alamat Pengiriman Lengkap"
                  value={delAddress}
                  onChange={(e) => setDelAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-xs"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="date"
                    required
                    value={delDate}
                    onChange={(e) => setDelDate(e.target.value)}
                    className="px-2.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Kurir"
                    value={delCourier}
                    onChange={(e) => setDelCourier(e.target.value)}
                    className="px-2.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-xs"
                  />
                  <select
                    value={delStatus}
                    onChange={(e) => setDelStatus(e.target.value as DeliveryStatus)}
                    className="px-2.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-xs"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN_TRANSIT">IN_TRANSIT</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium cursor-pointer"
                >
                  Simpan Jadwal Kirim
                </button>
                {orderDeliveries.map((del) => (
                  <p key={del.id} className="text-xs text-[#3E4641] border-t border-[#F3EFE6] pt-2">
                    <span className="font-semibold">{del.status}</span> ·{' '}
                    {formatDateID(del.scheduledDate)} — {del.recipientName} ({del.courierName || 'Kurir'})
                  </p>
                ))}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
