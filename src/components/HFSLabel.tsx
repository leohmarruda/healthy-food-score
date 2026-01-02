import type { Food } from '@/types/food';
import { extractHFSScore } from '@/utils/form-helpers';

interface HFSLabelProps {
  food: Food;
  variant?: 'card' | 'table';
  className?: string;
}

export default function HFSLabel({ food, variant = 'card', className = '' }: HFSLabelProps) {
  const { score: hfs, version } = extractHFSScore(food.hfs_score);

  // Get HFS badge color styles
  const getHFSStyles = (score: number) => {
    if (score >= 4) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 2.5) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (score < 0) return 'bg-gray-100 text-gray-500 border-gray-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  // Get HFS score color for table variant (more subtle)
  const getHFSTableStyles = (score: number) => {
    if (score >= 4) return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (score >= 2.5) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    if (score < 0) return 'text-text-main/40 bg-text-main/5 border-text-main/10';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  const displayScore = hfs >= 0 ? hfs.toFixed(1) : '—';
  const styles = variant === 'table' ? getHFSTableStyles(hfs) : getHFSStyles(hfs);
  
  const baseClasses = variant === 'table' 
    ? 'inline-flex items-center justify-center px-2 py-1 rounded text-[10px] font-black border min-w-fit'
    : 'px-2 py-1 rounded text-[10px] font-black border flex-shrink-0';

  return (
    <span className={`${baseClasses} ${styles} ${className}`}>
      HFS {version}: {displayScore}
    </span>
  );
}

