import os
import json
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

class SecretsManager:
    def __init__(self, secrets_file='secrets.json', password=None):
        self.secrets_file = secrets_file
        self.password = password or os.environ.get('SECRETS_PASSWORD')
        if not self.password:
            raise ValueError("Password must be provided or set as SECRETS_PASSWORD environment variable")
        self.key = self._generate_key(self.password)
        self.fernet = Fernet(self.key)
        self.secrets = self._load_secrets()
    
    def _generate_key(self, password):
        """Generate a key from password"""
        password = password.encode()
        salt = b'static_salt_for_key_derivation'  # In production, use a secure random salt
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        return key
    
    def _load_secrets(self):
        """Load secrets from file or create new if not exists"""
        if os.path.exists(self.secrets_file):
            with open(self.secrets_file, 'rb') as f:
                encrypted_data = f.read()
                if encrypted_data:
                    decrypted_data = self.fernet.decrypt(encrypted_data)
                    return json.loads(decrypted_data)
        return {}
    
    def _save_secrets(self):
        """Save secrets to file"""
        encrypted_data = self.fernet.encrypt(json.dumps(self.secrets).encode())
        with open(self.secrets_file, 'wb') as f:
            f.write(encrypted_data)
    
    def set_secret(self, key, value):
        """Set a secret value"""
        self.secrets[key] = value
        self._save_secrets()
    
    def get_secret(self, key):
        """Get a secret value"""
        return self.secrets.get(key)
    
    def delete_secret(self, key):
        """Delete a secret"""
        if key in self.secrets:
            del self.secrets[key]
            self._save_secrets()
            return True
        return False