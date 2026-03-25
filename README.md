# Record_Sharing_Platform

This repository contains the Python FastAPI backend and the frontend static files:
- Python FastAPI backend: [backend_fastapi/app/main.py](backend_fastapi/app/main.py#L1)
- Frontend static files: `client/`

**This project uses raw SQL with `mysql.connector` (no ORM / no SQLAlchemy).** See [backend_fastapi/app/database.py](backend_fastapi/app/database.py#L1) for the helper functions: `get_conn()`, `fetch_all()`, `fetch_one()`, `execute()`, and `audit_log()`.

**Database used in this setup:** MySQL (XAMPP on Windows)
- Host: `127.0.0.1`
- Port: `3306`
- User: `root`
- Password: (empty by default in XAMPP)
- Database name: `healthcare_db`

**Quick overview:**
- The FastAPI app serves the same API paths the client expects (`/api/auth/*`, `/api/patients/*`, `/api/records/*`) and also serves frontend files from `client/`.
- The code uses raw SQL via `mysql-connector-python` (installed from `backend_fastapi/requirements.txt`).

**Recommended local setup (Windows + XAMPP)**

- **1) Start XAMPP MySQL**: Open XAMPP Control Panel and start MySQL (and Apache if you plan to use phpMyAdmin). phpMyAdmin is available at `http://localhost/phpmyadmin`.

- **2) Create the database and import schema**
  - Using phpMyAdmin: create a new database named `healthcare_db` and import `database.sql` (root import in the repo root).
  - Or using MySQL CLI (from a terminal where `mysql` is available):
    ```powershell
    mysql -u root healthcare_db < database.sql
    ```

- **3) Create a `.env` file in the project root** (the FastAPI `config.py` uses `load_dotenv()` at import). Example `.env`:
  ```env
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=
  DB_NAME=healthcare_db
  JWT_SECRET=change_this_secret
  PORT=5000
  ```

- **4) Create and activate a Python virtual environment, install requirements**
  ```powershell
  python -m venv backend_fastapi/.venv
  backend_fastapi/.venv\Scripts\Activate.ps1
  pip install -r backend_fastapi/requirements.txt
  ```

- **5) Install the DB driver if needed**
  - `mysql-connector-python` is the expected driver. If `pip install -r backend_fastapi/requirements.txt` didn't provide it, run:
  ```powershell
  pip install mysql-connector-python
  ```

- **6) Start the FastAPI server**
  ```powershell
  uvicorn backend_fastapi.app.main:app --reload --port 5000
  ```

- **7) Verify the app and DB**
  - Health check: `http://127.0.0.1:5000/health` (should return `{ "status": "ok" }`).
  - Quick DB test (runs a raw SQL via the project's helper functions):
  ```powershell
  python -c "from backend_fastapi.app.database import fetch_one; print(fetch_one('SELECT 1 AS ok'))"
  ```
  - If the DB is not available, the helper functions raise a `RuntimeError` and `audit_log()` will print a warning instead of raising during logging.

**Notes about the codebase**
- `backend_fastapi/app/database.py` contains raw SQL helpers and is import-safe: if the MySQL driver is missing or the DB is unreachable, the module will not crash application startup — DB calls will raise runtime errors at call-time instead.
- Router imports are guarded in `backend_fastapi/app/main.py` so the app can start even if a router import fails due to missing optional dependencies.
- Authentication and audit logging use raw SQL and helper functions; no SQLAlchemy or ORM is used.

**Troubleshooting**
- "Can't connect to MySQL" / connection refused: confirm XAMPP MySQL is running and `.env` contains the correct host/port. Check that `127.0.0.1:3306` is listening.
- Missing driver errors: `pip install mysql-connector-python`.
- Permission / password issues: XAMPP's root user often has an empty password — ensure `DB_PASSWORD=` in `.env`.

**Useful file references**
- Database helpers: [backend_fastapi/app/database.py](backend_fastapi/app/database.py#L1)
- App entry / static serving / health endpoint: [backend_fastapi/app/main.py](backend_fastapi/app/main.py#L1)
- API routers: [backend_fastapi/app/routers](backend_fastapi/app/routers)
- Schema / pydantic models: [backend_fastapi/app/schemas.py](backend_fastapi/app/schemas.py#L1)

If you want, I can add a small `scripts/test_db.py` helper to run a connection check via the project's helpers.

---
Last updated: updated to document raw-SQL `mysql.connector` usage and XAMPP instructions.
