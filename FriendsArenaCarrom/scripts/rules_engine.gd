class_name RulesEngine
extends Node

## Friends Arena - Carrom Rules Engine
## Authoritative validation for 2-player and 4-player Carrom matches.

enum CoinType { WHITE, BLACK, QUEEN, STRIKER }
enum GameMode { TWO_PLAYER, FOUR_PLAYER, PRACTICE }

const WHITE_POINTS: int = 10
const BLACK_POINTS: int = 5
const QUEEN_POINTS: int = 30
const FOUL_PENALTY_COINS: int = 1

var current_mode: GameMode = GameMode.TWO_PLAYER
var queen_pocketed_by: int = -1
var is_queen_covered: bool = false
var pending_queen_cover: bool = false
var cover_attempt_turn: int = -1

signal foul_committed(player_id: int, reason: String)
signal queen_pocketed(player_id: int)
signal queen_covered(player_id: int)
signal queen_returned_to_center()
signal round_ended(winner_player_id: int, final_score: int)

func reset_rules_state() -> void:
	queen_pocketed_by = -1
	is_queen_covered = false
	pending_queen_cover = false
	cover_attempt_turn = -1

func process_shot_outcome(
	player_id: int,
	player_coin_type: CoinType,
	pocketed_coins: Array,
	had_striker_foul: bool,
	current_turn_count: int
) -> Dictionary:
	var result = {
		"turn_continues": false,
		"foul": false,
		"foul_reason": "",
		"return_coins_to_center": [],
		"points_awarded": 0,
		"queen_covered_now": false,
		"is_game_over": false,
		"winner_id": -1
	}

	# 1. Striker Foul Check
	if had_striker_foul:
		result.foul = true
		result.foul_reason = "Striker pocketed! Foul penalty applied."
		foul_committed.emit(player_id, result.foul_reason)
		# If queen was in pending cover and a foul happens, queen returns
		if pending_queen_cover and queen_pocketed_by == player_id:
			pending_queen_cover = false
			queen_pocketed_by = -1
			result.return_coins_to_center.append(CoinType.QUEEN)
			queen_returned_to_center.emit()
		result.turn_continues = false
		return result

	# Check pocketed coins in this shot
	var pocketed_own_coin: bool = false
	var pocketed_opponent_coin: bool = false
	var pocketed_queen_this_shot: bool = false

	for c in pocketed_coins:
		if c == CoinType.QUEEN:
			pocketed_queen_this_shot = true
		elif c == player_coin_type:
			pocketed_own_coin = true
		else:
			pocketed_opponent_coin = true

	# 2. Queen Logic
	if pocketed_queen_this_shot:
		if is_queen_covered:
			pass
		elif not pending_queen_cover:
			queen_pocketed_by = player_id
			pending_queen_cover = true
			cover_attempt_turn = current_turn_count
			queen_pocketed.emit(player_id)
			if pocketed_own_coin:
				# Queen and own coin pocketed in the exact same shot = covered immediately!
				is_queen_covered = true
				pending_queen_cover = false
				result.queen_covered_now = true
				result.points_awarded += QUEEN_POINTS
				queen_covered.emit(player_id)
		result.turn_continues = true

	elif pending_queen_cover and queen_pocketed_by == player_id:
		# Player was trying to cover the queen on this follow-up shot
		if pocketed_own_coin:
			is_queen_covered = true
			pending_queen_cover = false
			result.queen_covered_now = true
			result.points_awarded += QUEEN_POINTS
			result.turn_continues = true
			queen_covered.emit(player_id)
		else:
			# Failed to cover: Queen returns to center
			pending_queen_cover = false
			queen_pocketed_by = -1
			result.return_coins_to_center.append(CoinType.QUEEN)
			queen_returned_to_center.emit()
			result.turn_continues = false

	# 3. Regular Scoring
	if pocketed_own_coin:
		result.turn_continues = true
		result.points_awarded += (WHITE_POINTS if player_coin_type == CoinType.WHITE else BLACK_POINTS)

	return result

func is_striker_placement_valid(pos: Vector2, baseline_start: Vector2, baseline_end: Vector2, radius: float) -> bool:
	# Striker must be placed within baseline segment with radius tolerance
	var seg = baseline_end - baseline_start
	var seg_len = seg.length()
	if seg_len == 0.0:
		return false
	var u = ((pos.x - baseline_start.x) * seg.x + (pos.y - baseline_start.y) * seg.y) / (seg_len * seg_len)
	u = clamp(u, 0.0, 1.0)
	var proj = baseline_start + u * seg
	return pos.distance_to(proj) <= radius + 4.0
