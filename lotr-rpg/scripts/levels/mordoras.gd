## mordoras.gd
## 4 lygis: Mordoras - Ugnies Kalnas
## Galutinis lygis su Balrogo bosu
extends LygisBazinis

var _balrogas_ispaustas: bool = false

func _pradeti_lygi() -> void:
	if bangu_sistema:
		bangu_sistema.visos_bangos = [
			# Banga 1: Mordoro sargai
			[
				{"tipas": "nazguulas"},
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"},
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"}
			],
			# Banga 2: Nazgûlų būrys
			[
				{"tipas": "nazguulas"}, {"tipas": "nazguulas"},
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"},
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"},
				{"tipas": "uruk_hai"}
			],
			# Banga 3: Paskutinė banga prieš Balrogą
			[
				{"tipas": "nazguulas"}, {"tipas": "nazguulas"}, {"tipas": "nazguulas"},
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"},
				{"tipas": "uruk_hai"}, {"tipas": "uruk_hai"}
			]
		]

	bangu_sistema.visi_priešai_nugaleti.disconnect(_visi_nugaleti)
	bangu_sistema.visi_priešai_nugaleti.connect(_ispausti_balroga)

func _ispausti_balroga() -> void:
	if _balrogas_ispaustas:
		return
	_balrogas_ispaustas = true

	if hud:
		hud.rodyti_bangos_pranesiima("⚠ BALROGAS ATVYKSTA! ⚠")

	await get_tree().create_timer(2.0).timeout

	# Ispausti Balrogą
	var balrogo_scena = load("res://scenes/enemies/balrogas.tscn")
	if not balrogo_scena:
		return

	_bosas = balrogo_scena.instantiate()
	add_child(_bosas)
	_bosas.global_position = Vector3(0, 0, -15)

	# HUD rodyti boso HP
	if hud and hud.has_method("rodyti_boso_hp"):
		hud.rodyti_boso_hp(_bosas, "BALROGAS - Morgotho Demonas")

	# Pergalės signalas
	if _bosas.has_signal("bosas_nugaletas"):
		_bosas.bosas_nugaletas.connect(_balrogas_nugaletas)

func _balrogas_nugaletas() -> void:
	if hud:
		hud.rodyti_bangos_pranesiima("PERGALĖ! Viduržemis išgelbėtas!")
	# Pergalė vykdoma pačiame Balroge
