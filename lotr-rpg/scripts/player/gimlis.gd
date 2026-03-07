## gimlis.gd
## Gimlis, Glóino sūnus - Nykštukas kovotojas
## Tankiausias ir stipriausias, bet lėčiausias
class_name Gimlis
extends Player

var _gynybine_laikysena_aktyvi: bool = false
var _originalus_sarvai: float = 0.0

func nustatyti_statistikas() -> void:
	veikejo_vardas = "Gimlis"
	max_gyvybes = 200.0     # Daugiausiai gyvybių
	sarvai = 35.0           # Daugiausiai sarvų
	ataka = 48.0
	greitis = 3.0           # Lėčiausias
	atakos_atstumas = 1.8
	atakos_greitis = 0.9    # Lėtesnis bet stipresnis

	gebejimu_pavadinimai = [
		"Baruk Khazâd!",
		"Gynybinė Laikysena",
		"Kirvio Metimas"
	]
	gebejimu_max_atsistatymai = [10.0, 22.0, 14.0]
	gebejimu_atsistatymai = [0.0, 0.0, 0.0]
	_originalus_sarvai = sarvai

## Gimlio stiprus smūgis - daugiau žalos nei kiti
func apskaičiuoti_žalą() -> float:
	return ataka * randf_range(0.9, 1.4)  # Didesnis kritinis diapazonas

func _vykdyti_gebejima(nr: int) -> void:
	match nr:
		0: _baruk_khazad()
		1: _gynybine_laikysena()
		2: _kirvio_metimas()

## Gebėjimas 1: Baruk Khazâd! - sukimosi AoE ataka
func _baruk_khazad() -> void:
	gebejimu_atsistatymai[0] = gebejimu_max_atsistatymai[0]

	if animacijos_leist:
		animacijos_leist.play("whirlwind")

	# Sukimosi ataka - puola visus aplinkui 3 kartus
	for _apsukimas in range(3):
		var priesai = gauti_priesus_spindulyje(global_position, 4.0)
		for priesas in priesai:
			if priesas.has_method("gauti_žalą"):
				priesas.gauti_žalą(ataka * 1.5)

	GameManager.prideti_taskus(80)

## Gebėjimas 2: Gynybinė Laikysena - +100% sarvai 8 sekundes
func _gynybine_laikysena() -> void:
	if _gynybine_laikysena_aktyvi:
		return

	gebejimu_atsistatymai[1] = gebejimu_max_atsistatymai[1]
	_gynybine_laikysena_aktyvi = true

	if animacijos_leist:
		animacijos_leist.play("defend")

	sarvai = _originalus_sarvai * 2.0
	GameManager.prideti_taskus(15)

	await get_tree().create_timer(8.0).timeout

	sarvai = _originalus_sarvai
	_gynybine_laikysena_aktyvi = false

## Gebėjimas 3: Kirvio Metimas - nuotolinė ataka
func _kirvio_metimas() -> void:
	gebejimu_atsistatymai[2] = gebejimu_max_atsistatymai[2]

	if animacijos_leist:
		animacijos_leist.play("throw_axe")

	# Taikosi į tolimą priešą
	var priesai = get_tree().get_nodes_in_group("priesas")
	var toliausias: Node = null
	var max_atstumas: float = 0.0

	for priesas in priesai:
		var atstumas = global_position.distance_to(priesas.global_position)
		if atstumas > max_atstumas and atstumas < 15.0:
			max_atstumas = atstumas
			toliausias = priesas

	if toliausias and toliausias.has_method("gauti_žalą"):
		toliausias.gauti_žalą(ataka * 2.5)
		if toliausias.has_method("sukaustyti"):
			toliausias.sukaustyti(2.0)

	GameManager.prideti_taskus(35)
