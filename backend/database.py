"""
PrepSense AI - Database Management Module
SQLite database handler for User Authentication, Interview Sessions,
Responses, Evaluation History, and Candidate Reviews.
"""

import sqlite3
import json
import os
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

DB_PATH = Path(__file__).parent / "prepsense.db"


def get_db():
    """Get a database connection with dict-like row access"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt"""
    salt = "prepsense_ai_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()


def init_db():
    """Initialize all database tables and seed sample data"""
    conn = get_db()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        college TEXT DEFAULT 'Engineering Institute',
        target_role TEXT DEFAULT 'Software Engineer',
        experience_level TEXT DEFAULT 'Beginner',
        skills TEXT DEFAULT 'Python, SQL',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Interview Sessions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interview_sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        role TEXT NOT NULL,
        difficulty TEXT DEFAULT 'intermediate',
        interview_type TEXT DEFAULT 'mixed',
        topics TEXT DEFAULT '',
        strategy TEXT DEFAULT 'static',
        target_questions INTEGER DEFAULT 5,
        total_questions INTEGER DEFAULT 0,
        answered_questions INTEGER DEFAULT 0,
        average_score REAL DEFAULT 0,
        tech_score REAL DEFAULT 0,
        comm_score REAL DEFAULT 0,
        quality_score REAL DEFAULT 0,
        overall_tone TEXT DEFAULT 'confident',
        total_filler_words INTEGER DEFAULT 0,
        status TEXT DEFAULT 'in_progress',
        resume_text TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # 3. Interview Responses Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interview_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        question TEXT NOT NULL,
        response TEXT NOT NULL,
        score REAL DEFAULT 0,
        tech_score REAL DEFAULT 0,
        comm_score REAL DEFAULT 0,
        star_score REAL DEFAULT 0,
        summary TEXT DEFAULT '',
        tone TEXT DEFAULT 'neutral',
        clarity TEXT DEFAULT 'good',
        confidence TEXT DEFAULT 'high',
        filler_words_count INTEGER DEFAULT 0,
        filler_words_json TEXT DEFAULT '[]',
        improvement_tips_json TEXT DEFAULT '[]',
        missing_concepts_json TEXT DEFAULT '[]',
        star_rating_json TEXT DEFAULT '{}',
        star_feedback TEXT DEFAULT '',
        ideal_answer TEXT DEFAULT '',
        hints_used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
    )
    """)

    # 4. Candidate Reviews Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        company TEXT NOT NULL,
        college TEXT DEFAULT '',
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        avatar_initials TEXT DEFAULT 'AI',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()

    # Seed Default User if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO users (username, email, password_hash, full_name, college, target_role, experience_level, skills)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "bhumika",
            "bhumika@example.com",
            hash_password("demo123"),
            "Bhumika (Student)",
            "B.Tech Computer Science & AI/ML",
            "Python / Machine Learning Engineer",
            "Intermediate",
            "Python, FastAPI, Machine Learning, SQL, React"
        ))
        conn.commit()

    # Seed Initial Reviews if empty
    cursor.execute("SELECT COUNT(*) FROM reviews")
    if cursor.fetchone()[0] == 0:
        sample_reviews = [
            (
                "Aarav Sharma",
                "SDE-1 Placed",
                "Amazon",
                "IIT Delhi",
                5,
                "PrepSense AI helped me nail the behavioral and technical STAR rounds! The Savage Critic mode pointed out weak points in my answers that no human interviewer ever did.",
                "AS"
            ),
            (
                "Priya Nair",
                "Data Analyst",
                "Deloitte",
                "NIT Trichy",
                5,
                "The live speech dynamics, filler word analysis, and instant ideal answers are game changing. Scored 88/100 in my actual campus placement interview!",
                "PN"
            ),
            (
                "Rohan Verma",
                "ML Engineer",
                "Microsoft",
                "BITS Pilani",
                5,
                "The resume roast mode was hilarious but spot-on. It forced me to quantify my project outcomes with metrics. Highly recommended for final-year engineering students!",
                "RV"
            ),
            (
                "Sneha Patel",
                "Python Developer",
                "Infosys Specialist",
                "VIT Vellore",
                5,
                "The PDF report export is so comprehensive. I showed my practice progress chart to my placement coordinator and they were amazed.",
                "SP"
            )
        ]
        cursor.executemany("""
        INSERT INTO reviews (name, role, company, college, rating, comment, avatar_initials)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, sample_reviews)
        conn.commit()

    conn.close()
    print("Database initialized successfully at", DB_PATH)


# Initialize DB on import
init_db()


# ==========================================
# User & Authentication Database Helpers
# ==========================================

def create_user(username: str, email: str, password: str, full_name: str, college: str = "", target_role: str = "", experience_level: str = "Beginner", skills: str = "") -> Optional[Dict]:
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO users (username, email, password_hash, full_name, college, target_role, experience_level, skills)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            username.strip().lower(),
            email.strip().lower(),
            hash_password(password),
            full_name.strip(),
            college.strip(),
            target_role.strip(),
            experience_level,
            skills.strip()
        ))
        conn.commit()
        user_id = cursor.lastrowid
        return get_user_by_id(user_id)
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


def authenticate_user(email_or_username: str, password: str) -> Optional[Dict]:
    conn = get_db()
    cursor = conn.cursor()
    pwd_hash = hash_password(password)
    identifier = email_or_username.strip().lower()
    cursor.execute("""
    SELECT id, username, email, full_name, college, target_role, experience_level, skills, created_at
    FROM users
    WHERE (LOWER(email) = ? OR LOWER(username) = ?) AND password_hash = ?
    """, (identifier, identifier, pwd_hash))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[Dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, username, email, full_name, college, target_role, experience_level, skills, created_at
    FROM users WHERE id = ?
    """, (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_user_profile(user_id: int, full_name: str, college: str, target_role: str, experience_level: str, skills: str) -> Optional[Dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE users
    SET full_name = ?, college = ?, target_role = ?, experience_level = ?, skills = ?
    WHERE id = ?
    """, (full_name, college, target_role, experience_level, skills, user_id))
    conn.commit()
    conn.close()
    return get_user_by_id(user_id)


# ==========================================
# Interview Session Database Helpers
# ==========================================

def save_session(session_id: str, user_id: Optional[int], role: str, difficulty: str, interview_type: str, topics: str, strategy: str, target_questions: int, resume_text: str = ""):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO interview_sessions 
    (id, user_id, role, difficulty, interview_type, topics, strategy, target_questions, resume_text, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_progress')
    """, (session_id, user_id, role, difficulty, interview_type, topics, strategy, target_questions, resume_text))
    conn.commit()
    conn.close()


def save_response(session_id: str, question: str, response: str, feedback: Dict, ideal_answer: str = "", hints_used: int = 0):
    conn = get_db()
    cursor = conn.cursor()

    # Extract score values
    score = feedback.get("score_100", feedback.get("score", 5) * 10)
    tech_score = feedback.get("tech_score", round(score * 0.4, 1))
    comm_score = feedback.get("comm_score", round(score * 0.3, 1))
    star_score = feedback.get("star_score", round(score * 0.3, 1))

    cursor.execute("""
    INSERT INTO interview_responses (
        session_id, question, response, score, tech_score, comm_score, star_score,
        summary, tone, clarity, confidence, filler_words_count, filler_words_json,
        improvement_tips_json, missing_concepts_json, star_rating_json, star_feedback,
        ideal_answer, hints_used
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        session_id,
        question,
        response,
        score,
        tech_score,
        comm_score,
        star_score,
        feedback.get("summary", ""),
        feedback.get("tone", "neutral"),
        feedback.get("clarity", "good"),
        feedback.get("confidence", "moderate"),
        feedback.get("filler_words_count", 0),
        json.dumps(feedback.get("filler_words", [])),
        json.dumps(feedback.get("improvement_tips", [])),
        json.dumps(feedback.get("missing_concepts", [])),
        json.dumps(feedback.get("star_rating", {})),
        feedback.get("star_feedback", ""),
        ideal_answer or feedback.get("ideal_answer", ""),
        hints_used
    ))
    conn.commit()
    conn.close()


def update_session_summary(session_id: str, average_score: float, tech_score: float, comm_score: float, quality_score: float, overall_tone: str, total_fillers: int, total_q: int, answered_q: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE interview_sessions
    SET average_score = ?, tech_score = ?, comm_score = ?, quality_score = ?,
        overall_tone = ?, total_filler_words = ?, total_questions = ?,
        answered_questions = ?, status = 'completed'
    WHERE id = ?
    """, (average_score, tech_score, comm_score, quality_score, overall_tone, total_fillers, total_q, answered_q, session_id))
    conn.commit()
    conn.close()


def get_user_dashboard_stats(user_id: Optional[int]) -> Dict:
    conn = get_db()
    cursor = conn.cursor()

    if user_id:
        cursor.execute("SELECT * FROM interview_sessions WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    else:
        cursor.execute("SELECT * FROM interview_sessions ORDER BY created_at DESC LIMIT 20")

    sessions = [dict(row) for row in cursor.fetchall()]

    if not sessions:
        conn.close()
        return {
            "total_interviews": 0,
            "average_score": 0,
            "highest_score": 0,
            "total_questions_answered": 0,
            "average_tech_score": 0,
            "average_comm_score": 0,
            "history": [],
            "recent_sessions": []
        }

    total_interviews = len(sessions)
    scores = [s["average_score"] for s in sessions if s.get("average_score", 0) > 0]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0
    highest_score = max(scores) if scores else 0
    total_q_answered = sum(s.get("answered_questions", 0) for s in sessions)
    avg_tech = round(sum(s.get("tech_score", 0) for s in sessions) / total_interviews, 1)
    avg_comm = round(sum(s.get("comm_score", 0) for s in sessions) / total_interviews, 1)

    # Format history for progress chart
    history_data = []
    for s in reversed(sessions[:10]):
        history_data.append({
            "session_id": s["id"],
            "role": s["role"],
            "score": s["average_score"],
            "date": s["created_at"][:10] if s.get("created_at") else "Recent"
        })

    conn.close()
    return {
        "total_interviews": total_interviews,
        "average_score": avg_score,
        "highest_score": highest_score,
        "total_questions_answered": total_q_answered,
        "average_tech_score": avg_tech,
        "average_comm_score": avg_comm,
        "history": history_data,
        "recent_sessions": sessions[:10]
    }


# ==========================================
# Candidate Reviews Database Helpers
# ==========================================

def get_all_reviews() -> List[Dict]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reviews ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def add_review(name: str, role: str, company: str, rating: int, comment: str, college: str = "") -> Dict:
    conn = get_db()
    cursor = conn.cursor()
    initials = "".join([part[0] for part in name.split()[:2]]).upper() or "AI"
    cursor.execute("""
    INSERT INTO reviews (name, role, company, college, rating, comment, avatar_initials)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (name.strip(), role.strip(), company.strip(), college.strip(), max(1, min(5, rating)), comment.strip(), initials))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.execute("SELECT * FROM reviews WHERE id = ?", (new_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)
