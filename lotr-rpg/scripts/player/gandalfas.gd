## gandalfas.gd
## Gandalfas Pilkasis / Baltasis
## Galingas burtininkas su ilgu atakos atstumu
class_name Gandalfas
extends Player

var _nenueisi_aktyvus: bool = false

func nustatyti_statistikas() -> void:
	veikejo_vardas = "Gandalfas"
	max_gyvybes = 100.0
	sarvai = 10.0
	ataka = 55.0
	greitis = 4.0
	atakos_atstumas = 6.0   # Ilgas atstumas - magiškos atakos
	atakos_greitis = 0.9

	gebejimu_pavadinimai = [
		"\"Nenueisi!\"",
		"Glamdring Žaibas",
		"Šviesos Blyksnis"
	]
	gebejimu_max_atsistatymai = [18.0, 12.0, 22.0]
	gebejimu_atsistatymai = [0.0, 0.0, 0.0]

## Gandalfo ataka - magija iš atstumo
func atakuoti(taikinys: Node) -> void:
	if _atakos_laikmatis > 0 or _mirtas:
		return

	_atakos_laikmatis = 1.0 / atakos_greitis

	# Pasukti į priešą
	if taikinys.global_position != global_position:
		look_at(Vector3(taikinys.global_position.x, global_position.y, taikinys.global_position.z), Vector3.UP)

	# Magiška kulka
	_isšauti_magija(taikinys)

	if animacijos_leist:
		animacijos_leist.play("cast")

	GameManager.prideti_taskus(5)

func _isšauti_magija(taikinys: Node) -> void:
	# Momentaliai taikosi (hitscan stiliaus)
	var žala = apskaičiuoti_žalą()
	if taikinys.has_method("gauti_žalą"):
		taikinys.gauti_žalą(žala)
	# Vizualinis efektas paleidžiamas per scenos efektų sistemą

func _vykdyti_gebejima(nr: int) -> void:
	match nr:
		0: _nenueisi()
		1: _glamdring_zalbas()
		2: _sviesos_blyksnis()

## Gebėjimas 1: "Nenueisi!" - ugnies siena, sudegina visus priešus priekyje
func _nenueisi() -> void:
	gebejimu_atsistatymai[0] = gebejimu_max_atsistatymai[0]
	_nenueisi_aktyvus = true

	if animacijos_leist:
		animacijos_leist.play("nenueisi")

	# Plataus kūgio zona priekyje
	var kryptis = -transform.basis.z
	var priesai = get_tree().get_nodes_in_group("priesas")

	for priesas in priesai:
		var atstumas = global_position.distance_to(priesas.global_position)
		if atstumas < 10.0:
			var kryptis_pries = (priesas.global_position - global_position).normalized()
			var kampas = kryptis.dot(kryptis_pries)
			if kampas > 0.3:  # ~70° kūgis priekyje
				if priesas.has_method("gauti_žalą"):
					priesas.gauti_žalą(ataka * 2.5)
				if priesas.has_method("sukaustyti"):
					priesas.sukaustyti(2.0)

	GameManager.prideti_taskus(75)

	# Po 3s išjungti efektą
	await get_tree().create_timer(3.0).timeout
	_nenueisi_aktyvus = false

## Gebėjimas 2: Glamdring Žaibas - žaibo smūgis per visus priešus linijoje
func _glamdring_zalbas() -> void:
	gebejimu_atsistatymai[1] = gebejimu_max_atsistatymai[1]

	if animacijos_leist:
		animacijos_leist.play("lightning")

	var kryptis = -transform.basis.z
	var priesai = get_tree().get_nodes_in_group("priesas")

	for priesas in priesai:
		var pries_kryptis = (priesas.global_position - global_position).normalized()
		var kampas = kryptis.dot(pries_kryptis)
		var atstumas = global_position.distance_to(priesas.global_position)

		if kampas > 0.85 and atstumas < 12.0:  # Siaura linija priekyje
			if priesas.has_method("gauti_žalą"):
				priesas.gauti_žalą(ataka * 2.0)

	GameManager.prideti_taskus(40)

## Gebėjimas 3: Šviesos Blyksnis - apakina visus priešus 4 sekundes
func _sviesos_blyksnis() -> void:
	gebejimu_atsistatymai[2] = gebejimu_max_atsistatymai[2]

	if animacijos_leist:
		animacijos_leist.play("flash")

	var priesai = gauti_priesus_spindulyje(global_position, 12.0)
	for priesas in priesai:
		if priesas.has_method("apakinti"):
			priesas.apakinti(4.0)

	GameManager.prideti_taskus(35)
