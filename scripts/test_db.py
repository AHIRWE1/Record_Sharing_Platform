"""Quick DB connectivity tester for this project.

Usage:
  python scripts/test_db.py

It uses the project's `backend_fastapi.app.database` helpers so it reflects
the same connection behavior used by the app.
"""
import sys

from backend_fastapi.app.database import fetch_one


def main():
    try:
        row = fetch_one("SELECT 1 AS ok")
        if row and row.get("ok") == 1:
            print("✅ Connected to MySQL (XAMPP) successfully!")
            return 0
        print("❌ Query did not return expected result:", row)
        return 2
    except Exception as e:
        print("❌ Database test failed:", str(e))
        return 1


if __name__ == "__main__":
    sys.exit(main())
