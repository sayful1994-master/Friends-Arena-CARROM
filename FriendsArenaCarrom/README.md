# Friends Arena – Carrom (Android 2D Multiplayer)

[![Android Build Pipeline](https://github.com/sayful1994/FriendsArenaCarrom/actions/workflows/android-build.yml/badge.svg)](https://github.com/sayful1994/FriendsArenaCarrom/actions/workflows/android-build.yml)
**Package ID:** `com.friendsarena.carrom`  
**Game Engine:** Godot 4.3 Stable (GDScript 2.0)  
**Platform:** Android (Landscape, Touchscreen Optimized)  
**Creator & Architect:** Sayful Islam (`sayful1994@gmail.com`)  

---

## 🌟 Overview

**Friends Arena – Carrom** is a competitive, physics-accurate 2D Carrom board game for Android devices. Designed specifically for off-grid, zero-internet local multiplayer, it supports **Offline Wi-Fi / Hotspot**, **Android Wi-Fi Direct (P2P)**, and **Bluetooth Classic (RFCOMM)** sockets.

### Key Highlights
- **Realistic 2D Physics:** Continuous circle collision response, authentic mass ratio (Striker 15g vs Coin 5.5g), friction deceleration, wooden cushion bounce, and 4 corner pocket capture with suction.
- **Accurate Board Geometry:** Standard tournament Carrom dimensions, 9 White coins (10 pts), 9 Black coins (5 pts), 1 Red Queen (30 pts), center circle, quadrant arrows, and baseline foul zones.
- **Rules Engine:** Official Carrom rules including Striker fouls, Due penalties, Queen covering requirement (must pocket own coin in same or next shot), and turn management.
- **Multiplayer Suite:** Host-authoritative architecture with packet serialization, CRC validation, duplicate shot prevention, and state synchronization.
- **Automated CI/CD Pipeline:** Fully configured GitHub Actions workflow producing `FriendsArena-Carrom-debug.apk` with automated pre-build test validation.

---

## 🗂 Project Structure

```
FriendsArenaCarrom/
├── project.godot                     # Godot 4 engine configuration
├── export_presets.cfg                 # Android export preset & permissions
├── README.md                          # Full documentation & setup guide
├── scenes/
│   ├── main_menu.tscn                 # Home menu & mode picker
│   ├── carrom_board.tscn              # Board, coins & striker scene
│   ├── player_lobby.tscn              # Host/Join 2P and 4P lobby
│   ├── connection_screen.tscn         # Wi-Fi / P2P / Bluetooth selector
│   ├── pause_menu.tscn                # In-game pause modal
│   └── result_screen.tscn             # Victory ceremony & rematch
├── scripts/
│   ├── game_manager.gd                # Top-level state coordinator
│   ├── board_controller.gd            # Physics update & coin collisions
│   ├── striker_controller.gd          # Touch-and-drag baseline aiming
│   ├── coin_controller.gd             # White, Black & Queen coin logic
│   ├── physics_manager.gd             # Elastic momentum, friction & pockets
│   ├── rules_engine.gd                # Foul detection, queen cover & points
│   ├── turn_manager.gd                # 2P & 4P turn progression
│   ├── scoring_manager.gd             # Match scores & foul deductions
│   └── network/
│       ├── network_manager.gd         # Coordinator for all transports
│       ├── message_protocol.gd        # Packet serialization & framing
│       ├── wifi_transport.gd          # TCP/UDP Wi-Fi & Hotspot sockets
│       ├── wifi_direct_bridge.gd      # Android Wi-Fi Direct P2P bridge
│       └── bluetooth_bridge.gd        # Android Bluetooth RFCOMM bridge
├── android/
│   └── plugins/
│       ├── wifi_direct/               # Android Native P2P plugin (Java)
│       └── bluetooth/                 # Android Native Bluetooth plugin (Java)
├── tests/
│   ├── run_tests.gd                   # Headless CI test runner
│   ├── test_rules.gd                  # Rules & foul tests
│   ├── test_scoring.gd                # Score & coin tests
│   ├── test_turns.gd                  # Turn progression tests
│   └── test_protocol.gd               # Network packet framing tests
└── .github/
    └── workflows/
        └── android-build.yml          # GitHub Actions APK builder
```

---

## 🚀 How to Build the Android APK via GitHub Actions

1. **Create a GitHub Repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Friends Arena - Carrom"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/friends-arena-carrom.git
   git push -u origin main
   ```

2. **Trigger the Workflow:**
   - Go to your GitHub repository -> **Actions** tab.
   - Select **Android APK Build Pipeline** on the left.
   - Click **Run workflow** (or simply push to `main`).

3. **Download Your APK:**
   - When the workflow completes (approx. 3-4 minutes), click on the completed run.
   - Scroll down to the **Artifacts** section.
   - Click on **FriendsArena-Carrom-debug-apk** to download your ready-to-install `FriendsArena-Carrom-debug.apk`!

---

## 🛠 Local CLI Build Instructions (Godot 4.3)

Ensure you have Godot 4.3 and Android SDK 34 installed:

```bash
# 1. Run automated tests headlessly
godot --headless --script tests/run_tests.gd --path FriendsArenaCarrom

# 2. Export debug APK
mkdir -p FriendsArenaCarrom/build
godot --headless --export-debug "Android" build/FriendsArena-Carrom-debug.apk --path FriendsArenaCarrom
```

---

## 📶 Networking Implementation Status

| Feature | Protocol | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Wi-Fi / Hotspot** | TCP Socket (Port 7777) |  **Implemented & Ready** | Instant connection via Host IP / Port |
| **Local Practice** | Local Physics Loop |  **Implemented & Ready** | Solo aiming & angle training |
| **2-Player Mode** | Host-Authoritative |  **Implemented & Ready** | White vs Black |
| **4-Player Mode** | Host-Authoritative |  **Implemented & Ready** | 2v2 Teams (North/South vs East/West) |
| **Wi-Fi Direct (P2P)** | Android `WifiP2pManager` |  **Bridge & Plugin Ready** | Requires physical Android devices with Wi-Fi Direct hardware |
| **Bluetooth Classic** | RFCOMM SPP Socket |  **Bridge & Plugin Ready** | Requires physical Android devices with Bluetooth Classic pairing |

---

## 👤 Credits

- **Sayful Islam** — Project Architect, Physics & Multiplayer Engineering.
