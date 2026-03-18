// === Theater game state & cycle logic ===
// Manages the creepypasta game progression: cycles, events, horror triggers.

import {
	Tile, type Camera, type Sprite, type TileMap,
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
	POSTER_POSITIONS,
} from '../engine/maps';

// ── Lobby poster sprite positions ───────────────────────────────

/** Number of poster easel sprites placed in the maze. */
export const MAZE_POSTER_COUNT = 5;
const MAZE_POSTER_SPRITE_START = 3; // First maze poster sprite index in sprites[]

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
const DICT = 'АВРОРА АККОРДЫ АЛЮМЕЛЬ АНТИХРИ АРБУЗИК АРФИСТ АТРИУМА БАЕТ БАЛЫЧКУ БАРМИЦЫ БАТУДЕ БЕГЛОЙ БЕКАСОВ БЕНУАРУ БЕЧЕВКЕ БИРОЧКУ БЛЕСН БЛЮЕТЕ БОДРЫМИ БОЛТАМ БОРОВУЮ БОЯРЫНЬ БРЕЕМСЯ БРОКЕР БРЮШНАЯ БУЙВОЛЫ БУРАКОВ БУСИНЕ БЫВШЕМ БЯЗЕВУЮ ВАЛЬЩИК ВАТА ВВЕДШЕЙ ВДВИНУ ВЕДРОМ ВЕЛЮРУ ВЕРСИЙ ВЕСЁЛОЕ ВЕЩУНУ ВЗВОЛОК ВЗНЕСЛИ ВИДЕХ ВИНИШКЕ ВИХЛЯЛ ВЛАСТ ВМЕНИТЬ ВНУТРИ ВОЕВОДЕ ВОИТЕ ВОЛЬЁМ ВОРОША ВОЩЕНОЮ ВПЛЕТЕТ ВРЕДИТЕ ВСЕЛЯЕТ ВСТРЯНУ ВТУЛКОЙ ВЪЕЗЖЕЙ ВЫВШЕГО ВЫДУМКУ ВЫИЩУ ВЫЛОВИВ ВЫПАДОВ ВЫРВИ ВЫСОХЛО ВЫХОДКУ ВЬЮШКЕ ВЁСНАМ ГАЗОВИК ГАМОМ ГВАЮЛА ГЕРЦЫ ГИРОБУС ГЛОДАЛИ ГНЕВНОЕ ГОВЕЮ ГОРЕВШЕ ГОРЯЧИЙ ГРАФИКА ГРЕЮЩУЮ ГРОШАХ ГРЯДУЩ ГУЛЬБЫ ДАМСКИХ ДВЕРЦАХ ДЕЛИМОЙ ДЕРЖАЛИ ДЕЦИМАХ ДИВНЫЙ ДИПОЛИ ДОБРЕТЬ ДОЕВШЕЕ ДОКАТИМ ДОЛОЖИТ ДОНОСАМ ДОРОЖКУ ДОУЧИЛ ДРАЗНЯТ ДРОВНЕЙ ДРЯХЛОЙ ДУМКАМИ ДУХАНОМ ДЫНЬКАМ ДЁГТЯМИ ЕЖИВШИЕ ЖЕЛОБУ ЖЕСТКОЙ ЖМУРЬТЕ ЖУПЕЛОМ ЗАБЕРУТ ЗАВЕСКУ ЗАГАЛДИ ЗАДЕТОЙ ЗАЖАТЫМ ЗАКАЖУ ЗАКУЮ ЗАМАЯТЬ ЗАМЯТОЕ ЗАПАШУТ ЗАПУЛЕН ЗАСВЕТ ЗАСТУПИ ЗАТОРЫ ЗАЦЕП ЗАЩИПАВ ЗВУКУ ЗЕНИТ ЗЛОБНЫЙ ЗНАЮЩУЮ ИЕРЕЯ ИЗГИБАЯ ИЗМЕНИ ИЗРЕЧЁМ ИКОНКОЮ ИМЯРЕК ИСКУШУ ИСТОТА ИЩУЩАЯ КАДЫКИ КАМЕННЫ КАПАЛА КАРКАЙ КАТАЮСЬ КЕКСОМ КИВНЁТЕ КИСАМ КЛАДУ КЛЕШНЯХ КЛОЧКОВ КЛЁКЛЫЙ КОВАРУ КОЗЛИТЬ КОЛЕЧКИ КОЛЯД КОННОЕ КОПИЯХ КОРМУ КОРЯЧКА КОТОН КРАДЁТЕ КРЕМЛЁМ КРУГЕ КРЮКИ КУЗНЕЦА КУНЬЕГО КУРИЧИЙ КУТЕЖАМ ЛАЙБАМ ЛАПШОЙ ЛГАНЬЕМ ЛЕНИВЦЫ ЛЕСТЬЮ ЛИВНЕМ ЛИСИНЫМ ЛИЧИКОВ ЛОГИНЕ ЛОМТИКА ЛОЦИЕЙ ЛУКИЧ ЛЫЖНЫМИ ЛЮБОВАЛ МАЕВКОЙ МАКНУВ МАНАТЬЯ МАРКАМИ МАТОЧК МЕАНДРЕ МЕЛИЗМЫ МЕРЗЛЯК МЕТЕШЬ МЕШАЛКЕ МИЛОЧКИ МИРНОГО МЛЕЧНОЮ МОЖЕШЬ МОЛОТЯТ МОРЕНЫЙ МОТАНИЯ МОЩЁНЫХ МУЛЬДЕ МУХЛЮЯ МЫЛЯЩИМ МЯКНУЛ НАБИТЫМ НАВРОДЕ НАДДУВУ НАЕДЕМ НАЙДЁШЬ НАЛЕТАЮ НАМЫВАЯ НАПИШЕ НАРОДЯТ НАСТЕЛЮ НАТЁРЛО НАШАЛИМ НЕВСКИХ НЕНАВИЖ НЕСТОЕК НЕЯСНОМ НИСКОЛЬ НОЖИЩАХ НЁСШУЮ ОБДЕЛЯЙ ОБЖИТЫ ОБЛАТКУ ОБМЕЛЮТ ОБРАДУЮ ОБСКУРУ ОБХАЯЛ ОБЁРТКЕ ОГЛОДКУ ОДЕВАТЬ ОДЁЖА ОКИСЯМ ОКРУТИМ ОЛИВКИ ОПОЯСАВ ОПЁНКОВ ОРОШЕН ОСЕКШЕЮ ОСЛЁНОК ОСТИТОМ ОТБАВКИ ОТВОДЕ ОТЕКИ ОТКОВКЕ ОТЛУЧКИ ОТОЖМУТ ОТПОЁТ ОТСАЖУ ОТТОЧИВ ОТЪЕМЕ ОХВАТАМ ОЧЕРТИ ОЩУПАЮ ПАЛЁНЫЕ ПАПУШЕ ПАРФОРС ПАУЗАМИ ПАЯНИЕМ ПЕЛИТЕ ПЕРЕДАЧ ПЕРСОНА ПЕТУШОК ПИНАЛА ПИСЦА ПЛАВКИХ ПЛЕБЕЯХ ПЛЫВЁТ ПОБЕЛЕЙ ПОВИННО ПОДДАЁТ ПОДМЁРЗ ПОДСУНУ ПОЖАЛУ ПОЗОРА ПОКОВКИ ПОЛЕЧИЛ ПОЛОНИЯ ПОМАЗКА ПОМУДРИ ПООСТЫЛ ПОРТНИХ ПОСЛАЛИ ПОТАКАЯ ПОТЫЧЕТ ПОЧТЕНЫ ПОЯСНЯЮ ПРЕЖНИЕ ПРИВЕСА ПРИЗЫВЕ ПРИПЕВЫ ПРИШЛЕЦ ПРОДАЖ ПРОЛАЕТ ПРОРУБЬ ПРОЧИЙ ПРЫЩИ ПУТНЫЙ ПЫШЕН ПЯТНИЦА РАДИЮ РАЗДУТА РАЗРЕШ РАНГАМ РАСПОЕТ РАУНД РЕБЕНКА РЕЗАЛИ РЕШАЕМА РИМСКИЙ РОВНЯМИ РОПАК РУБАНКА РУЛЕВОЙ РУТИЛЕ РЫГАТЬ РЫЧАЖКУ РЯЗАНИ САНДАЛЯ САШЕЧКА СБРУЯ СВЕЖО СВИВШЕМ СВОРНОЕ СГОННЫМ СДЕРУ СЕМЕРКУ СЕРЖУСЬ СЕЯННЫХ СИГАРЕ СИМКАМ СИРОПОМ СКАНОГО СКИТАЛИ СКОРБИМ СКРЫТНА СЛАВИМ СЛЕПИТЬ СЛОВИЛО СЛУЧАЕН СМАЙЛЯ СМЕТАМИ СМОЛКАЮ СМЫСЛЫ СНИКШЕЙ СОБОЛЁК СОЕДИНИ СОЛИДНЫ СОННИКЕ СОСЕДА СОФАХ СПАДОВ СПЕТЫМ СПЛЕСТИ СПРЫСК СРЕЖЬ ССУДЫ СТАРИНА СТЕКЛЫ СТИРАНО СТОПАМИ СТРИЖЕТ СТУЛА СТЁРШАЯ СУРЖИК СУШЕНО СЦЕНКА СЪЕЖЕНЫ СЫРЬЕЕ ТАБУНЫ ТАЛИЙ ТАРХАНА ТВОИ ТЕЛЁНКА ТЕРЕМОМ ТЕСОВОЮ ТИГРОМ ТИТРУЮ ТОГАХ ТОМЛЁНА ТОПОРУ ТОСКУЮТ ТРЕТЬЯК ТРОННОМ ТРУТЕНЬ ТУЖИЛИ ТУРЕНКУ ТУШЕНЫХ ТЯГУЧУЮ ТЁТКАХ УБОРНЫЕ УВЕЧИЙ УГАДАНЫ УГРЕЙ УДЕРЖАН УЕЗДНОМ УКИПЕЛИ УКУТАНЫ УЛУЧЕНО УМИЛИЛ УНЫВНЫЙ УПОВАЮТ УРЁМНОМ УСЛЫХАВ УТЕШАЛА УТОПШЕЮ УХАВШИЙ УЧЕНОМ УШИБЁТ ФАРТ ФИЗРУК ФОНАРЁМ ФРАКИИ ФУКСИИ ХАЛТУРА ХАХАЛЕМ ХИЛОГО ХЛЕБНЫМ ХМУРЫХ ХОЛОДКИ ХОХЛАМИ ХРУПАЛ ХУТОРА ЦЕДИ ЦЕНУР ЧАДИТЬ ЧАСТНУЮ ЧЕПУХУ ЧЕСАНАЯ ЧИТКОЮ ЧУБАТОМ ЧУМАЗ ЧЁТКОЙ ШАЛЯЩУЮ ШАТИЕЮ ШИПЯЩЕЙ ШКУРА ШЛЁНДА ШПАЛАМИ ШТАНАМ ШУБАМИ ЩЕЛЧКАМ ЩИТОК ЭДАКИЕ ЭМФАЗОЙ ЭФИРАМИ ЮНОМУ ЯВЛЕНО ЯЗЫЧНИК ЯМЩИНА ЯССКУЮ ЁКАЛО'.split(' ');

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
};

/** How many cycles before usher disappears (randomized). */
function rollUsherGoneCycle(): number {
	return 3 + Math.floor(Math.random() * 8);
}

/** Generate random wall poster texts for the 6 poster wall tiles. */
function rollWallTexts(): string[] {
	return POSTER_POSITIONS.map((_, i) =>
		generateMarkovText(Math.floor(Math.random() * 90_000) + 10_000 + i));
}

/** Create initial game state. */
export function createTheaterState(): TheaterState {
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

		triggerAudio: null,
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
	if (!isWall(state.map, newX, state.camera.y, COLLISION_MARGIN)) {
		state.camera.x = newX;
	}

	if (!isWall(state.map, state.camera.x, newY, COLLISION_MARGIN)) {
		state.camera.y = newY;
	}
}

function isWall(map: TileMap, x: number, y: number, margin: number): boolean {
	const checks = [
		[x - margin, y - margin],
		[x + margin, y - margin],
		[x - margin, y + margin],
		[x + margin, y + margin],
	];
	for (const [cx, cy] of checks) {
		const mx = Math.floor(cx);
		const my = Math.floor(cy);
		if (my < 0 || my >= map.length || mx < 0 || mx >= map[0].length) {
			return true;
		}

		if (map[my][mx] > 0) {
			return true;
		}
	}

	return false;
}

// ── Cycle detection — player entered corridor and came back ─────

/** Check if player is deep enough in the corridor to trigger darkness. */
function isInCorridor(camera: Camera): boolean {
	return camera.y < 8;
}

/** Check if player is back in the lobby. */
function isInLobby(camera: Camera): boolean {
	return camera.y > 10;
}

// ── Lobby proximity checks (walls + rear door) ─────────────────

function checkLobbyProximity(state: TheaterState): void {
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

// ── Main game tick ──────────────────────────────────────────────

export function tickTheater(state: TheaterState, dt: number): void {
	state.triggerAudio = null;

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
	}
}

// ── Phase ticks ─────────────────────────────────────────────────

function tickNormal(state: TheaterState, _dt: number): void {
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

		// Check if usher should disappear now
		if (state.cycleCount >= state.usherGoneCycle) {
			state.phase = Phase.USHER_GONE;
			state.sprites[0].visible = false; // Hide usher
		}
	}
}

function tickUsherGone(state: TheaterState, _dt: number): void {
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

function tickDarkWalk(state: TheaterState, dt: number): void {
	state.darkness = Math.min(0.95, state.darkness + 0.005);
	state.corridorProgress += dt;

	// Footstep sounds
	state.footstepTimer -= dt;
	if (state.footstepTimer <= 0) {
		state.triggerAudio = 'footstep';
		state.footstepTimer = 0.6;
	}

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

function tickVortexEncounter(state: TheaterState, dt: number): void {
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

function tickGlitchScream(state: TheaterState, dt: number): void {
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

function tickPostEncounter(state: TheaterState, dt: number): void {
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

function tickUsherScared(state: TheaterState, dt: number): void {
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

function tickUsherWarning(state: TheaterState, dt: number): void {
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

function tickFinalWall(state: TheaterState, dt: number): void {
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

function tickMaze(state: TheaterState, dt: number): void {
	// Ramp up maze fog over first few seconds for atmosphere
	state.mazeFogDensity = Math.min(0.25, state.mazeFogDensity + dt * 0.03);

	// Footstep sounds
	state.footstepTimer -= dt;
	if (state.footstepTimer <= 0) {
		state.triggerAudio = 'footstep';
		state.footstepTimer = 0.8;
	}

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

function tickInfiniteCorridor(state: TheaterState, dt: number): void {
	// Footstep sounds
	state.footstepTimer -= dt;
	if (state.footstepTimer <= 0) {
		state.triggerAudio = 'footstep';
		state.footstepTimer = 0.7;
	}

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

function tickMazeExit(state: TheaterState, dt: number): void {
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

function tickRooms(state: TheaterState, dt: number): void {
	// Footsteps only when moving
	const moved = Math.abs(state.camera.x - lastRoomCamX) > 0.001
		|| Math.abs(state.camera.y - lastRoomCamY) > 0.001;
	lastRoomCamX = state.camera.x;
	lastRoomCamY = state.camera.y;

	if (moved) {
		state.footstepTimer -= dt;
		if (state.footstepTimer <= 0) {
			state.triggerAudio = 'footstep';
			state.footstepTimer = 0.8;
		}
	}

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

// ── Helpers ─────────────────────────────────────────────────────

function resetToLobby(state: TheaterState): void {
	state.camera.x = PLAYER_START.x;
	state.camera.y = PLAYER_START.y;
	state.camera.angle = PLAYER_START.angle;
	state.darkness = 0;
	state.canMove = true;
	state.corridorProgress = 0;

	// Re-roll wall poster texts so each cycle feels different
	state.wallTexts = rollWallTexts();
}

function replacePostersWithVortex(state: TheaterState): void {
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
function tickUsherBehind(state: TheaterState, dt: number): void {
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

function placeBrickWall(state: TheaterState): void {
	// Block the corridor entrance with brick
	for (let x = 2; x < 13; x++) {
		if (state.map[8][x] === 0) {
			state.map[8][x] = Tile.WALL_BRICK;
		}
	}
}

/** Garble text with random unicode artifacts. */
function garbleText(text: string): string {
	const glitchChars = 'Ẑ̷̧̦̀a̵̗̓l̶̰̈g̸͚̈o̷̜̔█▓░▒▌▐╫╪╬';
	let result = '';
	for (const ch of text) {
		result += Math.random() < 0.3 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : ch;
	}

	return result;
}
