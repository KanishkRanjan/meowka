---

# 🚗 Vehicle Tracking System

A real-time and historical **vehicle tracking dashboard** built using **React.js**, **Leaflet.js**, and a custom **Node.js backend**. The system visualizes the movement of vehicles on a map, supports playback, filters, and detailed event timelines.

---

## 🔧 Features

### 🗺️ Map View with Live Route
- Displays historical or real-time paths of a vehicle.
- Color-coded speed visualization using **polylines**.
- Interactive speed tooltip at each coordinate.
- Custom vehicle markers with movement direction.

### ⏯ Playback Controls
- Play, pause, and adjust playback speed.
- Scrubber (timeline slider) to jump to any point in the trip.
- Smooth animation of vehicle movement along the path.

### 📅 Filter & Selection Panel
- Select vehicles from dropdowns.
- Date range filter to pick a trip interval.
- Vehicle/Trip ID selector.

### 🕓 Timeline & Event Viewer
- Shows event logs like "Start Trip", "Idle", "Stop", etc.
- Vertical scrollable timeline for easy tracking.
- Filter events by type (optional feature).

---

## 🧱 Tech Stack

| Frontend            | Backend                 | Database     |
|---------------------|--------------------------|--------------|
| React.js + Vite     | Node.js + Express        | MongoDB      |
| Leaflet.js          | WebSocket (for live data) |              |

---

## 🖥️ UI Preview

| View                  | Description                        |
|-----------------------|-------------------------------------|
| `Map View`            | Displays path + current speed       |
| `Playback Controls`   | Manage route animation              |
| `Filter Panel`        | Filter by vehicle/date              |
| `Timeline View`       | Event log with timestamps           |

---

## 📁 Project Structure (Frontend)

```
vehicle-tracking-frontend/
│
├── public/
├── src/
│   ├── components/
│   │   ├── MapView.jsx
│   │   ├── PlaybackControls.jsx
│   │   ├── Filters.jsx
│   │   ├── Timeline.jsx
│   ├── utils/
│   │   └── mapHelpers.js
│   ├── App.jsx
│   └── main.jsx
│
└── tailwind.config.js
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/vehicle-tracking-dashboard.git
cd vehicle-tracking-dashboard
```

### 2. Install Frontend Dependencies

```bash
cd vehicle-tracking-frontend
npm install
```

### 3. Run the Frontend App

```bash
npm run dev
```

### 4. Backend Setup (Optional)

If you're using your own backend:

- Clone and run your `Node.js + Express` backend
- Make sure it's serving location data from MongoDB or another DB
- Set `.env` or config for `API_BASE_URL` in frontend

---

## ⚙️ Environment Variables (Backend)

Create a `.env` file in the root:

```env
NODE_ENV=development
PORT=3000
MONGO_URI=your_mongo_url

```

---

## 📦 Data Format (Example)

```json
[
  {
    "timestamp": "2025-04-15T08:23:00Z",
    "lat": 26.842,
    "lng": 81.003,
    "speed": 23.5
  },
  ...
]
```

---

## 📌 TODO (Suggestions)

- [ ] Add clustering for multiple vehicles
- [ ] Auto-refresh for live tracking
- [ ] Export route as PDF/CSV
- [ ] Integrate alert system for sudden stops or over-speeding

---

## 📄 License

MIT © 2025 Vedansha Srivastava

---

## ✨ Author

Built with 💻, 🎨 and ☕ by **[Vedansha Srivastava](https://github.com/yourusername)**  
Feel free to connect for collaborations or contributions!
