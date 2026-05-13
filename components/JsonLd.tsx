type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

/** JSON-LD objects often use `unknown` for extensibility; stringify is still safe at runtime. */
type JsonLdInput = JsonValue | Record<string, unknown>;

/**
 * Inject one or more JSON-LD documents into the page head/body.
 * Renders a server-side <script> with safely-escaped JSON.
 */
export function JsonLd({ data }: { data: JsonLdInput | JsonLdInput[] }) {
  const docs = Array.isArray(data) ? data : [data];
  return (
    <>
      {docs.map((doc, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(doc).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
