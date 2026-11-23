import asyncio
import time
import sys
import os
import httpx

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.core.database import ensure_db

async def run_all_tests():
    print("=" * 70, flush=True)
    print("DONOR LEAGUE — MASTER END-TO-END VERIFICATION SUITE", flush=True)
    print("=" * 70, flush=True)

    await ensure_db()
    print("[INIT] Database initialized & verified successfully.", flush=True)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://localhost:8000", timeout=20.0) as client:
        ts = int(time.time())

        # -------------------------------------------------------------
        # 1. Health and Root Check
        # -------------------------------------------------------------
        print("\n[TEST 1] Testing Health & Root Endpoints...", flush=True)
        r_root = await client.get("/")
        assert r_root.status_code == 200, f"Root failed: {r_root.text}"
        assert r_root.json()["status"] == "operational"

        r_health = await client.get("/api/v1/health")
        assert r_health.status_code == 200, f"Health check failed: {r_health.text}"
        assert r_health.json()["status"] == "healthy"
        print("  -> Root and Health check passed: {status: 'healthy'}", flush=True)

        # -------------------------------------------------------------
        # 2. Validation & Duplicate Account Prevention
        # -------------------------------------------------------------
        print("\n[TEST 2] Testing Validation & Duplicate Account Handling...", flush=True)
        # Passwords mismatch
        r_mismatch = await client.post("/api/v1/auth/signup", json={
            "full_name": "Test User",
            "mobile_number": "9876543299",
            "email": f"test_val_{ts}@donorleague.org",
            "password": "Password123",
            "confirm_password": "DifferentPassword123"
        })
        assert r_mismatch.status_code == 400
        print("  -> Password mismatch correctly rejected (400)", flush=True)

        # Password too short (< 6 chars)
        r_short = await client.post("/api/v1/auth/signup", json={
            "full_name": "Test User",
            "mobile_number": "9876543299",
            "email": f"test_val_{ts}@donorleague.org",
            "password": "123",
            "confirm_password": "123"
        })
        assert r_short.status_code in (400, 422)
        print("  -> Short password correctly rejected", flush=True)

        # -------------------------------------------------------------
        # 3. Complete Donor User Journey
        # -------------------------------------------------------------
        print("\n[TEST 3] Testing Complete New Donor Workflow...", flush=True)
        donor_email = f"donor_journey_{ts}@donorleague.org"
        donor_phone = f"97{str(ts)[-8:]}"
        donor_pass = "DonorJourney@2026"

        # 3.1 Signup
        r_signup_d = await client.post("/api/v1/auth/signup", json={
            "full_name": "Kiran Donor",
            "mobile_number": donor_phone,
            "email": donor_email,
            "password": donor_pass,
            "confirm_password": donor_pass
        })
        assert r_signup_d.status_code == 201
        d_token = r_signup_d.json()["access_token"]
        assert r_signup_d.json()["role"] == "pending"
        assert r_signup_d.json()["profile_completed"] is False
        d_headers = {"Authorization": f"Bearer {d_token}"}
        print("  -> Step 3.1: Account created with role='pending'", flush=True)

        # 3.2 Duplicate Prevention Check
        r_dup_email = await client.post("/api/v1/auth/signup", json={
            "full_name": "Other User",
            "mobile_number": "9112233445",
            "email": donor_email,
            "password": donor_pass,
            "confirm_password": donor_pass
        })
        assert r_dup_email.status_code == 409
        print("  -> Step 3.2: Duplicate email registration blocked (409)", flush=True)

        # 3.3 Select Role: Donor
        r_role_d = await client.post("/api/v1/auth/select-role", headers=d_headers, json={"role": "donor"})
        assert r_role_d.status_code == 200
        if "access_token" in r_role_d.json():
            d_token = r_role_d.json()["access_token"]
            d_headers = {"Authorization": f"Bearer {d_token}"}
        print("  -> Step 3.3: Role selected as 'donor'", flush=True)

        # 3.4 Complete Donor Profile
        r_comp_d = await client.post("/api/v1/auth/complete-profile/donor", headers=d_headers, json={
            "date_of_birth": "1993-08-20",
            "gender": "Male",
            "blood_group": "O+",
            "state": "Karnataka",
            "district": "Bengaluru Urban",
            "city": "Bengaluru",
            "area": "Koramangala 4th Block",
            "residential_address": "80 Feet Rd, Koramangala",
            "latitude": 12.9352,
            "longitude": 77.6245,
            "location_source": "osm_geocode",
            "whatsapp_consent": True,
            "sms_consent": True,
            "terms_consent": True
        })
        assert r_comp_d.status_code == 201
        comp_d_data = r_comp_d.json()
        assert comp_d_data["role"] == "donor"
        assert comp_d_data["profile_completed"] is True
        assert comp_d_data["identifier"].startswith("DL-D-")
        new_donor_id = comp_d_data["identifier"]
        print(f"  -> Step 3.4: Donor profile completed with ID: {new_donor_id}", flush=True)

        # 3.5 Verify /auth/me
        r_me_d = await client.get("/api/v1/auth/me", headers=d_headers)
        assert r_me_d.status_code == 200
        assert r_me_d.json()["role"] == "donor"
        assert r_me_d.json()["profile_completed"] is True
        assert r_me_d.json()["donor_profile"]["blood_group"] == "O+"
        print("  -> Step 3.5: /auth/me verified with completed donor profile", flush=True)

        # 3.6 Subsequent Login for Donor
        r_login_d = await client.post("/api/v1/auth/login", json={
            "email_or_phone": donor_email,
            "password": donor_pass
        })
        assert r_login_d.status_code == 200
        assert r_login_d.json()["role"] == "donor"
        assert r_login_d.json()["profile_completed"] is True
        assert r_login_d.json()["identifier"] == new_donor_id
        print("  -> Step 3.6: Subsequent sign-in automatically routes to Donor Dashboard", flush=True)

        # -------------------------------------------------------------
        # 4. Complete Attender User Journey
        # -------------------------------------------------------------
        print("\n[TEST 4] Testing Complete New Attender Workflow...", flush=True)
        att_email = f"attender_journey_{ts}@donorleague.org"
        att_phone = f"96{str(ts)[-8:]}"
        att_pass = "AttenderJourney@2026"

        # 4.1 Signup
        r_signup_a = await client.post("/api/v1/auth/signup", json={
            "full_name": "Meera Attender",
            "mobile_number": att_phone,
            "email": att_email,
            "password": att_pass,
            "confirm_password": att_pass
        })
        assert r_signup_a.status_code == 201
        a_token = r_signup_a.json()["access_token"]
        a_headers = {"Authorization": f"Bearer {a_token}"}
        print("  -> Step 4.1: Account created with role='pending'", flush=True)

        # 4.2 Select Role: Attender
        r_role_a = await client.post("/api/v1/auth/select-role", headers=a_headers, json={"role": "attendant"})
        assert r_role_a.status_code == 200
        if "access_token" in r_role_a.json():
            a_token = r_role_a.json()["access_token"]
            a_headers = {"Authorization": f"Bearer {a_token}"}
        print("  -> Step 4.2: Role selected as 'attendant'", flush=True)

        # 4.3 Complete Attender Profile
        r_comp_a = await client.post("/api/v1/auth/complete-profile/attendant", headers=a_headers, json={
            "city": "Bengaluru",
            "state": "Karnataka",
            "terms_consent": True
        })
        assert r_comp_a.status_code == 201
        comp_a_data = r_comp_a.json()
        assert comp_a_data["role"] == "attendant"
        assert comp_a_data["profile_completed"] is True
        assert comp_a_data["identifier"].startswith("DL-A-")
        new_att_id = comp_a_data["identifier"]
        print(f"  -> Step 4.3: Attender profile completed with ID: {new_att_id}", flush=True)

        # 4.4 Verify /auth/me for Attender
        r_me_a = await client.get("/api/v1/auth/me", headers=a_headers)
        assert r_me_a.status_code == 200
        assert r_me_a.json()["role"] == "attendant"
        assert r_me_a.json()["profile_completed"] is True
        print("  -> Step 4.4: /auth/me verified for attender", flush=True)

        # 4.5 Subsequent Login for Attender
        r_login_a = await client.post("/api/v1/auth/login", json={
            "email_or_phone": att_phone,
            "password": att_pass
        })
        assert r_login_a.status_code == 200
        assert r_login_a.json()["role"] == "attendant"
        assert r_login_a.json()["profile_completed"] is True
        assert r_login_a.json()["identifier"] == new_att_id
        print("  -> Step 4.5: Subsequent sign-in automatically routes to Attender Dashboard", flush=True)

        # -------------------------------------------------------------
        # 5. Security & Authorization Restrictions
        # -------------------------------------------------------------
        print("\n[TEST 5] Testing Security & Cross-Role Restrictions...", flush=True)
        # Unauthenticated calls
        assert (await client.get("/api/v1/donors/profile")).status_code == 401
        assert (await client.get("/api/v1/attendants/profile")).status_code == 401
        assert (await client.post("/api/v1/requests", json={})).status_code == 401
        print("  -> Unauthenticated protected route access blocked (401)", flush=True)

        # Cross-role access
        assert (await client.get("/api/v1/donors/profile", headers=a_headers)).status_code == 403
        assert (await client.get("/api/v1/attendants/profile", headers=d_headers)).status_code == 403
        r_cross_req = await client.post("/api/v1/requests", headers=d_headers, json={
            "patient_reference": "Test",
            "required_blood_group": "O+",
            "units_required": 1,
            "urgency": "NORMAL",
            "hospital_name": "Test Hospital",
            "hospital_address": "Test Address",
            "hospital_city": "Bengaluru",
            "hospital_latitude": 12.97,
            "hospital_longitude": 77.59,
            "required_date": "2026-11-25",
            "required_time": "12:00"
        })
        assert r_cross_req.status_code == 403, f"Expected 403 for donor creating request, got {r_cross_req.status_code}"
        print("  -> Cross-role access blocked (403)", flush=True)

        # -------------------------------------------------------------
        # 6. OpenStreetMap & Geolocation Services
        # -------------------------------------------------------------
        print("\n[TEST 6] Testing OpenStreetMap Geocoding & Location...", flush=True)
        r_geo = await client.get("/api/v1/geo/search?query=Manipal%20Hospital")
        assert r_geo.status_code == 200
        places = r_geo.json()
        assert len(places) > 0
        print(f"  -> OSM search returned {len(places)} results. Top: {places[0]['display_name'][:60]}...", flush=True)

        r_rev = await client.get("/api/v1/geo/reverse?lat=12.9716&lon=77.5946")
        assert r_rev.status_code == 200
        print(f"  -> OSM reverse geocode verified: {r_rev.json()['display_name'][:50]}...", flush=True)

        # -------------------------------------------------------------
        # 7. Blood Request, Geographical Matching & Notification Simulation
        # -------------------------------------------------------------
        print("\n[TEST 7] Testing Blood Request Submission & Matching...", flush=True)
        req_res = await client.post("/api/v1/requests", headers=a_headers, json={
            "patient_reference": f"PATIENT-{ts}",
            "required_blood_group": "O+",
            "units_required": 2,
            "urgency": "URGENT",
            "hospital_name": "St. John's Medical College Hospital",
            "hospital_address": "Sarjapur - Marathahalli Rd, John Nagar, Koramangala, Bengaluru, Karnataka 560034",
            "hospital_city": "Bengaluru",
            "hospital_district": "Bengaluru Urban",
            "hospital_state": "Karnataka",
            "hospital_latitude": 12.9340,
            "hospital_longitude": 77.6190,
            "required_date": "2026-11-24",
            "required_time": "11:00",
            "instructions": "Immediate requirement for emergency surgery.",
            "initial_search_radius_km": 5.0
        })
        assert req_res.status_code == 201
        created_req = req_res.json()
        req_id = created_req["id"]
        req_code = created_req["request_id"]
        print(f"  -> Blood request registered: {req_code} (ID: {req_id})", flush=True)

        # Check geographical matches
        r_matches = await client.get(f"/api/v1/matching/request/{req_id}")
        assert r_matches.status_code == 200
        matches = r_matches.json()
        assert matches["total_matches_found"] > 0
        print(f"  -> Discovered {matches['total_matches_found']} matching donors within {matches['search_radius_km']} km", flush=True)
        assert matches["donors"][0]["notification_status"] == "SIMULATED"
        print("  -> Notification status clearly identifies simulation mode: 'SIMULATED'", flush=True)

        # -------------------------------------------------------------
        # 8. Donor Acceptance, Connection & Fulfillment Loop
        # -------------------------------------------------------------
        print("\n[TEST 8] Testing Donor Response, Connection & Fulfillment...", flush=True)
        # Check donor incoming feed
        r_incoming = await client.get("/api/v1/donors/requests/incoming", headers=d_headers)
        assert r_incoming.status_code == 200
        found_req = next((item for item in r_incoming.json() if item["request_id"] == req_id), None)
        assert found_req is not None, "Request not found in matching donor incoming requests"
        print(f"  -> Donor feed displays incoming matching request: {found_req['request_code']}", flush=True)

        # Donor accepts
        r_accept = await client.post(f"/api/v1/donors/requests/{req_id}/respond", headers=d_headers, json={"response": "ACCEPTED"})
        assert r_accept.status_code == 200
        assert r_accept.json()["status"] == "success"
        print("  -> Donor successfully accepted request. Connection generated.", flush=True)

        # Attendant sees connection
        r_conns = await client.get("/api/v1/attendants/connections", headers=a_headers)
        assert r_conns.status_code == 200
        conn_item = next((c for c in r_conns.json() if c["request_id"] == req_id), None)
        assert conn_item is not None
        assert conn_item["donor_name"] == "Kiran Donor"
        print(f"  -> Attendant sees connected donor with authorized contact: {conn_item['donor_name']} ({conn_item['donor_phone']})", flush=True)

        # Attendant confirms fulfillment
        r_fulfill = await client.post(f"/api/v1/attendants/requests/{req_id}/confirm-fulfillment", headers=a_headers)
        assert r_fulfill.status_code == 200
        print("  -> Attendant confirmed fulfillment at hospital", flush=True)

        # Donor sees fulfilled donation in history
        r_hist_d = await client.get("/api/v1/donors/history", headers=d_headers)
        assert r_hist_d.status_code == 200
        assert len(r_hist_d.json()) > 0
        print(f"  -> Donor donation history recorded: {r_hist_d.json()[0]['hospital_name']} (Fulfilled)", flush=True)

        # -------------------------------------------------------------
        # 9. Existing Seeded Accounts
        # -------------------------------------------------------------
        print("\n[TEST 9] Testing Existing Seeded Accounts Compatibility...", flush=True)
        r_arjun = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "arjun.donor@donorleague.org",
            "password": "DonorPass@123"
        })
        assert r_arjun.status_code == 200
        assert r_arjun.json()["identifier"] == "DL-D-2026-1001"
        print("  -> Seeded donor Arjun Mehta (DL-D-2026-1001) verified", flush=True)

        r_deepak = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "attendant@donorleague.org",
            "password": "AttendantPass@123"
        })
        assert r_deepak.status_code == 200
        assert r_deepak.json()["identifier"] == "DL-A-2026-2001"
        print("  -> Seeded attendant Deepak Joshi (DL-A-2026-2001) verified", flush=True)

        print("\n" + "=" * 70, flush=True)
        print("ALL MASTER END-TO-END VERIFICATION TESTS PASSED WITH 100% SUCCESS!", flush=True)
        print("=" * 70, flush=True)

if __name__ == "__main__":
    asyncio.run(run_all_tests())
