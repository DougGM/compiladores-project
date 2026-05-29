// ======================================================
//  COMPONENTE VISUAL DEL ARBOL SINTACTICO
// ======================================================
// Este componente recibe el arbol generado por traductor.js y
// lo muestra como un diagrama jerarquico. No genera el AST del
// traductor; solo lo transforma a una vista BNF resumida.

// Imports de React para memorizar el arbol visual, manejar el
// estado de descarga y referenciar el nodo que se exporta a PNG.
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

// html-to-image convierte un nodo HTML especifico en imagen PNG.
import { toPng } from "html-to-image"

// ======================================================
//  FUNCIONES AUXILIARES: NODOS VISUALES
// ======================================================
// noTerminal() crea etiquetas gramaticales como <Programa>.
// terminal() crea hojas como leer, edad, 18, = o fin_si.
const noTerminal = (etiqueta, hijos = []) => ({
  etiqueta: `<${etiqueta}>`,
  tipo: "no-terminal",
  hijos: hijos.filter(Boolean),
})

const terminal = (valor, clase = "terminal") => ({
  etiqueta: String(valor),
  tipo: clase,
  hijos: [],
})

// ======================================================
//  NORMALIZACION VISUAL DEL AST A BNF
// ======================================================
// Estas funciones adaptan el AST del parser a un arbol mas
// formal para la interfaz. Se mantienen los niveles importantes
// de la BNF, pero identificadores, numeros y cadenas se muestran
// resumidos como hojas completas.
const crearIdentificador = (valor = "") => (
  noTerminal("Identificador", [terminal(valor)])
)

// NumeroConSigno conserva el signo como parte de la regla BNF
// cuando aparece en el paso de un ciclo para.
const crearNumeroConSigno = (valor = "") => {
  const texto = String(valor)
  const tieneSigno = texto.startsWith("+") || texto.startsWith("-")

  if (!tieneSigno) {
    return noTerminal("NumeroConSigno", [crearNumero(texto)])
  }

  return noTerminal("NumeroConSigno", [
    noTerminal("Signo", [terminal(texto[0], "operator")]),
    noTerminal("Numero", [terminal(texto.slice(1))]),
  ])
}

const crearNumero = (valor = "") => noTerminal("Numero", [terminal(valor)])

const crearCadena = (valor = "") => noTerminal("Cadena", [terminal(valor)])

// <Valor> agrupa los posibles valores terminales del lenguaje:
// identificadores, numeros, cadenas o un valor vacio por error.
const crearValor = (nodo) => {
  if (!nodo) return noTerminal("Valor", [terminal("vacio", "special")])

  switch (nodo.tipo) {
    case "Identificador":
      return noTerminal("Valor", [crearIdentificador(nodo.valor)])
    case "Numero":
      return noTerminal("Valor", [crearNumero(nodo.valor)])
    case "Cadena":
      return noTerminal("Valor", [crearCadena(nodo.valor)])
    case "ExpresionVacia":
      return noTerminal("Valor", [terminal("vacio", "special")])
    default:
      return noTerminal("Valor", [noTerminal(nodo.tipo ?? "Desconocido")])
  }
}

// <Termino> puede ser un valor simple o una expresion entre parentesis.
const crearTermino = (nodo) => {
  if (nodo?.tipo === "TerminoAgrupado") {
    return noTerminal("Termino", [
      terminal("(", "symbol"),
      crearExpresion(nodo.expresion),
      terminal(")", "symbol"),
    ])
  }

  return noTerminal("Termino", [crearValor(nodo)])
}

// Operadores aritmeticos: +, -, * y /.
const crearOperadorAritmetico = (operador) => (
  noTerminal("OperadorAritmetico", [terminal(operador, "operator")])
)

// <Expresion> respeta la secuencia de terminos y operadores
// aritmeticos detectados por el parser.
const crearExpresion = (nodo) => {
  if (!nodo) return noTerminal("Expresion")

  if (nodo.tipo === "Expresion") {
    const hijos = []
    nodo.terminos.forEach((termino, indice) => {
      if (indice > 0) {
        hijos.push(crearOperadorAritmetico(nodo.operadores[indice - 1]))
      }
      hijos.push(crearTermino(termino))
    })

    return noTerminal("Expresion", hijos)
  }

  return noTerminal("Expresion", [crearTermino(nodo)])
}

// <Condicion> se representa como expresion, operador relacional
// y otra expresion.
const crearCondicion = (nodo) => (
  noTerminal("Condicion", [
    crearExpresion(nodo?.izquierda),
    noTerminal("OperadorRelacional", [terminal(nodo?.operador ?? "", "operator")]),
    crearExpresion(nodo?.derecha),
  ])
)

// <BloqueInstrucciones> contiene las instrucciones internas de
// estructuras como si, mientras, para, caso o defecto.
const crearBloque = (instrucciones) => (
  noTerminal("BloqueInstrucciones", (instrucciones ?? []).map(crearInstruccion))
)

// Ramas especificas de la estructura segun.
const crearCaso = (nodo) => (
  noTerminal("Caso", [
    terminal("caso"),
    crearValor(nodo.valor),
    crearBloque(nodo.bloque),
  ])
)

const crearDefecto = (nodo) => (
  noTerminal("Defecto", [
    terminal("defecto"),
    crearBloque(nodo.bloque),
  ])
)

// Convierte cada tipo de instruccion del AST en una rama BNF
// con no terminales y terminales visibles.
const crearInstruccion = (nodo) => {
  if (!nodo) return null

  switch (nodo.tipo) {
    case "Asignacion":
      return noTerminal("Instruccion", [
        noTerminal("Asignacion", [
          crearIdentificador(nodo.identificador),
          terminal("=", "operator"),
          crearExpresion(nodo.expresion),
        ]),
      ])

    case "EntradaDatos":
      return noTerminal("Instruccion", [
        noTerminal("EntradaDatos", [
          terminal("leer"),
          crearIdentificador(nodo.identificador),
        ]),
      ])

    case "SalidaDatos":
      return noTerminal("Instruccion", [
        noTerminal("SalidaDatos", [
          terminal("mostrar"),
          crearExpresion(nodo.expresion),
        ]),
      ])

    case "CondicionalSi": {
      const hijos = [
        terminal("si"),
        crearCondicion(nodo.condicion),
        terminal("entonces"),
        crearBloque(nodo.bloqueEntonces),
      ]

      if (nodo.bloqueSino?.length > 0) {
        hijos.push(terminal("sino"), crearBloque(nodo.bloqueSino))
      }

      hijos.push(terminal("fin_si"))

      return noTerminal("Instruccion", [
        noTerminal("CondicionalSi", hijos),
      ])
    }

    case "EstructuraSegun": {
      const hijos = [
        terminal("segun"),
        crearIdentificador(nodo.identificador),
        ...(nodo.casos ?? []).map(crearCaso),
      ]

      if (nodo.defecto) {
        hijos.push(crearDefecto(nodo.defecto))
      }

      hijos.push(terminal("fin_segun"))

      return noTerminal("Instruccion", [
        noTerminal("EstructuraSegun", hijos),
      ])
    }

    case "CicloPara": {
      const hijos = [
        terminal("para"),
        crearIdentificador(nodo.identificador),
        terminal("=", "operator"),
        crearNumero(nodo.desde?.valor),
        terminal("hasta"),
        crearNumero(nodo.hasta?.valor),
      ]

      if (nodo.paso) {
        hijos.push(terminal("paso"), crearNumeroConSigno(nodo.paso.valor))
      }

      hijos.push(crearBloque(nodo.bloque), terminal("fin_para"))

      return noTerminal("Instruccion", [
        noTerminal("CicloPara", hijos),
      ])
    }

    case "CicloMientras":
      return noTerminal("Instruccion", [
        noTerminal("CicloMientras", [
          terminal("mientras"),
          crearCondicion(nodo.condicion),
          terminal("hacer"),
          crearBloque(nodo.bloque),
          terminal("fin_mientras"),
        ]),
      ])

    case "CicloHacerMientras":
      return noTerminal("Instruccion", [
        noTerminal("CicloHacerMientras", [
          terminal("hacer"),
          crearBloque(nodo.bloque),
          terminal("mientras"),
          crearCondicion(nodo.condicion),
        ]),
      ])

    default:
      return noTerminal("Instruccion", [
        noTerminal(nodo.tipo ?? "Desconocida"),
      ])
  }
}

// Nodo raiz visual: <Programa> contiene <Instrucciones>.
const crearArbolGramatical = (arbol) => (
  noTerminal("Programa", [
    noTerminal("Instrucciones", (arbol?.hijos ?? []).map(crearInstruccion)),
  ])
)

// ======================================================
//  COMPONENTE RECURSIVO DE NODO
// ======================================================
// TreeNode renderiza un nodo y vuelve a llamarse para cada hijo.
// La jerarquia visual se forma colocando los hijos debajo del padre.
const TreeNode = ({ nodo }) => {
  const tieneHijos = nodo.hijos.length > 0
  const claseNodo = [
    "diagram-tree-node",
    tieneHijos ? "diagram-tree-node-parent" : "",
    `diagram-tree-node-${nodo.tipo}`,
  ].filter(Boolean).join(" ")

  // La clase diagram-tree-node-* permite diferenciar visualmente
  // no terminales, terminales, operadores, simbolos y nodos especiales.
  return (
    <div className={claseNodo}>
      <div className="diagram-node-card">
        <span className="diagram-node-title">{nodo.etiqueta}</span>
      </div>

      {tieneHijos ? (
        // Los hijos se renderizan en una fila debajo del padre.
        // Las lineas/conectores se dibujan desde CSS con pseudo-elementos.
        <div className={`diagram-tree-children ${nodo.hijos.length === 1 ? "diagram-tree-children-single" : ""}`}>
          {nodo.hijos.map((hijo, indice) => (
            <TreeNode key={`${hijo.etiqueta}-${hijo.tipo}-${indice}`} nodo={hijo} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

// Vista contenedora del arbol. El ref apunta solo al diagrama
// para que la descarga PNG no capture toda la pagina.
const VistaArbol = ({ arbolGramatical, exportRef }) => (
  <div className="syntax-tree-view" role="tree" aria-label="Arbol sintactico">
    <div ref={exportRef} className="syntax-tree-export">
      <div className="syntax-tree-canvas">
        <TreeNode nodo={arbolGramatical} />
      </div>
    </div>
  </div>
)

// ======================================================
//  COMPONENTE PRINCIPAL EXPORTADO
// ======================================================
// Recibe la prop arbol desde Editor.jsx. Si existe, lo normaliza
// para la vista y lo renderiza junto con el boton de descarga.
export const ArbolSintactico = ({ arbol }) => {
  const [estadoDescarga, setEstadoDescarga] = useState("idle")
  const [expandido, setExpandido] = useState(false)
  const arbolNormalRef = useRef(null)
  const arbolExpandidoRef = useRef(null)
  const arbolGramatical = useMemo(() => crearArbolGramatical(arbol), [arbol])

  useEffect(() => {
    if (!expandido) return
    const manejarTecla = (e) => { if (e.key === "Escape") setExpandido(false) }
    const overflowOriginal = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", manejarTecla)
    return () => {
      document.body.style.overflow = overflowOriginal
      document.removeEventListener("keydown", manejarTecla)
    }
  }, [expandido])

  // ------------------------------------------------------
  // Descarga PNG
  // ------------------------------------------------------
  // Captura solo el nodo del arbol usando html-to-image y descarga
  // el archivo arbol-sintactico.png.
  const descargarPng = async (ref) => {
    if (!ref.current) return

    try {
      setEstadoDescarga("loading")
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--code-bg").trim() || "#ffffff",
        pixelRatio: 2,
      })
      const enlace = document.createElement("a")
      enlace.download = "arbol-sintactico.png"
      enlace.href = dataUrl
      enlace.click()
      setEstadoDescarga("idle")
    } catch {
      setEstadoDescarga("error")
    }
  }

  if (!arbol) return null

  return (
    <>
      <div className="syntax-tree-actions">
        <button
          type="button"
          className="quick-action-btn"
          onClick={() => setExpandido(true)}
        >
          Ampliar
        </button>
        <button
          type="button"
          className="quick-action-btn"
          onClick={() => descargarPng(arbolNormalRef)}
          disabled={estadoDescarga === "loading"}
        >
          {estadoDescarga === "loading" ? "Generando PNG" : "Descargar PNG"}
        </button>
      </div>

      {estadoDescarga === "error" ? (
        <p className="syntax-tree-error">No se pudo generar el PNG. Intenta nuevamente.</p>
      ) : null}

      <VistaArbol arbolGramatical={arbolGramatical} exportRef={arbolNormalRef} />

      {expandido ? createPortal(
        <div
          className="token-modal-overlay"
          onClick={() => setExpandido(false)}
          role="presentation"
        >
          <section
            className="token-modal-card"
            style={{ width: "min(1400px, 98vw)", height: "92vh", maxHeight: "92vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="token-modal-header token-modal-actions">
              <button
                type="button"
                className="quick-action-btn"
                onClick={() => descargarPng(arbolExpandidoRef)}
                disabled={estadoDescarga === "loading"}
                style={{ marginRight: "auto" }}
              >
                {estadoDescarga === "loading" ? "Generando PNG" : "Descargar PNG"}
              </button>
              <button
                type="button"
                className="token-modal-close"
                onClick={() => setExpandido(false)}
              >
                Cerrar
              </button>
            </div>
            <div className="syntax-tree-view" style={{ flex: 1, maxHeight: "none", overflow: "auto" }}>
              <div ref={arbolExpandidoRef} className="syntax-tree-export">
                <div className="syntax-tree-canvas">
                  <TreeNode nodo={arbolGramatical} />
                </div>
              </div>
            </div>
          </section>
        </div>,
        document.body
      ) : null}
    </>
  )
}
