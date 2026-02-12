import { cn } from "@/lib/utils";

interface OriginLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "mark";
  className?: string;
}

export function OriginLogo({ size = "md", variant = "full", className }: OriginLogoProps) {
  const sizeMap = {
    sm: { icon: "h-6 w-6", text: "text-base" },
    md: { icon: "h-8 w-8", text: "text-xl" },
    lg: { icon: "h-10 w-10", text: "text-2xl" },
  };

  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          s.icon,
          "rounded-md flex items-center justify-center font-bold text-white"
        )}
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #3b82f6 100%)",
        }}
      >
        <span className="text-xs font-black tracking-tighter">O</span>
      </div>
      {variant === "full" && (
        <span className={cn(s.text, "font-bold tracking-tight text-foreground")}>
          ORIGIN
        </span>
      )}
    </div>
  );
}
