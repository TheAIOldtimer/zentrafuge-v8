# backend/utils/move_logger.py

import os, time, logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

try:
    import firebase_admin
    from firebase_admin import firestore
except Exception:
    firebase_admin = None
    firestore = None

ZP_LOGGING_ENABLED = os.getenv("ZP_LOGGING_ENABLED", "true").lower() == "true"

def _get_fs():
    if not firebase_admin or not firestore:
        return None
    try:
        return firestore.client()
    except Exception:
        return None

def log_move(
    user_id: str,
    move_name: str,
    context: Optional[Dict[str, Any]] = None,
    trust_effect: int = 0,
    clarity_effect: int = 0,
    resonance_effect: int = 0,
    uncertainty_change: int = 0,
) -> Dict[str, Any]:
    move_log = {
        "user_id": user_id,
        "timestamp_ms": int(time.time() * 1000),
        "move": move_name,
        "effects": {
            "trust_effect": trust_effect,
            "clarity_effect": clarity_effect,
            "resonance_effect": resonance_effect,
            "uncertainty_change": uncertainty_change,
        },
        "context": context or {},
    }
    print(f"🟩 ZP Move: {move_name} | user={user_id} | effects={move_log['effects']}")
    return move_log

def save_move_to_firestore(move_log: Dict[str, Any]) -> None:
    if not ZP_LOGGING_ENABLED:
        return
    fs = _get_fs()
    if not fs:
        return
    try:
        fs.collection("zp_move_logs").add(move_log)
    except Exception as e:
        logger.warning(f"ZP Move Firestore save failed: {e}")
