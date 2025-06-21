#!/usr/bin/env python3
"""
Test script for the structured assessment system API
"""

import requests
import json

# API base URL
BASE_URL = "http://localhost:8000/api/v1"

def test_question_bank():
    """Test question bank endpoints"""
    print("🧪 Testing Question Bank API...")
    
    # Test getting all questions
    try:
        response = requests.get(f"{BASE_URL}/education/questions/")
        if response.status_code == 200:
            questions = response.json()
            print(f"✅ Found {len(questions)} questions in the question bank")
            
            # Show sample question
            if questions:
                sample = questions[0]
                print(f"   Sample: '{sample['title']}' ({sample['question_type']})")
        else:
            print(f"❌ Failed to get questions: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error testing questions: {e}")

def test_question_details():
    """Test getting question details with options"""
    print("\n🧪 Testing Question Details API...")
    
    try:
        # First get a question ID
        response = requests.get(f"{BASE_URL}/education/questions/")
        if response.status_code == 200:
            questions = response.json()
            if questions:
                question_id = questions[0]['id']
                
                # Get question details
                detail_response = requests.get(f"{BASE_URL}/education/questions/{question_id}")
                if detail_response.status_code == 200:
                    question = detail_response.json()
                    print(f"✅ Question details loaded: '{question['title']}'")
                    print(f"   Type: {question['question_type']}")
                    print(f"   Points: {question['points']}")
                    print(f"   Options: {len(question.get('options', []))}")
                else:
                    print(f"❌ Failed to get question details: {detail_response.status_code}")
        else:
            print("❌ No questions found to test details")
    except Exception as e:
        print(f"❌ Error testing question details: {e}")

def test_assessments():
    """Test assessment endpoints"""
    print("\n🧪 Testing Assessment API...")
    
    try:
        response = requests.get(f"{BASE_URL}/education/assessments/")
        if response.status_code == 200:
            assessments = response.json()
            print(f"✅ Found {len(assessments)} assessments")
            
            if assessments:
                assessment_id = assessments[0]['id']
                
                # Test getting assessment questions
                questions_response = requests.get(f"{BASE_URL}/education/assessments/{assessment_id}/questions")
                if questions_response.status_code == 200:
                    assessment_questions = questions_response.json()
                    print(f"   Assessment has {len(assessment_questions)} questions")
                else:
                    print(f"   ❌ Failed to get assessment questions: {questions_response.status_code}")
        else:
            print(f"❌ Failed to get assessments: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing assessments: {e}")

def test_question_types():
    """Test different question types"""
    print("\n🧪 Testing Question Types...")
    
    try:
        response = requests.get(f"{BASE_URL}/education/questions/")
        if response.status_code == 200:
            questions = response.json()
            
            # Count question types
            types = {}
            for q in questions:
                qtype = q['question_type']
                types[qtype] = types.get(qtype, 0) + 1
            
            print("✅ Question types found:")
            for qtype, count in types.items():
                print(f"   • {qtype}: {count}")
        else:
            print(f"❌ Failed to get questions for type analysis: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing question types: {e}")

def main():
    """Run all tests"""
    print("🚀 Testing Structured Assessment System API")
    print("=" * 50)
    
    test_question_bank()
    test_question_details()
    test_assessments()
    test_question_types()
    
    print("\n" + "=" * 50)
    print("✨ Testing completed!")

if __name__ == "__main__":
    main() 