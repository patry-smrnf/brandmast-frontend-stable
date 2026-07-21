"use client"

import * as React from "react"

import { brandmastApi, fetchSampleStats } from "@/lib/api"
import type { SampleStatsCountsByField, TourPlannerActionListItem } from "@/lib/api"
import { getConfigState, setConfig } from "@/lib/config/configStore"
import { formatPlDateTimePoland, nowInPoland, toDateKeyInPoland } from "@/lib/dates/date-utils"

import {
  addAwaryjneToGlo,
  computeAwaryjneCounts,
  EMPTY_AWARYJNE_COUNTS,
  sumAwaryjneGlo,
  type AwaryjneCounts,
} from "./brandmaster-awaryjne-utils"
import { parseMojstanItems, type MojstanDisplayItem } from "./brandmaster-mojstan-utils"
import {
  computeBrandmasterBonus,
  type BrandmasterBonusBreakdown,
} from "./brandmaster-bonus-utils"
import { computeBrandmasterPreviousMonthBonus } from "./brandmaster-previous-month-bonus-utils"
import {
  type ActionWithRoundedTime,
  computeEfficiencyHoursFromActions,
  computeHourlyPay,
  formatCasAddress,
  formatHoursPl,
  getActionDurationHours,
  getCasActionTitle,
  getMonthDateRange,
  getPreviousMonthDateRange,
  mapFinishedActionsWithRoundedTime,
  parseActionFallbackStart,
  resolveSampleStatsActionIdent,
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
  const [awaryjneCounts, setAwaryjneCounts] =
    React.useState<AwaryjneCounts>(EMPTY_AWARYJNE_COUNTS)
  const [hasOneTwoOne, setHasOneTwoOne] = React.useState(false)
  const [mojstanItems, setMojstanItems] = React.useState<MojstanDisplayItem[]>([])
  const [oneTwoOneLoading, setOneTwoOneLoading] = React.useState(false)
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
          setAwaryjneCounts(EMPTY_AWARYJNE_COUNTS)
          setHasOneTwoOne(false)
          setMojstanItems([])
          setOneTwoOneLoading(false)
          setHostessCode("")
          return
        }

        if (monthActionsResponse.success === false) {
          setError(monthActionsResponse.message ?? "Nie udało się pobrać akcji miesiąca.")
          setPolandNow(null)
          setStartedActions([])
          setMonthActions([])
          setSampleStatsCounts(null)
          setAwaryjneCounts(EMPTY_AWARYJNE_COUNTS)
          setHasOneTwoOne(false)
          setMojstanItems([])
          setOneTwoOneLoading(false)
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

        const configuredOneTwoOne = configResponse.data?.myData?.hasOneTwoOne === true

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
        setHasOneTwoOne(configuredOneTwoOne)

        void fetchOneTwoOneData(configuredOneTwoOne)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Nie udało się pobrać danych.")
        setPolandNow(null)
        setStartedActions([])
        setMonthActions([])
        setSampleStatsCounts(null)
        setAwaryjneCounts(EMPTY_AWARYJNE_COUNTS)
        setHasOneTwoOne(false)
        setMojstanItems([])
        setOneTwoOneLoading(false)
        setHostessCode("")
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setHasFetched(true)
        }
      }
    }

    async function fetchOneTwoOneData(configured: boolean) {
      if (cancelled) return

      if (!configured) {
        setAwaryjneCounts(EMPTY_AWARYJNE_COUNTS)
        setMojstanItems([])
        setOneTwoOneLoading(false)
        return
      }

      setOneTwoOneLoading(true)

      try {
        const [awaryjneResponse, mojstanResponse] = await Promise.all([
          brandmastApi.fetchZgloszeniaAwaryjne(),
          brandmastApi.fetchMojstan(),
        ])

        if (cancelled) return

        const awaryjneItems =
          awaryjneResponse.success === false ? [] : (awaryjneResponse.data ?? [])
        const mojstanRows =
          mojstanResponse.success === false ? [] : (mojstanResponse.data ?? [])

        setAwaryjneCounts(computeAwaryjneCounts(awaryjneItems))
        setMojstanItems(parseMojstanItems(mojstanRows))
      } catch {
        if (cancelled) return
        setAwaryjneCounts(EMPTY_AWARYJNE_COUNTS)
        setMojstanItems([])
      } finally {
        if (!cancelled) {
          setOneTwoOneLoading(false)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [tick, monthPeriod])

  const totalDurationHours = React.useMemo(
    () => monthActions.reduce((sum, a) => sum + a.durationHours, 0),
    [monthActions],
  )

  const totalBaseHours = React.useMemo(
    () => monthActions.reduce((sum, a) => sum + a.baseHours, 0),
    [monthActions],
  )

  const totalRemainderMinutes = React.useMemo(
    () => monthActions.reduce((sum, a) => sum + a.remainderMinutes, 0),
    [monthActions],
  )

  const efficiencyHours = React.useMemo(
    () => computeEfficiencyHoursFromActions(monthActions),
    [monthActions],
  )

  const basePayout = computeHourlyPay(totalBaseHours * 60, HOURLY_RATE)
  const hourlyTourPayout = computeHourlyPay(totalRemainderMinutes, HOURLY_RATE)

  const bonusBreakdown = React.useMemo((): BrandmasterBonusBreakdown | null => {
    if (!sampleStatsCounts || totalDurationHours <= 0) return null
    const monthStats =
      monthPeriod === "previous"
        ? sampleStatsCounts.lastMonth
        : sampleStatsCounts.currentMonth
    const input = {
      glo: addAwaryjneToGlo(monthStats.glo, awaryjneCounts),
      veloNet: monthStats.veloNet + awaryjneCounts.velo,
      durationHours: totalDurationHours,
      gloEfficiencyHours: efficiencyHours.glo,
      veloEfficiencyHours: efficiencyHours.velo,
    }
    return monthPeriod === "previous"
      ? computeBrandmasterPreviousMonthBonus(input)
      : computeBrandmasterBonus(input)
  }, [sampleStatsCounts, awaryjneCounts, totalDurationHours, efficiencyHours, monthPeriod])

  const monthSalesStats = React.useMemo(() => {
    if (!sampleStatsCounts) return null
    return monthPeriod === "previous"
      ? sampleStatsCounts.lastMonth
      : sampleStatsCounts.currentMonth
  }, [sampleStatsCounts, monthPeriod])

  const awaryjneSummary = React.useMemo(
    () => ({
      glo: sumAwaryjneGlo(awaryjneCounts),
      velo: awaryjneCounts.velo,
    }),
    [awaryjneCounts],
  )

  const predictedPayout =
    basePayout + hourlyTourPayout + (bonusBreakdown?.totalBonus ?? 0)

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

  const currentActionDurationHours = React.useMemo(() => {
    if (!currentAction || !polandNow) return null
    const start = parseActionFallbackStart(currentAction)
    if (!start) return null
    return getActionDurationHours(start, polandNow)
  }, [currentAction, polandNow])

  const currentActionRoundedHoursLabel = React.useMemo(() => {
    if (currentActionDurationHours == null) return null
    return formatHoursPl(currentActionDurationHours)
  }, [currentActionDurationHours])

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
    totalDurationHours,
    totalBaseHours,
    totalRemainderMinutes,
    basePayout,
    hourlyTourPayout,
    predictedPayout,
    bonusBreakdown,
    hourlyRate: HOURLY_RATE,
    sampleStatsCounts,
    monthSalesStats,
    awaryjneCounts,
    awaryjneSummary,
    hasOneTwoOne,
    mojstanItems,
    oneTwoOneLoading,
    hostessCode,
    monthPeriod,
  }
}
