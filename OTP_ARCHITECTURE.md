# KEPUTUSAN ARSITEKTUR OTP & AUTENTIKASI — MY CDC GATSU

Dokumen ini menjelaskan implementasi autentikasi, reset kata sandi, dan mekanisme OTP sesuai dengan aturan resmi Firebase Authentication dan batasan platform.

---

## 1. Reset Kata Sandi (Alur Native Firebase)

- **Status**: **AKTIF & BERFUNGSI PENUH**
- **Metode**: Firebase Auth Native `sendPasswordResetEmail(auth, email)`
- **Keamanan**:
  - Dikelola langsung oleh infrastruktur Google Firebase.
  - Tautan reset diverifikasi secara kriptografis dan kedaluwarsa setelah 60 menit.
  - Tidak mengekspos kata sandi lama atau rahasia server ke client.
  - Dilengkapi antarmuka bahasa Indonesia dengan countdown kirim ulang 60 detik.

---

## 2. Kode OTP 6-Digit via SMS (Firebase Phone Auth)

- **Didukung oleh**: Firebase Phone Authentication
- **Komponen**: `RecaptchaVerifier` + `signInWithPhoneNumber`
- **Konfigurasi Firebase Console yang Dibutuhkan**:
  1. Buka [Firebase Console](https://console.firebase.google.com/) > Project `mycdc-7035a`.
  2. Buka menu **Authentication** > **Sign-in method**.
  3. Aktifkan provider **Phone**.
  4. Untuk testing tanpa biaya pulsa SMS, tambahkan nomor telepon uji coba (misal `+6281234567890` dengan kode uji `123456`).
  5. Untuk produksi nomor nyata, Firebase memerlukan paket Blaze (Pay-as-you-go) untuk kuota SMS verifikasi global.

---

## 3. Kode OTP 6-Digit via Email (Arsitektur Backend Cloud Functions)

PENTING: Firebase Authentication Client SDK **TIDAK** menyediakan API native untuk menghasilkan dan mengirim kode 6-digit kustom ke email tanpa layanan tambahan. Mengklaim "Firebase mengirim OTP 6 digit email secara native" adalah tidak benar.

### Arsitektur yang Benar & Aman:
1. **Frontend**:
   - Komponen modal `OtpVerificationModal` (`src/components/common/OtpVerificationModal.tsx`) telah siap dipakai:
     - 6 kotak input terpisah dengan auto-focus dan paste support.
     - Countdown kedaluwarsa 5 menit.
     - Cooldown kirim ulang 60 detik.
     - Proteksi maksimal 3x percobaan salah.
2. **Backend / Cloud Functions**:
   - Endpoint: `POST /api/send-email-otp`
     - Menghasilkan kode numerik acak 6 digit secara server-side (misal `crypto.randomInt(100000, 999999)`).
     - Meng-hash kode dengan salt (misal bcrypt/SHA-256) dan menyimpannya di Firestore dengan TTL 5 menit.
     - Mengirim email berisi kode 6 digit via penyedia email transaksional resmi (misal Resend, Brevo, SendGrid, atau Postmark).
   - Endpoint: `POST /api/verify-email-otp`
     - Membandingkan kode yang dimasukkan dengan hash yang tersimpan di server.
     - Menolak dan mengunci jika salah lebih dari 3 kali.
     - Menghapus OTP setelah berhasil diverifikasi.
