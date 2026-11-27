import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  fetchAllCustomerPayments,
  fetchAllExpenses,
  fetchAllPurchaseOrders,
  fetchAllSalesOrders,
  fetchAllSupplierPayments,
  recordCustomerPayment,
  recordSupplierPayment,
  saveExpense,
} from '../../services/operationsService';
import type {
  CustomerPayment,
  Expense,
  PurchaseOrder,
  SalesOrder,
  SupplierPayment,
} from '../../types/models';
import { formatDateID, formatIDR } from '../../utils/formatters';

export function AdminFinancePage() {
  const [tab, setTab] = useState<'customer' | 'supplier' | 'expense'>('customer');
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [cpOrderId, setCpOrderId] = useState('');
  const [cpAmount, setCpAmount] = useState(0);
  const [cpMethod, setCpMethod] = useState('Transfer Bank BCA');
  const [cpDate, setCpDate] = useState(new Date().toISOString().slice(0, 10));

  const [spPoId, setSpPoId] = useState('');
  const [spAmount, setSpAmount] = useState(0);
  const [spMethod, setSpMethod] = useState('Transfer Bank');
  const [spDate, setSpDate] = useState(new Date().toISOString().slice(0, 10));

  const [expCategory, setExpCategory] = useState('Kemasan & Operasional');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState(0);
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cps, sps, exps, sos, pos] = await Promise.all([
        fetchAllCustomerPayments(),
        fetchAllSupplierPayments(),
        fetchAllExpenses(),
        fetchAllSalesOrders(),
        fetchAllPurchaseOrders(),
      ]);
      setCustomerPayments(cps);
      setSupplierPayments(sps);
      setExpenses(exps);
      setSalesOrders(sos);
      setPurchaseOrders(pos);
      if (sos[0]) setCpOrderId((prev) => prev || sos[0].id);
      if (pos[0]) setSpPoId((prev) => prev || pos[0].id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalIncoming = customerPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalSupplierOut = supplierPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const handleRecordCustomerPayment = async (e: FormEvent) => {
    e.preventDefault();
    const so = salesOrders.find((s) => s.id === cpOrderId);
    if (!so || cpAmount <= 0) return;
    await recordCustomerPayment({
      salesOrderId: so.id,
      customerId: so.customerId,
      amount: cpAmount,
      paymentMethod: cpMethod,
      paymentDate: cpDate,
    });
    setCpAmount(0);
    await load();
  };

  const handleRecordSupplierPayment = async (e: FormEvent) => {
    e.preventDefault();
    const po = purchaseOrders.find((p) => p.id === spPoId);
    if (!po || spAmount <= 0) return;
    await recordSupplierPayment({
      purchaseOrderId: po.id,
      supplierId: po.supplierId,
      amount: spAmount,
      paymentMethod: spMethod,
      paymentDate: spDate,
    });
    setSpAmount(0);
    await load();
  };

  const handleRecordExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!expDesc.trim() || expAmount <= 0) return;
    await saveExpense({
      category: expCategory,
      description: expDesc,
      amount: expAmount,
      expenseDate: expDate,
    });
    setExpDesc('');
    setExpAmount(0);
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-editorial text-3xl font-semibold text-[#1F2421]">
          Manajemen Keuangan
        </h1>
        <p className="text-sm text-[#4A524C] mt-1">
          Catat pembayaran pelanggan, pembayaran ke pemasok, dan pengeluaran operasional bisnis.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E6DFD1] rounded-xl p-5">
          <p className="text-xs text-[#666F69]">Pembayaran Pelanggan Masuk</p>
          <p className="text-2xl font-semibold text-[#4A5F4E] tabular-nums mt-1">
            {formatIDR(totalIncoming)}
          </p>
        </div>
        <div className="bg-white border border-[#E6DFD1] rounded-xl p-5">
          <p className="text-xs text-[#666F69]">Pembayaran Pemasok Keluar</p>
          <p className="text-2xl font-semibold text-[#1F2421] tabular-nums mt-1">
            {formatIDR(totalSupplierOut)}
          </p>
        </div>
        <div className="bg-white border border-[#E6DFD1] rounded-xl p-5">
          <p className="text-xs text-[#666F69]">Biaya Operasional</p>
          <p className="text-2xl font-semibold text-[#1F2421] tabular-nums mt-1">
            {formatIDR(totalExpenses)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-[#E6DFD1] pb-3">
        {(
          [
            { id: 'customer', label: 'Pembayaran Pelanggan' },
            { id: 'supplier', label: 'Pembayaran Pemasok' },
            { id: 'expense', label: 'Biaya Operasional' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer ${
              tab === t.id ? 'bg-[#4A5F4E] text-white' : 'bg-white border border-[#E6DFD1] text-[#3E4641]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'customer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleRecordCustomerPayment}
            className="lg:col-span-4 bg-white border border-[#E6DFD1] rounded-xl p-5 space-y-3"
          >
            <h2 className="text-sm font-semibold text-[#1F2421]">Catat Pembayaran Pelanggan</h2>
            <select
              required
              value={cpOrderId}
              onChange={(e) => setCpOrderId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            >
              {salesOrders.length === 0 && <option value="">Belum ada Sales Order</option>}
              {salesOrders.map((so) => (
                <option key={so.id} value={so.id}>
                  {so.orderNumber} - {so.customerName}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              required
              placeholder="Nominal (IDR)"
              value={cpAmount || ''}
              onChange={(e) => setCpAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
            />
            <input
              type="text"
              required
              value={cpMethod}
              onChange={(e) => setCpMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            />
            <input
              type="date"
              required
              value={cpDate}
              onChange={(e) => setCpDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            />
            <button
              type="submit"
              disabled={salesOrders.length === 0}
              className="w-full py-2.5 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium disabled:opacity-50 cursor-pointer"
            >
              Simpan Pembayaran
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-[#E6DFD1] rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-6 text-sm text-[#666F69]">Memuat...</div>
            ) : customerPayments.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#666F69]">
                Belum ada riwayat pembayaran pelanggan.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E6DFD1] bg-[#FAF8F4] text-xs text-[#666F69]">
                    <th className="py-3 px-4 font-medium">Tanggal</th>
                    <th className="py-3 px-4 font-medium">Sales Order</th>
                    <th className="py-3 px-4 font-medium">Metode</th>
                    <th className="py-3 px-4 font-medium text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFE6]">
                  {customerPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-4 tabular-nums text-xs">{formatDateID(p.paymentDate)}</td>
                      <td className="py-3 px-4 font-mono text-xs">{p.salesOrderId}</td>
                      <td className="py-3 px-4 text-xs">{p.paymentMethod}</td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums text-[#4A5F4E]">
                        {formatIDR(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'supplier' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleRecordSupplierPayment}
            className="lg:col-span-4 bg-white border border-[#E6DFD1] rounded-xl p-5 space-y-3"
          >
            <h2 className="text-sm font-semibold text-[#1F2421]">Catat Pembayaran Pemasok</h2>
            <select
              required
              value={spPoId}
              onChange={(e) => setSpPoId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            >
              {purchaseOrders.length === 0 && <option value="">Belum ada PO</option>}
              {purchaseOrders.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.poNumber} - {po.supplierName}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              required
              placeholder="Nominal (IDR)"
              value={spAmount || ''}
              onChange={(e) => setSpAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
            />
            <input
              type="text"
              required
              value={spMethod}
              onChange={(e) => setSpMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            />
            <input
              type="date"
              required
              value={spDate}
              onChange={(e) => setSpDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            />
            <button
              type="submit"
              disabled={purchaseOrders.length === 0}
              className="w-full py-2.5 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium disabled:opacity-50 cursor-pointer"
            >
              Simpan Pembayaran PO
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-[#E6DFD1] rounded-xl overflow-hidden">
            {supplierPayments.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#666F69]">
                Belum ada riwayat pembayaran ke pemasok.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E6DFD1] bg-[#FAF8F4] text-xs text-[#666F69]">
                    <th className="py-3 px-4 font-medium">Tanggal</th>
                    <th className="py-3 px-4 font-medium">Purchase Order</th>
                    <th className="py-3 px-4 font-medium">Metode</th>
                    <th className="py-3 px-4 font-medium text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFE6]">
                  {supplierPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-4 tabular-nums text-xs">{formatDateID(p.paymentDate)}</td>
                      <td className="py-3 px-4 font-mono text-xs">{p.purchaseOrderId}</td>
                      <td className="py-3 px-4 text-xs">{p.paymentMethod}</td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums">
                        {formatIDR(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'expense' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleRecordExpense}
            className="lg:col-span-4 bg-white border border-[#E6DFD1] rounded-xl p-5 space-y-3"
          >
            <h2 className="text-sm font-semibold text-[#1F2421]">Catat Biaya Operasional</h2>
            <input
              type="text"
              required
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value)}
              placeholder="Kategori Biaya"
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            />
            <input
              type="text"
              required
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              placeholder="Keterangan pengeluaran"
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            />
            <input
              type="number"
              min={1}
              required
              placeholder="Nominal (IDR)"
              value={expAmount || ''}
              onChange={(e) => setExpAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
            />
            <input
              type="date"
              required
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium cursor-pointer"
            >
              Simpan Pengeluaran
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-[#E6DFD1] rounded-xl overflow-hidden">
            {expenses.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#666F69]">
                Belum ada catatan pengeluaran operasional.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E6DFD1] bg-[#FAF8F4] text-xs text-[#666F69]">
                    <th className="py-3 px-4 font-medium">Tanggal</th>
                    <th className="py-3 px-4 font-medium">Kategori</th>
                    <th className="py-3 px-4 font-medium">Keterangan</th>
                    <th className="py-3 px-4 font-medium text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFE6]">
                  {expenses.map((ex) => (
                    <tr key={ex.id}>
                      <td className="py-3 px-4 tabular-nums text-xs">{formatDateID(ex.expenseDate)}</td>
                      <td className="py-3 px-4 text-xs font-medium">{ex.category}</td>
                      <td className="py-3 px-4 text-xs text-[#3E4641]">{ex.description}</td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums">
                        {formatIDR(ex.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
