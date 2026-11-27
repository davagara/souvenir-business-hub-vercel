import { Eye, EyeOff, Plus, Search, Star, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { SafeImage } from '../../components/SafeImage';
import { GENERATED_ASSETS, STANDARD_CATEGORIES } from '../../constants/catalogDefaults';
import { fetchAllCategories } from '../../services/firestoreService';
import {
  deleteProductAdmin,
  fetchAllProductsAdmin,
  saveProductAdmin,
  toggleProductFeatured,
  toggleProductPublish,
  uploadProductPhotoToStorage,
} from '../../services/productService';
import type { CatalogCategory, Product } from '../../types/models';
import { formatIDR } from '../../utils/formatters';

interface FormState {
  productCode: string;
  name: string;
  categoryId: string;
  photosText: string;
  description: string;
  specifications: string;
  colorsText: string;
  sizesText: string;
  customizationsText: string;
  minimumOrderQty: number;
  startingPrice: number;
  estimatedLeadTimeDays: number;
  isFeatured: boolean;
  isPublished: boolean;
}

const EMPTY_FORM: FormState = {
  productCode: '',
  name: '',
  categoryId: 'wedding-souvenirs',
  photosText: '',
  description: '',
  specifications: '',
  colorsText: 'Sage Green, Warm Cream',
  sizesText: '',
  customizationsText: 'Sablon Logo, Kartu Ucapan Kustom',
  minimumOrderQty: 50,
  startingPrice: 35000,
  estimatedLeadTimeDays: 14,
  isFeatured: false,
  isPublished: true,
};

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [publishFilter, setPublishFilter] = useState<'all' | 'published' | 'draft'>('all');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([fetchAllProductsAdmin(), fetchAllCategories()]);
      setProducts(prods);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const categoryOptions = useMemo(() => {
    if (categories.length > 0) return categories.map((c) => ({ id: c.id, name: c.name }));
    return STANDARD_CATEGORIES.map((c) => ({ id: c.id, name: c.name }));
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (publishFilter === 'published' && !p.isPublished) return false;
      if (publishFilter === 'draft' && p.isPublished) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.productCode.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, publishFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      categoryId: categoryOptions[0]?.id || 'wedding-souvenirs',
    });
    setFeedback(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      productCode: p.productCode,
      name: p.name,
      categoryId: p.categoryId,
      photosText: (p.photos || []).join('\n'),
      description: p.description || '',
      specifications: p.specifications || '',
      colorsText: (p.availableColors || []).join(', '),
      sizesText: (p.availableSizes || []).join(', '),
      customizationsText: (p.customizationOptions || []).join(', '),
      minimumOrderQty: p.minimumOrderQty,
      startingPrice: p.startingPrice,
      estimatedLeadTimeDays: p.estimatedLeadTimeDays,
      isFeatured: p.isFeatured,
      isPublished: p.isPublished,
    });
    setFeedback(null);
    setShowForm(true);
  };

  const handleUploadPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setFeedback(null);
    try {
      const url = await uploadProductPhotoToStorage(file, form.productCode || 'product');
      setForm((prev) => ({
        ...prev,
        photosText: prev.photosText ? `${prev.photosText}\n${url}` : url,
      }));
      setFeedback({ type: 'ok', text: 'Foto produk berhasil diunggah ke Firebase Storage.' });
    } catch {
      setFeedback({
        type: 'err',
        text: 'Unggah ke Firebase Storage gagal. Pastikan aturan Storage aktif atau tempelkan URL gambar secara langsung.',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const selectedCat = categoryOptions.find((c) => c.id === form.categoryId) || {
      id: form.categoryId,
      name: form.categoryId,
    };

    const photos = form.photosText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const availableColors = form.colorsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const availableSizes = form.sizesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const customizationOptions = form.customizationsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (form.productCode.trim().length < 2 || form.name.trim().length < 2) {
      setFeedback({ type: 'err', text: 'Kode produk dan nama produk wajib diisi.' });
      return;
    }

    setSaving(true);
    try {
      await saveProductAdmin(editingId, {
        productCode: form.productCode,
        name: form.name,
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        photos,
        description: form.description,
        specifications: form.specifications,
        availableColors,
        availableSizes,
        customizationOptions,
        minimumOrderQty: form.minimumOrderQty,
        startingPrice: form.startingPrice,
        estimatedLeadTimeDays: form.estimatedLeadTimeDays,
        isFeatured: form.isFeatured,
        isPublished: form.isPublished,
      });
      setShowForm(false);
      setFeedback({
        type: 'ok',
        text: editingId ? 'Produk berhasil diperbarui.' : 'Produk baru berhasil ditambahkan.',
      });
      await loadData();
    } catch {
      setFeedback({ type: 'err', text: 'Gagal menyimpan produk ke Firestore.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    await deleteProductAdmin(product.id);
    setFeedback({ type: 'ok', text: `Produk "${product.name}" telah dihapus.` });
    await loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#1F2421]">
            Manajemen Produk
          </h1>
          <p className="text-sm text-[#4A524C] mt-1">
            Kelola katalog souvenir, variasi, foto produk, dan status publikasi ke website publik.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium hover:bg-[#3B4D3F] cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm border ${
            feedback.type === 'ok'
              ? 'bg-[#E6ECE7] border-[#CDD9CE] text-[#243027]'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#E6DFD1] rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#F3EFE6] pb-3">
            <h2 className="text-base font-semibold text-[#1F2421]">
              {editingId ? 'Ubah Produk Katalog' : 'Tambah Produk Baru'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg text-[#666F69] hover:bg-[#FAF8F4] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1F2421] mb-1">Kode Produk *</label>
              <input
                type="text"
                required
                value={form.productCode}
                onChange={(e) => setForm({ ...form, productCode: e.target.value.toUpperCase() })}
                placeholder="SBH-WD-001"
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#1F2421] mb-1">Nama Produk *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Misal: Tumbler Keramik Matte Sage"
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1F2421] mb-1">Kategori *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              >
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1F2421] mb-1">
                Harga Mulai Dari (IDR) *
              </label>
              <input
                type="number"
                min={0}
                required
                value={form.startingPrice}
                onChange={(e) => setForm({ ...form, startingPrice: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1F2421] mb-1">Min. Order</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.minimumOrderQty}
                  onChange={(e) => setForm({ ...form, minimumOrderQty: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1F2421] mb-1">
                  Lead Time (Hari)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.estimatedLeadTimeDays}
                  onChange={(e) =>
                    setForm({ ...form, estimatedLeadTimeDays: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1F2421] mb-1">Deskripsi Produk</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1F2421] mb-1">
                Spesifikasi Material & Ukuran
              </label>
              <textarea
                rows={2}
                value={form.specifications}
                onChange={(e) => setForm({ ...form, specifications: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-[#1F2421]">
                  Foto Produk (1 URL per baris)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        photosText: prev.photosText
                          ? `${prev.photosText}\n${GENERATED_ASSETS.linenGiftbox}`
                          : GENERATED_ASSETS.linenGiftbox,
                      }))
                    }
                    className="text-[11px] text-[#4A5F4E] hover:underline cursor-pointer"
                  >
                    + Foto Studio
                  </button>
                  <label className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4A5F4E] hover:underline cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>{uploadingPhoto ? 'Mengunggah...' : 'Unggah File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void handleUploadPhoto(e)}
                    />
                  </label>
                </div>
              </div>
              <textarea
                rows={2}
                value={form.photosText}
                onChange={(e) => setForm({ ...form, photosText: e.target.value })}
                placeholder="https://... atau /src/assets/images/..."
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1F2421] mb-1">
                Pilihan Warna (pisahkan koma)
              </label>
              <input
                type="text"
                value={form.colorsText}
                onChange={(e) => setForm({ ...form, colorsText: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2421] mb-1">
                Pilihan Ukuran (pisahkan koma)
              </label>
              <input
                type="text"
                value={form.sizesText}
                onChange={(e) => setForm({ ...form, sizesText: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2421] mb-1">
                Opsi Kustomisasi (pisahkan koma)
              </label>
              <input
                type="text"
                value={form.customizationsText}
                onChange={(e) => setForm({ ...form, customizationsText: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="inline-flex items-center gap-2 text-sm text-[#1F2421] cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="rounded border-[#CDD9CE] accent-[#4A5F4E]"
              />
              <span>Publikasikan di Katalog Publik</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-[#1F2421] cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="rounded border-[#CDD9CE] accent-[#4A5F4E]"
              />
              <span>Tandai sebagai Produk Pilihan (Featured)</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-[#E6DFD1] text-xs font-medium text-[#3E4641] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium hover:bg-[#3B4D3F] disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter */}
      <div className="bg-white border border-[#E6DFD1] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#666F69] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode atau nama produk..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {(
            [
              { id: 'all', label: 'Semua' },
              { id: 'published', label: 'Terbit' },
              { id: 'draft', label: 'Draf' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPublishFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                publishFilter === tab.id
                  ? 'bg-[#4A5F4E] text-white'
                  : 'bg-[#F3EFE6] text-[#3E4641]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white border border-[#E6DFD1] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-[#666F69]">Memuat daftar produk...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-[#1F2421] mb-1">Belum ada produk</p>
            <p className="text-xs text-[#666F69]">
              Tambahkan produk souvenir pertama Anda dengan tombol "Tambah Produk" di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E6DFD1] bg-[#FAF8F4] text-xs text-[#666F69]">
                  <th className="py-3 px-4 font-medium">Produk</th>
                  <th className="py-3 px-4 font-medium">Kategori</th>
                  <th className="py-3 px-4 font-medium">Harga Mulai</th>
                  <th className="py-3 px-4 font-medium">MOQ</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE6]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF8F4]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-md overflow-hidden bg-[#F3EFE6] shrink-0">
                          <SafeImage
                            src={p.photos?.[0]}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-[#1F2421]">{p.name}</p>
                          <p className="font-mono text-xs text-[#666F69]">{p.productCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#3E4641]">{p.categoryName}</td>
                    <td className="py-3 px-4 tabular-nums font-medium text-[#1F2421]">
                      {formatIDR(p.startingPrice)}
                    </td>
                    <td className="py-3 px-4 tabular-nums text-[#3E4641]">{p.minimumOrderQty} pcs</td>
                    <td className="py-3 px-4 text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => void toggleProductPublish(p).then(loadData)}
                          className={`inline-flex items-center gap-1 font-medium cursor-pointer ${
                            p.isPublished ? 'text-[#4A5F4E]' : 'text-[#666F69]'
                          }`}
                          title="Ubah status publikasi"
                        >
                          {p.isPublished ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                          <span>{p.isPublished ? 'Terbit' : 'Draf'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleProductFeatured(p).then(loadData)}
                          className={`inline-flex items-center gap-1 cursor-pointer ${
                            p.isFeatured ? 'text-amber-700 font-medium' : 'text-[#666F69]'
                          }`}
                          title="Tandai produk unggulan"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>{p.isFeatured ? 'Pilihan' : 'Reguler'}</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="text-xs font-medium text-[#4A5F4E] hover:underline mr-3 cursor-pointer"
                      >
                        Ubah
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(p)}
                        className="text-xs text-[#666F69] hover:text-red-700 cursor-pointer inline-flex items-center"
                        aria-label={`Hapus ${p.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
