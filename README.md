# 🚦 Adaptive Traffic Management System

A traffic simulation platform designed to study and compare different traffic signal control strategies under varying traffic conditions.

## 🎯 Problem Statement

Traditional fixed-time traffic signals operate on predefined timings regardless of the actual traffic conditions on each road. This can lead to unnecessary waiting, longer queues, and inefficient use of green signal time.

This project simulates a four-way intersection and provides a foundation for evaluating more dynamic traffic signal control strategies.

## ✨ Current Features

- Four-way traffic intersection simulation
- Dynamic vehicle spawning
- Fixed-time traffic signal control
- Realistic vehicle movement and spacing
- Red-light stopping and queue formation
- Live traffic statistics
- Signal countdown timers
- Simulation controls: Start, Pause, Reset and Speed
- Backend telemetry and analytics
- Automated backend tests

## 🧠 Current Implementation

### Phase 1 — Fixed-Time Signal Control

The current version uses a deterministic fixed-time signal cycle:

- North/South → Green
- Yellow transition
- All-red safety interval
- East/West → Green
- Yellow transition
- All-red safety interval
- Cycle repeats

The simulation collects real-time traffic data such as vehicle count, waiting vehicles, cleared vehicles, waiting time and throughput.

## 🏗️ System Architecture

```text
React + TypeScript Frontend
          ↓
      REST APIs
          ↓
Java + Spring Boot Backend
          ↓
Simulation & Signal Algorithms
          ↓
      Analytics


      Tech Stack
Frontend
React
TypeScript
Tailwind CSS
HTML Canvas
Vite
Backend
Java
Spring Boot
Maven
Other
REST API
Git / GitHub
📊 Traffic Metrics
The simulation tracks:
Total vehicles spawned
Currently waiting vehicles
Vehicles cleared
Average waiting time
Throughput
Queue-related telemetry
🔌 API Endpoints
Method	Endpoint	Purpose
GET	/api/simulation/config	Retrieve simulation configuration
GET	/api/simulation/signals	Retrieve current signal states
POST	/api/simulation/control	Control simulation state
POST	/api/simulation/telemetry	Send simulation telemetry
GET	/api/analytics/live	Retrieve live analytics
🚀 Development Roadmap
 Phase 1 — Fixed-Time Traffic Simulation
 Phase 2 — Density-Based Signal Control
 Phase 3 — Adaptive Signal Control
 Phase 4 — Emergency Vehicle & Accident Scenarios
 Phase 5 — Algorithm Benchmarking & Performance Analysis
📁 Project Structure
adaptive-traffic-management-system/
│
├── backend/
│   ├── src/
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── .gitignore
├── .gitattributes
└── README.md
📌 Project Status
Current Status: Phase 1 — Fixed-Time Traffic Simulation
The project is actively being developed. Future phases will introduce traffic-responsive signal control and comparative performance analysis.