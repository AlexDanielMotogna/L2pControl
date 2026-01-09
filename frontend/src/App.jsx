import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import RoomView from './pages/RoomView'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex flex-col">
      <nav className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img src="/images/L2p-red-loog.png" alt="L2P Logo" className="h-8 sm:h-10" />
              <h1 className="text-lg sm:text-xl font-bold">L2P Control</h1>
            </div>
            <div className="flex space-x-1 sm:space-x-2 md:space-x-4">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium ${
                    isActive ? 'bg-red-700' : 'hover:bg-red-500'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/room"
                className={({ isActive }) =>
                  `px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium ${
                    isActive ? 'bg-red-700' : 'hover:bg-red-500'
                  }`
                }
              >
                Room
              </NavLink>
              <NavLink
                to="/sessions"
                className={({ isActive }) =>
                  `px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium ${
                    isActive ? 'bg-red-700' : 'hover:bg-red-500'
                  }`
                }
              >
                Sessions
              </NavLink>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-grow">
        <Routes>
          <Route path="/room" element={<RoomView />} />
          <Route path="/" element={
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <Dashboard />
            </main>
          } />
          <Route path="/sessions" element={
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <Sessions />
            </main>
          } />
        </Routes>
      </div>

      <footer className="py-6 text-center text-gray-400 text-sm bg-gray-900/30 backdrop-blur border-t border-gray-800">
        <p>
          Developed by 2025{' '}
          <a
            href="https://motogna.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 hover:text-red-300 transition font-medium"
          >
            MOTOGNA Tech Studio
          </a>
          {' '}· All rights reserved
        </p>
      </footer>
    </div>
  )
}

export default App
