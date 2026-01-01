export const downloadAsCSV = (data: any[], fileName: string, dict?: any) => {
    if (data.length === 0) return;
  
    // Get translated headers from dictionary or use defaults
    const csvHeaders = dict?.pages?.home?.csvHeaders || {};
    const headers = [
      csvHeaders.name || "Name",
      csvHeaders.brand || "Brand",
      csvHeaders.kcal || "Kcal",
      csvHeaders.protein || "Protein (g)",
      csvHeaders.carbs || "Carbs (g)",
      csvHeaders.fat || "Fat (g)",
      csvHeaders.score || "Score"
    ];
    
    // Map data to rows, using semicolon as delimiter (Brazilian Excel standard)
    const delimiter = ";";
    const rows = data.map(food => [
      `"${(food.product_name || "").replace(/"/g, '""')}"`, // Escape quotes and handle null values
      `"${(food.brand || "").replace(/"/g, '""')}"`,
      food.energy_kcal ?? "",
      food.protein_g ?? "",
      food.carbs_total_g ?? "",
      food.fat_total_g ?? "",
      food.hfs ?? ""
    ]);
  
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