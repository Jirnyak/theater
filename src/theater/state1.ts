// === Stage 1 — first window column lit, stage 2 (phases 13-17) ===

import {
	Tile, type TileMap,
} from '../engine/types';
import {
	PLAYER_START,
	USHER_POS,
	POSTER_POSITIONS,
	createStage2LobbyMap,
	generateSnakeCorridor,
} from '../engine/maps';
import {
	type TheaterState,
	Phase,
	PEOPLE_COUNT,
	PEOPLE_SPRITE_START,
	MAZE_POSTER_SPRITE_START,
	tickFootsteps,
} from './game';

// ── Stage 2: bright lobby → side corridor → dark hall ───────────

/** People in the stage 2 lobby: queue (0-4), poster viewers (5-6), wanderers (7-9). */
const PEOPLE_POSITIONS = [
	// Queue in front of usher — single file facing north
	{x: 7.5, y: 10},
	{x: 7.5, y: 11},
	{x: 7.5, y: 12},
	{x: 7.5, y: 13},
	{x: 7.5, y: 14},
	// Standing near posters
	{x: 2.5, y: 9.5},
	{x: 12.5, y: 12.5},
	// Walking around atrium
	{x: 4, y: 15},
	{x: 11, y: 14},
	{x: 5, y: 11},
];

/** Wanderer indices within PEOPLE_POSITIONS (and sprite offset). */
const WANDERER_START = 7;

/** Per-wanderer movement state (module-level, reset on enter). */
type WandererData = {
	targetX: number;
	targetY: number;
	speed: number;
	waitTimer: number;
};

let wandererData: WandererData[] = [];

function pickWanderTarget(): {x: number; y: number} {
	// Stay inside the lobby floor area (x: 2-12, y: 9-16)
	return {
		x: 2.5 + Math.random() * 10,
		y: 9.5 + Math.random() * 7,
	};
}

function initWanderers(): void {
	wandererData = [];
	for (let i = WANDERER_START; i < PEOPLE_POSITIONS.length; i++) {
		const target = pickWanderTarget();
		wandererData.push({
			targetX: target.x,
			targetY: target.y,
			speed: 0.4 + Math.random() * 0.6,
			waitTimer: Math.random() * 3,
		});
	}
}

export function enterStage2Lobby(state: TheaterState): void {
	state.map = createStage2LobbyMap();
	state.phase = Phase.STAGE2_LOBBY;
	state.camera.x = PLAYER_START.x;
	state.camera.y = PLAYER_START.y;
	state.camera.angle = PLAYER_START.angle;
	state.darkness = 0;
	state.canMove = true;
	state.corridorProgress = 0;
	state.messageText = '';
	state.messageTimer = 0;
	state.mazeFogDensity = 0;

	// Block the corridor area so player can't pass the usher
	const blockers = new Set<string>();
	for (let y = 0; y <= 8; y++) {
		for (let x = 0; x < 15; x++) {
			blockers.add(x + ',' + y);
		}
	}

	state.blockers = blockers;

	// Place usher at archway (same position as original)
	state.sprites[0].x = USHER_POS.x;
	state.sprites[0].y = USHER_POS.y;
	state.sprites[0].textureId = 'usher';
	state.sprites[0].visible = true;
	state.sprites[0].scale = 1;
	state.sprites[1].visible = false;
	state.sprites[2].visible = false;

	// Hide maze posters
	for (let i = MAZE_POSTER_SPRITE_START; i < PEOPLE_SPRITE_START; i++) {
		state.sprites[i].visible = false;
	}

	// Place people sprites
	for (let i = 0; i < PEOPLE_COUNT; i++) {
		const si = PEOPLE_SPRITE_START + i;
		if (si < state.sprites.length && i < PEOPLE_POSITIONS.length) {
			state.sprites[si].x = PEOPLE_POSITIONS[i].x;
			state.sprites[si].y = PEOPLE_POSITIONS[i].y;
			state.sprites[si].textureId = `person_${i}`;
			state.sprites[si].visible = true;
			state.sprites[si].scale = 0.9;
		}
	}

	// Init wanderer movement
	initWanderers();
}

export function tickStage2Lobby(state: TheaterState, dt: number): void {
	// Near usher → greeting
	const usher = state.sprites[0];
	if (usher.visible) {
		const distToUsher = Math.sqrt((state.camera.x - usher.x) ** 2 + (state.camera.y - usher.y) ** 2);
		if (distToUsher < 2.5 && state.messageTimer <= 0) {
			state.messageText = '\u0421\u041F\u0415\u041A\u0422\u0410\u041A\u041B\u042C \u0421\u041A\u041E\u0420\u041E \u041D\u0410\u0427\u041D\u0401\u0422\u0421\u042F';
			state.messageTimer = 3;
			state.triggerAudio = 'welcome';
		}
	}

	// Usher blocks passage — push player back if too close
	const usherDx = state.camera.x - usher.x;
	const usherDy = state.camera.y - usher.y;
	const usherDist = Math.sqrt(usherDx * usherDx + usherDy * usherDy);
	if (usherDist < 0.8 && usherDist > 0) {
		state.camera.x = usher.x + (usherDx / usherDist) * 0.8;
		state.camera.y = usher.y + (usherDy / usherDist) * 0.8;
		if (state.messageTimer <= 0) {
			state.messageText = '\u041F\u0420\u041E\u0425\u041E\u0414 \u0417\u0410\u041A\u0420\u042B\u0422';
			state.messageTimer = 2;
		}
	}

	// Move wanderers
	for (const [wi, wd] of wandererData.entries()) {
		const si = PEOPLE_SPRITE_START + WANDERER_START + wi;
		if (si >= state.sprites.length) {
			continue;
		}

		const sprite = state.sprites[si];
		if (wd.waitTimer > 0) {
			wd.waitTimer -= dt;
			continue;
		}

		const dx = wd.targetX - sprite.x;
		const dy = wd.targetY - sprite.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist < 0.3) {
			// Reached target — pick a new one after a pause
			const next = pickWanderTarget();
			wd.targetX = next.x;
			wd.targetY = next.y;
			wd.speed = 0.4 + Math.random() * 0.6;
			wd.waitTimer = 1 + Math.random() * 4;
		} else {
			const step = wd.speed * dt;
			sprite.x += (dx / dist) * step;
			sprite.y += (dy / dist) * step;
		}
	}

	// Check if player entered left passage (x near left edge)
	if (state.camera.x < 0.5) {
		state.stage2EnteredSide = 'left';
		enterSnakeCorridor(state);
		return;
	}

	// Check if player entered right passage (x near right edge)
	if (state.camera.x > 14) {
		state.stage2EnteredSide = 'right';
		enterSnakeCorridor(state);
		return;
	}

	// Wall poster proximity
	if (state.messageTimer <= 0) {
		for (const [i, pos] of POSTER_POSITIONS.entries()) {
			const dx = state.camera.x - (pos.x + 0.5);
			const dy = state.camera.y - (pos.y + 0.5);
			if (dx * dx + dy * dy < 6) {
				const text = state.wallTexts[i];
				if (text) {
					state.messageText = text;
					state.messageTimer = 2.5;
					break;
				}
			}
		}
	}
}

function enterSnakeCorridor(state: TheaterState): void {
	const corridor = generateSnakeCorridor();
	state.map = corridor.map;
	state.snakePathTiles = corridor.pathTiles;
	state.snakePathSegments = corridor.pathSegments;
	state.snakeExitY = corridor.exitY;
	state.snakeVoidTimer = 0;
	state.camera.x = corridor.start.x;
	state.camera.y = corridor.start.y;
	state.camera.angle = corridor.start.angle;
	state.phase = Phase.STAGE2_CORRIDOR;
	state.darkness = 0.3;
	state.canMove = true;
	state.corridorProgress = 0;
	state.footstepTimer = 0;
	state.messageText = '';
	state.messageTimer = 0;
	state.mazeFogDensity = 0.12;
	state.blockers = undefined;

	// Hide all sprites
	for (const sprite of state.sprites) {
		sprite.visible = false;
	}
}

export function tickSnakeCorridor(state: TheaterState, dt: number): void {
	// Footstep sounds
	tickFootsteps(state, dt, 0.8);

	// Random screamer — face flash + camera spin
	state.snakeScareTimer -= dt;
	if (state.snakeScareTimer <= 0 && !state.vortexFlashActive) {
		state.vortexFlashActive = true;
		state.vortexFlashTimer = 0.25;
		state.triggerAudio = 'flash';
		state.snakeSpinTimer = 0.6;
		state.snakeSpinDir = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3);
		state.snakeScareTimer = 4 + Math.random() * 10;
	}

	// Active flash countdown
	if (state.vortexFlashActive) {
		state.vortexFlashTimer -= dt;
		if (state.vortexFlashTimer <= 0) {
			state.vortexFlashActive = false;
		}
	}

	// Camera spin effect
	if (state.snakeSpinTimer > 0) {
		state.camera.angle += state.snakeSpinDir * dt;
		state.snakeSpinTimer -= dt;
	}

	// Check if player reached the exit
	if (state.camera.y < state.snakeExitY + 0.5) {
		enterStage2Dark(state);
		return;
	}

	// Check if player is on the path
	const tileX = Math.floor(state.camera.x);
	const tileY = Math.floor(state.camera.y);
	if (!state.snakePathTiles.has(`${tileX},${tileY}`)) {
		// Stepped off the path → permanent void
		enterSnakeVoid(state);
	}
}

/** Teleport player into infinite empty void — no escape. */
function enterSnakeVoid(state: TheaterState): void {
	// Create a huge flat floor with no walls
	const size = 64;
	const map: TileMap = [];
	for (let y = 0; y < size; y++) {
		map.push(Array.from<number>({length: size}).fill(Tile.FLOOR));
	}

	state.map = map;
	state.phase = Phase.SNAKE_VOID;
	state.camera.x = size / 2;
	state.camera.y = size / 2;
	state.darkness = 0;
	state.canMove = true;
	state.snakeVoidTimer = 0;
	state.messageText = '';
	state.messageTimer = 0;
	state.mazeFogDensity = 0;
	state.snakePathTiles = new Set();
	state.snakePathSegments = [];
	state.triggerAudio = 'warning';

	for (const sprite of state.sprites) {
		sprite.visible = false;
	}
}

export function tickSnakeVoid(state: TheaterState, dt: number): void {
	state.snakeVoidTimer += dt;

	// Infinite plane — if player nears map edge, re-center silently
	const size = state.map.length;
	const margin = 10;
	if (
		state.camera.x < margin || state.camera.x > size - margin
		|| state.camera.y < margin || state.camera.y > size - margin
	) {
		state.camera.x = size / 2;
		state.camera.y = size / 2;
	}

	// Occasional eerie message
	if (state.snakeVoidTimer > 5 && state.snakeVoidTimer < 6 && state.messageTimer <= 0) {
		state.messageText = '\u041F\u0423\u0421\u0422\u041E\u0422\u0410';
		state.messageTimer = 3;
	}

	// Footstep echo
	tickFootsteps(state, dt, 1.2);
}

function enterStage2Dark(state: TheaterState): void {
	state.map = createStage2LobbyMap();
	state.phase = Phase.STAGE2_DARK;
	state.darkness = 0.6;
	state.canMove = true;
	state.stage2DarkTimer = 0;
	state.corridorProgress = 0;
	state.messageText = '';
	state.messageTimer = 0;
	state.mazeFogDensity = 0.2;

	// Player exits from the opposite side passage
	if (state.stage2EnteredSide === 'left') {
		// Entered left, exit right
		state.camera.x = 13.5;
		state.camera.y = 10.5;
		state.camera.angle = Math.PI; // Face west (into lobby)
	} else {
		// Entered right, exit left
		state.camera.x = 1.5;
		state.camera.y = 10.5;
		state.camera.angle = 0; // Face east (into lobby)
	}

	// Hide everyone
	for (const sprite of state.sprites) {
		sprite.visible = false;
	}

	// Place two vortex entities in opposite corners of the lobby
	state.sprites[0].textureId = 'vortex';
	state.sprites[0].scale = 1.1;
	state.sprites[1].textureId = 'vortex';
	state.sprites[1].scale = 1.1;

	if (state.stage2EnteredSide === 'left') {
		state.sprites[0].x = 3;
		state.sprites[0].y = 9.5;
		state.sprites[1].x = 3;
		state.sprites[1].y = 15;
	} else {
		state.sprites[0].x = 12;
		state.sprites[0].y = 9.5;
		state.sprites[1].x = 12;
		state.sprites[1].y = 15;
	}

	state.sprites[0].visible = false;
	state.sprites[1].visible = false;
}

export function tickStage2Dark(state: TheaterState, dt: number): void {
	state.stage2DarkTimer += dt;

	// Footstep sounds
	tickFootsteps(state, dt, 0.9);

	// After 2 seconds, show eerie message
	if (state.stage2DarkTimer > 2 && state.stage2DarkTimer < 3 && state.messageTimer <= 0) {
		state.messageText = '\u0422\u0418\u0428\u0418\u041D\u0410';
		state.messageTimer = 2;
	}

	// After 4 seconds, vortex entities emerge
	if (state.stage2DarkTimer > 4 && !state.sprites[0].visible) {
		state.sprites[0].visible = true;
		state.sprites[1].visible = true;
		state.triggerAudio = 'flash';
	}

	// Entities slowly approach player
	if (state.sprites[0].visible) {
		const speed = 0.8 * dt;
		for (const si of [0, 1]) {
			const entity = state.sprites[si];
			const dx = state.camera.x - entity.x;
			const dy = state.camera.y - entity.y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist > 0.5) {
				entity.x += (dx / dist) * speed;
				entity.y += (dy / dist) * speed;
			}
		}

		// Either entity close enough → trigger exit
		const d0 = Math.sqrt((state.camera.x - state.sprites[0].x) ** 2 + (state.camera.y - state.sprites[0].y) ** 2);
		const d1 = Math.sqrt((state.camera.x - state.sprites[1].x) ** 2 + (state.camera.y - state.sprites[1].y) ** 2);
		if (d0 < 1.5 || d1 < 1.5) {
			state.phase = Phase.STAGE2_EXIT;
			state.canMove = false;
			state.corridorProgress = 0;
			state.triggerAudio = 'scream';
		}
	}

	// After 12 seconds force exit regardless
	if (state.stage2DarkTimer > 12) {
		state.phase = Phase.STAGE2_EXIT;
		state.canMove = false;
		state.corridorProgress = 0;
		state.triggerAudio = 'scream';
	}
}

export function tickStage2Exit(state: TheaterState, dt: number): void {
	state.corridorProgress += dt;
	state.darkness = Math.min(1, state.corridorProgress / 3);

	if (state.corridorProgress > 3) {
		state.gameOver = true;
	}
}
