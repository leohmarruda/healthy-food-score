import Image from 'next/image';

interface Food {
  id: string;
  name: string;
  calories: number;
  health_score: number;
  front_photo_url: string;
}

export default function FoodCard({ food, dict }: { food: Food, dict: any }) {
  return (
    <div className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
      <div className="relative h-48 w-full bg-gray-100">
      {food.front_photo_url ? (
          <img 
            src={food.front_photo_url} 
            alt={food.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">{dict?.home?.noImage || 'No Image'}</div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg capitalize">{food.name || 'Unknown Food'}</h3>
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            food.health_score > 7 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}>
            Score: {food.health_score}/10
          </span>
        </div>
        <p className="text-gray-600 text-sm mt-1">{food.calories} kcal</p>
      </div>
    </div>
  );
}