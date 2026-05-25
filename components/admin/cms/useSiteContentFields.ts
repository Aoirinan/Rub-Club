"use client";

import { useCallback, useState } from "react";
import type { ContentFieldMeta, ContentFieldType } from "@/lib/cms";

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

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch("/api/admin/site-content", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { fields?: SiteContentFieldRow[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not load fields");
      if (data.fields) setFields(data.fields);
    } catch (e) {
      setMessage({ kind: "err", text: e instanceof Error ? e.message : "Load failed" });
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

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
          const fd = new FormData();
          fd.append("file", file);
          const up = await fetch(`/api/admin/site-content/${encodeURIComponent(id)}/upload`, {
            method: "POST",
            headers,
            body: fd,
          });
          const upData = (await up.json()) as { error?: string };
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
        await load();
        onSaved?.();
      } catch (e) {
        setMessage({ kind: "err", text: e instanceof Error ? e.message : "Save failed" });
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [getIdToken, load, onSaved],
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
        await load();
        onSaved?.();
      } catch (e) {
        setMessage({ kind: "err", text: e instanceof Error ? e.message : "Reset failed" });
      } finally {
        setBusy(false);
      }
    },
    [getIdToken, load, onSaved],
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
