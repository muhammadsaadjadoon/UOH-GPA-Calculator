from __future__ import annotations

import os
import re
import secrets
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, render_template, request, session
from werkzeug.security import check_password_hash, generate_password_hash


app = Flask(__name__, instance_relative_config=True)
Path(app.instance_path).mkdir(parents=True, exist_ok=True)

DATABASE_PATH = Path(app.instance_path) / "uoh_gpa.db"
SECRET_FILE = Path(app.instance_path) / ".session_secret"


def _load_secret_key() -> str:
    configured = os.environ.get("APP_SECRET", "").strip()
    if configured:
        return configured

    if SECRET_FILE.exists():
        return SECRET_FILE.read_text(encoding="utf-8").strip()

    generated = secrets.token_urlsafe(48)
    SECRET_FILE.write_text(generated, encoding="utf-8")
    return generated


app.secret_key = _load_secret_key()
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,  # local development uses http://127.0.0.1
    MAX_CONTENT_LENGTH=1024 * 1024,
)


@app.after_request
def security_headers(response):
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()",
    )
    response.headers.setdefault(
        "Content-Security-Policy",
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "connect-src 'self'; "
        "font-src 'self'; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "frame-ancestors 'none'",
    )
    return response


def db_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db() -> None:
    with db_connection() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS profiles (
                user_id INTEGER PRIMARY KEY,
                student_id TEXT,
                program TEXT,
                semester INTEGER,
                target_cgpa REAL,
                bio TEXT,
                avatar_data TEXT,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS calculations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                result_type TEXT NOT NULL CHECK(result_type IN ('gpa', 'cgpa')),
                value REAL NOT NULL CHECK(value >= 0 AND value <= 4),
                total_credits REAL NOT NULL CHECK(total_credits > 0),
                total_quality_points REAL NOT NULL CHECK(total_quality_points >= 0),
                item_count INTEGER NOT NULL CHECK(item_count >= 1),
                letter TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_calculations_user_created
            ON calculations(user_id, created_at DESC);
            """
        )


init_db()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_email(value: object) -> str:
    return str(value or "").strip().lower()


def valid_email(email: str) -> bool:
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email))


def current_user() -> dict | None:
    user_id = session.get("user_id")
    if not user_id:
        return None

    with db_connection() as db:
        row = db.execute(
            "SELECT id, full_name, email, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

    if row is None:
        session.clear()
        return None

    return dict(row)


def require_user():
    user = current_user()
    if user is None:
        return None, (jsonify({"error": "Sign in to use account history."}), 401)
    return user, None



def clean_optional_text(value: object, max_length: int) -> str:
    return str(value or "").strip()[:max_length]


def valid_avatar_data(value: str) -> bool:
    if not value:
        return True
    if len(value) > 450_000:
        return False
    return bool(
        re.fullmatch(
            r"data:image/jpeg;base64,[A-Za-z0-9+/=]+",
            value,
        )
    )


def profile_for_user(user_id: int) -> dict:
    with db_connection() as db:
        row = db.execute(
            """
            SELECT student_id, program, semester, target_cgpa, bio, avatar_data, updated_at
            FROM profiles
            WHERE user_id = ?
            """,
            (user_id,),
        ).fetchone()

    if row is None:
        return {
            "student_id": "",
            "program": "",
            "semester": None,
            "target_cgpa": None,
            "bio": "",
            "avatar_data": "",
            "updated_at": None,
        }

    return dict(row)



def grade_from_marks(marks: float) -> tuple[str, float]:
    if 85 <= marks <= 100:
        return "A", 4.00
    if 80 <= marks < 85:
        return "A-", round(3.50 + ((marks - 80) * 0.10), 2)
    if 75 <= marks < 80:
        return "B+", round(3.00 + ((marks - 75) * 0.10), 2)
    if 70 <= marks < 75:
        return "B", round(2.50 + ((marks - 70) * 0.10), 2)
    if 65 <= marks < 70:
        return "B-", round(2.00 + ((marks - 65) * 0.10), 2)
    if 60 <= marks < 65:
        return "C+", round(1.50 + ((marks - 60) * 0.10), 2)
    if 55 <= marks < 60:
        return "C", round(1.00 + ((marks - 55) * 0.10), 2)
    if 50 <= marks < 55:
        return "D", round(0.50 + ((marks - 50) * 0.10), 2)
    return "F", 0.00


def gpa_letter(gpa: float) -> str:
    if gpa >= 4.00:
        return "A"
    if gpa >= 3.50:
        return "A-"
    if gpa >= 3.00:
        return "B+"
    if gpa >= 2.50:
        return "B"
    if gpa >= 2.00:
        return "B-"
    if gpa >= 1.50:
        return "C+"
    if gpa >= 1.00:
        return "C"
    if gpa >= 0.50:
        return "D"
    return "F"


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/health")
def health():
    return jsonify({"status": "ok", "app": "UoH GPA Calculator"})


@app.get("/api/auth/me")
def auth_me():
    user = current_user()
    return jsonify({"authenticated": bool(user), "user": user})


@app.post("/api/auth/register")
def auth_register():
    payload = request.get_json(silent=True) or {}
    full_name = str(payload.get("full_name") or "").strip()
    email = normalize_email(payload.get("email"))
    password = str(payload.get("password") or "")

    if len(full_name) < 2 or len(full_name) > 70:
        return jsonify({"error": "Enter your full name."}), 400
    if not valid_email(email) or len(email) > 120:
        return jsonify({"error": "Enter a valid email address."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400
    if len(password) > 128:
        return jsonify({"error": "Password is too long."}), 400

    try:
        with db_connection() as db:
            cursor = db.execute(
                """
                INSERT INTO users (full_name, email, password_hash, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (full_name, email, generate_password_hash(password), utc_now()),
            )
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        return jsonify({"error": "An account with this email already exists."}), 409

    session.clear()
    session["user_id"] = int(user_id)
    return jsonify({"ok": True, "user": current_user()}), 201


@app.post("/api/auth/login")
def auth_login():
    payload = request.get_json(silent=True) or {}
    email = normalize_email(payload.get("email"))
    password = str(payload.get("password") or "")

    if not valid_email(email) or not password:
        return jsonify({"error": "Email or password is incorrect."}), 401

    with db_connection() as db:
        row = db.execute(
            "SELECT id, password_hash FROM users WHERE email = ?",
            (email,),
        ).fetchone()

    if row is None or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "Email or password is incorrect."}), 401

    session.clear()
    session["user_id"] = int(row["id"])
    return jsonify({"ok": True, "user": current_user()})


@app.post("/api/auth/logout")
def auth_logout():
    session.clear()
    return jsonify({"ok": True})


@app.get("/api/profile")
def get_profile():
    user, error = require_user()
    if error:
        return error

    return jsonify(
        {
            "user": user,
            "profile": profile_for_user(user["id"]),
        }
    )


@app.put("/api/profile")
def update_profile():
    user, error = require_user()
    if error:
        return error

    payload = request.get_json(silent=True) or {}

    full_name = str(payload.get("full_name") or "").strip()
    student_id = clean_optional_text(payload.get("student_id"), 40)
    program = clean_optional_text(payload.get("program"), 80)
    bio = clean_optional_text(payload.get("bio"), 180)
    avatar_data = str(payload.get("avatar_data") or "")

    semester_raw = payload.get("semester")
    target_raw = payload.get("target_cgpa")

    if len(full_name) < 2 or len(full_name) > 70:
        return jsonify({"error": "Enter a valid full name."}), 400

    semester = None
    if semester_raw not in (None, ""):
        try:
            semester = int(semester_raw)
        except (TypeError, ValueError):
            return jsonify({"error": "Semester must be a whole number."}), 400
        if semester < 1 or semester > 16:
            return jsonify({"error": "Semester must be between 1 and 16."}), 400

    target_cgpa = None
    if target_raw not in (None, ""):
        try:
            target_cgpa = float(target_raw)
        except (TypeError, ValueError):
            return jsonify({"error": "Target CGPA must be a number."}), 400
        if target_cgpa < 0 or target_cgpa > 4:
            return jsonify({"error": "Target CGPA must be between 0.00 and 4.00."}), 400
        target_cgpa = round(target_cgpa, 2)

    if not valid_avatar_data(avatar_data):
        return jsonify({"error": "Profile photo is invalid or too large."}), 400

    updated_at = utc_now()

    with db_connection() as db:
        db.execute(
            "UPDATE users SET full_name = ? WHERE id = ?",
            (full_name, user["id"]),
        )
        db.execute(
            """
            INSERT INTO profiles (
                user_id, student_id, program, semester,
                target_cgpa, bio, avatar_data, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                student_id = excluded.student_id,
                program = excluded.program,
                semester = excluded.semester,
                target_cgpa = excluded.target_cgpa,
                bio = excluded.bio,
                avatar_data = excluded.avatar_data,
                updated_at = excluded.updated_at
            """,
            (
                user["id"],
                student_id,
                program,
                semester,
                target_cgpa,
                bio,
                avatar_data,
                updated_at,
            ),
        )

    return jsonify(
        {
            "ok": True,
            "user": current_user(),
            "profile": profile_for_user(user["id"]),
        }
    )


@app.get("/api/history")
def account_history():
    user, error = require_user()
    if error:
        return error

    with db_connection() as db:
        rows = db.execute(
            """
            SELECT id, result_type, value, total_credits, total_quality_points,
                   item_count, letter, created_at
            FROM calculations
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 50
            """,
            (user["id"],),
        ).fetchall()

    return jsonify(
        {
            "items": [
                {
                    "id": row["id"],
                    "type": row["result_type"],
                    "value": row["value"],
                    "totalCredits": row["total_credits"],
                    "totalQP": row["total_quality_points"],
                    "count": row["item_count"],
                    "letter": row["letter"],
                    "timestamp": row["created_at"],
                }
                for row in rows
            ]
        }
    )


@app.post("/api/history")
def save_account_history():
    user, error = require_user()
    if error:
        return error

    payload = request.get_json(silent=True) or {}
    result_type = str(payload.get("type") or "").lower()

    try:
        value = float(payload["value"])
        total_credits = float(payload["totalCredits"])
        total_qp = float(payload["totalQP"])
        item_count = int(payload["count"])
        letter = str(payload["letter"]).strip()[:4]
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "Invalid history data."}), 400

    if result_type not in {"gpa", "cgpa"}:
        return jsonify({"error": "Invalid result type."}), 400
    if not (0 <= value <= 4):
        return jsonify({"error": "Invalid result value."}), 400
    if total_credits <= 0 or total_credits > 1000:
        return jsonify({"error": "Invalid credit total."}), 400
    if total_qp < 0 or total_qp > (total_credits * 4.001):
        return jsonify({"error": "Invalid quality-point total."}), 400
    if item_count < 1 or item_count > 100:
        return jsonify({"error": "Invalid item count."}), 400
    if not re.fullmatch(r"(?:A-?|B[+-]?|C\+?|D|F)", letter):
        return jsonify({"error": "Invalid letter grade."}), 400

    with db_connection() as db:
        db.execute(
            """
            INSERT INTO calculations (
                user_id, result_type, value, total_credits,
                total_quality_points, item_count, letter, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                result_type,
                value,
                total_credits,
                total_qp,
                item_count,
                letter,
                utc_now(),
            ),
        )

    return jsonify({"ok": True}), 201


@app.delete("/api/history/<int:item_id>")
def delete_account_history(item_id: int):
    user, error = require_user()
    if error:
        return error

    with db_connection() as db:
        db.execute(
            "DELETE FROM calculations WHERE id = ? AND user_id = ?",
            (item_id, user["id"]),
        )

    return jsonify({"ok": True})


@app.delete("/api/history")
def clear_account_history():
    user, error = require_user()
    if error:
        return error

    with db_connection() as db:
        db.execute("DELETE FROM calculations WHERE user_id = ?", (user["id"],))

    return jsonify({"ok": True})


@app.post("/api/calculate-gpa")
def calculate_gpa():
    payload = request.get_json(silent=True) or {}
    subjects = payload.get("subjects", [])

    if not isinstance(subjects, list) or not subjects or len(subjects) > 30:
        return jsonify({"error": "Add between 1 and 30 subjects."}), 400

    details = []
    total_credits = 0.0
    total_quality_points = 0.0

    for index, subject in enumerate(subjects, start=1):
        try:
            name = str(subject.get("name") or f"Subject {index}").strip()[:80]
            marks = float(subject["marks"])
            credits = float(subject["credit_hours"])
        except (KeyError, TypeError, ValueError):
            return jsonify({"error": f"Subject {index} contains invalid values."}), 400

        if not 0 <= marks <= 100:
            return jsonify({"error": f"Marks for subject {index} must be between 0 and 100."}), 400
        if not 0.5 <= credits <= 6:
            return jsonify({"error": f"Credit hours for subject {index} must be between 0.5 and 6."}), 400

        letter, points = grade_from_marks(marks)
        quality_points = points * credits
        total_credits += credits
        total_quality_points += quality_points

        details.append(
            {
                "name": name,
                "marks": marks,
                "credit_hours": credits,
                "grade": letter,
                "points": round(points, 2),
                "quality_points": round(quality_points, 2),
            }
        )

    gpa = round(total_quality_points / total_credits, 2)
    return jsonify(
        {
            "gpa": gpa,
            "letter": gpa_letter(gpa),
            "total_credits": round(total_credits, 2),
            "total_quality_points": round(total_quality_points, 2),
            "subjects": details,
        }
    )


@app.post("/api/calculate-cgpa")
def calculate_cgpa():
    payload = request.get_json(silent=True) or {}
    semesters = payload.get("semesters", [])

    if not isinstance(semesters, list) or not semesters or len(semesters) > 30:
        return jsonify({"error": "Add between 1 and 30 semesters."}), 400

    details = []
    total_credits = 0.0
    total_quality_points = 0.0

    for index, semester in enumerate(semesters, start=1):
        try:
            name = str(semester.get("name") or f"Semester {index}").strip()[:80]
            gpa = float(semester["gpa"])
            credits = float(semester["credit_hours"])
        except (KeyError, TypeError, ValueError):
            return jsonify({"error": f"Semester {index} contains invalid values."}), 400

        if not 0 <= gpa <= 4:
            return jsonify({"error": f"GPA for semester {index} must be between 0 and 4."}), 400
        if not 1 <= credits <= 30:
            return jsonify({"error": f"Credit hours for semester {index} must be between 1 and 30."}), 400

        quality_points = gpa * credits
        total_credits += credits
        total_quality_points += quality_points

        details.append(
            {
                "name": name,
                "gpa": round(gpa, 2),
                "credit_hours": credits,
                "letter": gpa_letter(gpa),
                "quality_points": round(quality_points, 2),
            }
        )

    cgpa = round(total_quality_points / total_credits, 2)
    return jsonify(
        {
            "cgpa": cgpa,
            "letter": gpa_letter(cgpa),
            "total_credits": round(total_credits, 2),
            "total_quality_points": round(total_quality_points, 2),
            "semesters": details,
        }
    )


@app.errorhandler(413)
def payload_too_large(_error):
    return jsonify({"error": "Request is too large."}), 413


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "5000")),
        debug=os.environ.get("FLASK_DEBUG") == "1",
    )
