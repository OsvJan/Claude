/**
 * Harry Potter 16-bit RPG
 * Dragon Quest-style top-down overworld visuals
 * Real-time sprite animation, world tiles, visible characters
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

const { width: SW, height: SH } = Dimensions.get('window');
const TS = 32;
const VP_W = Math.floor(SW / TS);
const VP_H = Math.floor((SH - 250) / TS);
const MAP_W = 36;
const MAP_H = 24;

const T = { W: 0, F: 1, S: 2, PATH: 3 };

const ENEMY_STATS = {
  spider:      { hp: 20,  dmg: 5,  delay: 18, xp: 10,  color: '#8B4513' },
  dementor:    { hp: 45,  dmg: 12, delay: 13, xp: 25,  color: '#5555bb' },
  death_eater: { hp: 70,  dmg: 18, delay: 10, xp: 50,  color: '#cc2020' },
  voldemort:   { hp: 180, dmg: 28, delay: 7,  xp: 300, color: '#20cc55' },
};

const SPELL_LIST = [
  { id: 'exp', label: 'Expello',  cost: 12, dmg: 28,  color: '#FF8C00' },
  { id: 'stu', label: 'Stupefy',  cost: 22, dmg: 45,  color: '#1E90FF' },
  { id: 'ava', label: 'Avada K!', cost: 48, dmg: 110, color: '#00FF44' },
];

// Deterministic pseudo-random based on tile position
function tr(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2246822519) >>> 0;
  h ^= h >> 13; h = (h * 1274126177) >>> 0; h ^= h >> 16;
  return (h >>> 0) / 0xffffffff;
}

// ─── Level generator ──────────────────────────────────────────────────────────
function genLevel(lvl) {
  const grid = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(T.W));
  const rooms = [];

  for (let tries = 0; tries < 80 && rooms.length < 8; tries++) {
    const w = 4 + Math.floor(Math.random() * 5);
    const h = 3 + Math.floor(Math.random() * 4);
    const x = 1 + Math.floor(Math.random() * (MAP_W - w - 2));
    const y = 1 + Math.floor(Math.random() * (MAP_H - h - 2));
    if (rooms.some(r => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y)) continue;
    rooms.push({ x, y, w, h });
    for (let ry = y; ry < y + h; ry++)
      for (let rx = x; rx < x + w; rx++)
        grid[ry][rx] = T.F;
  }

  if (rooms.length < 2) {
    for (let ry = 1; ry < MAP_H - 1; ry++)
      for (let rx = 1; rx < MAP_W - 1; rx++)
        grid[ry][rx] = T.F;
    rooms.push(
      { x: 1, y: 1, w: 8, h: 6 },
      { x: MAP_W - 10, y: MAP_H - 8, w: 8, h: 6 }
    );
  }

  // Connect rooms — mark corridors as PATH
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1], b = rooms[i];
    let cx = a.x + Math.floor(a.w / 2), cy = a.y + Math.floor(a.h / 2);
    const tx = b.x + Math.floor(b.w / 2), ty = b.y + Math.floor(b.h / 2);
    while (cx !== tx) {
      if (grid[cy][cx] === T.W) grid[cy][cx] = T.PATH;
      cx += cx < tx ? 1 : -1;
    }
    while (cy !== ty) {
      if (grid[cy][cx] === T.W) grid[cy][cx] = T.PATH;
      cy += cy < ty ? 1 : -1;
    }
  }

  const lr = rooms[rooms.length - 1];
  grid[lr.y + Math.floor(lr.h / 2)][lr.x + Math.floor(lr.w / 2)] = T.S;

  const enemies = [];
  const items = [];

  rooms.forEach((r, i) => {
    if (i === 0) return;
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

// ─── Tile Background ──────────────────────────────────────────────────────────
const TileBg = React.memo(function TileBg({ tile, mx, my }) {
  const r1 = tr(mx, my, 1);
  const r2 = tr(mx, my, 2);
  const r3 = tr(mx, my, 3);

  if (tile === T.W) {
    // 55% trees, 45% stone wall — gives Dragon Quest forest feel
    if (r1 > 0.45) {
      const canopy = r2 > 0.5 ? '#2d6e1a' : '#246018';
      const canopy2 = r2 > 0.5 ? '#358020' : '#2a7020';
      return (
        <View style={{ width: TS, height: TS, backgroundColor: '#152a0a' }}>
          {/* Main canopy */}
          <View style={{ position: 'absolute', left: 4, top: 0, width: 24, height: 20, backgroundColor: canopy, borderRadius: 12 }} />
          {/* Highlight on canopy */}
          <View style={{ position: 'absolute', left: 8, top: 2, width: 14, height: 10, backgroundColor: canopy2, borderRadius: 8 }} />
          {/* Lower canopy layer */}
          <View style={{ position: 'absolute', left: 2, top: 14, width: 28, height: 12, backgroundColor: canopy, borderRadius: 8 }} />
          {/* Trunk */}
          <View style={{ position: 'absolute', left: 12, top: 24, width: 8, height: 8, backgroundColor: '#5a3010' }} />
        </View>
      );
    } else {
      // Stone wall — Hogwarts castle bricks
      const b1 = r2 > 0.6 ? '#3c3c50' : '#343448';
      const b2 = r2 > 0.3 ? '#38384a' : '#303042';
      return (
        <View style={{ width: TS, height: TS, backgroundColor: '#1c1c2a' }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 18, height: 10, backgroundColor: b1, borderWidth: 0.5, borderColor: '#12121e' }} />
          <View style={{ position: 'absolute', left: 19, top: 0, width: 13, height: 10, backgroundColor: b2, borderWidth: 0.5, borderColor: '#12121e' }} />
          <View style={{ position: 'absolute', left: 0, top: 11, width: 10, height: 10, backgroundColor: b2, borderWidth: 0.5, borderColor: '#12121e' }} />
          <View style={{ position: 'absolute', left: 11, top: 11, width: 21, height: 10, backgroundColor: b1, borderWidth: 0.5, borderColor: '#12121e' }} />
          <View style={{ position: 'absolute', left: 0, top: 22, width: 14, height: 10, backgroundColor: b1, borderWidth: 0.5, borderColor: '#12121e' }} />
          <View style={{ position: 'absolute', left: 15, top: 22, width: 17, height: 10, backgroundColor: b2, borderWidth: 0.5, borderColor: '#12121e' }} />
        </View>
      );
    }
  }

  if (tile === T.PATH) {
    const c = r1 > 0.65 ? '#7e6e4c' : r1 > 0.35 ? '#706040' : '#645838';
    return (
      <View style={{ width: TS, height: TS, backgroundColor: c }}>
        {r1 > 0.55 && <View style={{ position: 'absolute', left: Math.floor(r2 * 22) + 2, top: Math.floor(r3 * 22) + 2, width: 3, height: 2, backgroundColor: '#4e3c20' }} />}
        {r2 > 0.6 && <View style={{ position: 'absolute', left: Math.floor(r3 * 20) + 4, top: Math.floor(r1 * 20) + 6, width: 2, height: 3, backgroundColor: '#564428' }} />}
      </View>
    );
  }

  if (tile === T.S) {
    return (
      <View style={{ width: TS, height: TS, backgroundColor: '#5a4e30' }}>
        <View style={{ position: 'absolute', left: 1, top: 24, width: 30, height: 6, backgroundColor: '#9a8a60' }} />
        <View style={{ position: 'absolute', left: 4, top: 17, width: 24, height: 7, backgroundColor: '#8a7a54' }} />
        <View style={{ position: 'absolute', left: 7, top: 11, width: 18, height: 6, backgroundColor: '#7a6a48' }} />
        <View style={{ position: 'absolute', left: 10, top: 6, width: 12, height: 5, backgroundColor: '#6a5a3c' }} />
        {/* Glow indicator */}
        <View style={{ position: 'absolute', left: 13, top: 1, width: 6, height: 4, backgroundColor: '#ffd700', borderRadius: 3 }} />
      </View>
    );
  }

  // T.F — Hogwarts stone floor
  const fc = r1 > 0.75 ? '#787060' : r1 > 0.45 ? '#6e6658' : '#646050';
  return (
    <View style={{ width: TS, height: TS, backgroundColor: fc }}>
      <View style={{ position: 'absolute', right: 0, top: 0, width: 0.5, height: TS, backgroundColor: 'rgba(30,25,15,0.5)' }} />
      <View style={{ position: 'absolute', left: 0, bottom: 0, width: TS, height: 0.5, backgroundColor: 'rgba(30,25,15,0.5)' }} />
      {r1 > 0.85 && <View style={{ position: 'absolute', left: Math.floor(r2 * 20) + 4, top: Math.floor(r3 * 20) + 4, width: 4, height: 2, backgroundColor: 'rgba(80,70,40,0.4)' }} />}
    </View>
  );
});

// ─── Harry Potter Sprite ──────────────────────────────────────────────────────
function HarrySprite({ facingX, frame }) {
  const flip = facingX < 0;
  const leg = frame ? 3 : -3;
  return (
    <View style={{ width: 24, height: 30, transform: [{ scaleX: flip ? -1 : 1 }] }}>
      {/* Legs */}
      <View style={{ position: 'absolute', left: 5, top: 23 + leg, width: 5, height: 7, backgroundColor: '#0a0a18' }} />
      <View style={{ position: 'absolute', left: 14, top: 23 - leg, width: 5, height: 7, backgroundColor: '#0a0a18' }} />
      {/* Body — Gryffindor robes */}
      <View style={{ position: 'absolute', left: 4, top: 13, width: 16, height: 12, backgroundColor: '#7a0000' }} />
      {/* Scarf — red & gold stripes */}
      <View style={{ position: 'absolute', left: 3, top: 17, width: 18, height: 2, backgroundColor: '#cc2200' }} />
      <View style={{ position: 'absolute', left: 3, top: 19, width: 18, height: 2, backgroundColor: '#ffd700' }} />
      {/* Arms */}
      <View style={{ position: 'absolute', left: 1, top: 14, width: 4, height: 10, backgroundColor: '#5a0000' }} />
      <View style={{ position: 'absolute', left: 19, top: 14, width: 4, height: 10, backgroundColor: '#5a0000' }} />
      {/* Wand */}
      <View style={{ position: 'absolute', left: 21, top: 20, width: 2, height: 8, backgroundColor: '#c09050' }} />
      {/* Wand tip glow */}
      <View style={{ position: 'absolute', left: 20, top: 27, width: 4, height: 2, backgroundColor: '#ffe080', borderRadius: 2 }} />
      {/* Head */}
      <View style={{ position: 'absolute', left: 7, top: 4, width: 10, height: 10, backgroundColor: '#f0bc7a', borderRadius: 5 }} />
      {/* Messy black hair */}
      <View style={{ position: 'absolute', left: 7, top: 4, width: 10, height: 5, backgroundColor: '#180e04', borderRadius: 5 }} />
      <View style={{ position: 'absolute', left: 7, top: 6, width: 4, height: 3, backgroundColor: '#180e04' }} />
      <View style={{ position: 'absolute', left: 16, top: 6, width: 2, height: 2, backgroundColor: '#180e04' }} />
      {/* Glasses */}
      <View style={{ position: 'absolute', left: 8, top: 9, width: 4, height: 3, backgroundColor: 'rgba(150,180,255,0.15)', borderWidth: 1, borderColor: '#444', borderRadius: 1 }} />
      <View style={{ position: 'absolute', left: 13, top: 9, width: 4, height: 3, backgroundColor: 'rgba(150,180,255,0.15)', borderWidth: 1, borderColor: '#444', borderRadius: 1 }} />
      {/* Lightning scar */}
      <View style={{ position: 'absolute', left: 12, top: 5, width: 1, height: 2, backgroundColor: '#e05020' }} />
      <View style={{ position: 'absolute', left: 13, top: 7, width: 1, height: 2, backgroundColor: '#e05020' }} />
    </View>
  );
}

// ─── Spider Sprite ────────────────────────────────────────────────────────────
function SpiderSprite({ frame }) {
  const ls = frame ? 2 : -2;
  return (
    <View style={{ width: 28, height: 22 }}>
      {/* Left legs */}
      <View style={{ position: 'absolute', left: 0, top: 4 + ls, width: 8, height: 2, backgroundColor: '#2a1808', transform: [{ rotate: '-20deg' }] }} />
      <View style={{ position: 'absolute', left: 0, top: 8, width: 8, height: 2, backgroundColor: '#2a1808' }} />
      <View style={{ position: 'absolute', left: 0, top: 12 - ls, width: 8, height: 2, backgroundColor: '#2a1808', transform: [{ rotate: '20deg' }] }} />
      <View style={{ position: 'absolute', left: 0, top: 16 - ls, width: 7, height: 2, backgroundColor: '#2a1808', transform: [{ rotate: '35deg' }] }} />
      {/* Right legs */}
      <View style={{ position: 'absolute', left: 20, top: 4 + ls, width: 8, height: 2, backgroundColor: '#2a1808', transform: [{ rotate: '20deg' }] }} />
      <View style={{ position: 'absolute', left: 20, top: 8, width: 8, height: 2, backgroundColor: '#2a1808' }} />
      <View style={{ position: 'absolute', left: 20, top: 12 - ls, width: 8, height: 2, backgroundColor: '#2a1808', transform: [{ rotate: '-20deg' }] }} />
      <View style={{ position: 'absolute', left: 21, top: 16 - ls, width: 7, height: 2, backgroundColor: '#2a1808', transform: [{ rotate: '-35deg' }] }} />
      {/* Abdomen */}
      <View style={{ position: 'absolute', left: 7, top: 5, width: 14, height: 12, backgroundColor: '#5c2c10', borderRadius: 7 }} />
      {/* Head */}
      <View style={{ position: 'absolute', left: 9, top: 13, width: 10, height: 8, backgroundColor: '#4a2010', borderRadius: 4 }} />
      {/* Eyes */}
      <View style={{ position: 'absolute', left: 10, top: 15, width: 3, height: 3, backgroundColor: '#ff1a1a', borderRadius: 2 }} />
      <View style={{ position: 'absolute', left: 15, top: 15, width: 3, height: 3, backgroundColor: '#ff1a1a', borderRadius: 2 }} />
      {/* Fangs */}
      <View style={{ position: 'absolute', left: 11, top: 20, width: 2, height: 3, backgroundColor: '#e0d0a0' }} />
      <View style={{ position: 'absolute', left: 15, top: 20, width: 2, height: 3, backgroundColor: '#e0d0a0' }} />
    </View>
  );
}

// ─── Dementor Sprite ──────────────────────────────────────────────────────────
function DementorSprite({ frame }) {
  const bob = frame ? 0 : 2;
  return (
    <View style={{ width: 24, height: 30, marginTop: bob }}>
      {/* Tattered robe bottom */}
      {[0, 5, 10, 15, 20].map(x => (
        <View key={x} style={{ position: 'absolute', left: x + 2, top: 24, width: 4, height: x % 10 === 0 ? 7 : 5, backgroundColor: '#100820' }} />
      ))}
      {/* Main cloak */}
      <View style={{ position: 'absolute', left: 2, top: 8, width: 20, height: 18, backgroundColor: '#180c28' }} />
      {/* Hood */}
      <View style={{ position: 'absolute', left: 4, top: 1, width: 16, height: 10, backgroundColor: '#100820', borderRadius: 8 }} />
      {/* Hollow face — pale */}
      <View style={{ position: 'absolute', left: 7, top: 5, width: 10, height: 8, backgroundColor: '#b8a8c4', borderRadius: 4 }} />
      {/* Empty eye sockets */}
      <View style={{ position: 'absolute', left: 8, top: 7, width: 3, height: 3, backgroundColor: '#6600bb', borderRadius: 1 }} />
      <View style={{ position: 'absolute', left: 13, top: 7, width: 3, height: 3, backgroundColor: '#6600bb', borderRadius: 1 }} />
      {/* Inner glow */}
      <View style={{ position: 'absolute', left: 9, top: 8, width: 1, height: 1, backgroundColor: '#cc44ff' }} />
      <View style={{ position: 'absolute', left: 14, top: 8, width: 1, height: 1, backgroundColor: '#cc44ff' }} />
      {/* Gaping mouth */}
      <View style={{ position: 'absolute', left: 9, top: 11, width: 6, height: 3, backgroundColor: '#1a0828', borderRadius: 1 }} />
      {/* Cloak arms */}
      <View style={{ position: 'absolute', left: 0, top: 10, width: 4, height: 12, backgroundColor: '#180c28', borderRadius: 2 }} />
      <View style={{ position: 'absolute', left: 20, top: 10, width: 4, height: 12, backgroundColor: '#180c28', borderRadius: 2 }} />
      {/* Soul-sucking aura */}
      <View style={{ position: 'absolute', left: 1, top: 6, width: 22, height: 18, backgroundColor: 'rgba(100,0,180,0.08)', borderRadius: 11 }} />
    </View>
  );
}

// ─── Death Eater Sprite ───────────────────────────────────────────────────────
function DeathEaterSprite({ frame }) {
  const leg = frame ? 3 : -3;
  return (
    <View style={{ width: 24, height: 30 }}>
      {/* Legs */}
      <View style={{ position: 'absolute', left: 5, top: 23 + leg, width: 5, height: 7, backgroundColor: '#080810' }} />
      <View style={{ position: 'absolute', left: 14, top: 23 - leg, width: 5, height: 7, backgroundColor: '#080810' }} />
      {/* Dark robes */}
      <View style={{ position: 'absolute', left: 4, top: 13, width: 16, height: 12, backgroundColor: '#080814' }} />
      {/* Dark Mark tattoo on arm (green snake) */}
      <View style={{ position: 'absolute', left: 0, top: 15, width: 5, height: 9, backgroundColor: '#0c0c18' }} />
      <View style={{ position: 'absolute', left: 1, top: 18, width: 3, height: 3, backgroundColor: '#005500' }} />
      <View style={{ position: 'absolute', left: 19, top: 15, width: 5, height: 9, backgroundColor: '#0c0c18' }} />
      {/* Wand */}
      <View style={{ position: 'absolute', left: 22, top: 21, width: 2, height: 8, backgroundColor: '#3a2008' }} />
      <View style={{ position: 'absolute', left: 21, top: 28, width: 4, height: 2, backgroundColor: '#cc0000', borderRadius: 2 }} />
      {/* Shoulders / cape */}
      <View style={{ position: 'absolute', left: 1, top: 13, width: 22, height: 5, backgroundColor: '#0c0c1c' }} />
      {/* Hood */}
      <View style={{ position: 'absolute', left: 5, top: 0, width: 14, height: 8, backgroundColor: '#0c0c1c', borderRadius: 7 }} />
      {/* Mask — white */}
      <View style={{ position: 'absolute', left: 7, top: 3, width: 10, height: 12, backgroundColor: '#e0d8c8', borderRadius: 4, borderWidth: 1, borderColor: '#888' }} />
      {/* Mask eye holes */}
      <View style={{ position: 'absolute', left: 8, top: 7, width: 3, height: 3, backgroundColor: '#080808', borderRadius: 1 }} />
      <View style={{ position: 'absolute', left: 13, top: 7, width: 3, height: 3, backgroundColor: '#080808', borderRadius: 1 }} />
      {/* Mask snake symbol */}
      <View style={{ position: 'absolute', left: 11, top: 12, width: 2, height: 2, backgroundColor: '#008800' }} />
    </View>
  );
}

// ─── Voldemort Sprite ─────────────────────────────────────────────────────────
function VoldemortSprite({ frame }) {
  const bob = frame ? 0 : 1;
  return (
    <View style={{ width: 28, height: 34, marginTop: bob }}>
      {/* Legs */}
      <View style={{ position: 'absolute', left: 7, top: 28, width: 6, height: 6, backgroundColor: '#0a140a' }} />
      <View style={{ position: 'absolute', left: 15, top: 28, width: 6, height: 6, backgroundColor: '#0a140a' }} />
      {/* Long dark robes */}
      <View style={{ position: 'absolute', left: 5, top: 14, width: 18, height: 16, backgroundColor: '#0a140a' }} />
      {/* Snake-like arms */}
      <View style={{ position: 'absolute', left: 1, top: 15, width: 5, height: 12, backgroundColor: '#0e1a0e', borderRadius: 3 }} />
      <View style={{ position: 'absolute', left: 22, top: 15, width: 5, height: 12, backgroundColor: '#0e1a0e', borderRadius: 3 }} />
      {/* Elder Wand — white bone */}
      <View style={{ position: 'absolute', left: 25, top: 22, width: 2, height: 10, backgroundColor: '#d8d0e8' }} />
      <View style={{ position: 'absolute', left: 24, top: 21, width: 4, height: 2, backgroundColor: '#e8e0f8' }} />
      {/* Chest — dark robe with silver clasp */}
      <View style={{ position: 'absolute', left: 12, top: 16, width: 4, height: 4, backgroundColor: '#8080a0' }} />
      {/* Neck */}
      <View style={{ position: 'absolute', left: 11, top: 10, width: 6, height: 5, backgroundColor: '#cce0cc' }} />
      {/* Head — large, pale green-white, snake-like */}
      <View style={{ position: 'absolute', left: 6, top: 1, width: 16, height: 14, backgroundColor: '#cce0cc', borderRadius: 6 }} />
      {/* Pale sheen */}
      <View style={{ position: 'absolute', left: 8, top: 2, width: 10, height: 6, backgroundColor: '#ddf0dd', borderRadius: 4 }} />
      {/* Nose slits — no nose */}
      <View style={{ position: 'absolute', left: 12, top: 9, width: 2, height: 3, backgroundColor: '#aaccaa', borderRadius: 1 }} />
      <View style={{ position: 'absolute', left: 15, top: 9, width: 2, height: 3, backgroundColor: '#aaccaa', borderRadius: 1 }} />
      {/* Red serpent eyes */}
      <View style={{ position: 'absolute', left: 8, top: 5, width: 4, height: 4, backgroundColor: '#cc0000', borderRadius: 2 }} />
      <View style={{ position: 'absolute', left: 17, top: 5, width: 4, height: 4, backgroundColor: '#cc0000', borderRadius: 2 }} />
      {/* Slit pupils */}
      <View style={{ position: 'absolute', left: 9, top: 5, width: 2, height: 4, backgroundColor: '#1a0000' }} />
      <View style={{ position: 'absolute', left: 18, top: 5, width: 2, height: 4, backgroundColor: '#1a0000' }} />
      {/* Thin evil smile */}
      <View style={{ position: 'absolute', left: 10, top: 13, width: 8, height: 1, backgroundColor: '#88aaaa' }} />
      {/* Dark aura */}
      <View style={{ position: 'absolute', left: 0, top: 0, width: 28, height: 34, backgroundColor: 'rgba(0,60,0,0.06)', borderRadius: 14 }} />
    </View>
  );
}

// ─── Item Sprites ─────────────────────────────────────────────────────────────
function HpPotionSprite() {
  return (
    <View style={{ width: 16, height: 22 }}>
      <View style={{ position: 'absolute', left: 5, top: 0, width: 6, height: 4, backgroundColor: '#7a5020' }} />
      <View style={{ position: 'absolute', left: 6, top: 3, width: 4, height: 5, backgroundColor: '#cc1111' }} />
      <View style={{ position: 'absolute', left: 2, top: 7, width: 12, height: 13, backgroundColor: '#cc0000', borderRadius: 4 }} />
      <View style={{ position: 'absolute', left: 4, top: 8, width: 5, height: 5, backgroundColor: '#ff6666', borderRadius: 3 }} />
      <View style={{ position: 'absolute', left: 3, top: 13, width: 10, height: 4, backgroundColor: '#ffffff18' }} />
    </View>
  );
}

function MpPotionSprite() {
  return (
    <View style={{ width: 16, height: 22 }}>
      <View style={{ position: 'absolute', left: 5, top: 0, width: 6, height: 4, backgroundColor: '#7a5020' }} />
      <View style={{ position: 'absolute', left: 6, top: 3, width: 4, height: 5, backgroundColor: '#2244cc' }} />
      <View style={{ position: 'absolute', left: 2, top: 7, width: 12, height: 13, backgroundColor: '#1133cc', borderRadius: 4 }} />
      <View style={{ position: 'absolute', left: 4, top: 8, width: 5, height: 5, backgroundColor: '#5577ff', borderRadius: 3 }} />
      <View style={{ position: 'absolute', left: 3, top: 12, width: 4, height: 2, backgroundColor: '#ffffff30' }} />
      <View style={{ position: 'absolute', left: 8, top: 14, width: 3, height: 2, backgroundColor: '#ffffff30' }} />
    </View>
  );
}

// ─── Enemy HP bar ─────────────────────────────────────────────────────────────
function EnemyHpBar({ hp, maxHp, isVoldemort }) {
  const pct = Math.max(0, hp / maxHp);
  const barColor = isVoldemort ? '#20cc55' : pct > 0.5 ? '#44cc44' : pct > 0.25 ? '#cccc22' : '#cc2222';
  return (
    <View style={{ position: 'absolute', top: -5, left: 1, width: TS - 2, height: 3, backgroundColor: '#1a0808', borderRadius: 1 }}>
      <View style={{ width: `${pct * 100}%`, height: 3, backgroundColor: barColor, borderRadius: 1 }} />
    </View>
  );
}

// ─── Title Screen ─────────────────────────────────────────────────────────────
function TitleScreen({ onStart }) {
  return (
    <View style={s.center}>
      <Text style={s.titleBig}>⚡ HARRY POTTER ⚡</Text>
      <Text style={s.titleSub}>HOGWARTS RPG QUEST</Text>
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
  const gsRef = useRef(null);
  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender(n => n + 1), []);

  const [selectedSpell, setSelectedSpell] = useState(0);
  const spellRef = useRef(0);

  // Animation frame: 0 or 1, cycles at ~300ms
  const [animFrame, setAnimFrame] = useState(0);

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
      msgs: [`⚡ Hogwarts Floor ${lvl}/3 — find the stairs`],
    };
    rerender();
  }, [rerender]);

  useEffect(() => { initLevel(1, 0); }, [initLevel]);

  // ── Animation ticker ───────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setAnimFrame(f => f ^ 1), 300);
    return () => clearInterval(id);
  }, []);

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
        if (md > 12) return ne;

        if (md === 1) {
          dmgTaken += ne.dmg;
          const name = ne.type === 'voldemort' ? 'Voldemort' : ne.type;
          loopMsgs.push(`💥 ${name} attacks! -${ne.dmg}HP`);
          return ne;
        }

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

    let newPlayer = { ...p, x: nx, y: ny, facingX: dx, facingY: dy };
    let newItems = ld.items;
    const msgs = [...gs.msgs];

    if (ld.grid[ny][nx] === T.S) {
      if (lvl >= 3) { onEndRef.current({ win: true, score: p.score }); return; }
      initLevel(lvl + 1, p.score);
      return;
    }

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

  // Build tile + entity views
  const tileViews = [];
  for (let row = 0; row < VP_H; row++) {
    for (let col = 0; col < VP_W; col++) {
      const mx = col + camX, my = row + camY;
      if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) continue;
      const tile = ld.grid[my][mx];

      const left = col * TS;
      const top = row * TS;

      // Tile background
      tileViews.push(
        <View key={`t-${col}-${row}`} style={{ position: 'absolute', left, top, width: TS, height: TS }}>
          <TileBg tile={tile} mx={mx} my={my} />
        </View>
      );

      if (tile === T.W) continue; // no entities on walls

      // Player
      if (mx === p.x && my === p.y) {
        tileViews.push(
          <View key={`p-${col}-${row}`} style={{ position: 'absolute', left: left + 4, top: top + 1, width: 24, height: 30 }}>
            <HarrySprite facingX={p.facingX} frame={animFrame} />
          </View>
        );
        continue;
      }

      // Enemy
      const e = ld.enemies.find(e => e.x === mx && e.y === my);
      if (e) {
        let Sprite;
        switch (e.type) {
          case 'spider':      Sprite = <SpiderSprite frame={animFrame} />; break;
          case 'dementor':    Sprite = <DementorSprite frame={animFrame} />; break;
          case 'death_eater': Sprite = <DeathEaterSprite frame={animFrame} />; break;
          case 'voldemort':   Sprite = <VoldemortSprite frame={animFrame} />; break;
          default:            Sprite = null;
        }
        tileViews.push(
          <View key={`e-${e.id}`} style={{ position: 'absolute', left: left + 2, top: top + 3, width: TS - 4, height: TS - 3 }}>
            {Sprite}
            <EnemyHpBar hp={e.hp} maxHp={e.maxHp} isVoldemort={e.type === 'voldemort'} />
          </View>
        );
        continue;
      }

      // Item
      const it = ld.items.find(it => it.x === mx && it.y === my);
      if (it) {
        tileViews.push(
          <View key={`i-${it.id}`} style={{ position: 'absolute', left: left + 8, top: top + 5, width: 16, height: 22 }}>
            {it.type === 'hp_potion' ? <HpPotionSprite /> : <MpPotionSprite />}
          </View>
        );
      }
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
              <Text style={{ fontSize: 10, color: '#ffd700', fontWeight: 'bold' }}>HP</Text>
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
  msgBox: {
    backgroundColor: '#0a0618',
    paddingHorizontal: 8,
    paddingVertical: 3,
    minHeight: 40,
    justifyContent: 'flex-end',
  },
  msgText: { fontSize: 10, lineHeight: 16 },
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
