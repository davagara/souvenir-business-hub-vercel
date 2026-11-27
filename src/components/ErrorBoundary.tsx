import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Terjadi kesalahan pada aplikasi.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let friendlyMessage =
        'Terjadi kendala saat memuat data. Silakan muat ulang halaman atau hubungi pemilik bisnis.';
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed && typeof parsed.error === 'string') {
          if (parsed.error.includes('permission') || parsed.error.includes('Missing or insufficient')) {
            friendlyMessage =
              'Akses data dibatasi oleh aturan keamanan Firestore. Pastikan Anda masuk dengan akun yang berwenang.';
          } else if (parsed.error.includes('Quota exceeded')) {
            friendlyMessage = 'Kuota harian database tercapai. Silakan coba kembali besok.';
          }
        }
      } catch {
        // Non-JSON error message
      }

      return (
        <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E6DFD1] rounded-xl p-8 text-center">
            <h1 className="font-editorial text-3xl font-semibold text-[#1F2421] mb-3">
              Terjadi Gangguan Sistem
            </h1>
            <p className="text-sm text-[#4A524C] leading-relaxed mb-6">{friendlyMessage}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-lg bg-[#4A5F4E] text-white text-sm font-medium hover:bg-[#3B4D3F] transition-colors cursor-pointer"
              >
                Muat Ulang Halaman
              </button>
              <Link
                to="/"
                onClick={() => this.setState({ hasError: false, errorMessage: '' })}
                className="px-5 py-2.5 rounded-lg border border-[#CDD9CE] text-[#1F2421] text-sm font-medium hover:bg-[#F4F6F4] transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
