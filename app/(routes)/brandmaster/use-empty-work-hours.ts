"use client"

import * as React from "react"

import { fetchSampleStats } from "@/lib/api"
import type { SampleStatsFieldCounts } from "@/lib/api"

import {
  type ActionWithRoundedTime,
  getActionDurationHours,
  getActionRowKey,
  isEmptyActionSampleStats,
  isExcludedFromEmptyHoursCalculation,
} from "./cas-action-utils"

const STATS_FETCH_CONCURRENCY = 3

type EmptyWorkHoursState = {
  calculated: boolean
  loading: boolean
  error: string | null
  emptyActionKeys: ReadonlySet<string>
  statsByActionKey: ReadonlyMap<string, SampleStatsFieldCounts>
  rawHours: number
  roundedHours: number
  failedCount: number
}

const INITIAL_STATE: EmptyWorkHoursState = {
  calculated: false,
  loading: false,
  error: null,
  emptyActionKeys: new Set(),
  statsByActionKey: new Map(),
  rawHours: 0,
  roundedHours: 0,
  failedCount: 0,
}

async function runWithConcurrencyLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
  isCancelled: () => boolean,
): Promise<T[]> {
  if (tasks.length === 0) return []

  const results: T[] = new Array(tasks.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      if (isCancelled()) return
      const index = nextIndex
      nextIndex += 1
      if (index >= tasks.length) return
      results[index] = await tasks[index]!()
    }
  }

  const workerCount = Math.min(limit, tasks.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return results
}

export function useEmptyWorkHours(
  actions: ActionWithRoundedTime[],
  hostessCode: string,
) {
  const [state, setState] = React.useState<EmptyWorkHoursState>(INITIAL_STATE)
  const requestRef = React.useRef(0)

  const reset = React.useCallback(() => {
    requestRef.current += 1
    setState(INITIAL_STATE)
  }, [])

  const calculate = React.useCallback(() => {
    if (state.calculated || state.loading) return

    if (!hostessCode.trim()) {
      setState((prev) => ({
        ...prev,
        error: "Brak loginu hostessy w konfiguracji.",
      }))
      return
    }

    const actionable = actions.filter((item) => item.actionIdent?.trim())
    if (actionable.length === 0) {
      setState((prev) => ({
        ...prev,
        calculated: true,
        error: actions.length > 0 ? "Brak identyfikatorów akcji do sprawdzenia." : null,
      }))
      return
    }

    const requestId = ++requestRef.current
    setState((prev) => ({ ...prev, loading: true, error: null }))

    void (async () => {
      try {
        const tasks = actionable.map((item) => async () => {
          const ident = item.actionIdent!.trim()
          const rowKey = getActionRowKey(item)
          try {
            const result = await fetchSampleStats({
              hostessCode,
              currentAction: ident,
            })
            return {
              item,
              rowKey,
              stats: result.counts.currentAction,
              failed: false as const,
            }
          } catch {
            return {
              item,
              rowKey,
              stats: null,
              failed: true as const,
            }
          }
        })

        const rows = await runWithConcurrencyLimit(
          tasks,
          STATS_FETCH_CONCURRENCY,
          () => requestRef.current !== requestId,
        )

        if (requestRef.current !== requestId) return

        const emptyActionKeys = new Set<string>()
        const statsByActionKey = new Map<string, SampleStatsFieldCounts>()
        let rawHours = 0
        let roundedHours = 0
        let failedCount = 0

        for (const row of rows) {
          if (row.failed || !row.stats) {
            failedCount += 1
            continue
          }

          statsByActionKey.set(row.rowKey, row.stats)

          if (!isEmptyActionSampleStats(row.stats)) continue
          if (isExcludedFromEmptyHoursCalculation(row.item)) continue

          emptyActionKeys.add(row.rowKey)
          if (row.item.start && row.item.stop) {
            rawHours += getActionDurationHours(row.item.start, row.item.stop)
          }
          roundedHours += row.item.roundedHours
        }

        setState({
          calculated: true,
          loading: false,
          error:
            failedCount > 0
              ? `Nie udało się sprawdzić ${failedCount} ${
                  failedCount === 1 ? "akcji" : "akcji"
                }. Pozostałe policzone.`
              : null,
          emptyActionKeys,
          statsByActionKey,
          rawHours,
          roundedHours,
          failedCount,
        })
      } catch {
        if (requestRef.current !== requestId) return
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Nie udało się policzyć pustych godzin.",
        }))
      }
    })()
  }, [actions, hostessCode, state.calculated, state.loading])

  return {
    ...state,
    calculate,
    reset,
  }
}
