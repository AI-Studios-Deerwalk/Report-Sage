#!/usr/bin/env python3
"""
Database migration management script
"""

import sys
import subprocess
from pathlib import Path


def run_command(command):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        return False


def upgrade_database():
    """Apply all pending migrations"""
    print("🔄 Applying database migrations...")
    return run_command("alembic upgrade head")


def create_migration(message):
    """Create a new migration"""
    if not message:
        message = input("Enter migration message: ")
    
    print(f"📝 Creating new migration: {message}")
    return run_command(f'alembic revision --autogenerate -m "{message}"')


def show_current_revision():
    """Show current database revision"""
    print("📋 Current database revision:")
    return run_command("alembic current")


def show_migration_history():
    """Show migration history"""
    print("📚 Migration history:")
    return run_command("alembic history")


def downgrade_database(revision="base"):
    """Downgrade database to a specific revision"""
    print(f"⬇️  Downgrading database to: {revision}")
    return run_command(f"alembic downgrade {revision}")


def show_help():
    """Show help information"""
    help_text = """
Database Migration Management

Usage: python migrate.py <command> [args]

Commands:
  upgrade                 Apply all pending migrations to database
  create <message>        Create a new migration with given message
  current                 Show current database revision
  history                 Show migration history
  downgrade [revision]    Downgrade to revision (default: base)
  help                    Show this help message

Examples:
  python migrate.py upgrade
  python migrate.py create "Add user avatar field"
  python migrate.py current
  python migrate.py downgrade -1
  python migrate.py downgrade base
"""
    print(help_text)


def main():
    if len(sys.argv) < 2:
        show_help()
        return

    command = sys.argv[1].lower()

    if command == "upgrade":
        upgrade_database()
    elif command == "create":
        message = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else None
        create_migration(message)
    elif command == "current":
        show_current_revision()
    elif command == "history":
        show_migration_history()
    elif command == "downgrade":
        revision = sys.argv[2] if len(sys.argv) > 2 else "base"
        downgrade_database(revision)
    elif command in ["help", "-h", "--help"]:
        show_help()
    else:
        print(f"Unknown command: {command}")
        show_help()


if __name__ == "__main__":
    main()
