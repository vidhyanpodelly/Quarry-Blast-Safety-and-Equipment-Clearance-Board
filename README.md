# Quarry Blast Safety and Equipment Clearance Board

A mobile-first dashboard designed to solve the life-critical coordination of heavy machinery and operators during quarry blasting. 

Quarry sites frequently suffer from intermittent network connectivity. This system provides a robust, fail-safe digital clipboard that tracks real-time clearances, prevents premature authorization, and fails closed in the event of any anomaly.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Run automated Playwright tests:**
   ```bash
   npx playwright test
   ```

## Architecture and Major Safety Decisions

### 1. Fail-Safe Engine Design
The safety engine is strictly designed to **FAIL CLOSED**. Blast authorization is impossible unless every known vehicle and operator explicitly resolves to a safe `CLEARED` status. If any entity is unaccounted for, unresolved, missing, or conflicting, the central engine instantly revokes the `isSafe` condition. The UI does not independently evaluate safety; it simply renders the strict verdict of the engine.

### 2. Unknown & Stale States
An `UNKNOWN` or `STALE` state means that an entity's physical whereabouts can no longer be actively verified (e.g. tracking telemetry is older than 5 minutes). The system NEVER assumes "it was safe 5 minutes ago, so it is safe now." A stale state represents an unverified reality, which immediately forces a `FAIL CLOSED` safety lock to prevent authorization.

### 3. Offline Queueing
Quarries operate with intermittent connectivity. Operations can continue via the offline queue. When offline, actions (like marking an operator as cleared) are sequentially stored in `localStorage` and applied optimistically to the offline device. The system cleanly queues these interactions and syncs them automatically upon network restoration.

### 4. Deterministic Conflict Resolution
If multiple devices emit conflicting statuses for an entity when reconnecting, the conflict is deterministically resolved towards the **safer** state. For example, if Device A says `CLEARED` and Device B says `RED_ZONE` (or `UNKNOWN`), the sync manager assigns a severity hierarchy where `RED_ZONE` overrides `CLEARED`. Any unresolved safety uncertainty results in a fail-closed lock.

### 5. Interactive Pit Coordinates & Red-Zone Detection
To eliminate human error with manual toggles, red-zone membership is dynamically calculated based on spatial data. The Pit Grid visualization is an interactive SVG surface where entities have concrete X/Y coordinates. Dragging an entity updates its coordinate in the state engine, and if those coordinates intersect the bounding box of the blast radius, the engine immediately registers a `RED_ZONE` violation. If this occurs during an active countdown, an automatic abort is triggered mid-drag.

### 6. Offline Visualization
The application uses a lightweight, open-source SVG coordinate mapping approach rather than a heavy paid mapping API (e.g., Google Maps). Because the layout and bounding boxes are mathematically defined and entirely local, the visual map renders perfectly and remains fully interactive even when a pit boss loses cellular signal deep inside the quarry.

## Deployment & Submission

This project represents the final submission prototype, having satisfied all structural requirements and adversarial E2E testing.
