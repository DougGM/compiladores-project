import { useEffect, useRef, useState } from "react"
import { traducir } from "../components/traductor"
import { TranslationRules } from "./TranslationRules"

// Calcula cuantas lineas mostrar en el contador y en el gutter lateral.
const obtenerTotalLineas = (texto) => Math.max(1, texto.split("\n").length)

// Detecta la linea donde el traductor reporta un error sintactico.
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
  // Maneja la logica local del panel: lineas visibles y scroll sincronizado.
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
  // Estado principal del editor: texto fuente, resultado y feedback de acciones.
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [listaTokens, setListaTokens] = useState([])
  const [tablaTokensExpandida, setTablaTokensExpandida] = useState(false)
  const [copyState, setCopyState] = useState("idle")
  const [estadoConversion, setEstadoConversion] = useState({
    type: "waiting",
    message: "Esperando entrada",
  })
  const [ultimoConvertido, setUltimoConvertido] = useState(null)
  const timerCopiarRef = useRef(null)

  // Limpia el timeout pendiente al desmontar para evitar efectos colgando.
  useEffect(() => {
    return () => {
      if (timerCopiarRef.current) {
        clearTimeout(timerCopiarRef.current)
      }
    }
  }, [])

  // Controla el modal de tabla ampliada: cierre con ESC y bloqueo de scroll de fondo.
  useEffect(() => {
    if (!tablaTokensExpandida) return

    const manejarTecla = (evento) => {
      if (evento.key === "Escape") {
        setTablaTokensExpandida(false)
      }
    }

    const overflowOriginal = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", manejarTecla)

    return () => {
      document.body.style.overflow = overflowOriginal
      document.removeEventListener("keydown", manejarTecla)
    }
  }, [tablaTokensExpandida])

  // Muestra feedback temporal al copiar y vuelve a estado neutral automaticamente.
  const actualizarFeedbackCopiado = (estado) => {
    setCopyState(estado)
    if (timerCopiarRef.current) {
      clearTimeout(timerCopiarRef.current)
    }

    timerCopiarRef.current = setTimeout(() => {
      setCopyState("idle")
    }, 1500)
  }

  // Traduce la entrada, guarda el ultimo resultado y actualiza el estado visual.
  const manejarConversion = () => {
    if (!input.trim()) {
      setOutput("")
      setListaTokens([])
      setEstadoConversion({
        type: "waiting",
        message: "Esperando entrada",
      })
      return
    }

    const { codigoJS, listaTokens: tokens } = traducir(input)
    setOutput(codigoJS)
    setListaTokens(tokens)
    setUltimoConvertido({ input, output: codigoJS, tokens })
    setCopyState("idle")

    const lineaError = obtenerLineaConError(codigoJS)
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

  // Resetea la sesion del editor para iniciar una nueva traduccion desde cero.
  const manejarLimpieza = () => {
    setInput("")
    setOutput("")
    setListaTokens([])
    setCopyState("idle")
    setEstadoConversion({
      type: "waiting",
      message: "Esperando entrada",
    })
  }

  // Intenta copiar con Clipboard API y usa fallback para navegadores con soporte limitado.
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

  // Crea y descarga archivos locales sin depender de backend.
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

  // Atajos para descargar entrada y salida con su formato correspondiente.
  const manejarDescargaJS = () => {
    descargarArchivo(output, "traduccion.js", "text/javascript;charset=utf-8")
  }

  const manejarDescargaTXT = () => {
    descargarArchivo(input, "pseudocodigo.txt", "text/plain;charset=utf-8")
  }

  // Restaura la ultima conversion guardada y recalcula su estado de exito/error.
  const manejarUltimoConvertido = () => {
    if (!ultimoConvertido) return

    setInput(ultimoConvertido.input)
    setOutput(ultimoConvertido.output)
    setListaTokens(ultimoConvertido.tokens ?? [])

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

  // Etiqueta del boton segun el resultado de la accion de copiado.
  const textoBotonCopiar =
    copyState === "copied" ? "Copiado" : copyState === "error" ? "Error al copiar" : "Copiar JS"

  const TablaTokens = ({ expandida = false }) => (
    <div className={`token-table-wrap ${expandida ? "token-table-wrap-expanded" : ""}`}>
      <table className="token-table">
        <thead>
          <tr>
            <th>Línea</th>
            <th>Token</th>
            <th>Lexema</th>
          </tr>
        </thead>
        <tbody>
          {listaTokens.length === 0 ? (
            <tr>
              <td colSpan={3} className="token-empty-row">
                Sin tokens para mostrar
              </td>
            </tr>
          ) : (
            listaTokens.map((token, indice) => {
              const tieneErrorLexico = token.token === "DESCONOCIDO" || token.token === "ERROR"
              return (
                <tr key={`${token.linea}-${indice}-${token.lexema}`} className={tieneErrorLexico ? "token-row-error" : ""}>
                  <td>{token.linea}</td>
                  <td>{token.token}</td>
                  <td>{token.lexema}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )

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

        <div className="grid gap-4">
          <PanelCodigo
            titulo="PseudoJS"
            tipo="Entrada"
            valor={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribir pseudocodigo"
          />

          {/* Panel de salida JavaScript comentado por solicitud, sin tocar logica */}
          {/* <PanelCodigo
            titulo="JavaScript"
            tipo="Salida"
            valor={output}
            soloLectura
            placeholder="Resultado en JavaScript"
          /> */}
        </div>

        <section className="mt-5 rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-2)] p-3 shadow-[var(--shadow-soft)]">
          <div
            className="token-table-header mb-3 flex items-center justify-between gap-2"
            onDoubleClick={() => setTablaTokensExpandida(true)}
            title="Doble clic para ampliar"
          >
            <h3 className="text-sm font-semibold text-[var(--text-strong)]">Tabla de Tokens</h3>
            <span className="text-xs font-medium text-[var(--text-muted)]">Total: {listaTokens.length}</span>
          </div>

          <TablaTokens />
        </section>
      </section>

      {tablaTokensExpandida ? (
        <div
          className="token-modal-overlay"
          onClick={() => setTablaTokensExpandida(false)}
          role="presentation"
        >
          <section className="token-modal-card" onClick={(evento) => evento.stopPropagation()}>
            <div
              className="token-table-header token-modal-header"
              onDoubleClick={() => setTablaTokensExpandida(false)}
              title="Doble clic para cerrar"
            >
              <div className="token-modal-actions">
                <button
                  type="button"
                  className="token-modal-close"
                  onClick={() => setTablaTokensExpandida(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
            <TablaTokens expandida />
          </section>
        </div>
      ) : null}

      <TranslationRules />
    </div>
  )
}
