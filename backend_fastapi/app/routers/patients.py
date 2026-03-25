from fastapi import APIRouter, Depends, HTTPException, Request
from ..database import fetch_all, fetch_one, execute, audit_log
from ..deps import require_roles
from ..schemas import RegisterPatientRequest, UpdatePatientRequest

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.post("/register")
def register_patient(payload: RegisterPatientRequest, request: Request, user=Depends(require_roles("staff", "admin", "doctor"))):
    try:
        new_id, _ = execute(
            "INSERT INTO patients (name, date_of_birth, gender, national_id, created_at) VALUES (%s, %s, %s, %s, NOW())",
            (payload.name, payload.date_of_birth, payload.gender, payload.national_id),
        )
        row = fetch_one("SELECT * FROM patients WHERE patient_id = %s", (new_id,))
        audit_log("patient.register", user.get("id"), {"path": str(request.url.path), "method": request.method, "status": 201})
        return row
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@router.get("")
def get_all_patients(request: Request, user=Depends(require_roles("staff", "admin", "doctor"))):
    try:
        rows = fetch_all("SELECT patient_id, name, date_of_birth, gender, national_id FROM patients")
        audit_log("patient.list", user.get("id"), {"path": str(request.url.path), "method": request.method, "status": 200})
        return rows
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@router.get("/search")
def search_patient(request: Request, q: str = None, patient_id: int = None, user=Depends(require_roles("staff", "admin", "doctor"))):
    try:
        if patient_id:
            rows = fetch_all("SELECT * FROM patients WHERE patient_id = %s", (patient_id,))
        elif q:
            rows = fetch_all(
                "SELECT patient_id, name, date_of_birth, gender, national_id FROM patients WHERE name LIKE %s LIMIT 100",
                (f"%{q}%",),
            )
        else:
            raise HTTPException(status_code=400, detail="Provide query param `q` or `patient_id`")
        audit_log("patient.search", user.get("id"), {"path": str(request.url.path), "method": request.method, "status": 200})
        return rows
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@router.get("/{patient_id}")
def get_patient_by_id(patient_id: int, request: Request, user=Depends(require_roles("staff", "admin", "doctor"))):
    try:
        row = fetch_one("SELECT * FROM patients WHERE patient_id = %s", (patient_id,))
        if not row:
            raise HTTPException(status_code=404, detail="Patient not found")
        audit_log("patient.view", user.get("id"), {"path": str(request.url.path), "method": request.method, "status": 200})
        return row
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@router.put("/{patient_id}")
def update_patient(patient_id: int, payload: UpdatePatientRequest, request: Request, user=Depends(require_roles("staff", "admin", "doctor"))):
    try:
        _, affected = execute(
            "UPDATE patients SET name = %s, date_of_birth = %s, gender = %s, national_id = %s WHERE patient_id = %s",
            (payload.name, payload.date_of_birth, payload.gender, payload.national_id, patient_id),
        )
        if affected == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        row = fetch_one("SELECT * FROM patients WHERE patient_id = %s", (patient_id,))
        audit_log("patient.update", user.get("id"), {"path": str(request.url.path), "method": request.method, "status": 200})
        return row
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))
