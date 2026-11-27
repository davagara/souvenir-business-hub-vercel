import { Clock, Instagram, Mail, MapPin, MessageCircle } from 'lucide-react';
import { useStorefront } from '../../contexts/StorefrontContext';
import { formatWhatsAppUrl } from '../../utils/formatters';

export function ContactPage() {
  const { settings } = useStorefront();

  const whatsappUrl = formatWhatsAppUrl(
    settings.whatsappNumber,
    `Halo ${settings.businessName}, saya ingin menghubungi tim Anda terkait pemesanan souvenir kustom.`
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <div className="max-w-2xl mb-10">
        <p className="text-xs font-medium text-[#4A5F4E] mb-2">Kontak Studio</p>
        <h1 className="font-editorial text-4xl font-semibold text-[#1F2421] mb-3">
          Hubungi {settings.businessName}
        </h1>
        <p className="text-sm text-[#4A524C] leading-relaxed">
          Diskusikan konsep souvenir pernikahan, pertunangan, ulang tahun, atau acara perusahaan
          bersama tim kami. Konsultasi desain dan estimasi penawaran tidak dipungut biaya.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white border border-[#E6DFD1] rounded-xl p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-semibold text-[#1F2421]">Informasi Kontak Resmi</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#4A5F4E] shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#1F2421]">Alamat Studio</p>
                <p className="text-[#4A524C] mt-1 leading-relaxed">{settings.address || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#4A5F4E] shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#1F2421]">Jam Operasional</p>
                <p className="text-[#4A524C] mt-1 leading-relaxed">
                  {settings.contactHours || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-[#4A5F4E] shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#1F2421]">Email</p>
                <p className="text-[#4A524C] mt-1">{settings.contactEmail || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Instagram className="w-5 h-5 text-[#4A5F4E] shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#1F2421]">Instagram</p>
                <p className="text-[#4A524C] mt-1">{settings.instagramHandle || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#243027] text-white rounded-xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-[#CDD9CE] mb-2">Respon Cepat</p>
            <h2 className="font-editorial text-3xl font-semibold mb-3">
              Konsultasi Langsung via WhatsApp
            </h2>
            <p className="text-sm text-[#CDD9CE] leading-relaxed mb-6">
              Sampaikan jenis acara, perkiraan jumlah tamu, dan referensi tema Anda. Tim kami siap
              membantu merekomendasikan produk beserta estimasi harga terbaik.
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-lg bg-white text-[#1F2421] text-sm font-semibold hover:bg-[#FAF8F4] transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#4A5F4E]" />
            <span>Mulai Chat WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
