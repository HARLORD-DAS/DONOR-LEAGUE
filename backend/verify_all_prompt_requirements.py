import asyncio
import httpx
import time
import os
import sys
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

async def run_master_verification():
    print("=" * 60)
    print("DONOR LEAGUE - MASTER VERIFICATION SUITE (TESTS A, B, C, D)")
    print("=" * 60)

    ts = int(time.time())
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
        # ---------------------------------------------------------
        # TEST A – New Donor Workflow
        # ---------------------------------------------------------
        print("\n>>> STARTING TEST A – New Donor Workflow")
        donor_email = f"donor_a_{ts}@donorleague.org"
        donor_phone = f"99{str(ts)[-8:]}"
        donor_pass = "DonorSecret@2026"

        # 1. Landing Page -> Sign Up -> Create Account
        print("  [A.1] Signing up as new user (POST /auth/signup)...")
        r_signup = await client.post("/api/v1/auth/signup", json={
            "full_name": "Ramesh Donor",
            "mobile_number": donor_phone,
            "email": donor_email,
            "password": donor_pass,
            "confirm_password": donor_pass
        })
        assert r_signup.status_code == 201, f"Signup failed: {r_signup.text}"
        signup_data = r_signup.json()
        assert signup_data["role"] == "pending", f"Expected role pending, got {signup_data['role']}"
        assert signup_data["profile_completed"] is False
        donor_token = signup_data["access_token"]
        donor_headers = {"Authorization": f"Bearer {donor_token}"}
        print("    -> Account created with role='pending'. Token issued.")

        # 2. Authenticated user selects role -> Donor
        print("  [A.2] Selecting role 'donor' (POST /auth/select-role)...")
        r_role = await client.post("/api/v1/auth/select-role", headers=donor_headers, json={"role": "donor"})
        assert r_role.status_code == 200
        if "access_token" in r_role.json():
            donor_token = r_role.json()["access_token"]
            donor_headers = {"Authorization": f"Bearer {donor_token}"}
        print("    -> Role permanently saved as 'donor'.")

        # 3. Complete Donor Registration (without re-entering credentials)
        print("  [A.3] Completing donor registration (POST /auth/complete-profile/donor)...")
        r_comp = await client.post("/api/v1/auth/complete-profile/donor", headers=donor_headers, json={
            "date_of_birth": "1994-06-12",
            "gender": "Male",
            "blood_group": "O+",
            "state": "Karnataka",
            "district": "Bengaluru Urban",
            "city": "Bengaluru",
            "area": "Jayanagar 4th Block",
            "residential_address": "12th Main Road, Jayanagar",
            "latitude": 12.9250,
            "longitude": 77.5938,
            "location_source": "osm_geocode",
            "whatsapp_consent": True,
            "sms_consent": True,
            "terms_consent": True
        })
        assert r_comp.status_code == 201, f"Donor profile completion failed: {r_comp.text}"
        comp_data = r_comp.json()
        assert comp_data["role"] == "donor"
        assert comp_data["profile_completed"] is True
        assert comp_data["identifier"].startswith("DL-D-")
        donor_id = comp_data["identifier"]
        print(f"    -> Success message verified! Donor ID: {donor_id}")

        # 4. Verify user can access Donor Dashboard info
        print("  [A.4] Verifying Donor Dashboard access (GET /donors/profile)...")
        r_prof = await client.get("/api/v1/donors/profile", headers=donor_headers)
        assert r_prof.status_code == 200
        assert r_prof.json()["donor_id"] == donor_id
        assert r_prof.json()["blood_group"] == "O+"
        print("    -> Donor profile retrieved successfully.")

        # 5. Logout & Sign In again
        print("  [A.5] Signing in again (POST /auth/login) with email...")
        r_login = await client.post("/api/v1/auth/login", json={
            "email_or_phone": donor_email,
            "password": donor_pass
        })
        assert r_login.status_code == 200
        login_data = r_login.json()
        assert login_data["role"] == "donor"
        assert login_data["profile_completed"] is True
        assert login_data["identifier"] == donor_id
        print("    -> Login automatically identified previously selected role: 'donor'. Direct to Donor Dashboard.")

        # ---------------------------------------------------------
        # TEST B – New Attender Workflow
        # ---------------------------------------------------------
        print("\n>>> STARTING TEST B – New Attender Workflow")
        att_email = f"attender_b_{ts}@donorleague.org"
        att_phone = f"98{str(ts)[-8:]}"
        att_pass = "AttenderSecret@2026"

        # 1. Sign Up
        print("  [B.1] Creating new account for attender (POST /auth/signup)...")
        r_signup_att = await client.post("/api/v1/auth/signup", json={
            "full_name": "Suresh Attender",
            "mobile_number": att_phone,
            "email": att_email,
            "password": att_pass,
            "confirm_password": att_pass
        })
        assert r_signup_att.status_code == 201
        att_token = r_signup_att.json()["access_token"]
        att_headers = {"Authorization": f"Bearer {att_token}"}
        print("    -> Account created with role='pending'.")

        # 2. Select Attender Role
        print("  [B.2] Selecting role 'attendant' (POST /auth/select-role)...")
        r_sel_att = await client.post("/api/v1/auth/select-role", headers=att_headers, json={"role": "attendant"})
        assert r_sel_att.status_code == 200
        if "access_token" in r_sel_att.json():
            att_token = r_sel_att.json()["access_token"]
            att_headers = {"Authorization": f"Bearer {att_token}"}
        print("    -> Role permanently saved as 'attendant'.")

        # 3. Complete Attender Registration
        print("  [B.3] Completing attender registration (POST /auth/complete-profile/attendant)...")
        r_att_comp = await client.post("/api/v1/auth/complete-profile/attendant", headers=att_headers, json={
            "city": "Bengaluru",
            "state": "Karnataka",
            "terms_consent": True
        })
        assert r_att_comp.status_code == 201
        att_comp_data = r_att_comp.json()
        assert att_comp_data["role"] == "attendant"
        assert att_comp_data["profile_completed"] is True
        assert att_comp_data["identifier"].startswith("DL-A-")
        att_id = att_comp_data["identifier"]
        print(f"    -> Attender profile registered! Identifier: {att_id}")

        # 4. Verify Attender Dashboard access
        print("  [B.4] Verifying Attender Dashboard access (GET /attendants/profile)...")
        r_att_prof = await client.get("/api/v1/attendants/profile", headers=att_headers)
        assert r_att_prof.status_code == 200
        assert r_att_prof.json()["attendant_id"] == att_id
        print("    -> Attender profile retrieved successfully.")

        # 5. Logout & Sign In again
        print("  [B.5] Signing in again (POST /auth/login) with mobile phone number...")
        r_att_login = await client.post("/api/v1/auth/login", json={
            "email_or_phone": att_phone,
            "password": att_pass
        })
        assert r_att_login.status_code == 200
        assert r_att_login.json()["role"] == "attendant"
        assert r_att_login.json()["profile_completed"] is True
        assert r_att_login.json()["identifier"] == att_id
        print("    -> Login automatically identified previously selected role: 'attendant'. Direct to Attender Dashboard.")

        # ---------------------------------------------------------
        # TEST C – Authentication Security & Cross-Role Access
        # ---------------------------------------------------------
        print("\n>>> STARTING TEST C – Authentication Security & Cross-Role Restrictions")

        # C.1 Unauthenticated donor registration
        print("  [C.1] Try donor registration without signing in...")
        r_unauth_donor = await client.post("/api/v1/auth/complete-profile/donor", json={
            "date_of_birth": "1990-01-01",
            "blood_group": "A+",
            "state": "Karnataka",
            "district": "Bengaluru Urban",
            "city": "Bengaluru",
            "residential_address": "Test St",
            "latitude": 12.97,
            "longitude": 77.59
        })
        assert r_unauth_donor.status_code == 401, f"Expected 401, got {r_unauth_donor.status_code}"
        print("    -> Rejected with 401 Unauthorized.")

        # C.2 Unauthenticated attender registration
        print("  [C.2] Try attender registration without signing in...")
        r_unauth_att = await client.post("/api/v1/auth/complete-profile/attendant", json={
            "city": "Bengaluru",
            "state": "Karnataka",
            "terms_consent": True
        })
        assert r_unauth_att.status_code == 401, f"Expected 401, got {r_unauth_att.status_code}"
        print("    -> Rejected with 401 Unauthorized.")

        # C.3 Attender account tries to access donor dashboard/operations
        print("  [C.3] Try accessing donor profile using attender account...")
        r_cross_donor = await client.get("/api/v1/donors/profile", headers=att_headers)
        assert r_cross_donor.status_code == 403, f"Expected 403, got {r_cross_donor.status_code}"
        print("    -> Rejected with 403 Forbidden.")

        # C.4 Donor account tries to access attender dashboard/operations
        print("  [C.4] Try accessing attender profile using donor account...")
        r_cross_att = await client.get("/api/v1/attendants/profile", headers=donor_headers)
        assert r_cross_att.status_code == 403, f"Expected 403, got {r_cross_att.status_code}"
        print("    -> Rejected with 403 Forbidden.")

        # C.5 Submitting role selection without authentication
        print("  [C.5] Try submitting role selection without token...")
        r_unauth_role = await client.post("/api/v1/auth/select-role", json={"role": "donor"})
        assert r_unauth_role.status_code == 401
        print("    -> Rejected with 401 Unauthorized.")

        # C.6 Try creating duplicate profile
        print("  [C.6] Try creating duplicate donor profile for already registered donor...")
        r_dup = await client.post("/api/v1/auth/complete-profile/donor", headers=donor_headers, json={
            "date_of_birth": "1994-06-12",
            "blood_group": "O+",
            "state": "Karnataka",
            "district": "Bengaluru Urban",
            "city": "Bengaluru",
            "residential_address": "Duplicate Address",
            "latitude": 12.9250,
            "longitude": 77.5938
        })
        assert r_dup.status_code == 400
        print("    -> Rejected with 400 Bad Request.")

        # C.7 Pending user cannot access donor or attender dashboard
        print("  [C.7] Pending user tries to access donor or attendant endpoints...")
        r_pending_user = await client.post("/api/v1/auth/signup", json={
            "full_name": "Pending User",
            "mobile_number": f"90{str(ts)[-8:]}",
            "email": f"pending_{ts}@example.com",
            "password": "Password@123",
            "confirm_password": "Password@123"
        })
        p_headers = {"Authorization": f"Bearer {r_pending_user.json()['access_token']}"}
        r_pend_don = await client.get("/api/v1/donors/profile", headers=p_headers)
        assert r_pend_don.status_code == 403
        r_pend_att = await client.get("/api/v1/attendants/profile", headers=p_headers)
        assert r_pend_att.status_code == 403
        print("    -> Pending user blocked from both donor and attendant dashboards (403).")

        # ---------------------------------------------------------
        # TEST D – Existing Accounts Compatibility
        # ---------------------------------------------------------
        print("\n>>> STARTING TEST D – Existing Accounts Compatibility")

        # D.1 Existing donor Arjun Mehta
        print("  [D.1] Logging in as existing donor Arjun Mehta...")
        r_arjun = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "arjun.donor@donorleague.org",
            "password": "DonorPass@123"
        })
        assert r_arjun.status_code == 200
        assert r_arjun.json()["role"] == "donor"
        assert r_arjun.json()["profile_completed"] is True
        assert r_arjun.json()["identifier"] == "DL-D-2026-1001"
        arjun_token = r_arjun.json()["access_token"]
        arjun_headers = {"Authorization": f"Bearer {arjun_token}"}
        
        # Verify Arjun's profile access
        r_arjun_prof = await client.get("/api/v1/donors/profile", headers=arjun_headers)
        assert r_arjun_prof.status_code == 200
        assert r_arjun_prof.json()["full_name"] == "Arjun Mehta"
        print("    -> Existing donor Arjun Mehta (DL-D-2026-1001) logged in and accessed dashboard.")

        # D.2 Existing attendant Deepak Joshi
        print("  [D.2] Logging in as existing attendant Deepak Joshi...")
        r_deepak = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "attendant@donorleague.org",
            "password": "AttendantPass@123"
        })
        assert r_deepak.status_code == 200
        assert r_deepak.json()["role"] == "attendant"
        assert r_deepak.json()["profile_completed"] is True
        assert r_deepak.json()["identifier"] == "DL-A-2026-2001"
        deepak_token = r_deepak.json()["access_token"]
        deepak_headers = {"Authorization": f"Bearer {deepak_token}"}

        # Verify Deepak's profile access
        r_deepak_prof = await client.get("/api/v1/attendants/profile", headers=deepak_headers)
        assert r_deepak_prof.status_code == 200
        assert r_deepak_prof.json()["name"] == "Deepak Joshi"
        print("    -> Existing attendant Deepak Joshi (DL-A-2026-2001) logged in and accessed dashboard.")

        print("\n" + "=" * 60)
        print("ALL TESTS (A, B, C, D) EXECUTED AND PASSED WITH 100% SUCCESS!")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_master_verification())
