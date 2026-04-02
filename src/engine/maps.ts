// === Theater level maps ===
// Tile-based maps for the theater lobby and corridor.
// 0 = floor, see Tile enum in types.ts for wall types.

import {Tile, type TileMap} from './types';

const W = Tile.WALL_STONE;
const P = Tile.WALL_POSTER;
const D = Tile.WALL_DARK;
const C = Tile.WALL_RED_CURTAIN;
const E = Tile.WALL_ENTRANCE;
const DR = Tile.WALL_DOOR;
const RD = Tile.WALL_REAR_DOOR;
const _ = Tile.FLOOR;

/**
 * Theater map — lobby + corridor.
 *
 * Layout (top-down):
 * - Bottom: lobby entrance area where player spawns
 * - Center: lobby hall with poster walls and curtains
 * - Top: dark corridor leading deeper, gets narrower
 *
 * Player starts facing north (negative Y in tile coords = upward).
 * Usher stands near corridor entrance.
 */
// prettier-ignore
export const THEATER_MAP: TileMap = [
	//  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14
	[W, W, W, W, W, W, D, DR, D, W, W, W, W, W, W], // 0  — corridor dead-end (door)
	[W, D, D, D, D, D, _, _, _, D, D, D, D, D, W], // 1
	[W, D, D, D, D, D, _, _, _, D, D, D, D, D, W], // 2
	[W, D, D, D, D, D, _, _, _, D, D, D, D, D, W], // 3  — corridor narrows
	[W, D, D, D, D, _, _, _, _, _, D, D, D, D, W], // 4
	[W, D, D, D, _, _, _, _, _, _, _, D, D, D, W], // 5
	[W, D, D, _, _, _, _, _, _, _, _, _, D, D, W], // 6
	[W, D, _, _, _, _, _, _, _, _, _, _, _, D, W], // 7  — corridor entrance
	[W, W, E, _, _, _, _, _, _, _, _, _, E, W, W], // 8  — archway
	[W, P, _, _, _, _, _, _, _, _, _, _, _, P, W], // 9  — lobby with posters
	[W, _, _, _, _, _, _, _, _, _, _, _, _, _, W], // 10
	[W, C, _, _, _, _, _, _, _, _, _, _, _, C, W], // 11 — curtain walls
	[W, P, _, _, _, _, _, _, _, _, _, _, _, P, W], // 12 — more posters
	[W, _, _, _, _, _, _, _, _, _, _, _, _, _, W], // 13
	[W, C, _, _, _, _, _, _, _, _, _, _, _, C, W], // 14 — curtains
	[W, P, _, _, _, _, _, _, _, _, _, _, _, P, W], // 15 — posters near entrance
	[W, _, _, _, _, _, _, _, _, _, _, _, _, _, W], // 16
	[W, W, W, W, W, W, RD, RD, RD, W, W, W, W, W, W], // 17 — lobby entrance wall (rear door at center)
	[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W], // 18 — outer wall
];

/** Player spawn position (center of lobby, facing north). */
export const PLAYER_START = {x: 7.5, y: 16.5, angle: -Math.PI / 2};

/** Usher position (in front of corridor entrance). */
export const USHER_POS = {x: 7.5, y: 8.5};

/** Corridor block position (where brick wall appears). */
export const CORRIDOR_BLOCK_Y = 8;
export const CORRIDOR_BLOCK_X_START = 6;
export const CORRIDOR_BLOCK_X_END = 8;

/** Poster wall positions — for replacing with vortex posters. */
export const POSTER_POSITIONS: Array<{x: number; y: number}> = [
	{x: 1, y: 9},
	{x: 13, y: 9},
	{x: 1, y: 12},
	{x: 13, y: 12},
	{x: 1, y: 15},
	{x: 13, y: 15},
];

/**
 * Create a fresh copy of the theater map.
 * We need copies because the map mutates during gameplay
 * (posters change, brick wall appears).
 */
export function createTheaterMap(): TileMap {
	return THEATER_MAP.map(row => [...row]);
}

// ── Stage 2 helpers ─────────────────────────────────────────────

/**
 * Create a stage 2 lobby map — same as default theater
 * but with velvet rope barrier across archway and side passages.
 */
export function createStage2LobbyMap(): TileMap {
	const map = createTheaterMap();
	// Velvet rope barrier across archway (row 8), gap at center for usher
	for (const x of [3, 4, 5, 9, 10, 11, 12]) {
		map[8][x] = Tile.WALL_VELVET_ROPE;
	}

	// Open side passages at rows 10-11 (left wall x=0, right wall x=14)
	map[10][0] = Tile.FLOOR;
	map[11][0] = Tile.FLOOR;
	map[10][14] = Tile.FLOOR;
	map[11][14] = Tile.FLOOR;
	return map;
}

/** Segment of the snake path centerline. */
export type PathSegment = {x0: number; y0: number; x1: number; y1: number};

/** Mark a horizontal span of path tiles at row y, covering x0..x1 ± radius. */
function markSpan(tiles: Set<string>, x0: number, x1: number, y: number, r: number, w: number): void {
	const lo = Math.min(x0, x1);
	const hi = Math.max(x0, x1);
	for (let ix = lo; ix <= hi; ix++) {
		for (let dx = -r; dx <= r; dx++) {
			const px = ix + dx;
			if (px > 0 && px < w - 1) {
				tiles.add(`${px},${y}`);
			}
		}
	}
}

/**
 * Stage 2 snake corridor — dark room with a blood trail on the ceiling.
 * The trail is a smooth, non-repeating meander from bottom to top.
 * Stepping off the path = void. The path is narrow, forcing the player
 * to follow it carefully. Bends are spaced far enough apart that
 * diagonal shortcuts land off-trail.
 */
export function generateSnakeCorridor(): {
	map: TileMap;
	pathTiles: Set<string>;
	pathSegments: PathSegment[];
	start: {x: number; y: number; angle: number};
	exitY: number;
} {
	const width = 31;
	const height = 60;
	const map: TileMap = [];

	// Fill: walls on edges, floor inside
	for (let y = 0; y < height; y++) {
		const row: number[] = [];
		for (let x = 0; x < width; x++) {
			if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
				row.push(Tile.WALL_DARK);
			} else {
				row.push(Tile.FLOOR);
			}
		}

		map.push(row);
	}

	const cx = Math.floor(width / 2); // 15
	const margin = 4;
	const minX = margin;
	const maxX = width - margin - 1;

	// Generate smooth meandering centerline using layered sine waves
	// with random phases/frequencies — produces non-repeating organic curve.
	const freqs = [
		{f: 0.07 + Math.random() * 0.04, p: Math.random() * Math.PI * 2, a: 0.35},
		{f: 0.13 + Math.random() * 0.06, p: Math.random() * Math.PI * 2, a: 0.25},
		{f: 0.23 + Math.random() * 0.08, p: Math.random() * Math.PI * 2, a: 0.15},
		{f: 0.41 + Math.random() * 0.1, p: Math.random() * Math.PI * 2, a: 0.08},
	];

	/** Get normalized X offset [-1..1] for a given Y. */
	function meander(y: number): number {
		let v = 0;
		for (const {f, p, a} of freqs) {
			v += Math.sin(y * f + p) * a;
		}

		// Clamp to [-1, 1]
		return Math.max(-1, Math.min(1, v / 0.6));
	}

	// Sample centerline at each row
	const centerXs: number[] = [];
	for (let y = 0; y < height; y++) {
		const t = meander(y);
		// Map [-1..1] to [minX..maxX]
		const xf = cx + t * (maxX - minX) / 2;
		centerXs.push(Math.max(minX, Math.min(maxX, Math.round(xf))));
	}

	// Build segments from the centerline (connect each row to the next)
	const pathSegments: PathSegment[] = [];
	const pathTiles = new Set<string>();
	const pathRadius = 1;

	for (let y = 1; y < height - 2; y++) {
		const x0 = centerXs[y];
		const x1 = centerXs[y + 1];
		pathSegments.push({
			x0: x0 + 0.5, y0: y + 0.5,
			x1: x1 + 0.5, y1: y + 1 + 0.5,
		});

		// Mark tiles for this row's center ± radius
		for (let dx = -pathRadius; dx <= pathRadius; dx++) {
			const px = x0 + dx;
			if (px > 0 && px < width - 1) {
				pathTiles.add(`${px},${y}`);
			}
		}

		// Also mark tiles between x0 and x1 for diagonal movement
		if (x0 !== x1) {
			markSpan(pathTiles, x0, x1, y, pathRadius, width);
			markSpan(pathTiles, x0, x1, y + 1, pathRadius, width);
		}
	}

	// Mark the top and bottom few rows fully as path (start/end safe zones)
	for (let y = height - 3; y < height - 1; y++) {
		for (let dx = -pathRadius; dx <= pathRadius; dx++) {
			const px = centerXs[y] + dx;
			if (px > 0 && px < width - 1) {
				pathTiles.add(`${px},${y}`);
			}
		}
	}

	const startX = centerXs[height - 2];

	return {
		map,
		pathTiles,
		pathSegments,
		start: {x: startX + 0.5, y: height - 2.5, angle: -Math.PI / 2},
		exitY: 2,
	};
}

// ── Stage 3 corridor generator ──────────────────────────────────

/**
 * Long corridor with alcove side branches.
 * Player must dodge into alcoves when the rushing face comes.
 * Returns alcove Y positions for collision detection.
 */
export function generateStage3Corridor(): {
	map: TileMap;
	alcoveYs: number[];
	start: {x: number; y: number; angle: number};
	endY: number;
	length: number;
} {
	const width = 10;
	const length = 100;
	const map: TileMap = [];
	const cx = Math.floor(width / 2); // 10

	// Fill: walls everywhere
	for (let y = 0; y < length; y++) {
		const row: number[] = [];
		for (let x = 0; x < width; x++) {
			row.push(Tile.WALL_DARK);
		}

		map.push(row);
	}

	// Carve narrow main corridor (1 tile wide — center column, full height)
	for (let y = 1; y < length - 1; y++) {
		map[y][cx] = Tile.FLOOR;
	}

	// Carve full-width cross-passages for toroidal wrapping
	// These span the entire map width so rays and movement wrap seamlessly
	const alcoveYs: number[] = [];
	const minGap = 4;
	let y = 6 + Math.floor(Math.random() * 3);
	while (y < length - 8) {
		alcoveYs.push(y);

		// Open 3 rows tall across the full map width
		for (let dy = -1; dy <= 1; dy++) {
			const row = y + dy;
			if (row <= 0 || row >= length - 1) {
				continue;
			}

			for (let x = 0; x < width; x++) {
				map[row][x] = Tile.FLOOR;
			}
		}

		y += minGap + Math.floor(Math.random() * 3);
	}

	// Exit door at the far end
	map[1][cx] = Tile.WALL_DOOR;

	return {
		map,
		alcoveYs,
		start: {x: cx + 0.5, y: length - 2.5, angle: -Math.PI / 2},
		endY: 3,
		length,
	};
}

// ── Procedural maze generator ───────────────────────────────────

const LIFE_TILES = [
	Tile.WALL_BORN,
	Tile.WALL_GROW,
	Tile.WALL_LIVE,
	Tile.WALL_DECAY,
	Tile.WALL_OLD,
	Tile.WALL_DEAD,
];

/**
 * Generate a random maze using recursive backtracking,
 * then punch loops and add extra exits.
 * Returns { map, start, exit, bileterStart }.
 */
export function generateMaze(size = 31): {
	map: TileMap;
	start: {x: number; y: number};
	exit: {x: number; y: number};
	bileterStart: {x: number; y: number};
} {
	// Must be odd for maze gen to work
	const n = size % 2 === 0 ? size + 1 : size;

	// Fill with walls using PANEL as default
	const map: TileMap = [];
	for (let y = 0; y < n; y++) {
		const row: number[] = Array.from<number>({length: n}).fill(Tile.WALL_PANEL);
		map.push(row);
	}

	// Carve maze using recursive backtracking (iterative stack)
	const startCellX = 1;
	const startCellY = 1;
	map[startCellY][startCellX] = Tile.FLOOR;

	const stack: Array<[number, number]> = [[startCellX, startCellY]];
	const directions: Array<[number, number]> = [
		[0, -2],
		[0, 2],
		[-2, 0],
		[2, 0],
	];

	while (stack.length > 0) {
		const current = stack.at(-1);
		const cx = current[0];
		const cy = current[1];

		// Find unvisited neighbors
		const unvisited: Array<[number, number, number, number]> = [];
		for (const dir of directions) {
			const nx = cx + dir[0];
			const ny = cy + dir[1];
			if (nx > 0 && nx < n - 1 && ny > 0 && ny < n - 1 && map[ny][nx] !== (Tile.FLOOR as number)) {
				unvisited.push([nx, ny, cx + dir[0] / 2, cy + dir[1] / 2]);
			}
		}

		if (unvisited.length > 0) {
			const choice = unvisited[Math.floor(Math.random() * unvisited.length)];
			map[choice[3]][choice[2]] = Tile.FLOOR;
			map[choice[1]][choice[0]] = Tile.FLOOR;
			stack.push([choice[0], choice[1]]);
		} else {
			stack.pop();
		}
	}

	// ── Punch loops: remove ~15% of interior walls between two floor cells
	// This creates alternate routes so the player can outmaneuver the entity
	for (let y = 2; y < n - 2; y++) {
		for (let x = 2; x < n - 2; x++) {
			if (map[y][x] === (Tile.FLOOR as number)) {
				continue;
			}

			// Check if this wall separates two floor cells (horizontal or vertical)
			const horizontalBridge = map[y][x - 1] === (Tile.FLOOR as number) && map[y][x + 1] === (Tile.FLOOR as number);
			const verticalBridge = map[y - 1]?.[x] === (Tile.FLOOR as number) && map[y + 1]?.[x] === (Tile.FLOOR as number);

			if ((horizontalBridge || verticalBridge) && Math.random() < 0.15) {
				map[y][x] = Tile.FLOOR;
			}
		}
	}

	// ── Primary exit at far corner
	const exitX = n - 2;
	const exitY = n - 2;
	if (map[exitY][exitX + 1] !== undefined) {
		map[exitY][Math.min(exitX + 1, n - 1)] = Tile.WALL_EXIT;
	}

	if (map[exitY + 1] !== undefined) {
		map[Math.min(exitY + 1, n - 1)][exitX] = Tile.WALL_EXIT;
	}

	// Entity starts in the middle of the maze
	const bileterX = Math.floor(n / 2);
	const bileterY = Math.floor(n / 2);
	let bestBx = bileterX;
	let bestBy = bileterY;
	let bestDist = Infinity;
	for (let y = 0; y < n; y++) {
		for (let x = 0; x < n; x++) {
			if (map[y][x] === (Tile.FLOOR as number)) {
				const dist = Math.abs(x - bileterX) + Math.abs(y - bileterY);
				if (dist < bestDist) {
					bestDist = dist;
					bestBx = x;
					bestBy = y;
				}
			}
		}
	}

	return {
		map,
		start: {x: startCellX + 0.5, y: startCellY + 0.5},
		exit: {x: exitX + 0.5, y: exitY + 0.5},
		bileterStart: {x: bestBx + 0.5, y: bestBy + 0.5},
	};
}

/**
 * Generate the infinite corridor map — a long straight hallway
 * with DEAD walls repeating forever (actually just a long map).
 * Looking back shows life-cycle walls; looking forward shows DEAD forever.
 */
export function generateInfiniteCorridor(): {
	map: TileMap;
	start: {x: number; y: number};
} {
	const length = 200;
	const width = 5;
	const map: TileMap = [];

	// Life cycle section at the start (behind player)
	const lifeLength = 30; // 5 tiles per life stage

	for (let y = 0; y < length; y++) {
		const row: number[] = [];
		for (let x = 0; x < width; x++) {
			if (x === 0 || x === width - 1) {
				// Wall — life cycle behind, dead ahead
				if (y < lifeLength) {
					const lifeIndex = Math.min(LIFE_TILES.length - 1, Math.floor((y / lifeLength) * LIFE_TILES.length));
					row.push(LIFE_TILES[lifeIndex]);
				} else {
					row.push(Tile.WALL_DEAD);
				}
			} else {
				row.push(Tile.FLOOR);
			}
		}

		map.push(row);
	}

	// Close off ends
	map[0] = Array.from<number>({length: width}).fill(Tile.WALL_BORN);
	map[length - 1] = Array.from<number>({length: width}).fill(Tile.WALL_DEAD);

	// Player starts at the beginning of the corridor (near РОЖДЕН walls)
	return {
		map,
		start: {x: 2.5, y: 1.5},
	};
}

// ── Procedural dungeon generator (infinite rooms mode) ──────────

export const DUNGEON_SIZE = 201;

type DRoom = {
	x1: number; y1: number; x2: number; y2: number;
	cx: number; cy: number;
};

function shuffle<T>(a: T[]): T[] {
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}

	return a;
}

function carve(map: TileMap, x: number, y: number): void {
	if (y >= 0 && y < map.length && x >= 0 && x < (map[0]?.length ?? 0)) {
		map[y][x] = Tile.FLOOR;
	}
}

function emptyMap(size: number): TileMap {
	const m: TileMap = [];
	for (let y = 0; y < size; y++) {
		m.push(Array.from<number>({length: size}).fill(Tile.WALL_STONE));
	}

	return m;
}

function tryPlaceRoom(
	map: TileMap, rooms: DRoom[],
	minX: number, minY: number, maxX: number, maxY: number,
): boolean {
	const rw = 5 + Math.floor(Math.random() * 6) * 2; // 5–15
	const rh = 5 + Math.floor(Math.random() * 5) * 2; // 5–13
	const limX = maxX - rw - 2;
	const limY = maxY - rh - 2;
	if (limX <= minX + 2 || limY <= minY + 2) {
		return false;
	}

	for (let attempt = 0; attempt < 30; attempt++) {
		const x1 = minX + 2 + Math.floor(Math.random() * (limX - minX - 2));
		const y1 = minY + 2 + Math.floor(Math.random() * (limY - minY - 2));
		const x2 = x1 + rw - 1;
		const y2 = y1 + rh - 1;

		let ok = true;
		for (const r of rooms) {
			if (x1 - 2 <= r.x2 && x2 + 2 >= r.x1
				&& y1 - 2 <= r.y2 && y2 + 2 >= r.y1) {
				ok = false;
				break;
			}
		}

		if (!ok) {
			continue;
		}

		// Ensure room borders don't cross existing floor tiles
		for (let x = x1; x <= x2 && ok; x++) {
			if (!map[y1][x] || !map[y2][x]) {
				ok = false;
			}
		}

		for (let y = y1; y <= y2 && ok; y++) {
			if (!map[y][x1] || !map[y][x2]) {
				ok = false;
			}
		}

		if (!ok) {
			continue;
		}

		for (let y = y1 + 1; y < y2; y++) {
			for (let x = x1 + 1; x < x2; x++) {
				map[y][x] = Tile.FLOOR;
			}
		}

		rooms.push({
			x1, y1, x2, y2,
			cx: Math.floor((x1 + x2) / 2),
			cy: Math.floor((y1 + y2) / 2),
		});
		return true;
	}

	return false;
}

/** Carve an L-shaped corridor between two points. */
function carveCorridor(map: TileMap, ax: number, ay: number, bx: number, by: number): void {
	const S = map.length;
	let x = ax;
	let y = ay;

	if (Math.random() < 0.5) {
		while (x !== bx) {
			if (x >= 0 && x < S && y >= 0 && y < S) {
				map[y][x] = Tile.FLOOR;
			}

			x += x < bx ? 1 : -1;
		}

		while (y !== by) {
			if (x >= 0 && x < S && y >= 0 && y < S) {
				map[y][x] = Tile.FLOOR;
			}

			y += y < by ? 1 : -1;
		}
	} else {
		while (y !== by) {
			if (x >= 0 && x < S && y >= 0 && y < S) {
				map[y][x] = Tile.FLOOR;
			}

			y += y < by ? 1 : -1;
		}

		while (x !== bx) {
			if (x >= 0 && x < S && y >= 0 && y < S) {
				map[y][x] = Tile.FLOOR;
			}

			x += x < bx ? 1 : -1;
		}
	}

	if (x >= 0 && x < S && y >= 0 && y < S) {
		map[y][x] = Tile.FLOOR;
	}
}

/** Connect rooms using Prim's MST + random extras for loops. */
function connectRooms(map: TileMap, rooms: DRoom[]): void {
	if (rooms.length < 2) {
		return;
	}

	const connected = new Set([0]);
	const remaining = new Set(rooms.map((_, i) => i).filter(i => i > 0));

	while (remaining.size > 0) {
		let best = Infinity;
		let from = -1;
		let to = -1;

		for (const ci of connected) {
			for (const ri of remaining) {
				const dx = rooms[ci].cx - rooms[ri].cx;
				const dy = rooms[ci].cy - rooms[ri].cy;
				const d = dx * dx + dy * dy;
				if (d < best) {
					best = d;
					from = ci;
					to = ri;
				}
			}
		}

		if (to < 0) {
			break;
		}

		carveCorridor(map, rooms[from].cx, rooms[from].cy, rooms[to].cx, rooms[to].cy);
		connected.add(to);
		remaining.delete(to);
	}

	// Extra random corridors for loops
	const extra = 3 + Math.floor(Math.random() * 4);
	for (let i = 0; i < extra; i++) {
		const a = Math.floor(Math.random() * rooms.length);
		const b = Math.floor(Math.random() * rooms.length);
		if (a !== b) {
			carveCorridor(map, rooms[a].cx, rooms[a].cy, rooms[b].cx, rooms[b].cy);
		}
	}
}

/** Apply one of 7 decoration templates to a room. */
function decorateRoom(map: TileMap, room: DRoom): void {
	const {x1, y1, x2, y2, cx, cy} = room;
	const rw = x2 - x1 + 1;
	const rh = y2 - y1 + 1;
	const decor = Math.floor(Math.random() * 7);

	switch (decor) {
		case 0: {
			// Grand Hall: 4 symmetric columns
			if (rw >= 9 && rh >= 9) {
				const ox = Math.floor((rw - 3) / 4);
				const oy = Math.floor((rh - 3) / 4);
				map[cy - oy][cx - ox] = Tile.WALL_STONE;
				map[cy - oy][cx + ox] = Tile.WALL_STONE;
				map[cy + oy][cx - ox] = Tile.WALL_STONE;
				map[cy + oy][cx + ox] = Tile.WALL_STONE;
			}

			break;
		}

		case 1: {
			// Pillared Aisle: 2 rows of columns
			if (rw >= 9 && rh >= 7) {
				for (let y = y1 + 2; y < y2 - 1; y += 2) {
					map[y][cx - 2] = Tile.WALL_STONE;
					map[y][cx + 2] = Tile.WALL_STONE;
				}
			}

			break;
		}

		case 2: {
			// Cross Room: alcoves on all 4 sides
			const alcD = 2 + Math.floor(Math.random() * 2);
			for (let d = 0; d < alcD; d++) {
				for (let dx = 0; dx < 3; dx++) {
					carve(map, cx - 1 + dx, y1 - d);
					carve(map, cx - 1 + dx, y2 + d);
				}
			}

			for (let d = 0; d < alcD; d++) {
				for (let dy = 0; dy < 3; dy++) {
					carve(map, x1 - d, cy - 1 + dy);
					carve(map, x2 + d, cy - 1 + dy);
				}
			}

			break;
		}

		case 3: {
			// Chapel: curtained back wall + center pillar
			if (rh >= 7) {
				map[cy][cx] = Tile.WALL_STONE;
				for (let x = x1 + 1; x < x2; x += 2) {
					if (map[y1][x] > 0) {
						map[y1][x] = Tile.WALL_RED_CURTAIN;
					}
				}
			}

			break;
		}

		case 4: {
			// Scattered Pillars
			const n = 3 + Math.floor(Math.random() * 6);
			for (let i = 0; i < n; i++) {
				const px = x1 + 2 + Math.floor(Math.random() * Math.max(1, rw - 4));
				const py = y1 + 2 + Math.floor(Math.random() * Math.max(1, rh - 4));
				if (Math.abs(px - cx) > 1 || Math.abs(py - cy) > 1) {
					map[py][px] = Tile.WALL_STONE;
				}
			}

			break;
		}

		case 5: {
			// Partition: inner wall with a gap
			if (rw >= 9 && rh >= 9) {
				if (Math.random() < 0.5) {
					const wy = cy + (Math.random() < 0.5 ? -2 : 2);
					const wl = Math.floor(rw / 2);
					const wx = x1 + 2;
					for (let i = 0; i < wl && wx + i < x2 - 1; i++) {
						map[wy][wx + i] = Tile.WALL_STONE;
					}

					map[wy][wx + Math.floor(wl / 2)] = Tile.FLOOR;
				} else {
					const wx = cx + (Math.random() < 0.5 ? -2 : 2);
					const wl = Math.floor(rh / 2);
					const wy = y1 + 2;
					for (let i = 0; i < wl && wy + i < y2 - 1; i++) {
						map[wy + i][wx] = Tile.WALL_STONE;
					}

					map[wy + Math.floor(wl / 2)][wx] = Tile.FLOOR;
				}
			}

			break;
		}

		default: {
			break;
		}
	}

	// Wall texture variety
	const v = Math.random();
	const wallType = v < 0.25
		? Tile.WALL_DARK
		: (v < 0.4 ? Tile.WALL_BRICK : 0);
	if (wallType > 0) {
		for (let x = x1; x <= x2; x++) {
			if (map[y1][x] > 0) {
				map[y1][x] = wallType;
			}

			if (map[y2][x] > 0) {
				map[y2][x] = wallType;
			}
		}

		for (let y = y1; y <= y2; y++) {
			if (map[y][x1] > 0) {
				map[y][x1] = wallType;
			}

			if (map[y][x2] > 0) {
				map[y][x2] = wallType;
			}
		}
	}

	// Curtain accents (25%, skip chapel)
	if (decor !== 3 && Math.random() < 0.25) {
		const side = Math.floor(Math.random() * 4);
		if (side < 2) {
			const wy = side === 0 ? y1 : y2;
			for (let x = x1 + 2; x < x2 - 1; x += 2) {
				if (map[wy][x] > 0) {
					map[wy][x] = Tile.WALL_RED_CURTAIN;
				}
			}
		} else {
			const wx = side === 2 ? x1 : x2;
			for (let y = y1 + 2; y < y2 - 1; y += 2) {
				if (map[y][wx] > 0) {
					map[y][wx] = Tile.WALL_RED_CURTAIN;
				}
			}
		}
	}

	// Posters (2–5 per room)
	const wc: Array<{x: number; y: number}> = [];
	for (let x = x1 + 2; x < x2 - 1; x++) {
		if (map[y1][x] > 0) {
			wc.push({x, y: y1});
		}

		if (map[y2][x] > 0) {
			wc.push({x, y: y2});
		}
	}

	for (let y = y1 + 2; y < y2 - 1; y++) {
		if (map[y][x1] > 0) {
			wc.push({x: x1, y});
		}

		if (map[y][x2] > 0) {
			wc.push({x: x2, y});
		}
	}

	shuffle(wc);
	const pc = Math.min(wc.length, 2 + Math.floor(Math.random() * 4));
	for (let i = 0; i < pc; i++) {
		map[wc[i].y][wc[i].x] = Tile.WALL_POSTER;
	}
}

/** Walk from room center toward existing geometry until hitting floor. */
function connectToExisting(map: TileMap, room: DRoom, center: number): void {
	const S = map.length;
	const dirX = room.cx < center ? 1 : -1;
	let x = room.cx;
	for (let i = 0; i < 100; i++) {
		x += dirX;
		if (x < 1 || x >= S - 1) {
			break;
		}

		if (!map[room.cy][x]) {
			return;
		}

		map[room.cy][x] = Tile.FLOOR;
	}

	// Horizontal didn't connect — try vertical
	const dirY = room.cy < center ? 1 : -1;
	let y = room.cy;
	for (let i = 0; i < 100; i++) {
		y += dirY;
		if (y < 1 || y >= S - 1) {
			break;
		}

		if (!map[y][room.cx]) {
			return;
		}

		map[y][room.cx] = Tile.FLOOR;
	}
}

/** Generate a 201×201 dungeon with many connected rooms. */
export function generateDungeon(): TileMap {
	const S = DUNGEON_SIZE;
	const map = emptyMap(S);
	const rooms: DRoom[] = [];

	const target = 25 + Math.floor(Math.random() * 16);
	for (let i = 0; i < target; i++) {
		tryPlaceRoom(map, rooms, 3, 3, S - 3, S - 3);
	}

	connectRooms(map, rooms);

	for (const room of rooms) {
		decorateRoom(map, room);
	}

	// Ensure floor at center + connect to dungeon for player spawn
	const center = Math.floor(S / 2);
	map[center][center] = Tile.FLOOR;
	if (rooms.length > 0) {
		let nearest = rooms[0];
		let nearDist = Infinity;
		for (const r of rooms) {
			const d = (r.cx - center) ** 2 + (r.cy - center) ** 2;
			if (d < nearDist) {
				nearDist = d;
				nearest = r;
			}
		}

		carveCorridor(map, center, center, nearest.cx, nearest.cy);
	}

	// Theater door on one random room (5%)
	if (rooms.length > 0 && Math.random() < 0.05) {
		const r = rooms[Math.floor(Math.random() * rooms.length)];
		map[r.y1][r.cx] = Tile.WALL_DOOR;
	}

	return map;
}

/** Shift dungeon so player ends up at center, filling fresh edges. */
export function shiftDungeon(oldMap: TileMap, dx: number, dy: number): TileMap {
	const S = oldMap.length;
	const map = emptyMap(S);

	for (let y = 0; y < S; y++) {
		for (let x = 0; x < S; x++) {
			const ox = x + dx;
			const oy = y + dy;
			if (ox >= 0 && ox < S && oy >= 0 && oy < S) {
				map[y][x] = oldMap[oy][ox];
			}
		}
	}

	// Scatter rooms in fresh strips and connect to existing geometry
	const rooms: DRoom[] = [];
	if (dx > 0) {
		const x0 = Math.max(3, S - dx - 5);
		for (let i = 0; i < 8; i++) {
			tryPlaceRoom(map, rooms, x0, 3, S - 3, S - 3);
		}
	}

	if (dx < 0) {
		const xEnd = Math.min(S - 3, -dx + 5);
		for (let i = 0; i < 8; i++) {
			tryPlaceRoom(map, rooms, 3, 3, xEnd, S - 3);
		}
	}

	if (dy > 0) {
		const y0 = Math.max(3, S - dy - 5);
		for (let i = 0; i < 8; i++) {
			tryPlaceRoom(map, rooms, 3, y0, S - 3, S - 3);
		}
	}

	if (dy < 0) {
		const yEnd = Math.min(S - 3, -dy + 5);
		for (let i = 0; i < 8; i++) {
			tryPlaceRoom(map, rooms, 3, 3, S - 3, yEnd);
		}
	}

	for (const room of rooms) {
		decorateRoom(map, room);
	}

	const center = Math.floor(S / 2);
	for (const room of rooms) {
		connectToExisting(map, room, center);
	}

	if (rooms.length > 1) {
		connectRooms(map, rooms);
	}

	// Theater door (5%)
	if (rooms.length > 0 && Math.random() < 0.05) {
		const r = rooms[Math.floor(Math.random() * rooms.length)];
		map[r.y1][r.cx] = Tile.WALL_DOOR;
	}

	return map;
}

// ── Catharsis (Stage 3 exit) ────────────────────────────────────

/**
 * Catharsis map — the theater lobby with all windows lit, door open.
 * Beyond the door: open void (floor only, no walls) stretching north.
 * Player walks from lobby through the open door into white nothingness.
 */
export function generateCatharsisMap(): {
	map: TileMap;
	start: {x: number; y: number; angle: number};
	doorY: number;
} {
	// Void extends 30 tiles north beyond the theater
	const voidLength = 30;
	const mapH = voidLength + 19; // Void + theater
	const mapW = 15;

	// Build empty map (all walls)
	const map: TileMap = [];
	for (let y = 0; y < mapH; y++) {
		map.push(Array.from<number>({length: mapW}).fill(Tile.WALL_DARK));
	}

	// Copy theater rows into bottom part (offset by voidLength)
	const theater = createTheaterMap();
	for (let y = 0; y < 19; y++) {
		for (let x = 0; x < mapW; x++) {
			map[y + voidLength][x] = theater[y][x];
		}
	}

	// Open the corridor door — row 0 of theater = voidLength in our map
	for (let x = 5; x <= 9; x++) {
		map[voidLength][x] = Tile.FLOOR;
	}

	// Void: wide open floor beyond the door, no walls
	for (let y = 0; y < voidLength; y++) {
		for (let x = 0; x < mapW; x++) {
			map[y][x] = Tile.FLOOR;
		}
	}

	return {
		map,
		start: {
			x: PLAYER_START.x,
			y: voidLength + PLAYER_START.y,
			angle: PLAYER_START.angle,
		},
		doorY: voidLength,
	};
}
