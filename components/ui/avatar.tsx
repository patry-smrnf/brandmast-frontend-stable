import * as React from "react"
import Image, { type ImageProps } from "next/image"

import { cn } from "@/lib/utils"

function Avatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex size-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  sizes = "36px",
  alt,
  ...props
}: Omit<ImageProps, "fill"> & { className?: string }) {
  return (
    <Image
      data-slot="avatar-image"
      fill
      sizes={sizes}
      alt={alt}
      className={cn("object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center bg-muted text-xs font-semibold text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarFallback, AvatarImage }

