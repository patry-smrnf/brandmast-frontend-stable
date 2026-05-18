import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />
}

export function BrandmasterPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Ładowanie podsumowania…</span>

      <header className="min-w-0 space-y-2 pr-11">
        <SkeletonBar className="h-3 w-16" />
        <SkeletonBar className="h-6 w-36 sm:h-7 sm:w-40" />
        <div className="flex items-baseline gap-2.5">
          <SkeletonBar className="h-9 w-11 sm:h-10 sm:w-12" />
          <SkeletonBar className="h-4 w-32 sm:w-36" />
        </div>
      </header>

      <Separator className="my-0" />

      <SkeletonBar className="h-8 w-[7.5rem] rounded-md" />

      <div className="space-y-3">
        <Card className="border-primary/20 bg-muted/15 shadow-sm">
          <CardHeader className="space-y-2 px-3.5 py-3 pb-2 sm:px-4">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="h-4 w-4/5 max-w-[240px]" />
          </CardHeader>
          <CardContent className="space-y-2 px-3.5 pb-3.5 sm:px-4 sm:pb-4">
            <div className="flex justify-between gap-3">
              <SkeletonBar className="h-4 w-36" />
              <SkeletonBar className="h-4 w-10" />
            </div>
            <SkeletonBar className="h-4 w-full max-w-[280px]" />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="space-y-2 px-3.5 py-3 pb-0 sm:px-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBar className="h-4 w-40" />
                <SkeletonBar className="h-3 w-52" />
              </div>
              <SkeletonBar className="size-4 shrink-0 rounded-sm" />
            </div>
            <SkeletonBar className="h-8 w-36" />
            <SkeletonBar className="h-3 w-44" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3 pt-2 sm:px-4">
            <SkeletonBar className="h-3 w-full max-w-[220px]" />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="space-y-2 px-3.5 py-3 pb-2 sm:px-4">
            <SkeletonBar className="h-4 w-28" />
            <SkeletonBar className="h-3 w-40" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3.5 sm:px-4 sm:pb-4">
            <div className="grid grid-cols-2 gap-2">
              <SkeletonBar className="h-[72px] rounded-lg" />
              <SkeletonBar className="h-[72px] rounded-lg" />
            </div>
            <SkeletonBar className="mt-2.5 h-3 w-full max-w-[260px]" />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="space-y-2 px-3.5 py-3 pb-2 sm:px-4">
            <SkeletonBar className="h-4 w-20" />
            <SkeletonBar className="h-3 w-44" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3.5 sm:px-4 sm:pb-4">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonBar key={i} className="h-14 rounded-lg sm:h-16" />
              ))}
            </div>
            <SkeletonBar className="mx-auto mt-2.5 h-3 w-16" />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="px-3.5 py-3 pb-2 sm:px-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBar className="h-4 w-24" />
                <SkeletonBar className="h-3 w-36" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonBar className="h-6 w-12" />
                <SkeletonBar className="size-4 rounded-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 border-t border-border/80 px-3.5 pb-3.5 pt-2 sm:px-4 sm:pb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/60 bg-muted/25 px-3 py-2.5"
              >
                <div className="flex justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <SkeletonBar className="h-3.5 w-4/5 max-w-[200px]" />
                    <SkeletonBar className="h-3 w-24" />
                    <SkeletonBar className="h-3 w-full max-w-[180px]" />
                  </div>
                  <SkeletonBar className="h-4 w-9 shrink-0" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
