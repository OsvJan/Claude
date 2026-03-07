## bangu_sistema.gd
## Priešų bangų valdymas kiekviename lygyje
class_name BanguSistema
extends Node

# Bangų konfigūracija
var dabartine_banga: int = 0
var visos_bangos: Array = []
var _prisikels_priesas_scena: Dictionary = {}
var _laukia_kitos_bangos: bool = false
var _banga_aktyvi: bool = false
var _priešai_ekrane: int = 0

signal banga_prasideda(bangos_nr: int, viso_bangu: int)
signal banga_baigta(bangos_nr: int)
signal visi_priešai_nugaleti()

@export var iskylimo_taskai: Array[Node3D] = []

func _ready() -> void:
	# Laukti, kol scena bus pilnai užkrauta
	call_deferred("_pradeti")

func _pradeti() -> void:
	await get_tree().process_frame
	if visos_bangos.is_empty():
		_nustatyti_bangų_konfiguracija()
	_pradeti_banga(0)

## Perkraunama kiekviename lygyje
func _nustatyti_bangų_konfiguracija() -> void:
	pass

## Bangos pradžia
func _pradeti_banga(bangos_nr: int) -> void:
	if bangos_nr >= visos_bangos.size():
		emit_signal("visi_priešai_nugaleti")
		return

	dabartine_banga = bangos_nr
	_banga_aktyvi = true
	_priešai_ekrane = 0

	var banga = visos_bangos[bangos_nr]
	emit_signal("banga_prasideda", bangos_nr, visos_bangos.size())

	# Ispausti priešus su vėlinimu
	for i in banga.size():
		var prieso_info = banga[i]
		get_tree().create_timer(i * 0.8).timeout.connect(
			func(): _ispauksti_priesa(prieso_info)
		)

## Ispausti vieną priešą
func _ispauksti_priesa(info: Dictionary) -> void:
	if not info.has("tipas"):
		return

	var scena_kelias = _gauti_scena_kelia(info["tipas"])
	if scena_kelias.is_empty():
		return

	var scena = load(scena_kelias)
	if not scena:
		return

	var priesas = scena.instantiate()
	get_tree().current_scene.add_child(priesas)

	# Atsitiktinė iskylimo vieta
	var iskylimo_poz = _gauti_iskylimo_vieta()
	priesas.global_position = iskylimo_poz

	priesas.mirtas.connect(_priesai_mirta)
	_priešai_ekrane += 1

func ispauksti_priesus(kiekis: int, tipas: String, vieta: Vector3) -> void:
	for i in kiekis:
		var scena_kelias = _gauti_scena_kelia(tipas)
		if scena_kelias.is_empty():
			continue

		var scena = load(scena_kelias)
		if not scena:
			continue

		var priesas = scena.instantiate()
		get_tree().current_scene.add_child(priesas)

		var offset = Vector3(randf_range(-3, 3), 0, randf_range(-3, 3))
		priesas.global_position = vieta + offset
		priesas.mirtas.connect(_priesai_mirta)
		_priešai_ekrane += 1

func _gauti_scena_kelia(tipas: String) -> String:
	match tipas:
		"orkas": return "res://scenes/enemies/orkas.tscn"
		"uruk_hai": return "res://scenes/enemies/uruk_hai.tscn"
		"nazguulas": return "res://scenes/enemies/nazguulas.tscn"
		"balrogas": return "res://scenes/enemies/balrogas.tscn"
	return ""

func _gauti_iskylimo_vieta() -> Vector3:
	if not iskylimo_taskai.is_empty():
		var atsitiktinis = iskylimo_taskai[randi() % iskylimo_taskai.size()]
		return atsitiktinis.global_position + Vector3(randf_range(-2, 2), 0, randf_range(-2, 2))

	# Atsarginė vieta - aplink centrą
	var kampas = randf() * TAU
	var spindulys = randf_range(10.0, 18.0)
	return Vector3(cos(kampas) * spindulys, 0, sin(kampas) * spindulys)

func _priesai_mirta(_priesas: Node) -> void:
	_priešai_ekrane -= 1

	if _priešai_ekrane <= 0 and _banga_aktyvi:
		_banga_aktyvi = false
		emit_signal("banga_baigta", dabartine_banga)

		# Laukti prieš kitą bangą
		await get_tree().create_timer(3.0).timeout
		_pradeti_banga(dabartine_banga + 1)
