from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import HTMLResponse

from . import schemas, storage


@asynccontextmanager
async def lifespan(app: FastAPI):
    storage.init_db()
    storage.seed_appointments_if_empty()
    global DOCTORS
    DOCTORS = storage.load_doctors()
    yield


app = FastAPI(title="CarePlus Clinic API", lifespan=lifespan)
DOCTORS: list[dict] = []


def _parse_date(value: str):
    if not value:
        return None
    value = value.strip()
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


def _parse_time(value: str):
    if not value:
        return None
    value = value.strip().upper()
    for fmt in ("%H:%M", "%I:%M %p", "%I %p", "%H:%M:%S"):
        try:
            return datetime.strptime(value, fmt).time()
        except ValueError:
            continue
    return None


def _time_in_range(time_str: str, time_range: str) -> bool:
    parts = time_range.split("-")
    if len(parts) != 2:
        return False
    start = _parse_time(parts[0])
    end = _parse_time(parts[1])
    check = _parse_time(time_str)
    if not start or not end or not check:
        return False
    return start <= check <= end


def _doctor_by_name(name: str) -> dict | None:
    for doctor in DOCTORS:
        if doctor.get("name", "").lower() == name.lower():
            return doctor
    return None


def _matching_doctors(doctor: str | None, specialization: str | None) -> list[dict]:
    if doctor:
        match = _doctor_by_name(doctor)
        return [match] if match else []
    if specialization:
        return [
            doc
            for doc in DOCTORS
            if doc.get("specialization", "").lower() == specialization.lower()
        ]
    return []


def _doctor_day_ok(doctor: dict, date_str: str) -> bool:
    date_val = _parse_date(date_str)
    if not date_val:
        return False
    day = date_val.strftime("%a")
    return day in doctor.get("available_days", [])


def _doctor_schedule_ok(doctor: dict, date_str: str, time_str: str) -> bool:
    if not _doctor_day_ok(doctor, date_str):
        return False
    for time_range in doctor.get("available_hours", []):
        if _time_in_range(time_str, time_range):
            return True
    return False


def _slot_available(
    doctor_name: str, date_str: str, time_str: str, exclude_id: str | None = None
) -> bool:
    doctor = _doctor_by_name(doctor_name)
    if not doctor:
        return False
    if not _doctor_schedule_ok(doctor, date_str, time_str):
        return False
    return not storage.slot_taken(doctor_name, date_str, time_str, exclude_id)


def _find_alternatives(
    doctors: list[dict], date_str: str, time_str: str, limit: int = 2
) -> list[schemas.AlternativeSlot]:
    date_val = _parse_date(date_str)
    if not date_val:
        return []
    alternatives: list[schemas.AlternativeSlot] = []
    for doctor in doctors:
        if not _doctor_day_ok(doctor, date_str):
            continue
        for time_range in doctor.get("available_hours", []):
            parts = time_range.split("-")
            if len(parts) != 2:
                continue
            start_str, end_str = parts
            start_time = _parse_time(start_str)
            end_time = _parse_time(end_str)
            if not start_time or not end_time:
                continue
            current = datetime.combine(date_val, start_time)
            end_dt = datetime.combine(date_val, end_time)
            while current <= end_dt:
                candidate_time = current.strftime("%H:%M")
                if candidate_time != time_str and _slot_available(
                    doctor["name"], date_str, candidate_time
                ):
                    alternatives.append(
                        schemas.AlternativeSlot(
                            doctor=doctor["name"],
                            date=date_str,
                            time=candidate_time,
                        )
                    )
                    if len(alternatives) >= limit:
                        return alternatives
                current += timedelta(minutes=30)
    return alternatives


# ── Doctors ──────────────────────────────────────────────────────────────────

@app.get("/api/doctors")
def list_doctors(specialization: str | None = Query(default=None)):
    if specialization:
        filtered = [
            d for d in DOCTORS
            if d.get("specialization", "").lower() == specialization.lower()
        ]
        return {"doctors": filtered}
    return {"doctors": DOCTORS}


# ── Availability ──────────────────────────────────────────────────────────────

@app.api_route("/api/availability", methods=["GET", "POST"], response_model=schemas.AvailabilityResponse)
async def check_availability(
    request: Request,
    date: str | None = Query(default=None),
    time: str | None = Query(default=None),
    doctor: str | None = Query(default=None),
    specialization: str | None = Query(default=None),
):
    if request.method == "POST":
        try:
            body = await request.json()
            date = body.get("date", date)
            time = body.get("time", time)
            doctor = body.get("doctor", doctor)
            specialization = body.get("specialization", specialization)
        except Exception:
            pass

    if not _parse_date(date):
        today = datetime.now().strftime("%Y-%m-%d")
        current_day = datetime.now().strftime("%A")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format: '{date}'. Expected YYYY-MM-DD. Today is {today} ({current_day})."
        )
    if not _parse_time(time):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid time format: '{time}'. Expected HH:MM in 24-hour format."
        )

    doctors = _matching_doctors(doctor, specialization)
    if not doctors:
        return schemas.AvailabilityResponse(available=False, doctor="", alternatives=[])

    for doc in doctors:
        if _slot_available(doc["name"], date, time):
            return schemas.AvailabilityResponse(
                available=True, doctor=doc["name"], alternatives=[]
            )

    alternatives = _find_alternatives(doctors, date, time)
    return schemas.AvailabilityResponse(available=False, doctor="", alternatives=alternatives)


# ── Booking ───────────────────────────────────────────────────────────────────

@app.api_route("/api/book", methods=["GET", "POST"], response_model=schemas.Appointment)
async def create_booking(
    request: Request,
    patient_name: str | None = Query(default=None),
    phone: str | None = Query(default=None),
    date: str | None = Query(default=None),
    time: str | None = Query(default=None),
    doctor: str | None = Query(default=None),
    specialization: str | None = Query(default=None),
):
    if request.method == "POST":
        try:
            body = await request.json()
            patient_name = body.get("patient_name", patient_name)
            phone = body.get("phone", phone)
            date = body.get("date", date)
            time = body.get("time", time)
            doctor = body.get("doctor", doctor)
            specialization = body.get("specialization", specialization)
        except Exception:
            pass

    if not patient_name or not phone or not date or not time:
        raise HTTPException(
            status_code=422,
            detail="Missing required fields: patient_name, phone, date, time"
        )

    doctors = _matching_doctors(doctor, specialization)
    if not doctors:
        raise HTTPException(status_code=404, detail="No matching doctor found")

    chosen_doctor = None
    for doc in doctors:
        if _slot_available(doc["name"], date, time):
            chosen_doctor = doc
            break

    if not chosen_doctor:
        raise HTTPException(status_code=409, detail="Requested slot is unavailable")

    record = {
        "id": f"apt_{uuid4().hex[:8]}",
        "patient_name": patient_name,
        "phone": phone,
        "doctor": chosen_doctor["name"],
        "date": date,
        "time": time,
        "status": "confirmed",
        "transcript": "",
        "summary": "Booked via voice agent.",
        "manager_flag": False,
    }
    storage.insert_appointment(record)
    return schemas.Appointment(**record)


# ── Appointment lookup ────────────────────────────────────────────────────────

@app.get("/api/appointment", response_model=list[schemas.Appointment])
def get_appointment(
    appointment_id: str | None = Query(default=None),
    phone: str | None = Query(default=None),
    name: str | None = Query(default=None),
):
    appointments = storage.list_appointments(
        appointment_id=appointment_id, phone=phone, patient_name=name
    )
    return [schemas.Appointment(**row) for row in appointments]


# ── Appointment update ────────────────────────────────────────────────────────

@app.api_route(
    "/api/appointment/{appointment_id}",
    methods=["GET", "POST", "PATCH"],
    response_model=schemas.Appointment,
)
async def update_appointment(
    request: Request,
    appointment_id: str,
    date: str | None = Query(default=None),
    time: str | None = Query(default=None),
    doctor: str | None = Query(default=None),
    status: str | None = Query(default=None),
):
    if request.method in ("POST", "PATCH"):
        try:
            body = await request.json()
            date = body.get("date", date)
            time = body.get("time", time)
            doctor = body.get("doctor", doctor)
            status = body.get("status", status)
        except Exception:
            pass

    existing = storage.list_appointments(appointment_id=appointment_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Appointment not found")
    current = existing[0]

    updates = {}
    if date: updates["date"] = date
    if time: updates["time"] = time
    if doctor: updates["doctor"] = doctor
    if status: updates["status"] = status

    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    new_doctor = updates.get("doctor", current["doctor"])
    new_date = updates.get("date", current["date"])
    new_time = updates.get("time", current["time"])

    if (
        new_doctor != current["doctor"]
        or new_date != current["date"]
        or new_time != current["time"]
    ):
        if not _slot_available(new_doctor, new_date, new_time, exclude_id=appointment_id):
            raise HTTPException(status_code=409, detail="Requested slot is unavailable")

    storage.update_appointment(appointment_id, updates)
    updated = storage.list_appointments(appointment_id=appointment_id)[0]
    return schemas.Appointment(**updated)


# ── Appointment deletion ────────────────────────────────────────────────────────

@app.delete("/api/appointment/{appointment_id}")
async def delete_appointment_api(appointment_id: str):
    existing = storage.list_appointments(appointment_id=appointment_id)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Appointment not found")

    storage.delete_appointment(appointment_id)

    return {
        "message": "Appointment deleted successfully",
        "appointment_id": appointment_id
    }
# ── Webhook ───────────────────────────────────────────────────────────────────

@app.post("/webhook/bolna")
async def bolna_webhook(request: Request):
    payload = await request.json()

    extraction = {}
    data = payload.get("data", {})
    if isinstance(data, dict):
        for key in data:
            if isinstance(data[key], dict):
                extraction = data[key]
                break

    phone = extraction.get("phone", "")
    patient_name = extraction.get("patient_name", "")
    transcript = payload.get("call_details", {}).get("transcript", "")
    summary = extraction.get("summary", "")
    manager_flag = extraction.get("manager_flag", False)
    status = extraction.get("status", "")

    existing = []
    if phone:
        existing = storage.list_appointments(phone=phone)
    if not existing and patient_name:
        existing = storage.list_appointments(patient_name=patient_name)

    if not existing:
        return {"status": "no_appointment_found", "phone": phone}

    appointment_id = existing[0]["id"]
    updates = {}
    if transcript:
        updates["transcript"] = transcript
    if summary:
        updates["summary"] = summary
    if manager_flag is not None:
        updates["manager_flag"] = manager_flag
    if status in ("confirmed", "cancelled", "modified", "pending"):
        updates["status"] = status

    if updates:
        storage.update_appointment(appointment_id, updates)

    return {"status": "ok", "appointment_id": appointment_id}


# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(date: str | None = Query(default=None)):
    all_rows = storage.list_appointments()
    rows = [r for r in all_rows if r["date"] == date] if date else all_rows

    status_colors = {
        "confirmed": "#22c55e",
        "cancelled": "#ef4444",
        "modified": "#f59e0b",
        "pending": "#94a3b8",
    }

    table_rows = ""
    for row in rows:
        color = status_colors.get(row["status"], "#94a3b8")
        badge = (
            f'<span style="background:{color};color:#fff;padding:2px 10px;'
            f'border-radius:12px;font-size:12px;">{row["status"]}</span>'
        )
        transcript_cell = (
            f'<details><summary>View</summary>'
            f'<pre style="white-space:pre-wrap;font-size:12px;">{row.get("transcript", "")}</pre>'
            f'</details>'
            if row.get("transcript") else "—"
        )
        flag_cell = (
            '<span style="color:#ef4444;font-weight:bold;">YES</span>'
            if row["manager_flag"] else "No"
        )
        table_rows += (
            "<tr>"
            f"<td>{row['id']}</td>"
            f"<td>{row['patient_name']}</td>"
            f"<td>{row['phone']}</td>"
            f"<td>{row['doctor']}</td>"
            f"<td>{row['date']}</td>"
            f"<td>{row['time']}</td>"
            f"<td>{badge}</td>"
            f"<td>{flag_cell}</td>"
            f"<td>{row.get('summary') or '—'}</td>"
            f"<td>{transcript_cell}</td>"
            "</tr>"
        )

    html = f"""
    <html>
    <head>
      <title>CarePlus Dashboard</title>
      <style>
        body {{ font-family: Arial, Helvetica, sans-serif; padding: 24px; background: #f9fafb; }}
        h1 {{ color: #1e293b; }}
        .filter {{ margin-bottom: 16px; }}
        table {{ border-collapse: collapse; width: 100%; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }}
        th, td {{ border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; vertical-align: top; }}
        th {{ background: #f1f5f9; font-size: 13px; color: #475569; }}
        td {{ font-size: 13px; color: #1e293b; }}
        tr:hover {{ background: #f8fafc; }}
        pre {{ margin: 8px 0 0; background: #f1f5f9; padding: 8px; border-radius: 4px; }}
        details summary {{ cursor: pointer; color: #3b82f6; }}
      </style>
    </head>
    <body>
      <h1>CarePlus Clinic — Appointments</h1>
      <div class="filter">
        <form method="get">
          Filter by date: <input type="date" name="date" value="{date or ''}">
          <button type="submit">Apply</button>
          <a href="/dashboard">Clear</a>
        </form>
      </div>
      <table>
        <thead><tr>
          <th>ID</th><th>Name</th><th>Phone</th><th>Doctor</th>
          <th>Date</th><th>Time</th><th>Status</th><th>Flag</th>
          <th>Summary</th><th>Transcript</th>
        </tr></thead>
        <tbody>{table_rows}</tbody>
      </table>
    </body>
    </html>
    """
    return HTMLResponse(content=html)