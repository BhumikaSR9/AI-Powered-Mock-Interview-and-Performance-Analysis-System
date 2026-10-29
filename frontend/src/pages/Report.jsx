import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import jsPDF from 'jspdf'
import Navbar from '../components/Navbar'

const API_BASE = import.meta.env.VITE_API_BASE || (window.location.port === '3000' ? 'http://localhost:8000/api' : '/api')

function Report({ darkMode, setDarkMode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedIndex, setExpandedIndex] = useState(0)
  
  const locationState = location.state || {}
  const cached = !locationState.sessionId ? (() => {
    try {
      return JSON.parse(localStorage.getItem('latestSession') || 'null')
    } catch {
      return null
    }
  })() : null

  const activeState = locationState.sessionId ? locationState : (cached || {})
  const { sessionId, role, responses: initialResponses } = activeState

  useEffect(() => {
    if (!sessionId) {
      navigate('/')
      return
    }
    fetchReport()
  }, [sessionId])

  const fetchReport = async () => {
    try {
      // Fetch fresh aggregated report from backend (updates SQLite)
      const res = await axios.get(`${API_BASE}/session/${sessionId}/report`)
      setReport(res.data)
    } catch (err) {
      console.warn('Backend report fetch fallback, computing locally:', err)
      if (initialResponses && initialResponses.length > 0) {
        const scores = initialResponses.map(r => Number(r.feedback?.score_100 || (r.feedback?.score * 10) || 65))
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        const totalFillers = initialResponses.reduce((sum, r) => sum + (Number(r.feedback?.filler_words_count) || 0), 0)
        const tones = initialResponses.map(r => r.feedback?.tone || 'neutral')
        const mostTone = tones.sort((a, b) => tones.filter(v => v === a).length - tones.filter(v => v === b).length).pop() || 'confident'

        const allTips = initialResponses.flatMap(r => r.feedback?.improvement_tips || [])
        const allMissing = initialResponses.flatMap(r => r.feedback?.missing_concepts || [])
        const allStrengths = initialResponses.flatMap(r => r.feedback?.strengths || [])

        setReport({
          session_id: sessionId,
          role: role || 'Software Engineer',
          total_questions: initialResponses.length,
          answered_questions: initialResponses.length,
          average_score: avg,
          score_100: avg,
          subscores: {
            tech_score: Math.round(avg * 0.4),
            comm_score: Math.round(avg * 0.3),
            star_score: Math.round(avg * 0.3)
          },
          overall_tone: mostTone,
          total_filler_words: totalFillers,
          responses: initialResponses,
          improvement_tips: [...new Set(allTips)].slice(0, 5),
          missing_concepts: [...new Set(allMissing)].slice(0, 4),
          candidate_strengths: [...new Set(allStrengths)].slice(0, 4),
          recommended_revision_topics: ['STAR Structure Mastery', 'Quantitative Metric Outlining', 'Technical Architecture Justification'],
          score_breakdown: {
            min: Math.min(...scores),
            max: Math.max(...scores),
            average: avg
          }
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    if (!report) return

    const doc = new jsPDF()
    const margin = 20
    let yPos = margin

    // Header styled banner
    doc.setFillColor(79, 70, 229) // Indigo-600
    doc.rect(0, 0, 210, 45, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('PREPSENSE AI - EXECUTIVE INTERVIEW ASSESSMENT', margin, 20)
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Candidate Evaluation: ${report.role}  |  Date: ${new Date().toLocaleDateString()}`, margin, 32)
    
    yPos = 55
    doc.setTextColor(30, 41, 59)

    // Performance Summary block
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.text('Performance Evaluation Matrix (100-Point Scale)', margin, yPos)
    yPos += 10
    
    const finalScore = report.score_100 || report.average_score || 0
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`• Overall Interview Score: ${finalScore} / 100 (${finalScore >= 85 ? 'Grade A+ • Placement Ready' : finalScore >= 70 ? 'Grade A • Strong Candidate' : 'Grade B • Developing'})`, margin + 5, yPos)
    yPos += 7
    doc.text(`• Technical Depth Score:  ${report.subscores?.tech_score ?? Math.round(finalScore * 0.4)} / 40`, margin + 5, yPos)
    yPos += 7
    doc.text(`• Communication & Pacing: ${report.subscores?.comm_score ?? Math.round(finalScore * 0.3)} / 30`, margin + 5, yPos)
    yPos += 7
    doc.text(`• STAR Method Completeness: ${report.subscores?.star_score ?? Math.round(finalScore * 0.3)} / 30`, margin + 5, yPos)
    yPos += 7
    doc.text(`• Speech Tone: ${(report.overall_tone || 'confident').toUpperCase()}  |  Verbal Fillers Detected: ${report.total_filler_words}`, margin + 5, yPos)
    yPos += 14

    // Coaching Guidelines block
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Targeted Revision Recommendations', margin, yPos)
    yPos += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const tipsToPrint = report.improvement_tips || []
    tipsToPrint.forEach((tip, idx) => {
      const split = doc.splitTextToSize(`${idx + 1}. ${tip}`, 170)
      split.forEach(line => {
        if (yPos > 275) { doc.addPage(); yPos = margin; }
        doc.text(line, margin + 5, yPos)
        yPos += 6
      })
    })

    yPos += 8
    if (yPos > 240) { doc.addPage(); yPos = margin; }

    // Detailed responses
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Question Evaluations & Model Answers', margin, yPos)
    yPos += 10

    report.responses.forEach((item, idx) => {
      if (yPos > 230) { doc.addPage(); yPos = margin; }

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`Q${idx + 1}: ${item.question}`, margin, yPos)
      yPos += 6

      doc.setFontSize(9)
      doc.setFont('helvetica', 'oblique')
      const splitResp = doc.splitTextToSize(`Candidate: "${item.response}"`, 170)
      splitResp.forEach(line => {
        if (yPos > 275) { doc.addPage(); yPos = margin; }
        doc.text(line, margin + 5, yPos)
        yPos += 5
      })

      yPos += 2
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      const sVal = item.feedback?.score_100 || (item.feedback?.score ? item.feedback.score * 10 : 70)
      doc.text(`Score: ${sVal}/100  |  Tone: ${item.feedback?.tone}  |  Fillers: ${item.feedback?.filler_words_count || 0}`, margin + 5, yPos)
      yPos += 10
    })

    doc.save(`PrepSense-AI-Report-${report.role.replace(/\s+/g, '-')}-${Date.now()}.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkBg text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-bold text-base">Generating Comprehensive Evaluation Dossier...</span>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkBg">
        <div className="text-center p-8 glass-panel rounded-2xl max-w-sm">
          <span className="text-4xl block mb-3">⚠️</span>
          <h3 className="text-lg font-bold text-rose-500 mb-2">No Report Found</h3>
          <Link to="/" className="mt-4 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold inline-block">
            Take a Mock Interview
          </Link>
        </div>
      </div>
    )
  }

  const finalScore = report.score_100 || report.average_score || 0
  const sub = report.subscores || {
    tech_score: Math.round(finalScore * 0.4),
    comm_score: Math.round(finalScore * 0.3),
    star_score: Math.round(finalScore * 0.3)
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-slate-200 transition-colors duration-300 flex flex-col">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* Glow Blobs */}
      <div className="glow-blob w-[40rem] h-[40rem] top-[-10rem] left-[-10rem] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[140px]" />
      <div className="glow-blob w-[35rem] h-[35rem] bottom-[-10rem] right-[-10rem] bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-[140px]" />

      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/70 dark:border-slate-800/80 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 block mb-1">
              Assessment Completed • Securely Persisted
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Executive Interview Performance Analytics: <span className="text-primary-600 dark:text-primary-400">{report.role}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToPDF}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 text-white font-bold text-xs shadow-lg shadow-primary-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>📄</span> Export Official PDF Report
            </button>
            <Link
              to="/dashboard"
              className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all"
            >
              📊 Dashboard
            </Link>
          </div>
        </div>

        {/* 100-Point Score Banner & Subscore Meters */}
        <div className="grid md:grid-cols-4 gap-6 items-stretch">
          
          {/* Main 100-Point Score Card */}
          <div className="p-6 rounded-3xl glass-card flex flex-col justify-between items-center text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Candidate Score</span>
            <div className="relative my-2">
              <span className={`text-5xl sm:text-6xl font-black ${
                finalScore >= 80 ? 'text-emerald-500' : finalScore >= 60 ? 'text-amber-500' : 'text-rose-500'
              }`}>
                {finalScore}
              </span>
              <span className="text-xs font-bold text-slate-400 block mt-1">/ 100 POINTS</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
              finalScore >= 80 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            }`}>
              {finalScore >= 85 ? 'Grade A+ • Interview Ready' : finalScore >= 70 ? 'Grade A • Strong Candidate' : 'Grade B • Developing'}
            </span>
          </div>

          {/* 3 Sub-Score Meters */}
          <div className="md:col-span-3 p-6 sm:p-8 rounded-3xl glass-panel border border-slate-200/60 dark:border-slate-800/70 space-y-4 flex flex-col justify-center">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>📊</span> Performance Dimension Breakdown (Industry Rubric)
            </h3>

            {/* Technical Depth */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-800 dark:text-slate-200">Technical Depth & Concepts</span>
                <span className="text-primary-600 dark:text-primary-400 font-extrabold">{sub.tech_score} / 40</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(sub.tech_score / 40) * 100}%` }} />
              </div>
            </div>

            {/* Communication */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-800 dark:text-slate-200">Communication Clarity & Pace ({report.total_filler_words} Fillers)</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{sub.comm_score} / 30</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(sub.comm_score / 30) * 100}%` }} />
              </div>
            </div>

            {/* STAR Completeness */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-800 dark:text-slate-200">STAR Methodology & Quantified Impact</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{sub.star_score} / 30</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(sub.star_score / 30) * 100}%` }} />
              </div>
            </div>
          </div>

        </div>

        {/* Strengths & Missing Concepts & Revision Roadmap */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Missing Concepts & Weak Areas */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-200/60 dark:border-slate-800/70 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <span>⚠️</span> Concepts to Reinforce Next Time
            </h3>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-350">
              {(report.missing_concepts && report.missing_concepts.length > 0 ? report.missing_concepts : [
                'State specific production metrics (% latency improvement, throughput)',
                'Detail architectural alternatives considered before choosing solution',
                'Frame answers explicitly using Situation, Task, Action, and Result'
              ]).map((c, i) => (
                <li key={i} className="flex items-start gap-2 p-2 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Revision Roadmap Topics */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-200/60 dark:border-slate-800/70 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-primary-600 dark:text-primary-400 flex items-center gap-2">
              <span>📚</span> Recommended Revision Topics for Placement
            </h3>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-350">
              {(report.recommended_revision_topics || [
                'STAR Narrative Structuring',
                'Memory Management & Concurrency',
                'SQL Query Execution & Window Functions'
              ]).map((top, i) => (
                <li key={i} className="flex items-center justify-between p-2 rounded-xl bg-primary-500/5 border border-primary-500/20">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{top}</span>
                  <span className="text-[10px] font-extrabold uppercase text-primary-600 dark:text-primary-400">High Yield</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Detailed Accordion of Question Evaluations & Ideal Answers */}
        <div className="space-y-4">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>📝</span> Transcript & Model Answer Comparisons
          </h3>

          <div className="space-y-4">
            {report.responses.map((item, idx) => {
              const isExpanded = expandedIndex === idx
              const sVal = item.feedback?.score_100 || (item.feedback?.score ? item.feedback.score * 10 : 70)
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-slate-200/60 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40 overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-100/40 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 pr-4">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                        Question {idx + 1}
                      </span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {item.question}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-xl text-xs font-black border ${
                        sVal >= 80 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}>
                        {sVal} / 100
                      </span>
                      <span className="text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="border-t border-slate-200/60 dark:border-slate-800/60 overflow-hidden"
                      >
                        <div className="p-6 bg-slate-100/30 dark:bg-slate-900/30 space-y-5">
                          
                          {/* Submitted Answer */}
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                              Your Submitted Response
                            </span>
                            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 italic font-light leading-relaxed">
                              "{item.response}"
                            </p>
                          </div>

                          {/* Coach Evaluation Critique */}
                          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                              AI Coach Critique
                            </span>
                            <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-light">
                              {item.feedback?.summary}
                            </p>
                          </div>

                          {/* Model 10/10 Ideal Answer */}
                          {item.feedback?.ideal_answer && (
                            <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-900/50">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1 flex items-center gap-1.5">
                                <span>🏆</span> Model 10/10 Exemplary Answer (Study Guide)
                              </span>
                              <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                "{item.feedback.ideal_answer}"
                              </p>
                            </div>
                          )}

                          {/* Speech Volume & Dynamics if recorded */}
                          {item.volumeData && item.volumeData.length > 0 && (
                            <div className="pt-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                                🎤 Speech Dynamics & Pace Profile
                              </span>
                              <div className="w-full h-20 bg-slate-950/80 rounded-xl p-2 flex flex-col justify-between">
                                <svg className="w-full h-full" viewBox="0 0 500 80" preserveAspectRatio="none">
                                  <path
                                    d={`M ${item.volumeData.map((v, i) => `${(i / (item.volumeData.length - 1)) * 500} ${80 - (v / 100) * 70}`).join(' L ')}`}
                                    fill="none"
                                    stroke="#8b5cf6"
                                    strokeWidth="2"
                                  />
                                </svg>
                                <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                                  <span>Answer Start</span>
                                  <span>Vocal Consistency</span>
                                  <span>Answer Conclusion</span>
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>

      </main>
    </div>
  )
}

export default Report
