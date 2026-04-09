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
    // Contenedor principal de editor
    <div className="flex flex-col gap-4 mt-10">

      {/* Contenedor de botón */}
      <div className="flex justify-center gap-3">
        <button onClick={manejarConversion} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
          Convertir
        </button>
        <button onClick={manejarLimpieza} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
          Limpiar
        </button>
        <button onClick={manejarCopiarSalida} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
          Copiar JS
        </button>
      </div>

      {/* Contenedor de ambos text areas */}
      <div className="flex gap-4">

        <div className="flex flex-col w-1/2">
          <label className="mb-1 font-semibold">PseudoJS</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="border rounded-lg p-3 h-80 resize-none outline-none focus:ring-1 focus:ring-blue-300"
            placeholder="Escribir pseudocódigo"/>
        </div>

        <div className="flex flex-col w-1/2">
          <label className="mb-1 font-semibold">JavaScript</label>
          <textarea value={output} className="border rounded-lg p-3 h-80 resize-none outline-none bg-gray-100"
            placeholder="Resultado en JavaScript" readOnly />
        </div>

      </div>

      <TranslationRules />
    </div>
  )
}
