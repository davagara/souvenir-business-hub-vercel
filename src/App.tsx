import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { InquiryCartProvider } from './contexts/InquiryCartContext';
import { StorefrontProvider } from './contexts/StorefrontContext';
import { AdminLayout } from './layouts/AdminLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminFinancePage } from './pages/admin/AdminFinancePage';
import { AdminInquiriesPage } from './pages/admin/AdminInquiriesPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminPurchaseOrdersPage } from './pages/admin/AdminPurchaseOrdersPage';
import { AdminQuotationsPage } from './pages/admin/AdminQuotationsPage';
import { AdminSalesOrdersPage } from './pages/admin/AdminSalesOrdersPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminSuppliersPage } from './pages/admin/AdminSuppliersPage';
import { CatalogPage } from './pages/public/CatalogPage';
import { CategoriesPage } from './pages/public/CategoriesPage';
import { ContactPage } from './pages/public/ContactPage';
import { HomePage } from './pages/public/HomePage';
import { InquiryCartPage } from './pages/public/InquiryCartPage';
import { ProductDetailPage } from './pages/public/ProductDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <StorefrontProvider>
            <InquiryCartProvider>
              <Routes>
                {/* Public Customer Website */}
                <Route
                  path="/"
                  element={
                    <PublicLayout>
                      <HomePage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/katalog"
                  element={
                    <PublicLayout>
                      <CatalogPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/kategori"
                  element={
                    <PublicLayout>
                      <CategoriesPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/produk/:productId"
                  element={
                    <PublicLayout>
                      <ProductDetailPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/keranjang-inquiry"
                  element={
                    <PublicLayout>
                      <InquiryCartPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/kontak"
                  element={
                    <PublicLayout>
                      <ContactPage />
                    </PublicLayout>
                  }
                />

                {/* Private Admin Management (Two Authorized Owners Only) */}
                <Route
                  path="/admin"
                  element={
                    <AdminLayout>
                      <AdminDashboardPage />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/pengaturan"
                  element={
                    <AdminLayout>
                      <AdminSettingsPage />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/kategori"
                  element={
                    <AdminLayout>
                      <AdminCategoriesPage />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/produk"
                  element={
                    <AdminLayout>
                      <AdminProductsPage />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/pelanggan"
                  element={
                    <AdminLayout>
                      <AdminCustomersPage />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/pemasok"
                  element={
                    <AdminLayout>
                      <AdminSuppliersPage />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/inquiry"
                  element={
                    <AdminLayout>
                      <AdminInquiriesPage />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/penawaran"
                  element={
                    <AdminLayout>
                      <AdminQuotationsPage />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/pesanan"
                  element={
                    <AdminLayout>
                      <AdminSalesOrdersPage />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/pembelian"
                  element={
                    <AdminLayout>
                      <AdminPurchaseOrdersPage />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/keuangan"
                  element={
                    <AdminLayout>
                      <AdminFinancePage />
                    </AdminLayout>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </InquiryCartProvider>
          </StorefrontProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
