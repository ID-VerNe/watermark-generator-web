import type { DataLibraries, FilenameConfig, WatermarkInputs } from "../types";

/** Default form inputs — matches the original deployed version. */
export const DEFAULT_INPUTS: WatermarkInputs = {
  city: "GUANGZHOU",
  location: "HUANGPU",
  camera: "LICE-7C",
  lens: "SIGMA 24-70MM F2.8 DG DN II ART",
  fontSize: 40,
  signatureLogoWidth: 300,
  outputDir: "",
  leftLogo: null,
  leftLogoWidth: 300,
  showLocation: true,
};

/** Default library data (city/location/camera/lens autocomplete options). */
export const DEFAULT_LIBRARIES: DataLibraries = {
  cities: ["GUANGZHOU", "SHENZHEN", "BEIJING", "SHANGHAI"],
  locations: {
    GUANGZHOU: ["HUANGPU", "TIANHE", "Yuexiu"],
    SHENZHEN: ["NANSHAN", "FUTIAN"],
  },
  cameras: ["LICE-7C", "SONY A7R V", "CANON R5", "IPHONE 15 PRO MAX"],
  lenses: [
    "SIGMA 24-70MM F2.8 DG DN II ART",
    "SONY FE 50MM F1.2 GM",
    "CANON RF 24-70MM F2.8 L IS USM",
  ],
};

/** Default filename component selection. */
export const DEFAULT_FILENAME_CONFIG: FilenameConfig = {
  city: true,
  location: true,
  camera: false,
  lens: false,
};