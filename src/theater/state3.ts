// === Stage 4 — catharsis: bright theater, walk through door into white void ===

import {generateCatharsisMap} from '../engine/maps';
import {
	type TheaterState,
	Phase,
	tickFootsteps,
} from './game';

/** Enter catharsis — bright empty theater, door open, void beyond. */
export function enterCatharsis(state: TheaterState): void {
	applauseTriggered = false;
	const catharsis = generateCatharsisMap();
	state.map = catharsis.map;
	state.phase = Phase.CATHARSIS;
	state.camera.x = catharsis.start.x;
	state.camera.y = catharsis.start.y;
	state.camera.angle = catharsis.start.angle;
	state.canMove = true;
	state.darkness = 0;
	state.whiteness = 0;
	state.corridorProgress = 0;
	state.messageText = '';
	state.messageTimer = 0;
	state.footstepTimer = 0;
	state.mazeFogDensity = 0.02;
	state.blockers = undefined;
	state.catharsisStageY = catharsis.doorY;

	// Hide all sprites — no one here
	for (const sprite of state.sprites) {
		sprite.visible = false;
	}
}

let applauseTriggered = false;

export function tickCatharsis(state: TheaterState, dt: number): void {
	tickFootsteps(state, dt, 1.2);
	state.corridorProgress += dt;

	// Whiteness starts once player passes through the door (y < doorY)
	const doorY = state.catharsisStageY;
	if (state.camera.y < doorY) {
		// Progress: 0 at door, 1 at the far edge of the void
		const beyondDoor = doorY - state.camera.y;
		const progress = Math.min(1, beyondDoor / 20);
		state.whiteness = progress ** 1.2;

		// Trigger applause once on first step through
		if (!applauseTriggered && beyondDoor > 0.5) {
			applauseTriggered = true;
			state.triggerAudio = 'applause';
		}
	}

	// Fully white → crash
	if (state.whiteness > 0.98) {
		state.gameOver = true;
	}
}
