# 🎓 B.Tech AI/ML Capstone Project Viva Presentation Guide

**Project Title:** PrepSense AI: Autonomous Multi-Modal AI Interview & Placement Intelligence Engine  
**Target Evaluation:** 100/100 Marks (University Examination / Final Project Viva)  
**Author:** Bhumika (Student Candidate)

---

## 1. Executive Summary & Problem Statement

### Problem
Traditional campus placement preparation relies on static mock questions or expensive 1-on-1 human coaching that lacks instant objective scoring, verbal pace analysis, and personalized feedback. Candidates often fail technical rounds not because of lack of knowledge, but due to poor answer structuring (failing to use the STAR framework) and unmonitored verbal crutches.

### Proposed Solution
**PrepSense AI** is a full-stack, autonomous artificial intelligence platform that simulates real-world hiring rounds with multi-persona speech synthesis, real-time audio decibel tracking, an academic 100-mark rubric (Technical Depth 40%, Communication 30%, STAR Completeness 30%), persistent SQLite database tracking, and instant model answer comparisons.

---

## 2. System Architecture & Technical Stack

```
   ┌──────────────────────────────────────────────────────────────┐
   │                   React 18 Client (SPA)                     │
   │   TailwindCSS • Framer Motion • Web Audio API • Web Speech   │
   └──────────────────────────────┬───────────────────────────────┘
                                  │ JSON / REST / Multipart
                                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                   FastAPI Backend Server                     │
   │           Uvicorn ASGI • SPA History Routing Fallback        │
   ├──────────────────────────────┬───────────────────────────────┤
   │                              │                               │
   ▼                              ▼                               ▼
┌──────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Google Gemini    │    │ Audio Waveform & │    │ SQLite Relational│
│ Generative AI    │    │ Regex Filler     │    │ Database Engine │
│ 2.5 / 1.5 Flash  │    │ Detection        │    │ prepsense.db    │
└──────────────────┘    └──────────────────┘    └─────────────────┘
```

- **Frontend Framework**: React 18 with Vite build pipeline
- **Styling & UI**: TailwindCSS + Glassmorphic dark/light UI
- **Micro-Interactions**: Framer Motion SVG animations
- **Speech & Audio**:
  - Web Speech API: Native browser speech-to-text (STT) and text-to-speech (TTS)
  - Web Audio API: Decibel volume sampling (RMS amplitude) for pacing visualization
- **Backend Framework**: Python 3.13, FastAPI (Asynchronous REST API)
- **Natural Language Processing**:
  - Google Gemini Generative AI (LLM integration)
  - Regex-based filler word detection engine
  - Heuristic fallback NLP engine ensuring 100% uptime
- **Document Processing**: PyPDF for automated resume parsing & project question extraction
- **Database**: SQLite3 relational schema (`prepsense.db`) with 4 tables: `users`, `interview_sessions`, `interview_responses`, and `reviews`
- **Reporting**: jsPDF client-side vector PDF generation

---

## 3. The 100-Mark Evaluation Rubric Explained

| Scoring Dimension | Weightage | Criteria Evaluated |
| :--- | :---: | :--- |
| **Technical Depth & Accuracy** | **40 Marks** | Concept correctness, architectural trade-offs, edge-case coverage, and tooling justification. |
| **Communication & Vocal Delivery** | **30 Marks** | Clarity of thought, confidence, absence of filler words (um, uh, basically), and speaking rhythm. |
| **STAR Completeness & Impact** | **30 Marks** | Clear narrative structure: **S**ituation, **T**ask, **A**ction, and quantifiable **R**esults (percentages, latency, throughput). |
| **Total Assessment Score** | **100 Marks** | Scaled benchmark determining placement readiness. |

---

## 4. Key Viva Questions & Recommended Answers

### Q1: What makes PrepSense AI different from a basic ChatGPT wrapper?
> **Answer:**  
> "A basic chatbot simply generates text replies. PrepSense AI is a complete full-stack assessment pipeline. It includes:
> 1. Real-time audio waveform and volume variance extraction using the Web Audio API.
> 2. Specialized multi-persona interviewers with speech synthesis.
> 3. Progressive hint generation that guides students in practice mode without spoiling answers.
> 4. Structured SQLite database session tracking with historical progress curves.
> 5. PyPDF-based resume analysis that cross-examines candidates on their actual projects."

### Q2: How does the system handle API rate limits or offline conditions?
> **Answer:**  
> "We implemented an intelligent heuristic fallback engine in `GeminiService`. If the API key is unavailable or quota is exceeded, the engine performs lexical analysis on the candidate's answer—evaluating vocabulary depth, STAR transition markers, technical keywords, and filler frequency—returning a structured 100-mark evaluation with actionable coaching tips so the interview never breaks."

### Q3: Why did you choose SQLite over NoSQL?
> **Answer:**  
> "SQLite is ACID-compliant, requires zero external server setup, runs in-process with Python, and provides robust foreign-key integrity between Users, Interview Sessions, Responses, and Reviews. It is self-contained and ideal for deployment."

---

## 5. Live Demonstration Checklist

1. **Candidate Registration / Demo Login**: Click "1-Click Demo Student Login" on the navbar.
2. **Custom Setup Wizard**: Select Target Role (e.g., Python Developer), Difficulty (Intermediate), and Topic focus tags.
3. **Optional Resume Upload**: Attach a PDF resume and toggle "🔥 Roast My Resume".
4. **Live Interview Session**:
   - Listen to the AI voice avatar speak the question.
   - Click "💡 Need a Hint?" to demonstrate progressive hints.
   - Record via voice or type a structured response.
5. **Instant Feedback**: Show the 100-mark score gauge, subscore breakdown, missing concepts, and the 10/10 Model Ideal Answer.
6. **Dashboard & Analytics**: Open `/dashboard` to show the score progression graph and past session history.
7. **Reviews Wall**: Open `#reviews` to show placement reviews and submit a new review in real-time.
8. **PDF Export**: Download the official assessment dossier.
