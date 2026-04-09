import { Header } from "./components/Header"
import { Editor } from "./components/Editor"

function App() {

  return (
    <main className="flex flex-col items-center bg-gray-200 min-h-screen">
      <section className="w-200 my-[24px]" >
      <Header />
      </section>

      <section className="w-300 pb-8">
        <Editor />
      </section>
    </main >
    
  )
}

export default App

