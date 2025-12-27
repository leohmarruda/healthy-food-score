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
- Extract "product_name", "brand", and "portion_size_value" (e.g., 30) and "portion_unit" (e.g., g, ml, unit).
- "ingredients_raw": Transcribe the full list of ingredients exactly as written.
- "nutrition_raw": Transcribe the nutrition table data exactly as written (with cells separated by | also for line breaks).
- "declared_special_nutrients": Extract claims like 'Enriched with Vit D', 'Contains 5mg Zinc' (separated by comma)
- "declared_processes": Extract processing information like 'frito', 'assado', 'reconstituído', 'ultraprocessado certificado' (separated by comma)
- "abv_percentage": If alcoholic, look for ABV (teor alcoólico).
STEP 2: PROCESSING
- Format: Use a PERIOD (.) as the decimal separator.
- "ingredients_list": parse the different ingredients into a string array
- "fermentation_type": If clearly a fermented food which one among: nenhum / iogurte / kefir / queijo tradicional / pão fermentação natural / outro
- If there are multiple columns for different portion sizes, use the largest one.

RETURN ONLY VALID JSON:
{
  "product_name": "string",
  "brand": "string",
  "ingredients_raw": "string",
  "portion_size_value": number,
  "portion_unit": "string",
  "nutrition_raw": "string",
  "declared_special_nutrients": "string",
  "declared_processes": "string",
  "abv_percentage": "float",
  "ingredients_list": "string[]",
  "fermentation_type": "string",
  "energy_kcal": number,
  "carbs_total_g": number,
  "protein_g": number,
  "fat_total_g": number,
  "sodium_mg": number,
  "fiber_g": number,
  "saturated_fat_g": number,
  "trans_fat_g": number
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