## helmo_griovys.gd
## 3 lygis: Helmo Griovys - Paskutinis Gynimas
## Masinis Uruk-hai puolimas
extends LygisBazinis

func _pradeti_lygi() -> void:
	if bangu_sistema:
		bangu_sistema.visos_bangos = [
			# Banga 1: Pirmasis Uruk-hai puolimas
			[
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"}, {"tipas": "uruk_hai"},
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"}
			],
			# Banga 2: Daugiau Uruk-hai
			[
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"}, {"tipas": "uruk_hai"},
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"}, {"tipas": "uruk_hai"},
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"}
			],
			# Banga 3: Su Nazgûlu
			[
				{"tipas": "nazguulas"},
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"}, {"tipas": "uruk_hai"},
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"}
			],
			# Banga 4: Du Nazgûlai
			[
				{"tipas": "nazguulas"}, {"tipas": "nazguulas"},
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"},
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"}
			],
			# Banga 5: Galutinis puolimas
			[
				{"tipas": "nazguulas"}, {"tipas": "nazguulas"}, {"tipas": "nazguulas"},
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"},
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"},
				{"tipas": "uruk_hai"}
			]
		]

func _visi_nugaleti() -> void:
	if hud:
		hud.rodyti_bangos_pranesiima("Helmo Griovys išgelbėtas! Keliaujate į Mordorą...")
	await get_tree().create_timer(3.0).timeout
	GameManager.sekantis_lygis()
