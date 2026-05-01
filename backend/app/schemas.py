from pydantic import BaseModel, Field


class AvailabilityRequest(BaseModel):
    doctor: str | None = None
    specialization: str | None = None
    date: str
    time: str


class AlternativeSlot(BaseModel):
    doctor: str
    date: str
    time: str


class AvailabilityResponse(BaseModel):
    available: bool
    doctor: str = ""
    alternatives: list[AlternativeSlot] = Field(default_factory=list)


class BookRequest(BaseModel):
    patient_name: str
    phone: str
    doctor: str | None = None
    specialization: str | None = None
    date: str
    time: str


class Appointment(BaseModel):
    id: str
    patient_name: str
    phone: str
    doctor: str
    date: str
    time: str
    status: str
    transcript: str = ""
    summary: str = ""
    manager_flag: bool = False


class UpdateAppointmentRequest(BaseModel):
    doctor: str | None = None
    date: str | None = None
    time: str | None = None
    status: str | None = None


class BolnaExtractionData(BaseModel):
    patient_name: str | None = None
    phone: str | None = None
    intent: str | None = None
    appointment_id: str | None = None
    doctor: str | None = None
    date: str | None = None
    time: str | None = None
    status: str | None = None
    summary: str | None = None
    manager_flag: bool | None = None


class WebhookPayload(BaseModel):
    model_config = {"extra": "allow"}

    call_details: dict | None = None
    data: dict | None = None