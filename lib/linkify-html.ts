const URL_RE = /https?:\/\/[^\s<>&"']+/gi;

/** Wrap bare http(s) URLs in anchor tags; skips URLs already inside href or <a> body. */
export function linkifyHtmlUrls(html: string): string {
  return html.replace(URL_RE, (url, offset, full) => {
    const before = full.slice(0, offset);
    if (/href\s*=\s*["'][^"']*$/i.test(before)) return url;
    const lastOpenA = before.lastIndexOf("<a ");
    const lastCloseA = before.lastIndexOf("</a>");
    if (lastOpenA > lastCloseA) return url;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}
