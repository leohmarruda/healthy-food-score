import type { Food } from '@/types/food';
import { extractHFSScore } from '@/utils/form-helpers';

interface HFSLabelProps {
  food: Food;
  variant?: 'card' | 'table';
  className?: string;
  dict?: any;
}

/**
 * Get HFS score designation based on score value
 */
function getHFSDesignation(score: number, dict?: any): string {
  if (score < 0) return '';
  if (score >= 75) return dict?.hfsScores?.excellent || 'ótimo';
  if (score >= 50) return dict?.hfsScores?.good || 'bom';
  if (score >= 30) return dict?.hfsScores?.moderate || 'moderado / usar com cautela';
  return dict?.hfsScores?.poor || 'ruim / melhor evitar como rotina';
}

/**
 * Get color for HFS score (blue at 100, red at 0)
 * Returns RGB values for smooth gradient
 * Gradient: Blue (100) -> Cyan -> Green -> Yellow -> Orange -> Red (0)
 */
function getHFSColor(score: number): { r: number; g: number; b: number } {
  if (score < 0) return { r: 128, g: 128, b: 128 }; // Gray for invalid scores
  
  // Clamp score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, score));
  
  // Blue (0, 100, 255) at 100 -> Red (255, 0, 0) at 0
  if (clampedScore >= 75) {
    // Blue to Cyan (75-100): Blue (0, 100, 255) -> Cyan (0, 255, 255)
    const factor = (clampedScore - 75) / 25;
    return {
      r: 0,
      g: Math.round(100 + 155 * factor),
      b: 255
    };
  } else if (clampedScore >= 50) {
    // Cyan to Green (50-75): Cyan (0, 255, 255) -> Green (0, 255, 0)
    const factor = (clampedScore - 50) / 25;
    return {
      r: 0,
      g: 255,
      b: Math.round(255 * (1 - factor))
    };
  } else if (clampedScore >= 30) {
    // Green to Yellow (30-50): Green (0, 255, 0) -> Yellow (255, 255, 0)
    const factor = (clampedScore - 30) / 20;
    return {
      r: Math.round(255 * factor),
      g: 255,
      b: 0
    };
  } else {
    // Yellow to Red (0-30): Yellow (255, 255, 0) -> Red (255, 0, 0)
    const factor = clampedScore / 30;
    // When score is 0, factor is 0, so g should be 255 * (1 - 0) = 255, which is yellow
    // We need to invert: when factor is 0 (score 0), g should be 0 (red)
    // When factor is 1 (score 30), g should be 255 (yellow)
    return {
      r: 255,
      g: Math.round(255 * factor),
      b: 0
    };
  }
}

/**
 * Get background color (lighter version with opacity) for badge
 */
function getHFSBackgroundColor(score: number): string {
  const color = getHFSColor(score);
  return `rgba(${color.r}, ${color.g}, ${color.b}, 0.15)`;
}

/**
 * Get text color (full color) for badge
 */
function getHFSTextColor(score: number): string {
  const color = getHFSColor(score);
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

/**
 * Get border color (medium opacity) for badge
 */
function getHFSBorderColor(score: number): string {
  const color = getHFSColor(score);
  return `rgba(${color.r}, ${color.g}, ${color.b}, 0.4)`;
}

export default function HFSLabel({ food, variant = 'card', className = '', dict }: HFSLabelProps) {
  const { score: hfs, version } = extractHFSScore(food.hfs_score);

  const displayScore = hfs >= 0 ? hfs.toFixed(1) : '—';
  const designation = getHFSDesignation(hfs, dict);
  
  // Get background color based on score (only background is colored)
  const bgColor = getHFSBackgroundColor(hfs);
  
  const baseClasses = variant === 'table' 
    ? 'inline-flex flex-col items-center justify-center px-2 py-1 rounded text-[10px] font-black border min-w-fit text-black border-black'
    : 'px-2 py-1 rounded text-[10px] font-black border flex-shrink-0 flex flex-col items-center text-black border-black';

  const badgeStyle = {
    backgroundColor: hfs < 0 ? 'rgba(240, 240, 240, 0.15)' : bgColor
  };

  return (
    <span className={`${baseClasses} ${className}`} style={badgeStyle}>
      <span>HFS {version}: {displayScore}</span>
      {designation && hfs >= 0 && (
        <span className="text-[8px] font-normal mt-0.5 opacity-90">{designation}</span>
      )}
    </span>
  );
}

