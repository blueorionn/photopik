import { Outlet, Route, Routes } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'

function AppLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path='/' element={<div className='flex-1' />} />
        <Route path='/search' element={<div className='flex-1' />} />
        <Route path='/account' element={<div className='flex-1' />} />
        <Route path='/auth/*' element={<div className='flex-1' />} />
      </Route>
      <Route path='/scroll' element={<div className='h-dvh bg-black' />} />
    </Routes>
  )
}

export default App
