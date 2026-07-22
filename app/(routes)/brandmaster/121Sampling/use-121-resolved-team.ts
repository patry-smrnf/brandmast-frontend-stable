"use client"

import * as React from "react"

import { brandmastApi, getApiErrorMessage, type OneTwoOneTeam, type SettingResponse } from "@/lib/api"
import { getConfigState, setConfig, useConfigState } from "@/lib/config/configStore"

import { resolveUserTeamFromConfig, type Resolved121Team } from "./121-sampling-utils"

export type Resolved121TeamContext = Resolved121Team & {
  teams: OneTwoOneTeam[]
  config: SettingResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function use121ResolvedTeam(): Resolved121TeamContext {
  const { config: storeConfig } = useConfigState()
  const [teams, setTeams] = React.useState<OneTwoOneTeam[]>([])
  const [config, setLocalConfig] = React.useState<SettingResponse | null>(storeConfig)
  const [resolved, setResolved] = React.useState<Resolved121Team>({
    teamId: null,
    teamName: null,
    territoryIdent: null,
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [refetchTick, setRefetchTick] = React.useState(0)

  React.useEffect(() => {
    if (storeConfig) setLocalConfig(storeConfig)
  }, [storeConfig])

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      setIsLoading(true)
      setError(null)

      try {
        const [configRes, teamsRes] = await Promise.all([
          brandmastApi.fetchConfig(),
          brandmastApi.fetchTeam(),
        ])

        if (cancelled) return

        if (teamsRes.success === false) {
          setError(teamsRes.message ?? "Nie udało się pobrać zespołów.")
          setTeams([])
          setResolved({ teamId: null, teamName: null, territoryIdent: null })
          return
        }

        const nextTeams = teamsRes.data ?? []
        let nextConfig: SettingResponse | null = getConfigState().config ?? storeConfig

        if (configRes.success === false) {
          setError(configRes.message ?? "Nie udało się pobrać konfiguracji.")
        } else if (configRes.data) {
          nextConfig = configRes.data
          setLocalConfig(nextConfig)
          setConfig(nextConfig)
        }

        const nextResolved = resolveUserTeamFromConfig(nextTeams, nextConfig)
        setTeams(nextTeams)
        setResolved(nextResolved)

        if (
          configRes.success !== false &&
          nextResolved.teamId == null &&
          nextResolved.territoryIdent
        ) {
          setError(
            `Nie znaleziono zespołu dla „${nextResolved.territoryIdent}” na liście regionów.`,
          )
        }
      } catch (e) {
        if (cancelled) return
        setError(getApiErrorMessage(e, "Nie udało się dopasować zespołu."))
        setTeams([])
        setResolved({ teamId: null, teamName: null, territoryIdent: null })
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [refetchTick])

  const refetch = React.useCallback(() => setRefetchTick((t) => t + 1), [])

  return {
    teams,
    config,
    teamId: resolved.teamId,
    teamName: resolved.teamName,
    territoryIdent: resolved.territoryIdent,
    isLoading,
    error,
    refetch,
  }
}
