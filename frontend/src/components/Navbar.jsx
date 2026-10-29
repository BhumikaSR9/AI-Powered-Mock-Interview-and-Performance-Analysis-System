import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.port === '3000' ? 'http://localhost:8000/api' : '/api')

function Navbar({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('prepsense_user') || 'null')
    } catch {
      return null
    }
  })
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    college: 'Computer Science & Engineering',
    target_role: 'Software Engineer'
  })
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      if (isLogin) {
        const res = await axios.post(`${API_BASE}/auth/login`, {
          username_or_email: formData.email || formData.username,
          password: formData.password
        })
        localStorage.setItem('prepsense_user', JSON.stringify(res.data.user))
        setUser(res.data.user)
        setShowAuthModal(false)
      } else {
        const res = await axios.post(`${API_BASE}/auth/register`, {
          username: formData.username || formData.email.split('@')[0],
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || 'Candidate',
          college: formData.college,
          target_role: formData.target_role
        })
        localStorage.setItem('prepsense_user', JSON.stringify(res.data.user))
        setUser(res.data.user)
        setShowAuthModal(false)
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Authentication failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        username_or_email: 'bhumika@example.com',
        password: 'demo123'
      })
      localStorage.setItem('prepsense_user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      setShowAuthModal(false)
    } catch {
      // Offline fallback demo user
      const demoUser = {
        id: 1,
        full_name: 'Bhumika (Demo Account)',
        email: 'bhumika@example.com',
        college: 'Computer Science & Engineering',
        target_role: 'Machine Learning Engineer',
        experience_level: 'Intermediate'
      }
      localStorage.setItem('prepsense_user', JSON.stringify(demoUser))
      setUser(demoUser)
      setShowAuthModal(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('prepsense_user')
    setUser(null)
  }

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/70 dark:border-slate-800/80 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-primary-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              {/* Neural/Hexagon SVG Logo */}
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-600 via-primary-600 to-cyan-500 dark:from-indigo-400 dark:via-primary-300 dark:to-cyan-300 bg-clip-text text-transparent">
                  PrepSense<span className="text-primary-500 dark:text-cyan-400">.ai</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 border border-primary-300/40 dark:border-primary-700/40">
                  AI/ML
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium hidden sm:block -mt-0.5">
                Autonomous AI Interview & Talent Intelligence Platform
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-600 dark:text-slate-350">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-xl transition-all ${
                location.pathname === '/' 
                  ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              🎯 Mock Interview
            </Link>
            <Link
              to="/dashboard"
              className={`px-3.5 py-2 rounded-xl transition-all ${
                location.pathname === '/dashboard' 
                  ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              📊 Dashboard
            </Link>
            <a
              href="/#reviews"
              className="px-3.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all"
            >
              ⭐ Placement Reviews
            </a>
          </nav>

          {/* Right Action Icons & User Account */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                  title="View Profile & History"
                >
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-primary-500 to-indigo-500 text-white flex items-center justify-center text-[10px] font-black">
                    {user.full_name?.charAt(0) || 'U'}
                  </span>
                  <span className="max-w-[120px] truncate">{user.full_name?.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-400 hover:text-rose-500 font-semibold px-2 py-1 transition-colors"
                  title="Logout"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-primary-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>👤</span> Student Login
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-base transition-all duration-200 active:scale-95 border border-slate-200/70 dark:border-slate-700/70"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

        </div>
      </header>

      {/* Auth Modal (Sign in / Sign up) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-primary-500/30">
                🎯
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {isLogin ? 'Welcome Back!' : 'Join PrepSense AI'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isLogin ? 'Sign in to access your interview scores and history' : 'Create your student candidate profile for placement training'}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bhumika Sharma"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">Education / Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science, M.S. or B.S."
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="candidate@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-primary-500/25 cursor-pointer disabled:opacity-50 transition-all"
              >
                {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Profile')}
              </button>
            </form>

            {/* Quick 1-Click Demo Login */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <span>⚡</span> 1-Click Instant Demo Login
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
                className="text-xs text-primary-600 dark:text-primary-400 font-bold hover:underline cursor-pointer"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
