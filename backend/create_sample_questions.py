#!/usr/bin/env python3
"""
Sample Questions Creator for Carbon Trading Education
Creates sample questions for the structured assessment system
"""

import asyncio
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.education import Question, QuestionOption
from app.models.user import User

def create_sample_questions():
    """Create sample questions for carbon trading education"""
    db = SessionLocal()
    
    try:
        # Get an admin user to assign as creator
        admin_user = db.query(User).filter(User.is_admin == True).first()
        if not admin_user:
            print("No admin user found. Creating questions without creator.")
            creator_id = None
        else:
            creator_id = admin_user.id
        
        # Sample questions data
        questions_data = [
            {
                "title": "EUA Trading Basics",
                "question_text": "What does EUA stand for in the context of carbon trading?",
                "question_type": "multiple_choice",
                "explanation": "European Union Allowances are the tradeable permits in the EU ETS.",
                "points": 1,
                "difficulty_level": "EASY",
                "category": "EUA",
                "tags": ["basics", "terminology", "eu-ets"],
                "options": [
                    {"option_text": "European Union Allowances", "is_correct": True, "sort_order": 1},
                    {"option_text": "European Union Assets", "is_correct": False, "sort_order": 2},
                    {"option_text": "European United Agreements", "is_correct": False, "sort_order": 3},
                    {"option_text": "European Universal Allocations", "is_correct": False, "sort_order": 4}
                ]
            },
            {
                "title": "Carbon Market Phases",
                "question_text": "Which sectors are covered by CBAM (Carbon Border Adjustment Mechanism)? Select all that apply.",
                "question_type": "multiple_select",
                "explanation": "CBAM initially covers cement, iron and steel, aluminum, fertilizers, electricity, and hydrogen.",
                "points": 3,
                "difficulty_level": "MEDIUM",
                "category": "CBAM",
                "tags": ["cbam", "sectors", "policy"],
                "options": [
                    {"option_text": "Cement", "is_correct": True, "sort_order": 1},
                    {"option_text": "Iron and Steel", "is_correct": True, "sort_order": 2},
                    {"option_text": "Agriculture", "is_correct": False, "sort_order": 3},
                    {"option_text": "Aluminum", "is_correct": True, "sort_order": 4},
                    {"option_text": "Textiles", "is_correct": False, "sort_order": 5},
                    {"option_text": "Fertilizers", "is_correct": True, "sort_order": 6}
                ]
            },
            {
                "title": "EU ETS Phases",
                "question_text": "The EU ETS is currently in Phase 4, which runs from 2021 to 2030.",
                "question_type": "true_false",
                "explanation": "Phase 4 of the EU ETS indeed runs from 2021 to 2030, introducing several reforms including the Market Stability Reserve.",
                "points": 1,
                "difficulty_level": "EASY",
                "category": "EUA",
                "tags": ["phases", "timeline", "eu-ets"],
                "options": []
            },
            {
                "title": "GOO Definition",
                "question_text": "What is the primary purpose of Guarantees of Origin (GOOs)?",
                "question_type": "multiple_choice",
                "explanation": "GOOs certify that electricity was produced from renewable sources and can be traded separately from the physical electricity.",
                "points": 2,
                "difficulty_level": "MEDIUM",
                "category": "GOO",
                "tags": ["goo", "renewable", "certificates"],
                "options": [
                    {"option_text": "To certify renewable electricity production", "is_correct": True, "sort_order": 1},
                    {"option_text": "To track carbon emissions", "is_correct": False, "sort_order": 2},
                    {"option_text": "To regulate electricity prices", "is_correct": False, "sort_order": 3},
                    {"option_text": "To allocate transmission capacity", "is_correct": False, "sort_order": 4}
                ]
            },
            {
                "title": "VCM vs Compliance Markets",
                "question_text": "Explain the key differences between voluntary carbon markets (VCM) and compliance carbon markets. Discuss at least three major distinctions including regulatory framework, price mechanisms, and quality standards.",
                "question_type": "essay",
                "explanation": "This question assesses understanding of the fundamental differences between voluntary and compliance carbon markets.",
                "points": 10,
                "difficulty_level": "HARD",
                "category": "VCM",
                "tags": ["vcm", "compliance", "comparison", "analysis"],
                "options": []
            },
            {
                "title": "Carbon Price Calculation",
                "question_text": "If a company needs to purchase 1,000 EUAs at €85 per allowance, what is the total cost?",
                "question_type": "numeric",
                "explanation": "Simple multiplication: 1,000 × €85 = €85,000",
                "points": 2,
                "difficulty_level": "EASY",
                "category": "EUA",
                "tags": ["calculation", "pricing", "trading"],
                "options": []
            },
            {
                "title": "Market Stability Reserve",
                "question_text": "The Market Stability Reserve (MSR) was introduced to address surplus allowances in the EU ETS.",
                "question_type": "true_false",
                "explanation": "The MSR was indeed introduced in Phase 4 to address the surplus of allowances and improve market stability.",
                "points": 1,
                "difficulty_level": "MEDIUM",
                "category": "EUA",
                "tags": ["msr", "surplus", "stability"],
                "options": []
            },
            {
                "title": "CBAM Implementation Timeline",
                "question_text": "When did the transitional phase of CBAM begin?",
                "question_type": "multiple_choice",
                "explanation": "The CBAM transitional phase began on October 1, 2023, with reporting obligations only.",
                "points": 2,
                "difficulty_level": "MEDIUM",
                "category": "CBAM",
                "tags": ["timeline", "implementation", "transition"],
                "options": [
                    {"option_text": "January 1, 2023", "is_correct": False, "sort_order": 1},
                    {"option_text": "October 1, 2023", "is_correct": True, "sort_order": 2},
                    {"option_text": "January 1, 2024", "is_correct": False, "sort_order": 3},
                    {"option_text": "January 1, 2026", "is_correct": False, "sort_order": 4}
                ]
            },
            {
                "title": "Biofuel Sustainability",
                "question_text": "Which sustainability criteria must biofuels meet under the RED II directive? Select all that apply.",
                "question_type": "multiple_select",
                "explanation": "RED II sets comprehensive sustainability criteria for biofuels including GHG savings, land use, and biodiversity protection.",
                "points": 4,
                "difficulty_level": "HARD",
                "category": "BIOFUELS",
                "tags": ["red2", "sustainability", "criteria"],
                "options": [
                    {"option_text": "Minimum 50% GHG emission savings", "is_correct": True, "sort_order": 1},
                    {"option_text": "No production on high carbon stock land", "is_correct": True, "sort_order": 2},
                    {"option_text": "Maximum 10% food crop share", "is_correct": False, "sort_order": 3},
                    {"option_text": "Biodiversity protection requirements", "is_correct": True, "sort_order": 4},
                    {"option_text": "Mandatory EU production", "is_correct": False, "sort_order": 5}
                ]
            },
            {
                "title": "Additionality Principle",
                "question_text": "What does 'additionality' mean in the context of carbon offset projects?",
                "question_type": "multiple_choice",
                "explanation": "Additionality ensures that emission reductions would not have occurred without the carbon finance incentive.",
                "points": 3,
                "difficulty_level": "HARD",
                "category": "VCM",
                "tags": ["additionality", "offsets", "principle"],
                "options": [
                    {"option_text": "The project reduces emissions beyond business-as-usual", "is_correct": True, "sort_order": 1},
                    {"option_text": "The project adds renewable energy capacity", "is_correct": False, "sort_order": 2},
                    {"option_text": "The project provides additional co-benefits", "is_correct": False, "sort_order": 3},
                    {"option_text": "The project adds to existing regulations", "is_correct": False, "sort_order": 4}
                ]
            }
        ]
        
        created_count = 0
        for q_data in questions_data:
            # Create question
            question = Question(
                title=q_data["title"],
                question_text=q_data["question_text"],
                question_type=q_data["question_type"],
                explanation=q_data["explanation"],
                points=q_data["points"],
                difficulty_level=q_data["difficulty_level"],
                category=q_data["category"],
                tags=q_data["tags"],
                created_by=creator_id,
                is_active=True
            )
            db.add(question)
            db.flush()  # Get question ID
            
            # Create options if any
            for opt_data in q_data["options"]:
                option = QuestionOption(
                    question_id=question.id,
                    option_text=opt_data["option_text"],
                    is_correct=opt_data["is_correct"],
                    sort_order=opt_data["sort_order"]
                )
                db.add(option)
            
            created_count += 1
        
        db.commit()
        print(f"✅ Successfully created {created_count} sample questions!")
        
        # Print summary
        print("\n📊 Question Summary:")
        print(f"   • Multiple Choice: {len([q for q in questions_data if q['question_type'] == 'multiple_choice'])}")
        print(f"   • Multiple Select: {len([q for q in questions_data if q['question_type'] == 'multiple_select'])}")
        print(f"   • True/False: {len([q for q in questions_data if q['question_type'] == 'true_false'])}")
        print(f"   • Essay: {len([q for q in questions_data if q['question_type'] == 'essay'])}")
        print(f"   • Numeric: {len([q for q in questions_data if q['question_type'] == 'numeric'])}")
        
        print("\n🏷️  Categories:")
        categories = {}
        for q in questions_data:
            cat = q['category']
            categories[cat] = categories.get(cat, 0) + 1
        for cat, count in categories.items():
            print(f"   • {cat}: {count}")
        
        print("\n🎯 Difficulty Levels:")
        difficulties = {}
        for q in questions_data:
            diff = q['difficulty_level']
            difficulties[diff] = difficulties.get(diff, 0) + 1
        for diff, count in difficulties.items():
            print(f"   • {diff}: {count}")
        
    except Exception as e:
        print(f"❌ Error creating sample questions: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Creating sample questions for carbon trading education...")
    create_sample_questions()
    print("✨ Done!") 