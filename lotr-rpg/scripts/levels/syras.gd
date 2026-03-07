## syras.gd
## 1 lygis: Šyras - Kelionės Pradžia
## Paprastos bangos su orkais
extends LygisBazinis

func _pradeti_lygi() -> void:
	# Šyro lygis - 4 bangos su orkais
	if bangu_sistema:
		bangu_sistema.visos_bangos = [
			# Banga 1: 3 orkai
			[
				{"tipas": "orkas"},
				{"tipas": "orkas"},
				{"tipas": "orkas"}
			],
			# Banga 2: 5 orkai
			[
				{"tipas": "orkas"},
				{"tipas": "orkas"},
				{"tipas": "orkas"},
				{"tipas": "orkas"},
				{"tipas": "orkas"}
			],
			# Banga 3: 7 orkai
			[
				{"tipas": "orkas"},
				{"tipas": "orkas"},
				{"tipas": "orkas"},
				{"tipas": "orkas"},
				{"tipas": "orkas"},
				{"tipas": "orkas"},
				{"tipas": "orkas"}
			],
			# Banga 4: Bosas - Orko vadas + 5 orkai
			[
				{"tipas": "uruk_hai"},
				{"tipas": "orkas"},
				{"tipas": "orkas"},
				{"tipas": "orkas"},
				{"tipas": "orkas"},
				{"tipas": "orkas"}
			]
		]
