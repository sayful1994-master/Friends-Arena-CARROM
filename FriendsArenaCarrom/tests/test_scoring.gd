class_name TestScoring
extends RefCounted

## Automated unit tests for scoring and fouls.

static func run_all_tests() -> Dictionary:
	var passed = 0
	var failed = 0
	var errors = []

	var scoring = ScoringManager.new()
	scoring.reset_scores([1, 2])

	# Test 1: Add points
	scoring.add_points(1, 10)
	if scoring.scores[1] == 10:
		passed += 1
	else:
		failed += 1
		errors.append("Test 1 Failed: Player 1 should have 10 points")

	# Test 2: Record foul penalty
	scoring.record_foul(1)
	if scoring.scores[1] == 5 and scoring.fouls[1] == 1:
		passed += 1
	else:
		failed += 1
		errors.append("Test 2 Failed: Foul should deduct 5 points and increment foul counter")

	# Test 3: Coin tracking
	scoring.on_coin_pocketed(RulesEngine.CoinType.WHITE)
	if scoring.white_coins_left == 8:
		passed += 1
	else:
		failed += 1
		errors.append("Test 3 Failed: White coins left should decrement to 8")

	return {"passed": passed, "failed": failed, "errors": errors}
