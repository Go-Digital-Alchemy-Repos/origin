import { cn } from "@/lib/utils";
import logoSrc from "@assets/Originsymbol_1770860673402.png";

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
      <img
        src={logoSrc}
        alt="ORIGIN"
        className={cn(s.icon, "object-contain")}
      />
      {variant === "full" && (
        <span className={cn(s.text, "font-bold tracking-tight text-foreground")}>
          ORIGIN
        </span>
      )}
    </div>
  );
}
