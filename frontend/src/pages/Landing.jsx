import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import Navbar from '../components/Navbar'

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.port === '3000' ? 'http://localhost:8000/api' : '/api')

function Landing({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  
  // Custom interview configuration state
  const [selectedRole, setSelectedRole] = useState('Python Developer')
  const [customRoleText, setCustomRoleText] = useState('')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [interviewType, setInterviewType] = useState('technical')
  const [selectedTopics, setSelectedTopics] = useState(['Python', 'OOPs'])
  const [questionCount, setQuestionCount] = useState(5)
  const [pressureMode, setPressureMode] = useState(false)
  
  // Resume upload state
  const [resumeFile, setResumeFile] = useState(null)
  const [roastMode, setRoastMode] = useState(false)
  const [loading, setLoading] = useState(false)

  // Reviews state
  const [reviews, setReviews] = useState([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    name: '',
    role: 'Software Engineer',
    company: 'Leading Tech Company',
    college: 'Tech Professional',
    rating: 5,
    comment: ''
  })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)

  const predefinedRoles = [
    'Python Developer',
    'Machine Learning Engineer',
    'Data Analyst',
    'Software Engineer',
    'HR & Behavioral',
    'DevOps Engineer',
    'Custom Role'
  ]

  const availableTopics = [
    'Python', 'Machine Learning', 'SQL & Databases', 'OOPs Concepts',
    'System Design', 'Data Structures', 'FastAPI/REST', 'Git & Docker'
  ]

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API_BASE}/reviews`)
      if (res.data.reviews) {
        setReviews(res.data.reviews)
      }
    } catch (err) {
      console.error('Failed to load reviews:', err)
    }
  }

  const handleTopicToggle = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic))
    } else {
      setSelectedTopics([...selectedTopics, topic])
    }
  }

  const handleStartInterview = async () => {
    const finalRole = selectedRole === 'Custom Role' ? (customRoleText.trim() || 'Software Engineer') : selectedRole
    setLoading(true)

    // Retrieve active logged in user if any
    let userId = null
    try {
      const u = JSON.parse(localStorage.getItem('prepsense_user') || 'null')
      if (u) userId = u.id
    } catch {}

    if (resumeFile) {
      try {
        const formData = new FormData()
        formData.append('file', resumeFile)
        formData.append('role', finalRole)
        formData.append('roast_mode', roastMode)

        const uploadRes = await fetch(`${API_BASE}/upload-resume`, {
          method: 'POST',
          body: formData
        })

        if (!uploadRes.ok) throw new Error('Resume parsing failed')
        const data = await uploadRes.json()

        navigate('/interview', {
          state: {
            role: finalRole,
            userId,
            difficulty,
            interviewType: 'resume',
            topics: selectedTopics,
            customQuestions: data.questions,
            roast: data.roast,
            pressureMode: pressureMode
          }
        })
      } catch (error) {
        console.error('Error uploading resume:', error)
        alert('Could not parse resume. Starting standard practice questions instead.')
        navigate('/interview', {
          state: {
            role: finalRole,
            userId,
            difficulty,
            interviewType,
            topics: selectedTopics,
            pressureMode: pressureMode
          }
        })
      } finally {
        setLoading(false)
      }
    } else {
      navigate('/interview', {
        state: {
          role: finalRole,
          userId,
          difficulty,
          interviewType,
          topics: selectedTopics,
          questionCount,
          pressureMode: pressureMode
        }
      })
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setReviewSubmitting(true)
    try {
      const res = await axios.post(`${API_BASE}/reviews`, reviewForm)
      setReviews([res.data.review, ...reviews])
      setReviewSuccess(true)
      setTimeout(() => {
        setReviewSuccess(false)
        setShowReviewModal(false)
        setReviewForm({
          name: '',
          role: 'Software Engineer',
          company: 'Leading Tech Company',
          college: 'Tech Professional',
          rating: 5,
          comment: ''
        })
      }, 1200)
    } catch (err) {
      alert('Failed to submit review. Please try again.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-slate-200 transition-colors duration-300 flex flex-col">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* Decorative Glow Blobs */}
      <div className="glow-blob w-[45rem] h-[45rem] top-[-10rem] left-[-15rem] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[140px]" />
      <div className="glow-blob w-[40rem] h-[40rem] bottom-[-10rem] right-[-15rem] bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-[140px]" />

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-primary-100 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/40 shadow-sm"
          >
            <span>⚡ NEXT-GEN AI INTERVIEW PLATFORM</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ENTERPRISE TALENT INTELLIGENCE</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]"
          >
            Master Tech Interviews with{' '}
            <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-cyan-500 dark:from-primary-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent">
              Autonomous AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-350 leading-relaxed font-light"
          >
            Experience dynamic voice questioning, real-time audio volume dynamics, STAR framework scoring (0–100 scale), resume roasting, and personalized revision roadmaps.
          </motion.p>
        </div>

        {/* Custom Interview Setup Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-200/70 dark:border-slate-800/80 shadow-2xl space-y-8"
        >
          <div className="border-b border-slate-200/60 dark:border-slate-800/60 pb-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>⚙️</span> Customize Your AI Mock Interview
              </h2>
              <span className="text-xs text-slate-400">Configure target role, difficulty, interview type, and assessment parameters</span>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 border border-primary-200/40">
              Interactive Setup
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Left Column: Role, Difficulty, Type */}
            <div className="space-y-6">
              
              {/* Target Role Selector */}
              <div>
                <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  1. Target Job Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {predefinedRoles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`p-3 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                        selectedRole === r
                          ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20'
                          : 'bg-white/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {selectedRole === 'Custom Role' && (
                  <input
                    type="text"
                    placeholder="Enter custom role (e.g. Cloud Security Architect)..."
                    value={customRoleText}
                    onChange={(e) => setCustomRoleText(e.target.value)}
                    className="mt-3 w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-primary-500"
                  />
                )}
              </div>

              {/* Difficulty Selection */}
              <div>
                <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  2. Assessment Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'beginner', label: '🟢 Beginner', sub: 'Fundamentals & Syntax' },
                    { id: 'intermediate', label: '🟡 Intermediate', sub: 'Standard Tech Round' },
                    { id: 'advanced', label: '🔴 Advanced', sub: 'Architecture & Scalability' }
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setDifficulty(lvl.id)}
                      className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                        difficulty === lvl.id
                          ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold'
                          : 'border-slate-200 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold">{lvl.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{lvl.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interview Category / Type */}
              <div>
                <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  3. Interview Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'technical', label: '💻 Technical' },
                    { id: 'hr', label: '🤝 HR & Behavioral' },
                    { id: 'mixed', label: '⚡ Mixed Round' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setInterviewType(t.id)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                        interviewType === t.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Topics, Question Count, Pressure Mode & Resume */}
            <div className="space-y-6">
              
              {/* Topics Selection */}
              <div>
                <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  4. Topic Focus Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableTopics.map((top) => {
                    const isSelected = selectedTopics.includes(top)
                    return (
                      <button
                        key={top}
                        type="button"
                        onClick={() => handleTopicToggle(top)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{top}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Questions Count & Pressure Mode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Question Count
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                  >
                    <option value={3}>3 Questions (Quick Sprint)</option>
                    <option value={5}>5 Questions (Standard Mock)</option>
                    <option value={10}>10 Questions (Deep Assessment)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Timed Constraint
                  </label>
                  <button
                    type="button"
                    onClick={() => setPressureMode(!pressureMode)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 h-[42px] ${
                      pressureMode
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        : 'bg-white/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    <span>⏱️</span> {pressureMode ? 'Pressure (60s Timer)' : 'Untimed Practice'}
                  </button>
                </div>
              </div>

              {/* PDF Resume Upload with Roast Option */}
              <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>📄</span> Optional: Resume-Based Interview (.PDF)
                  </span>
                  {resumeFile && (
                    <span className="text-[10px] font-bold text-emerald-500">
                      ✓ {resumeFile.name.slice(0, 18)}...
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setResumeFile(e.target.files[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />

                {resumeFile && (
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-500">Activate Resume Roast mode?</span>
                    <button
                      type="button"
                      onClick={() => setRoastMode(!roastMode)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        roastMode
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {roastMode ? '🔥 Roast ON' : 'Off'}
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Launch Action Button */}
          <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Full AI Evaluation with STAR metrics, subscores, audio tone & PDF analytics</span>
            </div>

            <button
              onClick={handleStartInterview}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-600 via-indigo-600 to-cyan-500 hover:from-primary-700 hover:via-indigo-700 hover:to-cyan-600 text-white font-black text-sm tracking-wide shadow-xl shadow-primary-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Assembling AI Interview Room...</span>
              ) : (
                <>
                  <span>🚀 Launch AI Mock Interview</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>

        </motion.div>

        {/* 6 Core Platform Capabilities */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Enterprise AI Capabilities & Architecture
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Powered by advanced NLP, Large Language Models, real-time audio analytics, and persistent evaluation intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: '1. Intelligent Answer Evaluator', icon: '🧠', desc: 'Analyzes technical depth (40%), communication clarity (30%), and STAR structure (30%) against elite industry hiring benchmarks.' },
              { title: '2. Multi-Persona Speech Synthesis', icon: '🎙️', desc: 'Web Speech API synthesis with four distinct personas: Friendly Fiona, Tech Tyler, Savage Sam, and Pressure Paula.' },
              { title: '3. Real-Time Waveform & Fillers', icon: '📊', desc: 'Captures micro-volume decibels and regex pattern-detects verbal crutches (um, like, basically) dynamically.' },
              { title: '4. Progressive In-Session Hinting', icon: '💡', desc: 'Offers progressive coaching hints during practice mode to guide candidates without spoiling ideal responses.' },
              { title: '5. Resume Extraction & Roasting', icon: '📄', desc: 'Parses PDF resumes with PyPDF to generate project-targeted questions and witty, constructive critique.' },
              { title: '6. SQLite Persistence & jsPDF', icon: '💾', desc: 'Permanent relational database schema tracking candidate progress, history graphs, and downloadable PDF dossiers.' }
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl glass-card border border-slate-200/50 dark:border-slate-800/60 flex flex-col justify-between">
                <span className="text-2xl mb-3">{f.icon}</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{f.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Candidate Reviews & Placement Testimonials Section */}
        <section id="reviews" className="space-y-6 pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Candidate Placement Reviews
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verified feedback from candidates and engineers hired at top tech companies
              </p>
            </div>

            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>✍️</span> Leave Your Review
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((rev) => (
              <motion.div
                key={rev.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl glass-panel border border-slate-200/60 dark:border-slate-800/70 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex text-amber-400 text-xs">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {rev.company}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-350 italic font-light leading-relaxed mb-4">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {rev.avatar_initials || 'AI'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{rev.name}</h5>
                    <span className="text-[10px] text-slate-400 block">{rev.role} {rev.college ? `• ${rev.college}` : ''}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </main>

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <span className="text-3xl block mb-2">⭐</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Share Your Interview Feedback
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your review will be saved to the database and displayed on the placement wall.
              </p>
            </div>

            {reviewSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-center text-sm">
                ✓ Review saved successfully! Thank you.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bhumika Sharma"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">Target Role</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SDE-1"
                      value={reviewForm.role}
                      onChange={(e) => setReviewForm({ ...reviewForm, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">Company / College</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Google / IIT"
                      value={reviewForm.company}
                      onChange={(e) => setReviewForm({ ...reviewForm, company: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">Star Rating</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-amber-500 outline-none"
                  >
                    <option value={5}>★★★★★ (5 Stars - Exceptional)</option>
                    <option value={4}>★★★★☆ (4 Stars - Very Helpful)</option>
                    <option value={3}>★★★☆☆ (3 Stars - Average)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">Your Review & Experience</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="How did PrepSense AI help your interview preparation?"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50 transition-all"
                >
                  {reviewSubmitting ? 'Posting Review...' : 'Publish Candidate Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 py-6 text-center text-xs text-slate-400">
        <p>© 2026 PrepSense AI Inc. • Autonomous Multi-Modal AI Interview & Placement Intelligence Engine • All Rights Reserved</p>
      </footer>
    </div>
  )
}

export default Landing
