class_name TestTurns
extends RefCounted

## Automated unit tests for turn rotations in 2-player and 4-player matches.

static func run_all_tests() -> Dictionary:
	var passed = 0
	var failed = 0
	var errors = []

	var tm = TurnManager.new()
	var players = [
		{"id": 1, "name": "Player 1"},
		{"id": 2, "name": "Player 2"},
		{"id": 3, "name": "Player 3"},
		{"id": 4, "name": "Player 4"}
	]
	tm.setup_match(players)

	# Test 1: First turn starts with player 0
	tm.start_first_turn()
	if tm.get_current_player().id == 1:
		passed += 1
	else:
		failed += 1
		errors.append("Test 1 Failed: Turn 1 should be Player 1")

	# Test 2: Normal advance rotates sequentially
	tm.advance_turn(false)
	if tm.get_current_player().id == 2:
		passed += 1
	else:
		failed += 1
		errors.append("Test 2 Failed: Turn should advance to Player 2")

	# Test 3: Keep turn (pocketed own coin)
	tm.advance_turn(true)
	if tm.get_current_player().id == 2:
		passed += 1
	else:
		failed += 1
		errors.append("Test 3 Failed: keep_turn=true should stay on current player")

	# Test 4: Wraparound at end of 4 players
	tm.advance_turn(false) # Player 3
	tm.advance_turn(false) # Player 4
	tm.advance_turn(false) # Wraparound to Player 1
	if tm.get_current_player().id == 1:
		passed += 1
	else:
		failed += 1
		errors.append("Test 4 Failed: Turn advance should wrap around to Player 1")

	return {"passed": passed, "failed": failed, "errors": errors}
