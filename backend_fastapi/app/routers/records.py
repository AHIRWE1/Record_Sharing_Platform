from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import fetch_all, fetch_one, execute, audit_log
from ..deps import require_roles
from ..schemas import CreateRecordRequest, UpdateRecordRequest

router = APIRouter(prefix="/api/records", tags=["records"])


@router.post("")
def create_record(payload: CreateRecordRequest, request: Request, user=Depends(require_roles("doctor", "staff", "admin"))):
    try:
        new_id, _ = execute(
            "INSERT INTO medical_records (patient_id, diagnosis, treatment_plan, clinical_notes) VALUES (%s, %s, %s, %s)",
            (payload.patient_id, payload.diagnosis, payload.treatment_plan, payload.clinical_notes),
        )
        row = fetch_one("SELECT * FROM medical_records WHERE record_id = %s", (new_id,))
        audit_log("record.create", user.get("id"), {"path": str(request.url.path), "method": request.method, "status": 201})
        return row
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@router.put("/{record_id}")
def update_record(record_id: int, payload: UpdateRecordRequest, request: Request, user=Depends(require_roles("doctor", "staff", "admin"))):
    try:
        existing = fetch_one("SELECT * FROM medical_records WHERE record_id = %s", (record_id,))
        if not existing:
            raise HTTPException(status_code=404, detail="Record not found")

        diagnosis = payload.diagnosis if payload.diagnosis is not None else existing["diagnosis"]
        treatment_plan = payload.treatment_plan if payload.treatment_plan is not None else existing["treatment_plan"]
        clinical_notes = payload.clinical_notes if payload.clinical_notes is not None else existing["clinical_notes"]

        execute(
            "UPDATE medical_records SET diagnosis = %s, treatment_plan = %s, clinical_notes = %s WHERE record_id = %s",
            (diagnosis, treatment_plan, clinical_notes, record_id),
        )
        row = fetch_one("SELECT * FROM medical_records WHERE record_id = %s", (record_id,))
        audit_log("record.update", user.get("id"), {"path": str(request.url.path), "method": request.method, "status": 200})
        return row
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@router.get("/patient/{patient_id}")
def patient_records(patient_id: int, request: Request, user=Depends(require_roles("doctor", "staff", "admin"))):
    try:
        rows = fetch_all(
            "SELECT * FROM medical_records WHERE patient_id = %s ORDER BY created_at DESC",
            (patient_id,),
        )
        audit_log("record.list", user.get("id"), {"path": str(request.url.path), "method": request.method, "status": 200})
        return rows
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))
