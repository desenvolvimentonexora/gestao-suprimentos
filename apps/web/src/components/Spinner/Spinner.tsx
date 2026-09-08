export function Spinner() {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary motion-reduce:animate-none"
    />
  )
}
