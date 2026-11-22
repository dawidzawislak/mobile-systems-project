const SIZES = {
  sm: "h-4 w-4 border-b-2",
  md: "h-8 w-8 border-b-2",
  lg: "h-16 w-16 border-b-4",
};

export default function Spinner({
  size = "md",
  label,
  className = "",
}: {
  size?: keyof typeof SIZES;
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-2 ${className}`}
    >
      <div
        className={`animate-spin rounded-full border-orange-600 ${SIZES[size]}`}
      />
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </div>
  );
}
