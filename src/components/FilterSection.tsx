// components/FilterSection.tsx
'use client';

export default function FilterSection() {
  const themes = ['Fantasy', 'Sci-Fi', 'Horror', 'Romance'];
  
  return (
    <div className="p-4 bg-gray-50 border rounded-xl mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter Stories</h3>
      <div className="flex flex-wrap gap-2">
        {themes.map((theme) => (
          <button 
            key={theme}
            className="px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-full hover:border-indigo-500 hover:text-indigo-600 transition-colors"
          >
            {theme}
          </button>
        ))}
      </div>
    </div>
  );
}