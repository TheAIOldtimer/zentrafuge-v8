# backend/firebase.py
import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

# Load credentials from environment variable
firebase_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")

if not firebase_json:
    raise ValueError("Missing FIREBASE_CREDENTIALS_JSON environment variable")

cred_dict = json.loads(firebase_json)
cred = credentials.Certificate(cred_dict)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
