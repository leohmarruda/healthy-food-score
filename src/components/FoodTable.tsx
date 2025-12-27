import { Food } from '@/types/food';

interface FoodTableProps {
  foods: Food[];
  onFoodClick: (food: Food) => void;
  dict: any;
}

export default function FoodTable({ foods, onFoodClick, dict }: FoodTableProps) {
  console.log("Dicionário na Tabela:", dict)
  return (
    <div className="overflow-hidden border border-text-main/10 rounded-theme bg-card shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-text-main/5 text-text-main/70 uppercase text-xs">
          <tr className="bg-text-main/5 border-b border-text-main/10 text-xs uppercase text-text-main/70 font-bold">
          <th className="px-4 py-3">{dict?.home?.name}</th>
          <th className="px-4 py-3">{dict?.home?.brand}</th>
          <th className="px-4 py-3 text-right">{dict?.home?.portion}</th>
          <th className="px-4 py-3 text-right">{dict?.home?.kcal}</th>
          <th className="px-4 py-3 text-right">{dict?.home?.protein}</th>
          <th className="px-4 py-3 text-right">{dict?.home?.carbs}</th>
          <th className="px-4 py-3 text-right">{dict?.home?.fat}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-text-main/10 text-text-main">
          {foods.map((food) => (
            <tr 
              key={food.id} 
              className="hover:bg-text-main/5 transition-colors bg-card cursor-pointer" 
              onClick={() => onFoodClick(food)}
            >
              <td className="px-4 py-3 font-medium text-primary">{food.name}</td>
              <td className="px-4 py-3 text-text-main/70">{food.brand}</td>
              <td className="px-4 py-3 text-right text-text-main/70">{food.portion_size_value}{food.portion_unit}</td>
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