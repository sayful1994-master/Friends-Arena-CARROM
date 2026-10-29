class_name BoardController
extends Node2D

## Manages 2D board surface, pockets, coins physics tick, baseline setup, and shot resolution.

signal shot_finished(pocketed_coins: Array, striker_pocketed: bool)
signal coin_potted(coin_type: int)

@export var board_size: float = 640.0
@export var pocket_radius: float = 34.0
@export var board_margin: float = 48.0

var pockets: Array[Vector2] = []
var coins: Array = []
var striker: StrikerController
var is_simulating: bool = false
var pocketed_this_shot: Array = []
var striker_foul_this_shot: bool = false

var board_min: Vector2
var board_max: Vector2

func _ready() -> void:
	var center = Vector2(640, 360) # Default 1280x720 center
	var half = board_size * 0.5 - board_margin
	board_min = center - Vector2(half, half)
	board_max = center + Vector2(half, half)

	# 4 Corner Pockets
	pockets = [
		board_min + Vector2(pocket_radius * 0.7, pocket_radius * 0.7),
		Vector2(board_max.x - pocket_radius * 0.7, board_min.y + pocket_radius * 0.7),
		board_max - Vector2(pocket_radius * 0.7, pocket_radius * 0.7),
		Vector2(board_min.x + pocket_radius * 0.7, board_max.y - pocket_radius * 0.7)
	]

func reset_board_coins() -> void:
	for c in coins:
		if is_instance_valid(c):
			c.queue_free()
	coins.clear()

	var center = Vector2(640, 360)

	# 1 Queen at exact center
	_spawn_coin(center, RulesEngine.CoinType.QUEEN)

	# Inner circle of 6 coins (alternating White and Black)
	var r1 = 38.0
	for i in range(6):
		var angle = i * (TAU / 6.0)
		var pos = center + Vector2(cos(angle), sin(angle)) * r1
		var ctype = RulesEngine.CoinType.WHITE if (i % 2 == 0) else RulesEngine.CoinType.BLACK
		_spawn_coin(pos, ctype)

	# Outer circle of 12 coins (6 White, 6 Black alternating)
	var r2 = 76.0
	for i in range(12):
		var angle = (i * (TAU / 12.0)) + (PI / 12.0)
		var pos = center + Vector2(cos(angle), sin(angle)) * r2
		var ctype = RulesEngine.CoinType.BLACK if (i % 2 == 0) else RulesEngine.CoinType.WHITE
		_spawn_coin(pos, ctype)

func _spawn_coin(pos: Vector2, ctype: RulesEngine.CoinType) -> CoinController:
	var coin = CoinController.new()
	coin.position = pos
	coin.coin_type = ctype
	add_child(coin)
	coins.append(coin)
	return coin

func _physics_process(delta: float) -> void:
	if not is_simulating:
		return

	var all_stopped = true

	# Update Striker
	if is_instance_valid(striker) and not striker.is_pocketed:
		if striker.velocity.length() > 0.0:
			all_stopped = false
			striker.velocity = PhysicsManager.apply_friction(striker.velocity, delta)
			striker.position += striker.velocity * delta
			_handle_cushion_bounce(striker, striker.radius)

			# Pocket check
			var p_idx = PhysicsManager.check_pocket_capture(striker.position, pockets, pocket_radius)
			if p_idx != -1:
				striker.is_pocketed = true
				striker.velocity = Vector2.ZERO
				striker.visible = false
				striker_foul_this_shot = true

	# Update Coins
	for coin in coins:
		if not is_instance_valid(coin) or coin.is_pocketed:
			continue

		if coin.velocity.length() > 0.0:
			all_stopped = false
			coin.velocity = PhysicsManager.apply_friction(coin.velocity, delta)
			coin.position += coin.velocity * delta
			_handle_cushion_bounce(coin, coin.radius)

			# Check pocket
			var p_idx = PhysicsManager.check_pocket_capture(coin.position, pockets, pocket_radius)
			if p_idx != -1:
				coin.animate_pocket_sink(pockets[p_idx])
				pocketed_this_shot.append(coin.coin_type)
				coin_potted.emit(coin.coin_type)

	# Coin to Coin collisions
	for i in range(coins.size()):
		var c1 = coins[i]
		if not is_instance_valid(c1) or c1.is_pocketed:
			continue
		# Check vs striker
		if is_instance_valid(striker) and not striker.is_pocketed:
			var res = PhysicsManager.resolve_circle_collision(
				striker.position, striker.velocity, PhysicsManager.STRIKER_MASS, striker.radius,
				c1.position, c1.velocity, PhysicsManager.COIN_MASS, c1.radius
			)
			if res.collided:
				striker.position = res.pos_a
				c1.position = res.pos_b
				striker.velocity = res.vel_a
				c1.velocity = res.vel_b
				all_stopped = false

		# Check vs other coins
		for j in range(i + 1, coins.size()):
			var c2 = coins[j]
			if not is_instance_valid(c2) or c2.is_pocketed:
				continue
			var res = PhysicsManager.resolve_circle_collision(
				c1.position, c1.velocity, PhysicsManager.COIN_MASS, c1.radius,
				c2.position, c2.velocity, PhysicsManager.COIN_MASS, c2.radius
			)
			if res.collided:
				c1.position = res.pos_a
				c2.position = res.pos_b
				c1.velocity = res.vel_a
				c2.velocity = res.vel_b
				all_stopped = false

	# All objects have come to rest
	if all_stopped and is_simulating:
		is_simulating = false
		shot_finished.emit(pocketed_this_shot, striker_foul_this_shot)
		pocketed_this_shot = []
		striker_foul_this_shot = false

func _handle_cushion_bounce(obj: Node2D, radius: float) -> void:
	var e = PhysicsManager.BOARD_RESTITUTION
	if obj.position.x - radius < board_min.x:
		obj.position.x = board_min.x + radius
		obj.velocity.x = -obj.velocity.x * e
	elif obj.position.x + radius > board_max.x:
		obj.position.x = board_max.x - radius
		obj.velocity.x = -obj.velocity.x * e

	if obj.position.y - radius < board_min.y:
		obj.position.y = board_min.y + radius
		obj.velocity.y = -obj.velocity.y * e
	elif obj.position.y + radius > board_max.y:
		obj.position.y = board_max.y - radius
		obj.velocity.y = -obj.velocity.y * e
