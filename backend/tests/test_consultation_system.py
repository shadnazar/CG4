"""
Test Suite for Online Consultation System
Tests: Questions API, Submit API, Admin APIs, Event Tracking
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "celestaglow2024")
TEST_PHONE = "9876543210"


class TestConsultationQuestions:
    """Test consultation questions API"""
    
    def test_get_questions_english(self):
        """Test getting questions in English"""
        response = requests.get(f"{BASE_URL}/api/consultation/questions?lang=en")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "questions" in data
        questions = data["questions"]
        
        # Should have 6 questions
        assert len(questions) == 6, f"Expected 6 questions, got {len(questions)}"
        
        # Verify question structure
        for q in questions:
            assert "id" in q
            assert "question" in q
            assert "type" in q
            assert "options" in q
            assert len(q["options"]) > 0
        
        # Verify Q4 has followup (sunscreen question)
        q4 = next((q for q in questions if q["id"] == 4), None)
        assert q4 is not None
        assert "followup" in q4
        assert "question" in q4["followup"]
        assert "options" in q4["followup"]
        
        print("✓ English questions API working correctly")
    
    def test_get_questions_hindi(self):
        """Test getting questions in Hindi"""
        response = requests.get(f"{BASE_URL}/api/consultation/questions?lang=hi")
        assert response.status_code == 200
        
        data = response.json()
        questions = data["questions"]
        
        # Verify Hindi content
        assert len(questions) == 6
        # First question should be in Hindi
        assert "उम्र" in questions[0]["question"] or "आपकी" in questions[0]["question"]
        
        print("✓ Hindi questions API working correctly")
    
    def test_get_questions_malayalam(self):
        """Test getting questions in Malayalam"""
        response = requests.get(f"{BASE_URL}/api/consultation/questions?lang=ml")
        assert response.status_code == 200
        
        data = response.json()
        questions = data["questions"]
        
        # Verify Malayalam content
        assert len(questions) == 6
        # Malayalam uses different script
        assert "നിങ്ങളുടെ" in questions[0]["question"] or "പ്രായം" in questions[0]["question"]
        
        print("✓ Malayalam questions API working correctly")
    
    def test_get_labels(self):
        """Test getting labels for all languages"""
        response = requests.get(f"{BASE_URL}/api/consultation/labels?lang=en")
        assert response.status_code == 200
        
        data = response.json()
        assert "age" in data
        assert "skin_type" in data
        assert "concerns" in data
        assert "sun_exposure" in data
        assert "sunscreen" in data
        assert "lifestyle" in data
        assert "skincare" in data
        
        print("✓ Labels API working correctly")


class TestConsultationSubmit:
    """Test consultation submission and result generation"""
    
    def test_submit_consultation_success(self):
        """Test successful consultation submission"""
        session_id = f"test_session_{int(time.time())}"
        
        payload = {
            "answers": {
                "age_group": "30_40",
                "skin_type": "combination",
                "concerns": ["fine_lines", "pigmentation"],
                "sun_exposure": "1_2_hrs",
                "sunscreen_usage": "sometimes",
                "lifestyle": "moderate",
                "skincare_usage": "basic"
            },
            "phone": TEST_PHONE,
            "face_images": [],
            "language": "en",
            "session_id": session_id
        }
        
        response = requests.post(f"{BASE_URL}/api/consultation/submit", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "phone" in data
        assert "answers" in data
        assert "result" in data
        assert "created_at" in data
        
        # Verify result structure
        result = data["result"]
        assert "aging_level" in result
        assert result["aging_level"] in ["low", "moderate", "high"]
        assert "causes" in result
        assert isinstance(result["causes"], list)
        assert "morning_routine" in result
        assert "night_routine" in result
        assert "rules" in result
        assert "diet_tips" in result
        assert "exercise_tips" in result
        assert "product_usage" in result
        
        print(f"✓ Consultation submitted successfully, aging level: {result['aging_level']}")
        return data["id"]
    
    def test_submit_consultation_invalid_phone(self):
        """Test submission with invalid phone number"""
        payload = {
            "answers": {
                "age_group": "25_30",
                "skin_type": "oily",
                "concerns": ["dull_skin"],
                "sun_exposure": "less_30_min",
                "sunscreen_usage": "daily",
                "lifestyle": "healthy",
                "skincare_usage": "active"
            },
            "phone": "12345",  # Invalid - too short
            "face_images": [],
            "language": "en",
            "session_id": "test_invalid_phone"
        }
        
        response = requests.post(f"{BASE_URL}/api/consultation/submit", json=payload)
        assert response.status_code == 400, f"Expected 400 for invalid phone, got {response.status_code}"
        
        print("✓ Invalid phone validation working correctly")
    
    def test_submit_consultation_high_aging(self):
        """Test consultation that should result in HIGH aging level"""
        session_id = f"test_high_aging_{int(time.time())}"
        
        payload = {
            "answers": {
                "age_group": "40_plus",
                "skin_type": "dry",
                "concerns": ["fine_lines", "pigmentation"],
                "sun_exposure": "more_2_hrs",
                "sunscreen_usage": "never",
                "lifestyle": "poor",
                "skincare_usage": "none"
            },
            "phone": "9876543211",
            "face_images": [],
            "language": "en",
            "session_id": session_id
        }
        
        response = requests.post(f"{BASE_URL}/api/consultation/submit", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        result = data["result"]
        
        # With these answers, aging level should be high
        assert result["aging_level"] == "high", f"Expected 'high' aging level, got {result['aging_level']}"
        
        # Product usage should mention EVERY NIGHT for high aging
        assert "EVERY NIGHT" in result["product_usage"] or "every night" in result["product_usage"].lower()
        
        print("✓ High aging level calculation working correctly")
    
    def test_submit_consultation_low_aging(self):
        """Test consultation that should result in LOW aging level"""
        session_id = f"test_low_aging_{int(time.time())}"
        
        payload = {
            "answers": {
                "age_group": "under_25",
                "skin_type": "oily",
                "concerns": ["dull_skin"],
                "sun_exposure": "less_30_min",
                "sunscreen_usage": "daily",
                "lifestyle": "healthy",
                "skincare_usage": "active"
            },
            "phone": "9876543212",
            "face_images": [],
            "language": "en",
            "session_id": session_id
        }
        
        response = requests.post(f"{BASE_URL}/api/consultation/submit", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        result = data["result"]
        
        # With these answers, aging level should be low
        assert result["aging_level"] == "low", f"Expected 'low' aging level, got {result['aging_level']}"
        
        # Product usage should mention 3 nights per week for low aging
        assert "3 nights" in result["product_usage"] or "prevention" in result["product_usage"].lower()
        
        print("✓ Low aging level calculation working correctly")


class TestConsultationEventTracking:
    """Test consultation event tracking"""
    
    def test_track_event(self):
        """Test tracking consultation events"""
        session_id = f"test_track_{int(time.time())}"
        
        payload = {
            "session_id": session_id,
            "event_type": "started",
            "step": None,
            "page": "consultation"
        }
        
        response = requests.post(f"{BASE_URL}/api/consultation/track-event", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        print("✓ Event tracking working correctly")
    
    def test_track_step_completed(self):
        """Test tracking step completion"""
        session_id = f"test_step_{int(time.time())}"
        
        payload = {
            "session_id": session_id,
            "event_type": "step_1_completed",
            "step": 1,
            "page": "consultation"
        }
        
        response = requests.post(f"{BASE_URL}/api/consultation/track-event", json=payload)
        assert response.status_code == 200
        
        print("✓ Step completion tracking working correctly")


class TestConsultationAdmin:
    """Test admin consultation APIs"""
    
    def test_get_all_consultations_unauthorized(self):
        """Test getting consultations without auth"""
        response = requests.get(f"{BASE_URL}/api/consultation/admin/all")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        print("✓ Admin auth protection working correctly")
    
    def test_get_all_consultations_authorized(self):
        """Test getting consultations with valid admin token"""
        headers = {"X-Admin-Token": ADMIN_PASSWORD}
        
        response = requests.get(f"{BASE_URL}/api/consultation/admin/all", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "consultations" in data
        assert "count" in data
        assert isinstance(data["consultations"], list)
        
        print(f"✓ Admin consultations API working, found {data['count']} consultations")
    
    def test_get_consultation_stats(self):
        """Test getting consultation statistics"""
        headers = {"X-Admin-Token": ADMIN_PASSWORD}
        
        response = requests.get(f"{BASE_URL}/api/consultation/admin/stats", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "consultation_stats" in data
        assert "funnel_stats" in data
        
        stats = data["consultation_stats"]
        assert "total_consultations" in stats
        assert "pdf_downloads" in stats
        assert "by_aging_level" in stats
        
        funnel = data["funnel_stats"]
        assert "started" in funnel
        assert "completed" in funnel
        assert "completion_rate" in funnel
        
        print(f"✓ Admin stats API working, total consultations: {stats['total_consultations']}")


class TestConsultationPDFDownload:
    """Test PDF download tracking"""
    
    def test_mark_pdf_downloaded(self):
        """Test marking PDF as downloaded"""
        # First create a consultation
        session_id = f"test_pdf_{int(time.time())}"
        
        payload = {
            "answers": {
                "age_group": "25_30",
                "skin_type": "combination",
                "concerns": ["dull_skin"],
                "sun_exposure": "1_2_hrs",
                "sunscreen_usage": "sometimes",
                "lifestyle": "moderate",
                "skincare_usage": "basic"
            },
            "phone": "9876543213",
            "face_images": [],
            "language": "en",
            "session_id": session_id
        }
        
        create_response = requests.post(f"{BASE_URL}/api/consultation/submit", json=payload)
        assert create_response.status_code == 200
        
        consultation_id = create_response.json()["id"]
        
        # Mark PDF as downloaded
        response = requests.post(
            f"{BASE_URL}/api/consultation/{consultation_id}/pdf-downloaded?session_id={session_id}"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        print("✓ PDF download tracking working correctly")


class TestConsultationRetrieval:
    """Test consultation retrieval"""
    
    def test_get_consultation_by_id(self):
        """Test getting consultation by ID"""
        # First create a consultation
        session_id = f"test_get_{int(time.time())}"
        
        payload = {
            "answers": {
                "age_group": "30_40",
                "skin_type": "oily",
                "concerns": ["pigmentation"],
                "sun_exposure": "less_30_min",
                "sunscreen_usage": "daily",
                "lifestyle": "healthy",
                "skincare_usage": "basic"
            },
            "phone": "9876543214",
            "face_images": [],
            "language": "en",
            "session_id": session_id
        }
        
        create_response = requests.post(f"{BASE_URL}/api/consultation/submit", json=payload)
        assert create_response.status_code == 200
        
        consultation_id = create_response.json()["id"]
        
        # Get consultation by ID
        response = requests.get(f"{BASE_URL}/api/consultation/{consultation_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == consultation_id
        assert data["phone"] == "9876543214"
        
        print("✓ Consultation retrieval by ID working correctly")
    
    def test_get_nonexistent_consultation(self):
        """Test getting non-existent consultation"""
        response = requests.get(f"{BASE_URL}/api/consultation/nonexistent-id-12345")
        assert response.status_code == 404
        
        print("✓ Non-existent consultation returns 404 correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
