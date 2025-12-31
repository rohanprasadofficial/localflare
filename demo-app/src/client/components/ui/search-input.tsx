import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  showShortcut?: boolean
  className?: string
}

export function SearchInput({
  value,
  onChange,
  onClear,
  showShortcut = false,
  placeholder = "Search...",
  className,
  ...props
}: SearchInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onChange("")
    onClear?.()
    inputRef.current?.focus()
  }

  React.useEffect(() => {
    if (!showShortcut) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [showShortcut])

  return (
    <div className={cn("relative", className)}>
      <HugeiconsIcon
        icon={Search01Icon}
        className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
        strokeWidth={2}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-9 pl-9 pr-9 text-sm bg-background border border-input rounded-md",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
          "transition-colors"
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
        </button>
      ) : showShortcut ? (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
          {navigator.platform.includes("Mac") ? "⌘K" : "Ctrl+K"}
        </kbd>
      ) : null}
    </div>
  )
}
