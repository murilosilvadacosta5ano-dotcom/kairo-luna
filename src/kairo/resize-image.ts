export async function resizeImageFile(file: File, maxEdge = 960, quality = 0.72) {
  const bitmap = await blobToImage(file);
  return resizeElement(bitmap, maxEdge, quality);
}

export async function resizeDataUrl(dataUrl: string, maxEdge = 960, quality = 0.72) {
  const img = await dataUrlToImage(dataUrl);
  return resizeElement(img, maxEdge, quality);
}

function blobToImage(file: Blob): Promise<HTMLImageElement | ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}

function dataUrlToImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    img.src = dataUrl;
  });
}

function resizeElement(
  source: HTMLImageElement | ImageBitmap,
  maxEdge: number,
  quality: number,
): string {
  const w = "width" in source ? source.width : 0;
  const h = "height" in source ? source.height : 0;
  const scale = Math.min(1, maxEdge / Math.max(w, h, 1));
  const width = Math.max(1, Math.round(w * scale));
  const height = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível.");
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}
