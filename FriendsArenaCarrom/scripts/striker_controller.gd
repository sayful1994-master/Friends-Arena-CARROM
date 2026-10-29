class_name StrikerController
extends Area2D

## Touch, drag, aim, and impulse controller for the Carrom Striker.

signal shot_released(direction: Vector2, power: float, start_position: Vector2)

@export var radius: float = 24.0
@export var max_power: float = 1400.0
@export var min_power: float = 120.0

var velocity: Vector2 = Vector2.ZERO
var is_pocketed: bool = false
var is_aiming: bool = false
var aim_drag_start: Vector2 = Vector2.ZERO
var aim_current_pos: Vector2 = Vector2.ZERO
var baseline_min_x: float = 200.0
var baseline_max_x: float = 600.0
var baseline_y: float = 620.0
var can_aim: bool = true

func _ready() -> void:
	queue_redraw()

func set_baseline(min_x: float, max_x: float, y_pos: float) -> void:
	baseline_min_x = min_x
	baseline_max_x = max_x
	baseline_y = y_pos
	position = Vector2((min_x + max_x) * 0.5, y_pos)
	velocity = Vector2.ZERO
	is_pocketed = false
	visible = true

func set_slider_ratio(ratio: float) -> void:
	if not is_aiming and velocity.length_squared() < 0.1:
		var clamped_r = clamp(ratio, 0.0, 1.0)
		position.x = lerp(baseline_min_x, baseline_max_x, clamped_r)
		position.y = baseline_y
		queue_redraw()

func _input(event: InputEvent) -> void:
	if not can_aim or is_pocketed or velocity.length() > 2.0:
		return

	if event is InputEventScreenTouch or (event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT):
		if event.is_pressed():
			var touch_pos = event.position
			if position.distance_to(touch_pos) <= radius * 2.5:
				is_aiming = true
				aim_drag_start = touch_pos
				aim_current_pos = touch_pos
				queue_redraw()
		elif is_aiming and not event.is_pressed():
			# Release shot
			is_aiming = false
			var drag_vector = aim_drag_start - aim_current_pos
			var pull_dist = drag_vector.length()
			if pull_dist > 15.0:
				var power_factor = clamp(pull_dist / 140.0, 0.0, 1.0)
				var shot_power = lerp(min_power, max_power, power_factor)
				var shot_dir = drag_vector.normalized()
				velocity = shot_dir * shot_power
				shot_released.emit(shot_dir, shot_power, position)
			queue_redraw()

	elif (event is InputEventScreenDrag or (event is InputEventMouseMotion and is_aiming)):
		if is_aiming:
			aim_current_pos = event.position
			queue_redraw()

func _draw() -> void:
	# Striker Body (Ivory white with golden ring and carved core)
	draw_circle(Vector2.ZERO, radius, Color(0.98, 0.96, 0.90, 1.0))
	draw_arc(Vector2.ZERO, radius - 2.0, 0, TAU, 36, Color(0.85, 0.65, 0.20, 1.0), 3.0)
	draw_arc(Vector2.ZERO, radius * 0.55, 0, TAU, 32, Color(0.2, 0.5, 0.8, 0.7), 2.0)
	draw_circle(Vector2.ZERO, radius * 0.2, Color(0.85, 0.2, 0.2, 1.0))

	# Aiming line and trajectory guide
	if is_aiming:
		var pull_vec = aim_drag_start - aim_current_pos
		var pull_len = pull_vec.length()
		if pull_len > 10.0:
			var dir = pull_vec.normalized()
			var power_pct = clamp(pull_len / 140.0, 0.0, 1.0)
			var guide_len = 160.0 + power_pct * 260.0
			var guide_end = to_local(position + dir * guide_len)

			# Trajectory guide line
			draw_line(Vector2.ZERO, guide_end, Color(0.1, 0.8, 1.0, 0.75), 2.5)

			# Reticle at target end
			draw_circle(guide_end, 5.0, Color(1.0, 0.8, 0.1, 0.9))

			# Power bar arc indicator
			var angle = dir.angle()
			draw_arc(Vector2.ZERO, radius + 8.0, angle - PI * 0.25 * power_pct, angle + PI * 0.25 * power_pct, 24, Color(1.0, 0.3 + 0.7 * (1.0 - power_pct), 0.1, 0.9), 4.0)
