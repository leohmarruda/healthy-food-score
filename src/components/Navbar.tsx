'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getDictionary } from '@/lib/get-dictionary';

export default function Navbar() {
  const pathname = usePathname();
  const [dict, setDict] = useState<any>(null);

  // Detecta o idioma atual da URL (sempre o primeiro segmento)
  const lang = pathname.split('/')[1] || 'pt';

  useEffect(() => {
    async function load() {
      const d = await getDictionary(lang);
      setDict(d);
    }
    load();
  }, [lang]);

  const navLinks = [
    { 
      name: dict?.common?.library || 'Library', 
      href: `/${lang}` 
    },
    { 
      name: dict?.common?.addFood || 'Add Food', 
      href: `/${lang}/add-food` 
    },
    { 
      name: dict?.common?.manage || 'Manage', 
      href: `/${lang}/manage` 
    },
  ];

  return (
    <nav className="bg-card border-b border-text-main/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
        
        {/* Logo respeitando o idioma */}
        <Link href={`/${lang}`} className="flex items-center gap-2">
          <span className="text-xl font-bold bg-primary text-white px-2 py-1 rounded-theme">HFS</span>
          <span className="font-bold text-text-main hidden sm:block">Healthy Food Score</span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
             {/* Se quiser colocar o seletor de língua ao lado do tema */}
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>

          <div className="h-6 w-[1px] bg-text-main/10" /> {/* Divisor visual */}

          <div className="flex gap-6">
            {navLinks.map((link) => {
              // Verifica se o link está ativo (exatamente igual ao pathname)
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