import { useState } from "react"
import { traducir } from "../components/traductor"
import { TranslationRules } from "./TranslationRules"

export const Editor = () => {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")

  const manejarConversion = () => {
    const resultado = traducir(input)
    setOutput(resultado)
  }

  const manejarLimpieza = () => {
    setInput("")
    setOutput("")
  }

  const manejarCopiarSalida = async () => {
    if (!output) return

    try {
      await navigator.clipboard.writeText(output)
    } catch {
      const textoTemporal = document.createElement("textarea")
      textoTemporal.value = output
      document.body.appendChild(textoTemporal)
      textoTemporal.select()
      document.execCommand("copy")
      document.body.removeChild(textoTemporal)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-[0_20px_55px_-38px_rgba(15,23,42,0.35)] backdrop-blur md:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">Editor de traduccion</h2>
            <p className="text-sm text-slate-500">Escribe en PseudoJS y convierte el resultado de forma inmediata.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={manejarConversion}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              Convertir
            </button>
            <button
              onClick={manejarLimpieza}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100"
            >
              Limpiar
            </button>
            <button
              onClick={manejarCopiarSalida}
              className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-100"
            >
              Copiar JS
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">PseudoJS</label>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Entrada</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="code-editor-field h-80 w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition duration-150 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              placeholder="Escribir pseudocodigo"
            />
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">JavaScript</label>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Salida</span>
            </div>
            <textarea
              value={output}
              className="code-editor-field h-80 w-full resize-none rounded-lg border border-slate-200 bg-slate-100 p-3 text-sm text-slate-700 outline-none"
              placeholder="Resultado en JavaScript"
              readOnly
            />
          </article>
        </div>
      </section>

      <TranslationRules />
    </div>
  )
}
