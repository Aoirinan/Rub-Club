"use client";

import { useMemo, useState } from "react";
import type { LocationId, ServiceLine } from "@/lib/constants";
import type { ProviderBgColorId, ProviderTextColorId } from "@/lib/provider-colors";
import { ProviderColorSchemeEditor } from "@/components/admin/ProviderColorSchemeEditor";
import {
  BRANDI_WEEKLY_HOURS,
  DEFAULT_NOTIFICATION_DAY,
  WEEKDAY_KEYS,
  type ProviderBlockOut,
  type ProviderCalendarVisibility,
  type ProviderDayHours,
  type ProviderNotificationWindows,
  type ProviderWeeklyHours,
  type WeekdayKey,
  defaultWeeklyHoursFromLegacy,
  resolveWeeklyHours,
} from "@/lib/provider-profile";
import { newBlockOutId } from "@/lib/provider-blockouts";

export type ProviderProfileDraft = {
  id: string;
  displayName: string;
  active: boolean;
  locationIds: LocationId[];
  serviceLines: ServiceLine[];
  sortOrder: number;
  acceptsNewClients: boolean;
  photoUrl?: string | null;
  about?: string | null;
  textColor?: ProviderTextColorId | null;
  bgColor?: ProviderBgColorId | null;
  schedule?: {
    openHour: number;
    openMinute: number;
    closeHour: number;
    closeMinute: number;
  } | null;
  weeklyHours: ProviderWeeklyHours;
  blockOutTimes: ProviderBlockOut[];
  notificationWindows: ProviderNotificationWindows;
  calendarVisibility: ProviderCalendarVisibility;
};

const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

type Tab = "general" | "hours" | "blockouts" | "notifications";

function emptyDay(closed = false): ProviderDayHours {
  return {
    open: !closed,
    openHour: 9,
    openMinute: 0,
    closeHour: 17,
    closeMinute: 0,
  };
}

export function providerToProfileDraft(p: {
  id: string;
  displayName: string;
  active: boolean;
  locationIds: LocationId[];
  serviceLines: ServiceLine[];
  sortOrder: number;
  acceptsNewClients: boolean;
  photoUrl?: string | null;
  about?: string | null;
  textColor?: ProviderTextColorId | null;
  bgColor?: ProviderBgColorId | null;
  schedule?: ProviderProfileDraft["schedule"];
  weeklyHours?: ProviderWeeklyHours | null;
  blockOutTimes?: ProviderBlockOut[];
  notificationWindows?: ProviderNotificationWindows | null;
  calendarVisibility?: ProviderCalendarVisibility | null;
}): ProviderProfileDraft {
  const weekly = resolveWeeklyHours(p.weeklyHours, p.schedule, p.displayName);
  const notif: ProviderNotificationWindows = {};
  for (const key of WEEKDAY_KEYS) {
    notif[key] = { ...DEFAULT_NOTIFICATION_DAY, ...p.notificationWindows?.[key] };
  }
  return {
    id: p.id,
    displayName: p.displayName,
    active: p.active,
    locationIds: [...p.locationIds],
    serviceLines: [...p.serviceLines],
    sortOrder: p.sortOrder,
    acceptsNewClients: p.acceptsNewClients,
    photoUrl: p.photoUrl,
    about: p.about,
    textColor: p.textColor,
    bgColor: p.bgColor,
    schedule: p.schedule,
    weeklyHours: weekly,
    blockOutTimes: [...(p.blockOutTimes ?? [])],
    notificationWindows: notif,
    calendarVisibility: p.calendarVisibility ?? "all",
  };
}

export function ProviderProfileEditor({
  draft,
  onChange,
  photoSlot,
}: {
  draft: ProviderProfileDraft;
  onChange: (next: ProviderProfileDraft) => void;
  photoSlot?: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("general");

  const patchDay = (key: WeekdayKey, patch: Partial<ProviderDayHours>) => {
    const prev = draft.weeklyHours[key] ?? emptyDay();
    onChange({
      ...draft,
      weeklyHours: { ...draft.weeklyHours, [key]: { ...prev, ...patch } },
    });
  };

  const patchNotif = (key: WeekdayKey, patch: Partial<typeof DEFAULT_NOTIFICATION_DAY>) => {
    const prev = draft.notificationWindows[key] ?? { ...DEFAULT_NOTIFICATION_DAY };
    onChange({
      ...draft,
      notificationWindows: {
        ...draft.notificationWindows,
        [key]: { ...prev, ...patch },
      },
    });
  };

  const tabs: { id: Tab; label: string }[] = useMemo(
    () => [
      { id: "general", label: "General" },
      { id: "hours", label: "Hours" },
      { id: "blockouts", label: "Block out times" },
      { id: "notifications", label: "Notifications" },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-3 py-2 text-sm font-semibold ${
              tab === t.id
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" ? (
        <div className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-800">Display name</span>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={draft.displayName}
              onChange={(e) => onChange({ ...draft, displayName: e.target.value })}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-800">Calendar visibility</span>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={draft.calendarVisibility}
              onChange={(e) =>
                onChange({
                  ...draft,
                  calendarVisibility: e.target.value as ProviderCalendarVisibility,
                })
              }
            >
              <option value="all">Show on all calendars</option>
              <option value="paris">Paris calendar only</option>
              <option value="sulphur_springs">Sulphur Springs calendar only</option>
            </select>
          </label>
          <ProviderColorSchemeEditor
            displayName={draft.displayName}
            textColor={draft.textColor}
            bgColor={draft.bgColor}
            onChange={({ textColor, bgColor }) => onChange({ ...draft, textColor, bgColor })}
          />
          {photoSlot}
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="font-medium text-slate-800">Locations</span>
            {(["paris", "sulphur_springs"] as const).map((loc) => (
              <label key={loc} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.locationIds.includes(loc)}
                  onChange={(e) => {
                    const on = e.target.checked;
                    const set = new Set(draft.locationIds);
                    if (on) set.add(loc);
                    else set.delete(loc);
                    onChange({ ...draft, locationIds: Array.from(set) as LocationId[] });
                  }}
                />
                {loc === "paris" ? "Paris" : "Sulphur Springs"}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="w-full font-medium text-slate-800">Services</span>
            {(["massage", "chiropractic", "stretch"] as const).map((svc) => (
              <label key={svc} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.serviceLines.includes(svc)}
                  onChange={(e) => {
                    const on = e.target.checked;
                    const set = new Set(draft.serviceLines);
                    if (on) set.add(svc);
                    else set.delete(svc);
                    onChange({ ...draft, serviceLines: Array.from(set) as ServiceLine[] });
                  }}
                />
                {svc.charAt(0).toUpperCase() + svc.slice(1)}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => onChange({ ...draft, active: e.target.checked })}
            />
            Active (public booking)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.acceptsNewClients !== false}
              onChange={(e) => onChange({ ...draft, acceptsNewClients: e.target.checked })}
            />
            Accepting new clients online
          </label>
        </div>
      ) : null}

      {tab === "hours" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold"
              onClick={() =>
                onChange({
                  ...draft,
                  weeklyHours: defaultWeeklyHoursFromLegacy(draft.schedule),
                })
              }
            >
              Reset to site default (9–5)
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold"
              onClick={() => onChange({ ...draft, weeklyHours: { ...BRANDI_WEEKLY_HOURS } })}
            >
              Apply Brandi template
            </button>
          </div>
          <ul className="space-y-2">
            {WEEKDAY_KEYS.map((key) => {
              const day = draft.weeklyHours[key] ?? emptyDay(true);
              return (
                <li
                  key={key}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="w-24 font-semibold text-slate-800">{WEEKDAY_LABELS[key]}</span>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={day.open}
                      onChange={(e) => patchDay(key, { open: e.target.checked })}
                    />
                    Open
                  </label>
                  {day.open ? (
                    <>
                      <label className="flex items-center gap-1">
                        From
                        <input
                          type="time"
                          className="rounded border border-slate-300 px-1 py-0.5"
                          value={`${String(day.openHour).padStart(2, "0")}:${String(day.openMinute).padStart(2, "0")}`}
                          onChange={(e) => {
                            const [h, m] = e.target.value.split(":").map(Number);
                            patchDay(key, { openHour: h, openMinute: m });
                          }}
                        />
                      </label>
                      <label className="flex items-center gap-1">
                        To
                        <input
                          type="time"
                          className="rounded border border-slate-300 px-1 py-0.5"
                          value={`${String(day.closeHour).padStart(2, "0")}:${String(day.closeMinute).padStart(2, "0")}`}
                          onChange={(e) => {
                            const [h, m] = e.target.value.split(":").map(Number);
                            patchDay(key, { closeHour: h, closeMinute: m });
                          }}
                        />
                      </label>
                    </>
                  ) : (
                    <span className="text-slate-500">Closed</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {tab === "blockouts" ? (
        <BlockOutEditor
          blockOuts={draft.blockOutTimes}
          onChange={(blockOutTimes) => onChange({ ...draft, blockOutTimes })}
        />
      ) : null}

      {tab === "notifications" ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-600">
            Reminders (manual Send Reminders) only go out during these windows for this provider.
            SMS and email can be toggled separately.
          </p>
          <ul className="space-y-2">
            {WEEKDAY_KEYS.map((key) => {
              const row = draft.notificationWindows[key] ?? { ...DEFAULT_NOTIFICATION_DAY };
              return (
                <li
                  key={key}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="w-20 font-semibold">{WEEKDAY_LABELS[key]}</span>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={row.send}
                      onChange={(e) => patchNotif(key, { send: e.target.checked })}
                    />
                    Send
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={row.sms}
                      onChange={(e) => patchNotif(key, { sms: e.target.checked })}
                    />
                    SMS
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={row.email}
                      onChange={(e) => patchNotif(key, { email: e.target.checked })}
                    />
                    Email
                  </label>
                  <input
                    type="time"
                    className="rounded border border-slate-300 px-1 py-0.5"
                    value={`${String(row.startHour).padStart(2, "0")}:${String(row.startMinute).padStart(2, "0")}`}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(":").map(Number);
                      patchNotif(key, { startHour: h, startMinute: m });
                    }}
                  />
                  <span>–</span>
                  <input
                    type="time"
                    className="rounded border border-slate-300 px-1 py-0.5"
                    value={`${String(row.endHour).padStart(2, "0")}:${String(row.endMinute).padStart(2, "0")}`}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(":").map(Number);
                      patchNotif(key, { endHour: h, endMinute: m });
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function BlockOutEditor({
  blockOuts,
  onChange,
}: {
  blockOuts: ProviderBlockOut[];
  onChange: (next: ProviderBlockOut[]) => void;
}) {
  const [kind, setKind] = useState<"one_time" | "recurring">("one_time");
  const [mode, setMode] = useState<"office_hours" | "custom">("office_hours");
  const [weekday, setWeekday] = useState<WeekdayKey>("thu");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [label, setLabel] = useState("");

  function addBlock() {
    const block: ProviderBlockOut = {
      id: newBlockOutId(),
      kind,
      mode,
      label: label.trim() || undefined,
      weekday: kind === "recurring" ? weekday : undefined,
      startDate: kind === "one_time" ? startDate : undefined,
      endDate: kind === "one_time" ? endDate || startDate : undefined,
      customStartHour: 12,
      customStartMinute: 0,
      customEndHour: 13,
      customEndMinute: 0,
    };
    onChange([...blockOuts, block]);
    setLabel("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-sm">
        <p className="font-semibold text-slate-900">Add block out</p>
        <div className="flex flex-wrap gap-3">
          <label>
            Type
            <select
              className="ml-1 rounded border border-slate-300"
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
            >
              <option value="one_time">One-time</option>
              <option value="recurring">Recurring</option>
            </select>
          </label>
          <label>
            Mode
            <select
              className="ml-1 rounded border border-slate-300"
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
            >
              <option value="office_hours">Closed during office hours</option>
              <option value="custom">Custom time range</option>
            </select>
          </label>
        </div>
        {kind === "recurring" ? (
          <label>
            Weekday
            <select
              className="ml-1 rounded border border-slate-300"
              value={weekday}
              onChange={(e) => setWeekday(e.target.value as WeekdayKey)}
            >
              {WEEKDAY_KEYS.map((k) => (
                <option key={k} value={k}>
                  {WEEKDAY_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="flex flex-wrap gap-2">
            <label>
              From
              <input type="date" className="ml-1 rounded border" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label>
              To
              <input type="date" className="ml-1 rounded border" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>
        )}
        <label className="block">
          Label (optional)
          <input
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={addBlock}
          className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white"
        >
          Add block
        </button>
      </div>
      <ul className="space-y-2">
        {blockOuts.length === 0 ? (
          <li className="text-sm text-slate-500">No block out times.</li>
        ) : (
          blockOuts.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <span>
                {b.label || "Block"} · {b.kind === "recurring" ? `Every ${b.weekday}` : `${b.startDate}–${b.endDate}`} ·{" "}
                {b.mode === "office_hours" ? "Office hours" : "Custom"}
              </span>
              <button
                type="button"
                className="text-xs font-semibold text-red-700 underline"
                onClick={() => onChange(blockOuts.filter((x) => x.id !== b.id))}
              >
                Remove
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
