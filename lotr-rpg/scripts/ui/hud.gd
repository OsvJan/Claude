## hud.gd
## Žaidimo HUD (heads-up display) valdymas
extends CanvasLayer

# HP baras
@onready var hp_baras: ProgressBar = $HUDKontaineris/KairesPanelis/HPBaras
@onready var hp_label: Label = $HUDKontaineris/KairesPanelis/HPLabel
@onready var veikejo_label: Label = $HUDKontaineris/KairesPanelis/VeikejasLabel

# Taškų ir lygio informacija
@onready var taskai_label: Label = $HUDKontaineris/VirsusLabel/TaskaiLabel
@onready var lygis_label: Label = $HUDKontaineris/VirsusLabel/LygisLabel
@onready var banga_label: Label = $HUDKontaineris/VirsusLabel/BangaLabel

# Gebėjimų mygtukai
@onready var gebejimas1_mygtuk: Button = $HUDKontaineris/ApaciuMygtukai/Gebejimas1
@onready var gebejimas2_mygtuk: Button = $HUDKontaineris/ApaciuMygtukai/Gebejimas2
@onready var gebejimas3_mygtuk: Button = $HUDKontaineris/ApaciuMygtukai/Gebejimas3

# Cooldown indikatoriai
@onready var cooldown1: ProgressBar = $HUDKontaineris/ApaciuMygtukai/Gebejimas1/CooldownBaras
@onready var cooldown2: ProgressBar = $HUDKontaineris/ApaciuMygtukai/Gebejimas2/CooldownBaras
@onready var cooldown3: ProgressBar = $HUDKontaineris/ApaciuMygtukai/Gebejimas3/CooldownBaras

# Pristabdymo mygtukas
@onready var pristabdyti_mygtuk: Button = $HUDKontaineris/VirsusLabel/PristabdytiMygtuk

# Pauzės ekranas
@onready var pauze_ekranas: Control = $PauzeEkranas

# Boso HP baras
@onready var boso_hp_konteineris: Control = $HUDKontaineris/BosoHPKonteineris
@onready var boso_hp_baras: ProgressBar = $HUDKontaineris/BosoHPKonteineris/BosoHPBaras
@onready var boso_vardas_label: Label = $HUDKontaineris/BosoHPKonteineris/BosoVardasLabel
@onready var boso_faze_label: Label = $HUDKontaineris/BosoHPKonteineris/FazeLabel

# Bangų pranešimas
@onready var bangos_pranesimai: Label = $BangosPranesimai

var _zaidejas: Player = null

func _ready() -> void:
	gebejimas1_mygtuk.pressed.connect(func(): _naudoti_gebejima(0))
	gebejimas2_mygtuk.pressed.connect(func(): _naudoti_gebejima(1))
	gebejimas3_mygtuk.pressed.connect(func(): _naudoti_gebejima(2))
	pristabdyti_mygtuk.pressed.connect(_pristabdyti)

	boso_hp_konteineris.visible = false
	pauze_ekranas.visible = false
	bangos_pranesimai.visible = false

	# Prisijungti prie žaidimo signalų
	GameManager.taskai_pasikeitė.connect(_atnaujinti_taskus)
	lygis_label.text = GameManager.gauti_lygio_pavadinima()

	# Rasti žaidėją
	call_deferred("_rasti_zaideja")

func _rasti_zaideja() -> void:
	await get_tree().process_frame
	var zaidejai = get_tree().get_nodes_in_group("zaidejas")
	if not zaidejai.is_empty():
		_prisijungti_prie_zaidejo(zaidejai[0])

func _prisijungti_prie_zaidejo(zaidejas: Player) -> void:
	_zaidejas = zaidejas
	zaidejas.gyvybes_pasikeitė.connect(_atnaujinti_hp)

	# Nustatyti gebėjimų pavadinimus
	if zaidejas.gebejimu_pavadinimai.size() >= 3:
		gebejimas1_mygtuk.text = zaidejas.gebejimu_pavadinimai[0].left(15)
		gebejimas2_mygtuk.text = zaidejas.gebejimu_pavadinimai[1].left(15)
		gebejimas3_mygtuk.text = zaidejas.gebejimu_pavadinimai[2].left(15)

	veikejo_label.text = zaidejas.veikejo_vardas
	_atnaujinti_hp(zaidejas.dabartines_gyvybes, zaidejas.max_gyvybes)

func _process(_delta: float) -> void:
	# Gebėjimų cooldown atnaujinimas
	if _zaidejas:
		_atnaujinti_cooldown()

func _atnaujinti_cooldown() -> void:
	if not _zaidejas:
		return

	var cooldown_barai = [cooldown1, cooldown2, cooldown3]

	for i in 3:
		if i < _zaidejas.gebejimu_atsistatymai.size():
			var cooldown = _zaidejas.gebejimu_atsistatymai[i]
			var max_cooldown = _zaidejas.gebejimu_max_atsistatymai[i]
			var baras = cooldown_barai[i]

			if baras:
				baras.value = (cooldown / max_cooldown) * 100.0
				# Pilkai jei cooldown, žaliai jei paruošta
				var paruosta = cooldown <= 0
				var mygtukai = [gebejimas1_mygtuk, gebejimas2_mygtuk, gebejimas3_mygtuk]
				mygtukai[i].modulate = Color.WHITE if paruosta else Color(0.5, 0.5, 0.5)

func _atnaujinti_hp(dabartines: float, max_hp: float) -> void:
	hp_baras.value = (dabartines / max_hp) * 100.0
	hp_label.text = "%d / %d" % [int(dabartines), int(max_hp)]

	# HP baro spalva pagal kiekį
	if dabartines / max_hp > 0.6:
		hp_baras.add_theme_color_override("fill_color", Color(0.1, 0.8, 0.1))
	elif dabartines / max_hp > 0.3:
		hp_baras.add_theme_color_override("fill_color", Color(0.9, 0.7, 0.1))
	else:
		hp_baras.add_theme_color_override("fill_color", Color(0.9, 0.1, 0.1))

func _atnaujinti_taskus(nauji_taskai: int) -> void:
	taskai_label.text = "Taškai: %d" % nauji_taskai

func _naudoti_gebejima(nr: int) -> void:
	if _zaidejas:
		_zaidejas.naudoti_gebejima(nr)

func _pristabdyti() -> void:
	var pristabdyta = not get_tree().paused
	get_tree().paused = pristabdyta
	pauze_ekranas.visible = pristabdyta

func rodyti_boso_hp(bosą: Node, vardas: String) -> void:
	boso_hp_konteineris.visible = true
	boso_vardas_label.text = vardas
	bosą.gyvybes_pasikeitė.connect(func(dab, max_hp):
		boso_hp_baras.value = (dab / max_hp) * 100.0
	)
	if bosą.has_signal("faze_pasikeitė"):
		bosą.faze_pasikeitė.connect(func(faze):
			boso_faze_label.text = "Fazė %d" % (faze + 1)
		)

func rodyti_bangos_pranesiima(tekstas: String) -> void:
	bangos_pranesimai.text = tekstas
	bangos_pranesimai.visible = true
	bangos_pranesimai.modulate.a = 1.0

	var tvinas = create_tween()
	tvinas.tween_interval(2.0)
	tvinas.tween_property(bangos_pranesimai, "modulate:a", 0.0, 1.0)
	tvinas.tween_callback(func(): bangos_pranesimai.visible = false)
