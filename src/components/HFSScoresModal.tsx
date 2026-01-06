'use client';
import { useState, useEffect } from 'react';
import { calculateHFSScores, calculateHFSV2Scores } from '@/utils/hfs-calculations';
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
          // Include abv_percentage from formData if available
          const scoresWithABV = {
            ...normalizedScores,
            abv_percentage: formData?.abv_percentage || 0,
          };
          const calculated = calculateHFSScores(scoresWithABV);
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
    { key: 'fibra', label: t.v2FibraLabel || 'Fibra', value: calculatedScores.fibra },
    { key: 'proteina_bruta', label: t.v2ProteinaBrutaLabel || 'Proteína bruta', value: calculatedScores.proteina_bruta },
    { key: 'proteina', label: t.v2ProteinaLabel || 'Proteína', value: calculatedScores.proteina },
    { key: 'baixo_carbo_liquido', label: t.v2BaixoCarboLiquidoLabel || 'Baixo carboidrato líquido', value: calculatedScores.baixo_carbo_liquido },
    { key: 'baixa_densidade', label: t.v2BaixaDensidadeLabel || 'Baixa densidade energética', value: calculatedScores.baixa_densidade },
    { key: 'F_hidratacao', label: t.v2HidratacaoLabel || 'Hidratação', value: calculatedScores.F_hidratacao },
    { key: 'S_carbo_liquido', label: t.v2SCarboLiquidoLabel || 'S: Carboidrato líquido', value: calculatedScores.S_carbo_liquido },
    { key: 'S_razao_carb_fibra', label: t.v2SRazaoCarbFibraLabel || 'S: Razão carboidrato/fibra', value: calculatedScores.S_razao_carb_fibra },
    { key: 'S_gordura_trans', label: t.v2SGorduraTransLabel || 'S: Gordura trans', value: calculatedScores.S_gordura_trans },
    { key: 'S_sodio', label: t.v2SSodioLabel || 'S: Sódio', value: calculatedScores.S_sodio },
    { key: 'S_densidade_energetica', label: t.v2SDensidadeEnergeticaLabel || 'S: Densidade energética', value: calculatedScores.S_densidade_energetica },
    { key: 'aditivos', label: t.v2AditivosLabel || 'Aditivos prejudiciais', value: calculatedScores.aditivos },
  ] : [
    { key: 'S1', label: t.S1Label || 'S1: Açúcares', value: calculatedScores.S1 },
    { key: 'S2', label: t.S2Label || 'S2: Fibras', value: calculatedScores.S2 },
    { key: 'S3', label: t.S3Label || 'S3: Gorduras prejudiciais', value: calculatedScores.S3 },
    { key: 'S4', label: t.S4Label || 'S4: Densidade calórica', value: calculatedScores.S4 },
    { key: 'S5', label: t.S5Label || 'S5: Proteínas', value: calculatedScores.S5 },
    { key: 'S6', label: t.S6Label || 'S6: Sódio', value: calculatedScores.S6 },
    { key: 'S7', label: t.S7Label || 'S7: Grau de processamento (NOVA)', value: calculatedScores.S7 },
    { key: 'S8', label: t.S8Label || 'S8: Aditivos artificiais', value: calculatedScores.S8 },
    { key: 'S9', label: t.S9Label || 'S9: Álcool', value: calculatedScores.S9 },
    { key: 'N', label: t.NLabel || 'N: Valor nutricional', value: calculatedScores.N },
    { key: 'M', label: t.MLabel || 'M: Risco metabólico', value: calculatedScores.M },
    { key: 'P', label: t.PLabel || 'P: Fator prejudicial', value: calculatedScores.P },
    { key: 'R', label: t.RLabel || 'R: Risco estrutural', value: calculatedScores.R },
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

          {!isV2 && calculatedScores.HFSv1 !== undefined && calculatedScores.HFSv1 !== null && (
            <div className="mb-3 p-3 bg-primary/10 border-2 border-primary/20 rounded-theme">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-text-main">
                  {t.HFSv1Label || 'HFSv1.0'}
                </span>
                <span className={`text-2xl font-black ${getScoreColor(calculatedScores.HFSv1)}`}>
                  {formatScore(calculatedScores.HFSv1)}
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

