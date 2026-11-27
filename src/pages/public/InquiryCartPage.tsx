import { CheckCircle2, MessageCircle, Send, ShoppingBag, Trash2, Upload } from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { SafeImage } from '../../components/SafeImage';
import { useInquiryCart } from '../../contexts/InquiryCartContext';
import { useStorefront } from '../../contexts/StorefrontContext';
import {
  submitPublicInquiry,
  uploadInquiryArtwork,
  type InquirySubmissionResult,
} from '../../services/inquiryService';
import { formatDateID, formatIDR, formatWhatsAppUrl } from '../../utils/formatters';

const EVENT_TYPES = [
  'Pernikahan (Wedding)',
  'Pertunangan (Engagement)',
  'Ulang Tahun (Birthday)',
  'Acara Korporat / Seminar',
  'Syukuran / Seremonial',
  'Lainnya',
];

export function InquiryCartPage() {
  const { items, updateItemQuantity, updateItemDetails, removeItem, clearCart } = useInquiryCart();
  const { settings } = useStorefront();

  const [customerName, setCustomerName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');

  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    result: InquirySubmissionResult;
    submittedItemsSummary: string;
  } | null>(null);

  const indicativeEstimate = items.reduce(
    (sum, item) => sum + item.startingPrice * item.quantity,
    0
  );

  const handleArtworkFileChange = async (
    cartKey: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file referensi desain maksimal 5 MB.');
      return;
    }
    setError(null);
    setUploadingKey(cartKey);
    try {
      const url = await uploadInquiryArtwork(file);
      updateItemDetails(cartKey, { artworkReferenceUrl: url });
    } catch {
      setError(
        'Gagal mengunggah file ke penyimpanan cloud. Anda tetap dapat menempelkan tautan referensi (Google Drive / Canva) di kolom URL.'
      );
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Keranjang inquiry masih kosong.');
      return;
    }
    if (customerName.trim().length < 2) {
      setError('Nama kontak wajib diisi (minimal 2 karakter).');
      return;
    }
    const cleanWa = whatsappNumber.replace(/[^\d+]/g, '');
    if (cleanWa.length < 8) {
      setError('Masukkan nomor WhatsApp aktif minimal 8 digit.');
      return;
    }
    if (!eventDate) {
      setError('Pilih perkiraan tanggal acara Anda.');
      return;
    }

    const itemsSummary = items
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.productName} (${item.productCode}) - ${item.quantity} pcs` +
          (item.selectedColor ? `, Warna: ${item.selectedColor}` : '') +
          (item.selectedSize ? `, Ukuran: ${item.selectedSize}` : '') +
          (item.customizationDetails ? ` [Kustom: ${item.customizationDetails}]` : '')
      )
      .join('\n');

    setSubmitting(true);
    try {
      const result = await submitPublicInquiry({
        customerName: customerName.trim(),
        whatsappNumber: cleanWa,
        eventType,
        eventDate,
        notes: notes.trim(),
        items,
      });

      clearCart();
      setSubmittedResult({ result, submittedItemsSummary: itemsSummary });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengirim inquiry. Silakan periksa data Anda dan coba kembali.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedResult) {
    const { result, submittedItemsSummary } = submittedResult;
    const prefilledWaText = [
      `Halo ${settings.businessName}, saya baru saja mengirimkan inquiry melalui katalog digital:`,
      `No. Inquiry: ${result.inquiryNumber}`,
      `Nama: ${result.customerName}`,
      `Acara: ${result.eventType} (${formatDateID(result.eventDate)})`,
      '',
      'Daftar Produk:',
      submittedItemsSummary,
      notes ? `\nCatatan: ${notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return (
      <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="bg-white border border-[#E6DFD1] rounded-xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-[#E6ECE7] text-[#243027] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <p className="text-xs font-medium text-[#4A5F4E] mb-2">Inquiry Berhasil Disimpan</p>
            <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#1F2421]">
              Terima Kasih, {result.customerName}
            </h1>
            <p className="text-sm text-[#4A524C] mt-2 max-w-lg mx-auto leading-relaxed">
              Permintaan penawaran Anda telah tercatat di sistem kami dengan nomor referensi resmi:
            </p>
          </div>

          <div className="bg-[#FAF8F4] border border-[#E6DFD1] rounded-xl p-5 max-w-md mx-auto text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#666F69]">Nomor Inquiry</span>
              <span className="font-mono font-semibold text-[#1F2421]">{result.inquiryNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666F69]">Acara</span>
              <span className="font-medium text-[#1F2421]">{result.eventType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666F69]">Tanggal Acara</span>
              <span className="tabular-nums text-[#1F2421]">{formatDateID(result.eventDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666F69]">Total Item</span>
              <span className="tabular-nums text-[#1F2421]">{result.itemCount} produk</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={formatWhatsAppUrl(settings.whatsappNumber, prefilledWaText)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg bg-[#4A5F4E] text-white text-sm font-medium hover:bg-[#3B4D3F] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Lanjutkan ke WhatsApp Studio</span>
            </a>

            <Link
              to="/katalog"
              onClick={() => setSubmittedResult(null)}
              className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-lg border border-[#CDD9CE] text-sm font-medium text-[#1F2421] hover:bg-[#FAF8F4]"
            >
              Kembali ke Katalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#4A5F4E] mb-2">Permintaan Penawaran</p>
          <h1 className="font-editorial text-4xl font-semibold text-[#1F2421]">
            Keranjang Inquiry
          </h1>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-medium text-[#666F69] hover:text-red-700 underline underline-offset-4 cursor-pointer self-start sm:self-auto"
          >
            Kosongkan Keranjang
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-[#E6DFD1] rounded-xl p-12 text-center max-w-2xl mx-auto">
          <ShoppingBag className="w-10 h-10 text-[#5B7360] mx-auto mb-3 opacity-80" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-[#1F2421] mb-2">
            Keranjang Inquiry Masih Kosong
          </h2>
          <p className="text-sm text-[#4A524C] mb-6">
            Pilih satu atau beberapa produk dari katalog untuk menyusun daftar permintaan penawaran
            kustom Anda.
          </p>
          <Link
            to="/katalog"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#4A5F4E] text-white text-sm font-medium hover:bg-[#3B4D3F] transition-colors"
          >
            Jelajahi Katalog Produk
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Selected Products & Customization */}
          <div className="lg:col-span-7 space-y-4">
            {items.map((item) => (
              <div
                key={item.cartKey}
                className="bg-white border border-[#E6DFD1] rounded-xl p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-28 aspect-[4/3] bg-[#F3EFE6] rounded-lg overflow-hidden shrink-0">
                    <SafeImage
                      src={item.photoUrl}
                      alt={item.productName}
                      fallbackLabel={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-mono text-[#666F69]">{item.productCode}</p>
                        <Link
                          to={`/produk/${item.productId}`}
                          className="text-base font-semibold text-[#1F2421] hover:text-[#4A5F4E]"
                        >
                          {item.productName}
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.cartKey)}
                        className="p-2 text-[#666F69] hover:text-red-700 rounded-lg hover:bg-[#FAF8F4] cursor-pointer"
                        aria-label={`Hapus ${item.productName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#4A524C]">
                      {item.selectedColor && <span>Warna: {item.selectedColor}</span>}
                      {item.selectedSize && <span>Ukuran: {item.selectedSize}</span>}
                      <span className="tabular-nums">
                        Estimasi mulai {formatIDR(item.startingPrice)}/pcs
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`qty-${item.cartKey}`}
                          className="text-xs font-medium text-[#3E4641]"
                        >
                          Jumlah (pcs):
                        </label>
                        <input
                          id={`qty-${item.cartKey}`}
                          type="number"
                          min={item.minimumOrderQty}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItemQuantity(item.cartKey, Number(e.target.value))
                          }
                          className="w-24 px-3 py-1.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm tabular-nums text-[#1F2421]"
                        />
                      </div>
                      <p className="text-sm font-semibold text-[#1F2421] tabular-nums">
                        {formatIDR(item.startingPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F3EFE6] grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#3E4641] mb-1">
                      Detail Kustomisasi
                    </label>
                    <input
                      type="text"
                      value={item.customizationDetails}
                      onChange={(e) =>
                        updateItemDetails(item.cartKey, { customizationDetails: e.target.value })
                      }
                      placeholder="Tulisan cetak, warna pita, kartu..."
                      className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-xs text-[#1F2421]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#3E4641] mb-1">
                      Referensi Artwork (URL atau Unggah)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.artworkReferenceUrl}
                        onChange={(e) =>
                          updateItemDetails(item.cartKey, { artworkReferenceUrl: e.target.value })
                        }
                        placeholder="https://... atau unggah"
                        className="w-full px-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-xs text-[#1F2421]"
                      />
                      <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#CDD9CE] bg-white text-xs font-medium text-[#1F2421] hover:bg-[#FAF8F4] cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingKey === item.cartKey ? '...' : 'File'}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => void handleArtworkFileChange(item.cartKey, e)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Inquiry Submission Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-5 bg-white border border-[#E6DFD1] rounded-xl p-6 space-y-4"
          >
            <div>
              <h2 className="text-lg font-semibold text-[#1F2421]">Formulir Pengajuan Inquiry</h2>
              <p className="text-xs text-[#666F69] mt-1">
                Estimasi awal: <span className="font-semibold text-[#4A5F4E] tabular-nums">{formatIDR(indicativeEstimate)}</span> (belum mengikat)
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="inq-name" className="block text-xs font-medium text-[#1F2421] mb-1">
                Nama Kontak *
              </label>
              <input
                id="inq-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama lengkap atau PIC acara"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              />
            </div>

            <div>
              <label htmlFor="inq-wa" className="block text-xs font-medium text-[#1F2421] mb-1">
                Nomor WhatsApp Aktif *
              </label>
              <input
                id="inq-wa"
                type="tel"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="inq-event" className="block text-xs font-medium text-[#1F2421] mb-1">
                  Jenis Acara *
                </label>
                <select
                  id="inq-event"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="inq-date" className="block text-xs font-medium text-[#1F2421] mb-1">
                  Tanggal Acara *
                </label>
                <input
                  id="inq-date"
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="inq-notes" className="block text-xs font-medium text-[#1F2421] mb-1">
                Catatan Tambahan
              </label>
              <textarea
                id="inq-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Lokasi pengiriman, tema warna, atau kebutuhan khusus lainnya..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-[#4A5F4E] text-white text-sm font-medium hover:bg-[#3B4D3F] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Menyimpan Inquiry...' : 'Kirim Permintaan Penawaran'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
