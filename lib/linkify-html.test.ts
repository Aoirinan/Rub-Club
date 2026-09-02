import { describe, expect, it } from "vitest";
import { linkifyHtmlUrls } from "./linkify-html";

describe("linkifyHtmlUrls", () => {
  it("wraps bare URLs in anchor tags", () => {
    const html = "<p>Buy today https://squareup.com/gift/abc/order</p>";
    expect(linkifyHtmlUrls(html)).toBe(
      '<p>Buy today <a href="https://squareup.com/gift/abc/order" target="_blank" rel="noopener noreferrer">https://squareup.com/gift/abc/order</a></p>',
    );
  });

  it("keeps query strings with ampersands in the link", () => {
    const html = "<p>Order https://squareup.com/gift/x/order?ref=site&amp;promo=fall now</p>";
    expect(linkifyHtmlUrls(html)).toBe(
      '<p>Order <a href="https://squareup.com/gift/x/order?ref=site&amp;promo=fall" target="_blank" rel="noopener noreferrer">https://squareup.com/gift/x/order?ref=site&amp;promo=fall</a> now</p>',
    );
  });

  it("does not double-wrap existing links", () => {
    const html = '<p><a href="https://example.com">https://example.com</a></p>';
    expect(linkifyHtmlUrls(html)).toBe(html);
  });
});
