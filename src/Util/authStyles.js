/**
 * The shape of an auth input.
 *
 * Kept out of the component file so fast refresh keeps working there, and in
 * one place so every field on every auth screen is the same height and shows
 * its error state the same way.
 */
export function authInputClass(hasError) {
  return [
    'w-full rounded-md border bg-surface px-4 py-3 text-body_Medium text-ink',
    'placeholder:text-ink-faint',
    'transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40',
    hasError ? 'border-danger focus:border-danger' : 'border-line focus:border-brand',
  ].join(' ');
}
