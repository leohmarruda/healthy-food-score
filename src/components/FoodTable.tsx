import { Food } from '@/types/food';
import HFSLabel from '@/components/HFSLabel';

interface FoodTableProps {
  foods: Food[];
  onFoodClick: (food: Food) => void;
  dict: any;
}

export default function FoodTable({ foods, onFoodClick, dict, sortConfig, onSort }: any) {
  const t = dict?.components?.foodTable || {};

  // Render sort arrow icon
  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <span className="ml-1 opacity-30 text-[10px]">↕</span>;
    return sortConfig.order === 'asc' 
      ? <span className="ml-1 text-primary text-[10px]">▲</span> 
      : <span className="ml-1 text-primary text-[10px]">▼</span>;
  };

  return (
    <div className="overflow-hidden border border-text-main/10 rounded-theme bg-card shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-text-main/5 text-text-main/70 uppercase text-xs">
          <tr className="bg-text-main/5 border-b border-text-main/10 text-xs uppercase text-text-main/70 font-bold">
            <th className="px-4 py-3 w-20"></th>
            <th className="px-4 py-3 cursor-pointer hover:bg-text-main/5 transition" onClick={() => onSort('product_name')}>
              <div className="flex items-center">{t.name || dict?.components?.foodTable?.name || 'Name'} <SortIcon column="product_name" /></div>
            </th>
            <th className="px-4 py-3 cursor-pointer hover:bg-text-main/5 transition" onClick={() => onSort('brand')}>
              <div className="flex items-center">{t.brand || dict?.components?.foodTable?.brand || 'Brand'} <SortIcon column="brand" /></div>
            </th>
            <th className="px-4 py-3 cursor-pointer hover:bg-text-main/5 transition text-center" onClick={() => onSort('hfs')}>
              <div className="flex items-center justify-center">HFS <SortIcon column="hfs" /></div>
            </th>
            <th className="px-4 py-3 text-right cursor-pointer hover:bg-text-main/5 transition" onClick={() => onSort('energy_kcal')}>
              <div className="flex items-center justify-end">{t.kcal || dict?.components?.foodTable?.kcal || 'Kcal'} <SortIcon column="energy_kcal" /></div>
            </th>
            <th className="px-4 py-3 text-right cursor-pointer hover:bg-text-main/5 transition" onClick={() => onSort('protein_g')}>
              <div className="flex items-center justify-end">{t.protein || dict?.components?.foodTable?.protein || 'Protein'} <SortIcon column="protein_g" /></div>
            </th>
            <th className="px-4 py-3 text-right cursor-pointer hover:bg-text-main/5 transition" onClick={() => onSort('carbs_total_g')}>
              <div className="flex items-center justify-end">{t.carbs || dict?.components?.foodTable?.carbs || 'Carbs'} <SortIcon column="carbs_total_g" /></div>
            </th>
            <th className="px-4 py-3 text-right cursor-pointer hover:bg-text-main/5 transition" onClick={() => onSort('fat_total_g')}>
              <div className="flex items-center justify-end">{t.fat || dict?.components?.foodTable?.fat || 'Fat'} <SortIcon column="fat_total_g" /></div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-text-main/10 text-text-main">
          {foods.map((food: any) => (
            <tr 
              key={food.id} 
              className="hover:bg-text-main/5 transition-colors bg-card cursor-pointer group" 
              onClick={() => onFoodClick(food)}
            >
              <td className="px-4 py-3">
                <div className="w-16 h-16 rounded-theme overflow-hidden bg-text-main/5 flex items-center justify-center">
                  {food.front_photo_url ? (
                    <img 
                      src={food.front_photo_url} 
                      alt={food.product_name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-text-main/30 text-xs">—</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-primary group-hover:underline">{food.product_name}</td>
              <td className="px-4 py-3 text-text-main/70">{food.brand || '—'}</td>
              <td className="px-4 py-3 text-center">
                <HFSLabel food={food} variant="table" dict={dict} />
              </td>
              <td className="px-4 py-3 text-right font-bold text-primary">{food.energy_kcal}</td>
              <td className="px-4 py-3 text-right text-text-main/70">{food.protein_g}g</td>
              <td className="px-4 py-3 text-right text-text-main/70">{food.carbs_total_g}g</td>
              <td className="px-4 py-3 text-right text-text-main/70">{food.fat_total_g}g</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}