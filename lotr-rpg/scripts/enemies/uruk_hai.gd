## uruk_hai.gd
## Uruk-hai - stipresnis priešas (Helmo Griovio lygis)
class_name UrukHai
extends PriesasBazinis

func nustatyti_statistikas() -> void:
	prieso_vardas = "Uruk-hai"
	tipas = PriesoTipas.URUK_HAI
	max_gyvybes = 120.0
	ataka = 22.0
	greitis = 4.0
	atakos_atstumas = 2.0
	atakos_greitis = 0.85
	taskų_uz_nuzudyma = 50
	agresyvumo_spindulys = 18.0

## Uruk-hai puolimas - šokinėja link taikinio
func _bandyti_atakuoti() -> void:
	if _atakos_laikmatis > 0 or not _taikinys:
		return

	_atakos_laikmatis = 1.0 / atakos_greitis

	if animacijos_leist:
		animacijos_leist.play("charge_attack")

	# Galingas smūgis
	if _taikinys.has_method("gauti_žalą"):
		var žala = ataka * randf_range(1.0, 1.5)
		_taikinys.gauti_žalą(žala)
