## player.gd
## Žaidėjo pagrindinis valdiklis - visi veikėjai paveldi šį klasę
class_name Player
extends CharacterBody3D

# Pagrindinės statistikos (pakeičiamos vaikų klasėse)
var veikejo_vardas: String = "Veikėjas"
var max_gyvybes: float = 100.0
var dabartines_gyvybes: float = 100.0
var sarvai: float = 10.0
var ataka: float = 20.0
var greitis: float = 5.0
var atakos_atstumas: float = 2.0
var atakos_greitis: float = 1.0  # Atakų per sekundę

# Gebėjimų atsistatymo laikai (cooldown)
var gebejimu_pavadinimai: Array[String] = ["", "", ""]
var gebejimu_atsistatymai: Array[float] = [0.0, 0.0, 0.0]
var gebejimu_max_atsistatymai: Array[float] = [10.0, 15.0, 25.0]

# Vidinis stovio valdymas
var _mirtas: bool = false
var _puolama: bool = false
var _atakos_laikmatis: float = 0.0
var _nukreipimas: Vector3 = Vector3.ZERO
var _artimausias_priesas: Node3D = null

# Lietimas / valdymas
var _lietimo_pradzios_poz: Vector2 = Vector2.ZERO
var _lietimo_aktyvus: bool = false
var _min_braukimo_atstumas: float = 50.0

# Gravitacija
var gravitacija: float = ProjectSettings.get_setting("physics/3d/default_gravity")

# Signalai
signal gyvybes_pasikeitė(dabartines: float, max_gyvybiu: float)
signal mirtas()
signal gebejimas_naudotas(gebejimo_nr: int)
signal priesai_aptikti(priesai: Array)

# Mazgų nuorodos (nustatomos _ready)
@onready var animacijos_leist: AnimationPlayer = $AnimationPlayer if has_node("AnimationPlayer") else null
@onready var atakos_zona: Area3D = $AttackArea if has_node("AttackArea") else null
@onready var hp_baras: ProgressBar = $HPBar3D if has_node("HPBar3D") else null
@onready var efektai: GPUParticles3D = $Effects if has_node("Effects") else null

func _ready() -> void:
	add_to_group("zaidejas")
	nustatyti_statistikas()
	dabartines_gyvybes = max_gyvybes
	emit_signal("gyvybes_pasikeitė", dabartines_gyvybes, max_gyvybes)

## Perkraunama vaikų klasėse statistikoms nustatyti
func nustatyti_statistikas() -> void:
	pass

func _physics_process(delta: float) -> void:
	if _mirtas:
		return

	# Gravitacija
	if not is_on_floor():
		velocity.y -= gravitacija * delta

	# Judėjimas
	var kryptis = _nukreipimas.normalized()
	if kryptis != Vector3.ZERO:
		velocity.x = kryptis.x * greitis
		velocity.z = kryptis.z * greitis
		look_at(global_position + kryptis, Vector3.UP)
	else:
		velocity.x = move_toward(velocity.x, 0, greitis)
		velocity.z = move_toward(velocity.z, 0, greitis)

	move_and_slide()

	# Atakos laikmatis
	if _atakos_laikmatis > 0:
		_atakos_laikmatis -= delta

	# Gebėjimų atsistatymas
	for i in gebejimu_atsistatymai.size():
		if gebejimu_atsistatymai[i] > 0:
			gebejimu_atsistatymai[i] -= delta

	# Automatinė ataka artimiausiems priešams
	_auto_ataka(delta)

func _input(event: InputEvent) -> void:
	if _mirtas:
		return

	# Jutiklinio ekrano lietimo valdymas (judėjimas)
	if event is InputEventScreenTouch:
		if event.index == 0:  # Pirmasis pirštas - judėjimas
			if event.pressed:
				_lietimo_pradzios_poz = event.position
				_lietimo_aktyvus = true
			else:
				_lietimo_aktyvus = false
				_nukreipimas = Vector3.ZERO

	if event is InputEventScreenDrag:
		if event.index == 0 and _lietimo_aktyvus:
			var delta_poz = event.position - _lietimo_pradzios_poz
			if delta_poz.length() > _min_braukimo_atstumas:
				_nukreipimas = Vector3(delta_poz.x, 0, delta_poz.y).normalized()

## Automatiškai puola artimiausius priešus
func _auto_ataka(_delta: float) -> void:
	if _atakos_laikmatis > 0:
		return

	var priesai = get_tree().get_nodes_in_group("priesas")
	var artimausias_atstumas = atakos_atstumas * 1.5
	_artimausias_priesais = null

	for priesas in priesai:
		var atstumas = global_position.distance_to(priesas.global_position)
		if atstumas < artimausias_atstumas:
			artimausias_atstumas = atstumas
			_artimausias_priesas = priesas

	if _artimausias_priesas != null:
		atakuoti(_artimausias_priesas)

## Pagrindinė atakos funkcija
func atakuoti(taikinys: Node) -> void:
	if _atakos_laikmatis > 0 or _mirtas:
		return

	_atakos_laikmatis = 1.0 / atakos_greitis

	# Pasukti į priešą
	if taikinys.global_position != global_position:
		look_at(Vector3(taikinys.global_position.x, global_position.y, taikinys.global_position.z), Vector3.UP)

	# Animacija
	if animacijos_leist:
		animacijos_leist.play("attack")

	# Žala
	var žala = apskaičiuoti_žalą()
	if taikinys.has_method("gauti_žalą"):
		taikinys.gauti_žalą(žala)

	GameManager.prideti_taskus(5)

## Žalos apskaičiavimas (gali būti perkraunama)
func apskaičiuoti_žalą() -> float:
	return ataka * randf_range(0.8, 1.2)

## Žalos gavimas
func gauti_žalą(žala: float) -> void:
	if _mirtas:
		return

	var tikroji_žala = max(1.0, žala - sarvai * 0.5)
	dabartines_gyvybes -= tikroji_žala
	dabartines_gyvybes = max(0.0, dabartines_gyvybes)

	emit_signal("gyvybes_pasikeitė", dabartines_gyvybes, max_gyvybes)

	# Animacija
	if animacijos_leist:
		animacijos_leist.play("hit")

	if dabartines_gyvybes <= 0:
		_mirti()

## Gydymas
func gyti(kiekis: float) -> void:
	dabartines_gyvybes = min(max_gyvybes, dabartines_gyvybes + kiekis)
	emit_signal("gyvybes_pasikeitė", dabartines_gyvybes, max_gyvybes)

## Žaidėjo mirtis
func _mirti() -> void:
	_mirtas = true
	velocity = Vector3.ZERO

	if animacijos_leist:
		animacijos_leist.play("death")

	emit_signal("mirtas")
	GameManager.zaidejas_mirtas()

## Gebėjimų naudojimas (perkraunama vaikų klasėse)
func naudoti_gebejima(nr: int) -> void:
	if nr < 0 or nr >= gebejimu_atsistatymai.size():
		return
	if gebejimu_atsistatymai[nr] > 0:
		return  # Dar neatsistatė
	if _mirtas:
		return

	emit_signal("gebejimas_naudotas", nr)
	_vykdyti_gebejima(nr)

## Perkraunama vaikų klasėse
func _vykdyti_gebejima(_nr: int) -> void:
	pass

## Gauti priešus spindulyje
func gauti_priesus_spindulyje(centras: Vector3, spindulys: float) -> Array:
	var priesai = get_tree().get_nodes_in_group("priesas")
	var rezultatas = []
	for priesas in priesai:
		if centras.distance_to(priesas.global_position) <= spindulys:
			rezultatas.append(priesas)
	return rezultatas

## HP gyvybių procentas
func hp_procentas() -> float:
	return dabartines_gyvybes / max_gyvybes
