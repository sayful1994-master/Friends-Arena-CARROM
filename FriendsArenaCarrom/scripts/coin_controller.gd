class_name CoinController
extends Area2D

## Visual & physical representation of a Carrom coin (White, Black, or Queen)

@export var coin_type: RulesEngine.CoinType = RulesEngine.CoinType.WHITE
@export var radius: float = 18.0

var velocity: Vector2 = Vector2.ZERO
var is_pocketed: bool = false
var mass: float = 1.0

@onready var sprite: Sprite2D = $Sprite2D
@onready var collision_shape: CollisionShape2D = $CollisionShape2D

func _ready() -> void:
	mass = PhysicsManager.COIN_MASS
	update_appearance()

func update_appearance() -> void:
	if not is_inside_tree():
		return
	queue_redraw()

func _draw() -> void:
	var base_col: Color
	match coin_type:
		RulesEngine.CoinType.WHITE:
			base_col = Color(0.96, 0.94, 0.88, 1.0)
		RulesEngine.CoinType.BLACK:
			base_col = Color(0.18, 0.16, 0.16, 1.0)
		RulesEngine.CoinType.QUEEN:
			base_col = Color(0.86, 0.15, 0.22, 1.0)
		_:
			base_col = Color.WHITE

	# Draw outer rim
	draw_circle(Vector2.ZERO, radius, base_col)
	# Inner decorative groove
	draw_arc(Vector2.ZERO, radius * 0.72, 0, TAU, 32, base_col.darkened(0.2), 2.0)
	# Center dot
	draw_circle(Vector2.ZERO, radius * 0.25, base_col.lightened(0.15) if coin_type == RulesEngine.CoinType.BLACK else base_col.darkened(0.15))

func animate_pocket_sink(pocket_pos: Vector2) -> void:
	is_pocketed = true
	velocity = Vector2.ZERO
	var tween = create_tween().set_parallel(true)
	tween.tween_property(self, "position", pocket_pos, 0.2).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "scale", Vector2(0.3, 0.3), 0.2)
	tween.tween_property(self, "modulate:a", 0.0, 0.2)
	await tween.finished
	visible = false

func reset_to(pos: Vector2) -> void:
	position = pos
	velocity = Vector2.ZERO
	is_pocketed = false
	scale = Vector2.ONE
	modulate.a = 1.0
	visible = true
