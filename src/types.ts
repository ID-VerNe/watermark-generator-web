/** Default input values for the watermark generator form. */
export interface WatermarkInputs {
  city: string;
  location: string;
  camera: string;
  lens: string;
  fontSize: number;
  signatureLogoWidth: number;
  /** Custom right/signature logo (data URL), or null to use the bundled default. */
  signatureLogo: string | null;
  outputDir: string;
  leftLogo: string | null;
  leftLogoWidth: number;
  showLocation: boolean;
}

/** Library data — city/location/camera/lens options for autocomplete. */
export interface DataLibraries {
  cities: string[];
  locations: Record<string, string[]>;
  cameras: string[];
  lenses: string[];
}

/** Which components go into the generated filename. */
export interface FilenameConfig {
  city: boolean;
  location: boolean;
  camera: boolean;
  lens: boolean;
}

/** City → last-used location history, for smarter defaults. */
export type LocationHistory = Record<string, string>;