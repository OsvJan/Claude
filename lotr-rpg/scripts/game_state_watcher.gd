## game_state_watcher.gd
## Stebi žaidimo būseną ir perjungia scenas
## Pridėkite šį skriptą kaip Autoload arba į pagrindinę sceną
extends Node

func _ready() -> void:
	GameManager.busena_pasikeitė.connect(_busena_pasikeitė)

func _busena_pasikeitė(nauja_busena: GameManager.GameState) -> void:
	match nauja_busena:
		GameManager.GameState.ZAIDEJAS_MIRTAS:
			await get_tree().create_timer(2.0).timeout
			get_tree().change_scene_to_file("res://scenes/zaidejas_mirtas.tscn")
		GameManager.GameState.PERGALE:
			await get_tree().create_timer(2.0).timeout
			get_tree().change_scene_to_file("res://scenes/pergale.tscn")
		GameManager.GameState.PAGRINDINIS_MENIU:
			get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
