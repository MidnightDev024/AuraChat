import React, { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import { Toaster } from 'react-hot-toast';
import { authContext } from './context/authContext.jsx';
import { useThemeStore } from './store/useThemeStore.js';

const App = () => {

  const { authUser } = React.useContext(authContext);
  const { theme } = useThemeStore();

  // Apply theme attribute to <html> whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="app-page min-h-screen bg-[url('/bgImage.svg')] bg-cover bg-center bg-no-repeat">
      <Toaster />
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  )
}

export default App
