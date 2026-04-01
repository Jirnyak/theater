<script lang="ts">
	import {resumeAudio, playMusicLoop} from '../theater/audio';
	import {generateUsher, generateVortexMan} from '../engine/sprites';

	// 1 = НАСТРОЙКИ enters debug maze, 0 = shows bileter sprite
	const DEBUG_ROOMS = 0;

	type Props = {
		onNewGame: () => void;
		onLoadGame?: () => void;
		onDebugMaze?: () => void;
		completedStage?: number;
	};

	const {onNewGame, onLoadGame, onDebugMaze, completedStage = 0}: Props = $props();
	let titleVisible = $state(false);
	let buttonsVisible = $state(false);
	let theaterCanvas: HTMLCanvasElement | undefined = $state();
	let menuCanvas: HTMLCanvasElement | undefined = $state();
	let hoveredButton: number = $state(-1);
	let bileterVisible = $state(false);
	let bileterSprite: ImageData | undefined = $state();
	let bileterCanvas: HTMLCanvasElement | undefined = $state();

	// Start title music
	$effect(() => {
		const track = completedStage >= 3
			? 'assets/sound/catharsis.mp3'
			: (completedStage > 0
				? 'assets/sound/ertaeht.mp3'
				: 'assets/sound/theatre.mp3');
		playMusicLoop(track);
	});

	// Fade in title, then buttons
	$effect(() => {
		const t1 = setTimeout(() => {
			titleVisible = true;
		}, 1500);
		const t2 = setTimeout(() => {
			buttonsVisible = true;
		}, 3000);
		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
		};
	});

	// Draw theater building once canvas is bound
	$effect(() => {
		if (!theaterCanvas) {
			return;
		}

		drawTheaterBuilding(theaterCanvas);
	});

	// Draw menu on canvas — re-render when hover or visibility changes
	$effect(() => {
		if (!menuCanvas) {
			return;
		}

		drawMenu(menuCanvas, hoveredButton, titleVisible, buttonsVisible);
	});

	// Draw bileter sprite on its canvas
	$effect(() => {
		if (!bileterCanvas || !bileterSprite) {
			return;
		}

		const ctx = bileterCanvas.getContext('2d');
		if (ctx) {
			ctx.putImageData(bileterSprite, 0, 0);
		}
	});

	function handleNewGame() {
		resumeAudio();
		onNewGame();
	}

	function handleLoad() {
		if (onLoadGame) {
			resumeAudio();
			onLoadGame();
		}
	}

	function handleSettings() {
		if (DEBUG_ROOMS && onDebugMaze) {
			onDebugMaze();
			return;
		}

		// Show bileter sprite (1/10 spiral face)
		bileterSprite ||= Math.random() < 0.1
			? generateVortexMan()
			: generateUsher();

		bileterVisible = !bileterVisible;
	}

	// ── Menu canvas click detection ─────────────────────────────
	function onMenuClick(event: MouseEvent) {
		resumeAudio();
		const canvas = menuCanvas;
		if (!canvas) {
			return;
		}

		const rect = canvas.getBoundingClientRect();
		// Map display coords → internal 320×120 coords
		const sx = (event.clientX - rect.left) / rect.width * 320;
		const sy = (event.clientY - rect.top) / rect.height * 120;
		const btn = getButtonAt(sx, sy);
		switch (btn) {
			case 0: {
				handleNewGame();

				break;
			}

			case 1: {
				handleLoad();

				break;
			}

			case 2: {
				handleSettings();

				break;
			}
		// No default
		}
	}

	function onMenuMove(event: MouseEvent) {
		const canvas = menuCanvas;
		if (!canvas) {
			return;
		}

		const rect = canvas.getBoundingClientRect();
		const sx = (event.clientX - rect.left) / rect.width * 320;
		const sy = (event.clientY - rect.top) / rect.height * 120;
		hoveredButton = getButtonAt(sx, sy);
	}

	function onMenuLeave() {
		hoveredButton = -1;
	}

	/** Check which button (0,1,2) is at the given internal coords, or -1. */
	function getButtonAt(x: number, y: number): number {
		// Catharsis mode: the title text itself is the only button (index 0)
		if (completedStage >= 3) {
			if (titleVisible && x >= 100 && x <= 220 && y >= 45 && y <= 75) {
				return 0;
			}

			return -1;
		}

		const bx = 95;
		const bw = 130;
		if (x < bx || x > bx + bw) {
			return -1;
		}

		// Button y positions: 10, 32, 54 — each 18px tall
		for (let i = 0; i < 3; i++) {
			const by = 10 + i * 22;
			if (y >= by && y < by + 18) {
				return i;
			}
		}

		return -1;
	}

	// ── Pixel-text drawing helpers ──────────────────────────────
	function drawPixelText(
		ctx: CanvasRenderingContext2D,
		text: string,
		cx: number,
		ty: number,
		fontSize: number,
		color: string,
	): void {
		ctx.fillStyle = color;
		ctx.font = `bold ${fontSize}px monospace`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText(text, cx, ty);
	}

	function drawMenu(
		canvas: HTMLCanvasElement,
		hovered: number,
		showTitle: boolean,
		showButtons: boolean,
	): void {
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return;
		}

		ctx.imageSmoothingEnabled = false;
		ctx.clearRect(0, 0, 320, 120);

		if (!showTitle && !showButtons) {
			return;
		}

		// Catharsis mode: just the title, clickable
		if (completedStage >= 3) {
			if (showTitle) {
				const titleColor = hovered === 0 ? '#ffffff' : '#aaaaaa';
				ctx.shadowColor = 'rgba(255,255,255,0.4)';
				ctx.shadowBlur = hovered === 0 ? 12 : 6;
				drawPixelText(ctx, '\u0422\u0415\u0410\u0422\u0420', 160, 50, 20, titleColor);
				ctx.shadowBlur = 0;
				ctx.shadowColor = 'transparent';
			}

			return;
		}

		// Title
		if (showTitle) {
			ctx.shadowColor = 'rgba(180,0,0,0.6)';
			ctx.shadowBlur = 8;
			drawPixelText(ctx, 'ТЕАТР', 160, 80, 20, '#ffffff');
			ctx.shadowBlur = 0;
			ctx.shadowColor = 'transparent';
		}

		if (!showButtons) {
			return;
		}

		// Menu buttons
		const labels = ['НОВАЯ ИГРА', 'ЗАГРУЗКА', 'НАСТРОЙКИ'];
		const baseColors = ['#c8c8c8', '#666666', '#888888'];
		const hoverColors = ['#ffffff', '#666666', '#c8c8c8'];

		for (let i = 0; i < 3; i++) {
			const by = 10 + i * 22;
			const bx = 95;
			const bw = 130;
			const bh = 18;

			// Button border
			const borderColor = hovered === i ? '#4a1010' : '#333333';
			ctx.fillStyle = borderColor;
			ctx.fillRect(bx, by, bw, bh);
			// Button fill
			const fillColor = hovered === i ? '#1a1a1a' : '#111111';
			ctx.fillStyle = fillColor;
			ctx.fillRect(bx + 1, by + 1, bw - 2, bh - 2);

			// Label
			const color = hovered === i ? hoverColors[i] : baseColors[i];
			drawPixelText(ctx, labels[i], 160, by + 4, 8, color);
		}
	}

	function drawTheaterBuilding(canvas: HTMLCanvasElement): void {
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return;
		}

		ctx.imageSmoothingEnabled = false;
		const w = canvas.width;
		const h = canvas.height;

		// Dark sky
		ctx.fillStyle = '#0a0a12';
		ctx.fillRect(0, 0, w, h);

		// Street
		ctx.fillStyle = '#1a1a1a';
		ctx.fillRect(0, h - 40, w, 40);
		// Street line
		ctx.fillStyle = '#2a2a2a';
		ctx.fillRect(0, h - 41, w, 1);

		// Theater building — center
		const bx = 80;
		const by = 40;
		const bw = 160;

		// Main building body
		ctx.fillStyle = '#2a2020';
		ctx.fillRect(bx, by, bw, 160);

		// Facade details
		ctx.fillStyle = '#3a2a2a';
		ctx.fillRect(bx + 5, by + 5, bw - 10, 20);

		// Columns (4 columns, spaced to leave room for centered door)
		const colPositions = [bx + 15, bx + 55, bx + 97, bx + 137];
		for (const cx of colPositions) {
			ctx.fillStyle = '#4a3a3a';
			ctx.fillRect(cx, by + 30, 8, 130);
			// Column base
			ctx.fillStyle = '#3a2a2a';
			ctx.fillRect(cx - 2, by + 155, 12, 5);
			// Column capital
			ctx.fillRect(cx - 2, by + 28, 12, 4);
		}

		// Door — centered between middle two columns, narrower
		const doorX = bx + 67;
		const doorW = 26;
		const doorH = 55;
		const doorY = by + 105;
		// Door recess (dark)
		ctx.fillStyle = '#050508';
		ctx.fillRect(doorX - 2, doorY - 2, doorW + 4, doorH + 2);
		// Door panels
		ctx.fillStyle = '#1a1210';
		ctx.fillRect(doorX, doorY, doorW, doorH);
		// Door frame
		ctx.fillStyle = '#3a2a2a';
		ctx.fillRect(doorX - 1, doorY, 1, doorH);
		ctx.fillRect(doorX + doorW, doorY, 1, doorH);
		ctx.fillRect(doorX - 1, doorY - 1, doorW + 2, 1);
		// Door split line
		ctx.fillStyle = '#0a0808';
		ctx.fillRect(doorX + Math.floor(doorW / 2), doorY, 1, doorH);
		// Door handle (small dot)
		ctx.fillStyle = '#6a5a3a';
		ctx.fillRect(doorX + doorW - 5, doorY + Math.floor(doorH / 2), 2, 2);

		// Pediment (triangle)
		ctx.fillStyle = '#3a2828';
		ctx.beginPath();
		ctx.moveTo(bx - 5, by + 25);
		ctx.lineTo(bx + bw / 2, by - 15);
		ctx.lineTo(bx + bw + 5, by + 25);
		ctx.closePath();
		ctx.fill();

		// Windows — placed between columns
		const windowXs = [bx + 27, bx + 67, bx + 109];
		for (const [col, wx] of windowXs.entries()) {
			// Light up windows by column (left to right):
			// completedStage >= 1 → left column glows
			// completedStage >= 2 → left + center columns glow
			const isLit = completedStage >= col + 1;
			for (let row = 0; row < 2; row++) {
				const wy = by + 38 + row * 32;
				ctx.fillStyle = '#1a1518';
				ctx.fillRect(wx, wy, 14, 22);
				if (isLit) {
					// Warm amber glow
					ctx.fillStyle = '#8a6520';
					ctx.fillRect(wx + 1, wy + 1, 12, 20);
					// Brighter center
					ctx.fillStyle = '#b8882a';
					ctx.fillRect(wx + 3, wy + 3, 8, 16);
					// Light spill glow
					const wGrad = ctx.createRadialGradient(wx + 7, wy + 11, 2, wx + 7, wy + 11, 20);
					wGrad.addColorStop(0, 'rgba(140, 100, 30, 0.25)');
					wGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
					ctx.fillStyle = wGrad;
					ctx.fillRect(wx - 10, wy - 10, 34, 42);
				} else {
					ctx.fillStyle = '#2a2025';
					ctx.fillRect(wx + 1, wy + 1, 12, 20);
				}
			}
		}

		// Dim light from entrance
		const grad = ctx.createRadialGradient(bx + 80, by + 130, 5, bx + 80, by + 130, 60);
		grad.addColorStop(0, 'rgba(80, 40, 20, 0.15)');
		grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
		ctx.fillStyle = grad;
		ctx.fillRect(bx + 20, by + 80, 120, 80);

		// Theater name on building — pixelated
		ctx.fillStyle = '#6a4a3a';
		ctx.font = 'bold 8px monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText('ТЕАТР', bx + bw / 2, by + 10);
	}
</script>

<div class="absolute inset-0 flex flex-col items-center justify-center bg-black" onclick={resumeAudio}>
	<!-- Theater building sprite (procedural) -->
	<canvas
		bind:this={theaterCanvas}
		class="block"
		width="320"
		height="240"
		style="image-rendering: pixelated; width: 640px; height: 480px;"
	></canvas>

	<!-- Menu (rendered on low-res canvas → scaled up for pixel look) -->
	<canvas
		bind:this={menuCanvas}
		class="block"
		width="320"
		height="120"
		style="image-rendering: pixelated; width: 640px; height: 240px; cursor: default; margin-top: -8px;"
		onclick={onMenuClick}
		onmousemove={onMenuMove}
		onmouseleave={onMenuLeave}
	></canvas>

	{#if bileterVisible && bileterSprite}
		<canvas
			bind:this={bileterCanvas}
			class="pointer-events-none absolute"
			width={bileterSprite.width}
			height={bileterSprite.height}
			style="image-rendering: pixelated; width: {bileterSprite.width * 4}px; height: {bileterSprite.height * 4}px;"
		></canvas>
	{/if}
</div>
