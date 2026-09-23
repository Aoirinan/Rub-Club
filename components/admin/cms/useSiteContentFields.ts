"use client";

import { useCallback, useState } from "react";
import {
  adminUploadTooLargeMessage,
  readAdminUploadJson,
} from "@/lib/admin-upload-limit";
import type { ContentFieldMeta, ContentFieldType } from "@/lib/cms-registry";

export type SiteContentFieldRow = ContentFieldMeta & {
  value: string;
  updatedAt: string | null;
  updatedBy: string | null;
  hasFirestoreDoc?: boolean;
};

type UseSiteContentFieldsOptions = {
  getIdToken: () => Promise<string | null>;
  onSaved?: () => void;
};

export function useSiteContentFields({ getIdToken, onSaved }: UseSiteContentFieldsOptions) {
  const [fields, setFields] = useState<SiteContentFieldRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const fetchFields = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch("/api/admin/site-content", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as { fields?: SiteContentFieldRow[]; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Could not load fields");
    if (data.fields) setFields(data.fields);
  }, [getIdToken]);

  /** Full load: `loading` is true meanwhile (callers show a placeholder). */
  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      await fetchFields();
    } catch (e) {
      setMessage({ kind: "err", text: e instanceof Error ? e.message : "Load failed" });
    } finally {
      setLoading(false);
    }
  }, [fetchFields]);

  /**
   * Refresh after a save/reset without touching `loading`: the editor must stay
   * mounted so unsaved drafts in other fields (and embedded editors) survive.
   */
  const refresh = useCallback(async () => {
    try {
      await fetchFields();
    } catch {
      setMessage({
        kind: "err",
        text: "Saved, but the field list could not be refreshed — reload the page to see the latest values.",
      });
    }
  }, [fetchFields]);

  const getField = useCallback(
    (id: string) => fields.find((f) => f.id === id),
    [fields],
  );

  const getValue = useCallback(
    (id: string) => fields.find((f) => f.id === id)?.value ?? "",
    [fields],
  );

  const saveField = useCallback(
    async (id: string, value: string, file?: File) => {
      setBusy(true);
      setMessage(null);
      try {
        const token = await getIdToken();
        if (!token) throw new Error("Not signed in");
        const headers = { Authorization: `Bearer ${token}` };
        if (file) {
          const tooLarge = adminUploadTooLargeMessage(file);
          if (tooLarge) throw new Error(tooLarge);
          const fd = new FormData();
          fd.append("file", file);
          const up = await fetch(`/api/admin/site-content/${encodeURIComponent(id)}/upload`, {
            method: "POST",
            headers,
            body: fd,
          });
          const upData = await readAdminUploadJson<object>(up);
          if (!up.ok) throw new Error(upData.error ?? "Upload failed");
        } else {
          const res = await fetch(`/api/admin/site-content/${encodeURIComponent(id)}`, {
            method: "PATCH",
            headers: { ...headers, "content-type": "application/json" },
            body: JSON.stringify({ value }),
          });
          const data = (await res.json()) as { error?: string };
          if (!res.ok) throw new Error(data.error ?? "Save failed");
        }
        setMessage({ kind: "ok", text: "Saved — live within about 60 seconds" });
        await refresh();
        onSaved?.();
      } catch (e) {
        setMessage({ kind: "err", text: e instanceof Error ? e.message : "Save failed" });
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [getIdToken, refresh, onSaved],
  );

  const resetField = useCallback(
    async (id: string, label: string) => {
      if (!window.confirm(`Reset "${label}" to its original default?`)) return;
      setBusy(true);
      try {
        const token = await getIdToken();
        if (!token) throw new Error("Not signed in");
        const res = await fetch(`/api/admin/site-content/${encodeURIComponent(id)}/reset`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Reset failed");
        setMessage({ kind: "ok", text: "Reset to default" });
        await refresh();
        onSaved?.();
      } catch (e) {
        setMessage({ kind: "err", text: e instanceof Error ? e.message : "Reset failed" });
      } finally {
        setBusy(false);
      }
    },
    [getIdToken, refresh, onSaved],
  );

  return {
    fields,
    loading,
    busy,
    message,
    setMessage,
    load,
    getField,
    getValue,
    saveField,
    resetField,
  };
}

export type { ContentFieldType };
