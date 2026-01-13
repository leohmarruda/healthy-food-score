'use client';
import { useState, useEffect } from 'react';
import { calculateHFSV1Scores, calculateHFSV2Scores } from '@/utils/hfs-calculations';
import { normalizeScores } from '@/utils/hfs-helpers';

interface HFSScoresModalProps {
  isOpen: boolean;
  version?: string; // HFS version (v1, v2)
  scores: {
    s1a?: number; // Açúcares adicionados (g)
    s1b?: number; // Açúcares naturais (g)
    s2?: number; // Fibras (g)
    s3a?: number; // Gordura Saturada (g)
    s3b?: number; // Gordura Trans (g)
    s4?: number; // Densidade calórica (kcal)
    s5?: number; // Proteína (g)
    s6?: number; // Sódio (mg)
    s7?: number; // Grau de processamento (NOVA)
    s8?: number; // Aditivos artificiais (lista)
  };
  formData?: {
    fiber_g?: number;
    protein_g?: number;
    carbs_total_g?: number;
    energy_kcal?: number;
    fat_total_g?: number;
    abv_percentage?: number;
    sugars_added_g?: number;
    trans_fat_g?: number;
    sodium_mg?: number;
    ingredients_list?: string[];
  };
  totalScore?: number;
  servingSize?: number;
  servingUnit?: string;
  density?: number;
  onClose: () => void;
  dict?: any;
}

export default function HFSScoresModal({
  isOpen,
  version = 'v1',
  scores,
  formData,
  totalScore,
  servingSize,
  servingUnit,
  density,
  onClose,
  dict
}: HFSScoresModalProps) {
  const [calculatedScores, setCalculatedScores] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const t = dict?.hfsScores || {};
  const isV2 = version === 'v2';

  useEffect(() => {
    if (!isOpen) return;

    const calculateScores = async () => {
      setIsLoading(true);
      try {
        if (isV2) {
          const calculated = await calculateHFSV2Scores(formData || {});
          setCalculatedScores(calculated);
        } else {
          // Scores are already in 100g format - normalize and calculate
          const normalizedScores = normalizeScores(scores);
          // Convert old format (s1a, s1b, etc.) to new format
          const sugars_total_g = (normalizedScores.s1a || 0) + (normalizedScores.s1b || 0);
          const scoresWithABV = {
            energy_kcal: normalizedScores.s4 ?? (formData?.energy_kcal ?? 0),
            fiber_g: normalizedScores.s2 ?? (formData?.fiber_g ?? 0),
            sugars_added_g: normalizedScores.s1a ?? (formData?.sugars_added_g ?? 0),
            sugars_total_g: sugars_total_g > 0 ? sugars_total_g : 0,
            total_fat_g: formData?.fat_total_g ?? 0,
            saturated_fat_g: normalizedScores.s3a ?? 0,
            trans_fat_g: normalizedScores.s3b ?? (formData?.trans_fat_g ?? 0),
            sodium_mg: normalizedScores.s6 ?? (formData?.sodium_mg ?? 0),
            protein_g: normalizedScores.s5 ?? (formData?.protein_g ?? 0),
            NOVA: normalizedScores.s7 ?? 0,
            n_ing: normalizedScores.s8 ?? 0,
            ABV_percentage: formData?.abv_percentage || 0,
            density_g_ml: undefined,
            serving_size_g: undefined,
            is_liquid: false,
          };
          const calculated = calculateHFSV1Scores(scoresWithABV);
          setCalculatedScores(calculated);
        }
      } catch (error) {
        console.error('Error calculating scores:', error);
        setCalculatedScores({});
      } finally {
        setIsLoading(false);
      }
    };

    calculateScores();
  }, [isOpen, isV2, formData, scores]);

  if (!isOpen) return null;

  const scoreLabels = isV2 ? [
    { key: 'S_fiber', label: t.v2FibraLabel || 'Fibra', value: calculatedScores.S_fiber },
    { key: 'protein_Raw', label: t.v2ProteinaBrutaLabel || 'Proteína bruta', value: calculatedScores.protein_Raw },
    { key: 'S_protein', label: t.v2ProteinaLabel || 'Proteína', value: calculatedScores.S_protein },
    { key: 'low_net_carbs', label: t.v2BaixoCarboLiquidoLabel || 'Baixo carboidrato líquido', value: calculatedScores.low_net_carbs },
    { key: 'low_energy_density', label: t.v2BaixaDensidadeLabel || 'Baixa densidade energética', value: calculatedScores.low_energy_density },
    { key: 'hydration', label: t.v2HidratacaoLabel || 'Hidratação', value: calculatedScores.hydration },
    { key: 'S_carbo_liquido', label: t.v2SCarboLiquidoLabel || 'S: Carboidrato líquido', value: calculatedScores.S_carbo_liquido },
    { key: 'S_razao_carb_fibra', label: t.v2SRazaoCarbFibraLabel || 'S: Razão carboidrato/fibra', value: calculatedScores.S_razao_carb_fibra },
    { key: 'S_gordura_trans', label: t.v2SGorduraTransLabel || 'S: Gordura trans', value: calculatedScores.S_gordura_trans },
    { key: 'S_sodio', label: t.v2SSodioLabel || 'S: Sódio', value: calculatedScores.S_sodio },
    { key: 'S_densidade_energetica', label: t.v2SDensidadeEnergeticaLabel || 'S: Densidade energética', value: calculatedScores.S_densidade_energetica },
    { key: 'aditivos', label: t.v2AditivosLabel || 'Aditivos prejudiciais', value: calculatedScores.aditivos },
  ] : [
    { key: 'benefits', label: t.benefitsLabel || 'B: Benefícios agregados', value: calculatedScores.benefits },
    { key: 'metabolic_risk', label: t.metabolicRiskLabel || 'M: Risco metabólico', value: calculatedScores.metabolic_risk },
    { key: 'behavioral_risk', label: t.behavioralRiskLabel || 'R: Risco comportamental', value: calculatedScores.behavioral_risk },
    { key: 'red_flag_risk', label: t.redFlagRiskLabel || 'P: Risco de bandeira vermelha', value: calculatedScores.red_flag_risk },
    { key: 'processing_risk', label: t.processingRiskLabel || 'S: Risco de processamento', value: calculatedScores.processing_risk },
    { key: 'raw_score', label: t.rawScoreLabel || 'Raw Score: Score bruto', value: calculatedScores.raw_score },
  ];

  const formatScore = (score: number | undefined | null | any, key?: string) => {
    if (score === undefined || score === null) return '—';
    // Ensure it's a number before calling toFixed
    const numScore = typeof score === 'number' ? score : Number(score);
    if (isNaN(numScore)) return '—';
    // S7 (NOVA) should always be an integer
    if (key === 'S7' || key === 's7') {
      return Math.round(numScore).toString();
    }
    // Format with 2 decimal places for calculated scores
    return numScore.toFixed(2);
  };

  const getScoreColor = (score: number | undefined | null | any) => {
    if (score === undefined || score === null) return 'text-text-main/40';
    // Ensure it's a number before comparison
    const numScore = typeof score === 'number' ? score : Number(score);
    if (isNaN(numScore)) return 'text-text-main/40';
    if (numScore >= 4) return 'text-green-600';
    if (numScore >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-text-main/10 overflow-hidden transform animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="p-4 overflow-y-auto flex-1">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold text-text-main">
              {t.title || 'Scores HFS'} {version.toUpperCase()}
            </h3>
          </div>

          {!isV2 && calculatedScores.HFS !== undefined && calculatedScores.HFS !== null && (
            <div className="mb-3 p-3 bg-primary/10 border-2 border-primary/20 rounded-theme">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-text-main">
                  {t.HFSv1Label || 'HFSv1.0'}
                </span>
                <span className={`text-2xl font-black ${getScoreColor(calculatedScores.HFS)}`}>
                  {formatScore(calculatedScores.HFS)}
                </span>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <span className="text-text-main/60">{t.loading || 'Calculando scores...'}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {scoreLabels.map(({ key, label, value }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 bg-background rounded-theme border border-text-main/10"
                >
                  <span className="text-xs font-medium text-text-main/80">{label}</span>
                  <span className={`text-base font-bold ${getScoreColor(value)}`}>
                    {formatScore(value, key)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 p-3 bg-text-main/5 border-t border-text-main/10">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-theme font-bold text-sm text-white bg-primary hover:opacity-90 transition shadow-lg"
          >
            {dict?.common?.ok || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

