class_name MessageProtocol
extends RefCounted

## Message protocol and packet framing for local multiplayer (Wi-Fi, P2P, Bluetooth).

const PROTOCOL_VERSION: int = 1
const MAGIC_HEADER: String = "FAC1" # Friends Arena Carrom v1

enum MsgType {
	HANDSHAKE = 1,
	HANDSHAKE_ACK = 2,
	LOBBY_STATE = 3,
	PLAYER_READY = 4,
	START_GAME = 5,
	SHOT_REQUEST = 6,
	SHOT_AUTHORITATIVE = 7,
	BOARD_SYNC = 8,
	TURN_CHANGE = 9,
	PING = 10,
	PONG = 11,
	DISCONNECT = 12
}

static func create_packet(type: int, payload: Dictionary, sender_id: int = 0) -> PackedByteArray:
	var dict = {
		"magic": MAGIC_HEADER,
		"ver": PROTOCOL_VERSION,
		"type": type,
		"sender": sender_id,
		"time": Time.get_ticks_msec(),
		"data": payload
	}
	var json_str = JSON.stringify(dict)
	var raw_bytes = json_str.to_utf8_buffer()
	var packet = PackedByteArray()
	# 4 bytes payload length header for framing
	packet.resize(4)
	packet.encode_u32(0, raw_bytes.size())
	packet.append_array(raw_bytes)
	return packet

static func parse_packet(raw_bytes: PackedByteArray) -> Dictionary:
	if raw_bytes.size() < 4:
		return {"error": "Packet too short"}
	var length = raw_bytes.decode_u32(0)
	if raw_bytes.size() < 4 + length:
		return {"error": "Incomplete packet"}
	var json_bytes = raw_bytes.slice(4, 4 + length)
	var json_str = json_bytes.get_string_from_utf8()
	var parsed = JSON.parse_string(json_str)
	if typeof(parsed) != TYPE_DICTIONARY:
		return {"error": "Invalid payload format"}
	if parsed.get("magic") != MAGIC_HEADER:
		return {"error": "Magic header mismatch"}
	if int(parsed.get("ver", 0)) != PROTOCOL_VERSION:
		return {"error": "Protocol version mismatch"}
	return parsed
