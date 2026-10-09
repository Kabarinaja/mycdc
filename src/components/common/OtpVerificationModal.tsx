import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { ShieldCheck, Clock, RefreshCw, X, AlertCircle } from 'lucide-react';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDestination: string; // e.g. "0821xxxxxxx" or "email@..."
  targetType: 'phone' | 'email';
  onVerify: (otpCode: string) => Promise<boolean>;
  onResendOtp?: () => Promise<void>;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  targetDestination,
  targetType,
  onVerify,
  onResendOtp,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [expireTimer, setExpireTimer] = useState(300); // 5 minutes

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { showToast } = useNotification();

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setAttemptsLeft(3);
      setResendCooldown(60);
      setExpireTimer(300);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [isOpen]);

  // Timers
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      setExpireTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setErrorMsg('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const otpCode = digits.join('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otpCode.length < 6) {
      setErrorMsg('Mohon masukkan 6 digit kode OTP secara lengkap.');
      return;
    }

    if (expireTimer <= 0) {
      setErrorMsg('Kode OTP telah kedaluwarsa. Silakan minta kode baru.');
      return;
    }

    if (attemptsLeft <= 0) {
      setErrorMsg('Batas percobaan verifikasi habis. Silakan kirim ulang kode baru.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const isSuccess = await onVerify(otpCode);
      if (isSuccess) {
        showToast('Verifikasi OTP berhasil!', 'success', 'Terverifikasi');
        onClose();
      } else {
        const remaining = attemptsLeft - 1;
        setAttemptsLeft(remaining);
        if (remaining <= 0) {
          setErrorMsg('Kode OTP salah. Batas percobaan habis. Silakan minta kode baru.');
        } else {
          setErrorMsg(`Kode OTP salah. Sisa kesempatan verifikasi: ${remaining} kali.`);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memverifikasi kode OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setErrorMsg('');
    try {
      if (onResendOtp) {
        await onResendOtp();
      }
      setResendCooldown(60);
      setExpireTimer(300);
      setAttemptsLeft(3);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      showToast('Kode OTP baru berhasil dikirim ulang!', 'success', 'OTP Terkirim');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim ulang OTP.');
    } finally {
      setLoading(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex p-3 rounded-2xl bg-amber-100 text-amber-600 mb-1">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight">
            Verifikasi Kode OTP
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            Masukkan 6 digit kode rahasia yang telah dikirim ke{' '}
            <strong className="text-stone-800">{targetDestination}</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 6 Digit Inputs */}
          <div className="flex justify-center gap-2 sm:gap-3 py-2">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black rounded-2xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all shadow-xs"
              />
            ))}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Expiration and attempts info */}
          <div className="flex items-center justify-between text-[11px] text-stone-500 px-1 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Kedaluwarsa:{' '}
              <strong className={expireTimer < 60 ? 'text-rose-600' : 'text-stone-700'}>
                {formatSeconds(expireTimer)}
              </strong>
            </span>
            <span>
              Sisa percobaan:{' '}
              <strong className={attemptsLeft <= 1 ? 'text-rose-600' : 'text-stone-700'}>
                {attemptsLeft}x
              </strong>
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || otpCode.length < 6 || expireTimer <= 0 || attemptsLeft <= 0}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 text-xs font-black transition-colors shadow-sm"
          >
            {loading ? 'Memverifikasi...' : 'Verifikasi & Lanjutkan'}
          </button>

          {/* Resend button */}
          <div className="text-center pt-1">
            {resendCooldown > 0 ? (
              <p className="text-xs text-stone-400">
                Kirim ulang kode dalam <span className="font-mono font-bold text-stone-600">{resendCooldown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Kirim Ulang Kode OTP</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
