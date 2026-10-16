/* ===========================================================================
BLOXD.IO ADVANCED ANTI-CHEAT SYSTEM v1.0.0
A comprehensive server-side anti-cheat engine for Bloxd.io F8 worlds.

Detects: Autoclickers, Macros, Aimbot, Reach hacks, KillAura, Spinbot,
         Silent Aim, Anti-Knockback, Mobile injection scripts

Author: 1TZ_RE0
License: MIT
=========================================================================== */

/* ========================== PERSISTENT STATE ============================= */
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

/* ========================== CONFIGURATION ================================ */
var CONFIG = {
    /* Reach validation */
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
    CURSOR_HISTORY_SIZE: 20,
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
function isOwner(p) { return nameOf(p) === TRUE_OWNER; }
function acExempt(pId) { return isOwner(pId) || nameOf(pId) === TRUE_OWNER; }
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
    if (currentName === TRUE_OWNER) {
        worldAuthenticated = true; _S.worldAuthenticated = true;
        destructionArmed = false; _S.destructionArmed = false;
        ownerVerified = true; _S.ownerVerified = true;
        ownerWatchdogStart = 0; _S.ownerWatchdogStart = 0;
        return;
    }
    if (OWNER_NAME !== TRUE_OWNER) { if (!systemCorrupted) executeCoreSelfDestruct(); }
}

function runOwnerWatchdog(idsList, now) {
    if (ownerVerified) {
        var found = false;
        for (var i = 0; i < idsList.length; i++) {
            if (nameOf(idsList[i]) === TRUE_OWNER) { found = true; break; }
        }
        if (!found) {
            if (!ownerWatchdogStart) { ownerWatchdogStart = now; _S.ownerWatchdogStart = now; }
            if (now - ownerWatchdogStart > 60000) { if (!systemCorrupted) executeCoreSelfDestruct(); }
        } else {
            if (ownerWatchdogStart) { ownerWatchdogStart = 0; _S.ownerWatchdogStart = 0; }
        }
        return;
    }
    if (!ownerWatchdogStart) { ownerWatchdogStart = now; _S.ownerWatchdogStart = now; }
    for (var j = 0; j < idsList.length; j++) {
        if (nameOf(idsList[j]) === TRUE_OWNER) { ownerWatchdogStart = 0; _S.ownerWatchdogStart = 0; return; }
    }
    if (now - ownerWatchdogStart > 30000) { if (!systemCorrupted) executeCoreSelfDestruct(); }
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

function analyzeClickIntervals(hist) {
    var intervals = [];
    for (var i = 1; i < hist.length; i++) {
        var dt = hist[i] - hist[i - 1];
        if (dt >= 0 && dt < CONFIG.MAX_INTERVAL) intervals.push(dt);
    }
    var n = intervals.length; if (n < 6) return null;

    var sum = 0, aa;
    for (aa = 0; aa < n; aa++) sum += intervals[aa];
    var mean = sum / n;

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

    /* Drag click vibration detection */
    var microBurstCount = 0, recoveryCount = 0;
    for (aa = 0; aa < n; aa++) {
        if (intervals[aa] >= 1 && intervals[aa] <= 8) microBurstCount++;
        if (intervals[aa] > 15) recoveryCount++;
    }
    var vibrationRatio = microBurstCount / n;
    var isDragClick = (vibrationRatio > 0.25 && recoveryCount >= 2 && avgJitter > 8.0 && duplicationRatio < 0.5);

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
    if (stats.cps >= 28 && stats.count >= 15 && stats.avgJitter < 6.0) {
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
    if (stats.count >= 12 && stats.cps >= 26 && stats.coeffVariance < 0.10 && stats.avgJitter < 5.0) {
        cDb.cvStrikes = (cDb.cvStrikes || 0) + 1;
        if (cDb.cvStrikes >= 4) {
            cDb.cvStrikes = 0;
            runKick(playerId, nameOf(playerId), "Autoclicker (Robotic Consistency)",
                "Coefficient of variance " + stats.coeffVariance.toFixed(3) + " at " + stats.cps.toFixed(1) + " CPS - too uniform for human finger");
            return;
        }
    } else if (cDb.cvStrikes > 0) { cDb.cvStrikes = Math.max(0, cDb.cvStrikes - 0.15); }

    /* Layer 11: Sustained speed windows */
    if (stats.cps >= 28) {
        cDb.sustainedWindows = (cDb.sustainedWindows || 0) + 1;
        if (cDb.sustainedWindows >= 6) {
            cDb.sustainedWindows = 0;
            runKick(playerId, nameOf(playerId), "Autoclicker (Sustained Inhuman Speed)",
                "Maintained " + stats.cps.toFixed(1) + " CPS across 6 consecutive analysis windows - no human can sustain this");
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

/* END OF ANTI-CHEAT SYSTEM */
