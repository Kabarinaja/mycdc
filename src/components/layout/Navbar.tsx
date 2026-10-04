import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Award, MessageCircle, Menu as MenuIcon, X, UtensilsCrossed, Receipt } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export const Navbar: React.FC = () => {
  const { profile } = useAuth();
  const { totalItemsCount } = useCart();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { label: 'Beranda', to: '/' },
    { label: 'Menu', to: '/menu' },
    { label: 'Pesanan', to: '/pesanan' },
    { label: 'Member & Poin', to: '/member' },
    { label: 'Chat Outlet', to: '/chat' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <img
              src="https://cdn.phototourl.com/member/2026-10-04-0358363c-e2cc-469e-8e79-0f841bfb3c3c.png"
              alt="Logo MY CDC GATSU"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-stone-900 leading-tight">
                MY CDC GATSU
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600">
                Dicelup Ayam Crispy
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  isActive(link.to)
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons (Cart, Points, Profile) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Member Points Quick Badge (if logged in) */}
            {profile && (
              <Link
                to="/poin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold hover:bg-amber-100 transition-colors"
                title="Saldo Poin Member"
              >
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>{profile.points} Poin</span>
              </Link>
            )}

            {/* Cart Button */}
            <Link
              to="/checkout"
              className="relative p-2 rounded-xl text-stone-700 hover:bg-stone-100 transition-colors focus:outline-none"
              aria-label="Keranjang Belanja"
            >
              <ShoppingBag className="w-5 h-5 text-stone-800" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[11px] font-bold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {totalItemsCount}
                </span>
              )}
            </Link>

            {/* Profile / Login */}
            {profile ? (
              <Link
                to="/profil"
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[90px] truncate">{profile.name}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </Link>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden rounded-xl text-stone-700 hover:bg-stone-100 focus:outline-none"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-5 space-y-1.5 shadow-lg">
            {profile && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-sm">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900">{profile.name}</p>
                    <p className="text-[11px] text-stone-600 font-mono">{profile.memberId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-amber-700">Saldo Poin</p>
                  <p className="text-sm font-extrabold text-amber-900">{profile.points} Pts</p>
                </div>
              </div>
            )}

            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive(link.to)
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {profile ? (
              <Link
                to="/profil"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                Pengaturan Profil Saya
              </Link>
            ) : (
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center mt-2 px-3.5 py-2.5 rounded-xl bg-amber-500 text-stone-950 text-sm font-bold shadow-sm"
              >
                Daftar Member Baru
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar for rapid thumb access */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <Link
          to="/"
          className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
            isActive('/') ? 'text-amber-600 font-bold' : 'text-stone-500'
          }`}
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Beranda</span>
        </Link>
        <Link
          to="/menu"
          className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
            isActive('/menu') ? 'text-amber-600 font-bold' : 'text-stone-500'
          }`}
        >
          <MenuIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </Link>
        <Link
          to="/pesanan"
          className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
            isActive('/pesanan') ? 'text-amber-600 font-bold' : 'text-stone-500'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Pesanan</span>
        </Link>
        <Link
          to="/member"
          className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
            isActive('/member') ? 'text-amber-600 font-bold' : 'text-stone-500'
          }`}
        >
          <Award className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Member</span>
        </Link>
        <Link
          to="/chat"
          className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
            isActive('/chat') ? 'text-amber-600 font-bold' : 'text-stone-500'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Chat</span>
        </Link>
      </nav>
    </>
  );
};
