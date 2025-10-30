import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" class={cn("animate-pulse rounded-md bg-accent", className)} {...props} />
}

export { Skeleton }
