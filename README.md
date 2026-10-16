[README.md](https://github.com/user-attachments/files/33551573/README.md)
# Bloxd.io Advanced Anti-Cheat System

A comprehensive server-side anti-cheat engine built for [Bloxd.io](https://bloxd.io) F8 worlds. Written in pure JavaScript with zero dependencies — designed to run inside Bloxd.io's world code editor.

## What It Detects

| Category | Detections |
|---|---|
| **Autoclickers** | Jitter analysis, CPS ceiling, static interval loops, zero fatigue, instant ramp, robotic consistency (CV), sustained speed windows, dead cursor lock |
| **Macros** | Burst detection (hardware macros), packet signature mirror, recycled pattern grid, timer grid lock, distribution uniformity, pattern oscillation, cross-session fingerprinting |
| **Aimbot** | Hitbox variance lock, unnatural air lock, silent aim (packet deviation), curve path consistency, target switch snap, snap rotation without tremor |
| **KillAura** | Honeypot phantom entity interception, multi-target simultaneous hit detection, behind-target hit without turning |
| **Spinbot** | Helicopter rotation lock detection |
| **Movement** | Reach/hitbox expansion, anti-knockback, desync detection |
| **Mobile** | Multi-touch pattern exemption, drag click exemption, injection script detection |

## Detection Layers (21 Total)

The click analysis engine uses 21 statistical layers to distinguish humans from machines:

1. **Burst Detection** — 0-6ms gaps = hardware macro (Firekey etc.)
2. **Packet Signature Mirror** — Repeating delta patterns across clicks (1.5ms tolerance)
3. **Jitter Analysis** — Missing micro-variations that human hands naturally produce
4. **Duplication Ratio** — Recycled interval values (>60% = macro)
5. **Shannon Entropy** — Too predictable (<0.25 = static loop)
6. **CPS Ceiling** — 25+ CPS with <8.0ms jitter = inhuman (3 strikes)
7. **Timer Grid Lock** — Intervals snapping to fixed timer resolution
8. **Fatigue Ratio** — No muscle deceleration over time (first half vs second half)
9. **Ramp Detection** — No acceleration curve at click start
10. **Coefficient of Variation** — CV <0.15 at 24+ CPS = robotic consistency
11. **Sustained Speed** — 25+ CPS for 4 consecutive analysis windows
12. **Distribution Uniformity** — Intervals too evenly spread (flat vs clustered)
13. **Pattern Oscillation** — Detects sequence reversal (4-5-6-7 → 7-6-5-4) used by advanced randomizers
14. **Cross-Session Fingerprinting** — Compares pattern DNA across sessions to catch transformed randomizers (multiplication, division, exponential)
15. **Cursor Shake Exemption** — Detects drag click vibration to exempt legit players
16. **Dead Cursor Lock** — 20+ CPS with moving cursor but zero micro-shake = macro (human hand always trembles)
17. **Curve Path Consistency** — Aimbot tracking produces mathematically identical curves when following strafing targets; human hands produce unique curves with micro-variations (85%+ similarity across tracking arcs = aimbot)
18. **KillAura Multi-Target Intercept** — Hitting 2+ different targets within 100ms = killaura (human can only aim at one target at a time)
19. **Target Switch Snap** — Instant target lock with 15°+ cursor snap when switching targets during multi-target chase; human tracking has smooth transition lag
20. **Snap Rotation Without Tremor** — 150°+ instant rotation with zero cursor micro-shake = aimbot (human hand always trembles during fast rotation); exempts mobile, accounts for ping/airborne desync
21. **Behind-Target Hit Intercept** — Hitting target at 90°+ angle (behind player) without turning = killaura; exempts 3rd person POV, mobile, accounts for ping buffer and airborne state

## Advanced Randomizer Detection

This system catches advanced macros that randomize click intervals:

- **Pattern Oscillation**: Detects when intervals reverse direction (up-down-up-down) — a signature of machine-generated sequences
- **Cross-Session Fingerprinting**: Even if the randomizer transforms values (12-13-14 → 24-26-28 via doubling), the underlying ratio pattern stays the same. We store a fingerprint and compare across sessions.
- **Cursor Smoothness**: At 20+ CPS, a human aiming always has micro-tremor. A macro is perfectly smooth. We detect this.

## False Positive Protection

- **Mobile players**: Multi-touch burst+recovery pattern detection exempts 10-finger mobile clickers
- **Drag clickers**: Vibration ratio analysis (micro-bursts 1-8ms mixed with recovery >15ms) + cursor shake detection exempts drag clicking even at 35+ CPS
- **High ping**: Reach validation accounts for combined ping + movement speed
- **Airborne hits**: Hitbox variance only checks when attacker or victim is airborne
- **AFK shield**: Pure input-time based (clicks, chat, mouse look) — ignores position/knockback
- **Strike system**: Most checks require multiple violations before kicking (2-5 strikes)

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
├── Persistent State System         (global state that survives resets)
├── Owner Verification              (anti-hijack + watchdog)
├── Click Analysis Engine           (16-layer macro/autoclicker detection)
│   ├── Statistical Analysis        (CV, entropy, fatigue, uniformity)
│   ├── Pattern Recognition         (oscillation, fingerprinting)
│   └── Cursor Analysis             (shake detection, smoothness check)
├── Reach Validation                (distance + ping compensation)
├── Aimbot Detection                (hitbox variance + silent aim + curve path + target switch + snap rotation)
├── AFK Shield                      (input-time based protection)
├── Honeypot System                 (phantom entities for KillAura)
├── KillAura Detection              (multi-target simultaneous hit + behind-target intercept)
├── Anti-Knockback                  (kinematic movement verification)
└── Main Tick Loop                  (periodic scanning + cleanup)
```

## Lessons Learned

Building this anti-cheat system taught me deep insights into hardware limitations, network physics, and human-computer interaction:

### Hardware Limitations & Input Device Physics

**Mouse Sensor Technology:**
- Most gaming mice report at 125-1000Hz polling rates (1-8ms between reports)
- Optical sensors have inherent jitter (2-15ms) due to surface texture sampling
- Laser mice produce less jitter than optical, affecting detection thresholds
- Logitech M240 (standard office mouse) produces 3-8ms jitter, while gaming mice produce 2-5ms

**Human Motor Control:**
- Muscle tremor produces micro-variations in click timing (neural signal noise)
- Fatigue modeling: Humans slow down over time (first half CPS > second half CPS)
- Drag clicking exploits mouse vibration against surface, producing 1-8ms micro-bursts mixed with >15ms recovery periods
- Maximum legitimate CPS: ~20 CPS for butterfly clicking, 30-40 CPS for drag clicking (with proper technique)

**Mobile Touch Input:**
- Multi-touch produces burst+recovery patterns (touch-down/touch-up curves)
- Touch sampling rate: 60-120Hz (8-16ms between samples)
- Synchronicity variance near zero (hardware-level timing precision)
- Must exempt mobile players from certain checks to avoid false positives

### Network Packet Delivery & Latency

**Ping Compensation:**
- Players with 100-200ms ping experience position desync
- Reach validation must account for ping: `reachBuffer = min(ping/1000 * movementSpeed, 0.6m)`
- Silent aim detection uses dynamic ceiling: `deflection + min(pingBuffer, 30°)`
- High ping players (>150ms) get relaxed thresholds for rotation-based checks

**Server-Side vs Client-Side:**
- All analysis runs server-side to prevent client-side tampering
- Bloxd.io API provides server-authoritative position/facing data
- Client-side prediction errors compound with network latency
- Honeypot phantom entities are client-side only (invisible to legit players)

**Packet Timing Analysis:**
- Click intervals measured server-side include network jitter
- Must distinguish between "macro produced 0ms gap" vs "network dropped a packet"
- Timer grid lock detection: Intervals snapping to fixed resolution (16ms, 33ms) indicate software timers

### Input Device Discrepancies & Edge Cases

**False Positive Scenarios Encountered:**
1. **Logitech M240 users**: Packet signature mirror had 0.1ms tolerance (too tight). Fixed by raising to 1.5ms and adding 15+ CPS floor.
2. **Drag clickers at 35+ CPS**: Initially flagged as macros. Fixed by adding cursor shake exemption (vibration produces micro-tremor) and drag click vibration ratio analysis.
3. **3rd person POV players**: Can see/aim at angles >90° without turning. Fixed by adding mobile exemption and ping buffer to behind-target hit detection.
4. **Airborne combat**: Position desync causes false reach violations. Fixed by adding airborne state validation to all angle-based checks.

**Strike-Based Escalation:**
- Single violations can occur due to edge cases (network spike, unusual input)
- Most checks require 2-5 strikes before kicking
- Strike decay: Strikes reduce by 0.1-0.2 per analysis window to account for changing conditions
- This prevents false bans while still catching persistent cheaters

### Systems-Level Thinking

**Multi-Layer Detection:**
- No single metric can distinguish human from machine with 100% accuracy
- Combining 21 independent layers creates a statistical fingerprint
- Each layer has different false positive/negative tradeoffs
- Layers complement each other: cursor analysis catches what click analysis misses

**Adversarial Machine Learning:**
- Advanced randomizers transform patterns (12-13-14 → 24-26-28 via doubling)
- Cross-session fingerprinting compares ratio patterns, not absolute values
- Pattern oscillation detection catches sequence reversal (4-5-6-7 → 7-6-5-4)
- Curve path consistency catches aimbots that vary click timing but produce perfect tracking curves

**Performance Constraints:**
- Bloxd.io code editor has execution time limits
- Must optimize for O(n) complexity where possible
- State cleanup in main tick loop prevents memory leaks
- Defensive initialization (`|| {}`) prevents data loss on context reset

## Status

**Currently busy with studies.** If you find any bugs, comment on the issues page and I'll look into them when I'm free. Updates and bug fixes will come when I have time.

## License

MIT — Use it, modify it, share it. Just don't claim you built it from scratch.

## Credits

Built by **1T2E6Y876DF** (GitHub) / **1TZ_RE0** (In-Game) — first program, learn as you go.
