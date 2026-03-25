from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
# Import routers safely so failures in optional dependencies don't crash startup
try:
    from .routers.auth import router as auth_router
except Exception as _e:
    auth_router = None
    print(f"[main] warning: failed to import auth router: {_e}")

try:
    from .routers.patients import router as patients_router
except Exception as _e:
    patients_router = None
    print(f"[main] warning: failed to import patients router: {_e}")

try:
    from .routers.records import router as records_router
except Exception as _e:
    records_router = None
    print(f"[main] warning: failed to import records router: {_e}")

app = FastAPI(title="Integrated Patient Record Sharing Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if auth_router is not None:
    app.include_router(auth_router)
else:
    print("[main] auth router not included")

if patients_router is not None:
    app.include_router(patients_router)
else:
    print("[main] patients router not included")

if records_router is not None:
    app.include_router(records_router)
else:
    print("[main] records router not included")


@app.get("/health")
def health():
    return {"status": "ok"}


PROJECT_ROOT = Path(__file__).resolve().parents[2]
CLIENT_DIR = PROJECT_ROOT / "client"

if CLIENT_DIR.exists():
    app.mount("/css", StaticFiles(directory=str(CLIENT_DIR / "css")), name="css")
    app.mount("/js", StaticFiles(directory=str(CLIENT_DIR / "js")), name="js")

    @app.get("/")
    def login_page():
        return FileResponse(str(CLIENT_DIR / "login.html"))

    @app.get("/login.html")
    def login_html():
        return FileResponse(str(CLIENT_DIR / "login.html"))

    @app.get("/dashboard.html")
    def dashboard_html():
        return FileResponse(str(CLIENT_DIR / "dashboard.html"))

    @app.get("/registerPatient.html")
    def register_patient_html():
        return FileResponse(str(CLIENT_DIR / "registerPatient.html"))

    @app.get("/registerUser.html")
    def register_user_html():
        return FileResponse(str(CLIENT_DIR / "registerUser.html"))

    @app.get("/patientHistory.html")
    def patient_history_html():
        return FileResponse(str(CLIENT_DIR / "patientHistory.html"))
