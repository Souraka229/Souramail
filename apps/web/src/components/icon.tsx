/** Material Symbols Outlined — loaded via the stylesheet in app/layout.tsx. */
export function Icon({
  name,
  className = '',
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={size ? { fontSize: size } : undefined}
      aria-hidden
    >
      {name}
    </span>
  );
}
