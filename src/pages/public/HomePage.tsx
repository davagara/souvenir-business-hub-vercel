import { ArrowRight, MessageCircle, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../../components/ProductCard';
import { SafeImage } from '../../components/SafeImage';
import { GENERATED_ASSETS, STANDARD_CATEGORIES } from '../../constants/catalogDefaults';
import { useStorefront } from '../../contexts/StorefrontContext';
import { fetchPublishedProducts } from '../../services/firestoreService';
import type { Product } from '../../types/models';
import { formatWhatsAppUrl } from '../../utils/formatters';

export function HomePage() {
  const { settings } = useStorefront();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const products = await fetchPublishedProducts();
        if (!active) return;
        const featured = products.filter((p) => p.isFeatured);
        setFeaturedProducts((featured.length > 0 ? featured : products).slice(0, 6));
      } catch {
        if (active) {
          setError('Gagal memuat produk unggulan dari katalog.');
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

  const whatsappUrl = formatWhatsAppUrl(
    settings.whatsappNumber,
    `Halo ${settings.businessName}, saya ingin berkonsultasi mengenai souvenir kustom untuk acara saya.`
  );

  const highlightCategories = STANDARD_CATEGORIES.slice(0, 4);

  return (
    <div>
      {/* Section 1: Split Editorial Hero */}
      <section className="bg-white border-b border-[#E6DFD1]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center py-4">
              <p className="text-xs font-medium text-[#4A5F4E] mb-4">
                Souvenir Kustom Made-to-Order · Indonesia
              </p>
              <h1
                className="font-editorial text-4xl sm:text-5xl lg:text-[54px] font-semibold text-[#1F2421] leading-[1.08] tracking-tight mb-6"
                style={{ textWrap: 'balance' }}
              >
                Cendera Mata Berkesan untuk Setiap Momen Istimewa
              </h1>
              <p className="text-base text-[#3E4641] leading-relaxed max-w-xl mb-8">
                {settings.tagline} Setiap produk dikurasi dan diproduksi sesuai pesanan bersama mitra
                percetakan dan pengrajin terpilih, lengkap dengan personalisasi nama, monogram, dan
                kemasan eksklusif.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/katalog"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#4A5F4E] text-white text-sm font-medium hover:bg-[#3B4D3F] transition-colors whitespace-nowrap"
                >
                  <span>Jelajahi Katalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[#CDD9CE] bg-[#FAF8F4] text-[#1F2421] text-sm font-medium hover:bg-[#E6ECE7] transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4 text-[#4A5F4E]" />
                  <span>Konsultasi WhatsApp</span>
                </a>
              </div>

              <div className="mt-10 pt-6 border-t border-[#F3EFE6] grid grid-cols-3 gap-4 max-w-lg">
                <div>
                  <p className="text-xs text-[#666F69]">Model Produksi</p>
                  <p className="text-sm font-semibold text-[#1F2421] mt-0.5">Made-to-Order</p>
                </div>
                <div>
                  <p className="text-xs text-[#666F69]">Kustomisasi</p>
                  <p className="text-sm font-semibold text-[#1F2421] mt-0.5">Desain & Kemasan</p>
                </div>
                <div>
                  <p className="text-xs text-[#666F69]">Mata Uang</p>
                  <p className="text-sm font-semibold text-[#1F2421] mt-0.5">Transparan (IDR)</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-[320px] sm:h-[420px] lg:h-full min-h-[380px] rounded-xl overflow-hidden bg-[#F3EFE6] border border-[#E6DFD1]">
                <SafeImage
                  src={GENERATED_ASSETS.heroAtelier}
                  alt={`Koleksi souvenir kustom ${settings.businessName}`}
                  fallbackLabel={settings.businessName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Featured Products from Firestore */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-medium text-[#4A5F4E] mb-2">Katalog Terkurasi</p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#1F2421]">
              Koleksi Produk Pilihan
            </h2>
          </div>
          <Link
            to="/katalog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4A5F4E] hover:text-[#3B4D3F] whitespace-nowrap"
          >
            <span>Lihat Semua Produk</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E6DFD1] rounded-xl overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-[#F3EFE6]" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-28 bg-[#F3EFE6] rounded" />
                  <div className="h-5 w-3/4 bg-[#F3EFE6] rounded" />
                  <div className="h-4 w-1/2 bg-[#F3EFE6] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
            <p className="text-sm text-red-700 mb-3">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="bg-white border border-[#E6DFD1] rounded-xl p-10 text-center">
            <Package className="w-10 h-10 text-[#5B7360] mx-auto mb-3 opacity-80" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-[#1F2421] mb-2">
              Katalog Produk Sedang Disiapkan
            </h3>
            <p className="text-sm text-[#4A524C] max-w-md mx-auto mb-6">
              Belum ada produk yang dipublikasikan oleh pemilik. Anda tetap dapat menelusuri kategori
              souvenir atau berkonsultasi langsung melalui WhatsApp.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/kategori"
                className="px-4 py-2.5 rounded-lg border border-[#CDD9CE] text-xs font-medium text-[#1F2421] hover:bg-[#F4F6F4]"
              >
                Lihat Daftar Kategori
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium hover:bg-[#3B4D3F]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Tanya Katalog via WhatsApp</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Curated Categories Showcase */}
      <section className="bg-[#F3EFE6]/70 border-y border-[#E6DFD1]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-medium text-[#4A5F4E] mb-2">Kebutuhan Acara</p>
              <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#1F2421]">
                Kategori Souvenir Utama
              </h2>
            </div>
            <Link
              to="/kategori"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4A5F4E] hover:text-[#3B4D3F] whitespace-nowrap"
            >
              <span>Semua 10 Kategori</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlightCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/katalog?kategori=${cat.id}`}
                className="group bg-white border border-[#E6DFD1] rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#F3EFE6]">
                  <SafeImage
                    src={cat.imageUrl}
                    alt={cat.name}
                    fallbackLabel={cat.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-[#1F2421] group-hover:text-[#4A5F4E] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#4A524C] mt-1.5 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Made-to-Order Craftsmanship Flow */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-medium text-[#4A5F4E] mb-2">Proses Kerja Kami</p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#1F2421]">
            Dari Konsep Acara hingga Pengiriman Tepat Waktu
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E6DFD1] rounded-xl p-6">
            <h3 className="text-base font-semibold text-[#1F2421] mb-2">
              01. Pilih Produk & Kirim Inquiry
            </h3>
            <p className="text-sm text-[#4A524C] leading-relaxed">
              Telusuri katalog, pilih variasi warna dan jumlah pesanan, lalu kirimkan permintaan
              penawaran sesuai tanggal acara Anda.
            </p>
          </div>
          <div className="bg-white border border-[#E6DFD1] rounded-xl p-6">
            <h3 className="text-base font-semibold text-[#1F2421] mb-2">
              02. Penawaran Resmi & Produksi
            </h3>
            <p className="text-sm text-[#4A524C] leading-relaxed">
              Tim kami mengonfirmasi harga cetak kustom dan waktu pengerjaan bersama mitra pemasok
              terkurasi sebelum produksi dimulai.
            </p>
          </div>
          <div className="bg-white border border-[#E6DFD1] rounded-xl p-6">
            <h3 className="text-base font-semibold text-[#1F2421] mb-2">
              03. Inspeksi Kualitas & Pengiriman
            </h3>
            <p className="text-sm text-[#4A524C] leading-relaxed">
              Setiap batch melewati pengecekan detail cetakan dan kemasan sebelum dijadwalkan
              pengirimannya ke lokasi acara Anda.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
