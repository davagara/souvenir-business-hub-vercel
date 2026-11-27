import { Package, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../../components/ProductCard';
import { STANDARD_CATEGORIES } from '../../constants/catalogDefaults';
import { fetchActiveCategories, fetchPublishedProducts } from '../../services/firestoreService';
import type { CatalogCategory, Product } from '../../types/models';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('kategori') || 'all';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCategory(searchParams.get('kategori') || 'all');
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [prodList, catList] = await Promise.all([
          fetchPublishedProducts(),
          fetchActiveCategories(),
        ]);
        if (!active) return;
        setProducts(prodList);
        setCategories(catList);
      } catch {
        if (active) {
          setError('Gagal memuat data katalog produk. Silakan coba muat ulang.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const categoryTabs = useMemo(() => {
    if (categories.length > 0) {
      return categories.map((c) => ({ id: c.id, name: c.name }));
    }
    return STANDARD_CATEGORIES.map((c) => ({ id: c.id, name: c.name }));
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'all' ||
        p.categoryId === selectedCategory ||
        p.categoryName.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.productCode.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [products, selectedCategory, searchQuery]);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      searchParams.delete('kategori');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ kategori: catId }, { replace: true });
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="mb-8">
        <p className="text-xs font-medium text-[#4A5F4E] mb-2">Katalog Digital</p>
        <h1 className="font-editorial text-4xl font-semibold text-[#1F2421] mb-3">
          Katalog Souvenir Kustom
        </h1>
        <p className="text-sm text-[#4A524C] max-w-2xl leading-relaxed">
          Semua produk diproduksi secara made-to-order. Harga yang ditampilkan bersifat indikatif
          dan akan disesuaikan pada penawaran resmi berdasarkan jumlah pesanan, detail cetak, serta
          harga mitra produksi.
        </p>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-[#E6DFD1] rounded-xl p-4 sm:p-5 mb-8 space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#666F69] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk, kode, atau kategori..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm text-[#1F2421] placeholder:text-[#666F69] focus:outline-none focus:border-[#4A5F4E]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => handleSelectCategory('all')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#4A5F4E] text-white'
                : 'bg-[#F3EFE6] text-[#3E4641] hover:bg-[#E6ECE7]'
            }`}
          >
            Semua Kategori
          </button>
          {categoryTabs.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#4A5F4E] text-white'
                  : 'bg-[#F3EFE6] text-[#3E4641] hover:bg-[#E6ECE7]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E6DFD1] rounded-xl overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-[#F3EFE6]" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-24 bg-[#F3EFE6] rounded" />
                <div className="h-5 w-3/4 bg-[#F3EFE6] rounded" />
                <div className="h-4 w-1/2 bg-[#F3EFE6] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium cursor-pointer"
          >
            Muat Ulang
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-[#E6DFD1] rounded-xl p-12 text-center">
          <Package className="w-10 h-10 text-[#5B7360] mx-auto mb-3 opacity-80" strokeWidth={1.5} />
          <h2 className="text-base font-semibold text-[#1F2421] mb-2">
            Belum Ada Produk Dipublikasikan
          </h2>
          <p className="text-sm text-[#4A524C] max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'all'
              ? 'Tidak ada produk yang sesuai dengan filter atau kata kunci pencarian saat ini.'
              : 'Katalog produk publik belum memiliki item berstatus terbit. Silakan periksa kembali nanti.'}
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                handleSelectCategory('all');
              }}
              className="mt-5 px-4 py-2 rounded-lg border border-[#CDD9CE] text-xs font-medium text-[#1F2421] hover:bg-[#F4F6F4] cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-[#666F69] mb-4 tabular-nums">
            Menampilkan {filteredProducts.length} produk terpublikasi
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
