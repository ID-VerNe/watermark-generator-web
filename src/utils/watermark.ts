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
    const logoWidth = signatureLogoWidth;
    const logoHeight = signatureLogo.height * (logoWidth / signatureLogo.width);
    const logoX = CANVAS_WIDTH - PADDING - logoWidth;
    const logoY =
      shotOnY -
      shotOnTextHeight -
      LOGO_TEXT_GAP -
      logoHeight +
      shotOnMetrics.fontBoundingBoxDescent;
    ctx.drawImage(signatureLogo, logoX, logoY, logoWidth, logoHeight);
    shotOnBlockBottom = logoY + logoHeight;
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
    const logoWidth = inputs.leftLogoWidth;
    const logoHeight = customLeftLogo.height * (logoWidth / customLeftLogo.width);
    const logoY = baseline - logoHeight;
    ctx.drawImage(customLeftLogo, PADDING, logoY, logoWidth, logoHeight);
  }
}