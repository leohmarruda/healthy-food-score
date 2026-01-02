import Image from 'next/image';
import type { Food } from '@/types/food';
import HFSLabel from '@/components/HFSLabel';

export default function FoodCard({ food, dict }: { food: Food, dict: any }) {
  return (
    <div className="border border-text-main/10 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-card group cursor-pointer">
      <div className="relative h-48 w-full bg-text-main/5 overflow-hidden">
        {food.front_photo_url ? (
          <img 
            src={food.front_photo_url} 
            alt={food.product_name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-main/40 bg-text-main/5">
            {dict?.components?.foodCard?.noPhoto || 'No Image'}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-lg capitalize text-text-main truncate">
            {food.product_name || 'Unknown Food'}
          </h3>
          <HFSLabel food={food} variant="card" dict={dict} />
        </div>
        {(food.brand || food.location) && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-text-main/60 text-sm">
              {food.brand && <span>{food.brand}</span>}
              {food.brand && food.location && <span>, </span>}
              {food.location && <span>{food.location}</span>}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}