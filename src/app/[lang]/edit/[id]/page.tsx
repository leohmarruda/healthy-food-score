'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';

import ConfirmModal from '@/components/ConfirmModal';
import HFSInputModal from '@/components/HFSInputModal';
import HFSScoresModal from '@/components/HFSScoresModal';
import Spinner from '@/components/Spinner';
import BasicInfoSection from '@/components/forms/BasicInfoSection';
import ExtraDataSection from '@/components/forms/ExtraDataSection';
import HFSSection from '@/components/forms/HFSSection';
import ImageGallery from '@/components/forms/ImageGallery';
import NutritionFactsSection from '@/components/forms/NutritionFactsSection';
import { useFoodForm } from '@/hooks/useFoodForm';
import { useLockedFields } from '@/hooks/useLockedFields';
import { useSaveFood } from '@/hooks/useSaveFood';
import { getDictionary } from '@/lib/get-dictionary';
import { supabase } from '@/lib/supabase';
import { deleteFoodRecord } from '@/utils/api';
import { cleanFoodData, extractImageUrls } from '@/utils/form-helpers';
import { useHFSPreparation } from '@/hooks/useHFSPreparation';

export default function EditFood() {
  // Hooks
  const { id, lang } = useParams();
  const router = useRouter();
  const {
    formData,
    originalData,
    images,
    dirty,
    initializeForm,
    updateField,
    updateFormData,
    updateImage,
    setFormData,
    setOriginalData
  } = useFoodForm();

  const { isLocked, toggleLock } = useLockedFields();
  const { prepare } = useHFSPreparation();

  // State
  const [loading, setLoading] = useState(true);
  const [dict, setDict] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHFSInputModal, setShowHFSInputModal] = useState(false);
  const [showHFSScoresModal, setShowHFSScoresModal] = useState(false);
  const [hfsScores, setHfsScores] = useState<any>(null);
  const [hfsTotalScore, setHfsTotalScore] = useState<number | undefined>(undefined);
  const [servingSize, setServingSize] = useState<number | undefined>(undefined);
  const [servingUnit, setServingUnit] = useState<string | undefined>(undefined);
  const [density, setDensity] = useState<number | undefined>(undefined);
  const [selectedHfsVersion, setSelectedHfsVersion] = useState<string>('v2');
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [isLiquid, setIsLiquid] = useState<boolean | undefined>(undefined); // undefined = auto-detect, true/false = explicit

  // Data fetching
  const fetchLatestData = async () => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        const cleanData = cleanFoodData(data);
        setFormData(cleanData);
        setOriginalData(cleanData);
        const imageUrls = extractImageUrls(data);
        Object.keys(imageUrls).forEach(key => {
          updateImage(key, imageUrls[key]);
        });
      }
    } catch (err) {
      console.error('Error syncing data:', err);
      toast.error(dict?.pages?.edit?.loadError || 'Failed to load latest data');
    }
  };

  // Custom hooks (must be after state and functions they depend on)
  const { saveFood, isSaving } = useSaveFood(id as string, dict, fetchLatestData);

  // Effects
  useEffect(() => {
    async function init() {
      const [d, { data }] = await Promise.all([
        getDictionary(lang as 'pt' | 'en'),
        supabase.from('foods').select('*').eq('id', id).single()
      ]);

      setDict(d);

      if (data) {
        initializeForm(data);
        // Set isLiquid based on density_g_per_ml or category
        const hasDensity = data.nutrition_parsed?.density_g_per_ml != null;
        const isDrinkCategory = data.category === 'drink' || data.category === 'alcohol';
        setIsLiquid(hasDensity || isDrinkCategory);
        // Set selected version based on hfs_score or default to v2
        if (data.hfs_score?.v1) {
          setSelectedHfsVersion('v1');
        } else if (data.hfs_score?.v2) {
          setSelectedHfsVersion('v2');
        } else {
          setSelectedHfsVersion('v2');
        }
      }
      setLoading(false);
    }
    init();
  }, [id, lang, initializeForm]);

  // Event handlers
  // Function to scroll to first error field
  const scrollToFirstError = () => {
    const errorFields = Object.keys(fieldErrors).filter(key => fieldErrors[key]);
    if (errorFields.length === 0) return;

    // Find the first error field
    const firstErrorField = errorFields[0];
    
    // Try multiple selectors to find the field container or input
    let targetElement: HTMLElement | null = null;
    
    // First try to find the field container by ID
    targetElement = document.getElementById(`field-${firstErrorField}`);
    
    // If not found, try by data attribute
    if (!targetElement) {
      targetElement = document.querySelector(`[data-field-container="${firstErrorField}"]`) as HTMLElement;
    }
    
    // If still not found, try to find the input by name
    if (!targetElement) {
      const input = document.querySelector(`input[name="${firstErrorField}"], textarea[name="${firstErrorField}"]`) as HTMLElement;
      if (input) {
        targetElement = input.closest('div') || input;
      }
    }
    
    // If still not found, try by data-field-name
    if (!targetElement) {
      targetElement = document.querySelector(`[data-field-name="${firstErrorField}"]`) as HTMLElement;
    }
    
    if (targetElement) {
      // Find the parent section
      const section = targetElement.closest('section');
      if (section) {
        // Calculate scroll position with offset for header
        const headerOffset = 120;
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Then focus the input field and scroll it into view
        setTimeout(() => {
          const input = targetElement?.querySelector('input, textarea') as HTMLElement;
          if (input) {
            input.focus();
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            targetElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 400);
      } else {
        // If no section found, scroll directly to the element
        const headerOffset = 120;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        setTimeout(() => {
          const input = targetElement?.querySelector('input, textarea') as HTMLElement;
          if (input) {
            input.focus();
          }
        }, 400);
      }
    } else {
      // Fallback: scroll to form start
      console.warn(`Field ${firstErrorField} not found`);
      const form = document.querySelector('form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Callback for components to report field errors
  const reportFieldError = useCallback((fieldName: string, hasError: boolean) => {
    setFieldErrors(prev => {
      // Only update if the error state actually changed
      const currentState = prev[fieldName] || false;
      if (currentState === hasError) {
        return prev; // No change needed
      }
      
      if (hasError) {
        return { ...prev, [fieldName]: true };
      } else {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for validation errors
    const hasErrors = Object.keys(fieldErrors).some(key => fieldErrors[key]);
    if (hasErrors) {
      scrollToFirstError();
      return;
    }
    try {
      const initialData = await prepare(formData, selectedHfsVersion);
      setHfsScores(initialData.scores || {});
      setServingSize(initialData.servingSize);
      setServingUnit(initialData.servingUnit);
      setDensity(initialData.density);
      setShowHFSInputModal(true);
    } catch (error) {
      toast.error(dict?.pages?.edit?.hfsCalculationError || 'Error preparing HFS parameters.');
    }
  };

  const handleHFSInputConfirm = async (editedData: any) => {
    try {
      if (selectedHfsVersion === 'v2') {
        // Check HFS input using modal data
        const { checkHFSInput } = await import('@/utils/hfs');
        const updatedFormData = { 
          ...formData, 
          ...editedData,
          // Update isLiquid state based on editedData
          abv_percentage: editedData.abv_percentage,
          density: editedData.density
        };
        // Update isLiquid state if density or ABV changed
        if (editedData.density != null || editedData.abv_percentage != null) {
          setIsLiquid(true);
        } else if (editedData.density === undefined && editedData.abv_percentage === undefined) {
          setIsLiquid(false);
        }
        const checkResult = checkHFSInput(updatedFormData, 'v2', dict);
        
        if (checkResult.warnings && checkResult.warnings.length > 0) {
          checkResult.warnings.forEach(warning => {
            toast.warning(warning);
          });
        }
        
        // Update formData with edited values
        Object.keys(editedData).forEach(key => {
          updateField(key as keyof typeof formData, editedData[key]);
        });
        
        const result = await saveFood(updatedFormData, undefined, 'v2');
        if (result?.scores) {
          setHfsScores(result.scores);
          setHfsTotalScore(result.score);
        }
      } else {
        // Check HFS input using modal data for v1
        const { checkHFSInput } = await import('@/utils/hfs');
        const updatedFormData = {
          ...formData,
          ...Object.fromEntries(
            ['s1a', 's1b', 's2', 's3a', 's3b', 's4', 's5', 's6', 's7', 's8'].map(key => {
              // Preserve s7 value even if it's 0 or undefined
              const value = editedData[key];
              return [key, value !== undefined ? value : (key === 's7' ? undefined : 0)];
            })
          ),
          density: editedData.density ?? formData.density,
          // NOVA is required for v1 validation - use s7 from editedData if available, otherwise use formData.NOVA
          NOVA: editedData.s7 !== undefined ? editedData.s7 : formData.NOVA,
        };
        // Update isLiquid state if density changed
        if (editedData.density != null && editedData.density !== 1.0) {
          setIsLiquid(true);
        } else if (editedData.density === 1.0 || editedData.density === undefined) {
          setIsLiquid(false);
        }
        const checkResult = checkHFSInput(updatedFormData, 'v1', dict);
        
        if (checkResult.warnings && checkResult.warnings.length > 0) {
          checkResult.warnings.forEach(warning => {
            toast.warning(warning);
          });
        }
        
        // Update formData with edited values
        Object.keys(editedData).forEach(key => {
          if (key === 's7') {
            updateField('NOVA', editedData[key]);
          } else if (key !== 'density') {
            // Skip density for now, will update separately
            updateField(key as keyof typeof formData, editedData[key]);
          }
        });
        if (editedData.density !== undefined) {
          updateField('density', editedData.density);
        }
        
        const { calculateHFSScores } = await import('@/utils/hfs-calculations');
        // Include abv_percentage from formData if not in editedData
        const scoresForCalculation = {
          ...editedData,
          abv_percentage: editedData.abv_percentage !== undefined ? editedData.abv_percentage : (formData.abv_percentage || 0),
        };
        const calculatedScores = calculateHFSScores(scoresForCalculation);
        const hfsv1Score = calculatedScores.HFSv1;
        // Use the same updatedFormData that was validated
        const result = await saveFood(updatedFormData, hfsv1Score, 'v1');
        if (result?.scores) {
          setHfsScores(editedData);
          setHfsTotalScore(hfsv1Score);
        }
      }
      setShowHFSInputModal(false);
      setShowHFSScoresModal(true);
    } catch (error) {
      // Error already handled by toast
    }
  };

  const handleCancelClick = () => {
    if (dirty) {
      setShowCancelModal(true);
    } else {
      router.back();
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteFoodRecord(id as string);
      toast.success(dict?.pages?.edit?.deleteSuccess || 'Food item deleted successfully');
      router.push(`/${lang}/manage`);
      router.refresh();
    } catch (err) {
      toast.error(dict?.pages?.edit?.deleteError || 'Failed to delete food item');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dict || !dict.pages?.edit) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const t = dict.pages.edit;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col lg:flex-row gap-10">
        <ImageGallery
          images={images}
          formData={formData}
          dict={dict}
          lang={lang as string}
          foodId={id as string}
          onImageUpdate={updateImage}
          onFormDataUpdate={updateFormData}
          lockedFields={isLocked}
        />
        <div className="lg:w-2/3 bg-card p-8 rounded-theme shadow-sm border border-text-main/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-text-main/10">
            <h2 className="text-2xl font-black text-text-main tracking-tight">{t.editorTitle}</h2>
            {formData.last_update && (
              <div className="flex items-center gap-3 bg-background px-4 py-2 rounded-theme border border-text-main/10">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-main/50 leading-none mb-1">
                    {t.lastUpdatedLabel}
                  </p>
                  <p className="text-xs font-mono text-text-main leading-none">
                    {new Date(formData.last_update).toLocaleString(
                      lang === 'pt' ? 'pt-BR' : 'en-US'
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            <BasicInfoSection 
              formData={formData} 
              dict={dict} 
              onChange={updateField}
              isLocked={isLocked}
              onToggleLock={toggleLock}
              onFieldError={reportFieldError}
              isLiquid={isLiquid}
              onLiquidChange={setIsLiquid}
            />
            <NutritionFactsSection
              formData={formData}
              dict={dict}
              isDirty={dirty}
              onChange={updateField}
              isLocked={isLocked}
              onToggleLock={toggleLock}
              onFieldError={reportFieldError}
              isLiquid={isLiquid}
            />
            <ExtraDataSection 
              formData={formData} 
              dict={dict} 
              onChange={updateField}
              isLocked={isLocked}
              onToggleLock={toggleLock}
              onFieldError={reportFieldError}
            />
            <HFSSection
              formData={formData}
              dict={dict}
              isDirty={dirty}
            />

            <div className="border-t border-text-main/10 pt-8 mt-8">
              <div className="flex flex-col sm:flex-row gap-3 w-full items-center">
                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="flex-1 px-6 py-3 border border-text-main/20 text-text-main/70 hover:text-text-main hover:border-text-main/40 hover:bg-text-main/5 font-medium transition-all rounded-theme bg-background flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {dict?.common?.cancel || 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSaving || (!dirty && formData.hfs_score != null)}
                  className="flex-1 px-8 py-3 bg-primary text-white rounded-theme font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
                >
                  {isSaving ? (
                    <>
                      <Spinner />
                      <span>{t.saving || 'Saving...'}</span>
                    </>
                  ) : Object.keys(fieldErrors).some(key => fieldErrors[key]) ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {t.btnVerifyData || 'Verificar dados'}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t.btnSave || 'Save and Calculate HFS'}
                    </>
                  )}
                </button>

                {/* HFS Version - do lado direito do botão salvar */}
                <div className="flex-shrink-0">
                  <label className="block text-xs font-bold text-text-main/70 mb-1">
                    {dict?.pages?.edit?.labelHfsVersion || 'HFS Version'}
                  </label>
                  <select
                    value={selectedHfsVersion || 'v2'}
                    onChange={(e) => setSelectedHfsVersion(e.target.value)}
                    className="w-full bg-background border border-text-main/20 text-text-main p-2 rounded-theme h-[42px] focus:outline-none focus:border-primary min-w-[100px]"
                  >
                    <option value="v1">v1</option>
                    <option value="v2">v2</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full px-6 py-3 border-2 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-500/60 active:scale-[0.98] font-semibold transition-all rounded-theme bg-background flex items-center justify-center gap-2 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>{t.btnDelete || 'Delete Record Permanently'}</span>
                </button>
                <p className="text-xs text-center text-text-main/50 dark:text-text-main/40 mt-3 font-medium">
                  {dict?.pages?.edit?.deleteWarning || 'This action cannot be undone'}
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
      <ConfirmModal
        isOpen={showCancelModal}
        title={t.discardTitle || 'Discard changes?'}
        message={
          t.discardMessage ||
          'You have made changes to this food item. Are you sure you want to leave without saving?'
        }
        variant="info"
        confirmLabel={t.discardConfirm || 'Yes, leave'}
        cancelLabel={t.discardCancel || 'Continue editing'}
        onConfirm={() => router.back()}
        onCancel={() => setShowCancelModal(false)}
        dict={dict}
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        title={t.confirmDeleteTitle || 'Delete Food Item?'}
        message={
          t.confirmDeleteMessage ||
          'This action is permanent and will remove all data and images.'
        }
        variant="danger"
        confirmLabel={t.btnDeleteConfirm || 'Yes, Delete'}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        dict={dict}
      />
      <HFSInputModal
        isOpen={showHFSInputModal}
        version={selectedHfsVersion}
        scores={hfsScores || {}}
        formData={{
          ingredients_list: formData.ingredients_list,
          energy_kcal: formData.energy_kcal,
          carbs_total_g: formData.carbs_total_g,
          protein_g: formData.protein_g,
          sodium_mg: formData.sodium_mg,
          fiber_g: formData.fiber_g,
          saturated_fat_g: formData.saturated_fat_g,
          trans_fat_g: formData.trans_fat_g,
          abv_percentage: formData.abv_percentage,
          declared_processes: formData.declared_processes,
          declared_special_nutrients: formData.declared_special_nutrients,
          serving_size_value: formData.serving_size_value,
          density: formData.density,
        }}
        servingSize={servingSize}
        servingUnit={servingUnit}
        density={density}
        isLiquid={isLiquid}
        onLiquidChange={setIsLiquid}
        onConfirm={handleHFSInputConfirm}
        onCancel={() => setShowHFSInputModal(false)}
        dict={dict}
      />
      <HFSScoresModal
        isOpen={showHFSScoresModal}
        version={selectedHfsVersion}
        scores={hfsScores || {}}
        formData={{
          fiber_g: formData.fiber_g,
          protein_g: formData.protein_g,
          carbs_total_g: formData.carbs_total_g,
          energy_kcal: formData.energy_kcal,
          fat_total_g: formData.fat_total_g,
          abv_percentage: formData.abv_percentage,
          sugars_added_g: formData.sugars_added_g,
          trans_fat_g: formData.trans_fat_g,
          sodium_mg: formData.sodium_mg,
          ingredients_list: formData.ingredients_list,
        }}
        totalScore={hfsTotalScore}
        servingSize={servingSize}
        servingUnit={servingUnit}
        density={density}
        onClose={() => setShowHFSScoresModal(false)}
        dict={dict}
      />
    </div>
  );
}
