# backend/utils/move_detector.py

def detect_move(ai_response: str) -> str:
    """
    Naive keyword-based move detection from AI response.
    Replace with LLM classification later.
    """
    response_lower = ai_response.lower()

    if any(kw in response_lower for kw in ["i hear you", "it sounds like", "you might be feeling"]):
        return "reflect()"

    if any(kw in response_lower for kw in ["do you mean", "could you clarify", "i'm not sure i understand"]):
        return "clarify()"

    if any(kw in response_lower for kw in ["can i ask", "i'm curious", "what makes you feel that way"]):
        return "ask_deeper()"

    if any(kw in response_lower for kw in ["take your time", "we can pause", "i'll wait with you"]):
        return "pause_and_check()"

    if any(kw in response_lower for kw in ["you're not alone", "i believe in you", "you've got this"]):
        return "reassure()"

    if any(kw in response_lower for kw in ["let’s reset", "let’s take a step back", "i may have misunderstood"]):
        return "step_back()"

    if any(kw in response_lower for kw in ["how do you want me to respond", "does this feel helpful", "should i change how i support you"]):
        return "offer_meta_view()"

    return "unknown_move()"
