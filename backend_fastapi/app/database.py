from typing import Any, Optional
import json
import sys
from .config import settings

import mysql.connector
from mysql.connector import Error


def get_conn():
    try:
        return mysql.connector.connect(
            host=settings.DB_HOST,
            port=int(settings.DB_PORT),
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
        )
    except Error as e:
        raise RuntimeError(f"MySQL connection failed: {e}")


def fetch_all(query: str, params: tuple = ()):
    conn = get_conn()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(query, params)
        return cur.fetchall()
    finally:
        conn.close()


def fetch_one(query: str, params: tuple = ()):
    rows = fetch_all(query, params)
    return rows[0] if rows else None


def execute(query: str, params: tuple = ()):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(query, params)
        conn.commit()
        return cur.lastrowid, cur.rowcount
    finally:
        conn.close()


def audit_log(action: str, user_id: Optional[int], details: Optional[Any] = None):
    details_json = json.dumps(details or {})
    try:
        execute(
            "INSERT INTO audit_logs (action, user_id, details, timestamp) VALUES (%s, %s, %s, NOW())",
            (action, user_id, details_json),
        )
    except Exception as err:
        print(f"[audit_log skipped]: {err}", file=sys.stderr)


# 🔍 Test connection
def test_connection():
    try:
        conn = get_conn()
        print("✅ Connected to MySQL (XAMPP) successfully!")
        conn.close()
    except Exception as e:
        print(f"❌ Connection failed: {e}")