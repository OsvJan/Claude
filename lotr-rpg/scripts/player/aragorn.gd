## aragorn.gd
## Aragorn - Karalius Elessar
## Subalansuotas kovotojas su lyderystės gebėjimais
class_name Aragorn
extends Player

func nustatyti_statistikas() -> void:
	veikejo_vardas = "Aragorn"
	max_gyvybes = 150.0
	sarvai = 20.0
	ataka = 35.0
	greitis = 5.0
	atakos_atstumas = 2.2
	atakos_greitis = 1.2

	gebejimu_pavadinimai = [
		"Andúril Smūgis",
		"Karalių Šauksmas",
		"Dúnedain Gydymas"
	]
	gebejimu_max_atsistatymai = [8.0, 20.0, 35.0]
	gebejimu_atsistatymai = [0.0, 0.0, 0.0]

func _vykdyti_gebejima(nr: int) -> void:
	match nr:
		0: _andúril_smugis()
		1: _karaliaus_suksmas()
		2: _dunedain_gydymas()

## Gebėjimas 1: Andúril Smūgis - galingas smūgis 3x žala
func _andúril_smugis() -> void:
	gebejimu_atsistatymai[0] = gebejimu_max_atsistatymai[0]

	if animacijos_leist:
		animacijos_leist.play("special_attack")

	# Priekinė atakos zona
	var kryptis = -transform.basis.z
	var patikrinimo_poz = global_position + kryptis * atakos_atstumas

	var priesai = gauti_priesus_spindulyje(patikrinimo_poz, 3.5)
	for priesas in priesai:
		if priesas.has_method("gauti_žalą"):
			priesas.gauti_žalą(ataka * 3.0)

	GameManager.prideti_taskus(50)
	_rodyti_efekta("andúril")

## Gebėjimas 2: Karalių Šauksmas - sukausto priešus aplink
func _karaliaus_suksmas() -> void:
	gebejimu_atsistatymai[1] = gebejimu_max_atsistatymai[1]

	if animacijos_leist:
		animacijos_leist.play("shout")

	var priesai = gauti_priesus_spindulyje(global_position, 8.0)
	for priesas in priesai:
		if priesas.has_method("sukaustyti"):
			priesas.sukaustyti(3.0)  # 3 sekundžių stuporis
		if priesas.has_method("gauti_žalą"):
			priesas.gauti_žalą(ataka * 0.5)

	GameManager.prideti_taskus(30)
	_rodyti_efekta("suksmas")

## Gebėjimas 3: Dúnedain Gydymas - atgaivina 40 gyvybių
func _dunedain_gydymas() -> void:
	gebejimu_atsistatymai[2] = gebejimu_max_atsistatymai[2]

	gyti(40.0)
	GameManager.prideti_taskus(10)
	_rodyti_efekta("gydymas")

func _rodyti_efekta(tipas: String) -> void:
	# Efektų rodymas - implementuojama su GPUParticles3D
	pass
