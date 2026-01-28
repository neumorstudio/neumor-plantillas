"use client";

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  preview?: React.ReactNode;
}

interface OptionSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  description?: string;
  columns?: 2 | 3 | 4;
}

export function OptionSelector({
  label,
  value,
  onChange,
  options,
  description,
  columns = 2,
}: OptionSelectorProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      {description && (
        <p className="text-xs text-[var(--text-secondary)] mb-3">{description}</p>
      )}

      <div className={`grid ${gridCols[columns]} gap-2`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`p-3 rounded-xl text-center transition-all ${
              value === option.value
                ? "ring-2 ring-[var(--accent)] bg-[var(--accent-light)]"
                : "neumor-inset hover:bg-[var(--shadow-light)]"
            }`}
          >
            {option.preview && (
              <div className="mb-2 flex justify-center">{option.preview}</div>
            )}
            {option.icon && (
              <div className="mb-1 flex justify-center text-[var(--text-secondary)]">
                {option.icon}
              </div>
            )}
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default OptionSelector;
