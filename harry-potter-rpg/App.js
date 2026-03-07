/**
 * Harry Potter 16-bit RPG
 * Expo React Native top-down dungeon crawler
 *
 * Controls:
 *   D-Pad  → move / melee attack (bumping into enemy)
 *   Spell buttons → select spell
 *   CAST button → fire spell in facing direction
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';

// ─── Screen dimensions & tile size ───────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');
const TS = 32; // tile size in px
const VP_W = Math.floor(SW / TS);          // viewport columns
const VP_H = Math.floor((SH - 250) / TS); // viewport rows (leave room for HUD)
const MAP_W = 36;
const MAP_H = 24;

// ─── Tile types ───────────────────────────────────────────────────────────────
const T = { W: 0, F: 1, S: 2 }; // Wall · Floor · Stairs

// ─── Enemy definitions ────────────────────────────────────────────────────────
const ENEMY_STATS = {
  spider:      { hp: 20,  dmg: 5,  delay: 18, xp: 10,  icon: '🕷️', color: '#8B4513' },
  dementor:    { hp: 45,  dmg: 12, delay: 13, xp: 25,  icon: '👻', color: '#5555bb' },
  death_eater: { hp: 70,  dmg: 18, delay: 10, xp: 50,  icon: '🧙', color: '#cc2020' },
  voldemort:   { hp: 180, dmg: 28, delay: 7,  xp: 300, icon: '🐍', color: '#20cc55' },
};

// ─── Spells ───────────────────────────────────────────────────────────────────
const SPELL_LIST = [
  { id: 'exp', label: 'Expello',  cost: 12, dmg: 28,  color: '#FF8C00' },
  { id: 'stu', label: 'Stupefy',  cost: 22, dmg: 45,  color: '#1E90FF' },
  { id: 'ava', label: 'Avada K!', cost: 48, dmg: 110, color: '#00FF44' },
];

// ─── Level generator (BSP-style rooms + corridors) ───────────────────────────
function genLevel(lvl) {
  const grid = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(T.W));
  const rooms = [];

  for (let tries = 0; tries < 80 && rooms.length < 8; tries++) {
    const w = 4 + Math.floor(Math.random() * 5);
    const h = 3 + Math.floor(Math.random() * 4);
    const x = 1 + Math.floor(Math.random() * (MAP_W - w - 2));
    const y = 1 + Math.floor(Math.random() * (MAP_H - h - 2));
    // Reject overlapping rooms (with 1-tile buffer)
    if (rooms.some(r => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y)) continue;
    rooms.push({ x, y, w, h });
    for (let ry = y; ry < y + h; ry++)
      for (let rx = x; rx < x + w; rx++)
        grid[ry][rx] = T.F;
  }

  // Fallback: open map if room generation failed
  if (rooms.length < 2) {
    for (let ry = 1; ry < MAP_H - 1; ry++)
      for (let rx = 1; rx < MAP_W - 1; rx++)
        grid[ry][rx] = T.F;
    rooms.push(
      { x: 1, y: 1, w: 8, h: 6 },
      { x: MAP_W - 10, y: MAP_H - 8, w: 8, h: 6 }
    );
  }

  // Connect rooms with L-shaped corridors
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1], b = rooms[i];
    let cx = a.x + Math.floor(a.w / 2), cy = a.y + Math.floor(a.h / 2);
    const tx = b.x + Math.floor(b.w / 2), ty = b.y + Math.floor(b.h / 2);
    while (cx !== tx) { grid[cy][cx] = T.F; cx += cx < tx ? 1 : -1; }
    while (cy !== ty) { grid[cy][cx] = T.F; cy += cy < ty ? 1 : -1; }
  }

  // Place stairs in last room
  const lr = rooms[rooms.length - 1];
  grid[lr.y + Math.floor(lr.h / 2)][lr.x + Math.floor(lr.w / 2)] = T.S;

  // Populate enemies and items
  const enemies = [];
  const items = [];

  rooms.forEach((r, i) => {
    if (i === 0) return; // starting room is safe

    const isBossRoom = i === rooms.length - 1 && lvl >= 2;

    if (isBossRoom) {
      const s = ENEMY_STATS.voldemort;
      enemies.push({
        id: 'boss', type: 'voldemort',
        x: r.x + Math.floor(r.w / 2), y: r.y + Math.floor(r.h / 2),
        hp: s.hp + lvl * 40, maxHp: s.hp + lvl * 40,
        dmg: s.dmg + lvl * 3, delay: s.delay, xp: s.xp,
        timer: 0,
      });
    } else {
      const pool =
        lvl < 2 ? ['spider', 'dementor'] :
        lvl < 4 ? ['spider', 'dementor', 'death_eater'] :
                  ['dementor', 'death_eater'];
      const n = 1 + Math.floor(Math.random() * Math.min(2, lvl));
      for (let j = 0; j < n; j++) {
        const type = pool[Math.floor(Math.random() * pool.length)];
        const s = ENEMY_STATS[type];
        enemies.push({
          id: `e${i}${j}`, type,
          x: r.x + 1 + Math.floor(Math.random() * Math.max(1, r.w - 2)),
          y: r.y + 1 + Math.floor(Math.random() * Math.max(1, r.h - 2)),
          hp: s.hp, maxHp: s.hp,
          dmg: s.dmg, delay: s.delay, xp: s.xp,
          timer: Math.floor(Math.random() * s.delay),
        });
      }
    }

    if (Math.random() > 0.45) {
      items.push({
        id: `i${i}`,
        type: Math.random() > 0.5 ? 'hp_potion' : 'mp_potion',
        x: r.x + Math.floor(r.w / 2), y: r.y + 1,
      });
    }
  });

  const sr = rooms[0];
  return {
    grid, rooms, enemies, items,
    start: { x: sr.x + Math.floor(sr.w / 2), y: sr.y + Math.floor(sr.h / 2) },
  };
}

// ─── Title Screen ─────────────────────────────────────────────────────────────
function TitleScreen({ onStart }) {
  return (
    <View style={s.center}>
      <Text style={s.titleBig}>⚡ HARRY POTTER ⚡</Text>
      <Text style={s.titleSub}>16-BIT RPG QUEST</Text>
      <View style={s.divider} />
      <Text style={s.titleDesc}>
        Hogwarts is under attack!{'\n'}
        Dark forces have invaded the castle.{'\n'}
        Defeat Lord Voldemort to save the wizarding world!
      </Text>
      <View style={s.divider} />
      <Text style={s.titleHint}>
        🕹️  D-PAD — Move / Melee attack{'\n'}
        ⚡  Select spell + CAST — Magic{'\n'}
        🪜  Reach stairs to advance floors
      </Text>
      <TouchableOpacity onPress={onStart} style={s.bigBtn}>
        <Text style={s.bigBtnTxt}>▶  BEGIN QUEST</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── End Screen ───────────────────────────────────────────────────────────────
function EndScreen({ win, score, onReplay }) {
  return (
    <View style={s.center}>
      <Text style={[s.titleBig, { color: win ? '#ffd700' : '#cc4444' }]}>
        {win ? '🏆 VICTORY!' : '💀 GAME OVER'}
      </Text>
      <Text style={s.titleDesc}>
        {win
          ? 'You defeated Lord Voldemort!\nHogwarts is saved!'
          : 'The Dark Lord prevails…\nTry again, young wizard!'}
      </Text>
      <Text style={[s.titleSub, { marginTop: 16 }]}>Score: {score || 0}</Text>
      <TouchableOpacity onPress={onReplay} style={s.bigBtn}>
        <Text style={s.bigBtnTxt}>↺  PLAY AGAIN</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Game Screen ──────────────────────────────────────────────────────────────
function GameScreen({ onEnd }) {
  // All mutable game state lives in a ref to avoid stale closures in the game loop
  const gsRef = useRef(null);
  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender(n => n + 1), []);

  // selectedSpell must be accessible from the game loop ref too
  const [selectedSpell, setSelectedSpell] = useState(0);
  const spellRef = useRef(0);

  // Keep onEnd stable inside the loop
  const onEndRef = useRef(onEnd);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);

  // ── Level initialiser ──────────────────────────────────────────────────────
  const initLevel = useCallback((lvl, prevScore) => {
    const ld = genLevel(lvl);
    gsRef.current = {
      lvl,
      player: {
        x: ld.start.x, y: ld.start.y,
        hp: 100, maxHp: 100 + (lvl - 1) * 15,
        mp: 80,  maxMp: 80  + (lvl - 1) * 15,
        score: prevScore || 0,
        facingX: 1, facingY: 0,
      },
      ld,
      msgs: [`⚡ Hogwarts Floor ${lvl}/3 — find the stairs 🪜`],
    };
    rerender();
  }, [rerender]);

  useEffect(() => { initLevel(1, 0); }, [initLevel]);

  // ── Game loop (enemy AI) ───────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const gs = gsRef.current;
      if (!gs) return;
      const { player: p, ld } = gs;

      let dmgTaken = 0;
      const loopMsgs = [];

      const newEnemies = ld.enemies.map(e => {
        const ne = { ...e, timer: e.timer + 1 };
        if (ne.timer < ne.delay) return ne;
        ne.timer = 0;

        const md = Math.abs(ne.x - p.x) + Math.abs(ne.y - p.y);
        if (md > 12) return ne; // too far, dormant

        if (md === 1) {
          // adjacent → attack player
          dmgTaken += ne.dmg;
          const name = ne.type === 'voldemort' ? '🐍 Voldemort' : ne.type;
          loopMsgs.push(`💥 ${name} attacks! -${ne.dmg}HP`);
          return ne;
        }

        // move one step toward player
        const dx = p.x - ne.x, dy = p.y - ne.y;
        let nx = ne.x, ny = ne.y;
        if (Math.abs(dx) >= Math.abs(dy)) nx += dx > 0 ? 1 : -1;
        else ny += dy > 0 ? 1 : -1;

        if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H && ld.grid[ny][nx] !== T.W) {
          const blocked = ld.enemies.some(oe => oe.id !== ne.id && oe.x === nx && oe.y === ny);
          if (!blocked && !(nx === p.x && ny === p.y)) { ne.x = nx; ne.y = ny; }
        }
        return ne;
      });

      const newHp = Math.max(0, p.hp - dmgTaken);
      gsRef.current = {
        ...gs,
        player: { ...p, hp: newHp },
        ld: { ...ld, enemies: newEnemies },
        msgs: [...gs.msgs, ...loopMsgs].slice(-4),
      };
      rerender();

      if (newHp <= 0) onEndRef.current({ win: false, score: p.score });
    }, 110);
    return () => clearInterval(id);
  }, [rerender]);

  // ── Player movement / melee ────────────────────────────────────────────────
  const move = useCallback((dx, dy) => {
    const gs = gsRef.current;
    if (!gs) return;
    const { player: p, ld, lvl } = gs;

    const nx = p.x + dx, ny = p.y + dy;
    if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) return;
    if (ld.grid[ny][nx] === T.W) return;

    // Bump into enemy → melee attack
    const eIdx = ld.enemies.findIndex(e => e.x === nx && e.y === ny);
    if (eIdx !== -1) {
      const e = ld.enemies[eIdx];
      const dmg = 10 + Math.floor(Math.random() * 8);
      const newEHp = e.hp - dmg;
      const msgs = [...gs.msgs, `⚔️ Melee: ${dmg} dmg on ${e.type}!`].slice(-4);
      let newEnemies;
      let newScore = p.score;

      if (newEHp <= 0) {
        newEnemies = ld.enemies.filter((_, i) => i !== eIdx);
        newScore += e.xp;
        msgs.push(`✨ ${e.type} defeated! +${e.xp}XP`);
        if (e.type === 'voldemort') { onEndRef.current({ win: true, score: newScore }); return; }
      } else {
        newEnemies = ld.enemies.map((en, i) => i === eIdx ? { ...en, hp: newEHp } : en);
      }

      gsRef.current = {
        ...gs,
        player: { ...p, score: newScore, facingX: dx, facingY: dy },
        ld: { ...ld, enemies: newEnemies },
        msgs: msgs.slice(-4),
      };
      rerender();
      return;
    }

    // Move player
    let newPlayer = { ...p, x: nx, y: ny, facingX: dx, facingY: dy };
    let newItems = ld.items;
    const msgs = [...gs.msgs];

    // Stairs
    if (ld.grid[ny][nx] === T.S) {
      if (lvl >= 3) { onEndRef.current({ win: true, score: p.score }); return; }
      initLevel(lvl + 1, p.score);
      return;
    }

    // Pick up item
    const iIdx = ld.items.findIndex(it => it.x === nx && it.y === ny);
    if (iIdx !== -1) {
      const item = ld.items[iIdx];
      if (item.type === 'hp_potion') {
        newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + 35);
        msgs.push('🧪 HP Potion! +35 HP');
      } else {
        newPlayer.mp = Math.min(newPlayer.maxMp, newPlayer.mp + 35);
        msgs.push('🔮 Mana Potion! +35 MP');
      }
      newItems = ld.items.filter((_, i) => i !== iIdx);
    }

    gsRef.current = {
      ...gs,
      player: newPlayer,
      ld: { ...ld, items: newItems },
      msgs: msgs.slice(-4),
    };
    rerender();
  }, [initLevel, rerender]);

  // ── Spell cast ────────────────────────────────────────────────────────────
  const castSpell = useCallback(() => {
    const gs = gsRef.current;
    if (!gs) return;
    const { player: p, ld } = gs;
    const spell = SPELL_LIST[spellRef.current];

    const msgs = [...gs.msgs];
    if (p.mp < spell.cost) {
      gsRef.current = { ...gs, msgs: [...msgs, `❌ Not enough MP for ${spell.label}!`].slice(-4) };
      rerender();
      return;
    }

    // Ray cast in facing direction (up to 8 tiles)
    const fdx = p.facingX || 1, fdy = p.facingY || 0;
    let hit = null;
    for (let i = 1; i <= 8; i++) {
      const tx = p.x + fdx * i, ty = p.y + fdy * i;
      if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H || ld.grid[ty][tx] === T.W) break;
      const e = ld.enemies.find(e => e.x === tx && e.y === ty);
      if (e) { hit = e; break; }
    }

    const newMp = p.mp - spell.cost;
    let newEnemies = ld.enemies;
    let newScore = p.score;

    if (hit) {
      const dmg = spell.dmg + Math.floor(Math.random() * 15);
      const newEHp = hit.hp - dmg;
      msgs.push(`⚡ ${spell.label}: ${dmg} dmg on ${hit.type}!`);

      if (newEHp <= 0) {
        newEnemies = ld.enemies.filter(e => e.id !== hit.id);
        newScore += hit.xp;
        msgs.push(`✨ ${hit.type} defeated! +${hit.xp}XP`);
        if (hit.type === 'voldemort') { onEndRef.current({ win: true, score: newScore }); return; }
      } else {
        newEnemies = ld.enemies.map(e => e.id === hit.id ? { ...e, hp: newEHp } : e);
      }
    } else {
      msgs.push(`${spell.label}! (no target in path)`);
    }

    gsRef.current = {
      ...gs,
      player: { ...p, mp: newMp, score: newScore },
      ld: { ...ld, enemies: newEnemies },
      msgs: msgs.slice(-4),
    };
    rerender();
  }, [rerender]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!gsRef.current?.player) {
    return (
      <View style={s.center}>
        <Text style={{ color: '#ffd700', fontSize: 16 }}>Loading Hogwarts…</Text>
      </View>
    );
  }

  const { player: p, ld, lvl, msgs } = gsRef.current;
  const camX = Math.max(0, Math.min(p.x - Math.floor(VP_W / 2), MAP_W - VP_W));
  const camY = Math.max(0, Math.min(p.y - Math.floor(VP_H / 2), MAP_H - VP_H));

  const hpPct = Math.max(0, p.hp / p.maxHp);
  const mpPct = Math.max(0, p.mp / p.maxMp);
  const hpCol = hpPct > 0.5 ? '#44cc44' : hpPct > 0.25 ? '#cccc44' : '#cc4444';
  const curSpell = SPELL_LIST[selectedSpell];

  // Build tile views
  const tileViews = [];
  for (let row = 0; row < VP_H; row++) {
    for (let col = 0; col < VP_W; col++) {
      const mx = col + camX, my = row + camY;
      if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) continue;
      const tile = ld.grid[my][mx];
      const isWall = tile === T.W;

      let icon = null;
      if (!isWall) {
        if (tile === T.S) icon = '🪜';
        if (mx === p.x && my === p.y) {
          icon = '⚡';
        } else {
          const e = ld.enemies.find(e => e.x === mx && e.y === my);
          if (e) {
            icon = ENEMY_STATS[e.type].icon;
          } else {
            const it = ld.items.find(it => it.x === mx && it.y === my);
            if (it) icon = it.type === 'hp_potion' ? '🧪' : '🔮';
          }
        }
      }

      tileViews.push(
        <View
          key={`${col}-${row}`}
          style={{
            position: 'absolute',
            left: col * TS, top: row * TS,
            width: TS, height: TS,
            backgroundColor: isWall ? '#0e0630' : '#130d07',
            borderWidth: 0.5,
            borderColor: isWall ? '#16093a' : '#1c1208',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {icon ? <Text style={{ fontSize: 18 }}>{icon}</Text> : null}
        </View>
      );
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#050510' }}>

      {/* ── HUD ── */}
      <View style={s.hud}>
        <View style={{ flex: 1 }}>
          <Text style={s.hudLabel}>HP  {p.hp}/{p.maxHp}</Text>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${hpPct * 100}%`, backgroundColor: hpCol }]} />
          </View>
        </View>
        <View style={s.hudMid}>
          <Text style={s.hudFloor}>⚡ Floor {lvl}/3</Text>
          <Text style={s.hudScore}>Score: {p.score}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={s.hudLabel}>MP  {p.mp}/{p.maxMp}</Text>
          <View style={[s.barBg, { alignSelf: 'stretch' }]}>
            <View style={[s.barFill, { width: `${mpPct * 100}%`, backgroundColor: '#4488ff' }]} />
          </View>
        </View>
      </View>

      {/* ── Viewport ── */}
      <View
        style={{
          alignSelf: 'center',
          width: VP_W * TS,
          height: VP_H * TS,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {tileViews}
      </View>

      {/* ── Message log ── */}
      <View style={s.msgBox}>
        {msgs.slice(-2).map((m, i) => (
          <Text
            key={i}
            style={[s.msgText, { color: i === msgs.slice(-2).length - 1 ? '#d0c0a0' : '#5a4a30' }]}
          >
            {m}
          </Text>
        ))}
      </View>

      {/* ── Controls ── */}
      <View style={s.controls}>

        {/* D-Pad */}
        <View>
          <View style={s.dRow}>
            <TouchableOpacity onPress={() => move(0, -1)} style={s.dBtn}>
              <Text style={s.dTxt}>▲</Text>
            </TouchableOpacity>
          </View>
          <View style={s.dRow}>
            <TouchableOpacity onPress={() => move(-1, 0)} style={s.dBtn}>
              <Text style={s.dTxt}>◀</Text>
            </TouchableOpacity>
            <View style={[s.dBtn, { backgroundColor: '#180830' }]}>
              <Text style={{ fontSize: 16 }}>⚡</Text>
            </View>
            <TouchableOpacity onPress={() => move(1, 0)} style={s.dBtn}>
              <Text style={s.dTxt}>▶</Text>
            </TouchableOpacity>
          </View>
          <View style={s.dRow}>
            <TouchableOpacity onPress={() => move(0, 1)} style={s.dBtn}>
              <Text style={s.dTxt}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spell panel */}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 }}>
            {SPELL_LIST.map((sp, i) => (
              <TouchableOpacity
                key={sp.id}
                onPress={() => { setSelectedSpell(i); spellRef.current = i; }}
                style={[
                  s.spellBtn,
                  {
                    borderColor: sp.color,
                    backgroundColor: selectedSpell === i ? sp.color + '33' : '#0d0820',
                  },
                ]}
              >
                <Text style={{ color: sp.color, fontSize: 9, fontWeight: 'bold' }}>{sp.label}</Text>
                <Text style={{ color: '#888', fontSize: 7 }}>{sp.cost}MP·{sp.dmg}dmg</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={castSpell}
            style={[s.castBtn, { borderColor: curSpell.color, backgroundColor: curSpell.color + '22' }]}
          >
            <Text style={{ color: curSpell.color, fontSize: 14, fontWeight: 'bold' }}>
              ⚡ CAST {curSpell.label}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('title');
  const [endData, setEndData] = useState(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#050510' }}>
      {screen === 'title' && (
        <TitleScreen onStart={() => setScreen('game')} />
      )}
      {screen === 'game' && (
        <GameScreen
          onEnd={data => { setEndData(data); setScreen('end'); }}
        />
      )}
      {screen === 'end' && (
        <EndScreen
          win={endData?.win}
          score={endData?.score}
          onReplay={() => { setEndData(null); setScreen('game'); }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#050510',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  titleBig: {
    color: '#ffd700',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
  titleSub: {
    color: '#ffd700',
    fontSize: 14,
    letterSpacing: 6,
    marginTop: 4,
    textAlign: 'center',
  },
  titleDesc: {
    color: '#d0c0a0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 22,
    marginVertical: 12,
  },
  titleHint: {
    color: '#8a7a60',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: 8,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#3a1860',
    marginVertical: 8,
  },
  bigBtn: {
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderWidth: 2,
    borderColor: '#ffd700',
    backgroundColor: '#1a0a2e',
  },
  bigBtnTxt: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // HUD
  hud: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#0d0820',
    borderBottomWidth: 1,
    borderBottomColor: '#3a1860',
    alignItems: 'center',
  },
  hudLabel: { color: '#aaa', fontSize: 9, marginBottom: 2 },
  hudMid: { paddingHorizontal: 10, alignItems: 'center' },
  hudFloor: { color: '#ffd700', fontSize: 11, fontWeight: 'bold' },
  hudScore: { color: '#aaa', fontSize: 9 },
  barBg: { height: 6, backgroundColor: '#1a0a2e', borderRadius: 3, overflow: 'hidden', minWidth: 60 },
  barFill: { height: 6, borderRadius: 3 },
  // Messages
  msgBox: {
    backgroundColor: '#0a0618',
    paddingHorizontal: 8,
    paddingVertical: 3,
    minHeight: 40,
    justifyContent: 'flex-end',
  },
  msgText: { fontSize: 10, lineHeight: 16 },
  // Controls
  controls: {
    flexDirection: 'row',
    backgroundColor: '#0d0820',
    borderTopWidth: 1,
    borderTopColor: '#3a1860',
    padding: 8,
    alignItems: 'center',
  },
  dRow: { flexDirection: 'row', justifyContent: 'center' },
  dBtn: {
    width: 44, height: 44,
    backgroundColor: '#1a0a3a',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#4a2a8a',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  dTxt: { color: '#d0c0a0', fontSize: 18, fontWeight: 'bold' },
  // Spells
  spellBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderRadius: 4,
    alignItems: 'center',
    minWidth: 62,
  },
  castBtn: {
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
  },
});
