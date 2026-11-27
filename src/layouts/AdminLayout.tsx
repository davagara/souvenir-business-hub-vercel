import {
  ClipboardList,
  ExternalLink,
  Factory,
  FileText,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStorefront } from '../contexts/StorefrontContext';

interface AdminNavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { to: '/admin', label: 'Dasbor', icon: LayoutDashboard, end: true },
  { to: '/admin/inquiry', label: 'Manajemen Inquiry', icon: ClipboardList },
  { to: '/admin/penawaran', label: 'Penawaran (Quotation)', icon: FileText },
  { to: '/admin/pesanan', label: 'Pesanan Penjualan', icon: ShoppingCart },
  { to: '/admin/pembelian', label: 'Pembelian (PO)', icon: Truck },
  { to: '/admin/produk', label: 'Manajemen Produk', icon: Package },
  { to: '/admin/kategori', label: 'Manajemen Kategori', icon: FolderTree },
  { to: '/admin/pelanggan', label: 'Pelanggan', icon: Users },
  { to: '/admin/pemasok', label: 'Pemasok & Mitra', icon: Factory },
  { to: '/admin/keuangan', label: 'Keuangan', icon: Wallet },
  { to: '/admin/pengaturan', label: 'Pengaturan Bisnis', icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAuthorizedOwner, authLoading, authError, signInWithGoogle, logout } = useAuth();
  const { settings } = useStorefront();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentNav =
    ADMIN_NAV_ITEMS.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
    ) || ADMIN_NAV_ITEMS[0];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-6">
        <div className="bg-white border border-[#E6DFD1] rounded-xl p-8 max-w-sm w-full text-center">
          <div className="w-8 h-8 border-2 border-[#4A5F4E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-[#1F2421]">Memverifikasi sesi pemilik...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#E6DFD1] rounded-xl p-8">
          <div className="flex items-center gap-3 mb-4">
            {settings.logoUrl && (
              <img
                src={settings.logoUrl}
                alt={`Logo ${settings.businessName}`}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-lg object-cover border border-[#E6DFD1] bg-white shrink-0"
              />
            )}
            <div>
              <p className="text-xs font-medium text-[#4A5F4E]">Portal Internal Pemilik</p>
              <h1 className="font-editorial text-3xl font-semibold text-[#1F2421] leading-tight">
                {settings.businessName}
              </h1>
            </div>
          </div>
          <p className="text-sm text-[#4A524C] leading-relaxed mb-6">
            Masuk menggunakan akun Google resmi milik salah satu dari dua pemilik bisnis terdaftar untuk
            mengelola katalog, inquiry, penawaran, pesanan, dan keuangan.
          </p>

          {authError && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed">
              {authError}
            </div>
          )}

          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="w-full py-3 px-4 rounded-lg bg-[#4A5F4E] text-white text-sm font-medium hover:bg-[#3B4D3F] transition-colors cursor-pointer"
          >
            Masuk dengan Akun Google Pemilik
          </button>

          <div className="mt-6 pt-5 border-t border-[#F3EFE6] text-center">
            <Link
              to="/"
              className="text-xs font-medium text-[#4A5F4E] hover:text-[#3B4D3F] underline underline-offset-4"
            >
              Kembali ke Katalog Publik
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorizedOwner) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#E6DFD1] rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="font-editorial text-2xl font-semibold text-[#1F2421] mb-2">
            Akses Ditolak
          </h1>
          <p className="text-sm text-[#4A524C] leading-relaxed mb-2">
            Akun <span className="font-medium text-[#1F2421]">{user.email}</span> tidak terdaftar
            sebagai pemilik resmi pada sistem ini.
          </p>
          <p className="text-xs text-[#666F69] mb-6">
            Akses dasbor admin dibatasi secara ketat hanya untuk dua akun pemilik bisnis.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => void logout()}
              className="px-4 py-2.5 rounded-lg bg-[#1F2421] text-white text-xs font-medium hover:bg-[#3E4641] transition-colors cursor-pointer"
            >
              Keluar & Ganti Akun
            </button>
            <Link
              to="/"
              className="px-4 py-2.5 rounded-lg border border-[#CDD9CE] text-[#1F2421] text-xs font-medium hover:bg-[#F4F6F4] transition-colors"
            >
              Ke Katalog Publik
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E6DFD1]">
      <div className="h-16 px-5 flex items-center justify-between border-b border-[#E6DFD1]">
        <Link to="/admin" className="inline-flex items-center gap-2.5 min-w-0">
          {settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt={`Logo ${settings.businessName}`}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-md object-cover border border-[#E6DFD1] bg-white shrink-0"
            />
          )}
          <span className="font-editorial text-xl font-semibold text-[#1F2421] truncate">
            {settings.businessName}
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 rounded-lg text-[#3E4641] hover:bg-[#F4F6F4] cursor-pointer"
          aria-label="Tutup navigasi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Menu Admin">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#E6ECE7] text-[#243027]'
                    : 'text-[#3E4641] hover:bg-[#FAF8F4] hover:text-[#1F2421]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#E6DFD1] space-y-3">
        <div className="text-xs">
          <p className="font-medium text-[#1F2421] truncate">{user.displayName || 'Pemilik Bisnis'}</p>
          <p className="text-[#666F69] truncate">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg border border-[#E6DFD1] text-xs font-medium text-[#3E4641] hover:bg-[#FAF8F4] transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-[270px] max-w-[85vw] h-full z-10">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E6DFD1] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E6DFD1] text-[#1F2421] hover:bg-[#FAF8F4] cursor-pointer"
              aria-label="Buka menu admin"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-[#666F69] hidden sm:inline whitespace-nowrap">Panel Pemilik</span>
              <span className="text-[#CDD9CE] hidden sm:inline">/</span>
              <span className="font-semibold text-[#1F2421] truncate">{currentNav.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E6DFD1] bg-white text-xs font-medium text-[#1F2421] hover:bg-[#FAF8F4] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Lihat Katalog</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1320px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
