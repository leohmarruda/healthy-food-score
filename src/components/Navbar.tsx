'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Library', href: '/' },
    { name: 'Add Food', href: '/add-food' },
    { name: 'Manage', href: '/manage' },
  ];

  return (
    <nav className="bg-card border-b border-text-main/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold bg-primary text-white px-2 py-1 rounded-theme">FL</span>
          <span className="font-bold text-text-main hidden sm:block">FoodLibrary</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <div className="flex gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-text-main/70 hover:text-primary'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}