import { Menu, MessageCircle, ShoppingBag, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useInquiryCart } from '../contexts/InquiryCartContext';
import { useStorefront } from '../contexts/StorefrontContext';
import { formatWhatsAppUrl } from '../utils/formatters';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { settings } = useStorefront();
  const { totalItemCount } = useInquiryCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const whatsappLink = formatWhatsAppUrl(
    settings.whatsappNumber,
    `Halo ${settings.businessName}, saya ingin berkonsultasi mengenai pemesanan souvenir kustom.`
  );

  const navLinks = [
    { to: '/', label: 'Beranda', end: true },
    { to: '/katalog', label: 'Katalog' },
    { to: '/kategori', label: 'Kategori' },
    {
      to: '/keranjang-inquiry',
      label: totalItemCount > 0 ? `Keranjang (${totalItemCount})` : 'Keranjang Inquiry',
    },
    { to: '/kontak', label: 'Kontak' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#1F2421]">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E6DFD1]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark & Logo */}
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 font-editorial text-2xl font-semibold tracking-tight text-[#1F2421] whitespace-nowrap shrink-0 hover:text-[#4A5F4E] transition-colors"
          >
            {settings.logoUrl && (
              <img
                src={settings.logoUrl}
                alt={`Logo ${settings.businessName}`}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-lg object-cover border border-[#E6DFD1] bg-white shrink-0"
              />
            )}
            <span>{settings.businessName}</span>
          </Link>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav className="hidden lg:flex items-center gap-7" aria-label="Navigasi utama">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    isActive
                      ? 'text-[#4A5F4E] border-[#4A5F4E]'
                      : 'text-[#3E4641] border-transparent hover:text-[#1F2421] hover:border-[#CDD9CE]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: 1 primary CTA button + mobile menu trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium hover:bg-[#3B4D3F] transition-colors whitespace-nowrap shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Konsultasi WhatsApp</span>
            </a>

            <Link
              to="/keranjang-inquiry"
              className="lg:hidden relative inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#E6DFD1] text-[#1F2421] hover:bg-[#F3EFE6] transition-colors"
              aria-label="Keranjang Inquiry"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#4A5F4E] text-white text-[11px] font-semibold flex items-center justify-center tabular-nums">
                  {totalItemCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#E6DFD1] text-[#1F2421] hover:bg-[#F3EFE6] transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-[#E6DFD1] px-4 py-4 space-y-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#F4F6F4] text-[#4A5F4E]'
                      : 'text-[#3E4641] hover:bg-[#FAF8F4]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-2">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-[#4A5F4E] text-white text-sm font-medium hover:bg-[#3B4D3F] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Konsultasi via WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-[#243027] text-[#FAF8F4] border-t border-[#3B4D3F]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt={`Logo ${settings.businessName}`}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-lg object-cover bg-white border border-[#3B4D3F] shrink-0"
                  />
                )}
                <h2 className="font-editorial text-2xl font-semibold text-white">
                  {settings.businessName}
                </h2>
              </div>
              <p className="text-sm text-[#CDD9CE] leading-relaxed max-w-sm">
                {settings.tagline}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Navigasi Katalog</h3>
              <ul className="space-y-2 text-sm text-[#CDD9CE]">
                <li>
                  <Link to="/katalog" className="hover:text-white transition-colors">
                    Semua Produk Souvenir
                  </Link>
                </li>
                <li>
                  <Link to="/kategori" className="hover:text-white transition-colors">
                    Kategori Acara & Produk
                  </Link>
                </li>
                <li>
                  <Link to="/keranjang-inquiry" className="hover:text-white transition-colors">
                    Keranjang Inquiry
                  </Link>
                </li>
                <li>
                  <Link to="/kontak" className="hover:text-white transition-colors">
                    Hubungi Kami
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Informasi Studio</h3>
              <div className="space-y-2 text-sm text-[#CDD9CE]">
                <p>{settings.address}</p>
                <p>{settings.contactHours}</p>
                <p>Instagram: {settings.instagramHandle}</p>
                <p>Email: {settings.contactEmail}</p>
              </div>
              <div className="mt-4">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5B7360] text-white text-xs font-medium hover:bg-[#4A5F4E] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat WhatsApp Studio</span>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#3B4D3F] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#CDD9CE]">
            <p>
              &copy; {new Date().getFullYear()} {settings.businessName} · Souvenir Business Hub.
            </p>
            <Link to="/admin" className="hover:text-white transition-colors underline underline-offset-4">
              Portal Manajemen Pemilik
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
