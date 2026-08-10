import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { bmCardClass, bmMetricTileClass } from "./brandmaster-ui"

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />
}

export function BrandmasterPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Ładowanie podsumowania…</span>

      <header className="min-w-0 space-y-2 pr-11">
        <SkeletonBar className="h-3 w-16" />
        <SkeletonBar className="h-8 w-44 sm:h-9 sm:w-52" />
        <div className="flex items-baseline gap-2.5">
          <SkeletonBar className="h-9 w-11 sm:h-10 sm:w-12" />
          <SkeletonBar className="h-4 w-36 sm:w-40" />
        </div>
      </header>

      <SkeletonBar className="h-11 w-full rounded-2xl" />
      <SkeletonBar className="h-9 w-36 rounded-xl" />

      <div className="space-y-3.5">
        <Card className={cn(bmCardClass, "bg-linear-to-br from-primary/10 via-card to-card")}>
          <CardHeader className="space-y-2 px-4 py-3.5 sm:px-5">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="h-4 w-4/5 max-w-[240px]" />
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4 sm:px-5 sm:pb-5">
            <SkeletonBar className="h-4 w-36" />
            <SkeletonBar className="h-4 w-full max-w-[280px]" />
          </CardContent>
        </Card>

        <Card className={cn(bmCardClass, "ring-0")}>
          <div className="rounded-2xl bg-linear-to-br from-primary/20 via-primary/5 to-card px-4 py-4 sm:px-5">
            <SkeletonBar className="h-4 w-40" />
            <SkeletonBar className="mt-2 h-3 w-52" />
            <SkeletonBar className="mt-4 h-9 w-40" />
            <SkeletonBar className="mt-3 h-3 w-48" />
            <SkeletonBar className="mt-2 h-3 w-36" />
          </div>
        </Card>

        <Card className={bmCardClass}>
          <CardHeader className="space-y-2 px-4 py-3.5 sm:px-5">
            <SkeletonBar className="h-4 w-28" />
            <SkeletonBar className="h-3 w-40" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2.5 px-4 pb-4 sm:px-5 sm:pb-5">
            <div className={cn("h-24 animate-pulse", bmMetricTileClass)} />
            <div className={cn("h-24 animate-pulse", bmMetricTileClass)} />
          </CardContent>
        </Card>

        <Card className={bmCardClass}>
          <CardHeader className="space-y-2 px-4 py-3.5 sm:px-5">
            <SkeletonBar className="h-4 w-20" />
            <SkeletonBar className="h-3 w-36" />
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 px-4 pb-4 sm:px-5 sm:pb-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn("h-20 animate-pulse", bmMetricTileClass)} />
            ))}
          </CardContent>
        </Card>

        <Card className={bmCardClass}>
          <CardHeader className="space-y-2 px-4 py-3.5 sm:px-5">
            <SkeletonBar className="h-4 w-24" />
            <SkeletonBar className="h-3 w-28" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 px-4 pb-4 sm:px-5 sm:pb-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn("h-12 animate-pulse", bmMetricTileClass)} />
            ))}
          </CardContent>
        </Card>

        <Card className={bmCardClass}>
          <CardHeader className="space-y-2 px-4 py-3.5 sm:px-5">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2">
                <SkeletonBar className="h-4 w-28" />
                <SkeletonBar className="h-3 w-40" />
              </div>
              <SkeletonBar className="h-6 w-14" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
            <SkeletonBar className="h-3 w-full max-w-[260px]" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
