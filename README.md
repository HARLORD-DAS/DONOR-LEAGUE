# DONOR LEAGUE

**Location-Based Blood Donor Identification & Coordination Platform**  
*Powered by OpenStreetMap Geospatial Discovery, WhatsApp Business Cloud API, and Antigravity OpenStreetMap MCP.*

---

## 1. Architectural Overview

DONOR LEAGUE connects people coordinating patient blood requirements with suitable registered donors in nearby geographical locations. Driven by confirmed hospital coordinates from OpenStreetMap and real-time proximity calculation, the platform automates the end-to-end journey from blood request submission to confirmed fulfillment.

```
+-----------------------------------------------------------------------------------+
|                                 DONOR LEAGUE                                      |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ATTENDANT]                                                      [DONOR]         |
|       |                                                              |            |
|       v                                                              v            |
|  Create Blood Request                                          Register Profile   |
|  - Patient Info & Units                                        - Blood Group      |
|  - Hospital Search (OSM Nominatim)                             - Locality (OSM)   |
|  - Hospital Coordinates (Lat/Lon)                              - Availability     |
|       |                                                              |            |
|       +----------------------------+---------------------------------+            |
|                                    |                                              |
|                                    v                                              |
|                    +--------------------------------+                             |
|                    |   GEOGRAPHICAL MATCHING ENGINE |                             |
|                    |   - Hospital Coordinates       |                             |
|                    |   - Haversine Proximity Filter |                             |
|                    |   - Blood Group Compatibility  |                             |
|                    |   - Availability Toggle Check  |                             |
|                    +---------------+----------------+                             |
|                                    |                                              |
|                                    v                                              |
|                    +--------------------------------+                             |
|                    |   NOTIFICATION DISPATCH        |                             |
|                    |   - WhatsApp Cloud API Alert   |                             |
|                    |   - Emergency SMS Gateway      |                             |
|                    |   - Secure Review Link         |                             |
|                    +---------------+----------------+                             |
|                                    |                                              |
|                                    v                                              |
|                    +--------------------------------+                             |
|                    |   DONOR REVIEWS & ACCEPTS      |                             |
|                    +---------------+----------------+                             |
|                                    |                                              |
|                                    v                                              |
|                    +--------------------------------+                             |
|                    |   DONOR-ATTENDANT CONNECTION   |                             |
|                    |   - Authorized Contact Shared  |                             |
|                    |   - One-Tap Direct Calling     |                             |
|                    |   - Hospital Coordination      |                             |
|                    |   - Attendant Fulfillment Log  |                             |
|                    +--------------------------------+                             |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Leaflet for interactive maps, custom isometric 3D badge illustration system.
- **Backend**: Python 3.13, FastAPI, SQLAlchemy (asyncio), SQLite / PostgreSQL with PostGIS support, WebSockets for live status updates.
- **Geographical Services**:
  - **OpenStreetMap MCP**: Integrated in Antigravity for development assistance.
  - **Nominatim**: Production hospital and address geocoding & reverse geocoding with in-memory caching and compliance with OSM usage policies.
  - **Overpass API**: Vicinity hospital identification.
  - **OSRM**: Road routing and driving duration calculations.
  - **Leaflet**: Responsive map rendering with search radius circles and privacy-preserving approximate donor markers.
- **Notifications**:
  - **Meta WhatsApp Business Cloud API**: Official WhatsApp template alerts with secure review tokens.
  - **MSG91 Gateway**: Emergency SMS notification channel.
  - **Development Simulation Mode**: Instant local simulation with zero external API credentials required.
- **Two Strictly Enforced Roles**:
  - `DONOR`: Registration, availability toggle (`is_available`), incoming request review, accept/decline, donation history.
  - `ATTENDANT`: Request creation, OSM hospital geocoding, radius expansion (5km to 50km), real-time 13-stage request tracking, fulfillment confirmation.

---

## 3. OpenStreetMap MCP Setup in Antigravity

The OpenStreetMap MCP server repository (`https://github.com/jagan-shanmugam/open-streetmap-mcp`) has been configured and tested in Antigravity.

### MCP Configuration File
File location: `~/.gemini/config/mcp_config.json`

```json
{
  "mcpServers": {
    "open-streetmap": {
      "command": "uv",
      "args": ["tool", "run", "--with", "mcp<2", "osm-mcp-server"]
    }
  }
}
```

### Verified Tools Exposed by the MCP:
- `geocode_address`: Geocode natural language addresses to lat/lon.
- `reverse_geocode`: Translate coordinates to human-readable address.
- `find_nearby_places`: Search points of interest using OSM tags.
- `get_route_directions`: Road route and distance computation.
- `search_category`: Bounding box category spatial search.
- `suggest_meeting_point`: Compute geographic midpoints.
- `explore_area`: Overview of local amenities and facilities.
- `find_schools_nearby`, `find_ev_charging_stations`, `find_parking_facilities`.

*Note: The OpenStreetMap MCP assists the development agent, while the production web application connects directly to backend-compatible OpenStreetMap services.*

---

## 4. Running the Complete Application

### A. Start Backend (FastAPI)
```bash
cd backend
# Using the pre-installed virtual environment:
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Health Check: `http://127.0.0.1:8000/api/v1/health`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

### B. Start Frontend (Next.js)
```bash
cd frontend
npm run dev
```
- Frontend Web App: `http://localhost:3000`

---

## 5. Application Entry Flow & Role-Based Lifecycle

The redesigned entry architecture requires authentication before accessing role selection:

1. **First-Time User Flow**:
   - `Landing Page (/)` &rarr; `Sign Up (/signup)`: User enters Full Name, Mobile, Email, and Password. Account is created in `pending` state.
   - User is automatically authenticated &rarr; `Role Selection (/select-role)`: User selects between **DONOR** and **ATTENDER** via large interactive 3D cards. Role is permanently saved in the database.
   - Redirected to the corresponding registration form:
     - `/register/donor`: Prefilled with verified account details, collects blood group, DOB, and OSM location.
     - `/register/attendant`: Prefilled with verified account details, collects location city/state.
   - Profile completed &rarr; User is redirected to their dedicated dashboard (`/donor/dashboard` or `/attendant/dashboard`).

2. **Existing User Flow**:
   - `Landing Page (/)` &rarr; `Sign In (/login)`: User logs in using registered email or mobile number + password.
   - Backend automatically identifies user role and profile completion status:
     - `pending` role &rarr; `/select-role`
     - `donor` role with incomplete profile &rarr; `/register/donor`
     - `attendant` role with incomplete profile &rarr; `/register/attendant`
     - `donor` role with completed profile &rarr; `/donor/dashboard`
     - `attendant` role with completed profile &rarr; `/attendant/dashboard`
   - Users who have already selected their role are never asked to choose again.

---

## 6. Seed Accounts for Quick Testing

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Donor** | Arjun Mehta | `arjun.donor@donorleague.org` | `DonorPass@123` | Blood Group: **O+**, Bangalore Central, Available |
| **Donor** | Priya Sharma | `priya.donor@donorleague.org` | `DonorPass@123` | Blood Group: **A+**, Richmond Town, Available |
| **Donor** | Karthik Nair | `karthik.donor@donorleague.org` | `DonorPass@123` | Blood Group: **B+**, Shivajinagar, Available |
| **Attendant** | Deepak Joshi | `attendant@donorleague.org` | `AttendantPass@123` | Registered Attendant, Bangalore |

Both roles can also be created net-new via the new authentication and role selection workflow (`/signup` &rarr; `/select-role`).

---

## 7. Deployment Instructions

### Deploying the Frontend to Vercel

The frontend is a modern Next.js 14 application located in the `frontend/` directory.

#### Method 1: Git Integration (Recommended)
1. Push this repository to GitHub (e.g. `https://github.com/HARLORD-DAS/DONOR-LEAGUE`).
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"** &rarr; **"Import Git Repository"**.
3. Select `DONOR-LEAGUE`.
4. In the **Configure Project** screen:
   - **Framework Preset**: Next.js (auto-detected).
   - **Root Directory**: Click **Edit** and set it to `frontend`.
   - **Build Command**: `npm run build` (or `next build`).
   - **Output Directory**: `.next`.
   - **Environment Variables**:
     - `NEXT_PUBLIC_API_URL`: URL of your deployed FastAPI backend (e.g., `https://donor-league-api.onrender.com/api/v1`).
5. Click **Deploy**. Vercel will build and deploy the Next.js application to a high-speed global edge network.

#### Method 2: Vercel CLI
If deploying from your terminal:
```bash
cd frontend
npx vercel
```
Follow the interactive prompts:
- Link to existing project? **No**
- What's your project's name? **donor-league-frontend**
- In which directory is your code located? `./`
- Want to modify settings? **No**

### Deploying the Backend
The backend is a FastAPI application with async SQLite / PostgreSQL and WebSockets for real-time donor tracking:
- Deploy to platforms that support continuous Python services and WebSockets, such as **Render**, **Railway**, or **Fly.io**.
- In the platform's service settings:
  - **Build Command**: `pip install -r backend/requirements.txt`
  - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Set the resulting backend URL as `NEXT_PUBLIC_API_URL` in the Vercel project settings.

