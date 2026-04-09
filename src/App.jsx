import { Header } from "./components/Header"
import { Editor } from "./components/Editor"

function App() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#eef2ff_30%,_#f8fafc_60%,_#f1f5f9_100%)] text-slate-800">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <section className="mb-6">
          <Header />
        </section>

        <section>
          <Editor />
        </section>
      </div>
    </main>
  )
}

export default App
