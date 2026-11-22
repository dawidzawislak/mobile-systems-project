import React, { useState, useRef, useEffect } from "react";
import classNames from "classnames";

interface Option {
  value: string;
  label: string;
}

interface CustomMultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const CustomMultiSelect: React.FC<CustomMultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const selectRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(search.toLowerCase()) &&
      !value.includes(option.value)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            onChange([...value, filteredOptions[highlightedIndex].value]);
            setSearch("");
            setHighlightedIndex(0);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSearch("");
          break;
        case "Backspace":
          if (search === "" && value.length > 0) {
            onChange(value.slice(0, -1));
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, highlightedIndex, filteredOptions, value, onChange, search]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleRemove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const selectedOptions = options.filter((option) =>
    value.includes(option.value)
  );

  return (
    <div
      className={classNames(
        "relative w-full",
        disabled && "opacity-60 pointer-events-none",
        className
      )}
      ref={selectRef}
      id={id}
    >
      <div
        className={classNames(
          "min-h-[38px] p-[6px] border rounded bg-white cursor-pointer transition-colors duration-200 flex flex-wrap gap-1",
          isOpen ? "border-orange-500" : "border-gray-300",
          "hover:border-gray-400"
        )}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {selectedOptions.map((option) => (
          <span
            key={option.value}
            className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
          >
            {option.label}
            <button
              type="button"
              className="ml-1 inline-flex items-center p-0.5 rounded-full text-orange-400 hover:bg-orange-200 hover:text-orange-500"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(option.value);
              }}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-0 outline-none bg-transparent"
          placeholder={value.length === 0 ? placeholder : ""}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        <svg
          className={classNames(
            "w-4 h-4 transform transition-transform duration-200 self-center",
            isOpen ? "rotate-180" : ""
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {isOpen && (
        <ul
          className="absolute z-30 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto animate-fadeIn"
          role="listbox"
          style={{
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={option.value}
                className={classNames(
                  "p-2 cursor-pointer transition-colors duration-150",
                  highlightedIndex === index && "bg-orange-100",
                  "hover:bg-orange-100"
                )}
                onClick={() => {
                  onChange([...value, option.value]);
                  setSearch("");
                  setHighlightedIndex(0);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
              >
                {option.label}
              </li>
            ))
          ) : (
            <li className="p-2 text-gray-500">Brak wyników</li>
          )}
        </ul>
      )}
    </div>
  );
};
export default CustomMultiSelect;
