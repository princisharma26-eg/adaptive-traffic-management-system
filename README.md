# 🚦 Adaptive Traffic Management System

A traffic simulation platform designed to study, benchmark, and compare different traffic signal control strategies under varying traffic conditions.

## 🎯 Problem Statement

Traditional fixed-time traffic signals operate on predefined timings regardless of the actual traffic conditions on each road. This leads to unnecessary waiting at empty intersections, longer queues on congested approaches, and inefficient use of green signal time.

This platform simulates a realistic four-way intersection to evaluate dynamic, actuated, and adaptive signal control algorithms against baseline fixed-time controls.

---

## ✨ Features Overview

- **Four-Way Intersection Simulation**: Realistic 2D vector canvas rendering featuring dual-lane approaches, stop lines, zebra crosswalks, directional lane arrows, and corner signal heads with bloom lighting.
- **Dynamic Vehicle Kinematics**: Microscopic car-following model using the Intelligent Driver Model (IDM), realistic bumper-to-bumper spacing, deceleration at yellow/red lights, queue accumulation, and discharge acceleration.
- **Dual Signal Control Modes**:
  - **Fixed-Time Mode (Phase 1)**: Deterministic static cycle (30.0s North/South green, 30.0s East/West green, 3.0s yellow, 1.0s all-red clearance).
  - **Density-Based Mode (Phase 2)**: Dynamic queue-actuated signal control calculating real-time density per approach, granting priority to high-demand corridors, dynamically scaling green duration, and enforcing anti-starvation rules.
- **Dynamic Green Duration Allocation**: Green time is calculated dynamically as a function of the waiting queue:
  $$T_{green} = \text{clamp}(T_{min} + \text{queue} \times 2.5\text{s}, T_{min}, T_{max})$$
  with fully configurable minimum ($T_{min}$) and maximum ($T_{max}$) green limits.
- **Anti-Starvation Protection**: Approaches with waiting vehicles are guaranteed service even when opposing approaches have significantly heavier traffic demand.
- **Conflict Safety & Clearance**: Conflicting movements (North/South vs. East/West) never receive green signals concurrently. Transitions always enforce 3.0s Yellow and 1.0s All-Red clearance intervals.
- **Interactive Control Console**: Start, Pause, Reset, 1x/2x/5x speed multipliers, traffic arrival rate slider (8–48 vehicles/min), and directional surge injection (+N, +S, +E, +W) to test asymmetric traffic demand.
- **Real-Time Telemetry & Analytics**: Live tracking of queue length, total spawned vehicles, cleared vehicles, average wait times, max wait times, throughput (veh/min), and Jain's fairness index.
- **Full-Stack REST Architecture**: Synchronized state across Java Spring Boot backend and React + TypeScript + Canvas frontend.

---

## 🧠 Signal Control Strategies

### 1. Phase 1 — Fixed-Time Signal Control
Deterministic signal cycle where each corridor receives a static 30.0s green duration:
1. North/South $\rightarrow$ Green (30.0s)
2. North/South $\rightarrow$ Yellow (3.0s)
3. All-Red Clearance Interval 1 (1.0s)
4. East/West $\rightarrow$ Green (30.0s)
5. East/West $\rightarrow$ Yellow (3.0s)
6. All-Red Clearance Interval 2 (1.0s)
7. Total cycle: 68.0s (repeats continuously)

### 2. Phase 2 — Density-Based Adaptive Control
Actuated signal controller that responds in real time to waiting vehicles:
- **Dynamic Green Allocation Based on Queue Density**: Green duration dynamically scales with waiting queue length:
  $$T_{\text{green}} = \text{clamp}(T_{\text{min}} + \text{queue} \times 2.5\text{s}, T_{\text{min}}, T_{\text{max}})$$
- **10s–40s Green Bounds**: Default bounds strictly clamp green allocation between $T_{\text{min}} = 10.0\text{s}$ (minimum clearance for low traffic) and $T_{\text{max}} = 40.0\text{s}$ (maximum phase cap to prevent excessive delay).
- **Anti-Starvation Mechanism**: Approaching vehicles on lower-density roads are guaranteed service via starvation counters and a maximum consecutive green threshold ($\le 2$ consecutive cycles per corridor), preventing any corridor from being starved by heavy opposing traffic.
- **Surge Traffic Controls**: Interactive directional surge buttons (`+N`, `+S`, `+E`, `+W`) allow real-time injection of vehicles onto specific approaches to test dynamic adaptation under sudden asymmetric surges.
- **Real-Time Telemetry & Performance Metrics**: Background telemetry ingestion (`POST /api/simulation/telemetry`) and live analytics engine (`GET /api/analytics/live`) tracking queue lengths, vehicle throughput (veh/min), average and max wait times, and Jain's fairness index.
- **Automated Test Results**: **14/14 Automated Tests Passed** (`FixedTimeSignalAlgorithmTest`, `DensityBasedSignalAlgorithmTest`, `SimulationServiceTest`, `MetricsCalculatorTest`, `BackendApplicationTests`).


---

## 🏗️ System Architecture

```text
React 19 + TypeScript + Tailwind CSS Frontend
                ↓  (REST APIs / Telemetry)
      Spring Boot 4 (Java 26) Backend
                ↓
    Simulation & Signal Algorithms
    ├── FixedTimeSignalAlgorithm
    └── DensityBasedSignalAlgorithm
                ↓
         Metrics & Analytics
```

### Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, HTML5 Canvas, Vite, Lucide Icons
- **Backend**: Java 26, Spring Boot 4, Maven
- **Testing**: JUnit 5, Mockito, Automated Browser Subagent

---

## 🔌 API Endpoints

| Method | Endpoint | Purpose | Parameters / Payload |
|---|---|---|---|
| `GET` | `/api/simulation/config` | Retrieve current intersection & algorithm configuration | None |
| `POST` | `/api/simulation/config` | Update configuration, switch mode, adjust min/max green times | `IntersectionConfig` JSON |
| `GET` | `/api/simulation/signals` | Query authoritative signal states from active algorithm | `elapsedSeconds`, optional `northWaiting`, `southWaiting`, `eastWaiting`, `westWaiting` |
| `POST` | `/api/simulation/control` | Dispatch simulation control commands | `{ action: "START" \| "PAUSE" \| "RESET" \| "SET_SPEED", speedMultiplier?: number }` |
| `POST` | `/api/simulation/telemetry` | Send real-time telemetry snapshot to backend | `TelemetrySnapshot` JSON |
| `GET` | `/api/analytics/live` | Retrieve calculated live performance metrics | None |

---

## ▶️ Running the Application

### Option 1: Startup Script (Recommended)
```bash
./run.sh
```

### Option 2: Run via NPM from Root
```bash
npm run dev
# or
npm start
```

### Option 3: Run Independently
```bash
# Terminal 1: Backend
cd backend
mvn spring-boot:run

# Terminal 2: Frontend
cd frontend
npm run dev
```

- **Frontend UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8080](http://localhost:8080)

---

## 🧪 Testing Instructions

### Running Backend Automated Tests
The backend contains comprehensive automated unit and integration tests for both Phase 1 and Phase 2 algorithms:

```bash
cd backend
mvn test
```

Test suite coverage:
- **`FixedTimeSignalAlgorithmTest`**: Validates deterministic phase sequencing, yellow/all-red timing, and cycle repetition.
- **`DensityBasedSignalAlgorithmTest`**:
  - `testDynamicGreenDurationCalculation`: Validates formula scaling bounded by $T_{min}$ and $T_{max}$.
  - `testConflictSafety`: Exhaustive time-stepped check verifying conflicting approaches are never simultaneously active.
  - `testSafeClearanceTransitions`: Validates yellow and all-red clearance intervals before corridor changes.
  - `testPreventStarvation`: Verifies low-density waiting approaches are guaranteed green service.
  - `testCorridorDemandAllocation`: Verifies high-demand approaches receive extended green time.
- **`SimulationServiceTest`**: Validates seamless real-time switching between `FIXED_TIME` and `DENSITY_BASED` algorithm modes.
- **`MetricsCalculatorTest`**: Validates throughput, average waiting time, queue length, and fairness index calculations.

### Running Frontend Build & Type Check
```bash
cd frontend
npm run build
```

---

## 🚀 Development Roadmap

- [x] **Phase 1 — Fixed-Time Traffic Simulation**
- [x] **Phase 2 — Density-Based Signal Control**
- [ ] **Phase 3 — Adaptive Signal Control**
- [ ] **Phase 4 — Emergency Vehicle & Accident Scenarios**
- [ ] **Phase 5 — Algorithm Benchmarking & Performance Analysis**

---

## 📌 Project Status
**Current Status**: Phase 2 — Density-Based Signal Control implemented, fully tested, and verified.