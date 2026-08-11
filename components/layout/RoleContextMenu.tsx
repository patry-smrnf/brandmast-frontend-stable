"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  LogOutIcon,
  MoreVerticalIcon,
  SettingsIcon,
  ShieldIcon,
  StoreIcon,
  UserIcon,
  UsersIcon,
  CalendarRangeIcon,
  ClipboardListIcon,
  DockIcon,
  FileSpreadsheetIcon,
  PlusIcon,
  SparklesIcon,
  LogInIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  AUTH_CHANGED_EVENT,
  clearSessionAndRedirectToLogin,
  roleStore,
  type UserRole,
} from "@/lib/api"
import { useConfigState } from "@/lib/config/configStore"

type MenuItem = {
  key: string
  label: string
  href?: string
  disabled?: boolean
  icon?: React.ReactNode
  onSelect?: () => void
}

function subscribeRoleChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}

  function onStorage(e: StorageEvent) {
    if (e.key === "brandmast.role" || e.key === "brandmast.token") onStoreChange()
  }
  function onLocalAuthChanged() {
    onStoreChange()
  }

  window.addEventListener("storage", onStorage)
  window.addEventListener(AUTH_CHANGED_EVENT, onLocalAuthChanged)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(AUTH_CHANGED_EVENT, onLocalAuthChanged)
  }
}

function getRoleSnapshot(): UserRole | null {
  return roleStore.get()
}

function getRoleServerSnapshot(): UserRole | null {
  return null
}

function useUserRole() {
  return React.useSyncExternalStore(subscribeRoleChanges, getRoleSnapshot, getRoleServerSnapshot)
}

function subscribeNoop() {
  return () => {}
}

function getClientMountedSnapshot() {
  return true
}

function getClientMountedServerSnapshot() {
  return false
}

function roleFromPathname(pathname: string): UserRole | null {
  if (pathname === "/supervisor" || pathname.startsWith("/supervisor/")) return "supervisor"
  if (pathname === "/brandmaster" || pathname.startsWith("/brandmaster/")) return "brandmaster"
  return null
}

function logout() {
  clearSessionAndRedirectToLogin()
}

export function RoleContextMenu() {
  const router = useRouter()
  const pathname = usePathname()
  const role = useUserRole()
  const { config } = useConfigState()

  const mounted = React.useSyncExternalStore(
    subscribeNoop,
    getClientMountedSnapshot,
    getClientMountedServerSnapshot,
  )
  const [open, setOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)
  const popoverRef = React.useRef<HTMLDivElement | null>(null)

  const effectiveRole = role ?? roleFromPathname(pathname)

  const isAddingAllowed = config?.actionsConfig?.isAddingAllowed
  const isEditorDisabled = isAddingAllowed === false
  const is121SamplingDisabled = config?.myData?.hasOneTwoOne === false
  const isCasPanelDisabled = config?.accessConfig?.isCasConnected === false

  const brandmasterItems: MenuItem[] = [
    {
      key: "bm-home",
      label: "Home",
      href: "/brandmaster",
      icon: <UserIcon className="size-4" />,
    },
    {
      key: "bm-actions",
      label: "Akcje",
      href: "/brandmaster/actions",
      icon: <DockIcon className="size-4" />,
    },
    {
      key: "bm-nowosci",
      label: "Nowości",
      href: "/brandmaster/nowosci",
      icon: <SparklesIcon className="size-4" />,
    },
    {
      key: "bm-settings",
      label: "Ustawienia",
      href: "/brandmaster/settings",
      icon: <SettingsIcon className="size-4" />,
    },
    {
      key: "bm-editor",
      label: "Dodaj akcje",
      href: "/brandmaster/editor",
      disabled: isEditorDisabled,
      icon: <PlusIcon className="size-4" />,
    },
    {
      key: "bm-121-sampling",
      label: "121 Sampling",
      href: "/brandmaster/121Sampling",
      disabled: is121SamplingDisabled,
      icon: <ClipboardListIcon className="size-4" />,
    },
    {
      key: "bm-121-aplikacje",
      label: "121 Paczka za apke",
      href: "/brandmaster/121Aplikacje",
      disabled: is121SamplingDisabled,
      icon: <ClipboardListIcon className="size-4" />,
    },
    {
      key: "bm-121-myglo-kody",
      label: "121 Myglo Kody",
      href: "/brandmaster/121MygloKody",
      disabled: is121SamplingDisabled,
      icon: <ClipboardListIcon className="size-4" />,
    },
    { key: "sep-1", label: "-" },
    {
      key: "logout",
      label: "Wyloguj",
      icon: <LogOutIcon className="size-4" />,
      onSelect: logout,
    },
  ]

  const supervisorItems: MenuItem[] = [
    {
      key: "sv-home",
      label: "Dashboard",
      href: "/supervisor",
      icon: <ShieldIcon className="size-4" />,
    },
    {
      key: "sv-shops",
      label: "Sklepy",
      href: "/supervisor/shops",
      icon: <StoreIcon className="size-4" />,
    },
    {
      key: "sv-brandmasters",
      label: "Brandmasterzy",
      href: "/supervisor/brandmasters",
      icon: <UsersIcon className="size-4" />,
    },
    {
      key: "sv-cas-panel",
      label: "Panel CAS",
      href: "/supervisor/casPanel",
      disabled: isCasPanelDisabled,
      icon: <ClipboardListIcon className="size-4" />,
    },
    {
      key: "sv-planner-akcji",
      label: "Planner Akcji",
      href: "/supervisor/planner-akcji",
      icon: <CalendarRangeIcon className="size-4" />,
    },
    {
      key: "sv-excel",
      label: "Eksport Excel",
      href: "/supervisor/excel",
      icon: <FileSpreadsheetIcon className="size-4" />,
    },
    {
      key: "sv-nowosci",
      label: "Nowości",
      href: "/supervisor/nowosci",
      icon: <SparklesIcon className="size-4" />,
    },
    {
      key: "sv-settings",
      label: "Ustawienia",
      href: "/supervisor/settings",
      icon: <SettingsIcon className="size-4" />,
    },
    { key: "sep-1", label: "-" },
    {
      key: "logout",
      label: "Wyloguj",
      icon: <LogOutIcon className="size-4" />,
      onSelect: logout,
    },
  ]

  // Stale cookies block /login in proxy — always clear session before re-auth.
  const guestItems: MenuItem[] = [
    {
      key: "login",
      label: "Zaloguj ponownie",
      icon: <LogInIcon className="size-4" />,
      onSelect: logout,
    },
  ]

  const items: MenuItem[] =
    effectiveRole === "brandmaster"
      ? brandmasterItems
      : effectiveRole === "supervisor"
        ? supervisorItems
        : guestItems

  React.useEffect(() => {
    if (!open) return
    if (pathname === "/login" || pathname === "/no-access") return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null
      if (!target) return
      if (buttonRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpen(false)
    }

    const pointerOpts: AddEventListenerOptions = { capture: true }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("pointerdown", onPointerDown, pointerOpts)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("pointerdown", onPointerDown, pointerOpts)
    }
  }, [open, pathname])

  // Hide only on public pages. Keep a guest escape hatch when role is unknown
  // (cookie/localStorage desync) so the user can always clear session / log in.
  if (!mounted) return null
  if (pathname === "/login" || pathname === "/no-access") return null

  function onSelect(item: MenuItem) {
    if (item.disabled) return
    if (item.onSelect) {
      item.onSelect()
      setOpen(false)
      return
    }
    if (item.href) {
      router.push(item.href)
      setOpen(false)
    }
  }

  return (
    <div className="fixed right-3 top-3 z-50">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon-sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title="Menu"
      >
        <MoreVerticalIcon className="size-4" />
      </Button>

      {open ? (
        <div
          ref={popoverRef}
          role="menu"
          aria-label="Menu kontekstowe"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg"
        >
          <div className="px-3 py-2 text-xs text-muted-foreground">
            {effectiveRole === "brandmaster"
              ? "Brandmaster"
              : effectiveRole === "supervisor"
                ? "Supervisor"
                : "Sesja"}
          </div>
          <div className="h-px bg-border" />
          <div className="py-1">
            {items.map((item) => {
              if (item.label === "-") {
                return <div key={item.key} className="my-1 h-px bg-border" />
              }
              return (
                <button
                  key={item.key}
                  role="menuitem"
                  type="button"
                  disabled={!!item.disabled}
                  onClick={() => onSelect(item)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                    "hover:bg-muted focus-visible:bg-muted outline-none",
                    item.disabled ? "cursor-not-allowed opacity-50 hover:bg-transparent" : "",
                  )}
                >
                  {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {(item.key === "bm-editor" ||
                    item.key === "bm-121-sampling" ||
                    item.key === "bm-121-aplikacje" ||
                    item.key === "bm-121-myglo-kody") &&
                  item.disabled ? (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      disabled
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
