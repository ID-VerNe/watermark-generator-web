import { useState } from "react";
import type {
  DataLibraries,
  FilenameConfig,
  LocationHistory,
  WatermarkInputs,
} from "../types";
import AutocompleteInput from "./AutocompleteInput";

interface WatermarkFormProps {
  inputs: WatermarkInputs;
  setInputs: React.Dispatch<React.SetStateAction<WatermarkInputs>>;
  libraries: DataLibraries;
  setLibraries: React.Dispatch<React.SetStateAction<DataLibraries>>;
  locationHistory: LocationHistory;
  setLocationHistory: React.Dispatch<React.SetStateAction<LocationHistory>>;
  filenameConfig: FilenameConfig;
  setFilenameConfig: React.Dispatch<React.SetStateAction<FilenameConfig>>;
  onDownload: () => void;
  isGenerating: boolean;
}

/** Shared class names for text/number inputs. */
const INPUT_CLASS =
  "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100";
const LABEL_CLASS =
  "block text-sm font-medium text-gray-700 dark:text-gray-300";
const CHECKBOX_CLASS =
  "h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500";

/**
 * Main watermark form: city/location/camera/lens, font & logo options,
 * filename component toggles, plus a data management modal
 * (export/import data.json).
 */
export default function WatermarkForm({
  inputs,
  setInputs,
  libraries,
  setLibraries,
  locationHistory,
  setLocationHistory,
  filenameConfig,
  setFilenameConfig,
  onDownload,
  isGenerating,
}: WatermarkFormProps) {
  const [showDataModal, setShowDataModal] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = event.target;
    if (name === "city") {
      const raw = value;
      const cityKey = raw.toUpperCase();
      const lastLocation = locationHistory[cityKey];
      const cityLocations = libraries.locations[cityKey] || [];
      let nextLocation = "";
      lastLocation && cityLocations.includes(lastLocation)
        ? (nextLocation = lastLocation)
        : cityLocations.length > 0 && (nextLocation = cityLocations[0]);
      setInputs((prev) => ({
        ...prev,
        city: raw,
        location: nextLocation,
      }));
    } else if (name === "location") {
      setInputs((prev) => ({
        ...prev,
        location: value,
      }));
      const cityKey = inputs.city.toUpperCase();
      cityKey &&
        value &&
        setLocationHistory((prev) => ({
          ...prev,
          [cityKey]: value,
        }));
    } else {
      setInputs((prev) => ({
        ...prev,
        [name]: type === "number" ? Number(value) : value,
      }));
    }
  };

  const handleFilenameToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setFilenameConfig((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleExportData = () => {
    const href = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(libraries, null, 4),
    )}`;
    const link = document.createElement("a");
    link.href = href;
    link.download = "data.json";
    link.click();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const content = loadEvent.target?.result;
        if (typeof content !== "string")
          throw new Error("File content is not readable text.");

        const parsed = JSON.parse(content);
        if (parsed.cities && parsed.locations && parsed.cameras && parsed.lenses) {
          setLibraries(parsed);
          alert("Data imported successfully!");
          setShowDataModal(false);
        } else {
          throw new Error(
            "Invalid JSON structure. The file must contain 'cities', 'locations', 'cameras', and 'lenses' keys.",
          );
        }
      } catch (error) {
        console.error("Failed to import data:", error);
        error instanceof Error
          ? alert(`Error importing file: ${error.message}`)
          : alert("An unknown error occurred during import.");
      }
    };
    reader.onerror = () => {
      alert("Failed to read the file.");
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleLeftLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result;
      typeof dataUrl === "string" &&
        setInputs((prev) => ({
          ...prev,
          leftLogo: dataUrl,
        }));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleRemoveLeftLogo = () => {
    setInputs((prev) => ({
      ...prev,
      leftLogo: null,
    }));
  };

  const cityKey = inputs.city.toUpperCase();
  const cityLocations = libraries.locations[cityKey] || [];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onDownload();
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AutocompleteInput
            id="city"
            name="city"
            label="City"
            value={inputs.city}
            onChange={handleChange}
            options={libraries.cities}
          />
          <AutocompleteInput
            id="location"
            name="location"
            label="Location / District"
            value={inputs.location}
            onChange={handleChange}
            options={cityLocations}
          />
          <AutocompleteInput
            id="camera"
            name="camera"
            label="Camera"
            value={inputs.camera}
            onChange={handleChange}
            options={libraries.cameras}
          />
          <AutocompleteInput
            id="lens"
            name="lens"
            label="Lens"
            value={inputs.lens}
            onChange={handleChange}
            options={libraries.lenses}
          />
          <div>
            <label htmlFor="fontSize" className={LABEL_CLASS}>
              Font Size (px)
            </label>
            <input
              type="number"
              id="fontSize"
              name="fontSize"
              min="10"
              max="200"
              value={inputs.fontSize}
              onChange={handleChange}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="signatureLogoWidth" className={LABEL_CLASS}>
              Signature Logo Width (px)
            </label>
            <input
              type="number"
              id="signatureLogoWidth"
              name="signatureLogoWidth"
              min="50"
              max="1000"
              value={inputs.signatureLogoWidth}
              onChange={handleChange}
              className={INPUT_CLASS}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`${LABEL_CLASS} mb-2`}>Left Logo (Custom)</label>
              <div className="flex items-center space-x-4">
                <label className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <span>Upload Logo</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLeftLogoUpload}
                  />
                </label>
                {inputs.leftLogo && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Logo Set
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveLeftLogo}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              {inputs.leftLogo && (
                <div className="mt-2">
                  <label htmlFor="leftLogoWidth" className={LABEL_CLASS}>
                    Width (px)
                  </label>
                  <input
                    type="number"
                    id="leftLogoWidth"
                    name="leftLogoWidth"
                    min="50"
                    max="1000"
                    value={inputs.leftLogoWidth}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center h-full pt-6">
              <input
                id="showLocation"
                name="showLocation"
                type="checkbox"
                checked={inputs.showLocation}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    showLocation: event.target.checked,
                  }))
                }
                className={CHECKBOX_CLASS}
              />
              <label
                htmlFor="showLocation"
                className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Show Location Text & Icon
              </label>
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={`${LABEL_CLASS} mb-2`}>Filename Components</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(filenameConfig).map((item) => (
                <div key={item} className="flex items-center">
                  <input
                    id={`filename-${item}`}
                    name={item}
                    type="checkbox"
                    checked={filenameConfig[item as keyof FilenameConfig]}
                    onChange={handleFilenameToggle}
                    className={CHECKBOX_CLASS}
                  />
                  <label
                    htmlFor={`filename-${item}`}
                    className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize"
                  >
                    {item}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center gap-x-4">
          <button
            type="submit"
            disabled={isGenerating}
            className="flex-grow flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating..." : "Download Watermark"}
          </button>
          <button
            type="button"
            onClick={() => setShowDataModal(true)}
            className="flex-shrink-0 p-3 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label="Open data settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600 dark:text-gray-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </form>
      {showDataModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity"
          onClick={() => setShowDataModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                Data Management
              </h3>
              <button
                onClick={() => setShowDataModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <button
                onClick={handleExportData}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Export Current Data (.json)
              </button>
              <label className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
                <span>Import Data From File (.json)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}