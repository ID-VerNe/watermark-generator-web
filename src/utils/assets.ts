/** Load a font file from a URL and register it as `CustomWatermarkFont`. */
let fontPromise: Promise<string> | null = null;

export async function loadWatermarkFont(fontUrl: string): Promise<string> {
  if (!fontUrl) return "sans-serif";
  fontPromise ??= (async () => {
    const font = new FontFace("CustomWatermarkFont", `url(${fontUrl})`);
    try {
      await font.load();
      document.fonts.add(font);
      return "CustomWatermarkFont";
    } catch (error) {
      console.error("Failed to load custom font:", error);
      fontPromise = null;
      throw new Error(
        `Could not load font from ${fontUrl}. Please ensure it's in the public folder.`,
      );
    }
  })();
  return fontPromise;
}

/** Load an image from a URL, resolving on success. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}