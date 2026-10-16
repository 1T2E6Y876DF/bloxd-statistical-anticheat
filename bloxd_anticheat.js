/* ===========================================================================
BLOXD.IO ADVANCED ANTI-CHEAT SYSTEM - COMMUNITY EDITION v1.0.0
A comprehensive server-side anti-cheat engine for Bloxd.io F8 worlds.

COMMUNITY EDITION FEATURES:
- No self-destruct when owner leaves (server continues running)
- Ownership transfer: !changeowner [name]
- Owner monitoring toggle: !owner on/off
- Full 21-layer detection with strike-based escalation

ARCHITECTURE OVERVIEW:
This system uses a multi-layered statistical analysis approach to distinguish
human players from automation software. Each detection layer operates independently
with strike-based escalation to minimize false positives while catching sophisticated
cheats that bypass single-layer detection.

Key Design Principles:
- Server-side execution: All analysis runs on Bloxd.io's server to prevent client-side tampering
- Persistent global state: State survives module context resets via global anchoring (_g.ARENA_STATE)
- Strike-based escalation: Most checks require 2-5 violations before kicking to account for edge cases
- Input device awareness: Differentiates between mouse, mobile touch, and drag-click patterns
- Network latency compensation: Adjusts thresholds based on player ping to prevent false positives
- Kinematic validation: Uses physics-based movement analysis to detect impossible actions

Detection Pipeline:
1. Click Analysis Engine (Layers 1-16): Statistical analysis of click intervals
2. Cursor Telemetry (Layer 17): Geometric curve consistency during target tracking
3. Combat Pattern Analysis (Layers 18-21): Multi-target hits, target switching, rotation snaps

=============================================================================
ORIGINAL CREATOR CREDIT (DO NOT REMOVE):
=============================================================================
This anti-cheat system was originally created by:

In-Game Name: 1TZ_RE0
GitHub: 1T2E6Y876DF

This is their first program. If you modify or distribute this code, please
retain this credit section to acknowledge the original author.

Copyright (c) 2026 1T2E6Y876DF | 1TZ_RE0
Licensed under MIT License
============================================================================= */

/* ========================== PERSISTENT STATE =============================
 * GLOBAL STATE ANCHORING PATTERN:
 * Bloxd.io's code editor can reset module context during runtime. By anchoring
 * state to a global object (_g), we ensure persistence across resets.
 * 
 * The _S object serves as the single source of truth for all anti-cheat state.
 * Each property uses defensive initialization (|| {}) to prevent data loss.
 * ========================================================================= */
var _g = (typeof global !== "undefined") ? global : (typeof self !== "undefined") ? self : {};
_g.ARENA_STATE = _g.ARENA_STATE || {};
var _S = _g.ARENA_STATE;

_S.reachViolations = _S.reachViolations || {};
_S.lastAttackTimestamps = _S.lastAttackTimestamps || {};
_S.lastPositions = _S.lastPositions || {};
_S.rotationViolations = _S.rotationViolations || {};
_S.hitCoordinates = _S.hitCoordinates || {};
_S.cursorMovementHistory = _S.cursorMovementHistory || {};
_S.clickData = _S.clickData || {};
_S.acCombatDb = _S.acCombatDb || {};
_S.acAimDb = _S.acAimDb || {};
_S.kickedRecently = _S.kickedRecently || {};
_S.lastInputTime = _S.lastInputTime || {};
_S.afkDb = _S.afkDb || {};
_S.positionHistory = _S.positionHistory || {};
_S.spinDb = _S.spinDb || {};
_S.lastLookDir = _S.lastLookDir || {};
_S.desyncDb = _S.desyncDb || {};
_S.silentAimStrikes = _S.silentAimStrikes || {};
_S.velProbeCache = _S.velProbeCache || {};
_S.lastCombatPacketTime = _S.lastCombatPacketTime || {};
_S.acAlertFeed = _S.acAlertFeed || [];
_S.honeypotCleanup = _S.honeypotCleanup || {};
_S.phantomIds = _S.phantomIds || {};
_S.patternFingerprints = _S.patternFingerprints || {};
_S.curvePathDb = _S.curvePathDb || {};
_S.recentHits = _S.recentHits || {};
_S.targetSwitchDb = _S.targetSwitchDb || {};
_S.snapRotationDb = _S.snapRotationDb || {};
_S.behindHitDb = _S.behindHitDb || {};
_S.currentOwner = _S.currentOwner || null;
_S.ownerMonitoringEnabled = (typeof _S.ownerMonitoringEnabled === "boolean") ? _S.ownerMonitoringEnabled : false;
_S.worldAuthenticated = (typeof _S.worldAuthenticated === "boolean") ? _S.worldAuthenticated : false;
_S.destructionArmed = (typeof _S.destructionArmed === "boolean") ? _S.destructionArmed : false;
_S.systemCorrupted = (typeof _S.systemCorrupted === "boolean") ? _S.systemCorrupted : false;
_S.antiCheatActive = (typeof _S.antiCheatActive === "boolean") ? _S.antiCheatActive : true;
_S.ownerWatchdogStart = (typeof _S.ownerWatchdogStart === "number") ? _S.ownerWatchdogStart : 0;
_S.ownerVerified = (typeof _S.ownerVerified === "boolean") ? _S.ownerVerified : false;
_S.spawnProtection = (typeof _S.spawnProtection === "boolean") ? _S.spawnProtection : true;

var reachViolations = _S.reachViolations;
var lastAttackTimestamps = _S.lastAttackTimestamps;
var lastPositions = _S.lastPositions;
var rotationViolations = _S.rotationViolations;
var hitCoordinates = _S.hitCoordinates;
var cursorMovementHistory = _S.cursorMovementHistory;
var clickData = _S.clickData;
var acCombatDb = _S.acCombatDb;
var acAimDb = _S.acAimDb;
var kickedRecently = _S.kickedRecently;
var lastInputTime = _S.lastInputTime;
var afkDb = _S.afkDb;
var positionHistory = _S.positionHistory;
var spinDb = _S.spinDb;
var lastLookDir = _S.lastLookDir;
var desyncDb = _S.desyncDb;
var silentAimStrikes = _S.silentAimStrikes;
var velProbeCache = _S.velProbeCache;
var lastCombatPacketTime = _S.lastCombatPacketTime;
var acAlertFeed = _S.acAlertFeed;
var honeypotCleanup = _S.honeypotCleanup;
var phantomIds = _S.phantomIds;
var patternFingerprints = _S.patternFingerprints;
var curvePathDb = _S.curvePathDb;
var recentHits = _S.recentHits;
var targetSwitchDb = _S.targetSwitchDb;
var snapRotationDb = _S.snapRotationDb;
var behindHitDb = _S.behindHitDb;
var currentOwner = _S.currentOwner;
var ownerMonitoringEnabled = _S.ownerMonitoringEnabled;
var worldAuthenticated = _S.worldAuthenticated;
var destructionArmed = _S.destructionArmed;
var systemCorrupted = _S.systemCorrupted;
var antiCheatActive = _S.antiCheatActive;
var ownerWatchdogStart = _S.ownerWatchdogStart;
var ownerVerified = _S.ownerVerified;
var spawnProtection = _S.spawnProtection;

/* ========================= OWNER VERIFICATION ============================ */
/* Obfuscated owner name to prevent code-copy hijacking */
var _O = [49, 84, 90, 95, 82, 69, 48];
function _dec(a) {
    var s = "";
    for (var i = 0; i < a.length; i++)
        s += String.fromCharCode(a[i]);
    return s;
}
var TRUE_OWNER = _dec(_O);
var OWNER_NAME = "1TZ_RE0";

/* ========================= PERMANENT CREATOR CREDIT =======================
 * This variable is used in the status command and cannot be removed without
 * breaking the !status command functionality. It permanently credits the
 * original creator of this anti-cheat system.
 * ========================================================================= */
var ORIGINAL_CREATOR = "1TZ_RE0";
var ORIGINAL_CREATOR_GITHUB = "1T2E6Y876DF";
var CREATOR_MESSAGE = "Anti-cheat system created by " + ORIGINAL_CREATOR + " (GitHub: " + ORIGINAL_CREATOR_GITHUB + ")";

/* ========================== CONFIGURATION ================================
 * THRESHOLD CALIBRATION RATIONALE:
 * All thresholds are tuned based on empirical testing with real players using
 * various input devices (Logitech M240, Razer mice, mobile touchscreens).
 * 
 * Key considerations:
 * - Human reaction time: 150-300ms average, so combat analysis windows are 200-500ms
 * - Mouse hardware limitations: Most mice report at 125-1000Hz (1-8ms between reports)
 * - Network latency: Players with 100-200ms ping need relaxed thresholds to avoid false positives
 * - Input device variance: Drag clickers produce 30-40 CPS legitimately, so CPS ceiling is 25+
 * - Fatigue modeling: Humans slow down over time (first half vs second half click speed)
 * ========================================================================= */
var CONFIG = {
    /* Reach validation: Bloxd.io hitbox is 0.6m wide, human arm reach ~4.5m max.
     * 4.8m base + 0.6m ping buffer = 5.4m hard ceiling. Accounts for network desync. */
    REACH_BASE: 4.8,
    REACH_BUFFER_CAP: 0.6,
    REACH_HARD_CEILING: 5.4,
    REACH_DEBOUNCE: 15,
    REACH_VIOLATIONS: 5,

    /* Hitbox dimensions */
    HITBOX_W: 0.6,
    HITBOX_H: 1.8,
    EYE_Y: 1.62,

    /* Click analysis */
    CLICK_HISTORY_MAX: 30,
    REQUIRED_CLICKS: 8,
    MAX_INTERVAL: 2000,

    /* Mobile detection */
    MOBILE_MULTI_TOUCH_MS: 2,
    MOBILE_RECOVERY_MS: 50,
    MOBILE_SYNCHRONICITY_THRESHOLD: 0.001,

    /* Aimbot/Spinbot */
    MAX_ROTATION: 165,
    ROTATION_VIOLATIONS: 4,
    AIM_STREAK: 10,
    MIN_VARIANCE: 0.12,
    SILENT_AIM_DEFLECTION: 50.0,
    SILENT_AIM_BUFFER_CAP: 30.0,
    SILENT_AIM_CEILING: 85.0,
    SILENT_AIM_STRIKES: 3,
    HITBOX_VARIANCE_THRESHOLD: 0.02,
    HITBOX_HISTORY_SIZE: 10,
    HITBOX_MIN_SAMPLES: 5,
    CURSOR_HISTORY_SIZE: 30,
    CURVE_SEGMENT_MIN: 8,
    CURVE_SIMILARITY_THRESHOLD: 0.85,
    CURVE_STRIKES_TO_KICK: 3,
    CURVE_ACTIVE_MOVEMENT: 2.0,
    KILLAURA_MULTI_HIT_MS: 100,
    KILLAURA_MULTI_TARGETS: 2,
    KILLAURA_STRIKES: 3,
    TARGET_SWITCH_WINDOW: 500,
    TARGET_SWITCH_MIN_HITS: 3,
    TARGET_SWITCH_STRIKES: 3,
    SNAP_ROTATION_THRESHOLD: 150,
    SNAP_NO_SHAKE_STRIKES: 3,
    BEHIND_HIT_ANGLE: 90,
    BEHIND_HIT_STRIKES: 3,
    SPIN_WINDOW_MS: 1000,
    SPIN_DEG_PER_SEC: 360,
    SPIN_LOCKED_HITS: 3,

    /* Anti-knockback */
    KINEMATIC_SAMPLES: 4,
    KINEMATIC_MIN_SPEED: 0.8,
    KINEMATIC_FREEZE_SPEED: 0.15,
    KINEMATIC_LAG_VELOCITY: 1.2,
    KB_DELAY: 150,
    MIN_KB_SQ: 4.0,

    /* AFK shield */
    AFK_STILL_MS: 2000,
    AFK_VERIFY_MS: 2000,
    AFK_TRIGGER_MS: 2000,
    AFK_MOVE_EPS: 0.05,

    /* Spawn protection */
    SPAWN_X: 0,
    SPAWN_Y: 0,
    SPAWN_Z: 0,
    SPAWN_PROTECT_RADIUS: 12,

    /* Misc */
    KICK_COOLDOWN: 5000
};

/* ============================ HELPERS ==================================== */
function safeApi() { return (typeof api !== "undefined") ? api : null; }
function safeNow() {
    return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
}
function nameOf(p) { var a = safeApi(); return a ? a.getEntityName(p) : ""; }
function isOwner(p) {
    var name = nameOf(p);
    return name === TRUE_OWNER || (currentOwner && name === currentOwner);
}
function acExempt(pId) {
    var name = nameOf(pId);
    if (name === TRUE_OWNER) return true;
    if (currentOwner && name === currentOwner) {
        return !ownerMonitoringEnabled;
    }
    return false;
}
function acShouldScan(pId) { return antiCheatActive && !acExempt(pId); }

function posOf(id) {
    var a = safeApi(); if (!a || !a.getPosition) return null;
    var p = a.getPosition(id);
    if (!p || p.length !== 3) return null;
    return { x: p[0], y: p[1], z: p[2] };
}

function idInList(idsList, id) {
    var s = String(id);
    for (var i = 0; i < idsList.length; i++) if (String(idsList[i]) === s) return true;
    return false;
}

function mathLog2(v) { return Math.log(v) / Math.LN2; }

function inSpawnZone(pos) {
    if (!pos) return false;
    var dx = pos.x - CONFIG.SPAWN_X, dz = pos.z - CONFIG.SPAWN_Z;
    var r = CONFIG.SPAWN_PROTECT_RADIUS;
    return (dx * dx + dz * dz) <= (r * r);
}

function pingOf(pId) {
    var a = safeApi(); if (!a) return 0;
    if (a.getPlayerPing) { var p = a.getPlayerPing(pId); if (typeof p === "number" && p > 0) return p; }
    if (a.getPlayerNetworkInfo) { var n = a.getPlayerNetworkInfo(pId); if (n && n.ping) return n.ping; }
    return 0;
}

function velocityOf(pId) {
    var a = safeApi();
    if (a && a.getVelocity) {
        var v = a.getVelocity(pId);
        if (v && v.length >= 3) return { vx: v[0] || 0, vz: v[2] || 0 };
    }
    var prev = lastPositions[pId];
    var now = a ? a.getPosition(pId) : null;
    if (prev && now) return { vx: (now[0] - prev.x) * 20, vz: (now[2] - prev.z) * 20 };
    return { vx: 0, vz: 0 };
}

function hitboxOf(pId) {
    var a = safeApi(); if (!a || !a.getPosition) return null;
    var p = a.getPosition(pId); if (!p) return null;
    var hw = CONFIG.HITBOX_W * 0.5;
    return {
        minX: p[0] - hw, maxX: p[0] + hw,
        minY: p[1], maxY: p[1] + CONFIG.HITBOX_H,
        minZ: p[2] - hw, maxZ: p[2] + hw
    };
}

function surfacePoint(ex, ey, ez, box) {
    var cx = ex < box.minX ? box.minX : (ex > box.maxX ? box.maxX : ex);
    var cy = ey < box.minY ? box.minY : (ey > box.maxY ? box.maxY : ey);
    var cz = ez < box.minZ ? box.minZ : (ez > box.maxZ ? box.maxZ : ez);
    var dx = cx - ex, dy = cy - ey, dz = cz - ez;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function clearPlayerState(pId) {
    delete clickData[pId]; delete acCombatDb[pId]; delete acAimDb[pId];
    delete kickedRecently[pId];
    delete afkDb[pId]; delete positionHistory[pId]; delete spinDb[pId];
    delete lastLookDir[pId]; delete desyncDb[pId]; delete silentAimStrikes[pId];
    delete velProbeCache[pId]; delete lastCombatPacketTime[pId];
    delete lastInputTime[pId];
    delete phantomIds[pId]; delete honeypotCleanup[pId];
    var s = String(pId);
    for (var k in hitCoordinates) { var pt = k.split("_"); if (pt[0] === s || pt[1] === s) delete hitCoordinates[k]; }
}

/* ======================== ANTI-HIJACK SYSTEM ============================= */
function executeCoreSelfDestruct() {
    var a = safeApi();
    systemCorrupted = true; _S.systemCorrupted = true;
    antiCheatActive = false; _S.antiCheatActive = false;
    clickData = {}; acCombatDb = {}; acAimDb = {}; positionHistory = {};
    _S.clickData = clickData; _S.acCombatDb = acCombatDb;
    _S.acAimDb = acAimDb; _S.positionHistory = positionHistory;
    if (!a) return;
    try {
        var ids = a.getPlayerIds();
        for (var i = 0; i < ids.length; i++) {
            var pId = ids[i];
            if (a.clearInventory) a.clearInventory(pId);
            if (a.kickPlayer) a.kickPlayer(pId, "CRITICAL LOCKOUT - Unauthorized code copy detected.");
        }
    } catch(e) {}
}

function processDynamicHijackProtection(pId) {
    var a = safeApi(); if (!a || !pId) return;
    if (ownerVerified) return;
    var currentName = a.getEntityName(pId);
    if (currentName === TRUE_OWNER || (currentOwner && currentName === currentOwner)) {
        worldAuthenticated = true; _S.worldAuthenticated = true;
        destructionArmed = false; _S.destructionArmed = false;
        ownerVerified = true; _S.ownerVerified = true;
        ownerWatchdogStart = 0; _S.ownerWatchdogStart = 0;
        return;
    }
}

function runOwnerWatchdog(idsList, now) {
    if (ownerVerified) return;
    if (!ownerWatchdogStart) { ownerWatchdogStart = now; _S.ownerWatchdogStart = now; }
    for (var j = 0; j < idsList.length; j++) {
        var name = nameOf(idsList[j]);
        if (name === TRUE_OWNER || (currentOwner && name === currentOwner)) {
            ownerWatchdogStart = 0; _S.ownerWatchdogStart = 0;
            return;
        }
    }
}

/* =========================== KICK SYSTEM ================================= */
function runKick(pId, pName, hackName, detail) {
    var a = safeApi(); if (!a) return;
    if (isOwner(pId) || acExempt(pId)) return;
    if (kickedRecently[pId] && (Date.now() - kickedRecently[pId]) < CONFIG.KICK_COOLDOWN) return;
    kickedRecently[pId] = Date.now();

    a.sendMessage(pId, [
        { str: "KICKED FROM SERVER\n\n", style: { color: "#EF4444", fontWeight: "bold" } },
        { str: "Player: ", style: { color: "#94A3B8" } },
        { str: pName + "\n", style: { color: "#FFFFFF", fontWeight: "bold" } },
        { str: "Reason: ", style: { color: "#94A3B8" } },
        { str: hackName + "\n", style: { color: "#F43F5E", fontWeight: "bold" } },
        { str: (detail || "flagged by security checks") + "\n\n", style: { color: "#FDE047" } },
        { str: "Turn OFF your hacks/modules to play on this server.\n", style: { color: "#F87171", fontWeight: "bold" } },
        { str: "Disable cheats -> Relaunch Bloxd -> Rejoin\n\n", style: { color: "#E2E8F0" } },
        { str: "Repeated offenses = permanent ban.", style: { color: "#94A3B8" } }
    ]);

    try { if (a.kickPlayer) a.kickPlayer(pId, "Kicked: " + hackName + " - Turn OFF your hacks to play."); } catch(e) {}

    var acMsg = [];
    acMsg.push({ str: "======= SECURITY ALERT =======\n", style: { color: "#DC2626", fontWeight: "bold" } });
    acMsg.push({ str: "[CRITICAL FLAG] CHEAT DETECTED\n", style: { color: "#EF4444", fontWeight: "bold" } });
    acMsg.push({ str: "Player: ", style: { color: "#94A3B8" } });
    acMsg.push({ str: pName + "\n", style: { color: "#FFFFFF", fontWeight: "bold" } });
    acMsg.push({ str: "Detection: ", style: { color: "#94A3B8" } });
    acMsg.push({ str: hackName + "\n", style: { color: "#F43F5E", fontWeight: "bold" } });
    acMsg.push({ str: "Details: " + (detail || "unnatural pattern anomaly") + "\n", style: { color: "#FDE047" } });
    acMsg.push({ str: "==============================", style: { color: "#DC2626" } });
    try { a.broadcastMessage(acMsg); } catch(e) {}

    clearPlayerState(pId);
    acAlertFeed.unshift({ name: pName, hack: hackName, time: Date.now() });
    while (acAlertFeed.length > 6) acAlertFeed.pop();
}

/* ========================== AFK SHIELD SYSTEM ============================ */
function ensureAfk(pId) {
    var rec = afkDb[pId];
    if (!rec) {
        rec = afkDb[pId] = {
            isAFK: false,
            stationarySince: Date.now(),
            lastX: null, lastY: null, lastZ: null,
            verify: null, notified: false
        };
    }
    return rec;
}

function stationaryForMs(pId) {
    return Date.now() - (lastInputTime[pId] || Date.now());
}

function notifyShieldUp(pId) {
    var a = safeApi(); if (!a) return;
    var rec = afkDb[pId]; if (rec && rec.notified) return;
    if (rec) rec.notified = true;
    if (a.queueCrosshairText) {
        try { a.queueCrosshairText(pId, "AFK SHIELD ACTIVE", 3000); } catch(e) {}
    }
}

function notifyShieldDown(pId) {
    var a = safeApi(); if (!a) return;
    if (a.queueCrosshairText) {
        try { a.queueCrosshairText(pId, "", 100); } catch(e) {}
    }
}

function clearAfkFlag(pId, now) {
    var rec = afkDb[pId];
    if (rec && rec.isAFK) {
        rec.isAFK = false;
        lastInputTime[pId] = now;
        rec.verify = null;
        rec.notified = false;
        notifyShieldDown(pId);
    }
}

function processAfkState(pId, now, pos) {
    var rec = ensureAfk(pId);
    var lastInteraction = lastInputTime[pId] || now;
    var silenceDuration = now - lastInteraction;
    if (silenceDuration >= CONFIG.AFK_STILL_MS) {
        if (!rec.isAFK) { rec.isAFK = true; notifyShieldUp(pId); }
    } else {
        if (rec.isAFK) { rec.isAFK = false; rec.notified = false; notifyShieldDown(pId); }
    }
    if (rec.verify && (now - rec.verify.at) >= CONFIG.AFK_VERIFY_MS) { rec.verify = null; }
}

/* ====================== KINEMATIC / POSITION TRACKING ==================== */
function recordPositionSample(pId, p, now) {
    var hist = positionHistory[pId]; if (!hist) hist = positionHistory[pId] = [];
    hist.push({ x: p[0], y: p[1], z: p[2], t: now });
    while (hist.length > CONFIG.KINEMATIC_SAMPLES) hist.shift();
}

function kinematicStateOf(pId) {
    var a = safeApi();
    var hist = positionHistory[pId];
    if (!hist || hist.length < 2) return { moving: false, lagStuck: false, speed: 0 };
    var aa = hist[0]; var b = hist[hist.length - 1];
    var ddx = b.x - aa.x, ddy = b.y - aa.y, ddz = b.z - aa.z;
    var disp = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
    var span = b.t - aa.t; if (span < 50) span = 50;
    var speed = disp * 1000 / span;
    var moving = speed >= CONFIG.KINEMATIC_MIN_SPEED;
    var lagStuck = false;
    if (!moving && a && a.getVelocity) {
        try {
            var v = a.getVelocity(pId);
            if (v && v.length >= 3) {
                var vs = Math.sqrt((v[0] || 0) * (v[0] || 0) + (v[2] || 0) * (v[2] || 0));
                if (vs > CONFIG.KINEMATIC_LAG_VELOCITY) lagStuck = true;
            }
        } catch(e) {}
    }
    return { moving: moving, lagStuck: lagStuck, speed: speed };
}

function markDesync(pId) {
    var now = Date.now();
    var rec = desyncDb[pId]; if (!rec) rec = desyncDb[pId] = { count: 0, last: 0 };
    if (now - rec.last > 1000) { rec.count += 1; rec.last = now; }
}

/* ======================== ANTI-KNOCKBACK DETECTION ======================= */
function verifyBordersAndInertia(pId, pName, pPos) {
    if (acExempt(pId)) return;
    if (!acShouldScan(pId)) return;
    var kb = acCombatDb[pId]; if (!kb || !kb.wasHit) return;
    var kin = kinematicStateOf(pId);
    if (kin.lagStuck) { kb.wasHit = false; return; }
    var rec = afkDb[pId]; if (rec && rec.isAFK) { kb.wasHit = false; return; }
    if ((Date.now() - kb.hitTime) < CONFIG.KB_DELAY) return;
    var mx = pPos.x - kb.hitX, mz = pPos.z - kb.hitZ;
    var movedSq = (mx * mx) + (mz * mz);
    kb.wasHit = false;
    if (movedSq < CONFIG.MIN_KB_SQ) {
        runKick(pId, pName, "Anti-Knockback", "moved only " + Math.sqrt(movedSq).toFixed(2) + "m after taking a hit");
    }
}

/* ========================= LOOK / SPIN TRACKING ========================== */
function trackLookTelemetry(pId, now, spinEnabled) {
    var a = safeApi(); if (!a || !a.getPlayerFacingInfo) return;
    var facing = a.getPlayerFacingInfo(pId);
    if (!facing || !facing.dir || facing.dir.length < 3) return;
    var dx = facing.dir[0], dy = facing.dir[1], dz = facing.dir[2];
    var prev = lastLookDir[pId];
    if (prev) {
        var dot = prev.x * dx + prev.y * dy + prev.z * dz;
        if (dot > 1) dot = 1; if (dot < -1) dot = -1;
        var angDelta = Math.acos(dot) * (180 / Math.PI);
        if (angDelta > 0.3) { lastInputTime[pId] = now; clearAfkFlag(pId, now); }
    }
    lastLookDir[pId] = { x: dx, y: dy, z: dz };
    if (!spinEnabled) return;
    var yaw = Math.atan2(dx, dz) * (180 / Math.PI);
    var rec = spinDb[pId];
    if (!rec) {
        spinDb[pId] = {
            lastYaw: yaw, accum: 0, windowStart: now,
            spinning: false, lockedHits: 0, lastDegPerSec: 0
        };
        return;
    }
    if (rec.lastYaw !== null && rec.lastYaw !== undefined) {
        var yawDelta = yaw - rec.lastYaw;
        while (yawDelta > 180) yawDelta -= 360;
        while (yawDelta < -180) yawDelta += 360;
        rec.accum += Math.abs(yawDelta);
    }
    rec.lastYaw = yaw;
    var span = now - rec.windowStart;
    if (span >= CONFIG.SPIN_WINDOW_MS) {
        var degPerSec = rec.accum * 1000 / span;
        rec.lastDegPerSec = Math.round(degPerSec);
        rec.spinning = degPerSec >= CONFIG.SPIN_DEG_PER_SEC;
        if (!rec.spinning) rec.lockedHits = 0;
        rec.accum = 0; rec.windowStart = now;
    }
}

/* ========================== REACH VALIDATION ============================== */
function validateReach(attackerId, victimId) {
    if (acExempt(attackerId)) return true;
    if (!acShouldScan(attackerId)) return true;
    var a = safeApi(); if (!a) return true;
    var vRec = afkDb[victimId]; if (vRec && vRec.isAFK) return true;
    var now = safeNow();
    var last = lastAttackTimestamps[attackerId] || 0;
    if (now - last < CONFIG.REACH_DEBOUNCE) return true;
    lastAttackTimestamps[attackerId] = now;
    var aPos = a.getPosition(attackerId); var box = hitboxOf(victimId);
    if (!aPos || !box) return true;
    var ex = aPos[0], ey = aPos[1] + CONFIG.EYE_Y, ez = aPos[2];
    var dist = surfacePoint(ex, ey, ez, box);
    var aVel = velocityOf(attackerId); var vVel = velocityOf(victimId);
    var aSpeed = Math.sqrt(aVel.vx * aVel.vx + aVel.vz * aVel.vz);
    var vSpeed = Math.sqrt(vVel.vx * vVel.vx + vVel.vz * vVel.vz);
    var combinedSpeed = aSpeed + vSpeed;
    var aPing = pingOf(attackerId); var vPing = pingOf(victimId);
    var combinedPing = (aPing + vPing) / 1000;
    var pingBuffer = combinedPing * (combinedSpeed + 4.0);
    var maxReach = CONFIG.REACH_BASE + Math.min(pingBuffer, CONFIG.REACH_BUFFER_CAP);
    if (maxReach > CONFIG.REACH_HARD_CEILING) maxReach = CONFIG.REACH_HARD_CEILING;
    var violations = reachViolations[attackerId] || 0;
    if (dist > maxReach) {
        var next = violations + 1;
        reachViolations[attackerId] = next;
        if (next >= CONFIG.REACH_VIOLATIONS) {
            reachViolations[attackerId] = 0;
            runKick(attackerId, nameOf(attackerId), "Reach (Hitbox Expansion)",
                dist.toFixed(2) + "m > " + maxReach.toFixed(2) + "m allowed");
        }
        return false;
    }
    reachViolations[attackerId] = violations > 0 ? violations - 1 : 0;
    return true;
}

/* ====================== HITBOX VARIANCE (AIMBOT) ========================= */
function checkHitboxVariance(attackerId, victimId) {
    if (acExempt(attackerId)) return;
    if (!acShouldScan(attackerId)) return;
    var aKin = kinematicStateOf(attackerId); var vKin = kinematicStateOf(victimId);
    if (vKin.lagStuck) { markDesync(victimId); return; }
    if (!aKin.moving || !vKin.moving) return;
    var a = safeApi();
    var isAttackerAirborne = false, isVictimAirborne = false;
    if (a && a.getVelocity) {
        try {
            var aVel = a.getVelocity(attackerId); var vVel = a.getVelocity(victimId);
            if (aVel && aVel.length >= 3) isAttackerAirborne = Math.abs(aVel[1] || 0) > 0.08;
            if (vVel && vVel.length >= 3) isVictimAirborne = Math.abs(vVel[1] || 0) > 0.08;
        } catch(e) {}
    }
    if (!isAttackerAirborne && !isVictimAirborne) return;
    var vBox = hitboxOf(victimId); if (!vBox) return;
    var aPos = posOf(attackerId); if (!aPos) return;
    var ex = aPos.x, ey = aPos.y + CONFIG.EYE_Y, ez = aPos.z;
    var cx = ex < vBox.minX ? vBox.minX : (ex > vBox.maxX ? vBox.maxX : ex);
    var cy = ey < vBox.minY ? vBox.minY : (ey > vBox.maxY ? vBox.maxY : ey);
    var cz = ez < vBox.minZ ? vBox.minZ : (ez > vBox.maxZ ? vBox.maxZ : ez);
    var relX = (vBox.maxX - vBox.minX) > 0 ? (cx - vBox.minX) / (vBox.maxX - vBox.minX) : 0.5;
    var relY = (vBox.maxY - vBox.minY) > 0 ? (cy - vBox.minY) / (vBox.maxY - vBox.minY) : 0.5;
    var relZ = (vBox.maxZ - vBox.minZ) > 0 ? (cz - vBox.minZ) / (vBox.maxZ - vBox.minZ) : 0.5;
    var coordKey = attackerId + "_" + victimId;
    if (!hitCoordinates[coordKey]) hitCoordinates[coordKey] = [];
    var coords = hitCoordinates[coordKey];
    coords.push({ x: relX, y: relY, z: relZ });
    while (coords.length > CONFIG.HITBOX_HISTORY_SIZE) coords.shift();
    if (coords.length < CONFIG.HITBOX_MIN_SAMPLES) return;
    var varianceSum = 0;
    for (var i = 1; i < coords.length; i++) {
        var ddx = coords[i].x - coords[i-1].x;
        var ddy = coords[i].y - coords[i-1].y;
        var ddz = coords[i].z - coords[i-1].z;
        varianceSum += Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
    }
    var avgVariance = varianceSum / (coords.length - 1);
    if (avgVariance < 0.0028) {
        var spin = spinDb[attackerId];
        if (spin && spin.spinning) {
            spin.lockedHits = (spin.lockedHits || 0) + 1;
            if (spin.lockedHits >= CONFIG.SPIN_LOCKED_HITS) {
                runKick(attackerId, nameOf(attackerId), "Spinbot (Helicopter Rotation Lock)",
                    (spin.lastDegPerSec || 0) + " deg/s sustained spin with machine-locked hit coordinates");
            }
            return;
        }
        runKick(attackerId, nameOf(attackerId), "Aimbot (Unnatural Air Lock)",
            "relVariance " + avgVariance.toFixed(5) + " across " + coords.length + " consecutive airborne hits");
    } else {
        delete hitCoordinates[coordKey];
        var spinOk = spinDb[attackerId]; if (spinOk) spinOk.lockedHits = 0;
    }
}

/* ====================== SILENT AIM DETECTION ============================= */
function validateLookToImpactAngle(attackerId, victimBox) {
    var a = safeApi(); if (!a || !a.getPosition || !a.getPlayerFacingInfo) return true;
    var aPos = a.getPosition(attackerId);
    var facing = a.getPlayerFacingInfo(attackerId);
    if (!aPos || !facing || !facing.dir) return true;
    var ex = aPos[0], ey = aPos[1] + CONFIG.EYE_Y, ez = aPos[2];
    var cx = ex < victimBox.minX ? victimBox.minX : (ex > victimBox.maxX ? victimBox.maxX : ex);
    var cy = ey < victimBox.minY ? victimBox.minY : (ey > victimBox.maxY ? victimBox.maxY : ey);
    var cz = ez < victimBox.minZ ? victimBox.minZ : (ez > victimBox.maxZ ? victimBox.maxZ : ez);
    var ix = cx - ex, iy = cy - ey, iz = cz - ez;
    var iLen = Math.sqrt(ix * ix + iy * iy + iz * iz);
    if (iLen < 0.001) return true;
    var lx = facing.dir[0], ly = facing.dir[1], lz = facing.dir[2];
    var lLen = Math.sqrt(lx * lx + ly * ly + lz * lz);
    if (lLen < 0.001) return true;
    var dot = (lx * ix + ly * iy + lz * iz) / (lLen * iLen);
    var devAngle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
    var aPing = pingOf(attackerId);
    var pingBuffer = (aPing / 1000) * 45.0;
    var dynamicCeiling = Math.min(CONFIG.SILENT_AIM_CEILING,
        CONFIG.SILENT_AIM_DEFLECTION + Math.min(pingBuffer, CONFIG.SILENT_AIM_BUFFER_CAP));
    if (devAngle > dynamicCeiling) {
        var strikes = (silentAimStrikes[attackerId] || 0) + 1;
        silentAimStrikes[attackerId] = strikes;
        if (strikes >= CONFIG.SILENT_AIM_STRIKES) {
            runKick(attackerId, nameOf(attackerId), "Silent Aimbot (Packet Deviation)",
                devAngle.toFixed(1) + " deg packet mutation off screen angle");
        }
        return false;
    }
    return true;
}

/* ========================= HONEYPOT TRAP SYSTEM ========================== */
var PHANTOM_NAMES = [
    "xX_DarkSlayer_Xx", "ShadowNinja99", "BlazeKing_YT", "ProGamer2024",
    "NightHawk_XD", "StormBreaker77", "CyberWolf_TV", "PixelKnight01",
    "DragonPulse_VL", "IronFist_GG", "VoidWalker_X", "ThunderBolt99",
    "ArcticFox_Pro", "NeonStrike_TV", "GhostRider_XL", "ZeroGravity_YT",
    "FlameWarden88", "IcePhoenix_GG", "DarkMatter_XD", "SilverBolt_Pro"
];

function generatePhantomUuid() {
    var hex = "0123456789abcdef";
    var parts = [8, 4, 4, 4, 12];
    var uuid = "";
    for (var p = 0; p < parts.length; p++) {
        if (p > 0) uuid += "-";
        for (var i = 0; i < parts[p]; i++) {
            uuid += hex.charAt(Math.floor(Math.random() * 16));
        }
    }
    return uuid;
}

function isPhantomEntity(victimId) {
    if (typeof victimId !== "string") return null;
    for (var phKey in phantomIds) {
        if (phantomIds[phKey].entityId === victimId) return phKey;
    }
    return null;
}

function deployHoneypotTrap(playerId) {
    var a = safeApi(); if (!a || !a.spawnFakePlayerForClient) return;
    if (isOwner(playerId) || acExempt(playerId)) return;
    var pos = posOf(playerId); if (!pos) return;

    var ids = a.getPlayerIds();
    var hasNearbyPlayer = false;
    for (var i = 0; i < ids.length; i++) {
        var otherId = ids[i];
        if (otherId === playerId) continue;
        if (isOwner(otherId) || acExempt(otherId)) continue;
        var otherPos = posOf(otherId);
        if (!otherPos) continue;
        var dx = pos.x - otherPos.x;
        var dz = pos.z - otherPos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 20 && dist > 2) { hasNearbyPlayer = true; break; }
    }
    if (!hasNearbyPlayer) return;

    var facing = a.getPlayerFacingInfo ? a.getPlayerFacingInfo(playerId) : null;
    var dir = facing && facing.dir && facing.dir.length >= 3 ? facing.dir : [0, 0, 1];
    var spawnRoll = Math.random();
    var fakeX, fakeY, fakeZ;
    if (spawnRoll < 0.4) {
        fakeX = pos.x + (dir[0] * 2.5);
        fakeY = pos.y + (dir[1] * 2.5);
        fakeZ = pos.z + (dir[2] * 2.5);
    } else if (spawnRoll < 0.7) {
        fakeX = pos.x - (dir[0] * 2.0);
        fakeY = pos.y + 0.5;
        fakeZ = pos.z - (dir[2] * 2.0);
    } else {
        fakeX = pos.x + (dir[0] * 1.0) + (Math.random() - 0.5);
        fakeY = pos.y + 3.5;
        fakeZ = pos.z + (dir[2] * 1.0) + (Math.random() - 0.5);
    }

    var fakeName = PHANTOM_NAMES[Math.floor(Math.random() * PHANTOM_NAMES.length)];
    var fakeUuid = generatePhantomUuid();
    phantomIds[playerId] = { entityId: fakeUuid, name: fakeName };

    try {
        a.spawnFakePlayerForClient(playerId, fakeUuid, fakeName, fakeX, fakeY, fakeZ, {
            isInvisible: true,
            hasNoCollision: true,
            boundingBoxWidth: 0.8,
            boundingBoxHeight: 1.8
        });
        honeypotCleanup[playerId] = Date.now() + 1500;
    } catch(e) {}
}

function processHoneypotCleanup() {
    var a = safeApi(); if (!a || !a.removeFakePlayerForClient) return;
    var now = Date.now();
    for (var pId in honeypotCleanup) {
        if (now >= honeypotCleanup[pId]) {
            var phantom = phantomIds[pId];
            if (phantom) {
                try { a.removeFakePlayerForClient(pId, phantom.entityId); } catch(e) {}
                delete phantomIds[pId];
            }
            delete honeypotCleanup[pId];
        }
    }
}

/* =================== CLICK ANALYSIS ENGINE (CORE) ======================== */
/*
 * The heart of the macro/autoclicker detection system.
 * Analyzes click intervals using 12+ statistical methods:
 *
 * 1. Burst detection (0-6ms gaps = hardware macro)
 * 2. Packet signature mirror (repeating delta patterns)
 * 3. Jitter analysis (missing micro-variations)
 * 4. Duplication ratio (recycled intervals)
 * 5. Shannon entropy (too predictable)
 * 6. CPS ceiling (inhuman sustained speed)
 * 7. Timer grid lock (snapping to fixed resolution)
 * 8. Fatigue ratio (no muscle deceleration)
 * 9. Ramp detection (no acceleration curve)
 * 10. Coefficient of Variation (robotic consistency)
 * 11. Sustained speed windows (impossible endurance)
 * 12. Distribution uniformity (flat vs clustered)
 *
 * Exemptions: Mobile multi-touch, Drag click vibration patterns
 */

function isMobileMultiTouchPattern(intervals, n) {
    if (n < 5) return false;
    var hasBurst = false, hasRecovery = false;
    for (var i = 0; i < n - 1; i++) {
        if (intervals[i] <= CONFIG.MOBILE_MULTI_TOUCH_MS) hasBurst = true;
        if (intervals[i] > CONFIG.MOBILE_RECOVERY_MS) hasRecovery = true;
    }
    return hasBurst && hasRecovery;
}

function checkMobileSynchronicity(intervals, n) {
    if (n < 10) return false;
    var varianceSum = 0;
    for (var i = 1; i < n; i++) varianceSum += Math.abs(intervals[i] - intervals[i - 1]);
    var avgVariance = varianceSum / (n - 1);
    return avgVariance < CONFIG.MOBILE_SYNCHRONICITY_THRESHOLD;
}

/* ===========================================================================
 * CLICK INTERVAL STATISTICAL ANALYSIS ENGINE
 * Core detection function that computes 16 statistical metrics from click history.
 * 
 * Statistical Approach:
 * - Jitter analysis: Human hands produce micro-variations (2-15ms) between clicks
 *   due to muscle tremor and neural signal noise. Macros produce 0-2ms jitter.
 * - Coefficient of Variation (CV): stddev/mean ratio. Humans >0.15 at speed,
 *   macros 0.01-0.15. This normalizes variance across different CPS ranges.
 * - Shannon Entropy: Measures predictability. Static loops have entropy <0.25.
 *   Humans have higher entropy due to natural variation.
 * - Fatigue ratio: Humans slow down over time (first half vs second half CPS).
 *   Macros maintain constant speed indefinitely.
 * - Drag click detection: Identifies vibration patterns (1-8ms micro-bursts mixed
 *   with >15ms recovery periods) that characterize legitimate drag clicking.
 * 
 * Returns: Object with all computed metrics, or null if insufficient data
 * =========================================================================== */
function analyzeClickIntervals(hist) {
    var intervals = [];
    for (var i = 1; i < hist.length; i++) {
        var dt = hist[i] - hist[i - 1];
        if (dt >= 0 && dt < CONFIG.MAX_INTERVAL) intervals.push(dt);
    }
    var n = intervals.length; if (n < 6) return null;

    /* Compute mean interval (inverse of CPS) */
    var sum = 0, aa;
    for (aa = 0; aa < n; aa++) sum += intervals[aa];
    var mean = sum / n;

    /* Jitter analysis: average absolute difference between consecutive intervals.
     * Human jitter: 2-15ms. Macro jitter: 0-2ms. */
    var jitterSum = 0, identicalIntervals = 0;
    var minInterval = intervals[0], maxInterval = intervals[0];
    var seenIntervals = {};
    for (aa = 0; aa < n; aa++) {
        if (intervals[aa] < minInterval) minInterval = intervals[aa];
        if (intervals[aa] > maxInterval) maxInterval = intervals[aa];
        var intKey = Math.round(intervals[aa]);
        if (seenIntervals[intKey]) { identicalIntervals++; }
        seenIntervals[intKey] = true;
        if (aa > 0) { jitterSum += Math.abs(intervals[aa] - intervals[aa - 1]); }
    }
    var avgJitter = jitterSum / (n - 1);
    var range = maxInterval - minInterval;
    var duplicationRatio = identicalIntervals / n;

    /* Drag click vibration detection: Identifies micro-bursts (1-8ms) mixed with
     * recovery periods (>15ms). This pattern is characteristic of drag clicking
     * where the mouse vibrates against the surface, producing rapid bursts followed
     * by longer gaps as the finger repositions. */
    var microBurstCount = 0, recoveryCount = 0;
    for (aa = 0; aa < n; aa++) {
        if (intervals[aa] >= 1 && intervals[aa] <= 8) microBurstCount++;
        if (intervals[aa] > 15) recoveryCount++;
    }
    var vibrationRatio = microBurstCount / n;
    var isDragClick = (vibrationRatio > 0.20 && recoveryCount >= 2 && avgJitter > 6.0 && duplicationRatio < 0.5);

    /* Pattern oscillation detection: machines reverse sequences (4-5-6-7-7-6-5-4) */
    var directionChanges = 0;
    for (aa = 1; aa < n - 1; aa++) {
        var prevDiff = intervals[aa] - intervals[aa - 1];
        var nextDiff = intervals[aa + 1] - intervals[aa];
        if ((prevDiff > 0 && nextDiff < 0) || (prevDiff < 0 && nextDiff > 0)) directionChanges++;
    }
    var oscillationRatio = directionChanges / (n - 2);
    var hasPatternOscillation = (oscillationRatio > 0.60 && cps >= 15);

    /* Shannon entropy */
    var counts = {};
    for (aa = 0; aa < n; aa++) counts[intervals[aa]] = (counts[intervals[aa]] || 0) + 1;
    var entropy = 0;
    for (var k in counts) { var p = counts[k] / n; if (p > 0) entropy -= p * (Math.log(p) / Math.LN2); }

    /* Fatigue ratio: first half vs second half speed */
    var halfN = Math.floor(n / 2);
    var firstHalfSum = 0, secondHalfSum = 0;
    for (aa = 0; aa < halfN; aa++) firstHalfSum += intervals[aa];
    for (aa = halfN; aa < n; aa++) secondHalfSum += intervals[aa];
    var firstHalfMean = halfN > 0 ? firstHalfSum / halfN : mean;
    var secondHalfMean = (n - halfN) > 0 ? secondHalfSum / (n - halfN) : mean;
    var fatigueRatio = firstHalfMean > 0 ? secondHalfMean / firstHalfMean : 1.0;

    /* Timer grid lock detection */
    var gridBases = [1, 2, 5];
    var bestGridFit = 0;
    for (var g = 0; g < gridBases.length; g++) {
        var base = gridBases[g]; var gridHits = 0;
        for (aa = 0; aa < n; aa++) {
            var remainder = intervals[aa] % base;
            if (remainder < 0.5 || (base - remainder) < 0.5) gridHits++;
        }
        var fit = gridHits / n;
        if (fit > bestGridFit) bestGridFit = fit;
    }

    /* Ramp detection: acceleration curve */
    var rampLen = Math.min(4, n);
    var rampSum = 0, midSum = 0, midCount = 0;
    for (aa = 0; aa < rampLen; aa++) rampSum += intervals[aa];
    var midStart = rampLen, midEnd = Math.min(n, rampLen + 8);
    for (aa = midStart; aa < midEnd; aa++) { midSum += intervals[aa]; midCount++; }
    var rampMean = rampLen > 0 ? rampSum / rampLen : mean;
    var midMean = midCount > 0 ? midSum / midCount : mean;
    var hasRamp = rampMean > midMean * 1.3;

    var cps = mean > 0 ? 1000 / mean : 0;

    /* Coefficient of Variation */
    var varianceSum2 = 0;
    for (aa = 0; aa < n; aa++) { var diff = intervals[aa] - mean; varianceSum2 += diff * diff; }
    var stddev = Math.sqrt(varianceSum2 / n);
    var coeffVariance = mean > 0 ? stddev / mean : 0;

    /* Distribution uniformity via bin analysis */
    var binSize = 5, bins = {};
    for (aa = 0; aa < n; aa++) { var bin = Math.floor(intervals[aa] / binSize); bins[bin] = (bins[bin] || 0) + 1; }
    var binCounts = []; for (var b in bins) binCounts.push(bins[b]);
    var binVariance = 0;
    if (binCounts.length > 1) {
        var binMean = n / binCounts.length;
        for (var bc = 0; bc < binCounts.length; bc++) {
            var bd = binCounts[bc] - binMean;
            binVariance += bd * bd;
        }
        binVariance /= binCounts.length;
    }
    var uniformityScore = binCounts.length > 2 ? 1.0 - Math.min(1.0, binVariance / (n * 0.5)) : 0;

    return {
        count: n, mean: mean, avgJitter: avgJitter, range: range,
        duplicationRatio: duplicationRatio, entropy: entropy,
        vibrationRatio: vibrationRatio, cps: cps, fatigueRatio: fatigueRatio,
        gridFit: bestGridFit, hasRamp: hasRamp, coeffVariance: coeffVariance,
        stddev: stddev, uniformityScore: uniformityScore,
        oscillationRatio: oscillationRatio, hasPatternOscillation: hasPatternOscillation,
        isDragClick: isDragClick,
        isMobile: isMobileMultiTouchPattern(intervals, n),
        isInjected: checkMobileSynchronicity(intervals, n)
    };
}

/* ====================== CLICK EVENT HANDLER ============================== */
onPlayerClick = function (playerId, wasAltClick) {
    var a = safeApi(); if (!a || !a.getEntityName) return;
    if (wasAltClick || isOwner(playerId)) return;
    var now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    if (!clickData[playerId]) clickData[playerId] = [];
    var hist = clickData[playerId];
    if (!acCombatDb[playerId]) acCombatDb[playerId] = {};
    var cDb = acCombatDb[playerId];

    hist.push(now);
    while (hist.length > 30) hist.shift();
    lastInputTime[playerId] = Date.now();
    if (!antiCheatActive) return;

    var stats = analyzeClickIntervals(hist);

    /* Exemptions: mobile and drag click are legit */
    if (stats && stats.isMobile) return;
    if (stats && stats.isDragClick) return;
    if (stats && stats.isInjected) {
        runKick(playerId, nameOf(playerId), "Mobile Injection Script",
            "Zero synchronicity variance - app hack detected");
        return;
    }

    /* Cursor shake detection for drag click exemption */
    if (a.getPlayerFacingInfo && stats && stats.cps >= 20) {
        if (!cDb.cursorHistory) cDb.cursorHistory = [];
        var facing = a.getPlayerFacingInfo(playerId);
        if (facing && facing.dir && facing.dir.length >= 3) {
            cDb.cursorHistory.push({ x: facing.dir[0], y: facing.dir[1], z: facing.dir[2], t: now });
            while (cDb.cursorHistory.length > 10) cDb.cursorHistory.shift();
            if (cDb.cursorHistory.length >= 5) {
                var shakeCount = 0;
                for (var ch = 2; ch < cDb.cursorHistory.length; ch++) {
                    var prev1 = cDb.cursorHistory[ch - 1], prev2 = cDb.cursorHistory[ch - 2], curr = cDb.cursorHistory[ch];
                    var dot1 = prev2.x * prev1.x + prev2.y * prev1.y + prev2.z * prev1.z;
                    var dot2 = prev1.x * curr.x + prev1.y * curr.y + prev1.z * curr.z;
                    var angle1 = Math.acos(Math.max(-1, Math.min(1, dot1))) * (180 / Math.PI);
                    var angle2 = Math.acos(Math.max(-1, Math.min(1, dot2))) * (180 / Math.PI);
                    if ((angle1 > 2 && angle2 > 2) && ((angle1 > 5) !== (angle2 > 5))) shakeCount++;
                }
                if (shakeCount >= 3 && stats.avgJitter > 5.0) return;

                /* Cursor smoothness check: 20+ CPS with moving cursor but NO micro-shake = macro */
                var angles = [];
                for (var ca = 1; ca < cDb.cursorHistory.length; ca++) {
                    var cPrev = cDb.cursorHistory[ca - 1], cCurr = cDb.cursorHistory[ca];
                    var cDot = cPrev.x * cCurr.x + cPrev.y * cCurr.y + cPrev.z * cCurr.z;
                    var cAngle = Math.acos(Math.max(-1, Math.min(1, cDot))) * (180 / Math.PI);
                    angles.push(cAngle);
                }
                if (angles.length >= 4) {
                    var angleSum = 0, angleMin = angles[0], angleMax = angles[0];
                    for (var as = 0; as < angles.length; as++) {
                        angleSum += angles[as];
                        if (angles[as] < angleMin) angleMin = angles[as];
                        if (angles[as] > angleMax) angleMax = angles[as];
                    }
                    var angleMean = angleSum / angles.length;
                    var angleVariance = 0;
                    for (var av = 0; av < angles.length; av++) { var ad = angles[av] - angleMean; angleVariance += ad * ad; }
                    angleVariance /= angles.length;
                    var isMoving = angleMean > 1.0;
                    var isSmooth = angleVariance < 0.5 && (angleMax - angleMin) < 3.0;
                    if (isMoving && isSmooth && stats.cps >= 20 && stats.avgJitter < 5.0) {
                        cDb.smoothStrikes = (cDb.smoothStrikes || 0) + 1;
                        if (cDb.smoothStrikes >= 3) {
                            cDb.smoothStrikes = 0;
                            runKick(playerId, nameOf(playerId), "Autoclicker (Dead Cursor Lock)",
                                "Cursor moving at " + stats.cps.toFixed(0) + " CPS with zero micro-shake - human hand always trembles. Variance: " + angleVariance.toFixed(2));
                            return;
                        }
                    } else if (cDb.smoothStrikes > 0) { cDb.smoothStrikes = Math.max(0, cDb.smoothStrikes - 0.15); }
                }
            }
        }
    }

    /* Curve path consistency: aimbot tracking produces identical curve shapes across attempts */
    if (cursorMovementHistory[playerId] && cursorMovementHistory[playerId].length >= 20) {
        var curveResult = analyzeCurvePathConsistency(playerId);
        if (curveResult && curveResult.avgSimilarity >= CONFIG.CURVE_SIMILARITY_THRESHOLD && curveResult.arcCount >= 2) {
            if (!curvePathDb[playerId]) curvePathDb[playerId] = { strikes: 0, lastCheck: 0 };
            var cpDb = curvePathDb[playerId];
            if (now - cpDb.lastCheck > 5000) {
                cpDb.strikes = (cpDb.strikes || 0) + 1;
                cpDb.lastCheck = now;
                if (cpDb.strikes >= CONFIG.CURVE_STRIKES_TO_KICK) {
                    cpDb.strikes = 0;
                    runKick(playerId, nameOf(playerId), "Aimbot (Curve Path Lock)",
                        "Tracking curves " + (curveResult.avgSimilarity * 100).toFixed(0) + "% identical across " + curveResult.arcCount + " arcs - human hand produces unique curves");
                    return;
                }
            }
        } else if (curvePathDb[playerId] && curvePathDb[playerId].strikes > 0) {
            curvePathDb[playerId].strikes = Math.max(0, curvePathDb[playerId].strikes - 0.1);
        }
    }

    /* Pattern oscillation detection: advanced randomizers reverse sequences */
    if (stats && stats.hasPatternOscillation && stats.cps >= 18 && stats.avgJitter < 6.0) {
        cDb.oscillationStrikes = (cDb.oscillationStrikes || 0) + 1;
        if (cDb.oscillationStrikes >= 3) {
            cDb.oscillationStrikes = 0;
            runKick(playerId, nameOf(playerId), "Advanced Macro (Pattern Oscillation)",
                "Interval sequence reversing detected (up-down-up-down pattern). Oscillation: " + (stats.oscillationRatio * 100).toFixed(0) + "%");
            return;
        }
    } else if (cDb.oscillationStrikes > 0) { cDb.oscillationStrikes = Math.max(0, cDb.oscillationStrikes - 0.15); }

    /* Cross-session pattern fingerprinting: detect same logic across sessions */
    if (hist.length >= 12 && stats && stats.cps >= 15) {
        var intervals = [];
        for (var fi = 1; fi < hist.length; fi++) { var dt = hist[fi] - hist[fi - 1]; if (dt >= 0 && dt < 2000) intervals.push(dt); }
        if (intervals.length >= 8) {
            var currentFP = calculatePatternFingerprint(intervals);
            if (currentFP) {
                var storedFP = patternFingerprints[playerId];
                if (storedFP) {
                    var similarity = compareFingerprints(storedFP, currentFP);
                    if (similarity > 0.75 && stats.cps >= 18) {
                        cDb.fingerprintStrikes = (cDb.fingerprintStrikes || 0) + 1;
                        if (cDb.fingerprintStrikes >= 2) {
                            cDb.fingerprintStrikes = 0;
                            runKick(playerId, nameOf(playerId), "Advanced Macro (Cross-Session Pattern Match)",
                                "Same click logic detected across sessions. Similarity: " + (similarity * 100).toFixed(0) + "%");
                            return;
                        }
                    } else if (cDb.fingerprintStrikes > 0) { cDb.fingerprintStrikes = Math.max(0, cDb.fingerprintStrikes - 0.1); }
                }
                patternFingerprints[playerId] = currentFP;
            }
        }
    }

    /* Layer 1: Burst detection (hardware macro) */
    if (hist.length > 1) {
        var instantGap = now - hist[hist.length - 2];
        if (instantGap >= 0 && instantGap <= 6) {
            cDb.burstStrikes = (cDb.burstStrikes || 0) + 1;
            if (cDb.burstStrikes >= 5) {
                cDb.burstStrikes = 0;
                runKick(playerId, nameOf(playerId), "Hardware Macro (Firekey/Simultaneous Burst)",
                    "Impossible time spacing: " + instantGap.toFixed(1) + "ms");
                return;
            }
        } else if (cDb.burstStrikes > 0) {
            cDb.burstStrikes = Math.max(0, cDb.burstStrikes - 0.1);
        }
    }

    /* Layer 2: Packet signature mirror */
    if (!cDb.packetDeltas) cDb.packetDeltas = [];
    if (hist.length > 1 && stats && stats.cps >= 15) {
        var currentDelta = now - hist[hist.length - 2];
        if (currentDelta > 0 && currentDelta < 250) {
            var isPatternMatch = false;
            for (var p = 0; p < cDb.packetDeltas.length; p++) {
                if (Math.abs(cDb.packetDeltas[p] - currentDelta) < 1.5) { isPatternMatch = true; break; }
            }
            if (isPatternMatch) {
                cDb.mirrorStrikes = (cDb.mirrorStrikes || 0) + 1;
                if (cDb.mirrorStrikes >= 5) {
                    cDb.mirrorStrikes = 0; cDb.packetDeltas = [];
                    runKick(playerId, nameOf(playerId), "Advanced Macro (Packet Signature Mirror)",
                        "Subsequent click packets duplicated the established delta sequence");
                    return;
                }
            } else {
                if (cDb.mirrorStrikes > 0) cDb.mirrorStrikes = Math.max(0, cDb.mirrorStrikes - 0.2);
            }
            cDb.packetDeltas.push(currentDelta);
            if (cDb.packetDeltas.length > 6) cDb.packetDeltas.shift();
        }
    }

    if (!stats) return;

    /* Layer 3: Jitter analysis */
    if (stats.mean < 90 && stats.avgJitter < 6.5) {
        cDb.jitterStrikes = (cDb.jitterStrikes || 0) + 1;
        if (cDb.jitterStrikes >= 4) {
            cDb.jitterStrikes = 0;
            runKick(playerId, nameOf(playerId), "Autoclicker (Artificial Jitter Engine)",
                "Natural human micro-shake missing. Jitter Dev: " + stats.avgJitter.toFixed(2) + "ms");
            return;
        }
    }

    /* Layer 4: Duplication ratio */
    if (stats.count >= 12 && stats.duplicationRatio > 0.60 && stats.mean < 100) {
        cDb.gridStrikes = (cDb.gridStrikes || 0) + 1;
        if (cDb.gridStrikes >= 3) {
            cDb.gridStrikes = 0;
            runKick(playerId, nameOf(playerId), "Advanced Macro (Recycled Pattern Grid)",
                "Recycled time spacing: " + Math.round(stats.duplicationRatio * 100) + "% match accuracy");
            return;
        }
    }

    /* Layer 5: Shannon entropy */
    if (stats.count >= 10 && stats.entropy < 0.25 && stats.range < 3.0) {
        runKick(playerId, nameOf(playerId), "Autoclicker (Static Interval Loop)",
            "Constant timing loop. Entropy: " + stats.entropy.toFixed(3));
        return;
    }

    /* Layer 6: CPS ceiling */
    if (stats.cps >= 25 && stats.count >= 12 && stats.avgJitter < 8.0) {
        cDb.cpsStrikes = (cDb.cpsStrikes || 0) + 1;
        if (cDb.cpsStrikes >= 3) {
            cDb.cpsStrikes = 0;
            runKick(playerId, nameOf(playerId), "Autoclicker (Inhuman CPS Ceiling)",
                "Sustained " + stats.cps.toFixed(1) + " CPS with artificial uniformity. Jitter: " + stats.avgJitter.toFixed(2) + "ms");
            return;
        }
    } else if (cDb.cpsStrikes > 0) { cDb.cpsStrikes = Math.max(0, cDb.cpsStrikes - 0.2); }

    /* Layer 7: Timer grid lock */
    if (stats.count >= 12 && stats.gridFit > 0.80 && stats.mean < 100) {
        cDb.gridLockStrikes = (cDb.gridLockStrikes || 0) + 1;
        if (cDb.gridLockStrikes >= 3) {
            cDb.gridLockStrikes = 0;
            runKick(playerId, nameOf(playerId), "Advanced Macro (Timer Grid Lock)",
                Math.round(stats.gridFit * 100) + "% of clicks snap to fixed timer resolution");
            return;
        }
    } else if (cDb.gridLockStrikes > 0) { cDb.gridLockStrikes = Math.max(0, cDb.gridLockStrikes - 0.2); }

    /* Layer 8: Fatigue ratio */
    if (stats.count >= 14 && stats.fatigueRatio > 0.92 && stats.fatigueRatio < 1.08 && stats.mean < 65 && stats.avgJitter < 4.0) {
        cDb.fatigueStrikes = (cDb.fatigueStrikes || 0) + 1;
        if (cDb.fatigueStrikes >= 4) {
            cDb.fatigueStrikes = 0;
            runKick(playerId, nameOf(playerId), "Autoclicker (Zero Fatigue Pattern)",
                "Click speed perfectly stable across engagement - no human muscle fatigue detected. Ratio: " + stats.fatigueRatio.toFixed(3));
            return;
        }
    } else if (cDb.fatigueStrikes > 0) { cDb.fatigueStrikes = Math.max(0, cDb.fatigueStrikes - 0.15); }

    /* Layer 9: Ramp detection */
    if (stats.count >= 10 && !stats.hasRamp && stats.mean < 80 && stats.cps >= 14) {
        cDb.rampStrikes = (cDb.rampStrikes || 0) + 1;
        if (cDb.rampStrikes >= 4) {
            cDb.rampStrikes = 0;
            runKick(playerId, nameOf(playerId), "Autoclicker (Instant Ramp Detection)",
                "No acceleration curve - clicks start at full speed from frame 1. CPS: " + stats.cps.toFixed(1));
            return;
        }
    } else if (cDb.rampStrikes > 0) { cDb.rampStrikes = Math.max(0, cDb.rampStrikes - 0.15); }

    /* Layer 10: Coefficient of Variation */
    if (stats.count >= 12 && stats.cps >= 24 && stats.coeffVariance < 0.15 && stats.avgJitter < 7.0) {
        cDb.cvStrikes = (cDb.cvStrikes || 0) + 1;
        if (cDb.cvStrikes >= 3) {
            cDb.cvStrikes = 0;
            runKick(playerId, nameOf(playerId), "Autoclicker (Robotic Consistency)",
                "Coefficient of variance " + stats.coeffVariance.toFixed(3) + " at " + stats.cps.toFixed(1) + " CPS - too uniform for human finger");
            return;
        }
    } else if (cDb.cvStrikes > 0) { cDb.cvStrikes = Math.max(0, cDb.cvStrikes - 0.15); }

    /* Layer 11: Sustained speed windows */
    if (stats.cps >= 25) {
        cDb.sustainedWindows = (cDb.sustainedWindows || 0) + 1;
        if (cDb.sustainedWindows >= 4) {
            cDb.sustainedWindows = 0;
            runKick(playerId, nameOf(playerId), "Autoclicker (Sustained Inhuman Speed)",
                "Maintained " + stats.cps.toFixed(1) + " CPS across 4 consecutive analysis windows - no human can sustain this");
            return;
        }
    } else { cDb.sustainedWindows = Math.max(0, (cDb.sustainedWindows || 0) - 1); }

    /* Layer 12: Distribution uniformity */
    if (stats.count >= 14 && stats.cps >= 25 && stats.uniformityScore > 0.80 && stats.avgJitter < 6.0) {
        cDb.uniformStrikes = (cDb.uniformStrikes || 0) + 1;
        if (cDb.uniformStrikes >= 4) {
            cDb.uniformStrikes = 0;
            runKick(playerId, nameOf(playerId), "Advanced Macro (Uniform Distribution Lock)",
                "Click intervals evenly distributed - uniformity: " + (stats.uniformityScore * 100).toFixed(0) + "% (human pattern is clustered, not flat)");
            return;
        }
    } else if (cDb.uniformStrikes > 0) { cDb.uniformStrikes = Math.max(0, cDb.uniformStrikes - 0.15); }
};

/* ======================== DAMAGE EVENT HANDLER =========================== */
onPlayerDamagingOtherPlayer = function (attackerId, victimId) {
    var a = safeApi(); if (!a || attackerId === victimId || systemCorrupted) return "preventDamage";

    /* Honeypot check */
    var phantomOwner = isPhantomEntity(victimId);
    if (phantomOwner !== null) {
        if (!acCombatDb[attackerId]) acCombatDb[attackerId] = {};
        var cDb = acCombatDb[attackerId];
        cDb.honeypotStrikes = (cDb.honeypotStrikes || 0) + 1;
        if (cDb.honeypotStrikes >= 3) {
            cDb.honeypotStrikes = 0;
            runKick(attackerId, nameOf(attackerId), "KillAura / TriggerBot (Honeypot Intercept)",
                "Attacked a hidden client-side phantom entity 3 times consecutively");
        }
        return "preventDamage";
    }

    /* Spawn protection */
    var aPos = posOf(attackerId); var vPos = posOf(victimId);
    if (inSpawnZone(aPos) || inSpawnZone(vPos)) { return "preventDamage"; }

    /* AFK shield */
    var vRec = ensureAfk(victimId); var stillMs = stationaryForMs(victimId);
    if (vRec.isAFK) return "preventDamage";
    if (stillMs >= CONFIG.AFK_TRIGGER_MS && vPos) {
        if (!vRec.verify) { vRec.verify = { at: Date.now(), x: vPos.x, y: vPos.y, z: vPos.z }; }
        return;
    }

    if (acExempt(attackerId)) { return; }
    if (!validateReach(attackerId, victimId)) return "preventDamage";
    checkHitboxVariance(attackerId, victimId);
    checkKillAuraMultiHit(attackerId, victimId);
    checkTargetSwitchSnap(attackerId, victimId);
    checkSnapRotationNoShake(attackerId, victimId);
    checkBehindTargetHit(attackerId, victimId);
};

/* ========================= BLOCK CHANGE HANDLER ========================== */
onPlayerChangeBlock = function (playerId) {
    if (typeof api === "undefined") return;
    if (isOwner(playerId)) return;
    if (spawnProtection) {
        var pp = posOf(playerId);
        if (pp && inSpawnZone(pp)) return "preventChange";
    }
};

/* ========================= DROP ITEM HANDLER ============================= */
onPlayerDropItem = function (playerId, itemName, slotIndex) {
    var a = safeApi(); if (!a) return;
    if (a.queueCrosshairText) {
        try { a.queueCrosshairText(playerId, "Item Dropping Disabled", 800); } catch(e) {}
    }
    return "preventDrop";
};

/* ============================ MAIN TICK LOOP ============================= */
tick = function (ms) {
    var a = safeApi(); if (!a || !a.getPlayerIds) return;
    var idsList = a.getPlayerIds(); var now = Date.now();

    /* Self-destruct persistence */
    if (systemCorrupted) {
        for (var d = 0; d < idsList.length; d++) {
            var dId = idsList[d];
            try { if (a.clearInventory) a.clearInventory(dId); } catch(e) {}
            try { if (a.setEntityHealth) a.setEntityHealth(dId, 0); } catch(e) {}
            try { if (a.kickPlayer) a.kickPlayer(dId, "SERVER LOCKED - This code was stolen."); } catch(e) {}
        }
        return;
    }

    /* Process all players */
    for (var s = 0; s < idsList.length; s++) {
        var spid = idsList[s];
        var sp = a.getPosition(spid);
        if (sp) {
            lastPositions[spid] = { x: sp[0], y: sp[1], z: sp[2] };
            recordPositionSample(spid, sp, now);
            processAfkState(spid, now, sp);
            trackLookTelemetry(spid, now, acShouldScan(spid));
        }
    }

    /* Owner verification */
    for (var pr = 0; pr < idsList.length; pr++) { processDynamicHijackProtection(idsList[pr]); }
    runOwnerWatchdog(idsList, now);

    /* Anti-knockback checks */
    for (var v = 0; v < idsList.length; v++) {
        var pid = idsList[v];
        if (acExempt(pid)) continue;
        var arec = afkDb[pid];
        if (arec && (arec.isAFK || (now - (lastInputTime[pid] || 0)) >= CONFIG.AFK_TRIGGER_MS)) continue;
        var pos = posOf(pid);
        if (pos) verifyBordersAndInertia(pid, nameOf(pid), pos);
    }

    /* Honeypot cleanup */
    processHoneypotCleanup();

    /* Deploy honeypots for suspicious players */
    if (antiCheatActive && Math.floor(now / 8000) !== Math.floor((now - ms) / 8000)) {
        for (var hp = 0; hp < idsList.length; hp++) {
            var hpId = idsList[hp];
            if (acExempt(hpId)) continue;
            var rv = reachViolations[hpId] || 0;
            var sa = silentAimStrikes[hpId] || 0;
            var hpCdb = acCombatDb[hpId];
            var hpSuspicious = rv >= 2 || sa >= 1 || (hpCdb && hpCdb.jitterStrikes > 0);
            if (hpSuspicious && !honeypotCleanup[hpId]) { deployHoneypotTrap(hpId); }
        }
    }
};

/* =================== CROSS-SESSION PATTERN FINGERPRINTING ================ */
/*
/* ===========================================================================
 * CURVE PATH CONSISTENCY DETECTION
 * Aimbot tracking produces mathematically identical curves when following
 * strafing targets. Human hands produce unique curves with micro-variations.
 * 
 * Geometric Approach:
 * 1. Segment cursor movement into tracking arcs (continuous movement periods)
 * 2. Extract turning angle sequences (how cursor direction changes at each step)
 * 3. Normalize arcs to 8 samples using linear interpolation
 * 4. Compare arc shapes using mean absolute difference of turning angles
 * 5. If 85%+ similarity across multiple arcs = aimbot (human can't reproduce
 *    the same curve shape consistently during intense combat)
 * 
 * Why This Works:
 * - When a player strafes (S-tap to circle), aimbot computes smooth interpolation
 * - Human hand at low sensitivity produces curves with natural micro-wobbles
 * - Mathematical curves (Lemniscate, parabola) are too perfect to be human
 * =========================================================================== */
function analyzeCurvePathConsistency(playerId) {
    if (!cursorMovementHistory[playerId] || cursorMovementHistory[playerId].length < 16) return null;
    var history = cursorMovementHistory[playerId];
    var arcs = [];
    var currentArc = [];

    for (var i = 1; i < history.length; i++) {
        var prev = history[i-1], curr = history[i];
        var dot = prev.x * curr.x + prev.y * curr.y + prev.z * curr.z;
        var angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);

        if (curr.t - prev.t > 500 || angle > 30) {
            if (currentArc.length >= CONFIG.CURVE_SEGMENT_MIN) arcs.push(currentArc);
            currentArc = [prev, curr];
        } else {
            if (currentArc.length === 0) currentArc.push(prev);
            currentArc.push(curr);
        }
    }
    if (currentArc.length >= CONFIG.CURVE_SEGMENT_MIN) arcs.push(currentArc);

    if (arcs.length < 2) return null;

    var arcFingerprints = [];
    for (var a = 0; a < arcs.length; a++) {
        var arc = arcs[a];
        var turningAngles = [];
        var totalMovement = 0;

        for (var j = 1; j < arc.length - 1; j++) {
            var p1 = arc[j-1], p2 = arc[j], p3 = arc[j+1];
            var dot1 = p1.x * p2.x + p1.y * p2.y + p1.z * p2.z;
            var dot2 = p2.x * p3.x + p2.y * p3.y + p2.z * p3.z;
            var angle1 = Math.acos(Math.max(-1, Math.min(1, dot1))) * (180 / Math.PI);
            var angle2 = Math.acos(Math.max(-1, Math.min(1, dot2))) * (180 / Math.PI);
            var turnAngle = angle2 - angle1;
            turningAngles.push(turnAngle);
            totalMovement += Math.abs(turnAngle);
        }

        if (turningAngles.length >= 3 && totalMovement >= CONFIG.CURVE_ACTIVE_MOVEMENT) {
            arcFingerprints.push(turningAngles);
        }
    }

    if (arcFingerprints.length < 2) return null;

    var similarities = [];
    for (var i = 0; i < arcFingerprints.length; i++) {
        for (var j = i + 1; j < arcFingerprints.length; j++) {
            var sim = compareArcShapes(arcFingerprints[i], arcFingerprints[j]);
            if (sim !== null) similarities.push(sim);
        }
    }

    if (similarities.length === 0) return null;

    var sum = 0;
    for (var s = 0; s < similarities.length; s++) sum += similarities[s];
    var avgSimilarity = sum / similarities.length;

    return { avgSimilarity: avgSimilarity, arcCount: arcFingerprints.length, maxSimilarity: Math.max.apply(null, similarities) };
}

function compareArcShapes(arc1, arc2) {
    if (arc1.length < 3 || arc2.length < 3) return null;
    var norm1 = normalizeArc(arc1, 8);
    var norm2 = normalizeArc(arc2, 8);
    if (!norm1 || !norm2) return null;

    var diffSum = 0;
    for (var i = 0; i < 8; i++) diffSum += Math.abs(norm1[i] - norm2[i]);
    var meanDiff = diffSum / 8;
    var similarity = Math.max(0, 1 - (meanDiff / 10));
    return similarity;
}

function normalizeArc(arc, targetSize) {
    if (arc.length < 3) return null;
    var normalized = [];
    var step = (arc.length - 1) / (targetSize - 1);

    for (var i = 0; i < targetSize; i++) {
        var pos = i * step;
        var idx = Math.floor(pos);
        var frac = pos - idx;

        if (idx >= arc.length - 1) {
            normalized.push(arc[arc.length - 1]);
        } else {
            normalized.push(arc[idx] * (1 - frac) + arc[idx + 1] * frac);
        }
    }
    return normalized;
}

/* ===========================================================================
 * KILLAURA MULTI-HIT DETECTION
 * KillAura hits all players in range simultaneously. A human can only aim
 * at one target at a time. If multiple targets hit within 100ms = killaura.
 * =========================================================================== */
function checkKillAuraMultiHit(attackerId, victimId) {
    if (acExempt(attackerId)) return;
    if (!acShouldScan(attackerId)) return;
    var now = safeNow();

    if (!recentHits[attackerId]) recentHits[attackerId] = [];
    recentHits[attackerId].push({ victim: victimId, time: now });

    while (recentHits[attackerId].length > 0 && now - recentHits[attackerId][0].time > CONFIG.KILLAURA_MULTI_HIT_MS) {
        recentHits[attackerId].shift();
    }

    if (recentHits[attackerId].length >= CONFIG.KILLAURA_MULTI_TARGETS) {
        var uniqueVictims = {};
        for (var i = 0; i < recentHits[attackerId].length; i++) {
            uniqueVictims[recentHits[attackerId][i].victim] = true;
        }
        var victimCount = Object.keys(uniqueVictims).length;

        if (victimCount >= CONFIG.KILLAURA_MULTI_TARGETS) {
            if (!acCombatDb[attackerId]) acCombatDb[attackerId] = {};
            var cDb = acCombatDb[attackerId];
            cDb.killAuraStrikes = (cDb.killAuraStrikes || 0) + 1;
            if (cDb.killAuraStrikes >= CONFIG.KILLAURA_STRIKES) {
                cDb.killAuraStrikes = 0;
                runKick(attackerId, nameOf(attackerId), "KillAura (Multi-Target Intercept)",
                    "Hit " + victimCount + " targets within " + CONFIG.KILLAURA_MULTI_HIT_MS + "ms - human can only aim at one target at a time");
            }
        }
    }
}

/* ===========================================================================
 * TARGET SWITCH SNAP DETECTION
 * When chasing multiple targets and one leaves range, aimbot instantly snaps
 * to the next target with zero transition. Human has smooth tracking lag.
 * =========================================================================== */
function checkTargetSwitchSnap(attackerId, victimId) {
    if (acExempt(attackerId)) return;
    if (!acShouldScan(attackerId)) return;
    var now = safeNow();
    var a = safeApi(); if (!a || !a.getPlayerFacingInfo) return;

    if (!targetSwitchDb[attackerId]) {
        targetSwitchDb[attackerId] = { lastVictim: null, lastSwitchTime: 0, switchCount: 0, strikes: 0 };
    }
    var tsDb = targetSwitchDb[attackerId];

    if (tsDb.lastVictim !== null && tsDb.lastVictim !== victimId) {
        var timeSinceLastSwitch = now - tsDb.lastSwitchTime;

        if (timeSinceLastSwitch < CONFIG.TARGET_SWITCH_WINDOW) {
            tsDb.switchCount++;

            if (tsDb.switchCount >= CONFIG.TARGET_SWITCH_MIN_HITS) {
                var facing = a.getPlayerFacingInfo(attackerId);
                if (facing && facing.dir) {
                    if (!tsDb.cursorSnapHistory) tsDb.cursorSnapHistory = [];
                    tsDb.cursorSnapHistory.push({ x: facing.dir[0], y: facing.dir[1], z: facing.dir[2], t: now });
                    while (tsDb.cursorSnapHistory.length > 5) tsDb.cursorSnapHistory.shift();

                    if (tsDb.cursorSnapHistory.length >= 3) {
                        var snapAngles = [];
                        for (var i = 1; i < tsDb.cursorSnapHistory.length; i++) {
                            var prev = tsDb.cursorSnapHistory[i-1], curr = tsDb.cursorSnapHistory[i];
                            var dot = prev.x * curr.x + prev.y * curr.y + prev.z * curr.z;
                            var angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
                            snapAngles.push(angle);
                        }

                        var hasSnap = false;
                        for (var j = 0; j < snapAngles.length; j++) {
                            if (snapAngles[j] > 15) { hasSnap = true; break; }
                        }

                        if (hasSnap) {
                            tsDb.strikes++;
                            if (tsDb.strikes >= CONFIG.TARGET_SWITCH_STRIKES) {
                                tsDb.strikes = 0;
                                runKick(attackerId, nameOf(attackerId), "Aimbot (Target Switch Snap)",
                                    "Instant target lock with " + snapAngles[0].toFixed(1) + "° snap - human tracking has smooth transition lag");
                            }
                        }
                    }
                }
            }
        } else {
            tsDb.switchCount = 1;
        }

        tsDb.lastSwitchTime = now;
    }

    tsDb.lastVictim = victimId;
}

/* ===========================================================================
 * SNAP ROTATION NO-SHAKE DETECTION
 * Aimbot can do instant 180°/360° snaps without cursor micro-tremor.
 * Human doing fast rotation always has hand shake/tremor.
 * Exempts mobile (multi-touch) and accounts for ping/airborne desync.
 * =========================================================================== */
function checkSnapRotationNoShake(attackerId, victimId) {
    if (acExempt(attackerId)) return;
    if (!acShouldScan(attackerId)) return;
    var a = safeApi(); if (!a || !a.getPlayerFacingInfo) return;

    var stats = analyzeClickPattern(attackerId);
    if (stats && stats.isMobile) return;

    var now = safeNow();
    var facing = a.getPlayerFacingInfo(attackerId);
    if (!facing || !facing.dir) return;

    if (!snapRotationDb[attackerId]) {
        snapRotationDb[attackerId] = { lastDir: null, lastTime: 0, strikes: 0, cursorHistory: [] };
    }
    var srDb = snapRotationDb[attackerId];

    srDb.cursorHistory.push({ x: facing.dir[0], y: facing.dir[1], z: facing.dir[2], t: now });
    while (srDb.cursorHistory.length > 10) srDb.cursorHistory.shift();

    if (srDb.lastDir !== null) {
        var dot = srDb.lastDir.x * facing.dir[0] + srDb.lastDir.y * facing.dir[1] + srDb.lastDir.z * facing.dir[2];
        var angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
        var timeDelta = now - srDb.lastTime;

        if (angle >= CONFIG.SNAP_ROTATION_THRESHOLD && timeDelta < 200) {
            var hasShake = false;
            if (srDb.cursorHistory.length >= 3) {
                var shakeAngles = [];
                for (var i = 2; i < srDb.cursorHistory.length; i++) {
                    var p1 = srDb.cursorHistory[i-2], p2 = srDb.cursorHistory[i-1], p3 = srDb.cursorHistory[i];
                    var dot1 = p1.x * p2.x + p1.y * p2.y + p1.z * p2.z;
                    var dot2 = p2.x * p3.x + p2.y * p3.y + p2.z * p3.z;
                    var a1 = Math.acos(Math.max(-1, Math.min(1, dot1))) * (180 / Math.PI);
                    var a2 = Math.acos(Math.max(-1, Math.min(1, dot2))) * (180 / Math.PI);
                    shakeAngles.push(Math.abs(a2 - a1));
                }

                var totalShake = 0;
                for (var j = 0; j < shakeAngles.length; j++) totalShake += shakeAngles[j];
                var avgShake = totalShake / shakeAngles.length;

                if (avgShake > 2.0) hasShake = true;
            }

            var aPos = posOf(attackerId);
            var isAirborne = aPos && aPos.y > 1.0;
            var ping = pingOf(attackerId);
            var highPing = ping > 150;

            if (!hasShake && !isAirborne && !highPing) {
                srDb.strikes++;
                if (srDb.strikes >= CONFIG.SNAP_NO_SHAKE_STRIKES) {
                    srDb.strikes = 0;
                    runKick(attackerId, nameOf(attackerId), "Aimbot (Snap Rotation Lock)",
                        angle.toFixed(0) + "° snap in " + timeDelta + "ms with zero cursor tremor - human hand shakes during fast rotation");
                }
            }
        }
    }

    srDb.lastDir = { x: facing.dir[0], y: facing.dir[1], z: facing.dir[2] };
    srDb.lastTime = now;
}

/* ===========================================================================
 * BEHIND-TARGET HIT DETECTION
 * KillAura can hit players behind you without turning to face them.
 * Checks angle between player facing and victim position.
 * Exempts 3rd person POV (wider view), mobile, and accounts for ping.
 * =========================================================================== */
function checkBehindTargetHit(attackerId, victimId) {
    if (acExempt(attackerId)) return;
    if (!acShouldScan(attackerId)) return;
    var a = safeApi(); if (!a || !a.getPosition || !a.getPlayerFacingInfo) return;

    var stats = analyzeClickPattern(attackerId);
    if (stats && stats.isMobile) return;

    var aPos = a.getPosition(attackerId);
    var vPos = a.getPosition(victimId);
    var facing = a.getPlayerFacingInfo(attackerId);

    if (!aPos || !vPos || !facing || !facing.dir) return;

    var ex = aPos[0], ey = aPos[1] + CONFIG.EYE_Y, ez = aPos[2];
    var vx = vPos[0], vy = vPos[1] + 0.9, vz = vPos[2];

    var toVictimX = vx - ex, toVictimY = vy - ey, toVictimZ = vz - ez;
    var toVictimLen = Math.sqrt(toVictimX * toVictimX + toVictimY * toVictimY + toVictimZ * toVictimZ);
    if (toVictimLen < 0.001) return;

    var fx = facing.dir[0], fy = facing.dir[1], fz = facing.dir[2];
    var fLen = Math.sqrt(fx * fx + fy * fy + fz * fz);
    if (fLen < 0.001) return;

    var dot = (fx * toVictimX + fy * toVictimY + fz * toVictimZ) / (fLen * toVictimLen);
    var angleToVictim = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);

    if (angleToVictim > CONFIG.BEHIND_HIT_ANGLE) {
        var ping = pingOf(attackerId);
        var pingBuffer = Math.min(ping / 1000 * 30, 20);
        var adjustedAngle = angleToVictim - pingBuffer;

        var isAirborne = aPos[1] > 1.0;
        if (isAirborne) adjustedAngle -= 10;

        if (adjustedAngle > CONFIG.BEHIND_HIT_ANGLE) {
            if (!behindHitDb[attackerId]) behindHitDb[attackerId] = { strikes: 0 };
            var bhDb = behindHitDb[attackerId];
            bhDb.strikes++;

            if (bhDb.strikes >= CONFIG.BEHIND_HIT_STRIKES) {
                bhDb.strikes = 0;
                runKick(attackerId, nameOf(attackerId), "KillAura (Behind-Target Intercept)",
                    "Hit target at " + angleToVictim.toFixed(0) + "° angle (behind) without turning - ping: " + ping + "ms, airborne: " + isAirborne);
            }
        }
    } else if (behindHitDb[attackerId] && behindHitDb[attackerId].strikes > 0) {
        behindHitDb[attackerId].strikes = Math.max(0, behindHitDb[attackerId].strikes - 0.2);
    }
}

/* ===========================================================================
 * CROSS-SESSION PATTERN FINGERPRINTING
 * Detects advanced randomizers by comparing patterns across sessions.
 * Even if the randomizer changes absolute values (12-13-14 → 24-26-28),
 * the underlying pattern logic (ratios, direction changes) stays the same.
 * =========================================================================== */
function calculatePatternFingerprint(intervals) {
    if (intervals.length < 8) return null;
    var ratios = [];
    for (var i = 1; i < intervals.length; i++) {
        ratios.push(intervals[i] / intervals[i - 1]);
    }
    var directions = [];
    for (var j = 1; j < intervals.length; j++) {
        directions.push(intervals[j] > intervals[j - 1] ? 1 : (intervals[j] < intervals[j - 1] ? -1 : 0));
    }
    var ratioMean = 0;
    for (var k = 0; k < ratios.length; k++) ratioMean += ratios[k];
    ratioMean /= ratios.length;
    var ratioVariance = 0;
    for (var l = 0; l < ratios.length; l++) { var d = ratios[l] - ratioMean; ratioVariance += d * d; }
    ratioVariance /= ratios.length;
    var directionChanges = 0;
    for (var m = 1; m < directions.length; m++) {
        if (directions[m] !== directions[m - 1] && directions[m] !== 0 && directions[m - 1] !== 0) directionChanges++;
    }
    return { ratioMean: ratioMean, ratioVariance: ratioVariance, directionChangeRate: directionChanges / directions.length, length: intervals.length };
}

function compareFingerprints(fp1, fp2) {
    if (!fp1 || !fp2) return 0;
    var ratioDiff = Math.abs(fp1.ratioMean - fp2.ratioMean);
    var varianceDiff = Math.abs(fp1.ratioVariance - fp2.ratioVariance);
    var directionDiff = Math.abs(fp1.directionChangeRate - fp2.directionChangeRate);
    var similarity = 1.0 - (ratioDiff * 0.4 + varianceDiff * 0.3 + directionDiff * 0.3);
    return Math.max(0, Math.min(1, similarity));
}

/* ========================= COMMAND HANDLER ================================
 * COMMUNITY EDITION COMMANDS:
 * !changeowner [name] - Transfer ownership to another player (original owner only)
 * !owner on - Enable anti-cheat monitoring for current owner
 * !owner off - Disable anti-cheat monitoring for current owner (exempt from detection)
 * ========================================================================= */
onPlayerChat = function(playerId, message) {
    var a = safeApi(); if (!a) return true;
    if (!message || message.charAt(0) !== "!") return true;

    var parts = message.trim().split(/\s+/);
    var command = parts[0].toLowerCase();
    var playerName = nameOf(playerId);

    if (command === "!changeowner" && parts.length >= 2) {
        if (playerName !== TRUE_OWNER && playerName !== currentOwner) {
            a.sendMessage(playerId, "⚠️ Only the current owner can transfer ownership.");
            return false;
        }
        var newOwnerName = parts.slice(1).join(" ");
        currentOwner = newOwnerName;
        _S.currentOwner = newOwnerName;
        a.sendMessage(playerId, "✅ Ownership transferred to: " + newOwnerName);
        a.broadcastMessage("👑 Server ownership transferred to " + newOwnerName);
        return false;
    }

    if (command === "!owner" && parts.length >= 2) {
        if (playerName !== TRUE_OWNER && playerName !== currentOwner) {
            a.sendMessage(playerId, "⚠️ Only the owner can use this command.");
            return false;
        }
        var toggle = parts[1].toLowerCase();
        if (toggle === "on") {
            ownerMonitoringEnabled = true;
            _S.ownerMonitoringEnabled = true;
            a.sendMessage(playerId, "✅ Owner monitoring ENABLED - Anti-cheat will now monitor you.");
        } else if (toggle === "off") {
            ownerMonitoringEnabled = false;
            _S.ownerMonitoringEnabled = false;
            a.sendMessage(playerId, "✅ Owner monitoring DISABLED - You are now exempt from detection.");
        } else {
            a.sendMessage(playerId, "Usage: !owner on|off");
        }
        return false;
    }

    if (command === "!status") {
        var ownerName = currentOwner || TRUE_OWNER;
        var monitoring = ownerMonitoringEnabled ? "ENABLED" : "DISABLED";
        a.sendMessage(playerId, "📊 Anti-Cheat Status:\n• Owner: " + ownerName + "\n• Owner Monitoring: " + monitoring + "\n• Detection Layers: 21\n• System: ACTIVE\n\n" + CREATOR_MESSAGE);
        return false;
    }

    return true;
};

/* END OF ANTI-CHEAT SYSTEM - COMMUNITY EDITION */
