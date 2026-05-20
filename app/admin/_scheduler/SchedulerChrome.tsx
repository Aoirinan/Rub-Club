"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { staffRoleLabel } from "@/lib/staff-roles";

const btnPrimary =
  "rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700";
const btnSecondary =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50";
const btnGhost =
  "rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900";

function MenuDropdown({
  label,
  align = "right",
  children,
}: {
  label: string;
  align?: "left" | "right";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${btnSecondary} inline-flex items-center gap-1`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
        <span className="text-slate-400" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute z-50 mt-1 min-w-[11rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </Link>
  );
}

export type SchedulerMode = "bodywork" | "chiropractic";

export type SchedulerHeaderProps = {
  mode: SchedulerMode;
  email?: string | null;
  roleLabel?: string | null;
  deskWrite: boolean;
  operations: boolean;
  loading: boolean;
  onOpenChiroWindow?: () => void;
  patientCsvImportBusy: boolean;
  csvImportBusy: boolean;
  csvImportSkipConflict: boolean;
  onCsvImportSkipConflictChange: (value: boolean) => void;
  onNewAppointment: () => void;
  onBlockTime: () => void;
  onSendReminders: () => void;
  onPatientLookup: () => void;
  onExportPatients: () => void;
  onImportPatients: () => void;
  onExportAppointments: () => void;
  onImportAppointmentsClick: () => void;
  onRefresh: () => void;
  onSignOut: () => void;
};

const modeTitles: Record<SchedulerMode, string> = {
  bodywork: "Massage & stretch",
  chiropractic: "Chiropractic",
};

export function SchedulerHeader({
  mode,
  email,
  roleLabel,
  deskWrite,
  operations,
  loading,
  onOpenChiroWindow,
  patientCsvImportBusy,
  csvImportBusy,
  csvImportSkipConflict,
  onCsvImportSkipConflictChange,
  onNewAppointment,
  onBlockTime,
  onSendReminders,
  onPatientLookup,
  onExportPatients,
  onImportPatients,
  onExportAppointments,
  onImportAppointmentsClick,
  onRefresh,
  onSignOut,
}: SchedulerHeaderProps) {
  const isChiroWindow = mode === "chiropractic";
  const hasNav = !isChiroWindow && (deskWrite || operations);
  const hasDataMenu = !isChiroWindow && operations;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className={`mx-auto px-4 py-3 ${isChiroWindow ? "max-w-[100rem]" : "max-w-7xl"}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900">{modeTitles[mode]}</h1>
            <p className="truncate text-xs text-slate-500">
              {isChiroWindow ? "Second-screen schedule · drag this window to another monitor" : "Desk scheduler"}
              {email ? ` · ${email}` : ""}
              {roleLabel ? ` · ${roleLabel}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {deskWrite ? (
              <button type="button" onClick={onNewAppointment} className={btnPrimary}>
                + New appointment
              </button>
            ) : null}
            {operations ? (
              <button type="button" onClick={onBlockTime} className={btnSecondary}>
                Block time
              </button>
            ) : null}
            {!isChiroWindow && operations ? (
              <button type="button" onClick={onSendReminders} className={btnSecondary}>
                Send reminders
              </button>
            ) : null}
            {!isChiroWindow && deskWrite ? (
              <button type="button" onClick={onPatientLookup} className={btnSecondary}>
                Patient lookup
              </button>
            ) : null}
            {!isChiroWindow && onOpenChiroWindow ? (
              <button type="button" onClick={onOpenChiroWindow} className={btnSecondary} title="Opens chiropractic day view for a second monitor">
                Open chiro screen
              </button>
            ) : null}
            {isChiroWindow ? (
              <Link href="/admin" className={btnSecondary} target="_blank" rel="noopener">
                Massage &amp; stretch board
              </Link>
            ) : null}
          </div>
        </div>

        {hasNav || hasDataMenu ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            {hasNav ? (
              <nav className="flex flex-wrap items-center gap-0.5" aria-label="Admin pages">
                {deskWrite ? <NavLink href="/admin/patients">Patients</NavLink> : null}
                {deskWrite ? <NavLink href="/admin/contact">Contact inbox</NavLink> : null}
                {operations ? <NavLink href="/admin/reports">Reports</NavLink> : null}
                {operations ? (
                  <NavLink href="/admin/super">Website &amp; settings</NavLink>
                ) : null}
              </nav>
            ) : (
              <span />
            )}

            <div className="flex flex-wrap items-center gap-2">
              {hasDataMenu ? (
                <MenuDropdown label="Import / export">
                  <MenuButton onClick={onExportPatients}>Export patients</MenuButton>
                  <MenuButton onClick={onImportPatients} disabled={patientCsvImportBusy}>
                    {patientCsvImportBusy ? "Importing patients…" : "Import patients"}
                  </MenuButton>
                  <div className="my-1 border-t border-slate-100" role="separator" />
                  <MenuButton onClick={onExportAppointments}>Export appointments</MenuButton>
                  <MenuButton onClick={onImportAppointmentsClick} disabled={csvImportBusy}>
                    {csvImportBusy ? "Importing appointments…" : "Import appointments"}
                  </MenuButton>
                  <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={csvImportSkipConflict}
                      onChange={(e) => onCsvImportSkipConflictChange(e.target.checked)}
                      className="rounded border-slate-300"
                      onClick={(e) => e.stopPropagation()}
                    />
                    Allow overlap on import
                  </label>
                </MenuDropdown>
              ) : null}
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className={`${btnGhost} disabled:opacity-50`}
              >
                {loading ? "Refreshing…" : "Refresh"}
              </button>
              <button type="button" onClick={onSignOut} className={btnSecondary}>
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className={`${btnGhost} disabled:opacity-50`}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button type="button" onClick={onSignOut} className={btnSecondary}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export function schedulerHeaderRoleLabel(role: Parameters<typeof staffRoleLabel>[0] | null | undefined) {
  return role ? staffRoleLabel(role) : null;
}
