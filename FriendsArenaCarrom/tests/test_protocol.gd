class_name TestProtocol
extends RefCounted

## Automated unit tests for packet serialization, framing, and corruption rejection.

static func run_all_tests() -> Dictionary:
	var passed = 0
	var failed = 0
	var errors = []

	# Test 1: Valid serialization and parsing
	var payload = {"aim_x": 0.5, "aim_y": -0.86, "power": 850.0}
	var packet_bytes = MessageProtocol.create_packet(MessageProtocol.MsgType.SHOT_REQUEST, payload, 1)
	var parsed = MessageProtocol.parse_packet(packet_bytes)

	if not parsed.has("error") and parsed.type == MessageProtocol.MsgType.SHOT_REQUEST:
		if abs(parsed.data.aim_x - 0.5) < 0.001 and parsed.data.power == 850.0:
			passed += 1
		else:
			failed += 1
			errors.append("Test 1 Failed: Payload fields altered")
	else:
		failed += 1
		errors.append("Test 1 Failed: Packet parsing failed")

	# Test 2: Reject corrupt short packet
	var corrupt_bytes = PackedByteArray([0x01, 0x02])
	var corrupt_res = MessageProtocol.parse_packet(corrupt_bytes)
	if corrupt_res.has("error"):
		passed += 1
	else:
		failed += 1
		errors.append("Test 2 Failed: Short packets should be rejected with error")

	return {"passed": passed, "failed": failed, "errors": errors}
