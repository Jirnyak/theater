// === Engine types for tile-based raycasting ===

/** Single cell in the tile map. 0 = empty (walkable floor). */
export type TileCell = number;

/** 2D tile map — row-major [y][x]. */
export type TileMap = TileCell[][];

/** Wall texture IDs mapped to tile cell values. */
export const enum Tile {
	FLOOR = 0,
	WALL_STONE = 1,
	WALL_POSTER = 2,
	WALL_DARK = 3,
	WALL_BRICK = 4,
	WALL_RED_CURTAIN = 5,
	WALL_ENTRANCE = 6,
	WALL_VORTEX_POSTER = 7,
	// Maze life-cycle walls
	WALL_BORN = 8,
	WALL_GROW = 9,
	WALL_LIVE = 10,
	WALL_DECAY = 11,
	WALL_OLD = 12,
	WALL_DEAD = 13,
	WALL_EXIT = 14,
	WALL_PANEL = 15,
	WALL_DOOR = 16,
	WALL_REAR_DOOR = 17,
}

/** Player / camera state in world space. */
export type Camera = {
	x: number;
	y: number;
	angle: number; // Radians
	pitch: number; // Vertical look offset in pixels
};

/** A sprite entity in the world. */
export type Sprite = {
	x: number;
	y: number;
	textureId: string;
	visible: boolean;
	scale: number;
};

/** Raycaster configuration. */
export type RaycastConfig = {
	screenWidth: number;
	screenHeight: number;
	fov: number; // Radians
	maxDepth: number;
	tileSize: number; // Logical tile size (1.0 for unit tiles)
};

/** Result of a single ray cast. */
export type RayHit = {
	distance: number;
	tileValue: number;
	side: 0 | 1; // 0 = vertical wall (N/S), 1 = horizontal wall (E/W)
	wallX: number; // 0..1 where on the wall the ray hit (for texture mapping)
	mapX: number;
	mapY: number;
};
