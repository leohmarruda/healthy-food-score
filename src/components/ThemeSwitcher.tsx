'use client';
import { useState, useEffect } from 'react';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState('default');
  const [mounted, setMounted] = useState(false);

  // When the component loads, check if a theme was saved in the browser
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('app-theme') || 'default';
    setTheme(savedTheme);
    // Set theme attribute on html element
    const html = document.documentElement;
    html.setAttribute('data-theme', savedTheme);
    // Force update background color
    html.style.backgroundColor = '';
    document.body.style.backgroundColor = '';
  }, []);

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
        THEME
      </label>
      <select
        id="theme-select"
        value={theme}
        onChange={(e) => changeTheme(e.target.value)}
        className="bg-card text-text-main border border-text-main/10 rounded-theme px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer"
      >
        <option value="default">✨ Modern Light</option>
        <option value="creamsicle">🍦 Creamsicle</option>
        <option value="organic">🌿 Organic Green</option>
        <option value="heritage">🏛️ Heritage</option>
        <option value="dark">🌙 Midnight Dark</option>
        <option value="cyberpunk">🌌 Cyberpunk</option>
      </select>
    </div>
  );
}