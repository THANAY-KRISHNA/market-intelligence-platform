import unittest
import sys
import os
from datetime import timedelta

# Add parent path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.auth import (
    get_password_hash, verify_password, create_access_token,
    SECRET_KEY, ALGORITHM
)
from jose import jwt

class TestAuthenticationLayer(unittest.TestCase):
    def test_password_hashing(self):
        password = "trading_secret_123"
        hashed = get_password_hash(password)
        self.assertNotEqual(password, hashed)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("wrong_password", hashed))

    def test_jwt_generation(self):
        data = {"sub": "trader_joe"}
        token = create_access_token(data=data, expires_delta=timedelta(minutes=15))
        self.assertTrue(isinstance(token, str))
        
        # Verify decoding token
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        self.assertEqual(decoded["sub"], "trader_joe")
        self.assertTrue("exp" in decoded)

if __name__ == '__main__':
    unittest.main()
