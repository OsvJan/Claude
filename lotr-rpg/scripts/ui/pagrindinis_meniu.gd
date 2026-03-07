## pagrindinis_meniu.gd
## Pagrindinio meniu valdymas
extends Control

@onready var zaisti_mygtuk: Button = $VBoxContainer/ZaistiMygtuk
@onready var nustatymai_mygtuk: Button = $VBoxContainer/NustatymaiMygtuk
@onready var iseiti_mygtuk: Button = $VBoxContainer/IseitiMygtuk
@onready var rekordas_label: Label = $RekordasLabel
@onready var animacijos_leist: AnimationPlayer = $AnimationPlayer

func _ready() -> void:
	zaisti_mygtuk.pressed.connect(_pradeti_zaima)
	nustatymai_mygtuk.pressed.connect(_atidaryti_nustatymus)
	iseiti_mygtuk.pressed.connect(_iseiti)

	rekordas_label.text = "Rekordas: %d" % GameManager.rekordas

	# Intro animacija
	if animacijos_leist:
		animacijos_leist.play("fade_in")

func _pradeti_zaima() -> void:
	get_tree().change_scene_to_file("res://scenes/veikejo_pasirinkimas.tscn")

func _atidaryti_nustatymus() -> void:
	get_tree().change_scene_to_file("res://scenes/nustatymai.tscn")

func _iseiti() -> void:
	get_tree().quit()
