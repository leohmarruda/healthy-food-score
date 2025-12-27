'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  // Descobre o idioma atual através da URL
  const currentLang = pathname.split('/')[1] || 'pt';

  const handleLanguageChange = (newLang: string) => {
    // 1. Pega o caminho atual (ex: /pt/manage)
    const segments = pathname.split('/');
    // 2. Substitui o idioma (o segundo elemento do array após o split)
    segments[1] = newLang;
    // 3. Monta a nova URL (ex: /en/manage)
    const newPath = segments.join('/');
    
    // Navega para a nova URL
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentLang}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-card text-text-main border border-text-main/10 rounded-theme px-2 py-1 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all hover:border-primary/50"
      >
        <option value="pt">🇧🇷 PT</option>
        <option value="en">🇺🇸 EN</option>
      </select>
    </div>
  );
}