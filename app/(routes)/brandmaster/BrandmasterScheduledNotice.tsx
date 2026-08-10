"use client"

import * as React from "react"
import { InfoIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { isNowWithinPolandSchedule } from "@/lib/dates/date-utils"

import { BRANDMASTER_SCHEDULED_NOTICE } from "./brandmaster-scheduled-notice-config"

function useScheduledNoticeVisible() {
  const [inSchedule, setInSchedule] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    const update = () =>
      setInSchedule(isNowWithinPolandSchedule(BRANDMASTER_SCHEDULED_NOTICE.windows))
    update()
    const id = window.setInterval(update, 60_000)
    return () => window.clearInterval(id)
  }, [])

  const dismiss = React.useCallback(() => setDismissed(true), [])

  return {
    visible: inSchedule && !dismissed,
    dismiss,
  }
}

export function BrandmasterScheduledNotice() {
  const { visible, dismiss } = useScheduledNoticeVisible()
  if (!visible) return null

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-500/45 bg-amber-500/10 px-3.5 py-3 text-sm text-foreground shadow-sm"
    >
      <InfoIcon className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
      <span className="min-w-0 flex-1 leading-snug">{BRANDMASTER_SCHEDULED_NOTICE.message}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 -mr-1 text-muted-foreground hover:text-foreground"
        aria-label="Zamknij powiadomienie"
        onClick={dismiss}
      >
        <XIcon className="size-4" aria-hidden />
      </Button>
    </div>
  )
}
