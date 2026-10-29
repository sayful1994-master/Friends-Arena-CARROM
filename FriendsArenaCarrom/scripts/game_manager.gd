class_name GameManager
extends Node

## Main game coordinator orchestrating turns, scoring, physics outcomes, and UI flow.

enum MatchState { MENU, LOBBY, PLAYING, PAUSED, GAME_OVER }

var match_state: MatchState = MatchState.MENU
var current_mode: RulesEngine.GameMode = RulesEngine.GameMode.TWO_PLAYER
var player_scores: Dictionary = {}
var active_turn: int = 0

signal state_changed(new_state: MatchState)
signal match_ready()

func _ready() -> void:
	match_state = MatchState.MENU

func start_practice() -> void:
	current_mode = RulesEngine.GameMode.PRACTICE
	match_state = MatchState.PLAYING
	state_changed.emit(match_state)

func start_two_player_match(p1_name: String = "Player 1", p2_name: String = "Player 2") -> void:
	current_mode = RulesEngine.GameMode.TWO_PLAYER
	match_state = MatchState.PLAYING
	state_changed.emit(match_state)

func start_four_player_match() -> void:
	current_mode = RulesEngine.GameMode.FOUR_PLAYER
	match_state = MatchState.PLAYING
	state_changed.emit(match_state)

func pause_game() -> void:
	if match_state == MatchState.PLAYING:
		match_state = MatchState.PAUSED
		state_changed.emit(match_state)

func resume_game() -> void:
	if match_state == MatchState.PAUSED:
		match_state = MatchState.PLAYING
		state_changed.emit(match_state)

func return_to_menu() -> void:
	match_state = MatchState.MENU
	state_changed.emit(match_state)
