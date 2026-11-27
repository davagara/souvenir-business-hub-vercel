import { ArrowLeft, CheckCircle2, MessageCircle, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SafeImage } from '../../components/SafeImage';
import { useInquiryCart } from '../../contexts/InquiryCartContext';
import { useStorefront } from '../../contexts/StorefrontContext';
import { fetchPublishedProductById } from '../../services/firestoreService';
import type { Product } from '../../types/models';
import { formatStartingPrice, formatWhatsAppUrl } from '../../utils/formatters';

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const { addItem } = useInquiryCart();
  const { settings } = useStorefront();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(50);
  const [customizationDetails, setCustomizationDetails] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!productId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const result = await fetchPublishedProductById(productId);
        if (!active) return;
        setProduct(result);
        if (result) {
          setSelectedColor(result.availableColors?.[0] || '');
          setSelectedSize(result.availableSizes?.[0] || '');
          setQuantity(result.minimumOrderQty || 50);
        }
      } catch {
        if (active) setProduct(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-pulse">
          <div className="lg:col-span-7 aspect-[4/3] bg-[#F3EFE6] rounded-xl" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-4 w-32 bg-[#F3EFE6] rounded" />
            <div className="h-8 w-3/4 bg-[#F3EFE6] rounded" />
            <div className="h-6 w-1/2 bg-[#F3EFE6] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-white border border-[#E6DFD1] rounded-xl p-10 max-w-lg mx-auto">
          <h1 className="font-editorial text-3xl font-semibold text-[#1F2421] mb-3">
            Produk Tidak Ditemukan
          </h1>
          <p className="text-sm text-[#4A524C] mb-6">
            Produk yang Anda cari tidak tersedia atau belum dipublikasikan.
          </p>
          <Link
            to="/katalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4A5F4E] text-white text-sm font-medium hover:bg-[#3B4D3F]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const photos = product.photos?.length ? product.photos : [''];
  const activePhoto = photos[selectedPhotoIdx] || photos[0];

  const handleAddToInquiry = () => {
    addItem(product, {
      quantity: Math.max(product.minimumOrderQty, quantity),
      selectedColor,
      selectedSize,
      customizationDetails,
    });
    setAddedSuccess(true);
    window.setTimeout(() => setAddedSuccess(false), 4000);
  };

  const whatsappDirectUrl = formatWhatsAppUrl(
    settings.whatsappNumber,
    `Halo ${settings.businessName}, saya tertarik dengan produk ${product.name} (${product.productCode}) untuk sekitar ${quantity} pcs.`
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="mb-6">
        <Link
          to="/katalog"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4A5F4E] hover:text-[#3B4D3F]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Katalog</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Gallery Left */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/3] w-full bg-white border border-[#E6DFD1] rounded-xl overflow-hidden">
            <SafeImage
              src={activePhoto}
              alt={product.name}
              fallbackLabel={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {photos.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto">
              {photos.map((photo, idx) => (
                <button
                  key={`${photo}-${idx}`}
                  type="button"
                  onClick={() => setSelectedPhotoIdx(idx)}
                  className={`w-20 h-16 rounded-lg overflow-hidden border transition-all cursor-pointer shrink-0 ${
                    selectedPhotoIdx === idx
                      ? 'border-[#4A5F4E] ring-2 ring-[#4A5F4E]/20'
                      : 'border-[#E6DFD1] opacity-75 hover:opacity-100'
                  }`}
                >
                  <SafeImage
                    src={photo}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contiguous Inquiry Purchase Module Right */}
        <div className="lg:col-span-5 bg-white border border-[#E6DFD1] rounded-xl p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#666F69] mb-2">
              <span>{product.categoryName}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{product.productCode}</span>
            </div>
            <h1 className="font-editorial text-3xl font-semibold text-[#1F2421] leading-tight mb-3">
              {product.name}
            </h1>
            <p className="text-xl font-semibold text-[#4A5F4E] tabular-nums">
              {formatStartingPrice(product.startingPrice)}
            </p>
            <p className="text-xs text-[#666F69] mt-1">
              Harga indikatif per pcs. Penawaran final mengikuti jumlah & detail kustomisasi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#F3EFE6] text-sm">
            <div>
              <p className="text-xs text-[#666F69]">Minimal Pemesanan</p>
              <p className="font-semibold text-[#1F2421] tabular-nums mt-0.5">
                {product.minimumOrderQty} pcs
              </p>
            </div>
            <div>
              <p className="text-xs text-[#666F69]">Estimasi Produksi</p>
              <p className="font-semibold text-[#1F2421] tabular-nums mt-0.5">
                {product.estimatedLeadTimeDays} hari kerja
              </p>
            </div>
          </div>

          <p className="text-sm text-[#3E4641] leading-relaxed">{product.description}</p>

          {product.specifications && (
            <div className="bg-[#FAF8F4] border border-[#E6DFD1] rounded-lg p-4">
              <p className="text-xs font-semibold text-[#1F2421] mb-1">Spesifikasi Produk</p>
              <p className="text-xs text-[#4A524C] leading-relaxed">{product.specifications}</p>
            </div>
          )}

          {/* Variations */}
          <div className="space-y-4">
            {product.availableColors && product.availableColors.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-[#1F2421] mb-2">
                  Pilihan Warna
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.availableColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        selectedColor === color
                          ? 'bg-[#4A5F4E] text-white border-[#4A5F4E]'
                          : 'bg-white text-[#3E4641] border-[#E6DFD1] hover:border-[#4A5F4E]'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.availableSizes && product.availableSizes.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-[#1F2421] mb-2">
                  Pilihan Ukuran
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        selectedSize === size
                          ? 'bg-[#4A5F4E] text-white border-[#4A5F4E]'
                          : 'bg-white text-[#3E4641] border-[#E6DFD1] hover:border-[#4A5F4E]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="qty-input" className="block text-xs font-medium text-[#1F2421] mb-1.5">
                Jumlah Pesanan (pcs)
              </label>
              <input
                id="qty-input"
                type="number"
                min={product.minimumOrderQty}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm text-[#1F2421] tabular-nums focus:outline-none focus:border-[#4A5F4E]"
              />
            </div>

            <div>
              <label
                htmlFor="custom-notes"
                className="block text-xs font-medium text-[#1F2421] mb-1.5"
              >
                Catatan Kustomisasi (Opsional)
              </label>
              <textarea
                id="custom-notes"
                rows={2}
                value={customizationDetails}
                onChange={(e) => setCustomizationDetails(e.target.value)}
                placeholder="Misal: Cetak monogram inisial A & R, pita sage green, kartu ucapan..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm text-[#1F2421] placeholder:text-[#666F69] focus:outline-none focus:border-[#4A5F4E]"
              />
            </div>
          </div>

          {addedSuccess && (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-[#E6ECE7] text-[#243027] text-xs font-medium">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Ditambahkan ke Keranjang Inquiry
              </span>
              <Link to="/keranjang-inquiry" className="underline font-semibold shrink-0">
                Lihat Keranjang
              </Link>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleAddToInquiry}
              className="flex items-center justify-center gap-2 w-full py-3 px-5 rounded-lg bg-[#4A5F4E] text-white text-sm font-medium hover:bg-[#3B4D3F] transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Tambah ke Keranjang Inquiry</span>
            </button>

            <a
              href={whatsappDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-5 rounded-lg border border-[#CDD9CE] bg-white text-[#1F2421] text-sm font-medium hover:bg-[#FAF8F4] transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#4A5F4E]" />
              <span>Tanya Produk Ini via WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
