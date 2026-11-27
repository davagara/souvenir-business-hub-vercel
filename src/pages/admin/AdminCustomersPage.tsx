import { Plus, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { deleteCustomer, fetchAllCustomers, saveCustomer } from '../../services/operationsService';
import type { Customer } from '../../types/models';

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [companyOrEventName, setCompanyOrEventName] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCustomers(await fetchAllCustomers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openNew = () => {
    setEditingId(null);
    setName('');
    setWhatsappNumber('');
    setEmail('');
    setCompanyOrEventName('');
    setCity('');
    setNotes('');
    setShowForm(true);
  };

  const openEdit = (c: Customer) => {
    setEditingId(c.id);
    setName(c.name);
    setWhatsappNumber(c.whatsappNumber);
    setEmail(c.email || '');
    setCompanyOrEventName(c.companyOrEventName || '');
    setCity(c.city || '');
    setNotes(c.notes || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveCustomer(editingId, {
        name,
        whatsappNumber,
        email,
        companyOrEventName,
        city,
        notes,
      });
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.whatsappNumber.toLowerCase().includes(q) ||
        (c.companyOrEventName || '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#1F2421]">
            Manajemen Pelanggan
          </h1>
          <p className="text-sm text-[#4A524C] mt-1">
            Direktori kontak pelanggan pribadi, perusahaan, dan panitia acara.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium hover:bg-[#3B4D3F] cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#E6DFD1] rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#F3EFE6] pb-3">
            <h2 className="text-base font-semibold text-[#1F2421]">
              {editingId ? 'Ubah Data Pelanggan' : 'Tambah Pelanggan Baru'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1.5 text-[#666F69] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1F2421] mb-1">Nama *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2421] mb-1">
                Nomor WhatsApp *
              </label>
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2421] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2421] mb-1">
                Perusahaan / Nama Acara
              </label>
              <input
                type="text"
                value={companyOrEventName}
                onChange={(e) => setCompanyOrEventName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2421] mb-1">Kota</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1F2421] mb-1">Catatan</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-[#E6DFD1] text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-[#4A5F4E] text-white text-xs font-medium cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-[#E6DFD1] rounded-xl p-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-[#666F69] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pelanggan..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E6DFD1] bg-[#FAF8F4] text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-[#E6DFD1] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-[#666F69]">Memuat data pelanggan...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#666F69]">Belum ada data pelanggan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E6DFD1] bg-[#FAF8F4] text-xs text-[#666F69]">
                  <th className="py-3 px-4 font-medium">Nama</th>
                  <th className="py-3 px-4 font-medium">WhatsApp</th>
                  <th className="py-3 px-4 font-medium">Acara / Perusahaan</th>
                  <th className="py-3 px-4 font-medium">Kota</th>
                  <th className="py-3 px-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFE6]">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF8F4]">
                    <td className="py-3 px-4 font-medium text-[#1F2421]">{c.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-[#3E4641]">{c.whatsappNumber}</td>
                    <td className="py-3 px-4 text-[#3E4641]">{c.companyOrEventName || '-'}</td>
                    <td className="py-3 px-4 text-[#666F69]">{c.city || '-'}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="text-xs font-medium text-[#4A5F4E] hover:underline mr-3 cursor-pointer"
                      >
                        Ubah
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteCustomer(c.id).then(load)}
                        className="text-[#666F69] hover:text-red-700 cursor-pointer inline-flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
  );
}
