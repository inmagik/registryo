from django.conf import settings
from cryptography.x509 import load_pem_x509_certificate
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from cryptography.hazmat.primitives.hashes import Hash, SHA256
from base64 import b32encode

__private_key = None
__public_key = None
__public_kid = None

def get_private_key():
    global __private_key
    if __private_key:
        return __private_key
    __private_key = None
    with open(settings.JWT_KEY_FILE, "rb") as f:
        __private_key = f.read()
    if __private_key is None:
        raise Exception("NO PRIVATE KEY CONFIGURED!!")
    return __private_key

def get_public_key():
    global __public_key
    if __public_key:
        return __public_key
    cert_bytes = None
    with open(settings.JWT_CERT_FILE, "rb") as f:
        cert_bytes = f.read()
    if cert_bytes:
        __public_key = load_pem_x509_certificate(cert_bytes).public_key()
        return __public_key
    else:
        raise Exception("NO x509 CERT CONFIGURED")

def get_kid():
    sha256 = Hash(SHA256())
    sha256.update(
        get_public_key().public_bytes(
            encoding=Encoding.DER, 
            format=PublicFormat.SubjectPublicKeyInfo
        )
    )
    sha256 = sha256.finalize()[:30]
    encoded = b32encode(sha256).decode("ascii")
    chunks = [encoded[i : i + 4] for i in range(0, len(encoded), 4)]
    return ":".join(chunks)

