import { cn } from "../lib/utils";
import { Loader2 } from "lucide-react";

export default function Spinner({
  size = "md",
  className = "",
  color = "currentColor",
}) {
  const sizeMap = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const currentSize = typeof size === 'string' ? (sizeMap[size] || sizeMap.md) : "";
  const customStyle = typeof size === 'number' ? { width: size, height: size, color } : { color };

  return (
    <Loader2
      className={cn(
        "inline-flex shrink-0 animate-spin",
        currentSize,
        className,
      )}
      style={customStyle}
      aria-hidden="true"
    />
  );
}
