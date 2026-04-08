import Logo from '../assets/imagenes/umg.ico'
import Users from '../assets/imagenes/users.png'

export const Header = () => {
  return (
    <div className='bg-neutral-50 flex justify-between h-16 px-3 py-2  rounded-[10px] items-center'>
        <img src={Logo} alt="logo" className='w-10 h-10' />
        <h1 className='font-bold text-lg'>PseudoJS</h1>
        <button className=' bg-neutral-100 size-12 grid place-content-center rounded-lg cursor-pointer hover:bg-neutral-200 '>
            <img src={Users} alt="colaboradores" className='w-10 h-10 '/>
        </button>
    </div>
  )
}   


