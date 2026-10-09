import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Lock, Mail, ArrowRight, Store, KeyRound } from 'lucide-react';
import { CompleteProfileModal } from '../components/common/CompleteProfileModal';
import { ResetPasswordModal } from '../components/common/ResetPasswordModal';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Mohon masukkan email dan kata sandi.', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      showToast('Selamat datang kembali di MY CDC GATSU!', 'success', 'Login Berhasil');
      navigate(redirect);
    } catch (err: any) {
      console.error(err);
      let msg = 'Email atau kata sandi tidak sesuai. Silakan periksa kembali.';
      if (err.code === 'auth/user-not-found') msg = 'Akun dengan email ini belum terdaftar.';
      if (err.code === 'auth/wrong-password') msg = 'Kata sandi salah. Silakan coba lagi.';
      showToast(msg, 'error', 'Gagal Masuk');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.isNewOrIncomplete) {
        setShowCompleteModal(true);
      } else {
        showToast('Berhasil masuk dengan akun Google!', 'success', 'Login Berhasil');
        navigate(redirect);
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        showToast('Jendela login Google ditutup sebelum selesai.', 'info');
      } else {
        showToast('Gagal masuk dengan Google: ' + (err.message || 'Coba lagi'), 'error');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-md">
        {/* Header with Logo */}
        <div className="text-center space-y-2">
          <img
            src="https://cdn.phototourl.com/member/2026-10-04-0358363c-e2cc-469e-8e79-0f841bfb3c3c.png"
            alt="Logo MY CDC GATSU"
            className="h-12 w-auto mx-auto object-contain"
          />
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Masuk Akun Member</h1>
          <p className="text-xs text-stone-500">
            Akses saldo poin, pesanan online, dan kartu loyalitas digital Anda
          </p>
        </div>

        {/* Google Sign In Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Menghubungkan Google...' : 'Lanjutkan dengan Google'}</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-stone-400">
              <span className="bg-white px-2">atau masuk dengan email</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Email Terdaftar</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">Kata Sandi</label>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-[11px] font-bold text-amber-600 hover:underline"
              >
                Lupa Kata Sandi?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? 'Memproses...' : 'Masuk Akun Sekarang'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-stone-100 text-xs text-stone-600">
          Belum punya akun member?{' '}
          <Link to={`/register?redirect=${redirect}`} className="font-bold text-amber-600 hover:underline">
            Daftar Sekarang (Gratis)
          </Link>
        </div>
      </div>

      {/* Complete Profile Modal for first time Google user */}
      <CompleteProfileModal
        isOpen={showCompleteModal}
        onSuccess={() => {
          setShowCompleteModal(false);
          navigate(redirect);
        }}
        onCancel={() => setShowCompleteModal(false)}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetModal}
        defaultEmail={email}
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
};

