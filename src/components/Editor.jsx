import { useEffect, useRef, useState } from "react"
import { traducir } from "../components/traductor"
import { TranslationRules } from "./TranslationRules"

const obtenerTotalLineas = (texto) => Math.max(1, texto.split("\n").length)

const obtenerLineaConError = (traduccion) => {
  const lineas = traduccion.split("\n")
  const indiceError = lineas.findIndex((linea) => linea.trim().startsWith("// Error sint"))
  return indiceError === -1 ? null : indiceError + 1
}

const PanelCodigo = ({
  titulo,
  tipo,
  valor,
  onChange,
  placeholder,
  soloLectura = false,
}) => {
  const lineas = obtenerTotalLineas(valor)
  const gutterRef = useRef(null)

  const manejarScroll = (evento) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = evento.target.scrollTop
    }
  }

  return (
    <article className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-2)] p-3 shadow-[var(--shadow-soft)]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="text-sm font-semibold text-[var(--text-strong)]">{titulo}</label>
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{tipo}</span>
      </div>

      <div className="mb-2 text-xs font-medium text-[var(--text-muted)]">Líneas: {lineas}</div>

      <div className="code-panel">
        <div ref={gutterRef} className="line-gutter" aria-hidden="true">
          {Array.from({ length: lineas }, (_, indice) => (
            <span key={`${tipo}-line-${indice + 1}`}>{indice + 1}</span>
          ))}
        </div>

        <textarea
          value={valor}
          onChange={onChange}
          onScroll={manejarScroll}
          className="code-editor-field code-area"
          placeholder={placeholder}
          readOnly={soloLectura}
        />
      </div>
    </article>
  )
}

export const Editor = () => {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [copyState, setCopyState] = useState("idle")
  const [estadoConversion, setEstadoConversion] = useState({
    type: "waiting",
    message: "Esperando entrada",
  })
  const [ultimoConvertido, setUltimoConvertido] = useState(null)
  const timerCopiarRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerCopiarRef.current) {
        clearTimeout(timerCopiarRef.current)
      }
    }
  }, [])

  const actualizarFeedbackCopiado = (estado) => {
    setCopyState(estado)
    if (timerCopiarRef.current) {
      clearTimeout(timerCopiarRef.current)
    }

    timerCopiarRef.current = setTimeout(() => {
      setCopyState("idle")
    }, 1500)
  }

  const manejarConversion = () => {
    if (!input.trim()) {
      setOutput("")
      setEstadoConversion({
        type: "waiting",
        message: "Esperando entrada",
      })
      return
    }

    const resultado = traducir(input)
    setOutput(resultado)
    setUltimoConvertido({ input, output: resultado })
    setCopyState("idle")

    const lineaError = obtenerLineaConError(resultado)
    if (lineaError !== null) {
      setEstadoConversion({
        type: "error",
        message: `Error en linea ${lineaError}`,
      })
      return
    }

    setEstadoConversion({
      type: "success",
      message: "Traducción exitosa",
    })
  }

  const manejarLimpieza = () => {
    setInput("")
    setOutput("")
    setCopyState("idle")
    setEstadoConversion({
      type: "waiting",
      message: "Esperando entrada",
    })
  }

  const manejarCopiarSalida = async () => {
    if (!output) return

    try {
      await navigator.clipboard.writeText(output)
      actualizarFeedbackCopiado("copied")
    } catch {
      try {
        const textoTemporal = document.createElement("textarea")
        textoTemporal.value = output
        document.body.appendChild(textoTemporal)
        textoTemporal.select()
        document.execCommand("copy")
        document.body.removeChild(textoTemporal)
        actualizarFeedbackCopiado("copied")
      } catch {
        actualizarFeedbackCopiado("error")
      }
    }
  }

  const descargarArchivo = (contenido, nombreArchivo, tipoMime) => {
    if (!contenido) return

    const archivo = new Blob([contenido], { type: tipoMime })
    const urlTemporal = URL.createObjectURL(archivo)
    const enlace = document.createElement("a")
    enlace.href = urlTemporal
    enlace.download = nombreArchivo
    document.body.appendChild(enlace)
    enlace.click()
    document.body.removeChild(enlace)
    URL.revokeObjectURL(urlTemporal)
  }

  const manejarDescargaJS = () => {
    descargarArchivo(output, "traduccion.js", "text/javascript;charset=utf-8")
  }

  const manejarDescargaTXT = () => {
    descargarArchivo(input, "pseudocodigo.txt", "text/plain;charset=utf-8")
  }

  const manejarUltimoConvertido = () => {
    if (!ultimoConvertido) return

    setInput(ultimoConvertido.input)
    setOutput(ultimoConvertido.output)

    const lineaError = obtenerLineaConError(ultimoConvertido.output)
    if (lineaError !== null) {
      setEstadoConversion({
        type: "error",
        message: `Error en linea ${lineaError}`,
      })
      return
    }

    setEstadoConversion({
      type: "success",
      message: "Traduccion exitosa",
    })
  }

  const textoBotonCopiar =
    copyState === "copied" ? "Copiado" : copyState === "error" ? "Error al copiar" : "Copiar JS"

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-[var(--border-soft)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-card)] backdrop-blur md:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-strong)] md:text-xl">Editor de traducción</h2>
            <p className="text-sm text-[var(--text-muted)]">Escribe en PseudoJS y convierte el resultado de forma inmediata.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={manejarConversion} className="primary-btn">
              Convertir
            </button>
            <button onClick={manejarLimpieza} className="secondary-btn">
              Limpiar
            </button>
            <button
              onClick={manejarCopiarSalida}
              className="secondary-btn"
              disabled={!output}
            >
              {textoBotonCopiar}
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-2">
          <span className={`status-badge status-${estadoConversion.type}`}>{estadoConversion.message}</span>
          <span className="text-xs font-medium text-[var(--text-muted)]">Entrada: {obtenerTotalLineas(input)} lineas</span>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={manejarUltimoConvertido}
            className="quick-action-btn"
            disabled={!ultimoConvertido}
          >
            Último código convertido
          </button>
          <button onClick={manejarDescargaJS} className="quick-action-btn" disabled={!output}>
            Descargar .js
          </button>
          <button onClick={manejarDescargaTXT} className="quick-action-btn" disabled={!input}>
            Descargar .txt
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <PanelCodigo
            titulo="PseudoJS"
            tipo="Entrada"
            valor={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribir pseudocodigo"
          />

          <PanelCodigo
            titulo="JavaScript"
            tipo="Salida"
            valor={output}
            soloLectura
            placeholder="Resultado en JavaScript"
          />
        </div>
      </section>

      <TranslationRules />
    </div>
  )
}

