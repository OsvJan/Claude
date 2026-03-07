## zaidejas_mirtas.gd
## Žaidėjo mirties ekrano valdymas
extends Control

@onready var taskai_label: Label = $KontainerisKentras/TaskaiLabel
@ontml_export var rekordas_label: Label = $KontainerisKentras/RekordasLabel
@onready var bandyti_vel_mygtuk: Button = $KontainerisKentras/BandytiVelMygtuk
@onready var pagrindinis_mygtuk: Button = $KontainerisKentras/PagrindinisMygtuk

func _ready() -> void:
	taskai_label.text = "Taškai: %d" % GameManager.taskai
	rekordas_label.text = "Rekordas: %d" % GameManager.rekordas

	bandyti_vel_mygtuk.pressed.connect(_bandyti_vel)
	pagrindinis_mygtuk.pressed.connect(_pagrindinis_meniu)

func _bandyti_vel() -> void:
	GameManager.pradeti_zaima()

func _pagrindinis_meniu() -> void:
	GameManager.grizti_i_meniu()
