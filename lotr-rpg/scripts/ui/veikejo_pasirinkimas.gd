## veikejo_pasirinkimas.gd
## Veikėjo pasirinkimo ekrano valdymas
extends Control

# Veikėjų duomenys
const VEIKEJŲ_DUOMENYS = {
	"Aragorn": {
		"aprasas": "Karalius Elessar - Gondoro paveldėtojas.\nSubalansuotas kovotojas su lyderystės galiomis.\n\nGeriausiai tinka pradedantiesiems.",
		"statistikos": {"Gyvybės": 150, "Sarvai": 20, "Ataka": 35, "Greitis": 5},
		"gebejimai": [
			"⚔ Andúril Smūgis - 3x žala (8s)",
			"👑 Karalių Šauksmas - AoE stuporis (20s)",
			"✨ Dúnedain Gydymas - +40 HP (35s)"
		],
		"spalva": Color(0.8, 0.6, 0.1)  # Aukso spalva
	},
	"Gandalfas": {
		"aprasas": "Gandalfas Baltasis - Istari burtininkas.\nGalingas iš atstumo, silpnesnis artimoje kovoje.\n\nTinka patyrusiems žaidėjams.",
		"statistikos": {"Gyvybės": 100, "Sarvai": 10, "Ataka": 55, "Greitis": 4},
		"gebejimai": [
			"🔥 \"Nenueisi!\" - Ugnies siena (18s)",
			"⚡ Glamdring Žaibas - Linijinis žaibas (12s)",
			"💡 Šviesos Blyksnis - Apakinimas (22s)"
		],
		"spalva": Color(0.9, 0.9, 0.9)  # Balta spalva
	},
	"Legolas": {
		"aprasas": "Legolas Žaliasmedis - Elfo karalaitis.\nGreičiausias veikėjas, šaudo iš atstumo.\n\nTinka žaidėjams mėgstantiems greitį.",
		"statistikos": {"Gyvybės": 110, "Sarvai": 12, "Ataka": 40, "Greitis": 8},
		"gebejimai": [
			"🏹 Strėlių Lietus - AoE strėlės (12s)",
			"💨 Žaibiškas Šūvis - 4x kritinis (8s)",
			"🌟 Elfo Vengimas - 5s nemirtingumas (28s)"
		],
		"spalva": Color(0.2, 0.8, 0.4)  # Žalia spalva
	},
	"Gimlis": {
		"aprasas": "Gimlis, Glóino sūnus - Nykštukas karys.\nDaugiausiai gyvybių ir sarvų. Lėčiausias.\n\nTinka žaidėjams mėgstantiems tanką.",
		"statistikos": {"Gyvybės": 200, "Sarvai": 35, "Ataka": 48, "Greitis": 3},
		"gebejimai": [
			"🪓 Baruk Khazâd! - Sukimosi AoE (10s)",
			"🛡 Gynybinė Laikysena - 2x sarvai (22s)",
			"🪓 Kirvio Metimas - Nuotolinė ataka (14s)"
		],
		"spalva": Color(0.7, 0.4, 0.1)  # Ruda spalva
	}
}

var pasirinktas: String = "Aragorn"

@onready var veikejo_vardas_label: Label = $InfoPanelis/VardasLabel
@onready var aprasas_label: Label = $InfoPanelis/AprasasLabel
@onready var gebejimu_list: VBoxContainer = $InfoPanelis/GebejimuList
@onready var statistiku_grid: GridContainer = $InfoPanelis/StatistikuGrid
@onready var veikejo_modelis_viewport: SubViewport = $ModelioViewport
@onready var pasirinkti_mygtuk: Button = $ApaciaMygtukai/PasirinktiMygtuk
@onready var atgal_mygtuk: Button = $ApaciaMygtukai/AtgalMygtuk

# Veikėjų pasirinkimo mygtukai
@onready var aragorn_mygtuk: Button = $VeikejuSarasas/AragornMygtuk
@onready var gandalfas_mygtuk: Button = $VeikejuSarasas/GandalfasMygtuk
@onready var legolas_mygtuk: Button = $VeikejuSarasas/LegolasMygtuk
@onready var gimlis_mygtuk: Button = $VeikejuSarasas/GimlisMygtuk

func _ready() -> void:
	aragorn_mygtuk.pressed.connect(func(): _pasirinkti_veikeja("Aragorn"))
	gandalfas_mygtuk.pressed.connect(func(): _pasirinkti_veikeja("Gandalfas"))
	legolas_mygtuk.pressed.connect(func(): _pasirinkti_veikeja("Legolas"))
	gimlis_mygtuk.pressed.connect(func(): _pasirinkti_veikeja("Gimlis"))

	pasirinkti_mygtuk.pressed.connect(_pradeti_su_pasirinktu)
	atgal_mygtuk.pressed.connect(_grizti_atgal)

	_pasirinkti_veikeja("Aragorn")

func _pasirinkti_veikeja(vardas: String) -> void:
	pasirinktas = vardas
	var duomenys = VEIKEJŲ_DUOMENYS[vardas]

	veikejo_vardas_label.text = vardas
	aprasas_label.text = duomenys["aprasas"]

	# Statistikos
	_atnaujinti_statistikas(duomenys["statistikos"])

	# Gebėjimai
	_atnaujinti_gebejimai(duomenys["gebejimai"])

	# Spalvos tematika
	var spalva = duomenys["spalva"]
	veikejo_vardas_label.add_theme_color_override("font_color", spalva)

	# Paryškinti pasirinktą mygtuką
	_atnaujinti_mygtukus(vardas)

func _atnaujinti_statistikas(statistikos: Dictionary) -> void:
	# Išvalyti senus duomenis
	for vaikas in statistiku_grid.get_children():
		vaikas.queue_free()

	# Pridėti naujus
	for pavadinimas in statistikos:
		var pav_label = Label.new()
		pav_label.text = pavadinimas + ":"
		pav_label.add_theme_color_override("font_color", Color.GRAY)
		statistiku_grid.add_child(pav_label)

		var reiksme_label = Label.new()
		reiksme_label.text = str(statistikos[pavadinimas])
		statistiku_grid.add_child(reiksme_label)

func _atnaujinti_gebejimai(gebejimai: Array) -> void:
	for vaikas in gebejimu_list.get_children():
		vaikas.queue_free()

	for i in gebejimai.size():
		var label = Label.new()
		label.text = gebejimai[i]
		label.add_theme_font_size_override("font_size", 14)
		gebejimu_list.add_child(label)

func _atnaujinti_mygtukus(pasirinktas_vardas: String) -> void:
	var visi_mygtukai = {
		"Aragorn": aragorn_mygtuk,
		"Gandalfas": gandalfas_mygtuk,
		"Legolas": legolas_mygtuk,
		"Gimlis": gimlis_mygtuk
	}

	for vardas in visi_mygtukai:
		var mygtuk = visi_mygtukai[vardas]
		if vardas == pasirinktas_vardas:
			mygtuk.add_theme_color_override("font_color", Color.GOLD)
		else:
			mygtuk.remove_theme_color_override("font_color")

func _pradeti_su_pasirinktu() -> void:
	GameManager.pasirinkti_veikeja(pasirinktas)
	GameManager.pradeti_zaima()

func _grizti_atgal() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
