// === Theater state — barrel re-export & tick dispatch ===

import {type TheaterState, Phase, updatePlayerMovement} from './game';
import {
	tickNormal,
	tickUsherGone,
	tickDarkWalk,
	tickVortexEncounter,
	tickGlitchScream,
	tickPostEncounter,
	tickUsherScared,
	tickUsherWarning,
	tickFinalWall,
	tickMaze,
	tickInfiniteCorridor,
	tickMazeExit,
	tickRooms,
} from './state0';
import {
	tickStage2Lobby,
	tickSnakeCorridor,
	tickStage2Dark,
	tickStage2Exit,
	tickSnakeVoid,
} from './state1';
import {
	tickStage3Atrium,
	tickStage3Corridor,
	tickStage3Trapped,
	tickStage3Exit,
} from './state2';
import {
	tickCatharsis,
} from './state3';

export {
	type TheaterState,
	Phase,
	createTheaterState,
	movePlayer,
	generateMarkovText,
	MAZE_POSTER_COUNT,
	PEOPLE_COUNT,
} from './game';

export {enterMaze, enterRooms} from './state0';
export {enterCatharsis} from './state3';

export function tickTheater(state: TheaterState, dt: number): void {
	state.triggerAudio = undefined;

	// Track player movement
	updatePlayerMovement(state);

	// Message timer
	if (state.messageTimer > 0) {
		state.messageTimer -= dt;
		if (state.messageTimer <= 0) {
			state.messageText = '';
		}
	}

	switch (state.phase) {
		case Phase.NORMAL: {
			tickNormal(state, dt);
			break;
		}

		case Phase.USHER_GONE: {
			tickUsherGone(state, dt);
			break;
		}

		case Phase.DARK_WALK: {
			tickDarkWalk(state, dt);
			break;
		}

		case Phase.VORTEX_ENCOUNTER: {
			tickVortexEncounter(state, dt);
			break;
		}

		case Phase.GLITCH_SCREAM: {
			tickGlitchScream(state, dt);
			break;
		}

		case Phase.POST_ENCOUNTER: {
			tickPostEncounter(state, dt);
			break;
		}

		case Phase.USHER_SCARED: {
			tickUsherScared(state, dt);
			break;
		}

		case Phase.USHER_WARNING: {
			tickUsherWarning(state, dt);
			break;
		}

		case Phase.FINAL_WALL: {
			tickFinalWall(state, dt);
			break;
		}

		case Phase.MAZE: {
			tickMaze(state, dt);
			break;
		}

		case Phase.INFINITE_CORRIDOR: {
			tickInfiniteCorridor(state, dt);
			break;
		}

		case Phase.MAZE_EXIT: {
			tickMazeExit(state, dt);
			break;
		}

		case Phase.ROOMS: {
			tickRooms(state, dt);
			break;
		}

		case Phase.STAGE2_LOBBY: {
			tickStage2Lobby(state, dt);
			break;
		}

		case Phase.STAGE2_CORRIDOR: {
			tickSnakeCorridor(state, dt);
			break;
		}

		case Phase.STAGE2_DARK: {
			tickStage2Dark(state, dt);
			break;
		}

		case Phase.STAGE2_EXIT: {
			tickStage2Exit(state, dt);
			break;
		}

		case Phase.SNAKE_VOID: {
			tickSnakeVoid(state, dt);
			break;
		}

		case Phase.STAGE3_ATRIUM: {
			tickStage3Atrium(state, dt);
			break;
		}

		case Phase.STAGE3_CORRIDOR: {
			tickStage3Corridor(state, dt);
			break;
		}

		case Phase.STAGE3_TRAPPED: {
			tickStage3Trapped(state, dt);
			break;
		}

		case Phase.STAGE3_EXIT: {
			tickStage3Exit(state, dt);
			break;
		}

		case Phase.CATHARSIS: {
			tickCatharsis(state, dt);
			break;
		}
	}
}
