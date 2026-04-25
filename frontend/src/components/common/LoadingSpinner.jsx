/**
 * Spinner de carga animado para estados de loading.
 */
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm font-body">Cargando...</p>
      </div>
    </div>
  )
}
