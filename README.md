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

## 5. Seed Accounts for Quick Testing

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Donor** | Arjun Mehta | `arjun.donor@donorleague.org` | `DonorPass@123` | Blood Group: **O+**, Bangalore Central, Available |
| **Donor** | Priya Sharma | `priya.donor@donorleague.org` | `DonorPass@123` | Blood Group: **A+**, Richmond Town, Available |
| **Donor** | Karthik Nair | `karthik.donor@donorleague.org` | `DonorPass@123` | Blood Group: **B+**, Shivajinagar, Available |
| **Attendant** | Deepak Joshi | `attendant@donorleague.org` | `AttendantPass@123` | Registered Attendant, Bangalore |

Both roles can also be registered net-new from the respective registration pages (`/register/donor` and `/register/attendant`).
