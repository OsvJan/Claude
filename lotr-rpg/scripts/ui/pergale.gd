## pergale.gd
## Pergalės ekrano valdymas
extends Control

@onready var taskai_label: Label = $KontainerisKentras/TaskaiLabel
@onready var rekordas_label: Label = $KontainerisKentras/RekordasLabel
@onready var veikejo_label: Label = $KontainerisKentras/VeikejasLabel
@onready var animacijos_leist: AnimationPlayer = $AnimationPlayer
@onready var pagrindinis_mygtuk: Button = $KontainerisKentras/PagrindinisMygtuk

func _ready() -> void:
	taskai_label.text = "Taškai: %d" % GameManager.taskai
	rekordas_label.text = "Rekordas: %d" % GameManager.rekordas
	veikejo_label.text = "Žaidėte kaip: %s" % GameManager.pasirinktas_veikėjas

	pagrindinis_mygtuk.pressed.connect(_pagrindinis_meniu)

	if animacijos_leist:
		animacijos_leist.play("victory_fanfare")

func _pagrindinis_meniu() -> void:
	GameManager.grizti_i_meniu()
