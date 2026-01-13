/**
 * Downloads food data as CSV file.
 * Includes UTF-8 BOM for proper Excel encoding (especially Brazilian Excel).
 * Uses semicolon as delimiter (Brazilian Excel standard).
 * 
 * @param data - Array of food items to export
 * @param fileName - Name of the CSV file (without extension)
 * @param dict - Dictionary for localized headers
 */
export const downloadAsCSV = (data: any[], fileName: string, dict?: any) => {
    if (data.length === 0) return;
  
    // Get translated headers from dictionary or use defaults
    const csvHeaders = dict?.pages?.home?.csvHeaders || {};
    const headers = [
      csvHeaders.name || "Name",
      csvHeaders.brand || "Brand",
      csvHeaders.v1Score || "V1 Score",
      csvHeaders.v2Score || "V2 Score",
      csvHeaders.kcal || "Kcal",
      csvHeaders.protein || "Protein (g)",
      csvHeaders.carbs || "Carbs (g)",
      csvHeaders.fat || "Fat (g)",
      csvHeaders.location || "Location",
      csvHeaders.fiber || "Fiber (g)",
      csvHeaders.sodium || "Sodium (mg)",
      csvHeaders.ingredients || "Ingredients"
    ];
    
    // Map data to rows, using semicolon as delimiter (Brazilian Excel standard)
    const delimiter = ";";
    const rows = data.map(food => {
      // Extract v1 and v2 scores from hfs_score JSON
      const v1Score = food.hfs_score?.v1?.HFS ?? food.hfs_score?.v1?.HFSv1 ?? "";
      const v2Score = food.hfs_score?.v2?.hfs_score ?? "";
      
      // Format ingredients list as comma-separated string
      const ingredientsList = Array.isArray(food.ingredients_list) 
        ? food.ingredients_list.join(", ")
        : "";
      
      return [
        `"${(food.product_name || "").replace(/"/g, '""')}"`, // Escape quotes and handle null values
        `"${(food.brand || "").replace(/"/g, '""')}"`,
        v1Score || "",
        v2Score || "",
        food.energy_kcal ?? "",
        food.protein_g ?? "",
        food.carbs_total_g ?? "",
        food.fat_total_g ?? "",
        `"${(food.location || "").replace(/"/g, '""')}"`,
        food.fiber_g ?? "",
        food.sodium_mg ?? "",
        `"${ingredientsList.replace(/"/g, '""')}"`
      ];
    });
  
    // Combine headers and rows with semicolon delimiter
    const csvContent = [
      headers.join(delimiter),
      ...rows.map(row => row.join(delimiter))
    ].join("\n");
  
    // Add UTF-8 BOM for proper encoding in Excel (especially Brazilian Excel)
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;
  
    // Create blob with UTF-8 encoding
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };