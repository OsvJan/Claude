# Žiedų Valdovai - 3D RPG

**Hack & Slash RPG** žaidimas Android telefonui, sukurtas **Godot 4** variklyje.
Pagrįstas Žiedų Valdovų pasauliu.

---

## Žaidimo Aprašas

Kovojate per 4 lygius kaip vienas iš keturių ikoninių Viduržemio herojų, įveikdami bangomis atakanančius priešus, kol susidursite su galutiniu bosu - Balrogu.

---

## Veikėjai

| Veikėjas | HP  | Sarvai | Ataka | Greitis | Stilius |
|----------|-----|--------|-------|---------|---------|
| ⚔ **Aragorn** | 150 | 20 | 35 | 5 | Subalansuotas kovotojas |
| 🔮 **Gandalfas** | 100 | 10 | 55 | 4 | Nuotolinis burtininkas |
| 🏹 **Legolas** | 110 | 12 | 40 | 8 | Greitas šaulys |
| 🪓 **Gimlis** | 200 | 35 | 48 | 3 | Gynybos tankas |

### Gebėjimai

**Aragorn:**
- ⚔ *Andúril Smūgis* - 3x žalos smūgis (8s)
- 👑 *Karalių Šauksmas* - AoE stuporis 8m (20s)
- ✨ *Dúnedain Gydymas* - Atgaivina 40 HP (35s)

**Gandalfas:**
- 🔥 *"Nenueisi!"* - Ugnies siena 70° kūgyje (18s)
- ⚡ *Glamdring Žaibas* - Žaibas per linijinę zoną (12s)
- 💡 *Šviesos Blyksnis* - Apakina visus 4s (22s)

**Legolas:**
- 🏹 *Strėlių Lietus* - AoE strėlės visiems (12s)
- 💨 *Žaibiškas Šūvis* - 4x kritinis smūgis (8s)
- 🌟 *Elfo Vengimas* - 5s nemirtingumas (28s)

**Gimlis:**
- 🪓 *Baruk Khazâd!* - Sukimosi AoE 4m (10s)
- 🛡 *Gynybinė Laikysena* - 2x sarvai 8s (22s)
- 🪓 *Kirvio Metimas* - Nuotolinė 2.5x ataka (14s)

---

## Lygiai

1. 🌿 **Šyras** - 4 bangos orkų (paprastas)
2. ⛏ **Moria** - 5 bangos orkų + Uruk-hai (vidutinis)
3. 🏰 **Helmo Griovys** - 5 bangos Uruk-hai + Nazgûlai (sunkus)
4. 🌋 **Mordoras** - 3 bangos + **Balrogo** bosas (labai sunkus)

### Balrogo Trys Fazės:
- **Fazė 1** - Ugnies smūgiai + kulkos
- **Fazė 2** (< 60% HP) - Šėtos rimbas, greičio padidėjimas
- **Fazė 3** (< 30% HP) - Pragaro liepsna AoE

---

## Valdymas (Android Lietimas)

| Veiksmas | Valdymas |
|----------|----------|
| Judėti | Laikykite pirštą ir braukite |
| Atakuoti | Automatinis (artimiausi priešai) |
| Gebėjimas 1 | HUD mygtukas kairys |
| Gebėjimas 2 | HUD mygtukas viduris |
| Gebėjimas 3 | HUD mygtukas dešinys |
| Pristabdyti | ⏸ mygtukas viršuje |

---

## Techniniai Reikalavimai

- **Variklis**: Godot 4.2+
- **Platforma**: Android (API 21+) / iOS / Windows/Linux (debug)
- **Architektūra**: arm64-v8a rekomenduojama

---

## Įdiegimas

### Reikalavimai
1. Atsisiųskite [Godot 4.2+](https://godotengine.org/download)
2. Atidarykite projektą: `File → Open Project → pasirinkite lotr-rpg/`
3. Pridėkite 3D modelius į `assets/models/` (žr. `assets/placeholder_readme.md`)

### Android eksportavimas
1. Godot → `Project → Export → Add → Android`
2. Nustatykite Android SDK kelią
3. Sukonfigūruokite pasirašymą (keystore)
4. Spustelėkite `Export Project`

---

## Projekto Struktūra

```
lotr-rpg/
├── project.godot          # Godot projekto konfigūracija
├── scripts/
│   ├── game_manager.gd    # Pagrindinis žaidimo valdytojas (Singleton)
│   ├── player/            # Žaidėjų skriptai
│   │   ├── player.gd      # Bazinė žaidėjo klasė
│   │   ├── aragorn.gd
│   │   ├── gandalfas.gd
│   │   ├── legolas.gd
│   │   └── gimlis.gd
│   ├── enemies/           # Priešų skriptai
│   │   ├── priesas_bazinis.gd
│   │   ├── orkas.gd
│   │   ├── uruk_hai.gd
│   │   ├── nazguulas.gd
│   │   └── balrogas.gd
│   ├── ui/                # Vartotojo sąsajos skriptai
│   │   ├── pagrindinis_meniu.gd
│   │   ├── veikejo_pasirinkimas.gd
│   │   ├── hud.gd
│   │   ├── zaidejas_mirtas.gd
│   │   └── pergale.gd
│   ├── levels/            # Lygių valdymas
│   │   ├── lygis_bazinis.gd
│   │   ├── syras.gd
│   │   ├── moria.gd
│   │   ├── helmo_griovys.gd
│   │   └── mordoras.gd
│   └── systems/           # Žaidimo sistemos
│       ├── bangu_sistema.gd
│       └── audio_manager.gd
├── scenes/
│   ├── main_menu.tscn
│   ├── veikejo_pasirinkimas.tscn
│   ├── hud.tscn
│   ├── zaidejas_mirtas.tscn
│   ├── pergale.tscn
│   ├── player/            # Veikėjų scenos
│   ├── enemies/           # Priešų scenos
│   └── levels/            # Lygių scenos
└── assets/                # Resursai (modeliai, garsai, tekstūros)
```
