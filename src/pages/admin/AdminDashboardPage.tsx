import { CalendarClock, Database, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchDashboardMetrics,
  seedDevelopmentDemoCatalog,
} from '../../services/firestoreService';
import type { DashboardMetrics } from '../../types/models';
import { formatIDR } from '../../utils/formatters';

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch {
      setError('Gagal menghitung metrik dasbor dari Firestore.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  const handleSeedDevDemo = async () => {
    setSeeding(true);
    setSeedMessage(null);
    try {
      await seedDevelopmentDemoCatalog();
      setSeedMessage('Data demo pengembangan (10 kategori & 4 produk contoh) berhasil dimuat.');
      await loadMetrics();
    } catch {
      setSeedMessage('Gagal memuat data demo pengembangan.');
    } finally {
      setSeeding(false);
    }
  };

  const kpiCards = metrics
    ? [
        { label: 'Total Inquiry', value: String(metrics.totalInquiries), sub: 'Semua permintaan masuk' },
        { label: 'Inquiry Baru', value: String(metrics.newInquiries), sub: 'Status NEW perlu ditinjau' },
        { label: 'Pesanan Aktif', value: String(metrics.activeOrders), sub: 'Sedang diproses & produksi' },
        { label: 'Penawaran Tertunda', value: String(metrics.pendingQuotations), sub: 'Status DRAFT atau SENT' },
        { label: 'Penjualan Bulan Ini', value: formatIDR(metrics.monthlySalesTotal), sub: 'Total Sales Order bulan berjalan' },
        { label: 'Piutang Pelanggan', value: formatIDR(metrics.outstandingCustomerPayments), sub: 'Sisa tagihan pelanggan' },
        { label: 'Hutang Pemasok', value: formatIDR(metrics.outstandingSupplierPayments), sub: 'Sisa pembayaran PO pemasok' },
        { label: 'Tenggat Pengiriman', value: String(metrics.upcomingDeliveries.length), sub: 'Jadwal kirim aktif terdekat' },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#1F2421]">
            Ringkasan Operasional
          </h1>
          <p className="text-sm text-[#4A524C] mt-1">
            Seluruh metrik dihitung langsung dari dokumen Cloud Firestore secara real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadMetrics()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E6DFD1] bg-white text-xs font-medium text-[#1F2421] hover:bg-[#FAF8F4] disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {error && (
        <div className="bg-white border border-red-200 rounded-xl p-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
            <div key={idx} className="bg-white border border-[#E6DFD1] rounded-xl p-5 animate-pulse">
              <div className="h-3 w-24 bg-[#F3EFE6] rounded mb-3" />
              <div className="h-7 w-32 bg-[#F3EFE6] rounded mb-2" />
              <div className="h-3 w-36 bg-[#F3EFE6] rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <div key={card.label} className="bg-white border border-[#E6DFD1] rounded-xl p-5">
              <p className="text-xs font-medium text-[#666F69]">{card.label}</p>
              <p className="text-2xl font-semibold text-[#1F2421] tabular-nums mt-2 mb-1">
                {card.value}
              </p>
              <p className="text-xs text-[#666F69]">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Delivery Deadlines Table */}
      <div className="bg-white border border-[#E6DFD1] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E6DFD1] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#4A5F4E]" />
            <h2 className="text-base font-semibold text-[#1F2421]">
              Tenggat Pengiriman Mendatang
            </h2>
          </div>
          <Link
            to="/admin/pesanan"
            className="text-xs font-medium text-[#4A5F4E] hover:underline whitespace-nowrap"
          >
            Kelola Pesanan
          </Link>
        </div>

        {!metrics || metrics.upcomingDeliveries.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-[#1F2421] mb-1">
              Belum ada jadwal pengiriman aktif
            </p>
            <p className="text-xs text-[#666F69]">
              Jadwal pengiriman akan muncul otomatis saat pesanan penjualan masuk tahap pengiriman.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E6DFD1] bg-[#FAF8F4] text-xs text-[#666F69]">
                  <th className="py-3 px-6 font-medium">Referensi Pengiriman</th>
                  <th className="py-3 px-6 font-medium">Penerima</th>
                  <th className="py-3 px-6 font-medium">Tenggat (DD/MM/YYYY)</th>
                  <th className="py-3 px-6 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE6]">
                {metrics.upcomingDeliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-[#FAF8F4]">
                    <td className="py-3 px-6 font-mono text-xs text-[#1F2421]">{del.label}</td>
                    <td className="py-3 px-6 text-[#1F2421]">{del.customerOrRecipient}</td>
                    <td className="py-3 px-6 tabular-nums text-[#3E4641]">{del.deadline}</td>
                    <td className="py-3 px-6 text-xs font-medium text-[#4A5F4E]">{del.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions & Dev-Only Demo Data Loader */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E6DFD1] rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#1F2421]">Pengaturan Awal Bisnis</h2>
          <p className="text-sm text-[#4A524C] leading-relaxed">
            Lengkapi profil studio, nomor WhatsApp, dan konfigurasi pemilik kedua melalui menu
            Pengaturan Bisnis serta inisialisasi kategori produk di Manajemen Kategori.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/pengaturan"
              className="px-4 py-2 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium hover:bg-[#3B4D3F]"
            >
              Buka Pengaturan Bisnis
            </Link>
            <Link
              to="/admin/kategori"
              className="px-4 py-2 rounded-lg border border-[#CDD9CE] text-xs font-medium text-[#1F2421] hover:bg-[#FAF8F4]"
            >
              Kelola Kategori
            </Link>
          </div>
        </div>

        {import.meta.env.DEV && (
          <div className="bg-[#F3EFE6] border border-[#E6DFD1] rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#4A5F4E]">
              <Database className="w-4 h-4" />
              <span>Lingkungan Pengembangan (Dev Only)</span>
            </div>
            <h2 className="text-base font-semibold text-[#1F2421]">
              Muat Data Contoh Katalog Pengembangan
            </h2>
            <p className="text-xs text-[#4A524C] leading-relaxed">
              Tombol ini hanya tersedia di mode development untuk mengisi 10 kategori standar dan
              4 produk souvenir contoh ke Firestore guna pengujian katalog publik.
            </p>
            {seedMessage && (
              <p className="text-xs font-medium text-[#243027] bg-white px-3 py-2 rounded-lg border border-[#CDD9CE]">
                {seedMessage}
              </p>
            )}
            <button
              type="button"
              onClick={() => void handleSeedDevDemo()}
              disabled={seeding}
              className="px-4 py-2 rounded-lg bg-[#1F2421] text-white text-xs font-medium hover:bg-[#3E4641] disabled:opacity-50 cursor-pointer"
            >
              {seeding ? 'Memuat Data Contoh...' : 'Muat Data Contoh Pengembangan'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
