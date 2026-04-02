// === Theater game state — shared types, creation & helpers ===

import {
	Tile, type Camera, type Sprite, type TileMap,
} from '../engine/types';
import {
	createTheaterMap,
	PLAYER_START,
	USHER_POS,
	POSTER_POSITIONS,
	type PathSegment,
} from '../engine/maps';

// ── Lobby poster sprite positions ───────────────────────────────

/** Number of poster easel sprites placed in the maze. */
export const MAZE_POSTER_COUNT = 5;
export const MAZE_POSTER_SPRITE_START = 3; // First maze poster sprite index in sprites[]

/** Number of normal people sprites for stage 2. */
export const PEOPLE_COUNT = 10;
export const PEOPLE_SPRITE_START = 8; // First person sprite index (after 3 + 5 maze posters)

// ── Procedural text generator (dictionary-based) ───────────────

/** Simple seeded PRNG. */
function textRng(seed: number): () => number {
	let s = Math.trunc(seed) || 1;
	return () => {
		s ^= s << 13;
		s ^= s >> 17;
		s ^= s << 5;
		return ((s >>> 0) % 10_000) / 10_000;
	};
}

/**
 * Word bank extracted from russian.txt dictionary.
 * ~500 words, 4-7 chars, evenly sampled across the alphabet.
 */
const DICT = 'АВРОРА АККОРДЫ АЛЮМЕЛЬ АНТИХРИ АРБУЗИК АРФИСТ АТРИУМА БАЕТ БАЛЫЧКУ БАРМИЦЫ БАТУДЕ БЕГЛОЙ БЕКАСОВ БЕНУАРУ БЕЧЕВКЕ БИРОЧКУ БЛЕСН БЛЮЕТЕ БОДРЫМИ БОЛТАМ БОРОВУЮ БОЯРЫНЬ БРЕЕМСЯ БРОКЕР БРЮШНАЯ БУЙВОЛЫ БУРАКОВ БУСИНЕ БЫВШЕМ БЯЗЕВУЮ ВАЛЬЩИК ВАТА ВВЕДШЕЙ ВДВИНУ ВЕДРОМ ВЕЛЮРУ ВЕРСИЙ ВЕСЁЛОЕ ВЕЩУНУ ВЗВОЛОК ВЗНЕСЛИ ВИДЕХ ВИНИШКЕ ВИХЛЯЛ ВЛАСТ ВМЕНИТЬ ВНУТРИ ВОЕВОДЕ ВОИТЕ ВОЛЬЁМ ВОРОША ВОЩЕНОЮ ВПЛЕТЕТ ВРЕДИТЕ ВСЕЛЯЕТ ВСТРЯНУ ВТУЛКОЙ ВЪЕЗЖЕЙ ВЫВШЕГО ВЫДУМКУ ВЫИЩУ ВЫЛОВИВ ВЫПАДОВ ВЫРВИ ВЫСОХЛО ВЫХОДКУ ВЬЮШКЕ ВЁСНАМ ГАЗОВИК ГАМОМ ГВАЮЛА ГЕРЦЫ ГИРОБУС ГЛОДАЛИ ГНЕВНОЕ ГОВЕЮ ГОРЕВШЕ ГОРЯЧИЙ ГРАФИКА ГРЕЮЩУЮ ГРОШАХ ГРЯДУЩ ГУЛЬБЫ ДАМСКИХ ДВЕРЦАХ ДЕЛИМОЙ ДЕРЖАЛИ ДЕЦИМАХ ДИВНЫЙ ДИПОЛИ ДОБРЕТЬ ДОЕВШЕЕ ДОКАТИМ ДОЛОЖИТ ДОНОСАМ ДОРОЖКУ ДОУЧИЛ ДРАЗНЯТ ДРОВНЕЙ ДРЯХЛОЙ ДУМКАМИ ДУХАНОМ ДЫНЬКАМ ДЁГТЯМИ ЕЖИВШИЕ ЖЕЛОБУ ЖЕСТКОЙ ЖМУРЬТЕ ЖУПЕЛОМ ЗАБЕРУТ ЗАВЕСКУ ЗАГАЛДИ ЗАДЕТОЙ ЗАЖАТЫМ ЗАКАЖУ ЗАКУЮ ЗАМАЯТЬ ЗАМЯТОЕ ЗАПАШУТ ЗАПУЛЕН ЗАСВЕТ ЗАСТУПИ ЗАТОРЫ ЗАЦЕП ЗАЩИПАВ ЗВУКУ ЗЕНИТ ЗЛОБНЫЙ ЗНАЮЩУЮ ИЕРЕЯ ИЗГИБАЯ ИЗМЕНИ ИЗРЕЧЁМ ИКОНКОЮ ИМЯРЕК ИСКУШУ ИСТОТА ИЩУЩАЯ КАДЫКИ КАМЕННЫ КАПАЛА КАРКАЙ КАТАЮСЬ КЕКСОМ КИВНЁТЕ КИСАМ КЛАДУ КЛЕШНЯХ КЛОЧКОВ КЛЁКЛЫЙ КОВАРУ КОЗЛИТЬ КОЛЕЧКИ КОЛЯД КОННОЕ КОПИЯХ КОРМУ КОРЯЧКА КОТОН КРАДЁТЕ КРЕМЛЁМ КРУГЕ КРЮКИ КУЗНЕЦА КУНЬЕГО КУРИЧИЙ КУТЕЖАМ ЛАЙБАМ ЛАПШОЙ ЛГАНЬЕМ ЛЕНИВЦЫ ЛЕСТЬЮ ЛИВНЕМ ЛИСИНИМ ЛИЧИКОВ ЛОГИНЕ ЛОМТИКА ЛОЦИЕЙ ЛУКИЧ ЛЫЖНЫМИ ЛЮБОВАЛ МАЕВКОЙ МАКНУВ МАНАТЬЯ МАРКАМИ МАТОЧК МЕАНДРЕ МЕЛИЗМЫ МЕРЗЛЯК МЕТЕШЬ МЕШАЛКЕ МИЛОЧКИ МИРНОГО МЛЕЧНОЮ МОЖЕШЬ МОЛОТЯТ МОРЕНЫЙ МОТАНИЯ МОЩЁНЫХ МУЛЬДЕ МУХЛЮЯ МЫЛЯЩИМ МЯКНУЛ НАБИТЫМ НАВРОДЕ НАДДУВУ НАЕДЕМ НАЙДЁШЬ НАЛЕТАЮ НАМЫВАЯ НАПИШЕ НАРОДЯТ НАСТЕЛЮ НАТЁРЛО НАШАЛИМ НЕВСКИХ НЕНАВИЖ НЕСТОЕК НЕЯСНОМ НИСКОЛЬ НОЖИЩАХ НЁСШУЮ ОБДЕЛЯЙ ОБЖИТЫ ОБЛАТКУ ОБМЕЛЮТ ОБРАДУЮ ОБСКУРУ ОБХАЯЛ ОБЁРТКЕ ОГЛОДКУ ОДЕВАТЬ ОДЁЖА ОКИСЯМ ОКРУТИМ ОЛИВКИ ОПОЯСАВ ОПЁНКОВ ОРОШЕН ОСЕКШЕЮ ОСЛЁНОК ОСТИТОМ ОТБАВКИ ОТВОДЕ ОТЕКИ ОТКОВКЕ ОТЛУЧКИ ОТОЖМУТ ОТПОЁТ ОТСАЖУ ОТТОЧИВ ОТЪЕМЕ ОХВАТАМ ОЧЕРТИ ОЩУПАЮ ПАЛЁНЫЕ ПАПУШЕ ПАРФОРС ПАУЗАМИ ПАЯНИЕМ ПЕЛИТЕ ПЕРЕДАЧ ПЕРСОНА ПЕТУШОК ПИНАЛА ПИСЦА ПЛАВКИХ ПЛЕБЕЯХ ПЛЫВЁТ ПОБЕЛЕЙ ПОВИННО ПОДДАЁТ ПОДМЁРЗ ПОДСУНУ ПОЖАЛУ ПОЗОРА ПОКОВКИ ПОЛЕЧИЛ ПОЛОНИЯ ПОМАЗКА ПОМУДРИ ПООСТЫЛ ПОРТНИХ ПОСЛАЛИ ПОТАКАЯ ПОТЫЧЕТ ПОЧТЕНЫ ПОЯСНЯЮ ПРЕЖНИЕ ПРИВЕСА ПРИЗЫВЕ ПРИПЕВЫ ПРИШЛЕЦ ПРОДАЖ ПРОЛАЕТ ПРОРУБЬ ПРОЧИЙ ПРЫЩИ ПУТНЫЙ ПЫШЕН ПЯТНИЦА РАДИЮ РАЗДУТА РАЗРЕШ РАНГАМ РАСПОЕТ РАУНД РЕБЕНКА РЕЗАЛИ РЕШАЕМА РИМСКИЙ РОВНЯМИ РОПАК РУБАНКА РУЛЕВОЙ РУТИЛЕ РЫГАТЬ РЫЧАЖКУ РЯЗАНИ САНДАЛЯ САШЕЧКА СБРУЯ СВЕЖО СВИВШЕМ СВОРНОЕ СГОННЫМ СДЕРУ СЕМЕРКУ СЕРЖУСЬ СЕЯННЫХ СИГАРЕ СИМКАМ СИРОПОМ СКАНОГО СКИТАЛИ СКОРБИМ СКРЫТНА СЛАВИМ СЛЕПИТЬ СЛОВИЛО СЛУЧАЕН СМАЙЛЯ СМЕТАМИ СМОЛКАЮ СМЫСЛЫ СНИКШЕЙ СОБОЛЁК СОЕДИНИ СОЛИДНЫ СОННИКЕ СОСЕДА СОФАХ СПАДОВ СПЕТЫМ СПЛЕСТИ СПРЫСК СРЕЖЬ ССУДЫ СТАРИНА СТЕКЛЫ СТИРАНО СТОПАМИ СТРИЖЕТ СТУЛА СТЁРШАЯ СУРЖИК СУШЕНО СЦЕНКА СЪЕЖЕНЫ СЫРЬЕЕ ТАБУНЫ ТАЛИЙ ТАРХАНА ТВОИ ТЕЛЁНКА ТЕРЕМОМ ТЕСОВОЮ ТИГРОМ ТИТРУЮ ТОГАХ ТОМЛЁНА ТОПОРУ ТОСКУЮТ ТРЕТЬЯК ТРОННОМ ТРУТЕНЬ ТУЖИЛИ ТУРЕНКУ ТУШЕНЫХ ТЯГУЧУЮ ТЁТКАХ УБОРНЫЕ УВЕЧИЙ УГАДАНЫ УГРЕЙ УДЕРЖАН УЕЗДНОМ УКИПЕЛИ УКУТАНЫ УЛУЧЕНО УМИЛИЛ УНЫВНЫЙ УПОВАЮТ УРЁМНОМ УСЛЫХАВ УТЕШАЛА УТОПШЕЮ УХАВШИЙ УЧЕНОМ УШИБЁТ ФАРТ ФИЗРУК ФОНАРЁМ ФРАКИИ ФУКСИИ ХАЛТУРА ХАХАЛЕМ ХИЛОГО ХЛЕБНЫМ ХМУРЫХ ХОЛОДКИ ХОХЛАМИ ХРУПАЛ ХУТОРА ЦЕДИ ЦЕНУР ЧАДИТЬ ЧАСТНУЮ ЧЕПУХУ ЧЕСАНАЯ ЧИТКОЮ ЧУБАТОМ ЧУМАЗ ЧЁТКОЙ ШАЛЯЩУЮ ШАТИЕЮ ШИПЯЩЕЙ ШКУРА ШЛЁНДА ШПАЛАМИ ШТАНАМ ШУБАМИ ЩЕЛЧКАМ ЩИТОК ЭДАКИЕ ЭМФАЗОЙ ЭФИРАМИ ЮНОМУ ЯВЛЕНО ЯЗЫЧНИК ЯМЩИНА ЯССКУЮ ЁКАЛО'.split(' ');

/** Theater-specific fragments for sentence starters/structure. */
const AFISHA = [
	'ПРЕМЬЕРА',
	'СПЕКТАКЛЬ',
	'ВНИМАНИЕ',
	'СЕГОДНЯ',
	'ПРИГЛАШАЕМ',
	'ВХОД',
	'НАЧАЛО',
	'БИЛЕТЫ',
	'ЗАНАВЕС',
	'АНТРАКТ',
	'ПАРТЕР',
	'ЛОЖА',
	'СЦЕНА',
	'ЗРИТЕЛЬ',
	'КРЕСЛО',
	'ТИШИНА',
	'АПЛОДИСМЕНТЫ',
	'ВЫХОД',
	'СВЕТ',
	'ТЕМНОТА',
];

/** Connectors/prepositions sprinkled in for uncanny grammar. */
const CONNECT = [
	'НЕ',
	'БЕЗ',
	'ДЛЯ',
	'ВАШ',
	'ИЗ',
	'ПОД',
	'НАД',
	'ВО',
	'НА',
	'ОТ',
	'ПРИ',
	'ПО',
	'ЗА',
	'ДО',
];

/**
 * Procedural uncanny valley афиша text from dictionary.
 * Picks a template pattern and fills it with real Russian words,
 * creating phrases that almost make sense but are deeply off.
 */
export function generateMarkovText(seed: number): string {
	const rng = textRng(seed);
	const pick = (array: string[]) => array[Math.floor(rng() * array.length)];
	const d = () => pick(DICT);
	const a = () => pick(AFISHA);
	const c = () => pick(CONNECT);
	const pattern = Math.floor(rng() * 14);

	switch (pattern) {
		case 0: {
			return a() + ' ' + d();
		}

		case 1: {
			return d() + ' ' + c() + ' ' + d();
		}

		case 2: {
			return a() + ': ' + d() + ' ' + d();
		}

		case 3: {
			return d() + '. ' + d() + '.';
		}

		case 4: {
			return 'НЕ ' + d() + ' ' + d();
		}

		case 5: {
			return d() + ' ' + d() + ' ' + d();
		}

		case 6: {
			return a() + ' \u2014 ' + d();
		}

		case 7: {
			return c() + ' ' + d() + '. ' + a() + '.';
		}

		case 8: {
			// Numbered announcement
			const n = Math.floor(rng() * 99) + 1;
			return a() + ' №' + n + ' ' + d();
		}

		case 9: {
			// Time format
			const h = Math.floor(rng() * 24);
			const m = Math.floor(rng() * 6) * 10;
			const hh = String(h).padStart(2, '0');
			const mm = String(m).padStart(2, '0');
			return a() + ' ' + hh + ':' + mm + ' ' + d();
		}

		case 10: {
			// ALL CAPS imperative
			return d() + '! ' + a() + ' ' + c() + ' ' + d();
		}

		case 11: {
			// Question form
			return c() + ' ' + d() + '? ' + a();
		}

		case 12: {
			// Double dash
			return d() + ' \u2014 ' + d() + ' \u2014 ' + a();
		}

		default: {
			// Parenthetical
			return a() + ' (' + d() + ') ' + d();
		}
	}
}

// ── Game phases ─────────────────────────────────────────────────

export const enum Phase {
	/** Normal lobby → corridor loop. */
	NORMAL = 0,
	/** Usher has disappeared, corridor is ominous. */
	USHER_GONE = 1,
	/** Walking in darkness, footsteps, can't see. */
	DARK_WALK = 2,
	/** Blocked — Vortex-Headed Man encounter. */
	VORTEX_ENCOUNTER = 3,
	/** Scream + glitch sequence. */
	GLITCH_SCREAM = 4,
	/** Post-encounter — occasional vortex flashes. */
	POST_ENCOUNTER = 5,
	/** Usher runs around scared, posters replaced. */
	USHER_SCARED = 6,
	/** Usher delivers warning message. */
	USHER_WARNING = 7,
	/** Brick wall appears, player turns around → passage opens. */
	FINAL_WALL = 8,
	/** Player entered the maze. */
	MAZE = 9,
	/** Caught by bileter — infinite corridor illusion. */
	INFINITE_CORRIDOR = 10,
	/** Player found exit — back to title. */
	MAZE_EXIT = 11,
	/** Infinite rooms mode (загрузка). */
	ROOMS = 12,
	/** Stage 2 — bright lobby with people and velvet ropes. */
	STAGE2_LOBBY = 13,
	/** Stage 2 — walking through side corridor. */
	STAGE2_CORRIDOR = 14,
	/** Stage 2 — dark hall, vortex entities emerge. */
	STAGE2_DARK = 15,
	/** Stage 2 — fade to black, back to menu. */
	STAGE2_EXIT = 16,
	/** Snake corridor — fell into the void, permanent. */
	SNAKE_VOID = 17,
	/** Stage 3 — atrium filled with vortex-headed standing figures. */
	STAGE3_ATRIUM = 18,
	/** Stage 3 — long corridor, dodge the rushing face. */
	STAGE3_CORRIDOR = 19,
	/** Stage 3 — caught by the face, trapped in cube forever. */
	STAGE3_TRAPPED = 20,
	/** Stage 3 — reached the end, catharsis. */
	STAGE3_EXIT = 21,
	/** Stage 4 — catharsis: walk through bright theater to the stage. */
	CATHARSIS = 22,
}

// ── Theater state ───────────────────────────────────────────────

export type TheaterState = {
	phase: Phase;
	cycleCount: number;
	map: TileMap;
	camera: Camera;
	sprites: Sprite[];
	// Phase triggers
	usherGoneCycle: number; // Cycle# at which usher disappears
	darkness: number; // 0..1 screen darkness
	corridorProgress: number; // How far into corridor (for dark walk)
	glitchTimer: number; // Seconds remaining for glitch sequence
	screamPlaying: boolean;
	vortexFlashTimer: number; // Countdown to brief flash
	vortexFlashActive: boolean;
	usherRunDir: number; // -1 or 1 for scared usher running
	usherRunTimer: number;
	warningShown: boolean;
	messageText: string;
	messageTimer: number; // Seconds to show message
	footstepTimer: number;
	canMove: boolean;
	gameOver: boolean;
	usherBehindTimer: number;
	// Maze state
	mazeExitX: number;
	mazeExitY: number;
	bileterSpeed: number;
	finalWallTimer: number;
	finalWallPassageOpened: boolean;
	entityDirection: number; // Wander angle for maze entity
	entityTurnTimer: number; // Time until entity picks new direction
	entityTargetX: number; // Last known player position
	entityTargetY: number;
	entityHuntTimer: number; // Countdown to refresh player target
	entitySeesPlayer: boolean; // LOS direct chase mode
	entityPath: Array<{x: number; y: number}>; // BFS computed path
	entityPathIndex: number; // Current waypoint in path
	mazeFogDensity: number; // Higher fog density for dark maze
	// Wall poster texts (for POSTER_POSITIONS proximity)
	wallTexts: string[]; // Pre-generated Markov text per wall poster
	// Maze poster seeds (for sprite texture generation)
	mazePosterSeeds: number[]; // Seeds for maze poster textures

	// Audio triggers — consumed by the screen component
	triggerAudio: string | undefined;

	// Stage tracking (1 = first playthrough, 2 = second, etc.)
	stage: number;
	// Stage 2 state
	stage2EnteredSide: 'left' | 'right' | '';
	stage2DarkTimer: number;
	// Snake corridor puzzle
	snakePathTiles: Set<string>;
	snakePathSegments: PathSegment[];
	snakeExitY: number;
	snakeVoidTimer: number;
	// Stage 3 corridor state
	stage3AlcoveYs: number[];
	stage3CorridorLength: number;
	stage3RushTimer: number;
	stage3RushInterval: number;
	stage3RushActive: boolean;
	stage3FaceY: number;
	stage3FaceSpeed: number;
	stage3DodgeCount: number;
	stage3AtriumCycles: number;
	// Blocker cells — act as walls for collision ("x,y" keys)
	blockers: Set<string> | undefined;
	// White fade for catharsis ending (0..1)
	whiteness: number;
	// Catharsis stage Y coordinate (where stage area is)
	catharsisStageY: number;
	// Toroidal X wrapping width (0 = off)
	toroidalWidth: number;
	// Snake corridor screamer state
	snakeScareTimer: number;
	snakeSpinTimer: number;
	snakeSpinDir: number;
};

// ── State creation ──────────────────────────────────────────────

/** How many cycles before usher disappears (randomized). */
export function rollUsherGoneCycle(): number {
	return 3 + Math.floor(Math.random() * 8);
}

/** Generate random wall poster texts for the 6 poster wall tiles. */
export function rollWallTexts(): string[] {
	return POSTER_POSITIONS.map((_, i) =>
		generateMarkovText(Math.floor(Math.random() * 90_000) + 10_000 + i));
}

/** Create initial game state. */
export function createTheaterState(stage = 1): TheaterState {
	const map = createTheaterMap();

	return {
		phase: Phase.NORMAL,
		cycleCount: 0,
		map,
		camera: {
			x: PLAYER_START.x,
			y: PLAYER_START.y,
			angle: PLAYER_START.angle,
			pitch: 0,
		},
		sprites: [
			// Usher
			{
				x: USHER_POS.x,
				y: USHER_POS.y,
				textureId: 'usher',
				visible: true,
				scale: 1,
			},
			// Vortex man (hidden initially)
			{
				x: USHER_POS.x,
				y: 4.5,
				textureId: 'vortex',
				visible: false,
				scale: 1.1,
			},
			// Scared usher (hidden initially)
			{
				x: USHER_POS.x,
				y: 10.5,
				textureId: 'usher_scared',
				visible: false,
				scale: 1,
			},
			// Maze poster easel sprites (indices 3..7, hidden until maze)
			...Array.from({length: MAZE_POSTER_COUNT}, () => ({
				x: 0,
				y: 0,
				textureId: 'empty_easel',
				visible: false,
				scale: 0.7,
			})),
			// People sprites for stage 2 (indices 8..17, hidden until stage 2)
			...Array.from({length: PEOPLE_COUNT}, (_, i) => ({
				x: 0,
				y: 0,
				textureId: `person_${i}`,
				visible: false,
				scale: 0.9,
			})),
		],
		usherGoneCycle: rollUsherGoneCycle(),
		darkness: 0,
		corridorProgress: 0,
		glitchTimer: 0,
		screamPlaying: false,
		vortexFlashTimer: 0,
		vortexFlashActive: false,
		usherRunDir: 1,
		usherRunTimer: 0,
		warningShown: false,
		messageText: '',
		messageTimer: 0,
		footstepTimer: 0,
		canMove: true,
		gameOver: false,
		usherBehindTimer: 8 + Math.random() * 12,
		mazeExitX: 0,
		mazeExitY: 0,
		bileterSpeed: 0.8,
		finalWallTimer: 0,
		finalWallPassageOpened: false,
		entityDirection: 0,
		entityTurnTimer: 3,
		entityTargetX: 0,
		entityTargetY: 0,
		entityHuntTimer: 0,
		entitySeesPlayer: false,
		entityPath: [],
		entityPathIndex: 0,
		mazeFogDensity: 0,
		wallTexts: rollWallTexts(),
		mazePosterSeeds: [],

		triggerAudio: undefined,

		stage,
		stage2EnteredSide: '',
		stage2DarkTimer: 0,
		snakePathTiles: new Set(),
		snakePathSegments: [],
		snakeExitY: 0,
		snakeVoidTimer: 0,
		stage3AlcoveYs: [],
		stage3CorridorLength: 0,
		stage3RushTimer: 0,
		stage3RushInterval: 8,
		stage3RushActive: false,
		stage3FaceY: 0,
		stage3FaceSpeed: 8,
		stage3DodgeCount: 0,
		stage3AtriumCycles: 0,
		blockers: undefined,
		whiteness: 0,
		catharsisStageY: 0,
		toroidalWidth: 0,
		snakeScareTimer: 5 + Math.random() * 8,
		snakeSpinTimer: 0,
		snakeSpinDir: 0,
	};
}

// ── Player movement with collision ──────────────────────────────

const MOVE_SPEED = 2.5;
const ROT_SPEED = 2;
const COLLISION_MARGIN = 0.25;

export function movePlayer(
	state: TheaterState,
	forward: number,
	strafe: number,
	rotate: number,
	dt: number,
): void {
	if (!state.canMove) {
		return;
	}

	state.camera.angle += rotate * ROT_SPEED * dt;

	const speed = MOVE_SPEED * dt;
	const dx = (Math.cos(state.camera.angle) * forward + Math.cos(state.camera.angle + Math.PI / 2) * strafe) * speed;
	const dy = (Math.sin(state.camera.angle) * forward + Math.sin(state.camera.angle + Math.PI / 2) * strafe) * speed;

	const newX = state.camera.x + dx;
	const newY = state.camera.y + dy;

	// Collision detection
	if (!isWall(state.map, newX, state.camera.y, COLLISION_MARGIN, state.blockers, state.toroidalWidth)) {
		state.camera.x = newX;
	}

	if (!isWall(state.map, state.camera.x, newY, COLLISION_MARGIN, state.blockers, state.toroidalWidth)) {
		state.camera.y = newY;
	}

	// Toroidal X wrap
	if (state.toroidalWidth > 0) {
		const w = state.toroidalWidth;
		state.camera.x = ((state.camera.x % w) + w) % w;
	}
}

export function isWall(map: TileMap, x: number, y: number, margin: number, blockers?: Set<string>, toroidalW = 0): boolean {
	const checks = [
		[x - margin, y - margin],
		[x + margin, y - margin],
		[x - margin, y + margin],
		[x + margin, y + margin],
	];
	for (const [cx, cy] of checks) {
		let mx = Math.floor(cx);
		const my = Math.floor(cy);
		if (my < 0 || my >= map.length) {
			return true;
		}

		const mw = map[0].length;
		// Toroidal wrap on X if width > 0
		if (toroidalW > 0) {
			mx = ((mx % mw) + mw) % mw;
		} else if (mx < 0 || mx >= mw) {
			return true;
		}

		if (map[my][mx] > 0) {
			return true;
		}

		if (blockers?.has(mx + ',' + my)) {
			return true;
		}
	}

	return false;
}

// ── Cycle detection — player entered corridor and came back ─────

/** Check if player is deep enough in the corridor to trigger darkness. */
export function isInCorridor(camera: Camera): boolean {
	return camera.y < 8;
}

/** Check if player is back in the lobby. */
export function isInLobby(camera: Camera): boolean {
	return camera.y > 10;
}

// ── Lobby proximity checks (walls + rear door) ─────────────────

export function checkLobbyProximity(state: TheaterState): void {
	if (state.messageTimer > 0) {
		return; // Already showing a message
	}

	// Rear door proximity — "СКОРО СПЕКТАКЛЬ"
	if (state.camera.y > 15.5 && state.camera.x >= 5.5 && state.camera.x <= 9.5) {
		state.messageText = '\u0421\u041A\u041E\u0420\u041E \u0421\u041F\u0415\u041A\u0422\u0410\u041A\u041B\u042C';
		state.messageTimer = 2.5;
		return;
	}

	// Wall poster proximity — show uncanny Markov text
	for (const [i, pos] of POSTER_POSITIONS.entries()) {
		const dx = state.camera.x - (pos.x + 0.5);
		const dy = state.camera.y - (pos.y + 0.5);
		if (dx * dx + dy * dy < 6) { // Within ~2.4 tiles
			const text = state.wallTexts[i];
			if (text) {
				state.messageText = text;
				state.messageTimer = 2.5;
				return;
			}
		}
	}
}

// ── Player movement tracking ────────────────────────────────────

let previousCamX = 0;
let previousCamY = 0;
let playerMoving = false;

/** Update movement tracking — call at tick start. */
export function updatePlayerMovement(state: TheaterState): void {
	playerMoving = Math.abs(state.camera.x - previousCamX) > 0.001
		|| Math.abs(state.camera.y - previousCamY) > 0.001;
	previousCamX = state.camera.x;
	previousCamY = state.camera.y;
}

/** Tick footstep sounds only when the player is actually moving. */
export function tickFootsteps(state: TheaterState, dt: number, interval: number): void {
	if (!playerMoving) {
		return;
	}

	state.footstepTimer -= dt;
	if (state.footstepTimer <= 0) {
		state.triggerAudio = 'footstep';
		state.footstepTimer = interval;
	}
}

// ── Helpers ─────────────────────────────────────────────────────

export function resetToLobby(state: TheaterState): void {
	state.camera.x = PLAYER_START.x;
	state.camera.y = PLAYER_START.y;
	state.camera.angle = PLAYER_START.angle;
	state.darkness = 0;
	state.canMove = true;
	state.corridorProgress = 0;

	// Re-roll wall poster texts so each cycle feels different
	state.wallTexts = rollWallTexts();
}

export function replacePostersWithVortex(state: TheaterState): void {
	for (const pos of POSTER_POSITIONS) {
		if (Math.random() < 0.5) {
			state.map[pos.y][pos.x] = Tile.WALL_VORTEX_POSTER;
		}
	}
}

/**
 * Periodically teleport the usher behind the player.
 * Creates a "turn-around" scare — player might see usher standing there.
 */
export function tickUsherBehind(state: TheaterState, dt: number): void {
	const usher = state.sprites[0];

	state.usherBehindTimer -= dt;

	// Usher briefly visible: after 2s, hide again and reset timer
	if (usher.visible && state.usherBehindTimer < -2) {
		usher.visible = false;
		state.usherBehindTimer = 10 + Math.random() * 15;
		return;
	}

	// Time to spawn usher behind player
	if (state.usherBehindTimer <= 0 && !usher.visible) {
		// Position 2 tiles behind the player
		const behindX = state.camera.x - Math.cos(state.camera.angle) * 2;
		const behindY = state.camera.y - Math.sin(state.camera.angle) * 2;

		// Only place if the position is walkable floor
		const mx = Math.floor(behindX);
		const my = Math.floor(behindY);
		if (
			my >= 0 && my < state.map.length
			&& mx >= 0 && mx < state.map[0].length
			&& state.map[my][mx] === 0
		) {
			usher.x = behindX;
			usher.y = behindY;
			usher.visible = true;
		}
	}
}

export function placeBrickWall(state: TheaterState): void {
	// Block the corridor entrance with brick
	for (let x = 2; x < 13; x++) {
		if (state.map[8][x] === 0) {
			state.map[8][x] = Tile.WALL_BRICK;
		}
	}
}

/** Garble text with random unicode artifacts. */
export function garbleText(text: string): string {
	const glitchChars = 'Ẑ̷̧̦̀a̵̗̓l̶̰̈g̸͚̈o̷̜̔█▓░▒▌▐╫╪╬';
	let result = '';
	for (const ch of text) {
		result += Math.random() < 0.3 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : ch;
	}

	return result;
}
