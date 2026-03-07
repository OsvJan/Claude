## audio_manager.gd
## Garso valdytojas (Singleton)
extends Node

var _muzika_leidžiama: bool = true
var _garsai_leidžiami: bool = true

@onready var muzikos_leist: AudioStreamPlayer = AudioStreamPlayer.new()
@onready var efektu_leist: AudioStreamPlayer = AudioStreamPlayer.new()

func _ready() -> void:
	add_child(muzikos_leist)
	add_child(efektu_leist)
	muzikos_leist.bus = "Music"
	efektu_leist.bus = "SFX"

func leisti_muzika(srautas: AudioStream, kilpa: bool = true) -> void:
	if not _muzika_leidžiama or not srautas:
		return
	muzikos_leist.stream = srautas
	muzikos_leist.stream.loop = kilpa if srautas.has_method("set_loop") else kilpa
	muzikos_leist.play()

func leisti_efekta(srautas: AudioStream) -> void:
	if not _garsai_leidžiami or not srautas:
		return
	efektu_leist.stream = srautas
	efektu_leist.play()

func sustabdyti_muzika() -> void:
	muzikos_leist.stop()

func perjungti_muzika(jungti: bool) -> void:
	_muzika_leidžiama = jungti
	if not jungti:
		muzikos_leist.stop()

func perjungti_garsus(jungti: bool) -> void:
	_garsai_leidžiami = jungti
