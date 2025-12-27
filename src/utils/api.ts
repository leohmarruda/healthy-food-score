export const processImages = async (imageUrls: string[], mode: 'full-scan' | 'rescan') => {
    const response = await fetch('/api/process-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: imageUrls, mode }),
    });
    
    if (!response.ok) throw new Error("Processing failed");
    return response.json();
  };