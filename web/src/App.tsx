import { Outlet, Route, Routes } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import ConfirmPage from './pages/auth/ConfirmPage'
import ErrorPage from './pages/auth/ErrorPage'
import LoginPage from './pages/auth/LoginPage'
import LogoutPage from './pages/auth/LogoutPage'

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
      </Route>
      <Route path='/auth/login' element={<LoginPage />} />
      <Route path='/auth/confirm' element={<ConfirmPage />} />
      <Route path='/auth/error' element={<ErrorPage />} />
      <Route path='/auth/logout' element={<LogoutPage />} />
      <Route path='/scroll' element={<div className='h-dvh bg-black' />} />
    </Routes>
  )
}

export default App
