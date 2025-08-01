import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <div className="glass-border rounded-md">
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-foreground focus:placeholder-transparent focus:text-shadow-none selection:bg-primary selection:text-primary-foreground dark:bg-input/30 w-full min-w-0 rounded-md bg-transparent shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "h-9 px-3 py-1 text-base md:text-sm",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...props}
        />
      </div>
  )
}

export { Input }