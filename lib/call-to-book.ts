/** URLs that should open the call-to-book modal instead of navigating. */
export function isCallToBookUrl(url: string): boolean {
  const path = url.trim().split("?")[0]?.split("#")[0] ?? "";
  return path === "/book";
}

export function shouldQuickActionOpenCallToBook(item: {
  url: string;
  icon: string;
  label: string;
}): boolean {
  if (isCallToBookUrl(item.url)) return true;
  return (
    item.icon.trim().toLowerCase() === "calendar" && /schedule/i.test(item.label.trim())
  );
}
