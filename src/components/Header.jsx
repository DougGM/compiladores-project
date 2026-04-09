import { useState } from "react"
import Logo from "../assets/imagenes/umg.ico"
import Users from "../assets/imagenes/users.png"

export const Header = () => {
  const [mostrar, setMostrar] = useState(false)

  return (
    <header className="relative z-40 flex items-center justify-between gap-3 overflow-visible rounded-2xl border border-slate-200/90 bg-white/85 px-4 py-3 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] backdrop-blur md:px-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 p-1 shadow-md">
          <img src={Logo} alt="logo" className="h-10 w-10 rounded-lg bg-white object-cover p-1" />
        </div>

        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 md:text-xl">PseudoJS</h1>
          <p className="text-xs font-medium text-slate-500 md:text-sm">Traductor de pseudocodigo a JavaScript</p>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setMostrar(!mostrar)}
          className="group grid h-12 w-12 place-content-center rounded-xl border border-slate-200 bg-slate-50 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md"
          aria-label="Mostrar desarrolladores"
        >
          <img src={Users} alt="colaboradores" className="h-10 w-10 rounded-lg object-cover" />
        </button>

        {mostrar && (
          <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Desarrolladores</p>
            <p className="text-sm font-medium text-slate-800">Douglas Galindo</p>
            <p className="text-sm font-medium text-slate-800">Pedro Cesar Ramos</p>
          </div>
        )}
      </div>
    </header>
  )
}
