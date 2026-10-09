# UI Redesign Notes — DICELUP AYAM CRISPY / MY CDC GATSU

Redesign ini hanya menyentuh presentasi/UI dan shell navigasi. Logic Firebase, authentication, cart, checkout, order, member/points, chat page, admin routes, dan halaman lain tidak dihapus.

## Yang diubah
- Home dibuat mobile-first dan lebih sederhana, dengan hierarki visual seperti aplikasi food-ordering modern.
- Card grid produk di halaman Beranda DIHAPUS sesuai permintaan. Produk tetap tersedia melalui halaman `/menu`.
- Hero besar dengan foto produk di Beranda dihilangkan agar halaman tidak terasa seperti template AI.
- Header dirapikan: logo + brand, cart, profil, dan menu tambahan.
- Mobile mendapat bottom navigation tetap: Beranda, Menu, Troli, Pesanan, Profil.
- Ditambahkan floating WhatsApp/Admin Chat yang mengecil kembali saat ditutup dan membuka panel kecil saat ditekan.
- Nomor WhatsApp tidak lagi ditampilkan sebagai teks di Footer; hanya ikon WhatsApp yang menjadi tombol.
- Member card didesain ulang menjadi kartu loyalty yang lebih ringkas, profesional, dan nyaman dibaca di HP; QR member dan poin tetap ada.
- Home mempertahankan promo, member, layanan delivery, info MKI, jam operasional, dan Google Maps dalam bentuk yang lebih ringkas.
- SEO title dan meta description utama diubah menjadi brand DICELUP AYAM CRISPY INDRAMAYU.
- Global CSS dirapikan untuk mobile, safe-area Android/iPhone, scrollbar, typography, dan touch target.

## Yang sengaja tidak diubah
- Firebase / authentication.
- Firestore dan data member.
- Keranjang dan checkout.
- Riwayat pesanan.
- Sistem poin/member.
- Chat page dan admin chat.
- Halaman admin serta seluruh route admin.
- Halaman Menu dan logika customizer produk.
- Struktur Vite/React/TypeScript.
