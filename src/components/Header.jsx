import { useState } from "react"
import Logo from "../assets/imagenes/umg.ico"
import Users from "../assets/imagenes/users.png"

export const Header = ({ theme, onToggleTheme }) => {
  const [mostrar, setMostrar] = useState(false)
  const temaOscuroActivo = theme === "dark"

  return (
    <header className="relative z-40 flex items-center justify-between gap-3 overflow-visible rounded-3xl border border-[var(--border-soft)] bg-[var(--card-bg)] px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur md:px-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 p-1 shadow-md">
          <img src={Logo} alt="logo" className="h-10 w-10 rounded-lg bg-white object-cover p-1" />
        </div>

        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-[var(--text-strong)] md:text-xl">PseudoJS</h1>
          <p className="text-xs font-medium text-[var(--text-muted)] md:text-sm">Traductor de pseudocodigo a JavaScript</p>
        </div>
      </div>

      <div className="relative flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="group inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--panel-2)] px-3 text-xs font-semibold text-[var(--text-strong)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
          aria-label="Cambiar modo de color"
          title={temaOscuroActivo ? "Activar modo claro" : "Activar modo oscuro"}
        >
          <span>{temaOscuroActivo ? "Modo claro" : "Modo oscuro"}</span>
        </button>

        <button
          onClick={() => setMostrar(!mostrar)}
          className="group grid h-12 w-12 place-content-center rounded-xl border border-[var(--border-soft)] bg-[var(--panel-2)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-300/70 hover:shadow-md"
          aria-label="Mostrar desarrolladores"
        >
          <img src={Users} alt="colaboradores" className="h-10 w-10 rounded-lg object-cover" />
        </button>

        {mostrar && (
          <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-[var(--border-soft)] bg-[var(--panel)] p-3 shadow-xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Desarrolladores</p>
            <p className="text-sm font-medium text-[var(--text-strong)]">Douglas Galindo</p>
            <p className="text-sm font-medium text-[var(--text-strong)]">Pedro Cesar Ramos</p>
            <p className="text-sm font-medium text-[var(--text-strong)]">Juan Manuel Zacarias</p>
          </div>
        )}
      </div>
    </header>
  )
}
