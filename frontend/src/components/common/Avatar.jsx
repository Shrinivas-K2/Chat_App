export function Avatar({ text, size = "md" }) {
  return <span className={`avatar avatar-${size}`}>{text}</span>;
}
