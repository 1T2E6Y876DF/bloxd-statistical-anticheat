[README_COMMUNITY.md](https://github.com/user-attachments/files/33555607/README_COMMUNITY.md)
# Bloxd.io Anti-Cheat System - Community Edition

A comprehensive server-side anti-cheat engine for Bloxd.io F8 worlds with **ownership transfer** and **owner monitoring toggle** features.

## Community Edition Features

Unlike the standard version, the Community Edition:
- **No self-destruct** when owner leaves server (server continues running)
- **Ownership transfer**: `!changeowner [name]` - Transfer ownership to another player
- **Owner monitoring toggle**: 
  - `!owner on` - Enable anti-cheat monitoring for owner (flags them if they cheat)
  - `!owner off` - Disable monitoring (owner exempt from detection)
- **Status check**: `!status` - View current owner and monitoring status

## Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `!changeowner [name]` | Transfer ownership to another player | Current owner only |
| `!owner on` | Enable anti-cheat monitoring for owner | Owner only |
| `!owner off` | Disable monitoring (owner exempt) | Owner only |
| `!status` | View anti-cheat status and current owner | All players |

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

## Detection Systems (31 Total)

### Statistical Analysis Layers (21 Layers)

1. **Burst Detection** — 0-6ms gaps = hardware macro
2. **Packet Signature Mirror** — Repeating delta patterns (1.5ms tolerance)
3. **Jitter Analysis** — Missing micro-variations
4. **Duplication Ratio** — Recycled interval values (>60% = macro)
5. **Shannon Entropy** — Too predictable (<0.25 = static loop)
6. **CPS Ceiling** — 25+ CPS with <8.0ms jitter = inhuman (3 strikes)
7. **Timer Grid Lock** — Intervals snapping to fixed timer resolution
8. **Fatigue Ratio** — No muscle deceleration over time
9. **Ramp Detection** — No acceleration curve at click start
10. **Coefficient of Variation** — CV <0.15 at 24+ CPS = robotic consistency
11. **Sustained Speed** — 25+ CPS for 4 consecutive windows
12. **Distribution Uniformity** — Intervals too evenly spread
13. **Pattern Oscillation** — Detects sequence reversal (advanced randomizers)
14. **Cross-Session Fingerprinting** — Compares pattern DNA across sessions
15. **Cursor Shake Exemption** — Detects drag click vibration
16. **Dead Cursor Lock** — 20+ CPS with zero micro-shake = macro
17. **Curve Path Consistency** — Aimbot tracking produces identical curves
18. **KillAura Multi-Target Intercept** — Hitting 2+ targets within 100ms
19. **Target Switch Snap** — Instant target lock with 15°+ cursor snap
20. **Snap Rotation Without Tremor** — 150°+ instant rotation with zero shake
21. **Behind-Target Hit Intercept** — Hitting target at 90°+ angle without turning

### Combat Validation Systems (10 Additional Detections)

22. **Reach Validation** — Distance checking with ping compensation
23. **Hitbox Variance Lock** — Unnatural coordinate locking on airborne targets
24. **Silent Aim Detection** — Packet deviation analysis
25. **Spinbot Detection** — Helicopter rotation lock
26. **Anti-Knockback (Kinematic)** — Physics-based movement verification
27. **Desync Detection** — Position/timing mismatch detection
28. **Honeypot Phantom Entities** — Client-side invisible entities
29. **AFK Shield** — Input-time based protection
30. **Mobile Multi-Touch Detection** — Mobile input signature identification
31. **Injection Script Detection** — Zero synchronicity variance = app hack

## How to Use

1. Open your Bloxd.io F8 world
2. Open the code editor (F8)
3. Paste the contents of `bloxd_anticheat_community.js`
4. Change `TRUE_OWNER` to your username (or keep the obfuscated char codes)
5. Save and test

### Ownership Transfer Example

```
You: !changeowner Player123
System: ✅ Ownership transferred to: Player123
System: 👑 Server ownership transferred to Player123

Player123: !owner off
System: ✅ Owner monitoring DISABLED - You are now exempt from detection.

Player123: !owner on
System: ✅ Owner monitoring ENABLED - Anti-cheat will now monitor you.
```

## False Positive Protection

- **Mobile players**: Multi-touch burst+recovery pattern detection exempts 10-finger mobile clickers
- **Drag clickers**: Vibration ratio analysis exempts drag clicking even at 35+ CPS
- **High ping**: Reach validation accounts for combined ping + movement speed
- **Airborne hits**: Hitbox variance only checks when attacker or victim is airborne
- **AFK shield**: Pure input-time based protection
- **Strike system**: Most checks require 2-5 violations before kicking

## Configuration

All thresholds are in the `CONFIG` object at the top of the file. See code comments for detailed rationale.

## Requirements

- Bloxd.io F8 world with code editor access
- No external dependencies — pure JavaScript
- Uses Bloxd.io API: `api.getEntityName()`, `api.getPosition()`, `api.kickPlayer()`, etc.

## Development & Contributions

**This is my first ever software development project.** I had no prior programming experience before starting this anti-cheat system.

I used AI-assisted development as a learning tool:
- **AI Agent Collaboration**: Worked with AI to implement initial logic and syntax
- **Active Testing**: Personally tested every detection layer with real players using various input devices
- **Bug Discovery & Debugging**: Found edge cases and false positives through systematic testing, then debugged and fixed them
- **Logic Development**: When existing detection logic failed, I analyzed the root cause and developed new detection algorithms

This project demonstrates my ability to learn rapidly, work with modern tools, think systematically, debug effectively, and iterate based on real-world feedback.

See the [main anti-cheat repository](https://github.com/1T2E6Y876DF/bloxd-statistical-anticheat) for detailed problem-solving examples and lessons learned.

## Status

**Currently busy with studies.** If you find any bugs, comment on the issues page and I'll look into them when I'm free.

## License

MIT — Use it, modify it, share it. Just don't claim you built it from scratch.

## Credits

Built by **1T2E6Y876DF** (GitHub) / **1TZ_RE0** (In-Game) — first program, learn as you go.
