import { FolderPlus, Plus } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  fetchAllCategories,
  initializeStandardCategories,
  saveCategory,
} from '../../services/firestoreService';
import type { CatalogCategory } from '../../types/models';
import { slugify } from '../../utils/validation';

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(11);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAllCategories();
      setCategories(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleInitStandard = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const count = await initializeStandardCategories();
      setMessage(
        count > 0
          ? `${count} kategori standar berhasil ditambahkan ke Firestore.`
          : 'Semua 10 kategori standar sudah tersedia.'
      );
      await loadCategories();
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault();
    const slug = slugify(name);
    if (!slug || name.trim().length < 2) {
      setMessage('Nama kategori minimal 2 karakter.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveCategory(slug, {
        slug,
        name: name.trim(),
        description: description.trim(),
        sortOrder,
        isActive: true,
      });
      setName('');
      setDescription('');
      setSortOrder((prev) => prev + 1);
      setMessage(`Kategori "${name.trim()}" berhasil disimpan.`);
      await loadCategories();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: CatalogCategory) => {
    await saveCategory(cat.id, {
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      imageUrl: cat.imageUrl,
      sortOrder: cat.sortOrder,
      isActive: !cat.isActive,
    });
    await loadCategories();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#1F2421]">
            Manajemen Kategori
          </h1>
          <p className="text-sm text-[#4A524C] mt-1">
            Kelola kategori produk publik di katalog digital Anda.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleInitStandard()}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium hover:bg-[#3B4D3F] disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Inisialisasi 10 Kategori Standar</span>
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-[#E6ECE7] border border-[#CDD9CE] text-sm text-[#243027]">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleCreateCategory}
          className="lg:col-span-4 bg-white border border-[#E6DFD1] rounded-xl p-6 space-y-4"
        >
          <h2 className="text-base font-semibold text-[#1F2421]">Tambah Kategori Baru</h2>
          <div>
            <label htmlFor="catName" className="block text-xs font-medium text-[#1F2421] mb-1">
              Nama Kategori
            </label>
            <input
              id="catName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Hampers Lebaran"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            />
          </div>
          <div>
            <label htmlFor="catDesc" className="block text-xs font-medium text-[#1F2421] mb-1">
              Deskripsi Singkat
            </label>
            <textarea
              id="catDesc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
            />
          </div>
          <div>
            <label htmlFor="catSort" className="block text-xs font-medium text-[#1F2421] mb-1">
              Urutan Tampil
            </label>
            <input
              id="catSort"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-[#1F2421] text-white text-xs font-medium hover:bg-[#3E4641] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori</span>
          </button>
        </form>

        <div className="lg:col-span-8 bg-white border border-[#E6DFD1] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-sm text-[#666F69]">Memuat daftar kategori...</div>
          ) : categories.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-[#1F2421] mb-2">
                Belum ada kategori di Firestore
              </p>
              <p className="text-xs text-[#666F69]">
                Klik "Inisialisasi 10 Kategori Standar" di atas untuk membuat kategori bawaan
                (Wedding Souvenirs, Engagement, Birthday, Corporate Gifts, dll).
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E6DFD1] bg-[#FAF8F4] text-xs text-[#666F69]">
                    <th className="py-3 px-5 font-medium">Urutan</th>
                    <th className="py-3 px-5 font-medium">Nama Kategori</th>
                    <th className="py-3 px-5 font-medium">Slug</th>
                    <th className="py-3 px-5 font-medium">Status</th>
                    <th className="py-3 px-5 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFE6]">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[#FAF8F4]">
                      <td className="py-3 px-5 tabular-nums text-[#666F69]">{cat.sortOrder}</td>
                      <td className="py-3 px-5 font-medium text-[#1F2421]">{cat.name}</td>
                      <td className="py-3 px-5 font-mono text-xs text-[#666F69]">{cat.slug}</td>
                      <td className="py-3 px-5 text-xs font-medium">
                        {cat.isActive ? (
                          <span className="text-[#4A5F4E]">Aktif</span>
                        ) : (
                          <span className="text-[#666F69]">Nonaktif</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(cat)}
                          className="text-xs font-medium text-[#4A5F4E] hover:underline cursor-pointer"
                        >
                          {cat.isActive ? 'Nonaktifkan' : 'Aktifkan'}
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
    </div>
  );
}
