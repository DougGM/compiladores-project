import { useState } from "react"
import Logo from '../assets/imagenes/umg.ico'
import Users from '../assets/imagenes/users.png'

export const Header = () => {
  const [mostrar, setMostrar] = useState(false)

  return (
    
    <div className='bg-neutral-50 flex justify-between h-16 px-3 py-2  rounded-[10px] items-center border border-slate-200'>
        <img src={Logo} alt="logo" className='w-10 h-10' />

        <h1 className='font-bold text-lg'>PseudoJS</h1>


      {/* CONTENEDOR boton desarrolladores */}
      <div className="relative">
        <button 
          onClick={() => setMostrar(!mostrar)} 
          className='bg-neutral-100 size-12 grid place-content-center rounded-lg cursor-pointer hover:bg-neutral-200'
        >
          <img src={Users} alt="colaboradores" className='w-10 h-10'/>
        </button>

        {/* Muestra nombres */}
        {mostrar && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg p-3">
            <p className="font-semibold mb-2">Desarrolladores</p>
            <p className="text-sm">Douglas Galindo</p>
            <p className="text-sm">Pedro César Ramos</p>
          </div>
        )}
      </div>

    </div>

  )
}   


