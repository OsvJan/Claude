## priesas_bazinis.gd
## Priešų bazinė klasė - visi priešai paveldi šią
class_name PriesasBazinis
extends CharacterBody3D

enum PriesoTipas { ORKAS, URUK_HAI, NAZGUULAS, BALROGAS }

# Statistikos
var prieso_vardas: String = "Orkas"
var tipas: PriesoTipas = PriesoTipas.ORKAS
var max_gyvybes: float = 50.0
var dabartines_gyvybes: float = 50.0
var ataka: float = 10.0
var greitis: float = 3.0
var atakos_atstumas: float = 1.8
var atakos_greitis: float = 1.0
var taskų_uz_nuzudyma: int = 20
var agresyvumo_spindulys: float = 15.0

# Vidinė būsena
var _mirtas: bool = false
var _sukaustytas: bool = false
var _apakinas: bool = false
var _atakos_laikmatis: float = 0.0
var _taikinys: Node3D = null

# AI navigacija
var gravitacija: float = ProjectSettings.get_setting("physics/3d/default_gravity")

# Signalai
signal gyvybes_pasikeitė(dabartines: float, max_gyvybiu: float)
signal mirtas(priesas: Node)

@onready var animacijos_leist: AnimationPlayer = $AnimationPlayer if has_node("AnimationPlayer") else null
@onready var navigacijos_agentas = $NavigationAgent3D if has_node("NavigationAgent3D") else null

func _ready() -> void:
	add_to_group("priesas")
	nustatyti_statistikas()
	dabartines_gyvybes = max_gyvybes

	if navigacijos_agentas:
		navigacijos_agentas.max_speed = greitis
		navigacijos_agentas.path_desired_distance = 0.5
		navigacijos_agentas.target_desired_distance = atakos_atstumas

## Perkraunama
func nustatyti_statistikas() -> void:
	pass

func _physics_process(delta: float) -> void:
	if _mirtas:
		return

	# Gravitacija
	if not is_on_floor():
		velocity.y -= gravitacija * delta

	# Taikinio paieška
	if not _sukaustytas and not _apakinas:
		_ieškoti_taikinio()
		_judeti_link_taikinio(delta)

	# Atakos laikmatis
	if _atakos_laikmatis > 0:
		_atakos_laikmatis -= delta

	move_and_slide()

## Taikinio paieška
func _ieškoti_taikinio() -> void:
	if _taikinys and is_instance_valid(_taikinys):
		if global_position.distance_to(_taikinys.global_position) > agresyvumo_spindulys * 2:
			_taikinys = null
		return

	var zaidejai = get_tree().get_nodes_in_group("zaidejas")
	for zaidejas in zaidejai:
		var atstumas = global_position.distance_to(zaidejas.global_position)
		if atstumas < agresyvumo_spindulys:
			_taikinys = zaidejas
			return

## Judėjimas link taikinio
func _judeti_link_taikinio(_delta: float) -> void:
	if not _taikinys or not is_instance_valid(_taikinys):
		velocity.x = move_toward(velocity.x, 0, greitis)
		velocity.z = move_toward(velocity.z, 0, greitis)
		return

	var atstumas = global_position.distance_to(_taikinys.global_position)

	if atstumas <= atakos_atstumas:
		# Atstumas atakuoti
		velocity.x = move_toward(velocity.x, 0, greitis)
		velocity.z = move_toward(velocity.z, 0, greitis)
		_bandyti_atakuoti()
	else:
		# Judėti link taikinio
		var kryptis = (_taikinys.global_position - global_position).normalized()
		kryptis.y = 0
		velocity.x = kryptis.x * greitis
		velocity.z = kryptis.z * greitis

		if kryptis != Vector3.ZERO:
			look_at(global_position + kryptis, Vector3.UP)

		if animacijos_leist and not animacijos_leist.current_animation == "walk":
			animacijos_leist.play("walk")

## Atakavimas
func _bandyti_atakuoti() -> void:
	if _atakos_laikmatis > 0 or not _taikinys:
		return

	_atakos_laikmatis = 1.0 / atakos_greitis

	if animacijos_leist:
		animacijos_leist.play("attack")

	if _taikinys.has_method("gauti_žalą"):
		var žala = ataka * randf_range(0.8, 1.2)
		_taikinys.gauti_žalą(žala)

## Žalos gavimas
func gauti_žalą(žala: float) -> void:
	if _mirtas:
		return

	dabartines_gyvybes -= žala
	dabartines_gyvybes = max(0.0, dabartines_gyvybes)

	emit_signal("gyvybes_pasikeitė", dabartines_gyvybes, max_gyvybes)

	if animacijos_leist:
		animacijos_leist.play("hit")

	if dabartines_gyvybes <= 0:
		_mirti()

## Sukaustymas
func sukaustyti(trukmė: float) -> void:
	_sukaustytas = true
	velocity = Vector3.ZERO
	get_tree().create_timer(trukmė).timeout.connect(func(): _sukaustytas = false)

## Apakinimas
func apakinti(trukmė: float) -> void:
	_apakinas = true
	_taikinys = null
	get_tree().create_timer(trukmė).timeout.connect(func(): _apakinas = false)

## Mirtis
func _mirti() -> void:
	_mirtas = true
	velocity = Vector3.ZERO

	remove_from_group("priesas")

	GameManager.prideti_taskus(taskų_uz_nuzudyma)

	if animacijos_leist:
		animacijos_leist.play("death")
		await animacijos_leist.animation_finished

	emit_signal("mirtas", self)
	queue_free()

func hp_procentas() -> float:
	return dabartines_gyvybes / max_gyvybes
