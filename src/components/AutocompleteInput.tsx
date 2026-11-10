import { useEffect, useRef, useState } from "react";

interface AutocompleteInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  options: string[];
}

/**
 * Text input with an autocomplete dropdown of suggestions.
 * The dropdown opens on focus and closes on outside mousedown or selection.
 */
export default function AutocompleteInput({
  id,
  name,
  label,
  value,
  onChange,
  options,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const selectOption = (item: string) => {
    onChange({
      target: {
        name,
        value: item,
      },
    } as React.ChangeEvent<HTMLInputElement>);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setOpen(true)}
        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
        autoComplete="off"
      />
      {open && options.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto ring-1 ring-black ring-opacity-5">
          {options.map((item) => (
            <li
              key={item}
              onClick={() => selectOption(item)}
              className="px-3 py-2 cursor-pointer text-sm text-gray-900 dark:text-gray-200 hover:bg-indigo-600 hover:text-white"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}