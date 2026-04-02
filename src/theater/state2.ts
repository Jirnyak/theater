// === Stage 2 — second window column, tunnel with face, stage 3 (phases 18-21) ===

import {
	Tile, type TileMap,
} from '../engine/types';
import {
	createTheaterMap,
	PLAYER_START,
	USHER_POS,
	generateStage3Corridor,
} from '../engine/maps';
import {
	type TheaterState,
	Phase,
	PEOPLE_COUNT,
	PEOPLE_SPRITE_START,
	isInCorridor,
	tickFootsteps,
} from './game';

// ── Stage 3: Atrium → Corridor → Catharsis ────────────────────

/** Stage 3 atrium — lobby filled with vortex-headed figures standing still. */
export function enterStage3Atrium(state: TheaterState): void {
	state.map = createTheaterMap();
	state.phase = Phase.STAGE3_ATRIUM;
	state.camera.x = PLAYER_START.x;
	state.camera.y = PLAYER_START.y;
	state.camera.angle = PLAYER_START.angle;
	state.darkness = 0;
	state.canMove = true;
	state.corridorProgress = 0;
	state.messageText = '';
	state.messageTimer = 0;
	state.mazeFogDensity = 0.06;
	state.stage3AtriumCycles = 0;

	placeAtriumFigures(state);

	// Usher stands at normal position
	state.sprites[0].textureId = 'usher';
	state.sprites[0].x = USHER_POS.x;
	state.sprites[0].y = USHER_POS.y;
	state.sprites[0].visible = true;
	state.sprites[0].scale = 1;

	// Hide other base sprites
	state.sprites[1].visible = false;
	state.sprites[2].visible = false;
}

/** Re-place vortex figures based on current cycle — they close in each time. */
function placeAtriumFigures(state: TheaterState): void {
	// Each cycle they close in: walls → narrow passage → 1-tile gap
	const leftCol = [2, 4, 6][Math.min(state.stage3AtriumCycles, 2)];
	const rightCol = [12, 10, 8][Math.min(state.stage3AtriumCycles, 2)];

	// Place sprites evenly along both columns (5 left, 5 right)
	for (let i = 0; i < PEOPLE_COUNT; i++) {
		const sprite = state.sprites[PEOPLE_SPRITE_START + i];
		sprite.textureId = 'vortex';
		sprite.visible = true;
		sprite.scale = 1;
		const onLeft = i < 5;
		sprite.x = (onLeft ? leftCol : rightCol) + 0.5;
		sprite.y = 9.5 + (i % 5) * 1.8;
	}

	// Block every floor cell from walls to (and including) the figure columns
	const blockers = new Set<string>();
	for (let y = 8; y <= 17; y++) {
		for (let x = 2; x <= leftCol; x++) {
			blockers.add(x + ',' + y);
		}

		for (let x = rightCol; x <= 12; x++) {
			blockers.add(x + ',' + y);
		}
	}

	state.blockers = blockers;
}

export function tickStage3Atrium(state: TheaterState, _dt: number): void {
	// Near usher → greeting
	const usher = state.sprites[0];
	const dx = state.camera.x - usher.x;
	const dy = state.camera.y - usher.y;
	const distToUsher = Math.sqrt(dx * dx + dy * dy);
	if (distToUsher < 2.5 && state.messageTimer <= 0) {
		state.messageText = '\u0421\u041F\u0410\u0421\u0418\u0411\u041E, \u041D\u0410\u0421\u041B\u0410\u0416\u0414\u0410\u0419\u0422\u0415\u0421\u042C \u041F\u0420\u041E\u0421\u041C\u041E\u0422\u0420\u041E\u041C';
		state.messageTimer = 3;
		state.triggerAudio = 'welcome';
	}

	// Corridor entry → darken, then reset
	state.darkness = isInCorridor(state.camera)
		? Math.min(1, state.darkness + 0.02)
		: Math.max(0, state.darkness - 0.05);

	if (state.darkness >= 1) {
		state.stage3AtriumCycles++;
		if (state.stage3AtriumCycles >= 3) {
			// After 3 cycles through the atrium, enter the corridor
			enterStage3Corridor(state);
			return;
		}

		// Reset to lobby entrance — figures close in
		state.camera.x = PLAYER_START.x;
		state.camera.y = PLAYER_START.y;
		state.camera.angle = PLAYER_START.angle;
		state.darkness = 0;
		placeAtriumFigures(state);
	}
}

/** Stage 3 corridor — long passage with side alcoves, patrolling face. */
function enterStage3Corridor(state: TheaterState): void {
	const corridor = generateStage3Corridor();
	state.map = corridor.map;
	state.stage3AlcoveYs = corridor.alcoveYs;
	state.stage3CorridorLength = corridor.length;
	state.phase = Phase.STAGE3_CORRIDOR;
	state.camera.x = corridor.start.x;
	state.camera.y = corridor.start.y;
	state.camera.angle = corridor.start.angle;
	state.darkness = 0.15;
	state.canMove = true;
	state.corridorProgress = 0;
	state.mazeFogDensity = 0.1;
	state.messageText = '';
	state.messageTimer = 0;
	state.footstepTimer = 0;
	state.blockers = undefined;
	state.toroidalWidth = corridor.map[0].length;

	// Face patrols continuously — start at far end, heading toward player
	state.stage3RushTimer = 0;
	state.stage3RushInterval = 0;
	state.stage3RushActive = true;
	state.stage3FaceY = 3;
	state.stage3FaceSpeed = 10 + Math.random() * 10;
	state.stage3DodgeCount = 0;

	// Hide all sprites
	for (const sprite of state.sprites) {
		sprite.visible = false;
	}

	// Face sprite — always visible, patrolling
	const cx = Math.floor(corridor.map[0].length / 2) + 0.5;
	state.sprites[1].textureId = 'scary_face';
	state.sprites[1].scale = 1.5;
	state.sprites[1].visible = true;
	state.sprites[1].x = cx;
	state.sprites[1].y = state.stage3FaceY;
}

export function tickStage3Corridor(state: TheaterState, dt: number): void {
	tickFootsteps(state, dt, 0.8);

	const face = state.sprites[1];
	const corridorCx = Math.floor(state.map[0].length / 2) + 0.5;
	const corridorEnd = state.stage3CorridorLength - 3;

	// Face patrols back and forth
	state.stage3FaceY += state.stage3FaceSpeed * dt;
	face.y = state.stage3FaceY;
	face.x = corridorCx;

	// Reverse at corridor ends, pick a new speed
	if (state.stage3FaceY >= corridorEnd) {
		state.stage3FaceY = corridorEnd;
		state.stage3FaceSpeed = -(10 + Math.random() * 10);
		state.stage3DodgeCount++;
	} else if (state.stage3FaceY <= 2) {
		state.stage3FaceY = 2;
		state.stage3FaceSpeed = 10 + Math.random() * 10;
		state.stage3DodgeCount++;
	}

	// Collision — player in the narrow corridor (not in alcove)?
	const playerInCenter = Math.abs(state.camera.x - corridorCx) < 0.8;
	const faceNearPlayer = Math.abs(face.y - state.camera.y) < 1.5;
	if (playerInCenter && faceNearPlayer) {
		enterStage3Trapped(state);
		return;
	}

	// Check if player reached the door end after enough patrol passes
	if (state.camera.y < 5) {
		enterStage3Exit(state);
	}
}

/** Caught by the rushing face — sealed in a tiny cube forever. */
function enterStage3Trapped(state: TheaterState): void {
	state.toroidalWidth = 0;
	const size = 3;
	const map: TileMap = [];
	for (let y = 0; y < size; y++) {
		const row: number[] = [];
		for (let x = 0; x < size; x++) {
			if (x === 0 || x === size - 1 || y === 0 || y === size - 1) {
				row.push(Tile.WALL_DARK);
			} else {
				row.push(Tile.FLOOR);
			}
		}

		map.push(row);
	}

	state.map = map;
	state.phase = Phase.STAGE3_TRAPPED;
	state.camera.x = 1.5;
	state.camera.y = 1.5;
	state.darkness = 0.3;
	state.canMove = true;
	state.mazeFogDensity = 0;
	state.messageText = '';
	state.messageTimer = 0;
	state.corridorProgress = 0;
	state.triggerAudio = 'scream';

	for (const sprite of state.sprites) {
		sprite.visible = false;
	}
}

export function tickStage3Trapped(state: TheaterState, dt: number): void {
	state.corridorProgress += dt;

	// Occasional message
	if (state.corridorProgress > 5 && state.corridorProgress < 6 && state.messageTimer <= 0) {
		state.messageText = '\u0417\u0410\u041F\u0415\u0420\u0422';
		state.messageTimer = 3;
	}

	// Footstep echo
	tickFootsteps(state, dt, 1.5);
}

/** Player reached the corridor exit — fade out, back to menu. */
function enterStage3Exit(state: TheaterState): void {
	state.toroidalWidth = 0;
	state.phase = Phase.STAGE3_EXIT;
	state.canMove = false;
	state.corridorProgress = 0;
	state.darkness = 0;
	state.messageText = '';
	state.messageTimer = 0;

	for (const sprite of state.sprites) {
		sprite.visible = false;
	}
}

export function tickStage3Exit(state: TheaterState, dt: number): void {
	state.corridorProgress += dt;
	state.darkness = Math.min(1, state.corridorProgress / 4);

	if (state.corridorProgress > 4) {
		state.gameOver = true;
	}
}
