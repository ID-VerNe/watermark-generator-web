import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DataLibraries,
  FilenameConfig,
  LocationHistory,
  WatermarkInputs,
} from "./types";
import {
  DEFAULT_FILENAME_CONFIG,
  DEFAULT_INPUTS,
  DEFAULT_LIBRARIES,
} from "./data/defaults";
import { loadState, saveState } from "./utils/storage";
import { sanitizeFilenameComponent } from "./utils/filename";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  drawWatermarkCanvas,
} from "./utils/watermark";
import WatermarkForm from "./components/WatermarkForm";
import PreviewCanvas from "./components/PreviewCanvas";

/** Resource paths for the watermark renderer (relative to `public/`). */
const RESOURCES = {
  locationLogoUrl: "location_logo.png",
  signatureLogoUrl: "signature_logo.png",
  fontUrl: "misans.ttf",
};

/**
 * Root application: persistent state + preview canvas + download logic.
 */
export default function App() {
  const [inputs, setInputs] = useState<WatermarkInputs>(() =>
    loadState("watermarkInputs", DEFAULT_INPUTS),
  );
  const [libraries, setLibraries] = useState<DataLibraries>(() =>
    loadState("dataLibraries", DEFAULT_LIBRARIES),
  );
  const [locationHistory, setLocationHistory] = useState<LocationHistory>(() =>
    loadState("locationHistory", {}),
  );
  const [filenameConfig, setFilenameConfig] = useState<FilenameConfig>(() =>
    loadState("filenameConfig", DEFAULT_FILENAME_CONFIG),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    saveState("watermarkInputs", inputs);
  }, [inputs]);
  useEffect(() => {
    saveState("dataLibraries", libraries);
  }, [libraries]);
  useEffect(() => {
    saveState("locationHistory", locationHistory);
  }, [locationHistory]);
  useEffect(() => {
    saveState("filenameConfig", filenameConfig);
  }, [filenameConfig]);

  const generatePreview = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsGenerating(true);
    setError(null);
    try {
      await drawWatermarkCanvas(canvasRef.current, inputs, RESOURCES);
    } catch (err) {
      console.error("Failed to generate watermark preview:", err);
      const message =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Preview Error: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [inputs]);

  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parts: string[] = [];
    filenameConfig.city && parts.push(sanitizeFilenameComponent(inputs.city));
    filenameConfig.location &&
      parts.push(sanitizeFilenameComponent(inputs.location));
    filenameConfig.camera &&
      parts.push(sanitizeFilenameComponent(inputs.camera));
    filenameConfig.lens && parts.push(sanitizeFilenameComponent(inputs.lens));
    const filenameParts = parts.filter((part) => part);
    const downloadName =
      filenameParts.length > 0 ? `${filenameParts.join("_")}.png` : "watermark.png";

    const link = document.createElement("a");
    link.download = downloadName;
    link.href = canvas.toDataURL("image/png");
    link.click();

    // Record newly-typed city/camera/lens/location values into the libraries.
    const nextLibraries: DataLibraries = { ...libraries };
    let changed = false;
    if (
      inputs.city &&
      !nextLibraries.cities.includes(inputs.city.toUpperCase())
    ) {
      nextLibraries.cities.push(inputs.city.toUpperCase());
      nextLibraries.cities.sort();
      changed = true;
    }
    if (
      inputs.camera &&
      !nextLibraries.cameras.includes(inputs.camera.toUpperCase())
    ) {
      nextLibraries.cameras.push(inputs.camera.toUpperCase());
      nextLibraries.cameras.sort();
      changed = true;
    }
    if (
      inputs.lens &&
      !nextLibraries.lenses.includes(inputs.lens.toUpperCase())
    ) {
      nextLibraries.lenses.push(inputs.lens.toUpperCase());
      nextLibraries.lenses.sort();
      changed = true;
    }
    const cityKey = inputs.city.toUpperCase();
    if (cityKey && inputs.location) {
      nextLibraries.locations[cityKey] || (nextLibraries.locations[cityKey] = []);
      if (
        !nextLibraries.locations[cityKey].includes(inputs.location.toUpperCase())
      ) {
        nextLibraries.locations[cityKey].push(inputs.location.toUpperCase());
        nextLibraries.locations[cityKey].sort();
        changed = true;
      }
    }
    changed && setLibraries(nextLibraries);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto p-4 lg:p-8">
        <div className="flex flex-col gap-8">
          <WatermarkForm
            inputs={inputs}
            setInputs={setInputs}
            libraries={libraries}
            setLibraries={setLibraries}
            locationHistory={locationHistory}
            setLocationHistory={setLocationHistory}
            filenameConfig={filenameConfig}
            setFilenameConfig={setFilenameConfig}
            onDownload={handleDownload}
            isGenerating={isGenerating}
          />
          <PreviewCanvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            isGenerating={isGenerating}
            error={error}
          />
        </div>
      </main>
    </div>
  );
}