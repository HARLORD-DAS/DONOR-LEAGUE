import asyncio
import httpx
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

async def test_auth_workflow():
    print("==================================================")
    print("TESTING REDESIGNED AUTHENTICATION & ROLE SELECTION")
    print("==================================================")

    ts = int(datetime.now().timestamp())
    test_donor_email = f"newdonor_{ts}@example.com"
    test_donor_phone = f"98{str(ts)[-8:]}"
    test_pass = "SecurePass@123"

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
        # 1. Public Signup - Donor Candidate
        print("\n[1] Testing User Sign Up (POST /api/v1/auth/signup)...")
        r = await client.post("/api/v1/auth/signup", json={
            "full_name": "Test Donor Candidate",
            "mobile_number": test_donor_phone,
            "email": test_donor_email,
            "password": test_pass,
            "confirm_password": test_pass
        })
        assert r.status_code == 201, f"Signup failed: {r.text}"
        data = r.json()
        assert data["role"] == "pending", f"Expected role pending, got {data['role']}"
        assert data["profile_completed"] is False
        donor_token = data["access_token"]
        donor_headers = {"Authorization": f"Bearer {donor_token}"}
        print("  -> Sign up successful! Role is 'pending', Profile completed: False")

        # 2. Duplicate Validation
        print("\n[2] Testing Duplicate Email and Phone Registration Prevention...")
        r_dup_email = await client.post("/api/v1/auth/signup", json={
            "full_name": "Another Person",
            "mobile_number": "9112233445",
            "email": test_donor_email,
            "password": test_pass,
            "confirm_password": test_pass
        })
        assert r_dup_email.status_code == 400
        print("  -> Duplicate email blocked correctly (400).")

        r_dup_phone = await client.post("/api/v1/auth/signup", json={
            "full_name": "Another Person",
            "mobile_number": test_donor_phone,
            "email": f"unique_{ts}@example.com",
            "password": test_pass,
            "confirm_password": test_pass
        })
        assert r_dup_phone.status_code == 400
        print("  -> Duplicate phone blocked correctly (400).")

        # 3. Password mismatch validation
        r_pw_mismatch = await client.post("/api/v1/auth/signup", json={
            "full_name": "Mismatch Tester",
            "mobile_number": "9998887776",
            "email": f"mismatch_{ts}@example.com",
            "password": "Password123",
            "confirm_password": "DifferentPassword123"
        })
        assert r_pw_mismatch.status_code == 400
        print("  -> Password mismatch blocked correctly (400).")

        # 4. Check Current User before role selection
        print("\n[3] Testing GET /api/v1/auth/me for pending user...")
        r = await client.get("/api/v1/auth/me", headers=donor_headers)
        assert r.status_code == 200
        me_data = r.json()
        assert me_data["role"] == "pending"
        assert me_data["profile_completed"] is False
        print(f"  -> GET /auth/me verified: Role={me_data['role']}, ProfileCompleted={me_data['profile_completed']}")

        # 5. Role Selection without auth
        print("\n[4] Testing Role Selection Security (Unauthorized access)...")
        r_unauth = await client.post("/api/v1/auth/select-role", json={"role": "donor"})
        assert r_unauth.status_code == 401
        print("  -> Unauthenticated role selection rejected (401).")

        # 6. Authenticated Role Selection -> Donor
        print("\n[5] Selecting Role as 'donor'...")
        r = await client.post("/api/v1/auth/select-role", headers=donor_headers, json={"role": "donor"})
        assert r.status_code == 200
        assert r.json()["role"] == "donor"
        print("  -> Role set to 'donor' successfully.")

        # Refresh token / headers with new role
        if "access_token" in r.json():
            donor_token = r.json()["access_token"]
            donor_headers = {"Authorization": f"Bearer {donor_token}"}

        # 7. Prevent repeated role changes
        print("\n[6] Verifying Role Immutability (Cannot switch from donor to attendant)...")
        r_change = await client.post("/api/v1/auth/select-role", headers=donor_headers, json={"role": "attendant"})
        assert r_change.status_code == 400
        print("  -> Tampering/changing role blocked correctly (400).")

        # 8. Prevent cross-role profile completion (Donor trying to complete attendant profile)
        print("\n[7] Testing Cross-Role Prevention (Donor account completing attendant profile)...")
        r_wrong_prof = await client.post("/api/v1/auth/complete-profile/attendant", headers=donor_headers, json={
            "city": "Bengaluru",
            "state": "Karnataka",
            "terms_consent": True
        })
        assert r_wrong_prof.status_code == 403
        print("  -> Cross-role profile creation blocked correctly (403).")

        # 9. Complete Donor Profile
        print("\n[8] Completing Donor Profile (POST /api/v1/auth/complete-profile/donor)...")
        r_donor_prof = await client.post("/api/v1/auth/complete-profile/donor", headers=donor_headers, json={
            "date_of_birth": "1997-08-20",
            "gender": "Male",
            "blood_group": "B+",
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
        assert r_donor_prof.status_code == 201
        prof_res = r_donor_prof.json()
        assert prof_res["role"] == "donor"
        assert prof_res["profile_completed"] is True
        assert prof_res["identifier"].startswith("DL-D-")
        donor_id_generated = prof_res["identifier"]
        print(f"  -> Donor profile completed! Generated ID: {donor_id_generated}")

        # 10. Prevent Duplicate Profile Creation
        print("\n[9] Preventing Duplicate Donor Profile Creation...")
        r_dup_prof = await client.post("/api/v1/auth/complete-profile/donor", headers=donor_headers, json={
            "date_of_birth": "1997-08-20",
            "blood_group": "B+",
            "state": "Karnataka",
            "district": "Bengaluru Urban",
            "city": "Bengaluru",
            "residential_address": "Duplicate Address",
            "latitude": 12.9352,
            "longitude": 77.6245,
            "terms_consent": True
        })
        assert r_dup_prof.status_code == 400
        print("  -> Duplicate profile creation blocked correctly (400).")

        # 11. Check GET /auth/me after donor profile completion
        print("\n[10] Testing GET /api/v1/auth/me after completion...")
        r = await client.get("/api/v1/auth/me", headers=donor_headers)
        assert r.status_code == 200
        me = r.json()
        assert me["role"] == "donor"
        assert me["profile_completed"] is True
        assert me["donor_profile"]["blood_group"] == "B+"
        print("  -> Profile verified: Donor ID =", me["donor_profile"]["donor_id"])

        # 12. Login as newly registered donor using email
        print("\n[11] Logging in as newly registered donor (email)...")
        r_login_email = await client.post("/api/v1/auth/login", json={
            "email_or_phone": test_donor_email,
            "password": test_pass
        })
        assert r_login_email.status_code == 200
        assert r_login_email.json()["profile_completed"] is True
        assert r_login_email.json()["role"] == "donor"
        print("  -> Login via email succeeded. Role: donor, Completed: True")

        # 13. Login as newly registered donor using phone
        print("\n[12] Logging in as newly registered donor (phone)...")
        r_login_phone = await client.post("/api/v1/auth/login", json={
            "email_or_phone": test_donor_phone,
            "password": test_pass
        })
        assert r_login_phone.status_code == 200
        assert r_login_phone.json()["profile_completed"] is True
        assert r_login_phone.json()["identifier"] == donor_id_generated
        print("  -> Login via phone number succeeded!")

        # 14. Full Attender Workflow (Signup -> Pending -> Select Attendant -> Complete Profile -> Login)
        print("\n[13] Testing Complete Attender Workflow...")
        test_att_email = f"newatt_{ts}@example.com"
        test_att_phone = f"97{str(ts)[-8:]}"
        
        # Signup
        r_att_signup = await client.post("/api/v1/auth/signup", json={
            "full_name": "Test Attender Candidate",
            "mobile_number": test_att_phone,
            "email": test_att_email,
            "password": test_pass,
            "confirm_password": test_pass
        })
        assert r_att_signup.status_code == 201
        att_token = r_att_signup.json()["access_token"]
        att_headers = {"Authorization": f"Bearer {att_token}"}
        assert r_att_signup.json()["role"] == "pending"

        # Select Attendant Role
        r_sel_att = await client.post("/api/v1/auth/select-role", headers=att_headers, json={"role": "attendant"})
        assert r_sel_att.status_code == 200
        if "access_token" in r_sel_att.json():
            att_headers = {"Authorization": f"Bearer {r_sel_att.json()['access_token']}"}

        # Prevent attendant from creating donor profile
        r_att_bad_prof = await client.post("/api/v1/auth/complete-profile/donor", headers=att_headers, json={
            "date_of_birth": "1990-01-01",
            "blood_group": "O+",
            "state": "Karnataka",
            "district": "Bengaluru Urban",
            "city": "Bengaluru",
            "residential_address": "Test St",
            "latitude": 12.97,
            "longitude": 77.59
        })
        assert r_att_bad_prof.status_code == 403
        print("  -> Attendant account blocked from donor profile creation (403).")

        # Complete Attendant Profile
        r_att_prof = await client.post("/api/v1/auth/complete-profile/attendant", headers=att_headers, json={
            "city": "Bengaluru",
            "state": "Karnataka",
            "terms_consent": True
        })
        assert r_att_prof.status_code == 201
        att_prof_res = r_att_prof.json()
        assert att_prof_res["role"] == "attendant"
        assert att_prof_res["profile_completed"] is True
        assert att_prof_res["identifier"].startswith("DL-A-")
        print(f"  -> Attendant profile completed! ID: {att_prof_res['identifier']}")

        # Attendant Login
        r_att_login = await client.post("/api/v1/auth/login", json={
            "email_or_phone": test_att_email,
            "password": test_pass
        })
        assert r_att_login.status_code == 200
        assert r_att_login.json()["role"] == "attendant"
        assert r_att_login.json()["profile_completed"] is True
        print("  -> Attendant login verified.")

        # 15. Verify existing seeded accounts still log in
        print("\n[14] Verifying Compatibility with Existing Accounts...")
        r_exist_donor = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "arjun.donor@donorleague.org",
            "password": "DonorPass@123"
        })
        assert r_exist_donor.status_code == 200
        assert r_exist_donor.json()["role"] == "donor"
        assert r_exist_donor.json()["profile_completed"] is True
        print("  -> Existing donor Arjun Mehta logged in successfully.")

        r_exist_att = await client.post("/api/v1/auth/login", json={
            "email_or_phone": "attendant@donorleague.org",
            "password": "AttendantPass@123"
        })
        assert r_exist_att.status_code == 200
        assert r_exist_att.json()["role"] == "attendant"
        assert r_exist_att.json()["profile_completed"] is True
        print("  -> Existing attendant Deepak Joshi logged in successfully.")

    print("\n==================================================")
    print("ALL REDESIGNED AUTH WORKFLOW TESTS PASSED 100%!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_auth_workflow())
