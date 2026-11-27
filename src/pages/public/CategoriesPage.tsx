import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SafeImage } from '../../components/SafeImage';
import { STANDARD_CATEGORIES } from '../../constants/catalogDefaults';
import { fetchActiveCategories, fetchPublishedProducts } from '../../services/firestoreService';
import type { CatalogCategory, Product } from '../../types/models';

export function CategoriesPage() {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          fetchActiveCategories(),
          fetchPublishedProducts(),
        ]);
        if (!active) return;
        setCategories(cats);
        setProducts(prods);
      } catch {
        // Fallback gracefully to standard category showcase
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const displayCategories =
    categories.length > 0
      ? categories
      : STANDARD_CATEGORIES.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description,
          imageUrl: c.imageUrl,
          sortOrder: c.sortOrder,
          isActive: true,
        }));

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="mb-10">
        <p className="text-xs font-medium text-[#4A5F4E] mb-2">Klasifikasi Produk</p>
        <h1 className="font-editorial text-4xl font-semibold text-[#1F2421] mb-3">
          Kategori Souvenir & Bingkisan
        </h1>
        <p className="text-sm text-[#4A524C] max-w-2xl leading-relaxed">
          Pilih kategori sesuai jenis acara atau tipe produk yang Anda butuhkan untuk melihat daftar
          souvenir yang tersedia.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E6DFD1] rounded-xl overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-[#F3EFE6]" />
              <div className="p-5 space-y-2">
                <div className="h-5 w-1/2 bg-[#F3EFE6] rounded" />
                <div className="h-4 w-3/4 bg-[#F3EFE6] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCategories.map((cat) => {
            const count = products.filter(
              (p) => p.categoryId === cat.id || p.categoryName === cat.name
            ).length;
            return (
              <Link
                key={cat.id}
                to={`/katalog?kategori=${cat.id}`}
                className="group bg-white border border-[#E6DFD1] rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[4/3] w-full bg-[#F3EFE6] overflow-hidden">
                  <SafeImage
                    src={cat.imageUrl}
                    alt={cat.name}
                    fallbackLabel={cat.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h2 className="text-lg font-semibold text-[#1F2421] group-hover:text-[#4A5F4E] transition-colors">
                      {cat.name}
                    </h2>
                    <span className="text-xs text-[#666F69] tabular-nums shrink-0">
                      {count} produk
                    </span>
                  </div>
                  <p className="text-sm text-[#4A524C] leading-relaxed line-clamp-2 mb-4">
                    {cat.description || 'Koleksi souvenir kustom pilihan dalam kategori ini.'}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4A5F4E]">
                    <span>Telusuri Kategori</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
