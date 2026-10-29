class_name BluetoothBridge
extends Node

## Android Native Bluetooth Classic (RFCOMM) Bridge
## Connects Godot with android/plugins/bluetooth/BluetoothClassicPlugin

signal device_discovered(device_name: String, address: String)
signal connection_established(peer_address: String, is_server: bool)
signal connection_lost(reason: String)
signal data_received(data: PackedByteArray)
signal bluetooth_error(error_code: int, message: String)

var plugin: Object = null
var is_available: bool = false
var connected_address: String = ""

func _ready() -> void:
	if Engine.has_singleton("BluetoothPlugin"):
		plugin = Engine.get_singleton("BluetoothPlugin")
		is_available = true
		plugin.connect("onDeviceDiscovered", Callable(self, "_on_device_discovered"))
		plugin.connect("onConnected", Callable(self, "_on_connected"))
		plugin.connect("onDisconnected", Callable(self, "_on_disconnected"))
		plugin.connect("onDataReceived", Callable(self, "_on_data_received"))
		plugin.connect("onError", Callable(self, "_on_error"))
	else:
		push_warning("BluetoothPlugin singleton not found. Bluetooth Classic RFCOMM requires Android build with compiled plugin.")

func start_bluetooth_server(service_name: String = "FriendsArenaCarrom") -> void:
	if is_available and plugin:
		plugin.startServer(service_name)
	else:
		bluetooth_error.emit(101, "Bluetooth server requires native Android environment.")

func scan_for_devices() -> void:
	if is_available and plugin:
		plugin.startDiscovery()
	else:
		bluetooth_error.emit(102, "Bluetooth scanning requires Android device.")

func connect_to_device(address: String) -> void:
	if is_available and plugin:
		plugin.connectToAddress(address)
	else:
		bluetooth_error.emit(103, "Cannot connect without Bluetooth plugin.")

func send_data(data: PackedByteArray) -> void:
	if is_available and plugin:
		plugin.sendBytes(data)

func _on_device_discovered(dev_name: String, addr: String) -> void:
	device_discovered.emit(dev_name, addr)

func _on_connected(addr: String, is_server: bool) -> void:
	connected_address = addr
	connection_established.emit(addr, is_server)

func _on_disconnected(reason: String) -> void:
	connected_address = ""
	connection_lost.emit(reason)

func _on_data_received(data: PackedByteArray) -> void:
	data_received.emit(data)

func _on_error(code: int, msg: String) -> void:
	bluetooth_error.emit(code, msg)
