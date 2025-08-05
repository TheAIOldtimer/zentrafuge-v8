# utils/move_logger.py

from datetime import datetime
from firebase_admin import firestore
import logging

logger = logging.getLogger(__name__)

def log_move(user_id, move_name, context=None, trust_effect=0, clarity_effect=0, resonance_effect=0, uncertainty_change=0):
    move_log = {
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat(),
        "move": move_name,
        "context": context or {},
        "effects": {
            "trust": trust_effect,
            "clarity": clarity_effect,
            "resonance": resonance_effect,
            "uncertainty": uncertainty_change,
        }
    }
    logger.info(f"🟩 ZP Move: {move_log['move']} — Effects: {move_log['effects']}")
    return move_log

def save_move_to_firestore(move_log):
    try:
        db = firestore.client()
        db.collection("zp_move_logs").add(move_log)
        logger.info("✅ Move saved to Firestore")
    except Exception as e:
        logger.warning(f"⚠️ Failed to save move log: {e}")
