export function Button({
  type = "button",
  variant = "primary",
  onClick,
  disabled,
  className = "",
  children,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`.trim()}
    >
      {children}
    </button>
  );
}
