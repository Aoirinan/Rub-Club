/** Renders SS page body text: ## headings, - bullet blocks, paragraph breaks. */
export function SsMarkdownBody({ body }: { body: string }) {
  return (
    <>
      {body.split("\n\n").map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="mt-8 text-xl font-black text-[#4a1515] first:mt-0">
              {block.replace("## ", "")}
            </h2>
          );
        }
        if (block.startsWith("- ")) {
          const items = block.split("\n").filter((l) => l.startsWith("- "));
          return (
            <ul key={i} className="list-disc space-y-1 pl-6 text-stone-700">
              {items.map((item) => (
                <li key={item}>{item.replace("- ", "")}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="leading-relaxed text-stone-700">
            {block}
          </p>
        );
      })}
    </>
  );
}

/** Bullet list stored as lines starting with "- ". */
export function MarkdownBulletList({ text }: { text: string }) {
  const items = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.replace(/^- /, ""));

  if (items.length === 0) return null;

  return (
    <ul className="list-disc space-y-2 pl-6 text-stone-700">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
