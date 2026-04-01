<script lang="ts">
	import {untrack} from 'svelte';
	import {Raycaster} from '../engine/raycaster';
	import {buildTextureAtlas, generateTheaterPoster, generateEmptyEasel} from '../engine/textures';
	import {
		generateUsher,
		generateUsherScared,
		generateVortexMan,
		generateVortexFrames,
		generateVortexManFlash,
		generateNormalPerson,
		generateScaryFace,
		generateScaryFaceFrames,
	} from '../engine/sprites';
	import {
		type TheaterState,
		Phase,
		createTheaterState,
		movePlayer,
		tickTheater,
		enterMaze,
		enterRooms,
		enterCatharsis,
		MAZE_POSTER_COUNT,
		PEOPLE_COUNT,
	} from '../theater/state';
	import {
		playAudioTrigger, resumeAudio, playMusicLoop, stopMusic,
		startDrone, stopDrone, updateDroneDoppler,
	} from '../theater/audio';

	type Props = {
		onCrash: () => void;
		onRestart: () => void;
		debugMaze?: boolean;
		loadMode?: boolean;
		completedStage?: number;
	};

	const {onCrash, onRestart, debugMaze = false, loadMode = false, completedStage = 0}: Props = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let flashCanvas: HTMLCanvasElement | undefined = $state();
	let debugCanvas: HTMLCanvasElement | undefined = $state();
	let msgCanvas: HTMLCanvasElement | undefined = $state();
	const state: TheaterState = $state(createTheaterState(completedStage + 1));
	let raycaster: Raycaster | undefined = $state();
	let animFrame = 0;
	let lastTime = 0;
	let vortexFrames: ImageData[] = [];
	let vortexFlashImg: ImageData | undefined;
	let vortexFrameIndex = 0;
	let vortexFrameTimer = 0;
	let faceFrames: ImageData[] = [];
	let faceFrameIndex = 0;
	let faceFrameTimer = 0;
	let lastMazePosterSeeds: number[] = [];

	function drawVortexFlash(fc: HTMLCanvasElement, img: ImageData): void {
		const ctx = fc.getContext('2d');
		if (!ctx) {
			return;
		}

		fc.width = fc.clientWidth;
		fc.height = fc.clientHeight;

		const w = fc.width;
		const h = fc.height;

		// Draw scaled vortex face centered with random jitter
		const jx = (Math.random() - 0.5) * 40;
		const jy = (Math.random() - 0.5) * 40;

		// Put sprite on a temp canvas, then drawImage scaled
		const tmp = new OffscreenCanvas(img.width, img.height);
		const tc = tmp.getContext('2d')!;
		tc.putImageData(img, 0, 0);

		const scale = Math.min(w, h) * 0.8;
		const dx = (w - scale) / 2 + jx;
		const dy = (h - scale) / 2 + jy;

		// Black base
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, w, h);

		// Draw the sprite scaled up
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(tmp, dx, dy, scale, scale);

		// Red vignette
		const grad = ctx.createRadialGradient(w / 2, h / 2, scale * 0.2, w / 2, h / 2, scale);
		grad.addColorStop(0, 'rgba(0,0,0,0)');
		grad.addColorStop(1, 'rgba(80,0,0,0.7)');
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, w, h);

		// Scanlines
		ctx.fillStyle = 'rgba(0,0,0,0.15)';
		for (let y = 0; y < h; y += 3) {
			ctx.fillRect(0, y, w, 1);
		}
	}

	/** Catharsis ending — screen goes white, then "crashes" the browser tab. */
	function performCatharsisCrash(): void {
		stopMusic();
		stopDrone();

		// Phase 1: Fill entire page with white
		document.body.style.background = '#fff';
		document.body.innerHTML = '';

		const overlay = document.createElement('div');
		overlay.style.cssText
			= 'position:fixed;inset:0;background:#fff;z-index:999999;';
		document.body.append(overlay);

		// Phase 2: After a brief white moment, try to close the tab
		setTimeout(() => {
			// Try globalThis.close() — works if opened via script or link
			try {
				globalThis.close();
			} catch {}

			// If close didn't work (most browsers block it),
			// replace the page content with a blank white page,
			// then navigate away after a beat
			setTimeout(() => {
				// Replace entire document — point of no return
				document.open();
				document.write('<!DOCTYPE html><html><head><title></title></head><body style="background:#fff"></body></html>');
				document.close();

				// Final attempt: navigate to about:blank
				setTimeout(() => {
					try {
						globalThis.location.replace('about:blank');
					} catch {}
				}, 500);
			}, 800);
		}, 1500);
	}

	// Input state
	const keys = new Set<string>();

	// ── Render message text on pixel canvas ─────────────────────
	$effect(() => {
		if (!msgCanvas || !state.messageText) {
			return;
		}

		const ctx = msgCanvas.getContext('2d');
		if (!ctx) {
			return;
		}

		ctx.imageSmoothingEnabled = false;
		ctx.clearRect(0, 0, 320, 16);

		const isWarning = state.phase === Phase.USHER_WARNING;
		ctx.fillStyle = isWarning ? '#ff4444' : '#c8c8c8';
		ctx.font = 'bold 8px monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(state.messageText, 160, 8);
	});

	// ── Phase-based background music ──────────────────────────────
	$effect(() => {
		const p = state.phase;
		switch (true) {
			case p === Phase.USHER_SCARED || p === Phase.USHER_WARNING: {
				stopMusic();
				stopDrone();
				break;
			}

			case p === Phase.NORMAL || (p >= Phase.POST_ENCOUNTER && p <= Phase.FINAL_WALL) || p === Phase.ROOMS || p === Phase.STAGE3_ATRIUM: {
				playMusicLoop('assets/sound/theatre.mp3');
				stopDrone();
				break;
			}

			case p === Phase.STAGE2_LOBBY: {
				playMusicLoop('assets/sound/talking.mp3');
				stopDrone();
				break;
			}

			case p >= Phase.USHER_GONE && p <= Phase.GLITCH_SCREAM: {
				playMusicLoop('assets/sound/ertaeht.mp3');
				stopDrone();
				break;
			}

			case p === Phase.MAZE: {
				playMusicLoop('assets/sound/devil.mp3');
				stopDrone();
				break;
			}

			case p === Phase.STAGE3_CORRIDOR: {
				stopMusic();
				startDrone();
				break;
			}

			case p === Phase.CATHARSIS: {
				stopMusic();
				stopDrone();
				break;
			}

			default: {
				stopMusic();
				stopDrone();
			}
		}

		return () => {
			stopMusic();
			stopDrone();
		};
	});

	// ── Initialize engine ───────────────────────────────────────
	$effect(() => {
		if (!canvas) {
			return;
		}

		resumeAudio();

		const rc = new Raycaster();
		const atlas = buildTextureAtlas();
		rc.init(atlas);

		// Red rug in theater center aisle (columns 6-8, rows 8-17)
		rc.rugZone = {
			x0: 6, y0: 8, x1: 9, y1: 18,
		};

		// Register sprite textures
		rc.registerSprite('usher', generateUsher());
		rc.registerSprite('usher_scared', generateUsherScared());
		rc.registerSprite('vortex', generateVortexMan());
		rc.registerSprite('empty_easel', generateEmptyEasel());

		// Register people sprites for stage 2
		for (let i = 0; i < PEOPLE_COUNT; i++) {
			rc.registerSprite(`person_${i}`, generateNormalPerson(i));
		}

		// Stage 3 scary face
		rc.registerSprite('scary_face', generateScaryFace());
		faceFrames = generateScaryFaceFrames(12);

		// Pre-generate vortex animation frames
		vortexFrames = generateVortexFrames(12);
		vortexFlashImg = generateVortexManFlash();

		raycaster = rc;

		// If debug maze mode, jump straight to maze
		if (debugMaze) {
			untrack(() => enterMaze(state));
		} else if (loadMode) {
			untrack(() => enterRooms(state));
		} else if (state.stage >= 4) {
			untrack(() => enterCatharsis(state));
		}

		// Start game loop
		lastTime = performance.now();
		animFrame = requestAnimationFrame(loop);

		return () => {
			cancelAnimationFrame(animFrame);
		};
	});

	// ── Resize canvas to fill window ────────────────────────────
	$effect(() => {
		if (!canvas) {
			return;
		}

		function resize() {
			if (!canvas) {
				return;
			}

			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		}

		resize();
		window.addEventListener('resize', resize);
		return () => {
			window.removeEventListener('resize', resize);
		};
	});

	// ── Keyboard input ──────────────────────────────────────────
	$effect(() => {
		function onKeyDown(e: KeyboardEvent) {
			keys.add(e.code);
		}

		function onKeyUp(e: KeyboardEvent) {
			keys.delete(e.code);
		}

		globalThis.addEventListener('keydown', onKeyDown);
		globalThis.addEventListener('keyup', onKeyUp);
		return () => {
			globalThis.removeEventListener('keydown', onKeyDown);
			globalThis.removeEventListener('keyup', onKeyUp);
		};
	});

	// ── Mouse look (pointer lock) ───────────────────────────────
	$effect(() => {
		if (!canvas) {
			return;
		}

		function onClick() {
			canvas?.requestPointerLock();
			resumeAudio();
		}

		function onMouseMove(e: MouseEvent) {
			if (document.pointerLockElement === canvas) {
				state.camera.angle += e.movementX * 0.002;
			}
		}

		canvas.addEventListener('click', onClick);
		document.addEventListener('mousemove', onMouseMove);
		return () => {
			canvas?.removeEventListener('click', onClick);
			document.removeEventListener('mousemove', onMouseMove);
		};
	});

	// ── Game loop ───────────────────────────────────────────────
	function loop(time: number): void {
		const dt = Math.min((time - lastTime) / 1000, 0.1);
		lastTime = time;

		// Process input
		let forward = 0;
		let strafe = 0;
		let rotate = 0;

		if (keys.has('KeyW') || keys.has('ArrowUp')) {
			forward = 1;
		}

		if (keys.has('KeyS') || keys.has('ArrowDown')) {
			forward = -1;
		}

		if (keys.has('KeyA')) {
			strafe = -1;
		}

		if (keys.has('KeyD')) {
			strafe = 1;
		}

		if (keys.has('ArrowLeft')) {
			rotate = -1;
		}

		if (keys.has('ArrowRight')) {
			rotate = 1;
		}

		// Move player
		movePlayer(state, forward, strafe, rotate, dt);

		// Update game logic
		tickTheater(state, dt);

		// Register maze poster textures when seeds change (maze entry)
		if (raycaster) {
			let seedsChanged = false;
			for (let i = 0; i < MAZE_POSTER_COUNT; i++) {
				if ((state.mazePosterSeeds[i] ?? 0) !== (lastMazePosterSeeds[i] ?? 0)) {
					seedsChanged = true;
					break;
				}
			}

			if (seedsChanged) {
				for (let i = 0; i < MAZE_POSTER_COUNT; i++) {
					const seed = state.mazePosterSeeds[i];
					if (seed) {
						raycaster.registerSprite(`maze_poster_${i}`, generateTheaterPoster(seed));
					}
				}

				lastMazePosterSeeds = [...state.mazePosterSeeds];
			}
		}

		// Handle audio triggers
		if (state.triggerAudio) {
			if (state.triggerAudio === 'applause') {
				playMusicLoop('assets/sound/applause_clap.mp3');
			} else {
				playAudioTrigger(state.triggerAudio);
			}
		}

		// Drone Doppler for Stage 3 corridor — face patrols continuously
		if (state.phase === Phase.STAGE3_CORRIDOR) {
			const dist = Math.abs(state.stage3FaceY - state.camera.y);
			const approaching = state.stage3FaceSpeed > 0
				? state.stage3FaceY < state.camera.y
				: state.stage3FaceY > state.camera.y;
			updateDroneDoppler(dist, approaching, true);
		}

		// Handle game over
		if (state.gameOver) {
			if (state.phase === Phase.CATHARSIS) {
				// Catharsis ending — dramatic browser "crash"
				performCatharsisCrash();
				return;
			}

			if (state.phase === Phase.MAZE_EXIT || state.phase === Phase.STAGE2_EXIT || state.phase === Phase.STAGE3_EXIT) {
				onRestart();
			} else {
				onCrash();
			}

			return;
		}

		// Render
		if (canvas && raycaster) {
			// Animate vortex sprite in all phases where vortex figures are visible
			const vortexActive = state.phase === Phase.VORTEX_ENCOUNTER
				|| state.phase === Phase.GLITCH_SCREAM
				|| state.phase === Phase.STAGE2_DARK
				|| state.phase === Phase.MAZE
				|| state.phase === Phase.STAGE3_ATRIUM;
			if (vortexActive && vortexFrames.length > 0) {
				vortexFrameTimer += dt;
				if (vortexFrameTimer > 0.08) {
					vortexFrameTimer = 0;
					vortexFrameIndex = (vortexFrameIndex + 1) % vortexFrames.length;
					raycaster.updateSprite('vortex', vortexFrames[vortexFrameIndex]);
				}
			}

			// Animate scary face eye spirals during corridor phase
			if (state.phase === Phase.STAGE3_CORRIDOR && faceFrames.length > 0) {
				faceFrameTimer += dt;
				if (faceFrameTimer > 0.08) {
					faceFrameTimer = 0;
					faceFrameIndex = (faceFrameIndex + 1) % faceFrames.length;
					raycaster.updateSprite('scary_face', faceFrames[faceFrameIndex]);
				}
			}

			// Glitch intensity from state
			raycaster.glitchIntensity
				= state.phase === Phase.GLITCH_SCREAM
					? 0.8
					: (state.vortexFlashActive ? 0.3 : 0);

			// Darker fog in maze and stage 2
			raycaster.fogDensity = state.mazeFogDensity > 0
				? state.mazeFogDensity
				: 0.08;

			// Rug zone — theater map and stage 2 lobby (same map)
			if (state.phase <= Phase.FINAL_WALL || state.phase === Phase.STAGE2_LOBBY || state.phase === Phase.STAGE2_DARK || state.phase === Phase.STAGE3_ATRIUM) {
				raycaster.rugZone = {
					x0: 6, y0: 8, x1: 9, y1: 18,
				};
				raycaster.pathTiles = undefined;
			} else if (state.phase === Phase.STAGE2_CORRIDOR) {
				raycaster.rugZone = undefined;
				raycaster.pathTiles = state.snakePathTiles;
				raycaster.pathSegments = state.snakePathSegments;
			} else {
				raycaster.rugZone = undefined;
				raycaster.pathTiles = undefined;
				raycaster.pathSegments = undefined;
			}

			// Catharsis: white fog + bright environment
			if (state.phase === Phase.CATHARSIS) {
				raycaster.fogColor = [255, 255, 255];
				raycaster.fogDensity = 0.03;
			} else {
				raycaster.fogColor = [0, 0, 0];
			}

			raycaster.render(
				canvas,
				state.camera,
				state.map,
				state.sprites,
				state.darkness,
				state.whiteness,
			);

			// Fullscreen vortex face flash overlay
			if (state.vortexFlashActive && flashCanvas && vortexFlashImg) {
				drawVortexFlash(flashCanvas, vortexFlashImg);
			}

			// Debug minimap
			if (debugMaze && debugCanvas && state.phase === Phase.MAZE) {
				drawDebugMap(debugCanvas, state);
			}
		}

		animFrame = requestAnimationFrame(loop);
	}
	function drawDebugMap(dc: HTMLCanvasElement, s: TheaterState): void {
		const ctx = dc.getContext('2d');
		if (!ctx) {
			return;
		}

		const mapH = s.map.length;
		const mapW = s.map[0]?.length ?? 0;
		const cellSize = Math.floor(Math.min(240 / mapW, 240 / mapH));
		const totalW = mapW * cellSize;
		const totalH = mapH * cellSize;

		dc.width = totalW;
		dc.height = totalH;

		// Draw tiles
		for (let y = 0; y < mapH; y++) {
			for (let x = 0; x < mapW; x++) {
				const tile = s.map[y][x];
				if (tile === 0) {
					ctx.fillStyle = '#1a1a1a';
				} else if (tile === 14) {
					// Exit
					ctx.fillStyle = '#00ff00';
				} else {
					ctx.fillStyle = '#444';
				}

				ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
			}
		}

		// Player (cyan dot)
		ctx.fillStyle = '#0ff';
		ctx.beginPath();
		ctx.arc(s.camera.x * cellSize, s.camera.y * cellSize, cellSize * 0.6, 0, Math.PI * 2);
		ctx.fill();

		// Player direction line
		ctx.strokeStyle = '#0ff';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(s.camera.x * cellSize, s.camera.y * cellSize);
		ctx.lineTo(
			(s.camera.x + Math.cos(s.camera.angle) * 1.5) * cellSize,
			(s.camera.y + Math.sin(s.camera.angle) * 1.5) * cellSize,
		);
		ctx.stroke();

		// Entity (red dot)
		const entity = s.sprites[0];
		if (entity.visible) {
			ctx.fillStyle = '#f00';
			ctx.beginPath();
			ctx.arc(entity.x * cellSize, entity.y * cellSize, cellSize * 0.6, 0, Math.PI * 2);
			ctx.fill();
		}
	}
</script>

<div class="absolute inset-0 cursor-none bg-black">
	<canvas
		bind:this={canvas}
		class="block h-full w-full"
		style="image-rendering: pixelated;"
	></canvas>

	<!-- Bottom text bar (pixel-rendered) -->
	{#if state.messageText}
		<div class="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-center bg-black/80 py-2">
			<canvas
				bind:this={msgCanvas}
				width="320"
				height="16"
				class="block"
				style="image-rendering: pixelated; width: 640px; height: 32px;"
			></canvas>
		</div>
	{/if}

	<!-- Vortex flash overlay canvas -->
	<canvas
		bind:this={flashCanvas}
		class="pointer-events-none absolute inset-0 h-full w-full"
		class:hidden={!state.vortexFlashActive}
		style="image-rendering: pixelated;"
	></canvas>

	<!-- Debug minimap overlay -->
	{#if debugMaze}
		<canvas
			bind:this={debugCanvas}
			class="pointer-events-none absolute left-2 top-2 border border-gray-700 opacity-80"
			style="image-rendering: pixelated;"
		></canvas>
	{/if}
</div>
