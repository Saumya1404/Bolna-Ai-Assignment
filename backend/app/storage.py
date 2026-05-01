import json
import sqlite3
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "data"
DB_PATH = DATA_DIR / "clinic.db"
DOCTORS_PATH = DATA_DIR / "doctors.json"
APPOINTMENTS_SEED = DATA_DIR / "appointments.json"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS appointments ("
            "id TEXT PRIMARY KEY,"
            "patient_name TEXT,"
            "phone TEXT,"
            "doctor TEXT,"
            "date TEXT,"
            "time TEXT,"
            "status TEXT,"
            "transcript TEXT,"
            "summary TEXT,"
            "manager_flag INTEGER"
            ")"
        )
        conn.commit()


def seed_appointments_if_empty() -> None:
    if not APPOINTMENTS_SEED.exists():
        return
    with get_connection() as conn:
        count = conn.execute("SELECT COUNT(*) FROM appointments").fetchone()[0]
        if count > 0:
            return
        records = json.loads(APPOINTMENTS_SEED.read_text(encoding="utf-8"))
        for row in records:
            conn.execute(
                "INSERT INTO appointments ("
                "id, patient_name, phone, doctor, date, time, status, transcript, summary, manager_flag"
                ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    row.get("id", ""),
                    row.get("patient_name", ""),
                    row.get("phone", ""),
                    row.get("doctor", ""),
                    row.get("date", ""),
                    row.get("time", ""),
                    row.get("status", ""),
                    row.get("transcript", ""),
                    row.get("summary", ""),
                    1 if row.get("manager_flag") else 0,
                ),
            )
        conn.commit()


def load_doctors() -> list[dict]:
    if not DOCTORS_PATH.exists():
        return []
    return json.loads(DOCTORS_PATH.read_text(encoding="utf-8"))


def list_appointments(
    appointment_id: str | None = None,
    phone: str | None = None,
    patient_name: str | None = None,
) -> list[dict]:
    query = "SELECT * FROM appointments WHERE 1=1"
    params: list[str] = []
    if appointment_id:
        query += " AND id = ?"
        params.append(appointment_id)
    if phone:
        query += " AND phone = ?"
        params.append(phone)
    if patient_name:
        query += " AND lower(patient_name) = lower(?)"
        params.append(patient_name)
    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()
    return [
        {
            **dict(row),
            "manager_flag": bool(row["manager_flag"]),
        }
        for row in rows
    ]


def insert_appointment(record: dict) -> None:
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO appointments ("
            "id, patient_name, phone, doctor, date, time, status, transcript, summary, manager_flag"
            ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                record["id"],
                record["patient_name"],
                record["phone"],
                record["doctor"],
                record["date"],
                record["time"],
                record["status"],
                record.get("transcript", ""),
                record.get("summary", ""),
                1 if record.get("manager_flag") else 0,
            ),
        )
        conn.commit()


def update_appointment(appointment_id: str, updates: dict) -> None:
    if not updates:
        return
    fields = []
    params: list[str | int] = []
    for key, value in updates.items():
        if key == "manager_flag":
            fields.append("manager_flag = ?")
            params.append(1 if value else 0)
        else:
            fields.append(f"{key} = ?")
            params.append(value)
    params.append(appointment_id)
    query = "UPDATE appointments SET " + ", ".join(fields) + " WHERE id = ?"
    with get_connection() as conn:
        conn.execute(query, params)
        conn.commit()


def slot_taken(
    doctor: str, date: str, time: str, exclude_id: str | None = None
) -> bool:
    query = (
        "SELECT COUNT(*) FROM appointments "
        "WHERE doctor = ? AND date = ? AND time = ? AND status != 'cancelled'"
    )
    params: list[str] = [doctor, date, time]
    if exclude_id:
        query += " AND id != ?"
        params.append(exclude_id)
    with get_connection() as conn:
        count = conn.execute(query, params).fetchone()[0]
    return count > 0

def delete_appointment(appointment_id: str) -> None:
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM appointments WHERE id = ?",
            (appointment_id,),
        )
        conn.commit()