class_name PhysicsManager
extends Node

## Handles realistic 2D Carrom physics: friction, mass ratios, elastic collisions, and pocket capture.

const STRIKER_MASS: float = 3.0
const COIN_MASS: float = 1.0
const STRIKER_RADIUS: float = 24.0
const COIN_RADIUS: float = 18.0
const POCKET_RADIUS: float = 32.0
const BOARD_RESTITUTION: float = 0.88
const COIN_RESTITUTION: float = 0.94
const LINEAR_FRICTION: float = 0.985
const REST_VELOCITY_THRESHOLD: float = 1.2

static func apply_friction(velocity: Vector2, delta: float) -> Vector2:
	# Gradual smooth deceleration
	var speed = velocity.length()
	if speed < REST_VELOCITY_THRESHOLD:
		return Vector2.ZERO
	var decay = pow(LINEAR_FRICTION, delta * 60.0)
	return velocity * decay

static func resolve_circle_collision(
	pos_a: Vector2, vel_a: Vector2, mass_a: float, rad_a: float,
	pos_b: Vector2, vel_b: Vector2, mass_b: float, rad_b: float
) -> Dictionary:
	var delta = pos_b - pos_a
	var dist = delta.length()
	var min_dist = rad_a + rad_b
	if dist >= min_dist or dist == 0.0:
		return {"collided": false}

	var normal = delta / dist
	var overlap = min_dist - dist

	# Positional correction to prevent sinkage
	var total_mass = mass_a + mass_b
	var pos_corr_a = pos_a - normal * (overlap * (mass_b / total_mass))
	var pos_corr_b = pos_b + normal * (overlap * (mass_a / total_mass))

	# Relative velocity
	var rel_vel = vel_b - vel_a
	var vel_along_normal = rel_vel.dot(normal)
	if vel_along_normal > 0:
		return {"collided": false}

	var e = COIN_RESTITUTION
	var impulse_mag = -(1.0 + e) * vel_along_normal / (1.0 / mass_a + 1.0 / mass_b)
	var impulse = normal * impulse_mag

	var new_vel_a = vel_a - impulse / mass_a
	var new_vel_b = vel_b + impulse / mass_b

	return {
		"collided": true,
		"pos_a": pos_corr_a,
		"pos_b": pos_corr_b,
		"vel_a": new_vel_a,
		"vel_b": new_vel_b,
		"impact_speed": abs(vel_along_normal)
	}

static func check_pocket_capture(pos: Vector2, pocket_centers: Array, pocket_radius: float = POCKET_RADIUS) -> int:
	for i in range(pocket_centers.size()):
		if pos.distance_to(pocket_centers[i]) <= pocket_radius:
			return i # pocket index 0..3
	return -1
