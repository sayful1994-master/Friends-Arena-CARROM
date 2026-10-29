class_name WiFiTransport
extends Node

## TCP/UDP socket networking implementation for Local Wi-Fi and Mobile Hotspot.

signal client_connected(peer_id: int)
signal client_disconnected(peer_id: int)
signal packet_received(peer_id: int, packet_dict: Dictionary)

const DEFAULT_PORT: int = 7777

var tcp_server: TCPServer = null
var clients: Dictionary = {} # peer_id -> StreamPeerTCP
var current_client_peer: StreamPeerTCP = null
var is_host: bool = false
var next_peer_id: int = 2

func start_server(port: int = DEFAULT_PORT) -> Error:
	stop()
	is_host = true
	tcp_server = TCPServer.new()
	var err = tcp_server.listen(port, "*")
	if err != OK:
		push_error("Failed to bind TCP server on port %d: %s" % [port, error_string(err)])
		return err
	return OK

func connect_to_host(ip: String, port: int = DEFAULT_PORT) -> Error:
	stop()
	is_host = false
	current_client_peer = StreamPeerTCP.new()
	var err = current_client_peer.connect_to_host(ip, port)
	if err != OK:
		push_error("Cannot connect to %s:%d: %s" % [ip, port, error_string(err)])
		return err
	return OK

func stop() -> void:
	if tcp_server:
		tcp_server.stop()
		tcp_server = null
	for p in clients.values():
		p.disconnect_from_host()
	clients.clear()
	if current_client_peer:
		current_client_peer.disconnect_from_host()
		current_client_peer = null

func _process(_delta: float) -> void:
	if is_host and tcp_server and tcp_server.is_connection_available():
		var peer: StreamPeerTCP = tcp_server.take_connection()
		var pid = next_peer_id
		next_peer_id += 1
		clients[pid] = peer
		client_connected.emit(pid)

	# Poll server clients
	if is_host:
		var disconnected = []
		for pid in clients.keys():
			var peer: StreamPeerTCP = clients[pid]
			peer.poll()
			var status = peer.get_status()
			if status == StreamPeerTCP.STATUS_CONNECTED:
				_read_available_packets(pid, peer)
			elif status == StreamPeerTCP.STATUS_ERROR or status == StreamPeerTCP.STATUS_NONE:
				disconnected.append(pid)
		for pid in disconnected:
			clients.erase(pid)
			client_disconnected.emit(pid)

	# Poll client mode
	elif current_client_peer:
		current_client_peer.poll()
		var status = current_client_peer.get_status()
		if status == StreamPeerTCP.STATUS_CONNECTED:
			_read_available_packets(1, current_client_peer)
		elif status == StreamPeerTCP.STATUS_ERROR:
			client_disconnected.emit(1)
			stop()

func _read_available_packets(sender_id: int, peer: StreamPeerTCP) -> void:
	while peer.get_available_bytes() >= 4:
		var length = peer.get_u32()
		if peer.get_available_bytes() < length:
			# Not full packet yet, need buffering in complete impl
			break
		var raw_bytes = peer.get_data(length)
		if raw_bytes[0] == OK:
			var full_pkt = PackedByteArray()
			full_pkt.resize(4)
			full_pkt.encode_u32(0, length)
			full_pkt.append_array(raw_bytes[1])
			var parsed = MessageProtocol.parse_packet(full_pkt)
			if not parsed.has("error"):
				packet_received.emit(sender_id, parsed)

func broadcast(packet_bytes: PackedByteArray) -> void:
	if is_host:
		for peer in clients.values():
			if peer.get_status() == StreamPeerTCP.STATUS_CONNECTED:
				peer.put_data(packet_bytes)
	elif current_client_peer and current_client_peer.get_status() == StreamPeerTCP.STATUS_CONNECTED:
		current_client_peer.put_data(packet_bytes)
