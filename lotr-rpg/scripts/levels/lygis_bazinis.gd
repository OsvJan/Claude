## lygis_bazinis.gd
## Lygio bazinis valdymas - visi lygiai paveldi šį
class_name LygisBazinis
extends Node3D

@onready var bangu_sistema: BanguSistema = $BanguSistema
@onready var hud: CanvasLayer = $HUD
@onready var zaidejas_spawn: Marker3D = $ZaidejoSpawn
@onready var kameras: Camera3D = $Kameras
@onready var aplinkos_apsvietimas: WorldEnvironment = $WorldEnvironment

var _zaidejas: Player = null
var _bosas: Node3D = null

func _ready() -> void:
	_ispausti_zaideja()
	_prijungti_signalus()
	_pradeti_lygi()

## Žaidėjo ispūdimas į lygį
func _ispausti_zaideja() -> void:
	var veikejo_vardas = GameManager.pasirinktas_veikėjas
	var scena_kelias = _gauti_veikejo_scena(veikejo_vardas)

	var scena = load(scena_kelias)
	if not scena:
		push_error("Nepavyko užkrauti veikėjo scenos: " + scena_kelias)
		return

	_zaidejas = scena.instantiate()
	add_child(_zaidejas)

	if zaidejas_spawn:
		_zaidejas.global_position = zaidejas_spawn.global_position
	else:
		_zaidejas.global_position = Vector3.ZERO

	# Kamera seka žaidėją
	if kameras:
		kameras.get_parent().reparent.call_deferred(_zaidejas) if false else null

func _gauti_veikejo_scena(vardas: String) -> String:
	match vardas:
		"Aragorn": return "res://scenes/player/aragorn.tscn"
		"Gandalfas": return "res://scenes/player/gandalfas.tscn"
		"Legolas": return "res://scenes/player/legolas.tscn"
		"Gimlis": return "res://scenes/player/gimlis.tscn"
	return "res://scenes/player/aragorn.tscn"

## Signalų prijungimas
func _prijungti_signalus() -> void:
	if bangu_sistema:
		bangu_sistema.banga_prasideda.connect(_banga_prasideda)
		bangu_sistema.banga_baigta.connect(_banga_baigta)
		bangu_sistema.visi_priešai_nugaleti.connect(_visi_nugaleti)

## Lygio pradžia - perkraunama kiekviename lygyje
func _pradeti_lygi() -> void:
	pass

func _banga_prasideda(nr: int, viso: int) -> void:
	if hud and hud.has_method("rodyti_bangos_pranesiima"):
		hud.rodyti_bangos_pranesiima("Banga %d / %d" % [nr + 1, viso])

func _banga_baigta(_nr: int) -> void:
	pass

## Visi priešai nugalėti - eiti į kitą lygį
func _visi_nugaleti() -> void:
	await get_tree().create_timer(2.0).timeout
	GameManager.sekantis_lygis()

## Kameros sekimas (3D kamera virš žaidėjo)
func _process(_delta: float) -> void:
	if _zaidejas and kameras:
		var tikslinė_poz = _zaidejas.global_position + Vector3(0, 12, 8)
		kameras.global_position = kameras.global_position.lerp(tikslinė_poz, 0.1)
		kameras.look_at(_zaidejas.global_position + Vector3(0, 1, 0), Vector3.UP)
