import type { WatermarkInputs } from "../types";
import { loadImage, loadWatermarkFont } from "./assets";

/** Canvas dimensions — matches the original deployed version. */
export const CANVAS_WIDTH = 4000;
export const CANVAS_HEIGHT = 764;

/** Padding between the drawn content and the canvas edge. */
const PADDING = 20;

/** Gap between a logo and adjacent text. */
const LOGO_TEXT_GAP = 10;

/** Resource URLs passed to the canvas renderer. */
export interface WatermarkResources {
  locationLogoUrl?: string;
  signatureLogoUrl?: string;
  fontUrl?: string;
}

/**
 * Fit an image to a target width without letting the height overflow `maxHeight`.
 *
 * Logo width is user-driven, so a tall image (aspect ratio greater than the box)
 * would otherwise scale past the top of the canvas and get clipped (issue #6).
 * When the width-driven height exceeds the box, the width is recomputed from
 * `maxHeight` instead, keeping the whole image inside the box.
 */
function fitLogoInBox(
  image: HTMLImageElement,
  targetWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (maxHeight <= 0) return { width: 0, height: 0 };
  const height = image.height * (targetWidth / image.width);
  if (height <= maxHeight) return { width: targetWidth, height };
  return { width: image.width * (maxHeight / image.height), height: maxHeight };
}

/**
 * Draw the watermark onto the given canvas.
 *
 * Layout:
 *   - "SHOT ON <camera> & <lens>"  → bottom-right
 *   - signature logo               → above the SHOT ON text (right)
 *   - "<city> · <location>"        → bottom-left (only when showLocation)
 *   - location pin logo            → left of the location text
 *   - custom left logo             → bottom-left, anchored below the block
 */
export async function drawWatermarkCanvas(
  canvas: HTMLCanvasElement,
  inputs: WatermarkInputs,
  resources: WatermarkResources,
): Promise<void> {
  const { city, location, camera, lens, fontSize, signatureLogoWidth } = inputs;
  const { locationLogoUrl, signatureLogoUrl, fontUrl } = resources;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  canvas.width = CANVAS_WIDTH;

  const [fontFamily, images] = await Promise.all([
    loadWatermarkFont(fontUrl),
    (async () => {
      const loaded: Record<string, HTMLImageElement> = {};
      if (locationLogoUrl) loaded.locationLogo = await loadImage(locationLogoUrl);
      if (signatureLogoUrl) loaded.signatureLogo = await loadImage(signatureLogoUrl);
      if (inputs.leftLogo) loaded.customLeftLogo = await loadImage(inputs.leftLogo);
      return loaded;
    })(),
  ]);
  const { locationLogo, signatureLogo, customLeftLogo } = images;

  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = "rgba(255, 255, 255, 1)";
  ctx.textBaseline = "alphabetic";

  const shotOnText = `SHOT ON ${camera.toUpperCase()}${
    lens ? ` & ${lens.toUpperCase()}` : ""
  }`;
  const locationText = `${city.toUpperCase()} · ${location.toUpperCase()}`;

  const shotOnMetrics = ctx.measureText(shotOnText);
  const locationMetrics = ctx.measureText(locationText);
  const shotOnTextHeight =
    shotOnMetrics.fontBoundingBoxAscent + shotOnMetrics.fontBoundingBoxDescent;
  const locationTextHeight =
    locationMetrics.fontBoundingBoxAscent + locationMetrics.fontBoundingBoxDescent;

  // Bottom-right: "SHOT ON <camera> & <lens>"
  const shotOnX = CANVAS_WIDTH - PADDING - shotOnMetrics.width;
  const shotOnY = CANVAS_HEIGHT - PADDING - shotOnMetrics.fontBoundingBoxDescent;
  ctx.fillText(shotOnText, shotOnX, shotOnY);

  let shotOnBlockBottom = shotOnY;
  if (signatureLogo) {
    // Bottom edge of the logo block — independent of the logo's height, so the
    // clamp below never moves it. Capped at PADDING so a tall logo stays inside
    // the canvas instead of being drawn above the top edge (issue #6).
    const logoBottom =
      shotOnY -
      shotOnTextHeight -
      LOGO_TEXT_GAP +
      shotOnMetrics.fontBoundingBoxDescent;
    const { width: logoWidth, height: logoHeight } = fitLogoInBox(
      signatureLogo,
      signatureLogoWidth,
      logoBottom - PADDING,
    );
    const logoX = CANVAS_WIDTH - PADDING - logoWidth;
    const logoY = logoBottom - logoHeight;
    ctx.drawImage(signatureLogo, logoX, logoY, logoWidth, logoHeight);
    shotOnBlockBottom = logoBottom;
  }

  // Bottom-left: "<city> · <location>" with optional location pin logo
  if (inputs.showLocation) {
    const locationBaseline =
      CANVAS_HEIGHT - PADDING - locationMetrics.fontBoundingBoxDescent;
    if (locationLogo) {
      const scale = locationTextHeight / locationLogo.height;
      const drawWidth = locationLogo.width * scale;
      const drawHeight = locationTextHeight;
      const drawX = PADDING;
      const drawY = CANVAS_HEIGHT - PADDING - drawHeight;
      ctx.drawImage(locationLogo, drawX, drawY, drawWidth, drawHeight);
      ctx.fillText(
        locationText,
        PADDING + drawWidth + LOGO_TEXT_GAP,
        locationBaseline,
      );
    } else {
      ctx.fillText(locationText, PADDING, locationBaseline);
    }
  }

  // Custom left logo, anchored below the location/signature block.
  if (customLeftLogo) {
    let baseline: number;
    if (inputs.showLocation) {
      baseline = signatureLogo
        ? shotOnBlockBottom
        : shotOnY - shotOnTextHeight - 20;
    } else {
      baseline = CANVAS_HEIGHT - PADDING;
    }
    const { width: logoWidth, height: logoHeight } = fitLogoInBox(
      customLeftLogo,
      inputs.leftLogoWidth,
      baseline - PADDING,
    );
    const logoY = baseline - logoHeight;
    ctx.drawImage(customLeftLogo, PADDING, logoY, logoWidth, logoHeight);
  }
}