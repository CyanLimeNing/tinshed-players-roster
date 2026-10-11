"""Tinshed Players Crew Roster -- Flask REST API (SQLite-backed).

This module implements the roster management web application used as the
software artefact for ISYS3001 Assessment 2 (Configuration and Procurement
Management). Data is persisted in a SQLite database so that the roster
survives server restarts.

The application exposes four resource groups over a REST API:

- volunteers  (name + contact, soft deactivate flag)
- productions (titled shows)
- performances (a dated/show-time instance of a production)
- assignments (a volunteer placed in a role for a performance)

Domain rule: a volunteer may hold at most one role in any single performance.
This rule is enforced both in the application layer and as a UNIQUE database
constraint, so a second assignment for the same volunteer and performance is
refused with HTTP 400.
"""

import json
import os
import sqlite3

from flask import Flask, g, jsonify, request

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
# Application settings are read from config/app.json (checked into the
# repository as deployment configuration). Environment variables override the
# file values so secrets and machine-specific values never need to be stored
# in version control.
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_DEFAULTS = {
    "DB_PATH": os.path.join(_BASE_DIR, "data", "tinshed.db"),
    "PORT": 5000,
    "DEBUG": True,
}


def _load_config():
    """Read config/app.json and merge it over the safe defaults."""
    config = dict(_DEFAULTS)
    config_path = os.path.join(_BASE_DIR, "config", "app.json")
    try:
        with open(config_path, "r", encoding="utf-8") as handle:
            file_config = json.load(handle)
        config.update(file_config)
    except (OSError, ValueError):
        # Missing or malformed config file: fall back to defaults.
        pass
    # Environment variables take precedence over the file.
    config["DB_PATH"] = os.environ.get("DB_PATH", config["DB_PATH"])
    if not os.path.isabs(config["DB_PATH"]):
        config["DB_PATH"] = os.path.join(_BASE_DIR, config["DB_PATH"])
    config["PORT"] = int(os.environ.get("PORT", config["PORT"]))
    config["HOST"] = os.environ.get("HOST", config.get("HOST", "127.0.0.1"))
    config["ENV"] = os.environ.get("ENV", config.get("ENV", "development"))
    config["DEBUG"] = os.environ.get("DEBUG", str(config["DEBUG"])).lower() == "true"
    return config


_CONFIG = _load_config()
app.config["DB_PATH"] = _CONFIG["DB_PATH"]
app.config["PORT"] = _CONFIG["PORT"]
app.config["HOST"] = _CONFIG["HOST"]
app.config["ENV"] = _CONFIG["ENV"]
app.config["DEBUG"] = _CONFIG["DEBUG"]

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
_SCHEMA = """
CREATE TABLE IF NOT EXISTS volunteers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    contact    TEXT,
    is_active  INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS productions (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT    NOT NULL
);
CREATE TABLE IF NOT EXISTS performances (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    production_id INTEGER NOT NULL,
    show_date     TEXT,
    start_time    TEXT,
    FOREIGN KEY (production_id) REFERENCES productions(id)
);
CREATE TABLE IF NOT EXISTS assignments (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    volunteer_id   INTEGER NOT NULL,
    performance_id INTEGER NOT NULL,
    role           TEXT,
    confirmed      INTEGER NOT NULL DEFAULT 0,
    UNIQUE (volunteer_id, performance_id),
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id),
    FOREIGN KEY (performance_id) REFERENCES performances(id)
);
"""


def _connect():
    """Open a fresh connection and ensure the schema exists."""
    db_dir = os.path.dirname(app.config["DB_PATH"])
    if db_dir and not os.path.isdir(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(app.config["DB_PATH"])
    conn.row_factory = sqlite3.Row
    conn.executescript(_SCHEMA)
    conn.commit()
    return conn


def get_db():
    """Return a per-request database connection, reusing it within a request."""
    db = getattr(g, "_db", None)
    if db is None:
        db = g._db = _connect()
    return db


@app.teardown_appcontext
def close_db(_exc):
    """Close the per-request connection when the request ends."""
    db = getattr(g, "_db", None)
    if db is not None:
        db.close()


def reset_data():
    """Clear all rows and reset auto-increment counters (used by the tests)."""
    conn = _connect()
    try:
        conn.executescript(
            "DELETE FROM assignments;"
            "DELETE FROM performances;"
            "DELETE FROM productions;"
            "DELETE FROM volunteers;"
            "DELETE FROM sqlite_sequence;"
        )
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Row -> JSON helpers (SQLite stores booleans as 0/1)
# ---------------------------------------------------------------------------
def _volunteer_dict(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "contact": row["contact"],
        "is_active": bool(row["is_active"]),
    }


def _production_dict(row):
    return {"id": row["id"], "title": row["title"]}


def _performance_dict(row):
    return {
        "id": row["id"],
        "production_id": row["production_id"],
        "show_date": row["show_date"],
        "start_time": row["start_time"],
    }


def _assignment_dict(row):
    return {
        "id": row["id"],
        "volunteer_id": row["volunteer_id"],
        "performance_id": row["performance_id"],
        "role": row["role"],
        "confirmed": bool(row["confirmed"]),
    }


# ===========================================================================
# Volunteers
# ===========================================================================
@app.route("/volunteers", methods=["GET"])
def get_all_volunteers():
    rows = get_db().execute("SELECT * FROM volunteers ORDER BY id").fetchall()
    return jsonify([_volunteer_dict(r) for r in rows])


@app.route("/volunteers", methods=["POST"])
def create_volunteer():
    data = request.get_json() or {}
    name = data.get("name")
    if not name:
        return jsonify({"error": "Name is required"}), 400
    cur = get_db().execute(
        "INSERT INTO volunteers (name, contact, is_active) VALUES (?, ?, 1)",
        (name, data.get("contact")),
    )
    get_db().commit()
    row = get_db().execute(
        "SELECT * FROM volunteers WHERE id = ?", (cur.lastrowid,)
    ).fetchone()
    return jsonify(_volunteer_dict(row)), 201


@app.route("/volunteers/<int:vid>", methods=["GET"])
def get_volunteer(vid):
    row = get_db().execute(
        "SELECT * FROM volunteers WHERE id = ?", (vid,)
    ).fetchone()
    if not row:
        return jsonify({"message": "Volunteer not found"}), 404
    return jsonify(_volunteer_dict(row))


@app.route("/volunteers/<int:vid>", methods=["PUT"])
def update_volunteer(vid):
    db = get_db()
    row = db.execute("SELECT * FROM volunteers WHERE id = ?", (vid,)).fetchone()
    if not row:
        return jsonify({"message": "Volunteer not found"}), 404
    data = request.get_json() or {}
    db.execute(
        "UPDATE volunteers SET name = ?, contact = ?, is_active = ? WHERE id = ?",
        (
            data.get("name", row["name"]),
            data.get("contact", row["contact"]),
            int(data.get("is_active", bool(row["is_active"]))),
            vid,
        ),
    )
    db.commit()
    updated = db.execute(
        "SELECT * FROM volunteers WHERE id = ?", (vid,)
    ).fetchone()
    return jsonify(_volunteer_dict(updated))


@app.route("/volunteers/<int:vid>", methods=["DELETE"])
def delete_volunteer(vid):
    db = get_db()
    row = db.execute("SELECT * FROM volunteers WHERE id = ?", (vid,)).fetchone()
    if not row:
        return jsonify({"message": "Volunteer not found"}), 404
    db.execute("DELETE FROM volunteers WHERE id = ?", (vid,))
    db.commit()
    return jsonify({"message": "Volunteer deleted"})


# ===========================================================================
# Productions
# ===========================================================================
@app.route("/productions", methods=["GET"])
def get_all_productions():
    rows = get_db().execute("SELECT * FROM productions ORDER BY id").fetchall()
    return jsonify([_production_dict(r) for r in rows])


@app.route("/productions", methods=["POST"])
def create_production():
    data = request.get_json() or {}
    title = data.get("title")
    if not title:
        return jsonify({"error": "Title is required"}), 400
    db = get_db()
    cur = db.execute("INSERT INTO productions (title) VALUES (?)", (title,))
    db.commit()
    row = db.execute(
        "SELECT * FROM productions WHERE id = ?", (cur.lastrowid,)
    ).fetchone()
    return jsonify(_production_dict(row)), 201


@app.route("/productions/<int:pid>", methods=["GET"])
def get_production(pid):
    row = get_db().execute(
        "SELECT * FROM productions WHERE id = ?", (pid,)
    ).fetchone()
    if not row:
        return jsonify({"message": "Production not found"}), 404
    return jsonify(_production_dict(row))


@app.route("/productions/<int:pid>", methods=["PUT"])
def update_production(pid):
    db = get_db()
    row = db.execute("SELECT * FROM productions WHERE id = ?", (pid,)).fetchone()
    if not row:
        return jsonify({"message": "Production not found"}), 404
    data = request.get_json() or {}
    db.execute(
        "UPDATE productions SET title = ? WHERE id = ?",
        (data.get("title", row["title"]), pid),
    )
    db.commit()
    updated = db.execute(
        "SELECT * FROM productions WHERE id = ?", (pid,)
    ).fetchone()
    return jsonify(_production_dict(updated))


@app.route("/productions/<int:pid>", methods=["DELETE"])
def delete_production(pid):
    db = get_db()
    row = db.execute("SELECT * FROM productions WHERE id = ?", (pid,)).fetchone()
    if not row:
        return jsonify({"message": "Production not found"}), 404
    db.execute("DELETE FROM productions WHERE id = ?", (pid,))
    db.commit()
    return jsonify({"message": "Production deleted"})


# ===========================================================================
# Performances
# ===========================================================================
@app.route("/performances", methods=["GET"])
def get_all_performances():
    rows = get_db().execute("SELECT * FROM performances ORDER BY id").fetchall()
    return jsonify([_performance_dict(r) for r in rows])


@app.route("/performances", methods=["POST"])
def create_performance():
    data = request.get_json() or {}
    db = get_db()
    production_id = data.get("production_id")
    prod = db.execute(
        "SELECT * FROM productions WHERE id = ?", (production_id,)
    ).fetchone()
    if not prod:
        return jsonify({"error": "Production not found"}), 400
    cur = db.execute(
        "INSERT INTO performances (production_id, show_date, start_time)"
        " VALUES (?, ?, ?)",
        (production_id, data.get("show_date"), data.get("start_time")),
    )
    db.commit()
    row = db.execute(
        "SELECT * FROM performances WHERE id = ?", (cur.lastrowid,)
    ).fetchone()
    return jsonify(_performance_dict(row)), 201


@app.route("/performances/<int:pfid>", methods=["GET"])
def get_performance(pfid):
    row = get_db().execute(
        "SELECT * FROM performances WHERE id = ?", (pfid,)
    ).fetchone()
    if not row:
        return jsonify({"message": "Performance not found"}), 404
    return jsonify(_performance_dict(row))


@app.route("/performances/<int:pfid>", methods=["PUT"])
def update_performance(pfid):
    db = get_db()
    row = db.execute(
        "SELECT * FROM performances WHERE id = ?", (pfid,)
    ).fetchone()
    if not row:
        return jsonify({"message": "Performance not found"}), 404
    data = request.get_json() or {}
    db.execute(
        "UPDATE performances SET production_id = ?, show_date = ?, start_time = ?"
        " WHERE id = ?",
        (
            data.get("production_id", row["production_id"]),
            data.get("show_date", row["show_date"]),
            data.get("start_time", row["start_time"]),
            pfid,
        ),
    )
    db.commit()
    updated = db.execute(
        "SELECT * FROM performances WHERE id = ?", (pfid,)
    ).fetchone()
    return jsonify(_performance_dict(updated))


@app.route("/performances/<int:pfid>", methods=["DELETE"])
def delete_performance(pfid):
    db = get_db()
    row = db.execute(
        "SELECT * FROM performances WHERE id = ?", (pfid,)
    ).fetchone()
    if not row:
        return jsonify({"message": "Performance not found"}), 404
    db.execute("DELETE FROM performances WHERE id = ?", (pfid,))
    db.commit()
    return jsonify({"message": "Performance deleted"})


# ===========================================================================
# Assignments (the core rostering business rule lives here)
# ===========================================================================
@app.route("/assignments", methods=["GET"])
def get_all_assignments():
    rows = get_db().execute("SELECT * FROM assignments ORDER BY id").fetchall()
    return jsonify([_assignment_dict(r) for r in rows])


@app.route("/assignments", methods=["POST"])
def create_assignment():
    db = get_db()
    data = request.get_json() or {}
    volunteer_id = data.get("volunteer_id")
    performance_id = data.get("performance_id")
    role = data.get("role")

    # Referential integrity: the volunteer and the performance must exist.
    volunteer = db.execute(
        "SELECT * FROM volunteers WHERE id = ?", (volunteer_id,)
    ).fetchone()
    performance = db.execute(
        "SELECT * FROM performances WHERE id = ?", (performance_id,)
    ).fetchone()
    if not volunteer or not performance:
        return jsonify({"error": "Volunteer or performance not found"}), 400

    # Business rule: a volunteer may hold at most one role per performance.
    conflict = db.execute(
        "SELECT * FROM assignments"
        " WHERE volunteer_id = ? AND performance_id = ?",
        (volunteer_id, performance_id),
    ).fetchone()
    if conflict:
        return jsonify(
            {"error": "Rule violation: One volunteer cannot hold multiple roles"
                      " for same performance"}
        ), 400

    cur = db.execute(
        "INSERT INTO assignments (volunteer_id, performance_id, role, confirmed)"
        " VALUES (?, ?, ?, 0)",
        (volunteer_id, performance_id, role),
    )
    db.commit()
    row = db.execute(
        "SELECT * FROM assignments WHERE id = ?", (cur.lastrowid,)
    ).fetchone()
    return jsonify(_assignment_dict(row)), 201


@app.route("/assignments/<int:aid>", methods=["PUT"])
def update_assignment(aid):
    db = get_db()
    row = db.execute(
        "SELECT * FROM assignments WHERE id = ?", (aid,)
    ).fetchone()
    if not row:
        return jsonify({"message": "Assignment not found"}), 404
    data = request.get_json() or {}
    db.execute(
        "UPDATE assignments SET role = ?, confirmed = ? WHERE id = ?",
        (
            data.get("role", row["role"]),
            int(data.get("confirmed", bool(row["confirmed"]))),
            aid,
        ),
    )
    db.commit()
    updated = db.execute(
        "SELECT * FROM assignments WHERE id = ?", (aid,)
    ).fetchone()
    return jsonify(_assignment_dict(updated))


@app.route("/assignments/<int:aid>", methods=["DELETE"])
def delete_assignment(aid):
    db = get_db()
    row = db.execute(
        "SELECT * FROM assignments WHERE id = ?", (aid,)
    ).fetchone()
    if not row:
        return jsonify({"message": "Assignment not found"}), 404
    db.execute("DELETE FROM assignments WHERE id = ?", (aid,))
    db.commit()
    return jsonify({"message": "Assignment removed"})


if __name__ == "__main__":
    # Development entry point. Production uses wsgi.py with a WSGI server.
    app.run(
        debug=app.config["DEBUG"],
        host=app.config["HOST"],
        port=app.config["PORT"],
    )
