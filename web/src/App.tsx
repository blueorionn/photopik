import { Outlet, Route, Routes } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import ConfirmPage from './pages/auth/ConfirmPage'
import ErrorPage from './pages/auth/ErrorPage'
import LoginPage from './pages/auth/LoginPage'
import LogoutPage from './pages/auth/LogoutPage'
import CollectionsPage from './pages/collections/CollectionsPage'
import NotFoundPage from './pages/handlers/NotFoundPage'
import HomePage from './pages/home/HomePage'
import SearchPage from './pages/search/SearchPage'

function AppLayout() {
  return (
    <div className='font-sans'>
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path='/' element={<HomePage />} />
        <Route path='/search' element={<SearchPage />} />
        <Route path='/collections' element={<CollectionsPage />} />
        <Route path='/upload' element={<div className='flex-1' />} />
        <Route path='/account' element={<div className='flex-1' />} />
      </Route>
      <Route path='/auth/login' element={<LoginPage />} />
      <Route path='/auth/confirm' element={<ConfirmPage />} />
      <Route path='/auth/error' element={<ErrorPage />} />
      <Route path='/auth/logout' element={<LogoutPage />} />
      <Route path='/scroll' element={<div className='h-dvh bg-black' />} />
      <Route path='*' element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
