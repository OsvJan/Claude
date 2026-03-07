## balrogas.gd
## Balrogas - Morgotho demonas, galutinis bosas
## Trijų fazių kova
class_name Balrogas
extends PriesasBazinis

enum BalrogoFaze { UGNIS, SETA, PASKUTINE }

var _faze: BalrogoFaze = BalrogoFaze.UGNIS
var _specialios_atakos_laikmatis: float = 0.0
var _ugnis_seta_aktyvus: bool = false

# Boso HP fazių ribos
const FAZE_2_HP: float = 0.60  # 60% HP - perėjimas į 2 fazę
const FAZE_3_HP: float = 0.30  # 30% HP - perėjimas į 3 fazę

signal faze_pasikeitė(nauja_faze: int)
signal bosas_nugaletas()

func nustatyti_statistikas() -> void:
	prieso_vardas = "Balrogas"
	tipas = PriesoTipas.BALROGAS
	max_gyvybes = 1500.0
	ataka = 60.0
	greitis = 3.0
	atakos_atstumas = 4.0
	atakos_greitis = 0.5
	taskų_uz_nuzudyma = 1000
	agresyvumo_spindulys = 30.0

func _physics_process(delta: float) -> void:
	super._physics_process(delta)

	if _specialios_atakos_laikmatis > 0:
		_specialios_atakos_laikmatis -= delta

	_tikrinti_faze()

## Fazių perėjimas
func _tikrinti_faze() -> void:
	var hp = hp_procentas()

	match _faze:
		BalrogoFaze.UGNIS:
			if hp < FAZE_2_HP:
				_keisti_faze(BalrogoFaze.SETA)
		BalrogoFaze.SETA:
			if hp < FAZE_3_HP:
				_keisti_faze(BalrogoFaze.PASKUTINE)

func _keisti_faze(nauja: BalrogoFaze) -> void:
	_faze = nauja
	emit_signal("faze_pasikeitė", int(nauja))

	match nauja:
		BalrogoFaze.SETA:
			ataka = 85.0
			greitis = 4.0
			# Aktyvuoti ugnies sietą aplink
			_aktyvuoti_ugnis_sieta()
		BalrogoFaze.PASKUTINE:
			ataka = 120.0
			greitis = 5.5
			max_gyvybes = dabartines_gyvybes  # Neauga HP

## Specialios atakos
func _bandyti_atakuoti() -> void:
	if _atakos_laikmatis > 0 or not _taikinys:
		return

	_atakos_laikmatis = 1.0 / atakos_greitis

	match _faze:
		BalrogoFaze.UGNIS:
			_ugnies_smūgis()
		BalrogoFaze.SETA:
			_setos_rimbas()
		BalrogoFaze.PASKUTINE:
			_pragaro_liepsna()

## Fazė 1: Ugnies Smūgis
func _ugnies_smūgis() -> void:
	if animacijos_leist:
		animacijos_leist.play("fire_strike")

	# AoE aplink save
	var priesai = get_tree().get_nodes_in_group("zaidejas")
	for zaidejas in priesai:
		var atstumas = global_position.distance_to(zaidejas.global_position)
		if atstumas < atakos_atstumas and zaidejas.has_method("gauti_žalą"):
			zaidejas.gauti_žalą(ataka)

	# 20% šansas - toli šaudanti ugnies kulka
	if randf() < 0.2 and _specialios_atakos_laikmatis <= 0:
		_specialios_atakos_laikmatis = 5.0
		_ugnies_kulka()

## Ugnies kulka - tolimoji ataka
func _ugnies_kulka() -> void:
	if not _taikinys:
		return
	# Momentali ataka
	if _taikinys.has_method("gauti_žalą"):
		_taikinys.gauti_žalą(ataka * 1.5)

## Fazė 2: Šėtos Rimbas
func _setos_rimbas() -> void:
	if animacijos_leist:
		animacijos_leist.play("whip_attack")

	# Linijinė ataka priekyje
	var kryptis = -transform.basis.z
	var priesai = get_tree().get_nodes_in_group("zaidejas")

	for zaidejas in priesai:
		var pries_kryptis = (zaidejas.global_position - global_position).normalized()
		var kampas = kryptis.dot(pries_kryptis)
		var atstumas = global_position.distance_to(zaidejas.global_position)

		if kampas > 0.5 and atstumas < 8.0:
			if zaidejas.has_method("gauti_žalą"):
				zaidejas.gauti_žalą(ataka * 1.8)
			if zaidejas.has_method("sukaustyti"):
				zaidejas.sukaustyti(1.0)

## Fazė 3: Pragaro Liepsna - kiekvienas smūgis AoE
func _pragaro_liepsna() -> void:
	if animacijos_leist:
		animacijos_leist.play("inferno")

	# Milžiniškas AoE
	var priesai = get_tree().get_nodes_in_group("zaidejas")
	for zaidejas in priesai:
		var atstumas = global_position.distance_to(zaidejas.global_position)
		if atstumas < 10.0 and zaidejas.has_method("gauti_žalą"):
			zaidejas.gauti_žalą(ataka * 2.0)

## Ugnies sieta - nuolatinė žala žaidėjui netoliese
func _aktyvuoti_ugnis_sieta() -> void:
	_ugnis_seta_aktyvus = true
	_ugnis_sietos_ciklas()

func _ugnis_sietos_ciklas() -> void:
	if not _ugnis_seta_aktyvus or _mirtas:
		return

	var zaidejai = get_tree().get_nodes_in_group("zaidejas")
	for zaidejas in zaidejai:
		var atstumas = global_position.distance_to(zaidejas.global_position)
		if atstumas < 6.0 and zaidejas.has_method("gauti_žalą"):
			zaidejas.gauti_žalą(15.0)

	await get_tree().create_timer(1.5).timeout
	_ugnis_sietos_ciklas()

## Balrogo mirtis - pergalės scena
func _mirti() -> void:
	remove_from_group("priesas")
	_mirtas = true
	_ugnis_seta_aktyvus = false
	velocity = Vector3.ZERO

	GameManager.prideti_taskus(taskų_uz_nuzudyma)

	if animacijos_leist:
		animacijos_leist.play("death_fall")
		await animacijos_leist.animation_finished

	emit_signal("mirtas", self)
	emit_signal("bosas_nugaletas")

	# Pergalė!
	await get_tree().create_timer(2.0).timeout
	GameManager.pergale()

	queue_free()
