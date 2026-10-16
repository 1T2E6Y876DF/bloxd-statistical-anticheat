[README.md](https://github.com/user-attachments/files/33541875/README.md)
# Bloxd.io Advanced Anti-Cheat System

A comprehensive server-side anti-cheat engine built for [Bloxd.io](https://bloxd.io) F8 worlds. Written in pure JavaScript with zero dependencies — designed to run inside Bloxd.io's world code editor.

## What It Detects

| Category | Detections |
|---|---|
| **Autoclickers** | Jitter analysis, CPS ceiling, static interval loops, zero fatigue, instant ramp, robotic consistency (CV), sustained speed windows |
| **Macros** | Burst detection (hardware macros), packet signature mirror, recycled pattern grid, timer grid lock, distribution uniformity |
| **Aimbot** | Hitbox variance lock, unnatural air lock, silent aim (packet deviation) |
| **KillAura** | Honeypot phantom entity interception |
| **Spinbot** | Helicopter rotation lock detection |
| **Movement** | Reach/hitbox expansion, anti-knockback, desync detection |
| **Mobile** | Multi-touch pattern exemption, drag click exemption, injection script detection |

## Detection Layers (12 Total)

The click analysis engine uses 12 statistical layers to distinguish humans from machines:

1. **Burst Detection** — 0-6ms gaps = hardware macro (Firekey etc.)
2. **Packet Signature Mirror** — Repeating delta patterns across clicks
3. **Jitter Analysis** — Missing micro-variations that human hands naturally produce
4. **Duplication Ratio** — Recycled interval values (>60% = macro)
5. **Shannon Entropy** — Too predictable (<0.25 = static loop)
6. **CPS Ceiling** — 28+ CPS with <6.0ms jitter = inhuman
7. **Timer Grid Lock** — Intervals snapping to fixed timer resolution
8. **Fatigue Ratio** — No muscle deceleration over time (first half vs second half)
9. **Ramp Detection** — No acceleration curve at click start
10. **Coefficient of Variation** — CV <0.10 at 26+ CPS = robotic consistency
11. **Sustained Speed** — 28+ CPS for 6 consecutive analysis windows
12. **Distribution Uniformity** — Intervals too evenly spread (flat vs clustered)

## False Positive Protection

- **Mobile players**: Multi-touch burst+recovery pattern detection exempts 10-finger mobile clickers
- **Drag clickers**: Vibration ratio analysis (micro-bursts 1-8ms mixed with recovery >15ms) exempts drag clicking
- **High ping**: Reach validation accounts for combined ping + movement speed
- **Airborne hits**: Hitbox variance only checks when attacker or victim is airborne
- **AFK shield**: Pure input-time based (clicks, chat, mouse look) — ignores position/knockback
- **Strike system**: Most checks require multiple violations before kicking (3-5 strikes)

## Security Features

- **Anti-hijack**: Obfuscated owner verification prevents code copying
- **Owner watchdog**: Auto self-destruct if owner leaves or code is copied
- **Persistent state**: Survives module context resets via global state anchoring
- **Spawn protection**: Configurable radius with owner bypass
- **Item drop lock**: Blocks all Q-drops to prevent item loss

## Configuration

All thresholds are in the `CONFIG` object at the top of the file:

```javascript
var CONFIG = {
    REACH_BASE: 4.8,           // Base reach distance (meters)
    REACH_HARD_CEILING: 5.4,   // Maximum allowed reach
    AFK_STILL_MS: 2000,        // Time before AFK shield activates
    CLICK_HISTORY_MAX: 30,     // Click samples to track
    SPAWN_PROTECT_RADIUS: 12,  // Spawn protection radius (blocks)
    // ... and more
};
```

## How to Use

1. Open your Bloxd.io F8 world
2. Open the code editor (F8)
3. Paste the contents of `bloxd_anticheat.js`
4. Change `TRUE_OWNER` to your username (or keep the obfuscated char codes)
5. Save and test

## Requirements

- Bloxd.io F8 world with code editor access
- No external dependencies — pure JavaScript
- Uses Bloxd.io API: `api.getEntityName()`, `api.getPosition()`, `api.kickPlayer()`, etc.

## Architecture

```
bloxd_anticheat.js
├── Persistent State System    (global state that survives resets)
├── Owner Verification         (anti-hijack + watchdog)
├── Click Analysis Engine      (12-layer macro/autoclicker detection)
├── Reach Validation           (distance + ping compensation)
├── Aimbot Detection           (hitbox variance + silent aim)
├── AFK Shield                 (input-time based protection)
├── Honeypot System            (phantom entities for KillAura)
├── Anti-Knockback             (kinematic movement verification)
└── Main Tick Loop             (periodic scanning + cleanup)
```

## Status

**Currently busy with studies.** If you find any bugs, comment on the issues page and I'll look into them when I'm free. Updates and bug fixes will come when I have time.

## License

MIT — Use it, modify it, share it. Just don't claim you built it from scratch.

## Credits

Built by **1T2E6Y876DF** (GitHub) / **1TZ_RE0** (In-Game) — first program, learn as you go.
