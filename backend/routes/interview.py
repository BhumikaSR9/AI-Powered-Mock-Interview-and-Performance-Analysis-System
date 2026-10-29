"""
PrepSense AI - Interview & Assessment API Routes
Handles session management, evaluation, database persistence,
user dashboard analytics, reviews, and interactive hints.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
import sys
import uuid
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from services.gemini_service import GeminiService
from utils.audio_analysis import analyze_audio_tone
from utils.filler_words import detect_filler_words
from utils.resume_parser import extract_text_from_pdf
import database as db

router = APIRouter()

# Load role-specific question pool
QUESTIONS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "sample_questions.json")

try:
    with open(QUESTIONS_FILE, "r") as f:
        SAMPLE_QUESTIONS = json.load(f)
except Exception:
    SAMPLE_QUESTIONS = {}

# Ensure extra popular roles exist
EXTRA_ROLES = {
    "Python Developer": [
        "Explain Python's GIL (Global Interpreter Lock) and how it impacts CPU-bound vs IO-bound multi-threading.",
        "What are Python generators and iterators? How do they provide memory optimization when streaming large datasets?",
        "How do you implement decorators in Python, and how can you preserve function metadata using functools.wraps?",
        "Explain the difference between deepcopy and shallow copy with mutable objects in Python.",
        "How do you structure asynchronous concurrency using asyncio, tasks, and event loops?"
    ],
    "Machine Learning Engineer": [
        "Explain the bias-variance tradeoff and what techniques you use to diagnose high variance in deep models.",
        "How do you handle severe class imbalance in tabular and NLP datasets?",
        "Walk me through the mathematics and intuition behind Gradient Descent vs Adam optimizer.",
        "How do you monitor and handle data drift and model degradation in production ML pipelines?",
        "Explain the architectural distinction between Transformer self-attention and traditional RNNs/LSTMs."
    ],
    "Data Analyst": [
        "Explain the difference between WHERE and HAVING clauses in complex SQL queries.",
        "How do you choose between Mean, Median, and Mode when dealing with skewed distributions?",
        "Walk me through how you identify and treat outliers without biasing downstream statistical findings.",
        "What are window functions in SQL (like ROW_NUMBER, RANK, DENSE_RANK), and when do you use them?",
        "Describe a time you translated raw data findings into actionable business KPIs for non-technical leadership."
    ],
    "HR & Behavioral": [
        "Tell me about a time you had a strong disagreement with a team member or lead. How did you resolve it?",
        "Describe a situation where a project deadline was suddenly moved up. How did you manage your workload?",
        "What is your greatest professional accomplishment so far, and what specific challenges did you overcome?",
        "Give an example of a mistake you made on a technical project and what steps you took to correct it.",
        "Where do you see yourself technically and professionally in 3 to 5 years?"
    ]
}

for r_name, q_list in EXTRA_ROLES.items():
    if r_name not in SAMPLE_QUESTIONS:
        SAMPLE_QUESTIONS[r_name] = q_list


# ==========================================
# Pydantic Schemas
# ==========================================

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    college: Optional[str] = "Engineering Institute"
    target_role: Optional[str] = "Software Engineer"
    experience_level: Optional[str] = "Beginner"
    skills: Optional[str] = "Python, SQL"


class UserLogin(BaseModel):
    username_or_email: str
    password: str


class ProfileUpdate(BaseModel):
    user_id: int
    full_name: str
    college: str
    target_role: str
    experience_level: str
    skills: str


class SessionCreate(BaseModel):
    user_id: Optional[int] = None
    role: str
    difficulty: Optional[str] = "intermediate"  # beginner, intermediate, advanced
    interview_type: Optional[str] = "mixed"     # technical, hr, coding, mixed, resume
    topics: Optional[List[str]] = []
    question_count: int = 5
    custom_questions: Optional[List[str]] = None
    strategy: str = "static"                    # static, adaptive
    resume_text: Optional[str] = None


class ResponseSubmission(BaseModel):
    question: str
    response: str
    mode: Optional[str] = "friendly"
    hints_used: Optional[int] = 0
    audio_data: Optional[str] = None


class HintRequest(BaseModel):
    question: str
    role: str


class ReviewCreate(BaseModel):
    name: str
    role: str
    company: str
    rating: int
    comment: str
    college: Optional[str] = ""


# In-memory session cache for fast state retrieval
in_memory_sessions = {}


# ==========================================
# Auth & User Profile Routes
# ==========================================

@router.post("/auth/register")
async def register(data: UserRegister):
    """Register a new student/candidate account"""
    user = db.create_user(
        username=data.username,
        email=data.email,
        password=data.password,
        full_name=data.full_name,
        college=data.college or "",
        target_role=data.target_role or "",
        experience_level=data.experience_level or "Beginner",
        skills=data.skills or ""
    )
    if not user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    return {"message": "Registration successful", "user": user}


@router.post("/auth/login")
async def login(data: UserLogin):
    """Authenticate student/candidate"""
    user = db.authenticate_user(data.username_or_email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username/email or password")
    return {"message": "Login successful", "user": user}


@router.put("/auth/profile")
async def update_profile(data: ProfileUpdate):
    """Update student profile details"""
    updated = db.update_user_profile(
        user_id=data.user_id,
        full_name=data.full_name,
        college=data.college,
        target_role=data.target_role,
        experience_level=data.experience_level,
        skills=data.skills
    )
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Profile updated", "user": updated}


# ==========================================
# Dashboard & Reviews Routes
# ==========================================

@router.get("/dashboard/stats")
async def get_dashboard_stats(user_id: Optional[int] = None):
    """Get candidate interview history and overall progress metrics"""
    stats = db.get_user_dashboard_stats(user_id)
    return stats


@router.get("/reviews")
async def get_reviews():
    """Get verified student and candidate reviews"""
    return {"reviews": db.get_all_reviews()}


@router.post("/reviews")
async def submit_review(data: ReviewCreate):
    """Allow candidate to submit a live review"""
    review = db.add_review(
        name=data.name,
        role=data.role,
        company=data.company,
        rating=data.rating,
        comment=data.comment,
        college=data.college or ""
    )
    return {"message": "Review submitted successfully", "review": review}


# ==========================================
# Interview Preparation & Role Routes
# ==========================================

@router.get("/roles")
async def get_roles():
    """Get list of all supported interview roles"""
    return {"roles": list(SAMPLE_QUESTIONS.keys())}


@router.get("/questions/{role}")
async def get_questions(
    role: str,
    count: int = 5,
    difficulty: str = "intermediate",
    interview_type: str = "mixed"
):
    """Get questions filtered by role, difficulty, and interview type"""
    if role not in SAMPLE_QUESTIONS:
        # Fallback question set
        questions = [
            f"Walk me through your background and interest in the {role} role.",
            f"Describe the most technically challenging problem you solved in {role}.",
            "How do you approach debugging and root-cause analysis when systems fail in production?",
            "Tell me about a time you had to adapt quickly to a completely new technology or requirement.",
            "Where do you see the industry heading for this domain in the coming years?"
        ]
    else:
        questions = SAMPLE_QUESTIONS[role]

    selected = questions[:min(count, len(questions))]
    return {
        "role": role,
        "difficulty": difficulty,
        "interview_type": interview_type,
        "questions": selected,
        "total": len(selected)
    }


@router.post("/interview/hint")
async def get_question_hint(req: HintRequest):
    """Provide a progressive coaching hint for the current question"""
    gemini_service = GeminiService()
    hint = await gemini_service.generate_hint(req.question, req.role)
    return {"hint": hint}


@router.post("/interview/ideal-answer")
async def get_ideal_answer(req: HintRequest):
    """Provide a 10/10 textbook model answer for study"""
    gemini_service = GeminiService()
    ideal = await gemini_service.generate_ideal_answer(req.question, req.role)
    return {"ideal_answer": ideal}


# ==========================================
# Resume Parser & Roaster
# ==========================================

@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    role: str = Form("Software Engineer"),
    roast_mode: bool = Form(False)
):
    """Upload resume, extract text, roast it and generate project questions"""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        content = await file.read()
        text = extract_text_from_pdf(content)
        
        gemini_service = GeminiService()
        result = {
            "text_preview": text[:400] + ("..." if len(text) > 400 else ""),
            "roast": None,
            "questions": []
        }
        
        if roast_mode:
            result["roast"] = await gemini_service.roast_resume(text)
            
        result["questions"] = await gemini_service.generate_questions_from_resume(text, role, count=5)
        return result
        
    except Exception as e:
        print(f"Error processing resume: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")


# ==========================================
# Session Management & Evaluation
# ==========================================

@router.post("/session")
async def create_session(data: SessionCreate):
    """Create a new mock interview session and persist in SQLite"""
    role = data.role
    questions = []
    topics_str = ", ".join(data.topics) if data.topics else ""

    if data.custom_questions and len(data.custom_questions) > 0:
        questions = data.custom_questions
    elif data.strategy == "adaptive":
        if data.resume_text:
            gemini_service = GeminiService()
            questions = await gemini_service.generate_questions_from_resume(data.resume_text, role, count=1)
        else:
            questions = [f"To start our interview, please give a concise overview of your background in {role}."]
    elif role in SAMPLE_QUESTIONS:
        questions = SAMPLE_QUESTIONS[role][:min(data.question_count, len(SAMPLE_QUESTIONS[role]))]
    else:
        questions = [
            f"Tell me about your experience and core competencies in {role}.",
            "What technical or system architecture challenge are you most proud of solving?",
            "How do you handle technical debt and code maintainability under strict deadlines?",
            "Describe a time when you discovered an edge-case bug in production.",
            "Do you have any questions about this role or engineering culture?"
        ][:data.question_count]

    session_id = str(uuid.uuid4())
    
    # Save to SQLite Database
    db.save_session(
        session_id=session_id,
        user_id=data.user_id,
        role=role,
        difficulty=data.difficulty or "intermediate",
        interview_type=data.interview_type or "mixed",
        topics=topics_str,
        strategy=data.strategy,
        target_questions=data.question_count,
        resume_text=data.resume_text or ""
    )

    # In-memory cache
    in_memory_sessions[session_id] = {
        "session_id": session_id,
        "user_id": data.user_id,
        "role": role,
        "difficulty": data.difficulty or "intermediate",
        "interview_type": data.interview_type or "mixed",
        "topics": data.topics or [],
        "questions": questions,
        "responses": [],
        "current_question": 0,
        "strategy": data.strategy,
        "resume_text": data.resume_text,
        "target_questions": data.question_count
    }

    return {
        "session_id": session_id,
        "role": role,
        "difficulty": data.difficulty or "intermediate",
        "interview_type": data.interview_type or "mixed",
        "questions": questions,
        "total_questions": len(questions) if data.strategy == "static" else data.question_count,
        "strategy": data.strategy
    }


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Retrieve active session state"""
    if session_id not in in_memory_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return in_memory_sessions[session_id]


@router.post("/session/{session_id}/response")
async def submit_response(session_id: str, submission: ResponseSubmission):
    """
    Submit answer for live evaluation:
    Calculates 100-mark score, Technical/Comm/STAR breakdown,
    missing concepts, ideal model answer, and audio tone.
    """
    if session_id not in in_memory_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = in_memory_sessions[session_id]
    
    # 1. Detect filler words
    filler_count, filler_words = detect_filler_words(submission.response)
    
    # 2. Audio tone analysis (if audio data provided)
    audio_analysis = None
    if submission.audio_data:
        try:
            audio_analysis = analyze_audio_tone(submission.audio_data)
        except Exception as e:
            print(f"Audio analysis error: {e}")
            
    # 3. AI Feedback Evaluation (Gemini with Heuristic Fallback)
    gemini_service = GeminiService()
    ai_feedback = await gemini_service.analyze_response(
        question=submission.question,
        response=submission.response,
        role=session["role"],
        mode=submission.mode or "friendly",
        filler_count=filler_count
    )

    # 4. Generate ideal model answer if not present
    ideal_ans = ai_feedback.get("ideal_answer")
    if not ideal_ans:
        ideal_ans = await gemini_service.generate_ideal_answer(submission.question, session["role"])
        ai_feedback["ideal_answer"] = ideal_ans

    # Merge feedback attributes
    feedback = {
        "summary": ai_feedback.get("summary", ""),
        "score": ai_feedback.get("score", 6),
        "score_100": ai_feedback.get("score_100", 60),
        "tech_score": ai_feedback.get("tech_score", 24),
        "comm_score": ai_feedback.get("comm_score", 18),
        "star_score": ai_feedback.get("star_score", 18),
        "tone": ai_feedback.get("tone", "neutral"),
        "clarity": ai_feedback.get("clarity", "good"),
        "confidence": ai_feedback.get("confidence", "moderate"),
        "filler_words_count": filler_count,
        "filler_words": filler_words,
        "improvement_tips": ai_feedback.get("improvement_tips", []),
        "missing_concepts": ai_feedback.get("missing_concepts", []),
        "strengths": ai_feedback.get("strengths", []),
        "ideal_answer": ideal_ans,
        "audio_analysis": audio_analysis,
        "star_rating": ai_feedback.get("star_rating", {}),
        "star_feedback": ai_feedback.get("star_feedback", ""),
        "hints_used": submission.hints_used
    }

    # 5. Persist Response into SQLite Database
    db.save_response(
        session_id=session_id,
        question=submission.question,
        response=submission.response,
        feedback=feedback,
        ideal_answer=ideal_ans,
        hints_used=submission.hints_used
    )

    # Append to in-memory session
    session["responses"].append({
        "question": submission.question,
        "response": submission.response,
        "feedback": feedback
    })

    next_question = None
    is_completed = False

    # Handle Adaptive Questioning
    if session.get("strategy") == "adaptive":
        target = session.get("target_questions", 5)
        if len(session["responses"]) < target:
            next_q = await gemini_service.generate_next_question(
                history=session["responses"],
                last_response=submission.response,
                role=session["role"],
                resume_text=session.get("resume_text")
            )
            session["questions"].append(next_q)
            next_question = next_q
        else:
            is_completed = True
    else:
        if session["current_question"] + 1 >= len(session["questions"]):
            is_completed = True

    session["current_question"] += 1

    return {
        "session_id": session_id,
        "current_question": session["current_question"],
        "total_questions": len(session["questions"]),
        "feedback": feedback,
        "next_question": next_question,
        "is_completed": is_completed
    }


@router.get("/session/{session_id}/report")
async def get_report(session_id: str):
    """
    Generate final interview analytics report, save summary to DB,
    and output 100-mark evaluation with strengths, tips, and revision topics.
    """
    if session_id not in in_memory_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = in_memory_sessions[session_id]
    responses = session.get("responses", [])
    
    if not responses:
        raise HTTPException(status_code=400, detail="No responses found in this session")

    # Aggregate scores
    scores_100 = []
    tech_scores = []
    comm_scores = []
    star_scores = []
    total_fillers = 0
    all_tips = []
    all_missing = []
    all_strengths = []
    tones = []

    for r in responses:
        fb = r.get("feedback", {})
        scores_100.append(float(fb.get("score_100", fb.get("score", 6) * 10)))
        tech_scores.append(float(fb.get("tech_score", 24)))
        comm_scores.append(float(fb.get("comm_score", 18)))
        star_scores.append(float(fb.get("star_score", 18)))
        total_fillers += int(fb.get("filler_words_count", 0))
        tones.append(fb.get("tone", "neutral"))
        all_tips.extend(fb.get("improvement_tips", []))
        all_missing.extend(fb.get("missing_concepts", []))
        all_strengths.extend(fb.get("strengths", []))

    avg_100 = round(sum(scores_100) / len(scores_100), 1) if scores_100 else 0.0
    avg_tech = round(sum(tech_scores) / len(tech_scores), 1) if tech_scores else 0.0
    avg_comm = round(sum(comm_scores) / len(comm_scores), 1) if comm_scores else 0.0
    avg_star = round(sum(star_scores) / len(star_scores), 1) if star_scores else 0.0
    overall_tone = max(set(tones), key=tones.count) if tones else "confident"

    unique_tips = list(dict.fromkeys(all_tips))
    unique_missing = list(dict.fromkeys(all_missing))
    unique_strengths = list(dict.fromkeys(all_strengths))

    # Generate revision roadmap topics based on role
    role_topics = {
        "Python Developer": ["Memory Management & GIL", "Asyncio & Concurrency", "Generators & Iterators", "Design Patterns in Python"],
        "Machine Learning Engineer": ["Loss Functions & Optimizers", "Model Regularization & Drift", "Transformer Architecture", "Data Imbalance Techniques"],
        "Data Analyst": ["Window Functions in SQL", "Statistical Hypothesis Testing", "Data Storytelling & Dashboards", "Outlier Analysis"],
        "Software Engineer": ["System Scalability & Caching", "API Design & REST/gRPC", "Concurrency & Thread Safety", "STAR Interview Structuring"]
    }
    recommended_topics = role_topics.get(session["role"], ["STAR Technique Mastery", "Technical Trade-Off Articulation", "Quantifiable Metrics Sharing"])

    # Update session in SQLite Database
    db.update_session_summary(
        session_id=session_id,
        average_score=avg_100,
        tech_score=avg_tech,
        comm_score=avg_comm,
        quality_score=avg_star,
        overall_tone=overall_tone,
        total_fillers=total_fillers,
        total_q=len(session["questions"]),
        answered_q=len(responses)
    )

    report = {
        "session_id": session_id,
        "role": session["role"],
        "difficulty": session.get("difficulty", "intermediate"),
        "interview_type": session.get("interview_type", "mixed"),
        "total_questions": len(session["questions"]),
        "answered_questions": len(responses),
        "average_score": avg_100,
        "score_100": avg_100,
        "subscores": {
            "tech_score": avg_tech,
            "tech_max": 40,
            "comm_score": avg_comm,
            "comm_max": 30,
            "star_score": avg_star,
            "star_max": 30
        },
        "overall_tone": overall_tone,
        "total_filler_words": total_fillers,
        "responses": responses,
        "improvement_tips": unique_tips[:5],
        "missing_concepts": unique_missing[:4],
        "candidate_strengths": unique_strengths[:4],
        "recommended_revision_topics": recommended_topics,
        "score_breakdown": {
            "min": round(min(scores_100), 1) if scores_100 else 0,
            "max": round(max(scores_100), 1) if scores_100 else 0,
            "average": avg_100
        }
    }

    return report
