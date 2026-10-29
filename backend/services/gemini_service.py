"""
Google Gemini Service - PrepSense AI
Handles AI-powered interview feedback analysis using Google's Gemini API
with intelligent heuristic fallback to ensure 100% uptime and resilience.
Features: 0-100 Scoring, Tech/Comm/STAR subscores, Missing Concepts,
Model Ideal Answers, Progressive Hints, and Resume-based Questioning.
"""

import os
import json
import re
from typing import Dict, List, Optional
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class GeminiService:
    """
    Service for interacting with Google Gemini API with smart fallback capabilities
    """
    
    def __init__(self):
        self.model = None
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("INFO: GEMINI_API_KEY not found in environment. Heuristic AI coach active.")
        elif not GENAI_AVAILABLE:
            print("WARNING: google-generativeai not installed. Heuristic AI coach active.")
        else:
            try:
                genai.configure(api_key=api_key.strip())
                # Try preferred model candidates in order
                models_to_try = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro']
                for model_name in models_to_try:
                    try:
                        self.model = genai.GenerativeModel(model_name)
                        print(f"Gemini Service initialized with model: {model_name}")
                        break
                    except Exception as me:
                        print(f"Model {model_name} initialization notice: {me}")
            except Exception as e:
                print(f"Error configuring Gemini API: {e}")
                self.model = None

    def _get_mode_prompt(self, mode: str) -> str:
        """Get interviewer mode-specific prompt"""
        mode_prompts = {
            "friendly": "Act as Friendly Coach Fiona. Be warm, encouraging, highly supportive, and focus on helping the candidate build confidence.",
            "technical": "Act as Technical Lead Tyler. Focus on technical accuracy, edge cases, system design patterns, clean coding principles, and depth of knowledge.",
            "challenging": "Act as Savage Critic Sam. Point out clichés, weak descriptions, verbal crutches, lack of quantitative results, and be critical of structure.",
            "pressure": "Act as Pressure Tester Paula. Demand extremely concise answers, stress-test their quick thinking, and evaluate how they handle strict constraints."
        }
        return mode_prompts.get(mode, mode_prompts["friendly"])

    def _extract_json_from_text(self, text: str) -> Dict:
        """Extract and parse JSON object from text response"""
        text = text.replace("```json", "").replace("```", "").strip()
        try:
            parsed = json.loads(text)
            return self._normalize_scores(parsed)
        except json.JSONDecodeError:
            json_match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', text)
            if json_match:
                try:
                    parsed = json.loads(json_match.group(1))
                    return self._normalize_scores(parsed)
                except json.JSONDecodeError:
                    pass
            
            return {
                "summary": text[:250].strip() + ("..." if len(text) > 250 else ""),
                "score": 6,
                "score_100": 60,
                "tech_score": 24,
                "comm_score": 18,
                "star_score": 18,
                "tone": "neutral",
                "clarity": "moderate",
                "confidence": "moderate",
                "improvement_tips": ["Structure your answer with clear context and measurable outcomes."],
                "missing_concepts": ["Quantifiable metrics", "Design trade-offs"],
                "strengths": ["Clear communication of baseline concepts"],
                "ideal_answer": "In my previous experience, I solved this by defining the core architecture, implementing optimized algorithms, and verifying with automated benchmarks.",
                "star_rating": {
                    "situation": "good",
                    "task": "good",
                    "action": "good",
                    "result": "missing"
                },
                "star_feedback": "Structure your answer using Situation, Task, Action, and Result."
            }

    def _normalize_scores(self, parsed: Dict) -> Dict:
        """Ensure score_100, tech_score, comm_score, star_score are valid numbers"""
        if not isinstance(parsed, dict):
            return parsed
            
        raw_score = parsed.get("score", 6)
        try:
            score_10 = max(1, min(10, int(float(str(raw_score).split('/')[0]))))
        except Exception:
            score_10 = 6
        parsed["score"] = score_10

        # Score out of 100
        raw_100 = parsed.get("score_100")
        if raw_100 is not None:
            try:
                parsed["score_100"] = max(10, min(100, int(float(raw_100))))
            except Exception:
                parsed["score_100"] = score_10 * 10
        else:
            parsed["score_100"] = score_10 * 10

        s100 = parsed["score_100"]
        # Sub-scores: Tech Depth (40), Communication (30), Quality/STAR (30)
        parsed["tech_score"] = parsed.get("tech_score", round(s100 * 0.4, 1))
        parsed["comm_score"] = parsed.get("comm_score", round(s100 * 0.3, 1))
        parsed["star_score"] = parsed.get("star_score", round(s100 * 0.3, 1))
        return parsed

    def _generate_heuristic_feedback(
        self,
        question: str,
        response: str,
        role: str,
        mode: str = "friendly",
        filler_count: int = 0
    ) -> Dict:
        """
        Generate intelligent 100-mark coaching feedback with subscores and missing concepts
        """
        words = response.strip().split()
        word_count = len(words)
        lower_resp = response.lower()
        
        # Check STAR elements
        situation_hits = any(w in lower_resp for w in ["when", "during", "at my", "project", "team", "client", "context", "background", "company", "situation"])
        task_hits = any(w in lower_resp for w in ["task", "goal", "needed to", "objective", "problem", "challenge", "responsibility", "assigned", "requirement"])
        action_hits = any(w in lower_resp for w in ["i built", "i designed", "i created", "i implemented", "i led", "i managed", "i developed", "i analyzed", "i solved", "i worked", "i used", "my approach"])
        result_hits = any(w in lower_resp for w in ["result", "outcome", "improved", "increased", "reduced", "delivered", "saved", "achieved", "%", "metrics", "success", "learned"])
        
        # Check Technical Vocabulary
        tech_keywords = ["python", "api", "database", "sql", "model", "algorithm", "git", "docker", "test", "cache", "scale", "performance", "architecture", "async", "framework", "component", "state"]
        tech_hits = sum(1 for k in tech_keywords if k in lower_resp)

        star_rating = {
            "situation": "excellent" if situation_hits and word_count > 40 else ("good" if situation_hits else "missing"),
            "task": "excellent" if task_hits and word_count > 40 else ("good" if task_hits else "missing"),
            "action": "excellent" if action_hits and word_count > 40 else ("good" if action_hits else "missing"),
            "result": "excellent" if result_hits and word_count > 40 else ("good" if result_hits else "missing")
        }
        
        # 100-mark score calculation breakdown:
        # Technical depth: 40 points
        tech_score = min(40, max(10, tech_hits * 6 + (15 if word_count > 40 else 5)))
        # Communication & clarity: 30 points
        comm_score = min(30, max(10, 25 - min(10, filler_count * 2) + (5 if word_count >= 30 else 0)))
        # Structure / STAR completeness: 30 points
        star_points = sum(7.5 for v in star_rating.values() if v != "missing")
        star_score = round(star_points, 1)

        total_100 = int(round(tech_score + comm_score + star_score))
        total_100 = max(20, min(100, total_100))
        score_10 = max(1, min(10, int(round(total_100 / 10))))

        if word_count < 20:
            clarity = "needs_improvement"
            confidence = "low"
            tone = "uncertain"
        elif word_count < 50:
            clarity = "moderate"
            confidence = "moderate"
            tone = "neutral"
        elif word_count < 130:
            clarity = "good"
            confidence = "high"
            tone = "confident"
        else:
            clarity = "excellent"
            confidence = "high"
            tone = "confident"

        # Missing concepts detection
        missing = []
        if not result_hits:
            missing.append("Quantifiable Metrics & ROI (e.g., percentages, latency, throughput)")
        if not action_hits:
            missing.append("Specific Personal Contribution ('I implemented' vs 'we worked on')")
        if tech_hits < 2:
            missing.append("Architecture & Technical Nuance (libraries, design patterns, protocols)")
        if not situation_hits or not task_hits:
            missing.append("Business Context & Constraints (why this task mattered)")

        strengths = []
        if word_count >= 35:
            strengths.append(f"Good response length and articulate delivery ({word_count} words)")
        if filler_count <= 1:
            strengths.append("Crisp vocal delivery with virtually no filler words")
        if action_hits:
            strengths.append("Clear ownership of implementation decisions")
        if result_hits:
            strengths.append("Demonstrated focus on business and technical outcomes")
        if not strengths:
            strengths.append("Clear and direct attempt addressing the question prompt")

        tips = []
        if not result_hits:
            tips.append("Quantify your impact: mention measurable metrics (e.g., latency reduced by 30%, user adoption grew 25%).")
        if not action_hits:
            tips.append("Focus more on 'I' rather than 'We' to spotlight your individual engineering or decision-making contributions.")
        if filler_count > 2:
            tips.append(f"Pause briefly instead of using filler words ({filler_count} detected) to project executive presence.")
        if word_count < 35:
            tips.append(f"Elaborate further: aim for 60-120 words to demonstrate thorough mastery of {role} practices.")
        if len(tips) < 3:
            tips.append("Mention architectural trade-offs or alternate approaches you considered before settling on this solution.")

        # Persona summary
        if mode == "technical":
            summary = (
                f"Tyler here: Evaluated response for technical depth. Score: {total_100}/100. "
                f"{'Solid articulation of design and implementation.' if action_hits else 'Needs deeper architectural trade-offs and technical specifics.'} "
                f"{'Great mention of outcomes.' if result_hits else 'Make sure to highlight system scalability and production metrics.'}"
            )
            star_fb = "From a tech lead perspective, ensure your Action covers architecture, technology choices, and trade-offs before outlining the Result."
        elif mode == "challenging":
            summary = (
                f"Critic Sam's take: Score {total_100}/100. "
                f"{'You covered the basics, but interviewers look for real differentiator metrics.' if result_hits else 'Weak on quantifiable results—do not leave the impact to the interviewer’s imagination.'} "
                f"{'Cut down on vocal crutches to project command.' if filler_count > 1 else 'Good verbal crispness.'}"
            )
            star_fb = "Do not gloss over the Result component. Every strong story must validate the Action with verifiable numbers."
        elif mode == "pressure":
            summary = (
                f"Paula's evaluation: Under time constraints, you delivered {word_count} words ({total_100}/100). "
                f"{'Excellent punchy phrasing.' if 25 <= word_count <= 90 else 'Pacing needs calibration: keep answers between 45-80 words under high-stress rounds.'} "
                f"Clarity is {clarity}."
            )
            star_fb = "Under pressure, lead with the punchline: Situation/Task in 1 sentence, Action in 2 sentences, Result in 1 sentence."
        else: # friendly
            summary = (
                f"Coach Fiona: Great effort! Overall score: {total_100}/100. You articulated key points with {confidence} confidence and {clarity} clarity. "
                f"{'You clearly highlighted your actions and achievements.' if action_hits and result_hits else 'You have a solid foundation, and adding more concrete examples will make your story unforgettable!'}"
            )
            star_fb = "You are doing great! Formatting with the STAR story framework will make your narrative shine."

        # Model Ideal Answer
        ideal_answer = (
            f"When tackling this for a {role} position, an ideal response follows the STAR framework: "
            f"'At my previous project, we faced a high-latency challenge in our core processing pipeline (Situation). "
            f"My goal was to decrease response time below 200ms while maintaining 99.9% uptime (Task). "
            f"I refactored the bottlenecks using asynchronous task queues, introduced distributed Redis caching, and wrote unit test suites (Action). "
            f"As a result, we reduced API response latency by 45% and handled 3x peak traffic without downtime (Result).'"
        )

        return {
            "summary": summary,
            "score": score_10,
            "score_100": total_100,
            "tech_score": tech_score,
            "comm_score": comm_score,
            "star_score": star_score,
            "tone": tone,
            "clarity": clarity,
            "confidence": confidence,
            "improvement_tips": tips[:4],
            "missing_concepts": missing[:3],
            "strengths": strengths[:3],
            "ideal_answer": ideal_answer,
            "star_rating": star_rating,
            "star_feedback": star_fb
        }

    async def generate_hint(self, question: str, role: str) -> str:
        """
        Generate progressive, guiding hint for candidates in practice mode
        """
        if self.model:
            prompt = f"""
            You are an interview coach assisting a candidate preparing for a {role} role.
            The interview question is: "{question}"
            
            Provide a helpful, progressive HINT (2-3 sentences max) to guide their thoughts without giving away the full answer.
            Highlight what key technical concepts or structural story points an interviewer expects to hear.
            """
            try:
                res = self.model.generate_content(prompt)
                if res.text.strip():
                    return res.text.strip()
            except Exception as e:
                print(f"Gemini API Error in generate_hint: {e}")

        # Smart fallback hints
        lower_q = question.lower()
        if "strength" in lower_q or "yourself" in lower_q:
            return "💡 Hint: Use the Present-Past-Future framework. State your primary technical focus now, your past experience/project highlight, and why you are excited for this specific role."
        elif "problem" in lower_q or "challenge" in lower_q or "bug" in lower_q:
            return "💡 Hint: Structure your response using STAR. Clearly state what broke or needed improvement, how you diagnosed the root cause, the exact fix you built, and the measurable outcome."
        elif "language" in lower_q or "technology" in lower_q or "api" in lower_q or "sql" in lower_q:
            return f"💡 Hint: Don't just list tools. Discuss trade-offs, performance characteristics (e.g. concurrency, memory, scalability), and a real production scenario where you applied it as a {role}."
        else:
            return f"💡 Hint: Frame your answer around practical problem-solving. Mention the core tools you utilized, your decision-making rationale, and end with the impact on the user or system."

    async def generate_ideal_answer(self, question: str, role: str) -> str:
        """
        Generate a comprehensive, 10/10 exemplary sample answer for study
        """
        if self.model:
            prompt = f"""
            You are a hiring manager for {role} positions.
            Question: "{question}"
            
            Write an exemplary, textbook 10/10 candidate answer following the STAR methodology.
            Keep it natural, professional, and under 150 words. Include specific technical choices and quantitative outcomes.
            """
            try:
                res = self.model.generate_content(prompt)
                if res.text.strip():
                    return res.text.strip()
            except Exception as e:
                print(f"Gemini API Error in generate_ideal_answer: {e}")

        return (
            f"Model Answer: 'During my work on our cloud backend, we needed to optimize data retrieval under peak loads for our {role} application. "
            f"I led the initiative to benchmark our query plans and redesign indexing patterns. "
            f"I implemented a two-tier caching strategy using Redis alongside asynchronous background workers in Python. "
            f"This improved our p99 query latency by 42% and successfully reduced database CPU utilization from 85% to 32%.'"
        )

    async def generate_questions_from_resume(self, resume_text: str, role: str, count: int = 5) -> List[str]:
        """
        Generate interview questions based on resume content
        """
        if self.model:
            prompt = f"""
            You are an expert technical interviewer.
            I have a candidate applying for a {role} position.
            Here is their resume text:
            
            {resume_text[:4000]}
            
            Generate {count} challenging and specific interview questions based on their actual experience, skills, and projects listed in the resume.
            Do not ask generic questions like "Tell me about yourself".
            Focus on the technologies and claims made in the resume.
            
            Return ONLY a JSON array of strings, like this:
            ["Question 1", "Question 2", "Question 3"]
            """
            try:
                response = self.model.generate_content(prompt)
                result = self._extract_json_from_text(response.text)
                if isinstance(result, list) and len(result) > 0:
                    return result[:count]
                elif isinstance(result, dict) and "questions" in result:
                    return result["questions"][:count]
            except Exception as e:
                print(f"Gemini API Error in generate_questions_from_resume: {e}")

        # Intelligent Resume Heuristic Question Generator
        questions = []
        lower = resume_text.lower()
        
        tech_map = {
            "python": "I noticed Python on your resume. Could you describe a production system or script you built using Python, and how you ensured performance?",
            "react": "Your resume highlights React experience. How do you handle complex state management and re-rendering performance in frontend apps?",
            "fastapi": "You listed FastAPI. How did you design your asynchronous API routes, request validation, and OpenAPI documentation?",
            "docker": "You mentioned Docker/containerization. Walk me through how you structured your multi-stage builds and container orchestration.",
            "sql": "You have database/SQL experience. Describe a challenging query optimization or schema migration you executed.",
            "machine learning": "Regarding your ML background: how did you evaluate your models against real-world data drift and edge cases?",
            "deep learning": "Walk me through how you selected your neural network architecture, activation functions, and regularization methods.",
            "aws": "Walk me through how you leveraged cloud infrastructure (AWS/GCP/Azure) for high availability and cost management."
        }
        
        for keyword, q in tech_map.items():
            if keyword in lower and len(questions) < count:
                questions.append(q)
                
        generic_fillers = [
            f"Looking at your background in {role}, what was the most complex project you shipped, and what was your specific contribution?",
            f"Can you walk me through an architecture or design decision you made that you would do differently in retrospect?",
            f"How do you stay current with rapidly evolving tooling and engineering best practices in {role}?",
            f"Describe an incident where a deployment or feature caused unexpected issues in production, and how you resolved it.",
            f"What is your philosophy on writing tests and managing technical debt when deadlines are tight?"
        ]
        
        for g in generic_fillers:
            if len(questions) < count and g not in questions:
                questions.append(g)
                
        return questions[:count]

    async def roast_resume(self, resume_text: str) -> str:
        """
        Roast the resume in a witty, funny, yet constructive way
        """
        if self.model:
            prompt = f"""
            You are a brutal, witty, but helpful career coach.
            Read this resume and "roast" it in a comedic style.
            Point out buzzwords, clichés ("passionate self-starter", "synergized"), vague bullets, or implied formatting sins.
            Keep it under 180 words, punchy and laugh-out-loud funny, but with 1 constructive takeaway at the end.
            
            Resume Text:
            {resume_text[:4000]}
            """
            try:
                response = self.model.generate_content(prompt)
                if response.text.strip():
                    return response.text.strip()
            except Exception as e:
                print(f"Gemini API Error in roast_resume: {e}")

        return (
            "🔥 Resume Roast Alert: I see you listed 'proficient in problem-solving'—the ultimate filler phrase! "
            "Your bullet points read like a dictionary of tech buzzwords had an allergic reaction. "
            "Where are the numbers? Did your code boost revenue, save server costs, or just increase team coffee consumption? "
            "💡 Pro-tip: Swap vague adjectives for hard metrics (e.g. 'Reduced build time by 40%'). Your talent is obvious—now show the data!"
        )

    async def analyze_response(
        self,
        question: str,
        response: str,
        role: str,
        mode: str = "friendly",
        filler_count: int = 0
    ) -> Dict:
        """
        Analyze interview response using Gemini, with 100-mark evaluation and fallback
        """
        if self.model:
            mode_prompt = self._get_mode_prompt(mode)
            prompt = f"""
            You are a professional interview coach specializing in {role} positions.
            {mode_prompt}

            Analyze the user's interview response.
            The response contains {filler_count} filler words.

            Question: {question}
            Response: {response}

            Evaluate on a 100-mark academic scale:
            - Technical Depth (0-40 marks): Concept correctness, design choices, trade-offs.
            - Communication & Tone (0-30 marks): Articulation, confidence, conciseness.
            - STAR Completeness (0-30 marks): Situation, Task, Action, quantifiable Result.

            Provide analysis as a JSON object with this exact structure:
            {{
                "summary": "Brief 2-3 sentence coaching critique",
                "score": <number 1-10>,
                "score_100": <number 0-100>,
                "tech_score": <number 0-40>,
                "comm_score": <number 0-30>,
                "star_score": <number 0-30>,
                "tone": "confident" | "neutral" | "uncertain",
                "clarity": "excellent" | "good" | "moderate" | "needs_improvement",
                "confidence": "high" | "moderate" | "low",
                "improvement_tips": ["tip1", "tip2", "tip3"],
                "missing_concepts": ["concept1", "concept2"],
                "strengths": ["strength1", "strength2"],
                "ideal_answer": "A concise 10/10 model answer demonstrating what a top answer looks like",
                "star_rating": {{
                    "situation": "excellent" | "good" | "missing",
                    "task": "excellent" | "good" | "missing",
                    "action": "excellent" | "good" | "missing",
                    "result": "excellent" | "good" | "missing"
                }},
                "star_feedback": "A short critique focused on their STAR method formatting."
            }}
            """
            try:
                res = self.model.generate_content(prompt)
                parsed = self._extract_json_from_text(res.text)
                if isinstance(parsed, dict) and "score" in parsed and "summary" in parsed:
                    return parsed
            except Exception as e:
                print(f"Gemini API Error in analyze_response: {e}")

        # Use intelligent heuristic coach
        return self._generate_heuristic_feedback(
            question=question,
            response=response,
            role=role,
            mode=mode,
            filler_count=filler_count
        )

    async def generate_next_question(
        self,
        history: List[Dict],
        last_response: str,
        role: str,
        resume_text: str = None
    ) -> str:
        """
        Generate the next interview question based on conversation history
        """
        if self.model:
            context = ""
            for item in history[-3:]:
                context += f"Q: {item.get('question','')}\nA: {item.get('response','')}\n\n"
                
            resume_context = f"\nCandidate Resume Context:\n{resume_text[:2000]}\n" if resume_text else ""
            
            prompt = f"""
            You are an expert technical interviewer for a {role} position.
            You are conducting a live interview.
            
            {resume_context}
            
            Recent Conversation History:
            {context}
            
            The candidate just answered: "{last_response}"
            
            Based on their answer and the history, generate the NEXT single follow-up question.
            - If the answer was vague, ask for clarification.
            - If the answer was good, move to a related advanced topic or a new relevant topic.
            - Keep the question concise and professional.
            - Do not repeat previous questions.
            
            Return ONLY the question text.
            """
            try:
                res = self.model.generate_content(prompt)
                text = res.text.strip().replace('"', '')
                if text and len(text) > 10:
                    return text
            except Exception as e:
                print(f"Gemini API Error in generate_next_question: {e}")

        # Smart fallback follow-up
        lower_resp = last_response.lower()
        if "team" in lower_resp or "people" in lower_resp:
            return "How did you manage conflicts or differing opinions among the team members during that project?"
        elif "bug" in lower_resp or "error" in lower_resp or "fail" in lower_resp:
            return "What systemic measures did you put in place to ensure that class of failure wouldn't happen again?"
        elif "test" in lower_resp or "deploy" in lower_resp:
            return "Could you walk me through your automated verification and rollback strategy for that deployment?"
        elif len(last_response.split()) < 20:
            return f"Could you elaborate a bit more on the technical specifics and trade-offs of that approach for a {role}?"
        else:
            return f"That's insightful. Looking forward, how would you apply those learnings to a large-scale system in a {role} role?"
