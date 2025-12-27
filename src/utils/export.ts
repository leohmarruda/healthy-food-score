export const downloadAsCSV = (data: any[], fileName: string) => {
    if (data.length === 0) return;
  
    // 1. Define the headers you want in the CSV
    const headers = ["Name", "Brand", "Kcal", "Protein (g)", "Carbs (g)", "Fat (g)", "Score"];
    
    // 2. Map the data to rows matching the headers
    const rows = data.map(food => [
      `"${food.name}"`, // Wrap in quotes to handle commas in names
      `"${food.brand}"`,
      food.energy_kcal,
      food.protein_g,
      food.carbs_total_g,
      food.fat_total_g,
      food.hfs
    ]);
  
    // 3. Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
  
    // 4. Create a download link and click it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };