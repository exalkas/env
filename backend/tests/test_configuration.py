"""Configuration checks without database or provider access."""
from pathlib import Path
import os
import runpy
import secrets
import unittest
from unittest.mock import patch
from pydantic import ValidationError


CONFIG = Path(__file__).resolve().parents[1] / "app/core/config.py"


class ConfigurationTests(unittest.TestCase):
    def settings(self):
        # Execute only the settings module, never app startup or DB sessions.
        return runpy.run_path(str(CONFIG))["Settings"]

    def test_required_credentials_and_stable_signing_key(self):
        signing_key = secrets.token_urlsafe(48)
        with patch.dict(os.environ, {"SECRET_KEY": signing_key, "POSTGRES_PASSWORD": secrets.token_urlsafe(24)}, clear=True):
            model = self.settings()
            self.assertEqual(model(_env_file=None).SECRET_KEY, signing_key)
            self.assertEqual(model(_env_file=None).SECRET_KEY, signing_key)
            for key in ["SECRET_KEY", "POSTGRES_PASSWORD"]:
                with patch.dict(os.environ, {key: ""}):
                    with self.assertRaises(ValidationError):
                        model(_env_file=None)
                original = os.environ.pop(key)
                try:
                    with self.assertRaises(ValidationError):
                        model(_env_file=None)
                finally:
                    os.environ[key] = original

    def test_connection_credentials_are_url_encoded(self):
        from urllib.parse import urlsplit, unquote
        password = secrets.token_urlsafe(16) + "@:/#%"
        with patch.dict(os.environ, {"SECRET_KEY": secrets.token_urlsafe(48), "POSTGRES_PASSWORD": password}, clear=True):
            settings = self.settings()(_env_file=None)
            self.assertEqual(unquote(urlsplit(settings.SQLALCHEMY_DATABASE_URI).password), password)
            self.assertFalse(settings.EMAIL_ENABLED)

    def test_explicit_database_url_without_component_password(self):
        url = "sqlite:///:memory:"
        with patch.dict(os.environ, {"SECRET_KEY": secrets.token_urlsafe(48), "SQLALCHEMY_DATABASE_URI": url}, clear=True):
            self.assertEqual(self.settings()(_env_file=None).SQLALCHEMY_DATABASE_URI, url)


if __name__ == "__main__":
    unittest.main()
