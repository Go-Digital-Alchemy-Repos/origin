import { memo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, ChevronRight } from "lucide-react";

export const EditorPanel = memo(function EditorPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col h-full",
        "text-[hsl(var(--editor-text))]",
        className
      )}
      style={{ backgroundColor: "hsl(var(--editor-panel))", boxShadow: "var(--editor-panel-shadow)" }}
    >
      {children}
    </div>
  );
});

export const EditorPanelHeader = memo(function EditorPanelHeader({
  title,
  actions,
  className,
}: {
  title: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2 shrink-0",
        "text-[11px] font-semibold uppercase tracking-wider",
        "text-[hsl(var(--editor-muted))]",
        className
      )}
      style={{ borderBottom: "1px solid hsl(var(--editor-border))" }}
    >
      <span>{title}</span>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  );
});

export const EditorPanelBody = memo(function EditorPanelBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto", className)}>
      {children}
    </div>
  );
});

export const EditorTabs = memo(function EditorTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("flex shrink-0", className)}
      style={{ borderBottom: "1px solid hsl(var(--editor-border))" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-testid={`editor-tab-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium",
            "transition-colors duration-150 relative",
            "border-b-2 -mb-[1px]",
            activeTab === tab.id
              ? "text-[hsl(var(--editor-accent))] border-[hsl(var(--editor-accent))]"
              : "text-[hsl(var(--editor-muted))] border-transparent hover:text-[hsl(var(--editor-text))]"
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
});

export const EditorSection = memo(function EditorSection({
  title,
  children,
  defaultOpen = true,
  className,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <div
      className={cn("", className)}
      style={{ borderBottom: "1px solid hsl(var(--editor-border))" }}
    >
      <button
        onClick={toggle}
        data-testid={`editor-section-${title.toLowerCase().replace(/\s+/g, "-")}`}
        className={cn(
          "flex items-center gap-1.5 w-full px-3 py-2 text-left",
          "text-[11px] font-semibold uppercase tracking-wider",
          "text-[hsl(var(--editor-muted))]",
          "transition-colors duration-150",
          "hover:text-[hsl(var(--editor-text))]"
        )}
      >
        {open ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
        {title}
      </button>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
});

export const EditorFieldRow = memo(function EditorFieldRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="text-[11px] font-medium text-[hsl(var(--editor-muted))]">
        {label}
      </label>
      {children}
    </div>
  );
});

export const EditorSearchInput = memo(function EditorSearchInput({
  placeholder = "Search...",
  value,
  onChange,
  className,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative px-3 py-2", className)}>
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--editor-muted))]" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        data-testid="editor-search-input"
        className="h-7 pl-7 text-xs bg-transparent border-[hsl(var(--editor-border))] focus:border-[hsl(var(--editor-accent))] rounded-md"
      />
    </div>
  );
});

export const EditorEmptyState = memo(function EditorEmptyState({
  icon,
  title,
  description,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-8 px-4 text-center",
        className
      )}
    >
      {icon && (
        <div className="text-[hsl(var(--editor-muted))]">{icon}</div>
      )}
      <p className="text-[12px] font-medium text-[hsl(var(--editor-muted))]">
        {title}
      </p>
      {description && (
        <p className="text-[11px] text-[hsl(var(--editor-muted))] opacity-70">
          {description}
        </p>
      )}
    </div>
  );
});

export const EditorIconButton = memo(function EditorIconButton({
  children,
  active,
  disabled,
  onClick,
  tooltip,
  "data-testid": testId,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  tooltip?: string;
  "data-testid"?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={disabled}
      onClick={onClick}
      title={tooltip}
      data-testid={testId}
      className={cn(
        "rounded-md transition-colors duration-150",
        active
          ? "bg-[hsl(var(--editor-accent)/0.12)] text-[hsl(var(--editor-accent))]"
          : "text-[hsl(var(--editor-muted))] hover:text-[hsl(var(--editor-text))]",
        disabled && "opacity-40"
      )}
    >
      {children}
    </Button>
  );
});
