class_name ScoringManager
extends Node

## Tracks scores, fouls, coin pocket statistics, and win condition checks.

signal score_updated(player_id: int, new_score: int, white_remaining: int, black_remaining: int)
signal game_won(winner_id: int, summary: Dictionary)

var scores: Dictionary = {}
var fouls: Dictionary = {}
var white_coins_left: int = 9
var black_coins_left: int = 9
var queen_pocketed: bool = false
var target_winning_score: int = 25

func reset_scores(player_ids: Array) -> void:
	scores.clear()
	fouls.clear()
	white_coins_left = 9
	black_coins_left = 9
	queen_pocketed = false
	for pid in player_ids:
		scores[pid] = 0
		fouls[pid] = 0

func add_points(player_id: int, points: int) -> void:
	if not scores.has(player_id):
		scores[player_id] = 0
	scores[player_id] = max(0, scores[player_id] + points)
	score_updated.emit(player_id, scores[player_id], white_coins_left, black_coins_left)

func record_foul(player_id: int) -> void:
	if not fouls.has(player_id):
		fouls[player_id] = 0
	fouls[player_id] += 1
	# Deduct standard penalty if score > 0
	add_points(player_id, -5)

func on_coin_pocketed(coin_type: int) -> void:
	if coin_type == RulesEngine.CoinType.WHITE:
		white_coins_left = max(0, white_coins_left - 1)
	elif coin_type == RulesEngine.CoinType.BLACK:
		black_coins_left = max(0, black_coins_left - 1)
	elif coin_type == RulesEngine.CoinType.QUEEN:
		queen_pocketed = true

func check_board_clear(player_id: int, assigned_color: int) -> bool:
	if assigned_color == RulesEngine.CoinType.WHITE and white_coins_left == 0:
		return true
	if assigned_color == RulesEngine.CoinType.BLACK and black_coins_left == 0:
		return true
	return false
