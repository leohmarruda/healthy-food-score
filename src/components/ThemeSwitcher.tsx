'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getDictionary } from '@/lib/get-dictionary';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState('default');
  const [mounted, setMounted] = useState(false);
  const [dict, setDict] = useState<any>(null);
  
  const params = useParams();
  const lang = (params?.lang as string) || 'pt';

  useEffect(() => {
    setMounted(true);
    
    // Carregar tema salvo
    const savedTheme = localStorage.getItem('app-theme') || 'default';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Carregar dicionário para as labels dos temas
    async function loadDict() {
      const d = await getDictionary(lang as 'pt' | 'en');
      setDict(d);
    }
    loadDict();
  }, [lang]);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    // Update the <html> tag so the CSS variables change
    const html = document.documentElement;
    html.setAttribute('data-theme', newTheme);
    // Force CSS variable recalculation
    html.style.backgroundColor = '';
    document.body.style.backgroundColor = '';
    // Save the choice for next time
    localStorage.setItem('app-theme', newTheme);
  };

  // Prevent "Hydration Mismatch" (dropdown flickering on load)
  if (!mounted) return <div className="w-32 h-9 bg-card animate-pulse rounded-theme" />;


  return (
    <div className="flex items-center gap-2">
      <label htmlFor="theme-select" className="text-xs font-medium text-text-main/60">
      {dict?.theme?.theme}
      </label>
      <select
        id="theme-select"
        value={theme}
        onChange={(e) => changeTheme(e.target.value)}
        className="bg-card text-text-main border border-text-main/10 rounded-theme px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer"
      >
        <option value="default">✨ {dict?.theme?.themeModern}</option>
        <option value="creamsicle">🍦 {dict?.theme?.themeCreamsicle}</option>
        <option value="organic">🌿 {dict?.theme?.themeOrganic}</option>
        <option value="heritage">🏛️ {dict?.theme?.themeHeritage}</option>
        <option value="dark">🌙 {dict?.theme?.themeDark}</option>
        <option value="cyberpunk">🌌 {dict?.theme?.themeCyberpunk}</option>
      </select>
    </div>
  );
}