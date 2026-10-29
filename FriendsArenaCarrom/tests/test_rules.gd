class_name TestRules
extends RefCounted

## Automated unit tests for Carrom rules: fouls, queen cover, turn continuation.

static func run_all_tests() -> Dictionary:
	var passed = 0
	var failed = 0
	var errors = []

	var rules = RulesEngine.new()

	# Test 1: Striker Foul
	var outcome1 = rules.process_shot_outcome(1, RulesEngine.CoinType.WHITE, [], true, 1)
	if outcome1.foul == true and outcome1.turn_continues == false:
		passed += 1
	else:
		failed += 1
		errors.append("Test 1 Failed: Striker foul should end turn and set foul flag")

	# Test 2: Queen pocketed without cover
	rules.reset_rules_state()
	var outcome2 = rules.process_shot_outcome(1, RulesEngine.CoinType.WHITE, [RulesEngine.CoinType.QUEEN], false, 2)
	if outcome2.turn_continues == true and rules.pending_queen_cover == true:
		passed += 1
	else:
		failed += 1
		errors.append("Test 2 Failed: Queen pocketed must trigger pending cover and let player shoot again")

	# Test 3: Queen covered on follow-up shot
	var outcome3 = rules.process_shot_outcome(1, RulesEngine.CoinType.WHITE, [RulesEngine.CoinType.WHITE], false, 3)
	if outcome3.queen_covered_now == true and rules.is_queen_covered == true:
		passed += 1
	else:
		failed += 1
		errors.append("Test 3 Failed: Queen cover follow-up shot should claim queen")

	# Test 4: Queen failed to cover
	rules.reset_rules_state()
	rules.process_shot_outcome(2, RulesEngine.CoinType.BLACK, [RulesEngine.CoinType.QUEEN], false, 4)
	var outcome4 = rules.process_shot_outcome(2, RulesEngine.CoinType.BLACK, [], false, 5) # missed
	if outcome4.return_coins_to_center.has(RulesEngine.CoinType.QUEEN) and rules.is_queen_covered == false:
		passed += 1
	else:
		failed += 1
		errors.append("Test 4 Failed: Missed cover shot must return queen to center")

	return {"passed": passed, "failed": failed, "errors": errors}
