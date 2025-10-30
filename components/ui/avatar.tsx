"use client"

import * as AvatarPrimitive from "@radix-ui/react-avatar"
import type * as React from "react"

import { cn } from "@/lib/utils"

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      class={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image data-slot="avatar-image" class={cn("aspect-square size-full", className)} {...props} />
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      class={cn("flex size-full items-center justify-center rounded-full bg-muted", className)}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
