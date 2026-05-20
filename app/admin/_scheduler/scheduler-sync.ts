/** Keeps date/location aligned between the main desk window and the chiro popup. */
const CHANNEL = "wellness-scheduler-sync";

let syncWindowId: string | null = null;

function syncSourceId(): string {
  if (!syncWindowId) {
    syncWindowId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
  }
  return syncWindowId;
}

export type SchedulerSyncPayload = {
  date: string;
  locationId: "all" | "paris" | "sulphur_springs";
  from?: string;
};

export function broadcastSchedulerSync(payload: Omit<SchedulerSyncPayload, "from">) {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  new BroadcastChannel(CHANNEL).postMessage({ ...payload, from: syncSourceId() });
}

export function subscribeSchedulerSync(handler: (payload: SchedulerSyncPayload) => void) {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return () => {};
  }
  const selfId = syncSourceId();
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (event: MessageEvent<SchedulerSyncPayload>) => {
    const data = event.data;
    if (!data?.date || !data.locationId || data.from === selfId) return;
    handler(data);
  };
  return () => channel.close();
}
