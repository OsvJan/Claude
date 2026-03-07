## orkas.gd
## Orkas - paprastas priešas (Šyro ir Morijos lygiai)
class_name Orkas
extends PriesasBazinis

func nustatyti_statistikas() -> void:
	prieso_vardas = "Orkas"
	tipas = PriesoTipas.ORKAS
	max_gyvybes = 50.0
	ataka = 10.0
	greitis = 3.2
	atakos_atstumas = 1.8
	atakos_greitis = 1.0
	taskų_uz_nuzudyma = 20
	agresyvumo_spindulys = 12.0
