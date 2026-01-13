/**
 * Normalizes ingredient names by:
 * - Converting to lowercase
 * - Replacing whitespace with underscores
 * - Removing accents and cedillas
 * 
 * @param ingredientName - The ingredient name to normalize
 * @returns Normalized ingredient name
 * 
 * @example
 * normalizeIngredientName('Açúcar Refinado') // Returns 'acucar_refinado'
 * normalizeIngredientName('Óleo de Coco') // Returns 'oleo_de_coco'
 * normalizeIngredientName('Farinha de Trigo') // Returns 'farinha_de_trigo'
 */
export function normalizeIngredientName(ingredientName: string): string {
  if (!ingredientName || typeof ingredientName !== 'string') {
    return '';
  }

  return ingredientName
    .toLowerCase()
    .normalize('NFD') // Decompose characters (é -> e + ´)
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents, cedillas)
    .replace(/\s+/g, '_') // Replace whitespace (spaces, tabs, newlines) with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single underscore
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

/**
 * Mock data structure for ingredient matching candidates
 */
export interface IngredientCandidate {
  ingredient_id: number;
  canonical_name: string;
  method: 'exact' | 'synonym' | 'regex' | 'fuzzy';
  score: number;
  is_whole?: boolean; // Whether the ingredient is whole (not fractionated, extracted, or refined)
  categories?: string[]; // List of categories for the ingredient (e.g., ["concentrated_protein"])
}

export interface IngredientDecision {
  status: 'accepted' | 'needs_review' | 'accepted_with_warning';
  ingredient_id?: number;
  confidence?: number;
  reason?: string;
  warning?: string;
}

export interface IngredientMatchResult {
  index: number;
  raw: string;
  normalized: string;
  candidates: IngredientCandidate[];
  decision: IngredientDecision;
}

export interface MatchIngredientsResponse {
  meta: {
    top_k: number;
    strategy: string[];
    normalization: string;
    timestamp: string;
  };
  results: IngredientMatchResult[];
  summary: {
    total: number;
    accepted: number;
    needs_review: number;
    unmatched: number;
  };
}

/**
 * Matches ingredients from a list and returns mock candidates for each item
 * Uses the structure from the mock API response
 * @param ingredientsList - Array of ingredient strings or a comma-separated string
 * @returns MatchIngredientsResponse with results and summary
 */
export function matchIngredients(
  ingredientsList: string[] | string
): MatchIngredientsResponse {
  // Normalize input: convert string to array if needed
  const ingredients = Array.isArray(ingredientsList)
    ? ingredientsList
    : ingredientsList.split(',').map(item => item.trim()).filter(Boolean);

  const results: IngredientMatchResult[] = ingredients.map((ingredient, index) => {
    const normalized = normalizeIngredientName(ingredient);
    const candidates = generateMockCandidates(normalized, index);
    const decision = generateMockDecision(candidates, index);

    return {
      index,
      raw: ingredient,
      normalized,
      candidates,
      decision
    };
  });

  // Calculate summary
  const summary = {
    total: results.length,
    accepted: results.filter(r => r.decision.status === 'accepted').length,
    needs_review: results.filter(r => r.decision.status === 'needs_review').length,
    unmatched: 0
  };

  return {
    meta: {
      top_k: 5,
      strategy: ['exact', 'synonym', 'regex', 'fuzzy'],
      normalization: 'lower + unaccent + whitespace',
      timestamp: new Date().toISOString()
    },
    results,
    summary
  };
}

/**
 * Generates mock candidates for an ingredient
 */
function generateMockCandidates(normalized: string, index: number): IngredientCandidate[] {
  const methods: Array<'exact' | 'synonym' | 'regex' | 'fuzzy'> = ['exact', 'synonym', 'regex', 'fuzzy'];
  const candidateCount = Math.floor(Math.random() * 3) + 1; // 1-3 candidates
  const candidates: IngredientCandidate[] = [];

  for (let i = 0; i < candidateCount; i++) {
    const method = methods[i % methods.length];
    const baseScore = method === 'exact' ? 1.0 : method === 'synonym' ? 0.95 : method === 'regex' ? 0.85 : 0.70;
    const score = Math.max(0.5, baseScore - (i * 0.1) - Math.random() * 0.05);
    
    // Mock is_whole: some ingredients are whole, others are not
    // Whole ingredients: fruits, vegetables, grains (not flour), nuts, seeds
    const wholeKeywords = ['fruit', 'vegetable', 'grain', 'nut', 'seed', 'berry', 'bean', 'legume'];
    const isWhole = wholeKeywords.some(keyword => normalized.includes(keyword)) && !normalized.includes('flour');
    
    // Mock categories: some ingredients have "concentrated_protein" in categories
    const proteinKeywords = ['protein', 'isolate', 'concentrate', 'whey', 'casein', 'soy protein', 'pea protein'];
    const hasConcentratedProtein = proteinKeywords.some(keyword => normalized.includes(keyword));
    const categories: string[] = [];
    
    if (hasConcentratedProtein || (i === 0 && Math.random() > 0.7)) {
      categories.push('concentrated_protein');
    }
    
    candidates.push({
      ingredient_id: (index * 10) + i + 1,
      canonical_name: generateCanonicalName(normalized, method, i),
      method,
      score: Math.round(score * 100) / 100,
      is_whole: isWhole || (i === 0 && Math.random() > 0.5), // Randomly assign for mock data
      categories: categories.length > 0 ? categories : undefined
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

/**
 * Generates a canonical name based on the method
 */
function generateCanonicalName(normalized: string, method: string, variant: number): string {
  const baseName = normalized.replace(/_/g, ' ');
  
  switch (method) {
    case 'exact':
      return baseName;
    case 'synonym':
      const synonyms: Record<string, string[]> = {
        'sugar': ['sugar', 'sucrose', 'cane sugar'],
        'flour': ['flour', 'wheat flour', 'enriched flour'],
        'lecithin': ['lecithin', 'soy lecithin'],
        'flavor': ['flavoring', 'natural flavor', 'artificial flavor'],
        'bicarbonate': ['baking soda', 'sodium bicarbonate', 'bicarbonate']
      };
      const key = Object.keys(synonyms).find(k => baseName.includes(k));
      if (key && synonyms[key]) {
        return synonyms[key][variant % synonyms[key].length];
      }
      return baseName;
    case 'regex':
      // Return partial match (e.g., "wheat flour" from "wheat flour enriched...")
      return baseName.split(' ').slice(0, 2).join(' ');
    case 'fuzzy':
      // Return similar name
      return `${baseName}${variant > 0 ? ' (similar)' : ''}`;
    default:
      return baseName;
  }
}

/**
 * Generates a mock decision based on candidates
 */
function generateMockDecision(candidates: IngredientCandidate[], index: number): IngredientDecision {
  if (candidates.length === 0) {
    return {
      status: 'needs_review',
      reason: 'no candidates found'
    };
  }

  const topCandidate = candidates[0];
  const score = topCandidate.score;

  // Simulate different decision scenarios
  if (score >= 0.95) {
    return {
      status: 'accepted',
      ingredient_id: topCandidate.ingredient_id,
      confidence: Math.round((score + 0.02) * 100) / 100
    };
  } else if (score >= 0.85 && candidates.length > 1) {
    return {
      status: 'accepted_with_warning',
      ingredient_id: topCandidate.ingredient_id,
      warning: 'umbrella ingredient'
    };
  } else if (index % 5 === 1) {
    // Simulate compound ingredient scenario
    return {
      status: 'needs_review',
      reason: 'compound ingredient'
    };
  } else {
    return {
      status: 'accepted',
      ingredient_id: topCandidate.ingredient_id,
      confidence: Math.round(score * 100) / 100
    };
  }
}


