// === Stage 0 — beginning of game with maze (phases 0-12) ===

import {
	Tile, type TileMap,
} from '../engine/types';
import {
	createTheaterMap,
	generateMaze,
	generateInfiniteCorridor,
	generateDungeon,
	shiftDungeon,
	DUNGEON_SIZE,
	PLAYER_START,
	USHER_POS,
} from '../engine/maps';
import {
	type TheaterState,
	Phase,
	MAZE_POSTER_COUNT,
	MAZE_POSTER_SPRITE_START,
	generateMarkovText,
	isWall,
	isInCorridor,
	checkLobbyProximity,
	tickFootsteps,
	resetToLobby,
	replacePostersWithVortex,
	tickUsherBehind,
	placeBrickWall,
	garbleText,
	rollUsherGoneCycle,
	rollWallTexts,
} from './game';
import {enterStage2Lobby} from './state1';
import {enterStage3Atrium} from './state2';
import {enterCatharsis} from './state3';

// ── Phase ticks ─────────────────────────────────────────────────

export function tickNormal(state: TheaterState, _dt: number): void {
	// Near usher → play audio
	const usher = state.sprites[0];
	if (usher.visible) {
		const distToUsher = Math.sqrt((state.camera.x - usher.x) ** 2 + (state.camera.y - usher.y) ** 2);
		if (distToUsher < 2.5 && state.messageTimer <= 0) {
			state.messageText = 'СПАСИБО, НАСЛАЖДАЙТЕСЬ ПРОСМОТРОМ';
			state.messageTimer = 3;
			state.triggerAudio = 'welcome';
		}
	}

	// Poster / rear door proximity
	checkLobbyProximity(state);

	// Corridor entry → darken screen
	state.darkness = isInCorridor(state.camera) ? Math.min(1, state.darkness + 0.02) : Math.max(0, state.darkness - 0.05);

	// Full darkness → reset to lobby (new cycle)
	if (state.darkness >= 1) {
		state.cycleCount++;
		resetToLobby(state);

		// Stage 4: catharsis
		if (state.stage >= 4 && state.cycleCount >= 2) {
			enterCatharsis(state);
			return;
		}

		// Stage 3: after 2 corridor cycles, transition to atrium with face
		if (state.stage >= 3 && state.cycleCount >= 2) {
			enterStage3Atrium(state);
			return;
		}

		if (state.stage >= 2 && state.cycleCount >= 2) {
			enterStage2Lobby(state);
			return;
		}

		// Check if usher should disappear now
		if (state.cycleCount >= state.usherGoneCycle) {
			state.phase = Phase.USHER_GONE;
			state.sprites[0].visible = false; // Hide usher
		}
	}
}

export function tickUsherGone(state: TheaterState, _dt: number): void {
	// Same as normal but usher is gone, audio still plays
	checkLobbyProximity(state);

	if (isInCorridor(state.camera)) {
		state.darkness = Math.min(1, state.darkness + 0.015);

		// Still play the audio/text even without usher
		if (state.messageTimer <= 0 && state.camera.y < 9) {
			state.messageText = '\u0421\u041F\u0410\u0421\u0418\u0411\u041E, \u041D\u0410\u0421\u041B\u0410\u0416\u0414\u0410\u0419\u0422\u0415\u0421\u042C \u041F\u0420\u041E\u0421\u041C\u041E\u0422\u0420\u041E\u041C';
			state.messageTimer = 3;
			state.triggerAudio = 'welcome';
		}

		// "ДВИЖЕНИЕ ВПЕРЁД" during blackout — hint to keep walking forward
		if (state.darkness > 0.5 && state.messageTimer <= 0) {
			state.messageText = '\u0414\u0412\u0418\u0416\u0415\u041D\u0418\u0415 \u0412\u041F\u0415\u0420\u0401\u0414';
			state.messageTimer = 2;
		}
	} else {
		state.darkness = Math.max(0, state.darkness - 0.05);
	}

	// Transition to dark walk when in deep corridor
	if (state.camera.y < 5) {
		state.phase = Phase.DARK_WALK;
		state.darkness = 0.8;
		state.corridorProgress = 0;
	}
}

export function tickDarkWalk(state: TheaterState, dt: number): void {
	state.darkness = Math.min(0.95, state.darkness + 0.005);
	state.corridorProgress += dt;

	// Footstep sounds
	tickFootsteps(state, dt, 0.6);

	// After enough time in the dark, force vortex encounter regardless of position
	if (state.corridorProgress > 6) {
		state.canMove = false;
		state.phase = Phase.VORTEX_ENCOUNTER;
		state.sprites[1].visible = true;
		// Place vortex ahead of the player, clamped to walkable corridor
		state.sprites[1].x = 7.5;
		state.sprites[1].y = Math.max(1.5, state.camera.y - 2);
		state.darkness = 0.3;
		state.corridorProgress = 0;
	}
}

export function tickVortexEncounter(state: TheaterState, dt: number): void {
	state.canMove = false;
	state.corridorProgress += dt;

	// Player stares at vortex man for a few seconds
	if (state.corridorProgress > 5) {
		state.phase = Phase.GLITCH_SCREAM;
		state.glitchTimer = 8; // 8 seconds of horror
		state.screamPlaying = true;
		state.triggerAudio = 'scream';
	}
}

export function tickGlitchScream(state: TheaterState, dt: number): void {
	state.canMove = false;
	state.glitchTimer -= dt;

	if (state.glitchTimer <= 0) {
		// End of scream sequence
		state.screamPlaying = false;
		state.sprites[1].visible = false;
		state.phase = Phase.POST_ENCOUNTER;
		state.cycleCount++;
		resetToLobby(state);
		state.sprites[0].visible = true; // Usher reappears briefly
		state.vortexFlashTimer = 5 + Math.random() * 10;
	}
}

export function tickPostEncounter(state: TheaterState, dt: number): void {
	// Normal-ish gameplay but with occasional vortex flashes
	state.vortexFlashTimer -= dt;
	if (state.vortexFlashTimer <= 0 && !state.vortexFlashActive) {
		state.vortexFlashActive = true;
		state.triggerAudio = 'flash';
		state.vortexFlashTimer = 0.15; // Flash duration
	} else if (state.vortexFlashActive && state.vortexFlashTimer <= 0) {
		state.vortexFlashActive = false;
		state.vortexFlashTimer = 3 + Math.random() * 8;
	}

	// Usher appears behind the player periodically
	tickUsherBehind(state, dt);

	// Poster / rear door proximity
	checkLobbyProximity(state);

	// Corridor cycling
	state.darkness = isInCorridor(state.camera) ? Math.min(1, state.darkness + 0.02) : Math.max(0, state.darkness - 0.05);

	if (state.darkness >= 1) {
		state.cycleCount++;
		resetToLobby(state);

		// After a few post-encounter cycles, usher gets scared
		if (state.cycleCount >= state.usherGoneCycle + 3) {
			state.phase = Phase.USHER_SCARED;
			state.sprites[0].visible = false;
			state.sprites[2].visible = true; // Show scared usher
			replacePostersWithVortex(state);
		}
	}
}

export function tickUsherScared(state: TheaterState, dt: number): void {
	const scared = state.sprites[2];

	// Usher runs back and forth (no walk animation, sprite bounces)
	state.usherRunTimer += dt;
	scared.x += state.usherRunDir * 3 * dt;
	// Bounce vertically (simulate bobbing)
	scared.y = 10.5 + Math.sin(state.usherRunTimer * 8) * 0.1;

	// Reverse at walls
	if (scared.x < 3 || scared.x > 12) {
		state.usherRunDir *= -1;
	}

	// Near scared usher → warning message
	const dist = Math.sqrt((state.camera.x - scared.x) ** 2 + (state.camera.y - scared.y) ** 2);
	if (dist < 2.5 && !state.warningShown) {
		state.phase = Phase.USHER_WARNING;
		state.warningShown = true;
		state.glitchTimer = 0; // Reset timer for warning countdown
	}

	// Vortex flashes continue
	state.vortexFlashTimer -= dt;
	if (state.vortexFlashTimer <= 0 && !state.vortexFlashActive) {
		state.vortexFlashActive = true;
		state.triggerAudio = 'flash';
		state.vortexFlashTimer = 0.15;
	} else if (state.vortexFlashActive && state.vortexFlashTimer <= 0) {
		state.vortexFlashActive = false;
		state.vortexFlashTimer = 2 + Math.random() * 5;
	}
}

let warningTimerStarted = false;

export function tickUsherWarning(state: TheaterState, dt: number): void {
	// Show garbled warning text (only set once)
	if (!warningTimerStarted) {
		warningTimerStarted = true;
		state.messageText = garbleText('НЕ ДОСТИГАЙ СЛЕДУЮЩИХ УРОВНЕЙ');
		state.messageTimer = 4;
		state.triggerAudio = 'warning';
		state.canMove = false;
	}

	// Count down using dt instead of setTimeout
	state.glitchTimer -= dt;
	if (state.glitchTimer <= -4) {
		warningTimerStarted = false;
		state.sprites[2].visible = false;
		state.phase = Phase.FINAL_WALL;
		state.canMove = true;
		state.darkness = 0;
		resetToLobby(state);
		placeBrickWall(state);
	}
}

export function tickFinalWall(state: TheaterState, dt: number): void {
	state.finalWallTimer += dt;

	// Player sees brick wall ahead. After a moment, show message.
	if (state.finalWallTimer > 2 && state.messageTimer <= 0 && !state.finalWallPassageOpened) {
		state.messageText = '\u041F\u0440\u043E\u0445\u043E\u0434 \u0437\u0430\u043A\u0440\u044B\u0442...';
		state.messageTimer = 3;
	}

	// After 5 seconds, open passage behind player (remove south lobby wall)
	if (state.finalWallTimer > 5 && !state.finalWallPassageOpened) {
		state.finalWallPassageOpened = true;
		// Open the south wall of the lobby to reveal a passage
		for (let x = 6; x <= 8; x++) {
			state.map[17][x] = Tile.FLOOR;
			state.map[18][x] = Tile.FLOOR;
		}

		state.messageText = '\u0427\u0442\u043E-\u0442\u043E \u043E\u0442\u043A\u0440\u044B\u043B\u043E\u0441\u044C \u043F\u043E\u0437\u0430\u0434\u0438...';
		state.messageTimer = 4;
		state.triggerAudio = 'flash';
	}

	// When player walks through the opened passage (south of lobby)
	if (state.finalWallPassageOpened && state.camera.y > 18) {
		enterMaze(state);
	}
}

// ── Maze entry ──────────────────────────────────────────────────

export function enterMaze(state: TheaterState): void {
	const maze = generateMaze(31);
	state.map = maze.map;
	state.camera.x = maze.start.x;
	state.camera.y = maze.start.y;
	state.camera.angle = Math.PI / 2; // Face south (into maze)
	state.mazeExitX = maze.exit.x;
	state.mazeExitY = maze.exit.y;
	state.darkness = 0;
	state.phase = Phase.MAZE;

	// Entity — slow independent wanderer in the maze
	const entity = state.sprites[0];
	entity.x = maze.bileterStart.x;
	entity.y = maze.bileterStart.y;
	entity.visible = true;
	entity.textureId = 'vortex';

	// Hide other sprites
	state.sprites[1].visible = false;
	state.sprites[2].visible = false;

	// Place poster easels in random floor cells of the maze
	const floorCells: Array<{x: number; y: number}> = [];
	for (let y = 2; y < maze.map.length - 2; y++) {
		for (let x = 2; x < maze.map[0].length - 2; x++) {
			if (maze.map[y][x] === 0) {
				const distToStart = Math.abs(x + 0.5 - maze.start.x) + Math.abs(y + 0.5 - maze.start.y);
				if (distToStart > 5) {
					floorCells.push({x, y});
				}
			}
		}
	}

	// Scatter posters across the maze
	const newSeeds: number[] = [];
	for (let i = 0; i < MAZE_POSTER_COUNT; i++) {
		const si = MAZE_POSTER_SPRITE_START + i;
		if (si < state.sprites.length && floorCells.length > 0) {
			const idx = Math.floor(Math.random() * floorCells.length);
			const cell = floorCells.splice(idx, 1)[0];
			const seed = Math.floor(Math.random() * 90_000) + 10_000 + i;
			const isEmpty = Math.random() < 0.3;
			state.sprites[si].x = cell.x + 0.5;
			state.sprites[si].y = cell.y + 0.5;
			state.sprites[si].textureId = isEmpty ? 'empty_easel' : `maze_poster_${i}`;
			state.sprites[si].visible = true;
			state.sprites[si].scale = 0.7;
			newSeeds.push(isEmpty ? 0 : seed);
		} else {
			newSeeds.push(0);
		}
	}

	state.mazePosterSeeds = newSeeds;

	state.messageText = '';
	state.canMove = true;
	state.bileterSpeed = 0.8; // Slower than player
	state.footstepTimer = 0;
	state.entityDirection = Math.random() * Math.PI * 2;
	state.entityTurnTimer = 2 + Math.random() * 4;
	state.entityTargetX = state.camera.x;
	state.entityTargetY = state.camera.y;
	state.entityHuntTimer = 4 + Math.random() * 3;
	state.entitySeesPlayer = false;
	state.entityPath = [];
	state.entityPathIndex = 0;
}

// ── Maze tick ───────────────────────────────────────────────────

export function tickMaze(state: TheaterState, dt: number): void {
	// Ramp up maze fog over first few seconds for atmosphere
	state.mazeFogDensity = Math.min(0.25, state.mazeFogDensity + dt * 0.03);

	// Footstep sounds
	tickFootsteps(state, dt, 0.8);

	// Move entity independently (wanders on its own)
	moveEntity(state, dt);

	// Check if entity caught the player
	const entity = state.sprites[0];
	const distToEntity = Math.sqrt((state.camera.x - entity.x) ** 2 + (state.camera.y - entity.y) ** 2);
	if (distToEntity < 0.8) {
		enterInfiniteCorridor(state);
		return;
	}

	// Check if player reached exit
	const distToExit = Math.sqrt((state.camera.x - state.mazeExitX) ** 2 + (state.camera.y - state.mazeExitY) ** 2);
	if (distToExit < 1.5) {
		state.phase = Phase.MAZE_EXIT;
		state.canMove = false;
		state.messageText = '\u0412\u044B\u0445\u043E\u0434...';
		state.messageTimer = 3;
		state.corridorProgress = 0;
		return;
	}

	// Maze poster proximity — show Markov text
	if (state.messageTimer <= 0) {
		for (let i = 0; i < MAZE_POSTER_COUNT; i++) {
			const si = MAZE_POSTER_SPRITE_START + i;
			if (si < state.sprites.length && state.sprites[si].visible && state.mazePosterSeeds[i]) {
				const dx = state.camera.x - state.sprites[si].x;
				const dy = state.camera.y - state.sprites[si].y;
				if (dx * dx + dy * dy < 3) {
					state.messageText = generateMarkovText(state.mazePosterSeeds[i]);
					state.messageTimer = 2.5;
					break;
				}
			}
		}
	}
}

// ── Entity AI (BFS pathfinding → wander → LOS chase) ───────

/** Line-of-sight check: can entity see the player through corridors? */
function hasLineOfSight(map: TileMap, x0: number, y0: number, x1: number, y1: number): boolean {
	const dx = x1 - x0;
	const dy = y1 - y0;
	const dist = Math.sqrt(dx * dx + dy * dy);
	if (dist > 10) {
		return false; // Too far, don't bother
	}

	const steps = Math.ceil(dist * 3);
	for (let i = 1; i < steps; i++) {
		const t = i / steps;
		const cx = Math.floor(x0 + dx * t);
		const cy = Math.floor(y0 + dy * t);
		if (cy < 0 || cy >= map.length || cx < 0 || cx >= map[0].length) {
			return false;
		}

		if (map[cy][cx] > 0) {
			return false;
		}
	}

	return true;
}

// ── BFS pathfinding on tile grid ────────────────────────────

function findPath(
	map: TileMap,
	sx: number, sy: number,
	tx: number, ty: number,
): Array<{x: number; y: number}> {
	const startX = Math.floor(sx);
	const startY = Math.floor(sy);
	const goalX = Math.floor(tx);
	const goalY = Math.floor(ty);

	if (startX === goalX && startY === goalY) {
		return [];
	}

	const h = map.length;
	const w = map[0]?.length ?? 0;
	if (goalY < 0 || goalY >= h || goalX < 0 || goalX >= w) {
		return [];
	}

	if (map[goalY][goalX] > 0) {
		return []; // Goal is inside a wall
	}

	// BFS
	const visited = new Uint8Array(w * h);
	const parent = new Int32Array(w * h).fill(-1);
	const queue: number[] = [];

	const startIdx = startY * w + startX;
	const goalIdx = goalY * w + goalX;
	visited[startIdx] = 1;
	queue.push(startIdx);

	const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
	let found = false;

	let head = 0;
	while (head < queue.length) {
		const idx = queue[head++];
		if (idx === goalIdx) {
			found = true;
			break;
		}

		const cx = idx % w;
		const cy = (idx - cx) / w;

		for (const [ddx, ddy] of dirs) {
			const nx = cx + ddx;
			const ny = cy + ddy;
			if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
				continue;
			}

			const nIdx = ny * w + nx;
			if (visited[nIdx]) {
				continue;
			}

			if (map[ny][nx] > 0) {
				continue;
			}

			visited[nIdx] = 1;
			parent[nIdx] = idx;
			queue.push(nIdx);
		}
	}

	if (!found) {
		return [];
	}

	// Reconstruct path (cell centers)
	const path: Array<{x: number; y: number}> = [];
	let cur = goalIdx;
	while (cur !== startIdx && cur !== -1) {
		const px = cur % w;
		const py = (cur - px) / w;
		path.push({x: px + 0.5, y: py + 0.5});
		cur = parent[cur];
	}

	path.reverse();
	return path;
}

// ── Entity movement ─────────────────────────────────────────

const ENTITY_MARGIN = 0.1;

function moveEntity(state: TheaterState, dt: number): void {
	const entity = state.sprites[0];

	// 1) LOS check — if entity sees player, chase directly
	state.entitySeesPlayer = hasLineOfSight(state.map, entity.x, entity.y, state.camera.x, state.camera.y);

	if (state.entitySeesPlayer) {
		const chaseSpeed = 1.6 * dt;
		const diffX = state.camera.x - entity.x;
		const diffY = state.camera.y - entity.y;
		const dist = Math.sqrt(diffX * diffX + diffY * diffY);
		if (dist > 0.1) {
			moveEntityStep(state, entity, (diffX / dist) * chaseSpeed, (diffY / dist) * chaseSpeed);
		}

		// Clear path so it recalculates after LOS breaks
		state.entityPath = [];
		state.entityPathIndex = 0;
		state.entityHuntTimer = 1 + Math.random() * 2;
		return;
	}

	// 2) Periodically compute BFS path toward player cell
	state.entityHuntTimer -= dt;
	if (state.entityHuntTimer <= 0) {
		state.entityPath = findPath(state.map, entity.x, entity.y, state.camera.x, state.camera.y);
		state.entityPathIndex = 0;
		state.entityHuntTimer = 3 + Math.random() * 3;
	}

	const speed = state.bileterSpeed * dt;

	// 3) Follow BFS path if available — move one axis at a time for clean cornering
	if (state.entityPath.length > 0 && state.entityPathIndex < state.entityPath.length) {
		const wp = state.entityPath[state.entityPathIndex];
		const wpDx = wp.x - entity.x;
		const wpDy = wp.y - entity.y;
		const wpDist = Math.sqrt(wpDx * wpDx + wpDy * wpDy);

		if (wpDist < 0.3) {
			// Reached waypoint, snap to center and advance
			entity.x = wp.x;
			entity.y = wp.y;
			state.entityPathIndex++;
		} else if (Math.abs(wpDx) > Math.abs(wpDy)) {
			// Move along dominant axis first for clean corner navigation
			moveEntityStep(state, entity, Math.sign(wpDx) * speed, 0);
		} else {
			moveEntityStep(state, entity, 0, Math.sign(wpDy) * speed);
		}

		return;
	}

	// 4) No path / path exhausted — random wander
	state.entityTurnTimer -= dt;
	if (state.entityTurnTimer <= 0) {
		state.entityDirection += (Math.random() - 0.5) * Math.PI * 1.2;
		state.entityTurnTimer = 1 + Math.random() * 2;
	}

	const dirX = Math.cos(state.entityDirection);
	const dirY = Math.sin(state.entityDirection);
	moveEntityStep(state, entity, dirX * speed, dirY * speed);
}

function moveEntityStep(state: TheaterState, entity: {x: number; y: number}, dx: number, dy: number): void {
	const newX = entity.x + dx;
	const newY = entity.y + dy;

	const canX = !isWall(state.map, newX, entity.y, ENTITY_MARGIN);
	const canY = !isWall(state.map, entity.x, newY, ENTITY_MARGIN);

	if (canX && canY) {
		if (!isWall(state.map, newX, newY, ENTITY_MARGIN)) {
			entity.x = newX;
			entity.y = newY;
		} else if (canX) {
			entity.x = newX;
		} else {
			entity.y = newY;
		}
	} else if (canX) {
		entity.x = newX;
	} else if (canY) {
		entity.y = newY;
	} else {
		// Both axes blocked — teleport to current cell center
		entity.x = Math.floor(entity.x) + 0.5;
		entity.y = Math.floor(entity.y) + 0.5;

		// Force immediate path recalculation
		state.entityPath = [];
		state.entityPathIndex = 0;
		state.entityHuntTimer = 0;
	}
}

// ── Infinite corridor (caught by bileter) ───────────────────────

function enterInfiniteCorridor(state: TheaterState): void {
	state.triggerAudio = 'scream';
	const corridor = generateInfiniteCorridor();
	state.map = corridor.map;
	state.camera.x = corridor.start.x;
	state.camera.y = corridor.start.y;
	state.camera.angle = Math.PI / 2; // Face forward (toward DEAD walls)
	state.phase = Phase.INFINITE_CORRIDOR;
	state.canMove = true;
	state.darkness = 0;

	// Hide all sprites
	for (const sprite of state.sprites) {
		sprite.visible = false;
	}

	state.messageText = '';
}

export function tickInfiniteCorridor(state: TheaterState, dt: number): void {
	// Footstep sounds
	tickFootsteps(state, dt, 0.7);

	// Show text based on position
	const behindThreshold = 25;
	if (state.camera.y < behindThreshold && state.messageTimer <= 0) {
		// Looking back toward life walls
		const lifeMessages = ['\u0420\u041E\u0416\u0414\u0415\u041D', '\u0420\u041E\u0421\u0422', '\u0416\u0418\u0417\u041D\u042C', '\u0423\u0412\u042F\u0414\u0410\u041D\u0418\u0415', '\u0421\u0422\u0410\u0420\u041E\u0421\u0422\u042C', '\u0421\u041C\u0415\u0420\u0422\u042C'];
		const index = Math.min(lifeMessages.length - 1, Math.floor((behindThreshold - state.camera.y) / 5));
		state.messageText = lifeMessages[index];
		state.messageTimer = 2;
	} else if (state.camera.y >= behindThreshold && state.messageTimer <= 0) {
		// Forward — death forever
		state.messageText = '\u041C\u0451\u0440\u0442\u0432. \u041C\u0451\u0440\u0442\u0432. \u041C\u0451\u0440\u0442\u0432.';
		state.messageTimer = 1.5;
	}
}

// ── Maze exit ───────────────────────────────────────────────────

export function tickMazeExit(state: TheaterState, dt: number): void {
	state.corridorProgress += dt;
	state.darkness = Math.min(1, state.corridorProgress / 3);

	if (state.corridorProgress > 3) {
		// Reset everything — back to title (gameOver triggers onCrash → title)
		state.gameOver = true;
	}
}

// ── Infinite rooms mode (загрузка) ──────────────────────────────

let lastRoomCamX = 0;
let lastRoomCamY = 0;

/** Enter the infinite rooms mode. */
export function enterRooms(state: TheaterState): void {
	const half = Math.floor(DUNGEON_SIZE / 2);
	state.map = generateDungeon();
	state.camera.x = half + 0.5;
	state.camera.y = half + 0.5;
	state.camera.angle = 0;
	state.camera.pitch = 0;
	state.phase = Phase.ROOMS;
	state.darkness = 0;
	state.canMove = true;
	state.messageText = '';
	state.messageTimer = 0;
	state.footstepTimer = 0;
	state.mazeFogDensity = 0.06;
	lastRoomCamX = state.camera.x;
	lastRoomCamY = state.camera.y;

	// Hide all sprites
	for (const sprite of state.sprites) {
		sprite.visible = false;
	}
}

export function tickRooms(state: TheaterState, dt: number): void {
	// Footstep sounds
	tickFootsteps(state, dt, 0.8);

	// Scan nearby tiles for poster walls & theater door
	const S = state.map.length;
	const tpx = Math.floor(state.camera.x);
	const tpy = Math.floor(state.camera.y);

	for (let dy = -2; dy <= 2; dy++) {
		for (let dx = -2; dx <= 2; dx++) {
			const tx = tpx + dx;
			const ty = tpy + dy;
			if (tx < 0 || tx >= S || ty < 0 || ty >= S) {
				continue;
			}

			const tile = state.map[ty][tx] as Tile;
			const dist2 = (state.camera.x - tx - 0.5) ** 2
				+ (state.camera.y - ty - 0.5) ** 2;

			if (tile === Tile.WALL_POSTER && dist2 < 6
				&& state.messageTimer <= 0) {
				state.messageText = generateMarkovText(tx * 7919 + ty * 6271);
				state.messageTimer = 2.5;
			}

			if (tile === Tile.WALL_DOOR) {
				if (dist2 < 2) {
					startTheaterFromRooms(state);
					return;
				}

				if (dist2 < 5 && state.messageTimer <= 0) {
					state.messageText = '\u0422\u0415\u0410\u0422\u0420';
					state.messageTimer = 2;
				}
			}
		}
	}

	// Shift dungeon when player nears map edge (regen far from player)
	const margin = 30;
	const px = state.camera.x;
	const py = state.camera.y;
	if (px < margin || px > S - margin
		|| py < margin || py > S - margin) {
		const half = Math.floor(S / 2);
		const shiftX = Math.round(px) - half;
		const shiftY = Math.round(py) - half;
		state.map = shiftDungeon(state.map, shiftX, shiftY);
		state.camera.x -= shiftX;
		state.camera.y -= shiftY;
		lastRoomCamX -= shiftX;
		lastRoomCamY -= shiftY;
	}
}

/** Transition from rooms mode to the normal theater game. */
function startTheaterFromRooms(state: TheaterState): void {
	const map = createTheaterMap();
	state.map = map;
	state.camera.x = PLAYER_START.x;
	state.camera.y = PLAYER_START.y;
	state.camera.angle = PLAYER_START.angle;
	state.camera.pitch = 0;
	state.phase = Phase.NORMAL;
	state.cycleCount = 0;
	state.darkness = 0;
	state.canMove = true;
	state.corridorProgress = 0;
	state.messageText = '';
	state.messageTimer = 0;
	state.usherGoneCycle = rollUsherGoneCycle();
	state.wallTexts = rollWallTexts();
	state.warningShown = false;
	state.finalWallTimer = 0;
	state.finalWallPassageOpened = false;
	state.usherBehindTimer = 8 + Math.random() * 12;

	// Reset sprites
	state.sprites[0].x = USHER_POS.x;
	state.sprites[0].y = USHER_POS.y;
	state.sprites[0].textureId = 'usher';
	state.sprites[0].visible = true;
	state.sprites[0].scale = 1;
	state.sprites[1].visible = false;
	state.sprites[2].visible = false;
	for (let i = MAZE_POSTER_SPRITE_START; i < state.sprites.length; i++) {
		state.sprites[i].visible = false;
	}
}
