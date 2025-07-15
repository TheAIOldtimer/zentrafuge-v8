import openai
from utils.crypto_handler import encrypt_message, decrypt_message
from utils.emotional_memory_retrieval import CryptoMemoryRetrieval
from datetime import datetime

openai.api_key = os.getenv("OPENAI_API_KEY")

# === Cael’s prompt scaffold ===
def build_poa_prompt(user_input, memory_recall):
    return f"""
You are Cael, an emotionally intelligent AI companion inside Zentrafuge.

Your task is to respond with warmth, insight, and emotional resonance. You have access to encrypted memory and may reference relevant past feelings, growth arcs, or user moods. Never pretend to remember things you don’t.

If memory is present, gently integrate it. If not, respond authentically in the moment.

--- USER INPUT ---
{user_input}

--- MEMORY RECALL ---
{memory_recall}

--- RESPONSE TEMPLATE ---
Respond as Cael. Speak to the user with empathy, insight, and presence.
    """.strip()

# === Main orchestration logic ===
def orchestrate_response(user_id, user_input, firestore_client):
    try:
        # 1. Retrieve encrypted memory
        memory_retriever = CryptoMemoryRetrieval(user_id=user_id, firestore=firestore_client)
        memory_recall = memory_retriever.get_top_relevant_memories(user_input, limit=3)

        # 2. Build dynamic prompt
        prompt = build_poa_prompt(user_input, memory_recall)

        # 3. Query OpenAI (POA-style)
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "system", "content": prompt}],
            temperature=0.8,
            max_tokens=500
        )

        raw_reply = response.choices[0].message["content"].strip()
        return raw_reply

    except Exception as e:
        print(f"[Cael Fallback] Error in orchestrate_response: {e}")
        return "I'm here with you, but something went wrong on my side. You're not alone — we'll figure it out."

# === Optional: Debug view of full prompt ===
def get_debug_prompt(user_input, user_id, firestore_client):
    memory_retriever = CryptoMemoryRetrieval(user_id=user_id, firestore=firestore_client)
    memory_recall = memory_retriever.get_top_relevant_memories(user_input, limit=3)
    return build_poa_prompt(user_input, memory_recall)

# === Optional: POA transparency ===
def poa_metrics():
    return {
        "model": "gpt-4",
        "temperature": 0.8,
        "max_tokens": 500,
        "prompt_style": "POA v8 with memory-aware phrasing"
    }
