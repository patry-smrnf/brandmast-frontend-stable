"use client"

import * as React from "react"

import { brandmastApi, fetchSampleStats } from "@/lib/api"
import type { SampleStatsCountsByField, TourPlannerActionListItem } from "@/lib/api"
import { getConfigState, setConfig } from "@/lib/config/configStore"
import { formatPlDateTimePoland, nowInPoland, toDateKeyInPoland } from "@/lib/dates/date-utils"

import {
  computeBrandmasterBonus,
  type BrandmasterBonusBreakdown,
} from "./brandmaster-bonus-utils"
import { computeBrandmasterPreviousMonthBonus } from "./brandmaster-previous-month-bonus-utils"
import {
  type ActionWithRoundedTime,
  computeEfficiencyHoursFromActions,
  formatCasAddress,
  formatHoursPl,
  getCasActionTitle,
  getMonthDateRange,
  getPreviousMonthDateRange,
  mapFinishedActionsWithRoundedTime,
  parseActionFallbackStart,
  resolveSampleStatsActionIdent,
  roundActionDurationHours,
} from "./cas-action-utils"

const HOURLY_RATE = 45

export type BrandmasterMonthPeriod = "current" | "previous"

export function useBrandmasterDashboard(monthPeriod: BrandmasterMonthPeriod = "current") {
  const [startedActions, setStartedActions] = React.useState<TourPlannerActionListItem[]>([])
  const [monthActions, setMonthActions] = React.useState<ActionWithRoundedTime[]>([])
  const [hasFetched, setHasFetched] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [tick, setTick] = React.useState(0)
  const [polandNow, setPolandNow] = React.useState<Date | null>(null)
  const [sampleStatsCounts, setSampleStatsCounts] =
    React.useState<SampleStatsCountsByField | null>(null)
  const [hostessCode, setHostessCode] = React.useState("")

  const refetch = React.useCallback(() => setTick((t) => t + 1), [])

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      setIsLoading(true)
      setError(null)

      try {
        const fetchNow = nowInPoland()
        const today = toDateKeyInPoland(fetchNow)
        const { since: monthSince, until: monthUntil } =
          monthPeriod === "previous"
            ? getPreviousMonthDateRange(fetchNow)
            : getMonthDateRange(fetchNow)

        const configPromise = brandmastApi.fetchConfig()

        const [startedActionResponse, monthActionsResponse] = await Promise.all([
          brandmastApi.fetchBMActions({
            since: today,
            until: today,
            status: "started",
          }),
          brandmastApi.fetchBMActions({
            since: monthSince,
            until: monthUntil,
            status: "finished",
          }),
        ])

        if (cancelled) return

        if (startedActionResponse.success === false) {
          setError(startedActionResponse.message ?? "Nie udało się pobrać akcji rozpoczetej")
          setPolandNow(null)
          setStartedActions([])
          setMonthActions([])
          setSampleStatsCounts(null)
          setHostessCode("")
          return
        }

        if (monthActionsResponse.success === false) {
          setError(monthActionsResponse.message ?? "Nie udało się pobrać akcji miesiąca.")
          setPolandNow(null)
          setStartedActions([])
          setMonthActions([])
          setSampleStatsCounts(null)
          setHostessCode("")
          return
        }

        const startedItems = startedActionResponse.data ?? []
        const finishedItems = monthActionsResponse.data ?? []
        const statsActionIdent = resolveSampleStatsActionIdent(startedItems, finishedItems)

        const configResponse = await configPromise
        if (cancelled) return

        if (configResponse.success && configResponse.data) {
          setConfig(configResponse.data)
        }

        const resolvedHostessCode =
          configResponse.data?.brandmasterData?.login?.trim() ??
          getConfigState().config?.brandmasterData?.login?.trim() ??
          ""

        let nextSampleStats: SampleStatsCountsByField | null = null
        if (resolvedHostessCode && statsActionIdent) {
          try {
            const sampleStats = await fetchSampleStats({
              hostessCode: resolvedHostessCode,
              currentAction: statsActionIdent,
            })
            nextSampleStats = sampleStats.counts
          } catch {
            nextSampleStats = null
          }
        }

        if (cancelled) return

        setPolandNow(nowInPoland())
        setStartedActions(startedItems)
        setMonthActions(mapFinishedActionsWithRoundedTime(finishedItems))
        setHostessCode(resolvedHostessCode)
        setSampleStatsCounts(nextSampleStats)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Nie udało się pobrać danych.")
        setPolandNow(null)
        setStartedActions([])
        setMonthActions([])
        setSampleStatsCounts(null)
        setHostessCode("")
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setHasFetched(true)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [tick, monthPeriod])

  const totalRoundedHours = React.useMemo(
    () => monthActions.reduce((sum, a) => sum + a.roundedHours, 0),
    [monthActions],
  )

  const efficiencyHours = React.useMemo(
    () => computeEfficiencyHoursFromActions(monthActions),
    [monthActions],
  )

  const basePayout = totalRoundedHours * HOURLY_RATE

  const bonusBreakdown = React.useMemo((): BrandmasterBonusBreakdown | null => {
    if (!sampleStatsCounts || totalRoundedHours <= 0) return null
    const monthStats =
      monthPeriod === "previous"
        ? sampleStatsCounts.lastMonth
        : sampleStatsCounts.currentMonth
    const input = {
      glo: monthStats.glo,
      veloNet: monthStats.veloNet,
      roundedHours: totalRoundedHours,
      gloEfficiencyHours: efficiencyHours.glo,
      veloEfficiencyHours: efficiencyHours.velo,
    }
    return monthPeriod === "previous"
      ? computeBrandmasterPreviousMonthBonus(input)
      : computeBrandmasterBonus(input)
  }, [sampleStatsCounts, totalRoundedHours, efficiencyHours, monthPeriod])

  const monthSalesStats = React.useMemo(() => {
    if (!sampleStatsCounts) return null
    return monthPeriod === "previous"
      ? sampleStatsCounts.lastMonth
      : sampleStatsCounts.currentMonth
  }, [sampleStatsCounts, monthPeriod])

  const predictedPayout = basePayout + (bonusBreakdown?.totalBonus ?? 0)

  const currentAction = startedActions[0] ?? null

  const currentActionTitle = React.useMemo(() => {
    if (!currentAction) return null
    return getCasActionTitle(currentAction)
  }, [currentAction])

  const currentActionStartLabel = React.useMemo(() => {
    if (!currentAction) return null
    const start = parseActionFallbackStart(currentAction)
    return start ? formatPlDateTimePoland(start) : "-"
  }, [currentAction])

  const currentActionRoundedHours = React.useMemo(() => {
    if (!currentAction || !polandNow) return null
    const start = parseActionFallbackStart(currentAction)
    if (!start) return null
    return roundActionDurationHours(start, polandNow)
  }, [currentAction, polandNow])

  const currentActionRoundedHoursLabel = React.useMemo(() => {
    if (currentActionRoundedHours == null) return null
    return formatHoursPl(currentActionRoundedHours)
  }, [currentActionRoundedHours])

  const currentActionPointLabel = React.useMemo(() => {
    if (!currentAction) return null
    const name = currentAction.point?.name?.trim()
    const address = formatCasAddress(currentAction.point?.address)
    if (name && address !== "-") return `${name} · ${address}`
    return name || address
  }, [currentAction])

  const currentActionStats = React.useMemo(() => {
    if (!currentAction || !sampleStatsCounts) return null
    return sampleStatsCounts.currentAction
  }, [currentAction, sampleStatsCounts])

  const isPageLoading = !hasFetched || isLoading
  const isRefreshing = hasFetched && isLoading

  return {
    isLoading: isPageLoading,
    isRefreshing,
    error,
    refetch,
    currentAction,
    currentActionTitle,
    currentActionStartLabel,
    currentActionRoundedHoursLabel,
    currentActionPointLabel,
    currentActionStats,
    monthActions,
    totalRoundedHours,
    basePayout,
    predictedPayout,
    bonusBreakdown,
    hourlyRate: HOURLY_RATE,
    sampleStatsCounts,
    monthSalesStats,
    hostessCode,
    monthPeriod,
  }
}
