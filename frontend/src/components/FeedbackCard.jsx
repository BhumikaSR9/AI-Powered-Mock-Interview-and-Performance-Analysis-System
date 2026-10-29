import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function FeedbackCard({ feedback, darkMode, onNext, nextButtonText }) {
  const [showIdealAnswer, setShowIdealAnswer] = useState(false)
  if (!feedback) return null

  const score100 = feedback.score_100 || (feedback.score ? feedback.score * 10 : 60)
  const techScore = feedback.tech_score || Math.round(score100 * 0.4)
  const commScore = feedback.comm_score || Math.round(score100 * 0.3)
  const starScore = feedback.star_score || Math.round(score100 * 0.3)

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-rose-500'
  }

  const getToneBadge = (tone) => {
    switch ((tone || '').toLowerCase()) {
      case 'confident':
        return {
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          label: 'Confident 🎯'
        }
      case 'uncertain':
        return {
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          label: 'Uncertain ❓'
        }
      case 'neutral':
      default:
        return {
          bg: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20',
          label: 'Neutral ⚖️'
        }
    }
  }

  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score100 / 100) * circumference
  const toneInfo = getToneBadge(feedback.tone || 'neutral')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/70 dark:border-slate-800/80 space-y-6"
    >
      {/* Header with Title and Next Button */}
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-5 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Evaluation & AI Critique
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 border border-primary-300/40">
              100-Mark Rubric
            </span>
          </div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
            Instant Cognitive Assessment
          </span>
        </div>

        {onNext && (
          <button
            onClick={onNext}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>{nextButtonText || 'Next Question'}</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Score Grid: Circle Gauge & Subscores */}
      <div className="grid md:grid-cols-3 gap-6 items-center">
        
        {/* Animated Circular Score Gauge */}
        <div className="flex flex-col items-center justify-center p-5 bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl">
          <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2">
            Total Score
          </span>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-200 dark:stroke-slate-800/50"
                strokeWidth="7"
                fill="transparent"
              />
              <motion.circle
                cx="50"
                cy="50"
                r={radius}
                className={score100 >= 80 ? 'stroke-emerald-500' : score100 >= 60 ? 'stroke-amber-500' : 'stroke-rose-500'}
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-3xl font-black ${getScoreColor(score100)}`}>
                {score100}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">/ 100</span>
            </div>
          </div>
          <span className={`mt-2 text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${toneInfo.bg}`}>
            {toneInfo.label}
          </span>
        </div>

        {/* Sub-Score Meters (Tech 40, Comm 30, STAR 30) */}
        <div className="md:col-span-2 space-y-4 p-5 bg-slate-100/30 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
            <span>📊</span> Academic Scoring Breakdown
          </h4>

          {/* Technical Depth */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-700 dark:text-slate-300">Technical Depth & Concept Accuracy</span>
              <span className="text-primary-600 dark:text-primary-400 font-extrabold">{techScore} / 40</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all duration-700" style={{ width: `${(techScore / 40) * 100}%` }} />
            </div>
          </div>

          {/* Communication & Filler Control */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-700 dark:text-slate-300">Communication & Pacing ({feedback.filler_words_count || 0} fillers)</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{commScore} / 30</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${(commScore / 30) * 100}%` }} />
            </div>
          </div>

          {/* STAR Method / Completeness */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-700 dark:text-slate-300">STAR Structure & Quantifiable Results</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{starScore} / 30</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${(starScore / 30) * 100}%` }} />
            </div>
          </div>
        </div>

      </div>

      {/* Coach Evaluation Summary */}
      <div className="p-5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
          <span>🧠</span> AI Coach Feedback
        </h4>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-350 leading-relaxed font-light">
          {feedback.summary}
        </p>
      </div>

      {/* Strengths & Missing Concepts Pills */}
      <div className="grid sm:grid-cols-2 gap-4">
        
        {/* Candidate Strengths */}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-2 flex items-center gap-1.5">
              <span>✓</span> Observed Strengths
            </span>
            <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              {feedback.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-500">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Concepts */}
        {feedback.missing_concepts && feedback.missing_concepts.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-2 flex items-center gap-1.5">
              <span>⚠️</span> Concepts to Mention Next Time
            </span>
            <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              {feedback.missing_concepts.map((m, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-500">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Actionable Improvement Tips */}
      {feedback.improvement_tips && feedback.improvement_tips.length > 0 && (
        <div className="p-5 rounded-2xl bg-primary-50/50 dark:bg-primary-950/20 border border-primary-200/50 dark:border-primary-800/40">
          <span className="text-xs font-extrabold uppercase tracking-wider text-primary-700 dark:text-primary-300 block mb-3 flex items-center gap-1.5">
            <span>💡</span> Tactical Improvement Directives
          </span>
          <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-350">
            {feedback.improvement_tips.map((tip, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="w-5 h-5 rounded-lg bg-primary-600/10 text-primary-600 dark:text-primary-400 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exemplary 10/10 Model Answer Toggle */}
      {feedback.ideal_answer && (
        <div className="border border-indigo-200/60 dark:border-indigo-900/60 rounded-2xl overflow-hidden bg-indigo-50/20 dark:bg-indigo-950/20">
          <button
            type="button"
            onClick={() => setShowIdealAnswer(!showIdealAnswer)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-indigo-100/30 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🏆</span>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                View Exemplary 10/10 Model Answer
              </span>
            </div>
            <span className="text-indigo-500 text-xs font-bold">{showIdealAnswer ? 'Hide ▲' : 'Show ▼'}</span>
          </button>

          <AnimatePresence>
            {showIdealAnswer && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-4 pt-0 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic border-t border-indigo-200/40 dark:border-indigo-900/40"
              >
                "{feedback.ideal_answer}"
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </motion.div>
  )
}

export default FeedbackCard
