import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { images, mode } = await req.json(); // mode: 'full-scan' | 'rescan'

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Role: You are a specialized food labeling expert fluent in Brazilian Portuguese and English.
Task: Extract and process nutritional data from product images.
STEP 1: EXTRACTION (Raw Data)
- Extract "product_name", "brand", and "portion_size_value" (e.g., 30) and "portion_unit" (e.g., g, ml, unit)
- "NOVA": 1: unprocessed or minimally processed; 2: processed culinary ingredients; 3: processed foods; 4: ultra-processed foods.
- "ingredients_raw": Transcribe the full list of ingredients exactly as written
- "nutrition_raw": Transcribe the nutrition table data exactly as written (with cells separated by | also for line breaks)
- "declared_special_nutrients": Extract claims like 'Enriched with Vit D', 'Contains 5mg Zinc' (separated by comma)
- "declared_processes": Extract processing information like 'frito', 'assado', 'reconstituído', 'ultraprocessado certificado' (separated by comma)
- "declared_warnings": Extract warnings such as 'contém glúten', 'contém lactose', 'contém açúcar', 'contém alérgenos' (separated by comma)
- "certifications": Extract any certifications found in the image, separated by comma (vegan, organic, gluten-free, etc.)
- "abv_percentage": If alcoholic, look for ABV (teor alcoólico)
- "density_g_per_ml": If a liquid, look for density (g/ml), if not, set to null
- "net_content_g_ml": Look for net content (either g or ml), if not, set to null
STEP 2: PROCESSING
- Format: Use a PERIOD (.) as the decimal separator.
- "ingredients_list": remove end period, replace the last " e " by comma and parse ingredients_raw separating by comma into a string array
- "fermentation_type": If clearly a fermented food which one among: nenhum / iogurte / kefir / queijo tradicional / pão fermentação natural / outro
- If there are multiple columns for different portion sizes, use the largest one

RETURN ONLY VALID JSON:
{
  "product_name": "string",
  "brand": "string",
  "ingredients_raw": "string",
  "ingredients_list": ["item1", "item2"],
  "nutrition_raw": "string",
  "NOVA": number,
  "declared_special_nutrients": ["nutrient 1 (amount)", "nutrient 2 (amount)"],
  "declared_processes": ["process 1", "process 2"],
  "declared_warnings": ["warning 1", "warning 2"],
  "certifications": ["certification 1", "certification 2"],
  "fermentation_type": "string"
  "nutrition_parsed": {
    "metadata": {
      "serving_size": number,
      "serving_size_unit": "string",
      "serving_description": "Ex: 1 xícara, 2 fatias",
      "servings_per_container": number
      "net_content_g_ml": number
    },
    "energy_kcal": number,
    "carbohydrates": {
      "total_carbs_g": number,
      "sugars_total_g": number,
      "sugars_added_g": number,
      "polyols_g": number,
      "starch_g": number
    },
    "proteins": {
      "total_proteins_g": number,
      "amino_acid_profile": boolean
    },
    "fats": {
      "total_fats_g": number,
      "saturated_fats_g": number,
      "trans_fats_g": number,
      "monounsaturated_fats_g": number,
      "polyunsaturated_fats_g": number,
      "cholesterol_mg": number
    },
    "fiber": {
      "total_fiber_g": number,
      "soluble_fiber_g": number,
      "insoluble_fiber_g": number
    },
    "minerals_mg": {
      "barium_mg": number,
      "bicarbonate_mg": number,
      "borate_mg": number,
      "bromide_mg": number,
      "calcium_mg": number,
      "chloride_mg": number,
      "fluoride_mg": number,
      "iron_mg": number,
      "magnesium_mg": number,
      "nitrate_mg": number
      "phosphate_mg": number,
      "potassium_mg": number,
      "sulfate_mg": number,
      "sodium_mg": number,
      "strontium_mg": number,
      "zinc_mg": number
    },
    "vitamins": {
      "vitamin_a_mcg": number,
      "vitamin_b1_mg": number,
      "vitamin_b2_mg": number,
      "vitamin_b3_mg": number,
      "vitamin_b5_mg": number,
      "vitamin_b6_mg": number,
      "vitamin_b5_mg": number,
      "vitamin_b7_mcg": number,
      "vitamin_b9_mcg": number,
      "vitamin_b11_mcg": number,
      "vitamin_b12_mcg": number,
      "vitamin_c_mg": number,
      "vitamin_d_mcg": number,
      "vitamin_e_mg": number,
      "vitamin_k_mcg": number
    },
    "abv_percentage": "float",
    "density_g_per_ml": "float"
  }
}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: mode === 'rescan' ? "Rescan this specific label for accuracy." : "Identify this new food product." },
            ...images.map((img: string) => ({
              type: "image_url",
              image_url: { url: img }
            }))
          ]
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to process images" }, { status: 500 });
  }
}