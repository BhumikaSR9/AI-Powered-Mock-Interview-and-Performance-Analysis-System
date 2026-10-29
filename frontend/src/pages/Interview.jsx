import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import VoiceRecorder from '../components/VoiceRecorder'
import FeedbackCard from '../components/FeedbackCard'

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.port === '3000' ? 'http://localhost:8000/api' : '/api')

// SVG Speaking Avatar Component with Animated Eye Blinks & Waveform Mouth
function InterviewerAvatar({ mode, isSpeaking }) {
  const getColors = () => {
    switch (mode) {
      case 'technical':
        return {
          glow: 'from-blue-500 to-cyan-500 shadow-cyan-500/20',
          bg: 'bg-slate-900 border-cyan-500/50',
          accent: 'fill-cyan-400',
          pulse: 'bg-cyan-500',
          name: 'Tech Lead Tyler'
        }
      case 'challenging':
        return {
          glow: 'from-amber-500 to-orange-500 shadow-amber-500/20',
          bg: 'bg-slate-900 border-amber-500/50',
          accent: 'fill-amber-400',
          pulse: 'bg-amber-500',
          name: 'Savage Critic Sam'
        }
      case 'pressure':
        return {
          glow: 'from-rose-500 to-red-600 shadow-rose-500/20',
          bg: 'bg-slate-900 border-rose-500/50',
          accent: 'fill-rose-400',
          pulse: 'bg-rose-500',
          name: 'Pressure Tester Paula'
        }
      case 'friendly':
      default:
        return {
          glow: 'from-emerald-500 to-teal-500 shadow-emerald-500/20',
          bg: 'bg-slate-900 border-emerald-500/50',
          accent: 'fill-emerald-400',
          pulse: 'bg-emerald-500',
          name: 'Friendly Coach Fiona'
        }
    }
  }

  const colors = getColors()

  return (
    <div className="flex flex-col items-center justify-center my-4">
      <div className="relative">
        {/* Ambient Ring Glow */}
        <motion.div
          animate={isSpeaking ? { scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] } : { scale: 1, opacity: 0.3 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className={`absolute inset-[-8px] rounded-full bg-gradient-to-tr ${colors.glow} blur-md`}
        />
        
        {/* Main Avatar Circular Frame */}
        <div className={`w-24 h-24 rounded-full border-2 ${colors.bg} flex items-center justify-center relative z-10 shadow-inner overflow-hidden`}>
          <svg className="w-14 h-14 text-slate-300" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="16" y="20" width="32" height="24" rx="8" className="stroke-current stroke-2 fill-slate-800" />
            <path d="M28 44V50H36V44" className="stroke-current stroke-2" />
            <rect x="10" y="28" width="6" height="8" rx="2" className="stroke-current fill-slate-700" />
            <rect x="48" y="28" width="6" height="8" rx="2" className="stroke-current fill-slate-700" />
            <path d="M32 20V12H38" className="stroke-current stroke-2" />
            <circle cx="38" cy="12" r="3" className={colors.accent} />
            
            {/* Eyes */}
            <motion.circle
              cx="26"
              cy="30"
              r="3.5"
              className={colors.accent}
              animate={isSpeaking ? { scaleY: [1, 0.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2.5 }}
            />
            <motion.circle
              cx="38"
              cy="30"
              r="3.5"
              className={colors.accent}
              animate={isSpeaking ? { scaleY: [1, 0.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2.5 }}
            />

            {/* Speaking Visualizer Mouth */}
            {isSpeaking ? (
              <motion.path
                d="M24 38 H40"
                className="stroke-current"
                strokeWidth="3.5"
                strokeLinecap="round"
                animate={{ d: ["M24 38 H40", "M24 38 Q32 44 40 38", "M24 38 H40"] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
              />
            ) : (
              <path d="M26 38 Q32 40 38 38" className="stroke-current" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </div>

        {/* Pulse Indicator */}
        {isSpeaking && (
          <span className="absolute bottom-0 right-0 flex h-4 w-4 z-20">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.pulse} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-4 w-4 ${colors.pulse}`}></span>
          </span>
        )}
      </div>
      
      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-primary-500 animate-pulse' : 'bg-slate-400'}`} />
        {colors.name}
      </span>
    </div>
  )
}

function Interview({ darkMode, setDarkMode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [role, setRole] = useState(location.state?.role || 'Python Developer')
  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [response, setResponse] = useState('')
  const [mode, setMode] = useState('friendly')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [responses, setResponses] = useState([])
  const [useVoice, setUseVoice] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Hint state
  const [hint, setHint] = useState('')
  const [hintLoading, setHintLoading] = useState(false)
  const [hintsUsedCount, setHintsUsedCount] = useState(0)

  // Pressure Mode state
  const [pressureMode] = useState(location.state?.pressureMode || false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [timerActive, setTimerActive] = useState(false)
  const [currentVolumeData, setCurrentVolumeData] = useState([])

  useEffect(() => {
    if (!role) {
      navigate('/')
      return
    }
    initializeSession()
  }, [role])

  useEffect(() => {
    if (pressureMode && questions.length > 0 && !feedback && !loading) {
      setTimeLeft(60)
      setTimerActive(true)
    } else {
      setTimerActive(false)
    }
  }, [currentQuestionIndex, questions, feedback, loading, pressureMode])

  useEffect(() => {
    let interval = null
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false)
      const forcedText = response.trim() ? response : "[No response submitted within 60s constraint]"
      setResponse(forcedText)
      handleSubmitResponse(forcedText)
    }
    return () => clearInterval(interval)
  }, [timerActive, timeLeft])

  const initializeSession = async () => {
    const loc = location.state || {}
    try {
      const res = await axios.post(`${API_BASE}/session`, {
        user_id: loc.userId || null,
        role: loc.role || role,
        difficulty: loc.difficulty || 'intermediate',
        interview_type: loc.interviewType || 'mixed',
        topics: loc.topics || [],
        question_count: loc.customQuestions ? loc.customQuestions.length : (loc.questionCount || 5),
        custom_questions: loc.customQuestions || null,
        strategy: "static"
      })
      setSessionId(res.data.session_id)
      setQuestions(res.data.questions)
    } catch (err) {
      console.error('Failed to initialize session:', err)
      const fallbackQs = [
        `Tell me about your experience and core technical skills as a ${role}.`,
        "Describe a difficult technical problem you solved and how you diagnosed the root cause.",
        "How do you ensure code maintainability, testing, and system performance?",
        "Describe a time when you received tough feedback and how you adapted.",
        "Do you have any questions for us about the architecture or team culture?"
      ]
      setQuestions(fallbackQs)
      setSessionId('offline-' + Date.now())
    }
  }

  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Match voice parameters to persona
      if (mode === 'technical') {
        utterance.rate = 1.0
        utterance.pitch = 0.95
      } else if (mode === 'challenging') {
        utterance.rate = 1.05
        utterance.pitch = 0.85
      } else if (mode === 'pressure') {
        utterance.rate = 1.15
        utterance.pitch = 1.05
      } else {
        utterance.rate = 0.95
        utterance.pitch = 1.1
      }
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
    }
  }

  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const timer = setTimeout(() => {
        speakQuestion(questions[currentQuestionIndex])
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentQuestionIndex, questions])

  const handleFetchHint = async () => {
    if (hint) {
      setHint('')
      return
    }
    setHintLoading(true)
    try {
      const q = questions[currentQuestionIndex]
      const res = await axios.post(`${API_BASE}/interview/hint`, {
        question: q,
        role: role
      })
      setHint(res.data.hint)
      setHintsUsedCount((prev) => prev + 1)
    } catch (err) {
      setHint("💡 Think about: Presenting your technical context clearly, describing the exact tools used, and concluding with quantifiable impact.")
    } finally {
      setHintLoading(false)
    }
  }

  const handleSkipQuestion = () => {
    const forcedResponse = "[Question skipped by candidate]"
    handleSubmitResponse(forcedResponse)
  }

  const handleEndEarly = () => {
    if (responses.length === 0) {
      navigate('/')
      return
    }
    navigate('/report', {
      state: {
        sessionId,
        role,
        responses
      }
    })
  }

  const handleSubmitResponse = async (forcedResponse = null) => {
    const finalResponse = forcedResponse || response
    if (!finalResponse.trim()) {
      alert('Please enter or record an answer before submitting.')
      return
    }

    setLoading(true)
    setIsSpeaking(false)
    setTimerActive(false)
    setHint('')
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()

    try {
      const question = questions[currentQuestionIndex]
      const res = await axios.post(
        `${API_BASE}/session/${sessionId}/response`,
        {
          question,
          response: finalResponse,
          mode,
          hints_used: hintsUsedCount
        }
      )

      setFeedback(res.data.feedback)
      const newResponseItem = {
        question,
        response: finalResponse,
        feedback: res.data.feedback,
        volumeData: currentVolumeData
      }
      setResponses((prev) => [...prev, newResponseItem])

      if (res.data.next_question && !questions.includes(res.data.next_question)) {
        setQuestions((prev) => [...prev, res.data.next_question])
      }
    } catch (error) {
      console.error('Failed to submit response:', error)
      alert('Network issue evaluating response. Fallback evaluation applied.')
    } finally {
      setLoading(false)
    }
  }

  const handleNextQuestion = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const currentResponses = [...responses]
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setResponse('')
      setFeedback(null)
      setHint('')
      setCurrentVolumeData([])
    } else {
      try {
        localStorage.setItem('latestSession', JSON.stringify({
          sessionId,
          role,
          responses: currentResponses
        }))
      } catch (e) {}

      navigate('/report', {
        state: {
          sessionId,
          role,
          responses: currentResponses
        }
      })
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-slate-200 transition-colors duration-300 flex flex-col">
      {/* Glow Blobs */}
      <div className="glow-blob w-[30rem] h-[30rem] top-[-5rem] left-[-5rem] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[120px]" />
      <div className="glow-blob w-[25rem] h-[25rem] bottom-[-5rem] right-[-5rem] bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-[100px]" />

      {/* Top Header */}
      <header className="relative z-10 px-4 sm:px-6 py-4 flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800/60 glass-panel">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            🎯
          </Link>
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 block -mb-0.5">
              PrepSense AI {pressureMode && '• ⏱️ Timed Mode'}
            </span>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Mock Interview: <span className="text-primary-600 dark:text-primary-400">{role}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            Q {currentQuestionIndex + 1} of {questions.length}
          </span>
          <button
            onClick={handleEndEarly}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
            title="Complete interview with current answers"
          >
            🛑 Finish Early
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/80 transition-all"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 relative z-10">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 via-indigo-500 to-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main Assessment Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="max-w-4xl w-full">
          <AnimatePresence mode="wait">
            {!feedback ? (
              <motion.div
                key="question"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass-panel rounded-3xl shadow-2xl p-6 sm:p-10 border border-slate-200/70 dark:border-slate-800/80 space-y-6"
              >
                {/* Resume Roast Banner if present */}
                {location.state?.roast && currentQuestionIndex === 0 && !response && (
                  <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                    <h3 className="text-xs uppercase font-extrabold text-rose-500 mb-1.5 flex items-center gap-1.5">
                      🔥 AI Resume Roast Critique
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                      "{location.state.roast}"
                    </p>
                  </div>
                )}

                {/* Animated AI Speaking Avatar */}
                <InterviewerAvatar mode={mode} isSpeaking={isSpeaking} />

                {/* Pressure Timer Badge */}
                {pressureMode && timerActive && (
                  <div className="flex justify-center items-center">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black border ${
                      timeLeft >= 30 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
                        : timeLeft >= 15 
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                        : 'bg-rose-500/10 text-rose-500 border-rose-500/30 animate-pulse'
                    }`}>
                      ⏱️ {timeLeft}s remaining
                    </span>
                  </div>
                )}

                {/* Question Display Card */}
                <div className="p-6 bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl flex justify-between items-start gap-4">
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white flex-1 leading-snug">
                    {currentQuestion || "Formulating personalized interview question..."}
                  </h2>
                  <button
                    onClick={() => speakQuestion(currentQuestion)}
                    disabled={!currentQuestion}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-lg transition-all active:scale-95 cursor-pointer"
                    title="Replay Voice Reading"
                  >
                    🔊
                  </button>
                </div>

                {/* Progressive Hint Drawer */}
                {hint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs leading-relaxed"
                  >
                    <span className="font-extrabold block mb-1">Coaching Directive:</span>
                    {hint}
                  </motion.div>
                )}

                {/* Persona Selector Bar */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 'friendly', label: '😊 Fiona', desc: 'Supportive Coach' },
                    { val: 'technical', label: '💻 Tyler', desc: 'Technical Lead' },
                    { val: 'challenging', label: '🔥 Sam', desc: 'Savage Critic' },
                    { val: 'pressure', label: '⏱️ Paula', desc: 'Pressure Constraint' }
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => setMode(item.val)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        mode === item.val
                          ? 'border-primary-500 bg-primary-500/10 text-primary-700 dark:text-primary-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20 text-slate-500'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 truncate">{item.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Input Method Toggle */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
                  <button
                    onClick={() => setUseVoice(false)}
                    className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      !useVoice
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    ⌨️ Keyboard Text
                  </button>
                  <button
                    onClick={() => setUseVoice(true)}
                    className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      useVoice
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    🎤 Live Speech Input
                  </button>
                </div>

                {/* Response Input Box */}
                {useVoice ? (
                  <VoiceRecorder
                    onTranscript={(text) => setResponse(text)}
                    onVolumeData={(volumeList) => setCurrentVolumeData(volumeList)}
                    darkMode={darkMode}
                  />
                ) : (
                  <div className="relative">
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Type your structured answer here (Hint: Situation, Task, Action, and measurable Result)..."
                      className="w-full h-44 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                    />
                    <div className="absolute bottom-3 right-3 text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md font-bold">
                      {response.split(/\s+/).filter(Boolean).length} words
                    </div>
                  </div>
                )}

                {/* Question Action Controls */}
                <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleFetchHint}
                      disabled={hintLoading}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      {hintLoading ? 'Generating Hint...' : (hint ? 'Hide Hint' : '💡 Need a Hint?')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipQuestion}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-all cursor-pointer"
                    >
                      ⏭️ Skip
                    </button>
                  </div>

                  <button
                    onClick={() => handleSubmitResponse()}
                    disabled={loading || !response.trim()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 via-indigo-600 to-cyan-500 hover:from-primary-700 text-white font-bold text-xs shadow-lg shadow-primary-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Evaluating Answer...' : 'Submit & Analyze →'}
                  </button>
                </div>

              </motion.div>
            ) : (
              <FeedbackCard
                feedback={feedback}
                darkMode={darkMode}
                onNext={handleNextQuestion}
                nextButtonText={currentQuestionIndex < questions.length - 1 ? 'Next Question →' : 'View Placement Report →'}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default Interview
