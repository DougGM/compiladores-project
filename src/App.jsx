import { useEffect, useState } from "react"
import { Header } from "./components/Header"
import { Editor } from "./components/Editor"

const obtenerTemaInicial = () => {
  if (typeof window === "undefined") return "light"

  const temaGuardado = window.localStorage.getItem("pseudojs-theme")
  if (temaGuardado === "light" || temaGuardado === "dark") {
    return temaGuardado
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function App() {
  const [theme, setTheme] = useState(obtenerTemaInicial)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    window.localStorage.setItem("pseudojs-theme", theme)
  }, [theme])

  const manejarCambioTema = () => {
    setTheme((temaPrevio) => (temaPrevio === "light" ? "dark" : "light"))
  }

  return (
    <main className="app-shell">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <section className="mb-6">
          <Header theme={theme} onToggleTheme={manejarCambioTema} />
        </section>

        <section>
          <Editor />
        </section>
      </div>
    </main>
  )
}

export default App
