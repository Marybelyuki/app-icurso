export default function FormatosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Sin Sidebar: el generador ya trae su panel de configuración (300px)
  // y necesita el ancho completo para la carta carta tamaño carta.
  return (
    <div className="h-screen w-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      {children}
    </div>
  )
}
