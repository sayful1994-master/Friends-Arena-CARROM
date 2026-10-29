extends SceneTree

## Headless test runner for GitHub Actions CI and local Godot execution.

func _init() -> void:
	print("==================================================")
	print("  Friends Arena - Carrom Automated Test Suite")
	print("==================================================")

	var total_passed = 0
	var total_failed = 0
	var all_errors = []

	# Run Rules tests
	print("\n[1/4] Running Rules Engine Tests...")
	var r_res = TestRules.run_all_tests()
	total_passed += r_res.passed
	total_failed += r_res.failed
	all_errors.append_array(r_res.errors)

	# Run Scoring tests
	print("[2/4] Running Scoring & Foul Tests...")
	var s_res = TestScoring.run_all_tests()
	total_passed += s_res.passed
	total_failed += s_res.failed
	all_errors.append_array(s_res.errors)

	# Run Turns tests
	print("[3/4] Running Turn Rotation Tests...")
	var t_res = TestTurns.run_all_tests()
	total_passed += t_res.passed
	total_failed += t_res.failed
	all_errors.append_array(t_res.errors)

	# Run Protocol tests
	print("[4/4] Running Network Protocol Tests...")
	var p_res = TestProtocol.run_all_tests()
	total_passed += p_res.passed
	total_failed += p_res.failed
	all_errors.append_array(p_res.errors)

	print("\n==================================================")
	print("  Test Results: %d Passed, %d Failed" % [total_passed, total_failed])
	print("==================================================")

	if total_failed > 0:
		for err in all_errors:
			printerr("  - ", err)
		quit(1)
	else:
		print("All Carrom unit test suites passed successfully!")
		quit(0)
