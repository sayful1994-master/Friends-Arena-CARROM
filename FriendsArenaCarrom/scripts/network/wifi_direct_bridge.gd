class_name WiFiDirectBridge
extends Node

## Android Native Wi-Fi Direct (P2P) Bridge
## Connects Godot with android/plugins/wifi_direct/WiFiDirectPlugin

signal p2p_peers_discovered(peers: Array)
signal p2p_connected(group_owner_ip: String, is_group_owner: bool)
signal p2p_disconnected()
signal p2p_error(message: String)

var plugin: Object = null
var is_available: bool = false
var group_owner_address: String = ""
var is_owner: bool = false

func _ready() -> void:
	if Engine.has_singleton("WiFiDirectPlugin"):
		plugin = Engine.get_singleton("WiFiDirectPlugin")
		is_available = true
		plugin.connect("onPeersDiscovered", Callable(self, "_on_peers_discovered"))
		plugin.connect("onConnected", Callable(self, "_on_connected"))
		plugin.connect("onDisconnected", Callable(self, "_on_disconnected"))
		plugin.connect("onError", Callable(self, "_on_error"))
	else:
		push_warning("WiFiDirectPlugin singleton not loaded. Wi-Fi Direct requires Android deployment with native plugin.")

func discover_peers() -> void:
	if is_available and plugin:
		plugin.discoverPeers()
	else:
		p2p_error.emit("Wi-Fi Direct is available only on physical Android devices with Wi-Fi P2P support.")

func connect_to_device(device_address: String) -> void:
	if is_available and plugin:
		plugin.connectToDevice(device_address)
	else:
		p2p_error.emit("Native Wi-Fi Direct plugin not active.")

func _on_peers_discovered(peers_json: String) -> void:
	var peers = JSON.parse_string(peers_json)
	p2p_peers_discovered.emit(peers if typeof(peers) == TYPE_ARRAY else [])

func _on_connected(ip: String, owner: bool) -> void:
	group_owner_address = ip
	is_owner = owner
	p2p_connected.emit(ip, owner)

func _on_disconnected() -> void:
	group_owner_address = ""
	p2p_disconnected.emit()

func _on_error(err: String) -> void:
	p2p_error.emit(err)
