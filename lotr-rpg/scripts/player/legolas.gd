## legolas.gd
## Legolas Žaliasmedis - Mirkų karalius
## Greičiausias veikėjas, šaudo iš atstumo
class_name Legolas
extends Player

var _vengimas_aktyvus: bool = false

func nustatyti_statistikas() -> void:
	veikejo_vardas = "Legolas"
	max_gyvybes = 110.0
	sarvai = 12.0
	ataka = 40.0
	greitis = 8.0         # Greičiausias
	atakos_atstumas = 10.0  # Ilgiausias atstumas - lankas
	atakos_greitis = 1.8  # Greičiausias šaudymas

	gebejimu_pavadinimai = [
		"Strėlių Lietus",
		"Žaibiškas Šūvis",
		"Elfo Vengimas"
	]
	gebejimu_max_atsistatymai = [12.0, 8.0, 28.0]
	gebejimu_atsistatymai = [0.0, 0.0, 0.0]

## Vengimo metu nemirtingas
func gauti_žalą(žala: float) -> void:
	if _vengimas_aktyvus:
		return  # Nenualinamas
	super.gauti_žalą(žala)

func _vykdyti_gebejima(nr: int) -> void:
	match nr:
		0: _streeliu_lietus()
		1: _zaibiskas_suvis()
		2: _elfo_vengimas()

## Gebėjimas 1: Strėlių Lietus - AoE strėlės į visus priešus
func _streeliu_lietus() -> void:
	gebejimu_atsistatymai[0] = gebejimu_max_atsistatymai[0]

	if animacijos_leist:
		animacijos_leist.play("rain_of_arrows")

	var priesai = get_tree().get_nodes_in_group("priesas")
	for priesas in priesai:
		var atstumas = global_position.distance_to(priesas.global_position)
		if atstumas < atakos_atstumas * 1.3:
			# Kiekvienas priešas gauna žalos su nedideliu vėlinimu
			var priesas_ref = priesas
			get_tree().create_timer(randf_range(0.0, 0.5)).timeout.connect(
				func():
					if is_instance_valid(priesas_ref) and priesas_ref.has_method("gauti_žalą"):
						priesas_ref.gauti_žalą(ataka * 1.5)
			)

	GameManager.prideti_taskus(60)

## Gebėjimas 2: Žaibiškas Šūvis - vienas kritinis šūvis
func _zaibiskas_suvis() -> void:
	gebejimu_atsistatymai[1] = gebejimu_max_atsistatymai[1]

	if animacijos_leist:
		animacijos_leist.play("quick_shot")

	# Taikosi į artimiausią priešą
	var priesai = get_tree().get_nodes_in_group("priesas")
	var artimausias: Node = null
	var min_atstumas: float = atakos_atstumas * 2

	for priesas in priesai:
		var atstumas = global_position.distance_to(priesas.global_position)
		if atstumas < min_atstumas:
			min_atstumas = atstumas
			artimausias = priesas

	if artimausias and artimausias.has_method("gauti_žalą"):
		artimausias.gauti_žalą(ataka * 4.0)  # Kritinis smūgis
		if artimausias.has_method("sukaustyti"):
			artimausias.sukaustyti(1.5)

	GameManager.prideti_taskus(45)

## Gebėjimas 3: Elfo Vengimas - 5 sekundžių nemirtingumas
func _elfo_vengimas() -> void:
	gebejimu_atsistatymai[2] = gebejimu_max_atsistatymai[2]
	_vengimas_aktyvus = true

	if animacijos_leist:
		animacijos_leist.play("dodge")

	# Greičio padidinimas vengimo metu
	var originalus_greitis = greitis
	greitis = greitis * 2.0

	GameManager.prideti_taskus(20)

	await get_tree().create_timer(5.0).timeout

	_vengimas_aktyvus = false
	greitis = originalus_greitis
