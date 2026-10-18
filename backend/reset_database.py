"""Explicit local database reset. Credentials come only from the environment."""
import argparse
import os


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reset", action="store_true", help="Drop and recreate the configured database")
    args = parser.parse_args()
    if not args.reset:
        parser.error("Database reset requires the explicit --reset option")

    from dotenv import load_dotenv
    from pathlib import Path
    load_dotenv(Path(__file__).with_name(".env"), override=False)
    import psycopg2
    from psycopg2 import sql

    admin_url = os.environ["ADMIN_DATABASE_URL"]
    database = os.environ["POSTGRES_DB"]
    user = os.environ["POSTGRES_USER"]
    password = os.environ["POSTGRES_PASSWORD"]
    if not all((admin_url, database, user, password)):
        raise ValueError("Administrative URL and target database credentials must be nonempty")
    conn = psycopg2.connect(admin_url)
    try:
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = %s AND pid <> pg_backend_pid()", (database,))
            cur.execute(sql.SQL("DROP DATABASE IF EXISTS {}").format(sql.Identifier(database)))
            cur.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (user,))
            operation = "ALTER" if cur.fetchone() else "CREATE"
            cur.execute(sql.SQL(operation + " ROLE {} WITH LOGIN PASSWORD {}").format(sql.Identifier(user), sql.Literal(password)))
            cur.execute(sql.SQL("CREATE DATABASE {} OWNER {}").format(sql.Identifier(database), sql.Identifier(user)))
    finally:
        conn.close()
    print("Database reset completed. Run Alembic migrations separately.")


if __name__ == "__main__":
    main()
