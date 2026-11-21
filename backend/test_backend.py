import asyncio
import httpx

BASE_URL = "http://127.0.0.1:8000"

async def run_tests():
    print("==================================================")
    print("DONOR LEAGUE - COMPREHENSIVE BACKEND TEST SUITE")
    print("==================================================")

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
        # 1. Health Check
        print("\n[1] Testing Health Endpoint...")
        r = await client.get("/api/v1/health")
        assert r.status_code == 200, f"Health check failed: {r.text}"
        print("  -> Health OK:", r.json())

        # 2. Login as existing seeded donor (Arjun Mehta, O+)
        print("\n[2] Testing Donor Login...")
        r = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "arjun.donor@donorleague.org",
            "password": "DonorPass@123"
        })
        assert r.status_code == 200, f"Login failed: {r.text}"
        donor_token = r.json()["access_token"]
        donor_headers = {"Authorization": f"Bearer {donor_token}"}
        print("  -> Donor login successful. Donor ID:", r.json()["identifier"])

        # 3. Test Availability Toggle (Set Not Available, then Set Available)
        print("\n[3] Testing Donor Availability Toggle...")
        r = await client.patch("/api/v1/donors/availability", headers=donor_headers, json={"is_available": False})
        assert r.status_code == 200
        assert r.json()["is_available"] is False
        print("  -> Set to NOT AVAILABLE verified.")

        r = await client.patch("/api/v1/donors/availability", headers=donor_headers, json={"is_available": True})
        assert r.status_code == 200
        assert r.json()["is_available"] is True
        print("  -> Restored to AVAILABLE verified.")

        # 4. Login as existing seeded attendant (Deepak Joshi)
        print("\n[4] Testing Attendant Login...")
        r = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "attendant@donorleague.org",
            "password": "AttendantPass@123"
        })
        assert r.status_code == 200, f"Attendant login failed: {r.text}"
        attendant_token = r.json()["access_token"]
        attendant_headers = {"Authorization": f"Bearer {attendant_token}"}
        print("  -> Attendant login successful. Attendant ID:", r.json()["identifier"])

        # 5. OpenStreetMap Geocoding Endpoint Test
        print("\n[5] Testing OpenStreetMap Search Endpoint...")
        r = await client.get("/api/v1/geo/search?query=Apollo%20Hospital")
        assert r.status_code == 200
        places = r.json()
        assert len(places) > 0
        print(f"  -> Found {len(places)} locations. Top: {places[0]['display_name'][:50]}...")

        # 6. Create Blood Request (Hospital at lat 12.9716, lon 77.5946 - Bowring Hospital, Bangalore)
        print("\n[6] Submitting Blood Request with OSM Hospital Location...")
        req_payload = {
            "patient_reference": "PATIENT-KUMAR-99",
            "required_blood_group": "O+",
            "units_required": 2,
            "urgency": "URGENT",
            "hospital_name": "Bowring & Lady Curzon Hospital",
            "hospital_address": "Lady Curzon Rd, Shivaji Nagar, Bengaluru, Karnataka 560001",
            "hospital_city": "Bengaluru",
            "hospital_district": "Bengaluru Urban",
            "hospital_state": "Karnataka",
            "hospital_latitude": 12.9780,
            "hospital_longitude": 77.5980,
            "required_date": "2026-11-22",
            "required_time": "14:00",
            "instructions": "Urgent requirement for surgical procedure in ICU ward.",
            "initial_search_radius_km": 5.0
        }
        r = await client.post("/api/v1/requests", headers=attendant_headers, json=req_payload)
        assert r.status_code == 201, f"Blood request failed: {r.text}"
        created_req = r.json()
        req_id = created_req["id"]
        req_code = created_req["request_id"]
        print(f"  -> Blood Request created: {req_code} (DB ID: {req_id}), Status: {created_req['status']}")

        # 7. Verify Automatic Geographical Donor Matching
        print("\n[7] Verifying Automatic Matching Engine...")
        r = await client.get(f"/api/v1/matching/request/{req_id}")
        assert r.status_code == 200
        match_data = r.json()
        print(f"  -> Total matching donors within 5 km: {match_data['total_matches_found']}")
        assert match_data['total_matches_found'] > 0
        for d in match_data['donors']:
            print(f"     * Donor {d['donor_identifier']} ({d['display_name']}) - Blood: {d['blood_group']}, Distance: {d['distance_km']} km, Status: {d['match_status']}")

        # 8. Check Incoming Request in Donor's Dashboard
        print("\n[8] Checking Donor's Incoming Requests...")
        r = await client.get("/api/v1/donors/requests/incoming", headers=donor_headers)
        assert r.status_code == 200
        incoming = r.json()
        matching_item = next((item for item in incoming if item["request_id"] == req_id), None)
        assert matching_item is not None, "Incoming request not found in donor feed"
        print(f"  -> Request verified in donor feed: {matching_item['request_code']} at {matching_item['hospital_name']}")

        # 9. Donor Accepts Request
        print("\n[9] Donor Accepting Blood Request...")
        r = await client.post(
            f"/api/v1/donors/requests/{req_id}/respond",
            headers=donor_headers,
            json={"response": "ACCEPTED"}
        )
        assert r.status_code == 200
        resp_data = r.json()
        assert resp_data["status"] == "success"
        print("  -> Request accepted successfully! Connection details:")
        print(f"     Connection ID: {resp_data['connection']['connection_id']}")
        print(f"     Attendant Contact: {resp_data['connection']['attendant_phone']}")

        # 10. Attendant Views Connected Donors
        print("\n[10] Attendant Checking Connected Donors...")
        r = await client.get("/api/v1/attendants/connections", headers=attendant_headers)
        assert r.status_code == 200
        connections = r.json()
        active_conn = next((c for c in connections if c["request_id"] == req_id), None)
        assert active_conn is not None
        print(f"  -> Verified Connection: Donor {active_conn['donor_name']} ({active_conn['donor_phone']})")

        # 11. Attendant Confirms Fulfillment
        print("\n[11] Attendant Confirming Fulfillment...")
        r = await client.post(f"/api/v1/attendants/requests/{req_id}/confirm-fulfillment", headers=attendant_headers)
        assert r.status_code == 200
        print("  -> Fulfillment confirmed:", r.json()["message"])

        # 12. Verify Tracking Steps
        print("\n[12] Verifying Complete Request Tracking Timeline...")
        r = await client.get(f"/api/v1/requests/{req_id}/tracking")
        assert r.status_code == 200
        steps = r.json()
        print(f"  -> Total tracking events recorded: {len(steps)}")
        for s in steps:
            print(f"     Stage {s['stage']}: [{s['status']}] {s['description']}")

    print("\n==================================================")
    print("ALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
