import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { BookProvider } from './context/BookContext'
import Home from './pages/Home/Home'
import Stats from './pages/Stats/Stats'
import './App.css'

function Layout() {
  return <div className="app-shell"><header className="topbar"><nav className="nav-links" aria-label="Navigasi utama"><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Koleksi</NavLink><NavLink to="/stats" className={({ isActive }) => isActive ? 'active' : ''}>Statistik</NavLink></nav></header><main className="page-content"><Routes><Route path="/" element={<Home />} /><Route path="/stats" element={<Stats />} /></Routes></main><footer className="footer">BookShelf <span>•</span> Personal reading tracker</footer></div>
}

function App() { return <BrowserRouter><BookProvider><Layout /></BookProvider></BrowserRouter> }

export default App
