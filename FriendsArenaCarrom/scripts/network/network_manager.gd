class_name NetworkManager
extends Node

## Central networking coordinator supporting Wi-Fi / Hotspot, Wi-Fi Direct, and Bluetooth.

enum TransportType { WIFI_HOTSPOT, WIFI_DIRECT, BLUETOOTH, LOCAL_SIMULATION }

signal transport_status_changed(status_text: String)
signal player_joined_lobby(player_info: Dictionary)
signal player_left_lobby(player_id: int)
signal match_started(seed_val: int)
signal remote_shot_received(shot_data: Dictionary)
signal state_sync_received(sync_data: Dictionary)

var current_transport: TransportType = TransportType.WIFI_HOTSPOT
var is_host: bool = false
var local_player_id: int = 1
var local_player_name: String = "Player 1"
var connected_players: Array = []

var wifi_transport: WiFiTransport
var wifi_direct_bridge: WiFiDirectBridge
var bluetooth_bridge: BluetoothBridge

func _ready() -> void:
	wifi_transport = WiFiTransport.new()
	add_child(wifi_transport)
	wifi_transport.client_connected.connect(_on_wifi_peer_connected)
	wifi_transport.client_disconnected.connect(_on_wifi_peer_disconnected)
	wifi_transport.packet_received.connect(_on_packet_received)

	wifi_direct_bridge = WiFiDirectBridge.new()
	add_child(wifi_direct_bridge)

	bluetooth_bridge = BluetoothBridge.new()
	add_child(bluetooth_bridge)

func host_game(transport: TransportType, port: int = 7777) -> bool:
	current_transport = transport
	is_host = true
	local_player_id = 1
	connected_players.clear()
	connected_players.append({
		"id": local_player_id,
		"name": local_player_name,
		"seat": 0,
		"is_ready": true
	})

	if transport == TransportType.WIFI_HOTSPOT:
		var err = wifi_transport.start_server(port)
		if err == OK:
			transport_status_changed.emit("Host listening on port %d" % port)
			return true
		else:
			transport_status_changed.emit("Failed to bind host port: %d" % port)
			return false
	elif transport == TransportType.WIFI_DIRECT:
		wifi_direct_bridge.discover_peers()
		transport_status_changed.emit("P2P Group Owner initialized.")
		return true
	elif transport == TransportType.BLUETOOTH:
		bluetooth_bridge.start_bluetooth_server("FriendsArenaCarrom")
		transport_status_changed.emit("Bluetooth RFCOMM Server listening.")
		return true
	return true

func join_game(transport: TransportType, address_or_ip: String, port: int = 7777) -> bool:
	current_transport = transport
	is_host = false
	if transport == TransportType.WIFI_HOTSPOT:
		var err = wifi_transport.connect_to_host(address_or_ip, port)
		if err == OK:
			transport_status_changed.emit("Connecting to %s:%d..." % [address_or_ip, port])
			return true
		else:
			transport_status_changed.emit("Connection failure.")
			return false
	elif transport == TransportType.WIFI_DIRECT:
		wifi_direct_bridge.connect_to_device(address_or_ip)
		transport_status_changed.emit("Connecting via Wi-Fi Direct...")
		return true
	elif transport == TransportType.BLUETOOTH:
		bluetooth_bridge.connect_to_device(address_or_ip)
		transport_status_changed.emit("Connecting via Bluetooth Classic...")
		return true
	return true

func send_shot_command(aim_vector: Vector2, power: float, striker_x: float) -> void:
	var payload = {
		"aim_x": aim_vector.x,
		"aim_y": aim_vector.y,
		"power": power,
		"striker_x": striker_x,
		"player_id": local_player_id
	}
	var pkt = MessageProtocol.create_packet(MessageProtocol.MsgType.SHOT_REQUEST, payload, local_player_id)
	if current_transport == TransportType.WIFI_HOTSPOT:
		wifi_transport.broadcast(pkt)
	elif current_transport == TransportType.BLUETOOTH:
		bluetooth_bridge.send_data(pkt)

func _on_wifi_peer_connected(peer_id: int) -> void:
	transport_status_changed.emit("Player %d joined" % peer_id)

func _on_wifi_peer_disconnected(peer_id: int) -> void:
	transport_status_changed.emit("Player %d disconnected" % peer_id)
	player_left_lobby.emit(peer_id)

func _on_packet_received(sender_id: int, packet: Dictionary) -> void:
	var type = packet.get("type", 0)
	var data = packet.get("data", {})
	match type:
		MessageProtocol.MsgType.SHOT_REQUEST:
			remote_shot_received.emit(data)
		MessageProtocol.MsgType.BOARD_SYNC:
			state_sync_received.emit(data)
		MessageProtocol.MsgType.START_GAME:
			match_started.emit(data.get("seed", 12345))
