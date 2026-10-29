class_name TurnManager
extends Node

## Manages player rotations, turns, timeouts, and state machines for 2P and 4P modes.

signal turn_started(player_id: int, player_name: String, seat_index: int)
signal turn_ended(player_id: int)
signal match_finished(winner_seat: int)

var active_player_index: int = 0
var total_players: int = 2
var players: Array = []
var turn_sequence_number: int = 0
var shot_in_progress: bool = false

func setup_match(player_list: Array) -> void:
	players = player_list
	total_players = player_list.size()
	active_player_index = 0
	turn_sequence_number = 0
	shot_in_progress = false

func start_first_turn() -> void:
	if players.is_empty():
		return
	var current = players[active_player_index]
	turn_sequence_number += 1
	turn_started.emit(current.id, current.name, active_player_index)

func advance_turn(keep_turn: bool = false) -> void:
	if total_players == 0:
		return
	shot_in_progress = false
	if not keep_turn:
		active_player_index = (active_player_index + 1) % total_players
	turn_sequence_number += 1
	var current = players[active_player_index]
	turn_started.emit(current.id, current.name, active_player_index)

func get_current_player() -> Dictionary:
	if players.is_empty():
		return {}
	return players[active_player_index]
