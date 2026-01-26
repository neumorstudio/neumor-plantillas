"use client";

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: "text-xs py-1.5 px-2",
    md: "text-sm py-2 px-3",
  };

  return (
    <div className="segmented-control">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`segment ${sizeClasses[size]} ${value === option.value ? "active" : ""}`}
        >
          {option.label}
          {typeof option.count === "number" && (
            <span className="segment-count">{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
