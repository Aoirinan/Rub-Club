/**
 * Backpro-style centered section heading: large green uppercase text with
 * thin horizontal rules on both sides.
 */
export function SectionHeading({
  children,
  id,
}: {
  children: string;
  id?: string;
}) {
  return (
    <h2
      id={id}
      className="flex items-center justify-center gap-4 text-center text-3xl font-semibold uppercase tracking-wide text-[var(--pp-accent)] sm:gap-6 sm:text-4xl"
    >
      <span aria-hidden className="h-px w-12 shrink-0 bg-[var(--pp-accent)] opacity-50 sm:w-24" />
      <span>{children}</span>
      <span aria-hidden className="h-px w-12 shrink-0 bg-[var(--pp-accent)] opacity-50 sm:w-24" />
    </h2>
  );
}
