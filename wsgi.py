"""WSGI entrypoint for the Tinshed Players Crew Roster.

Use this module with a production WSGI server such as Waitress:

    waitress-serve --host 0.0.0.0 --port 5000 wsgi:app

The application factory (app/app.py) reads its configuration from
config/app.json and from environment variables, so no code changes are needed
between environments.
"""

from app import app

if __name__ == "__main__":
    app.run()
