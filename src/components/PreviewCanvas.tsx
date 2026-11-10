import { forwardRef } from "react";

interface PreviewCanvasProps {
  width: number;
  height: number;
  isGenerating: boolean;
  error: string | null;
}

/**
 * Canvas preview panel with a generating-spinner / error overlay.
 */
const PreviewCanvas = forwardRef<HTMLCanvasElement, PreviewCanvasProps>(
  ({ width, height, isGenerating, error }, ref) => (
    <div className="bg-gray-900/50 p-4 rounded-lg shadow-inner flex flex-col justify-center items-center aspect-[4000/764] w-full min-h-[100px] relative">
      <canvas
        ref={ref}
        width={width}
        height={height}
        className="w-full h-auto object-contain"
      />
      {(isGenerating || error) && (
        <div className="absolute inset-0 bg-black/50 flex justify-center items-center rounded-lg">
          {isGenerating && (
            <div className="text-white text-lg flex items-center space-x-2">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Generating Preview...</span>
            </div>
          )}
          {error && (
            <div className="text-red-400 text-center p-4">
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  ),
);

PreviewCanvas.displayName = "PreviewCanvas";

export default PreviewCanvas;