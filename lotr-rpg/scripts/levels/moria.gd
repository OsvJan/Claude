## moria.gd
## 2 lygis: Moria - Tamsios Gelmės
## Sunkesnės bangos su orkais ir Uruk-hai
extends LygisBazinis

func _pradeti_lygi() -> void:
	if bangu_sistema:
		bangu_sistema.visos_bangos = [
			# Banga 1
			[
				{"tipas": "orkas"}, {"tipas": "orkas"}, {"tipas": "orkas"},
				{"tipas": "orkas"}, {"tipas": "uruk_hai"}
			],
			# Banga 2
			[
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"},
				{"tipas": "orkas"}, {"tipas": "orkas"}, {"tipas": "orkas"},
				{"tipas": "orkas"}
			],
			# Banga 3
			[
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"}, {"tipas": "uruk_hai"},
				{"tipas": "orkas"}, {"tipas": "orkas"}, {"tipas": "orkas"},
				{"tipas": "orkas"}, {"tipas": "orkas"}
			],
			# Banga 4: Morios mini bosas - Uruk-hai vadas
			[
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"}, {"tipas": "uruk_hai"},
				{"tipas": "uruk_hai"}, {"tipas": "orkas"}, {"tipas": "orkas"},
				{"tipas": "orkas"}, {"tipas": "orkas"}, {"tipas": "orkas"}
			],
			# Banga 5: Nazgûlas su orkų eskortu
			[
				{"tipas": "nazguulas"},
				{"tipas": "orkas"}, {"tipas": "orkas"}, {"tipas": "orkas"}
			]
		]

func _visi_nugaleti() -> void:
	if hud:
		hud.rodyti_bangos_pranesiima("Moria įveikta! Einate į Helmo Griovį...")
	await get_tree().create_timer(3.0).timeout
	GameManager.sekantis_lygis()
