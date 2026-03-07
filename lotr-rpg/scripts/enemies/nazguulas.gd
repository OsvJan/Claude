## nazguulas.gd
## Nazgûlas - Ringuolaidis, bosinis priešas
class_name Nazguulas
extends PriesasBazinis

var _faze: int = 1  # 1 = normalus, 2 = rūkų forma (< 40% HP)
var _rūkų_forma_aktyvi: bool = false
var _skleidzia_baime: bool = false

func nustatyti_statistikas() -> void:
	prieso_vardas = "Nazgûlas"
	tipas = PriesoTipas.NAZGUULAS
	max_gyvybes = 400.0
	ataka = 35.0
	greitis = 4.5
	atakos_atstumas = 2.5
	atakos_greitis = 0.75
	taskų_uz_nuzudyma = 200
	agresyvumo_spindulys = 25.0

func _physics_process(delta: float) -> void:
	super._physics_process(delta)
	_tikrinti_faze()
	_baimės_efektas()

## Fazių keitimas
func _tikrinti_faze() -> void:
	var hp_proc = hp_procentas()

	if hp_proc < 0.4 and _faze == 1:
		_faze = 2
		_aktyvuoti_ruku_forma()

## Rūkų forma - Nazgûlas tampa greitesnis ir dalinai nemirtingas
func _aktyvuoti_ruku_forma() -> void:
	_rūkų_forma_aktyvi = true
	greitis = 7.0
	ataka = 45.0

## Baimės skleidimas - sumažina žaidėjo greitį netoliese
func _baimės_efektas() -> void:
	if not _skleidzia_baime:
		_skleidzia_baime = true
		_taikyti_baimę()

func _taikyti_baimę() -> void:
	var zaidejai = get_tree().get_nodes_in_group("zaidejas")
	for zaidejas in zaidejai:
		var atstumas = global_position.distance_to(zaidejas.global_position)
		if atstumas < 8.0 and zaidejas.has_method("gauti_žalą"):
			zaidejas.gauti_žalą(5.0)  # Nuolatinė baimės žala

	await get_tree().create_timer(2.0).timeout
	_skleidzia_baime = false

## Rūkų forma - atakos nematomos
func gauti_žalą(žala: float) -> void:
	if _rūkų_forma_aktyvi:
		žala *= 0.5  # Pusė žalos rūkų formoje
	super.gauti_žalą(žala)

## Šaukimas - iškviečia 3 orkus
func _bandyti_atakuoti() -> void:
	super._bandyti_atakuoti()

	# 20% šansas iškviesti orkus
	if randf() < 0.2:
		_isskviesti_orkus()

func _isskviesti_orkus() -> void:
	# Signalizuoja bangų sistemai - iškviesti orkus
	var lygis = get_parent()
	if lygis and lygis.has_method("ispauksti_priesus"):
		lygis.ispauksti_priesus(3, "orkas", global_position)
