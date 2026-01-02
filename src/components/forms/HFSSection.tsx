import type { FoodFormData } from '@/types/food';
import { formatHFSScore } from '@/utils/form-helpers';

interface HFSSectionProps {
  formData: FoodFormData;
  dict: any;
  isDirty: boolean;
}

export default function HFSSection({
  formData,
  dict,
  isDirty
}: HFSSectionProps) {
  const hfsScore = formatHFSScore(formData.hfs_score, isDirty);
  
  return (
    <section>
      <h3 className="text-lg font-bold mb-4 text-primary">
        {dict?.pages?.edit?.sectionHFS || '4. HFS Score'}
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-text-main/70 mb-1">
            {dict?.pages?.edit?.labelHfsScore || 'HFS Score'}
          </label>
          <textarea
            value={hfsScore || '—'}
            disabled
            rows={8}
            className="w-full bg-background/50 border-2 border-dashed border-text-main/30 text-text-main/60 p-3 rounded-theme cursor-not-allowed select-none resize-none font-mono text-xs"
            readOnly
          />
          <p className="text-xs text-text-main/40 italic mt-1">
            {isDirty ? 'Will recalc on save' : (formData.hfs_score ? 'Auto calculated' : 'No score calculated')}
          </p>
        </div>
      </div>
    </section>
  );
}

