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
  CompassIcon,
  DockIcon,
  FileSpreadsheetIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { clearAuthCookies, roleStore, tokenStore, type UserRole } from "@/lib/api"
import { useConfigState } from "@/lib/config/configStore"

type MenuItem = {
  key: string
  label: string
  href?: string
  disabled?: boolean
  icon?: React.ReactNode
  onSelect?: () => void
}

const ROLE_CHANGED_EVENT = "brandmast:role-changed"

function subscribeRoleChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}

  function onStorage(e: StorageEvent) {
    if (e.key === "brandmast.role") onStoreChange()
  }
  function onLocalRoleChanged() {
    onStoreChange()
  }

  window.addEventListener("storage", onStorage)
  window.addEventListener(ROLE_CHANGED_EVENT, onLocalRoleChanged)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(ROLE_CHANGED_EVENT, onLocalRoleChanged)
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

  const isAddingAllowed = config?.actionsConfig?.isAddingAllowed
  const isEditorDisabled = isAddingAllowed === false
  const is121SamplingDisabled = config?.myData?.hasOneTwoOne === false

  const logoutItem: MenuItem = {
    key: "logout",
    label: "Wyloguj",
    icon: <LogOutIcon className="size-4" />,
    onSelect: () => {
      tokenStore.clear()
      roleStore.clear()
      clearAuthCookies()
      if (typeof window !== "undefined") window.dispatchEvent(new Event(ROLE_CHANGED_EVENT))
      router.push("/login")
    },
  }

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
    logoutItem,
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
    logoutItem,
  ]

  const adminItems: MenuItem[] = [
    {
      key: "admin-home",
      label: "Panel",
      href: "/admin",
      icon: <ShieldIcon className="size-4" />,
    },
    {
      key: "admin-discover",
      label: "Discover",
      href: "/admin/discover",
      icon: <CompassIcon className="size-4" />,
    },
    { key: "sep-1", label: "-" },
    logoutItem,
  ]

  const items: MenuItem[] =
    role === "brandmaster"
      ? brandmasterItems
      : role === "admin"
        ? adminItems
        : supervisorItems

  const roleLabel =
    role === "brandmaster" ? "Brandmaster" : role === "admin" ? "Admin" : "Supervisor"

  React.useEffect(() => {
    if (!open) return
    // Don't attach global listeners when the menu isn't even rendered.
    if (!role) return
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
  }, [open, pathname, role])

  // Hide on public pages (and when role isn't known yet).
  // Important: keep SSR/CSR markup identical (avoid hydration mismatch).
  if (!mounted) return null
  if (!role) return null
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
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
        >
          <div className="px-3 py-2 text-xs text-muted-foreground">
            {roleLabel}
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
