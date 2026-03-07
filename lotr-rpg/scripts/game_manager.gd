## GameManager.gd
## Pagrindinis žaidimo būsenos valdytojas (Singleton / Autoload)
extends Node

enum GameState {
	PAGRINDINIS_MENIU,
	VEIKEJO_PASIRINKIMAS,
	ZAIDIAMA,
	PRISTABDYTA,
	ZAIDEJAS_MIRTAS,
	PERGALE
}

# Žaidimo būsena
var dabartine_busena: GameState = GameState.PAGRINDINIS_MENIU
var pasirinktas_veikėjas: String = ""
var dabartinis_lygis: int = 0
var taskai: int = 0
var rekordas: int = 0

# Lygių keliai
const LYGIAI = [
	"res://scenes/levels/syras.tscn",
	"res://scenes/levels/moria.tscn",
	"res://scenes/levels/helmo_griovys.tscn",
	"res://scenes/levels/mordoras.tscn"
]

const LYGIU_PAVADINIMAI = [
	"Šyras - Kelionės Pradžia",
	"Moria - Tamsios Gelmės",
	"Helmo Griovys - Paskutinis Gynimas",
	"Mordoras - Ugnies Kalnas"
]

const LYGIU_APRASYMAI = [
	"Ramūs hobito namai virto pavojų lauku. Orkai užpuolė Šyrą!",
	"Tamsiose kasyklose tykoja pavojai. Išgyvenkite Morios siaubus.",
	"Šimtai tūkstančių Uruk-hai artinasi. Apsaugokite tvirtovę!",
	"Paskutinis mūšis. Sunaikinikite Sauronką ir išgelbėkite Viduržemį!"
]

# Signalai
signal busena_pasikeitė(nauja_busena)
signal taskai_pasikeitė(nauji_taskai)
signal lygis_baigtas(lygis)

func _ready() -> void:
	load_rekordas()

func keisti_busena(nauja_busena: GameState) -> void:
	dabartine_busena = nauja_busena
	emit_signal("busena_pasikeitė", nauja_busena)

func pasirinkti_veikeja(veikejo_vardas: String) -> void:
	pasirinktas_veikėjas = veikejo_vardas

func pradeti_zaima() -> void:
	dabartinis_lygis = 0
	taskai = 0
	krauti_lygi(dabartinis_lygis)

func krauti_lygi(lygis: int) -> void:
	if lygis < LYGIAI.size():
		keisti_busena(GameState.ZAIDIAMA)
		get_tree().change_scene_to_file(LYGIAI[lygis])
	else:
		pergale()

func sekantis_lygis() -> void:
	emit_signal("lygis_baigtas", dabartinis_lygis)
	dabartinis_lygis += 1
	krauti_lygi(dabartinis_lygis)

func prideti_taskus(taskų_kiekis: int) -> void:
	taskai += taskų_kiekis
	emit_signal("taskai_pasikeitė", taskai)
	if taskai > rekordas:
		rekordas = taskai
		save_rekordas()

func zaidejas_mirtas() -> void:
	keisti_busena(GameState.ZAIDEJAS_MIRTAS)

func pergale() -> void:
	keisti_busena(GameState.PERGALE)

func grizti_i_meniu() -> void:
	keisti_busena(GameState.PAGRINDINIS_MENIU)
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func save_rekordas() -> void:
	var failas = FileAccess.open("user://rekordas.dat", FileAccess.WRITE)
	if failas:
		failas.store_32(rekordas)
		failas.close()

func load_rekordas() -> void:
	var failas = FileAccess.open("user://rekordas.dat", FileAccess.READ)
	if failas:
		rekordas = failas.get_32()
		failas.close()

func gauti_lygio_pavadinima() -> String:
	if dabartinis_lygis < LYGIU_PAVADINIMAI.size():
		return LYGIU_PAVADINIMAI[dabartinis_lygis]
	return ""

func gauti_lygio_aprasyma() -> String:
	if dabartinis_lygis < LYGIU_APRASYMAI.size():
		return LYGIU_APRASYMAI[dabartinis_lygis]
	return ""
