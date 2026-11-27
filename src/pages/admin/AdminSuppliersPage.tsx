import { Plus, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  deleteSupplierProduct,
  fetchAllSupplierProducts,
  fetchAllSuppliers,
  saveSupplier,
  saveSupplierProduct,
} from '../../services/operationsService';
import { fetchAllProductsAdmin } from '../../services/productService';
import type { Product, Supplier, SupplierProduct } from '../../types/models';
import { formatIDR } from '../../utils/formatters';

export function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supForm, setSupForm] = useState({
    supplierCode: '',
    name: '',
    contactPerson: '',
    phone: '',
    city: '',
    specialty: '',
    isActive: true,
    notes: '',
  });

  const [showCostForm, setShowCostForm] = useState(false);
  const [costForm, setCostForm] = useState({
    supplierId: '',
    productId: '',
    supplierSku: '',
    baseCostPrice: 0,
    printingCostPerUnit: 0,
    minOrderQty: 50,
    leadTimeDays: 10,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sups, spList, prods] = await Promise.all([
        fetchAllSuppliers(),
        fetchAllSupplierProducts(),
        fetchAllProductsAdmin(),
      ]);
      setSuppliers(sups);
      setSupplierProducts(spList);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveSupplier = async (e: FormEvent) => {
    e.preventDefault();
    await saveSupplier(editingSupplierId, supForm);
    setShowSupplierForm(false);
    await load();
  };

  const handleSaveCost = async (e: FormEvent) => {
    e.preventDefault();
    if (!costForm.supplierId || !costForm.productId) return;
    await saveSupplierProduct(null, costForm);
    setShowCostForm(false);
    await load();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#1F2421]">
            Pemasok & Harga Modal Rahasia
          </h1>
          <p className="text-sm text-[#4A524C] mt-1">
            Kelola mitra percetakan/produsen eksternal dan pemetaan harga modal internal (tidak
            pernah tampil di katalog publik).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingSupplierId(null);
              setSupForm({
                supplierCode: '',
                name: '',
                contactPerson: '',
                phone: '',
                city: '',
                specialty: '',
                isActive: true,
                notes: '',
              });
              setShowSupplierForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pemasok</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCostForm({
                supplierId: suppliers[0]?.id || '',
                productId: products[0]?.id || '',
                supplierSku: '',
                baseCostPrice: 0,
                printingCostPerUnit: 0,
                minOrderQty: 50,
                leadTimeDays: 10,
              });
              setShowCostForm(true);
            }}
            disabled={suppliers.length === 0 || products.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#CDD9CE] bg-white text-[#1F2421] text-xs font-medium disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tautkan Harga Modal Produk</span>
          </button>
        </div>
      </div>

      {showSupplierForm && (
        <form
          onSubmit={handleSaveSupplier}
          className="bg-white border border-[#E6DFD1] rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#F3EFE6] pb-3">
            <h2 className="text-base font-semibold">
              {editingSupplierId ? 'Ubah Pemasok' : 'Tambah Pemasok Baru'}
            </h2>
            <button type="button" onClick={() => setShowSupplierForm(false)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              required
              placeholder="Kode (SUP-01)"
              value={supForm.supplierCode}
              onChange={(e) => setSupForm({ ...supForm, supplierCode: e.target.value })}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm font-mono"
            />
            <input
              type="text"
              required
              placeholder="Nama Pemasok *"
              value={supForm.name}
              onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            />
            <input
              type="text"
              required
              placeholder="No. Telepon / WA *"
              value={supForm.phone}
              onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm font-mono"
            />
            <input
              type="text"
              placeholder="PIC / Kontak"
              value={supForm.contactPerson}
              onChange={(e) => setSupForm({ ...supForm, contactPerson: e.target.value })}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            />
            <input
              type="text"
              placeholder="Kota"
              value={supForm.city}
              onChange={(e) => setSupForm({ ...supForm, city: e.target.value })}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            />
            <input
              type="text"
              placeholder="Spesialisasi (Sablon, Box, Keramik)"
              value={supForm.specialty}
              onChange={(e) => setSupForm({ ...supForm, specialty: e.target.value })}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium cursor-pointer"
            >
              Simpan Pemasok
            </button>
          </div>
        </form>
      )}

      {showCostForm && (
        <form
          onSubmit={handleSaveCost}
          className="bg-white border border-[#E6DFD1] rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#F3EFE6] pb-3">
            <h2 className="text-base font-semibold">Pemetaan Harga Modal Pemasok</h2>
            <button type="button" onClick={() => setShowCostForm(false)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              required
              value={costForm.supplierId}
              onChange={(e) => setCostForm({ ...costForm, supplierId: e.target.value })}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              required
              value={costForm.productId}
              onChange={(e) => setCostForm({ ...costForm, productId: e.target.value })}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productCode} - {p.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              required
              placeholder="Harga Modal Dasar (IDR)"
              value={costForm.baseCostPrice}
              onChange={(e) => setCostForm({ ...costForm, baseCostPrice: Number(e.target.value) })}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
            />
            <input
              type="number"
              min={0}
              placeholder="Biaya Cetak / Unit (IDR)"
              value={costForm.printingCostPerUnit}
              onChange={(e) =>
                setCostForm({ ...costForm, printingCostPerUnit: Number(e.target.value) })
              }
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
            />
            <input
              type="number"
              min={1}
              placeholder="MOQ Pemasok"
              value={costForm.minOrderQty}
              onChange={(e) => setCostForm({ ...costForm, minOrderQty: Number(e.target.value) })}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
            />
            <input
              type="number"
              min={1}
              placeholder="Lead Time (Hari)"
              value={costForm.leadTimeDays}
              onChange={(e) => setCostForm({ ...costForm, leadTimeDays: Number(e.target.value) })}
              className="px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium cursor-pointer"
            >
              Simpan Harga Modal
            </button>
          </div>
        </form>
      )}

      {/* Suppliers Table */}
      <div className="bg-white border border-[#E6DFD1] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6DFD1] font-semibold text-sm text-[#1F2421]">
          Daftar Mitra Pemasok ({suppliers.length})
        </div>
        {loading ? (
          <div className="p-6 text-sm text-[#666F69]">Memuat...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#666F69]">Belum ada pemasok terdaftar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E6DFD1] bg-[#FAF8F4] text-xs text-[#666F69]">
                  <th className="py-3 px-4 font-medium">Kode</th>
                  <th className="py-3 px-4 font-medium">Nama Pemasok</th>
                  <th className="py-3 px-4 font-medium">PIC & Telepon</th>
                  <th className="py-3 px-4 font-medium">Spesialisasi</th>
                  <th className="py-3 px-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE6]">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF8F4]">
                    <td className="py-3 px-4 font-mono text-xs">{s.supplierCode}</td>
                    <td className="py-3 px-4 font-medium text-[#1F2421]">{s.name}</td>
                    <td className="py-3 px-4 text-xs text-[#3E4641]">
                      {s.contactPerson ? `${s.contactPerson} · ` : ''}
                      <span className="font-mono">{s.phone}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#666F69]">{s.specialty || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSupplierId(s.id);
                          setSupForm({
                            supplierCode: s.supplierCode,
                            name: s.name,
                            contactPerson: s.contactPerson || '',
                            phone: s.phone,
                            city: s.city || '',
                            specialty: s.specialty || '',
                            isActive: s.isActive,
                            notes: s.notes || '',
                          });
                          setShowSupplierForm(true);
                        }}
                        className="text-xs font-medium text-[#4A5F4E] hover:underline cursor-pointer"
                      >
                        Ubah
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confidential Supplier Product Cost Table */}
      <div className="bg-white border border-[#E6DFD1] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E6DFD1] font-semibold text-sm text-[#1F2421]">
          Daftar Harga Modal Pemasok per Produk ({supplierProducts.length})
        </div>
        {supplierProducts.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#666F69]">
            Belum ada pemetaan harga modal pemasok.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E6DFD1] bg-[#FAF8F4] text-xs text-[#666F69]">
                  <th className="py-3 px-4 font-medium">Pemasok</th>
                  <th className="py-3 px-4 font-medium">Produk</th>
                  <th className="py-3 px-4 font-medium">Modal Dasar</th>
                  <th className="py-3 px-4 font-medium">Biaya Cetak</th>
                  <th className="py-3 px-4 font-medium">MOQ / Lead Time</th>
                  <th className="py-3 px-4 font-medium text-right">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE6]">
                {supplierProducts.map((sp) => {
                  const sup = suppliers.find((s) => s.id === sp.supplierId);
                  const prod = products.find((p) => p.id === sp.productId);
                  return (
                    <tr key={sp.id} className="hover:bg-[#FAF8F4]">
                      <td className="py-3 px-4 font-medium text-[#1F2421]">
                        {sup?.name || sp.supplierId}
                      </td>
                      <td className="py-3 px-4 text-[#3E4641]">{prod?.name || sp.productId}</td>
                      <td className="py-3 px-4 tabular-nums font-medium">
                        {formatIDR(sp.baseCostPrice)}
                      </td>
                      <td className="py-3 px-4 tabular-nums">
                        {formatIDR(sp.printingCostPerUnit || 0)}
                      </td>
                      <td className="py-3 px-4 tabular-nums text-xs text-[#666F69]">
                        {sp.minOrderQty} pcs · {sp.leadTimeDays} hari
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => void deleteSupplierProduct(sp.id).then(load)}
                          className="text-[#666F69] hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
