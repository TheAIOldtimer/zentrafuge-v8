# backend/scripts/setup_learning_loops.py - Integration Script
"""
Setup script to integrate meta-learning into existing Zentrafuge infrastructure
Run this to activate the learning loop system
"""

import sys
import os
import logging
from datetime import datetime

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.meta_feedback_loop import MetaFeedbackLoop, run_learning_cycle
from utils.orchestrator import initialize_meta_learning, run_weekly_learning_cycle

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_firestore_collections():
    """
    Setup required Firestore collections for meta-learning
    """
    try:
        import firebase_admin
        from firebase_admin import firestore
        
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        # Create collections with initial documents
        collections_to_create = [
            'conversation_outcomes',
            'learning_insights', 
            'orchestrator_config'
        ]
        
        for collection_name in collections_to_create:
            # Create collection with a setup document
            setup_doc = {
                'setup': True,
                'created_at': datetime.now(),
                'purpose': f'Meta-learning collection for {collection_name}',
                'version': '8.0.0'
            }
            
            db.collection(collection_name).document('_setup').set(setup_doc)
            logger.info(f"✅ Created collection: {collection_name}")
        
        # Create initial orchestrator config
        initial_config = {
            'emotional_response_rules': {},
            'memory_timing_rules': {},
            'support_style_mappings': {},
            'safety_triggers': {},
            'growth_facilitation_rules': {},
            'version': 'meta_learning_v1',
            'last_updated': datetime.now(),
            'status': 'initialized'
        }
        
        db.collection('orchestrator_config').document('learned_patterns').set(initial_config)
        logger.info("✅ Created initial orchestrator config")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to setup Firestore collections: {e}")
        return False

def test_meta_learning_system():
    """
    Test the meta-learning system with sample data
    """
    try:
        logger.info("🧪 Testing meta-learning system...")
        
        # Initialize meta-learning
        meta_loop = MetaFeedbackLoop()
        
        # Test conversation analysis
        sample_conversation = {
            'user_message': 'I feel really anxious about work today',
            'cael_response': 'I hear that anxiety in your words. Work stress can feel overwhelming. What\'s weighing on you most right now?',
            'memory_used': False,
            'emotional_context': 'anxious',
            'response_time': 2.3
        }
        
        outcome = meta_loop.analyze_conversation_outcome('test_user_123', sample_conversation)
        
        if outcome:
            logger.info("✅ Conversation analysis working")
        else:
            logger.warning("⚠️  Conversation analysis returned None")
        
        # Test recommendations
        user_context = {
            'current_message': 'I feel scared and alone',
            'user_id': 'test_user_123',
            'timestamp': datetime.now()
        }
        
        recommendations = meta_loop.get_response_recommendations(user_context)
        logger.info(f"✅ Generated recommendations: {list(recommendations.keys())}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Meta-learning test failed: {e}")
        return False

def setup_learning_schedule():
    """
    Setup information for scheduling learning cycles
    """
    logger.info("📅 Learning Schedule Setup Instructions:")
    logger.info("=" * 50)
    logger.info("Add these to your crontab or task scheduler:")
    logger.info("")
    logger.info("# Weekly learning cycle (Sundays at 2 AM)")
    logger.info("0 2 * * 0 cd /path/to/zentrafuge/backend && python -c \"from utils.orchestrator import run_weekly_learning_cycle; run_weekly_learning_cycle()\"")
    logger.info("")
    logger.info("# Daily mini-cycle (Every day at 3 AM)")
    logger.info("0 3 * * * cd /path/to/zentrafuge/backend && python -c \"from utils.meta_feedback_loop import run_learning_cycle; run_learning_cycle()\"")
    logger.info("")
    logger.info("Or for Render/Heroku, add these as scheduled tasks in your dashboard")

def update_chat_routes():
    """
    Generate updated chat routes to use enhanced orchestrator
    """
    logger.info("🔄 Chat Routes Integration:")
    logger.info("=" * 30)
    logger.info("Update your chat_routes.py to use the enhanced orchestrator:")
    logger.info("")
    
    integration_code = '''
# In your chat_routes.py, update the chat endpoint:

@chat_bp.route('/index', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        user_id = data.get('user_id')
        
        if not user_message or not user_id:
            return jsonify({'error': 'Missing message or user_id'}), 400
        
        # Use ENHANCED orchestrator with meta-learning
        from utils.orchestrator import orchestrate_response
        
        response = orchestrate_response(
            user_id=user_id,
            user_input=user_message,
            firestore_client=db,  # Pass your Firestore client
            ai_name="Cael"
        )
        
        return jsonify({
            'method': 'enhanced_ai',
            'response': response,
            'timestamp': datetime.now().isoformat(),
            'meta_learning': 'active'  # Indicate meta-learning is working
        })
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({'error': 'Internal server error'}), 500
'''
    
    print(integration_code)

def main():
    """
    Main setup function
    """
    logger.info("🚀 ZENTRAFUGE META-LEARNING SETUP")
    logger.info("=" * 40)
    
    success_count = 0
    total_steps = 4
    
    # Step 1: Setup Firestore collections
    logger.info("\n1️⃣  Setting up Firestore collections...")
    if setup_firestore_collections():
        success_count += 1
    
    # Step 2: Test meta-learning system
    logger.info("\n2️⃣  Testing meta-learning system...")
    if test_meta_learning_system():
        success_count += 1
    
    # Step 3: Initialize meta-learning in orchestrator
    logger.info("\n3️⃣  Initializing orchestrator meta-learning...")
    if initialize_meta_learning():
        success_count += 1
    
    # Step 4: Show integration instructions
    logger.info("\n4️⃣  Providing integration instructions...")
    setup_learning_schedule()
    update_chat_routes()
    success_count += 1
    
    # Final status
    logger.info(f"\n🎯 SETUP COMPLETE: {success_count}/{total_steps} steps successful")
    
    if success_count == total_steps:
        logger.info("✅ Meta-learning system is ready!")
        logger.info("🧠 Zentrafuge will now get smarter with every conversation")
        logger.info("\nNext steps:")
        logger.info("1. Update your chat_routes.py with the provided code")
        logger.info("2. Deploy your changes")
        logger.info("3. Setup the learning schedule")
        logger.info("4. Watch Cael become exponentially smarter! 🚀")
    else:
        logger.warning("⚠️  Some setup steps failed - check logs above")
    
    return success_count == total_steps

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
