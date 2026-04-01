// === Procedural texture generation ===
// Generates retro-style wall textures at runtime (no external assets needed).
// Each texture is a 64×64 RGBA ImageData.

const TEX_SIZE = 64;

/** Create a blank ImageData. */
function createTex(): ImageData {
	return new ImageData(TEX_SIZE, TEX_SIZE);
}

/** Set a pixel in an ImageData. */
function setPixel(img: ImageData, x: number, y: number, r: number, g: number, b: number, a = 255): void {
	const i = (y * img.width + x) * 4;
	img.data[i] = r;
	img.data[i + 1] = g;
	img.data[i + 2] = b;
	img.data[i + 3] = a;
}

/** Simple seeded pseudo-random for deterministic textures. */
function seededRand(seed: number): () => number {
	let s = Math.trunc(seed);
	return () => {
		s = (s * 1_103_515_245 + 12_345) & 0x7F_FF_FF_FF;
		return (s >>> 16) / 32_768;
	};
}

/** Gray stone wall — Theater lobby walls. */
function generateStoneWall(): ImageData {
	const tex = createTex();
	const rng = seededRand(42);
	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			const base = 140 + Math.floor(rng() * 30) - 15;
			// Mortar lines
			const isMortarH = y % 16 < 2;
			const offset = Math.floor(y / 16) % 2 === 0 ? 0 : 8;
			const isMortarV = (x + offset) % 16 < 2;
			if (isMortarH || isMortarV) {
				setPixel(tex, x, y, base - 40, base - 40, base - 35);
			} else {
				setPixel(tex, x, y, base, base - 5, base - 10);
			}
		}
	}

	return tex;
}

/** Dark wall — corridor walls, progressively darker. */
function generateDarkWall(): ImageData {
	const tex = createTex();
	const rng = seededRand(77);
	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			const base = 50 + Math.floor(rng() * 20) - 10;
			const isMortarH = y % 16 < 2;
			const offset = Math.floor(y / 16) % 2 === 0 ? 0 : 8;
			const isMortarV = (x + offset) % 16 < 2;
			if (isMortarH || isMortarV) {
				setPixel(tex, x, y, base - 20, base - 20, base - 18);
			} else {
				setPixel(tex, x, y, base, base - 3, base - 5);
			}
		}
	}

	return tex;
}

/** Brick wall — blocks passage at endgame. */
function generateBrickWall(): ImageData {
	const tex = createTex();
	const rng = seededRand(99);
	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			const isMortarH = y % 8 < 1;
			const offset = Math.floor(y / 8) % 2 === 0 ? 0 : 8;
			const isMortarV = (x + offset) % 16 < 1;
			if (isMortarH || isMortarV) {
				setPixel(tex, x, y, 80, 75, 70);
			} else {
				const v = 140 + Math.floor(rng() * 40) - 20;
				setPixel(tex, x, y, v, Math.floor(v * 0.45), Math.floor(v * 0.3));
			}
		}
	}

	return tex;
}

/** Red curtain — theater decoration. */
function generateRedCurtain(): ImageData {
	const tex = createTex();
	const rng = seededRand(55);
	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			// Vertical folds
			const fold = Math.sin(x * 0.3) * 0.3 + 0.7;
			const base = Math.floor(160 * fold) + Math.floor(rng() * 10) - 5;
			setPixel(tex, x, y, base, Math.floor(base * 0.15), Math.floor(base * 0.12));
		}
	}

	return tex;
}

/** Movie poster wall — beige wall with a framed rectangle. */
function generatePosterWall(): ImageData {
	const tex = createTex();
	const rng = seededRand(33);
	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			// Base wall
			const base = 150 + Math.floor(rng() * 15) - 7;
			setPixel(tex, x, y, base, base - 10, base - 20);
		}
	}

	// Frame
	for (let y = 10; y < 54; y++) {
		for (let x = 12; x < 52; x++) {
			const isFrame = x === 12 || x === 51 || y === 10 || y === 53;
			if (isFrame) {
				setPixel(tex, x, y, 80, 60, 30);
			} else {
				// Poster interior — dark greenish tint
				const v = 40 + Math.floor(Math.random() * 20);
				setPixel(tex, x, y, v, v + 15, v + 5);
			}
		}
	}

	return tex;
}

/** Theater double door — tall dark wooden panels with handles. */
function generateDoubleDoor(): ImageData {
	const tex = createTex();
	const rng = seededRand(666);

	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			// Dark wood base
			const grain = Math.sin(y * 0.8 + rng() * 0.5) * 8;
			const base = 45 + Math.floor(grain + rng() * 6);
			setPixel(tex, x, y, base + 10, base - 2, base - 15);
		}
	}

	// Center seam (door split)
	for (let y = 0; y < TEX_SIZE; y++) {
		setPixel(tex, 31, y, 15, 12, 10);
		setPixel(tex, 32, y, 15, 12, 10);
	}

	// Panel insets — left door
	for (const [py0, py1] of [[4, 28], [32, 58]]) {
		for (let y = py0; y < py1; y++) {
			for (let x = 4; x < 30; x++) {
				const edge = x === 4 || x === 29 || y === py0 || y === py1 - 1;
				if (edge) {
					setPixel(tex, x, y, 30, 24, 18);
				} else {
					// Slightly recessed panel
					const v = 38 + Math.floor(rng() * 6);
					setPixel(tex, x, y, v + 8, v - 3, v - 16);
				}
			}
		}
	}

	// Panel insets — right door
	for (const [py0, py1] of [[4, 28], [32, 58]]) {
		for (let y = py0; y < py1; y++) {
			for (let x = 34; x < 60; x++) {
				const edge = x === 34 || x === 59 || y === py0 || y === py1 - 1;
				if (edge) {
					setPixel(tex, x, y, 30, 24, 18);
				} else {
					const v = 38 + Math.floor(rng() * 6);
					setPixel(tex, x, y, v + 8, v - 3, v - 16);
				}
			}
		}
	}

	// Door handles (small gold circles)
	for (let dy = -1; dy <= 1; dy++) {
		for (let dx = -1; dx <= 1; dx++) {
			if (dx * dx + dy * dy <= 1) {
				setPixel(tex, 27 + dx, 34 + dy, 180, 150, 50);
				setPixel(tex, 36 + dx, 34 + dy, 180, 150, 50);
			}
		}
	}

	// Top arch hint — slight lighter line
	for (let x = 2; x < 62; x++) {
		const cy = 2 - Math.floor(Math.sin((x / 62) * Math.PI) * 2);
		if (cy >= 0) {
			setPixel(tex, x, cy, 65, 55, 40);
		}
	}

	return tex;
}

/** Maze panel wall — dark industrial panels with subtle grooves. */
function generateMazePanel(): ImageData {
	const tex = createTex();
	const rng = seededRand(333);

	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			const base = 35 + Math.floor(rng() * 12) - 6;
			// Horizontal panel seams every 16 pixels
			const seam = y % 16 < 1;
			// Vertical grooves every 32 pixels
			const groove = x % 32 < 1;
			if (seam || groove) {
				setPixel(tex, x, y, base - 18, base - 18, base - 15);
			} else {
				// Slight rust/stain variation
				const stain = Math.sin(x * 0.2 + y * 0.15) * 5;
				setPixel(tex, x, y, base + Math.floor(stain), base - 4, base - 6);
			}
		}
	}

	return tex;
}

/** Entrance archway — dark opening. */
function generateEntrance(): ImageData {
	const tex = createTex();
	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			// Arch shape
			const cx = x - TEX_SIZE / 2;
			const isArch = y < 10 && Math.sqrt(cx * cx + (y - 10) * (y - 10)) < 25;
			const isSide = x < 8 || x >= 56;
			if (isSide || isArch) {
				setPixel(tex, x, y, 100, 90, 80);
			} else {
				// Dark void
				setPixel(tex, x, y, 5, 5, 8);
			}
		}
	}

	return tex;
}

/** Vortex poster — сплошная fleshy asymmetric spiral, no frame, fills whole tile. */
function generateVortexPoster(): ImageData {
	const tex = createTex();
	const rng = seededRand(33);

	// Offset center for asymmetry
	const ocx = 30 + rng() * 4;
	const ocy = 28 + rng() * 6;

	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			const cx = x - ocx;
			const cy = y - ocy;
			const dist = Math.sqrt(cx * cx + cy * cy);
			const angle = Math.atan2(cy, cx);

			// Asymmetric multi-arm spiral — different rates per arm
			const s1 = (Math.sin(angle * 2.3 + dist * 0.35) * 0.5 + 0.5) ** 2;
			const s2 = (Math.sin(angle * 1.7 - dist * 0.28 + 1) * 0.5 + 0.5) ** 3;
			const s3 = (Math.cos(angle * 3.1 + dist * 0.5 + 2.5) * 0.5 + 0.5) ** 2.5;
			const arm = Math.max(s1, s2 * 0.7, s3 * 0.5);

			// Organic edge warp — no clean circle
			const edgeNoise = Math.sin(angle * 5.3) * 4 + Math.cos(angle * 3.7) * 3;
			const edgeDist = 38 + edgeNoise;
			const fade = Math.max(0, 1 - dist / edgeDist);
			const centerPull = Math.max(0, 1 - dist / 10);
			const noise = rng() * 10;

			// Grayish dark-pink-brown fleshy base (never black)
			const r = Math.floor(78 + arm * fade * 50 + centerPull * 20 + noise);
			const g = Math.floor(55 + arm * fade * 25 + centerPull * 10 + noise * 0.4);
			const b = Math.floor(52 + arm * fade * 18 + centerPull * 8 + noise * 0.3);
			setPixel(tex, x, y, r, g, b);
		}
	}

	return tex;
}

/** Floor texture — herringbone wooden parquet. */
export function generateFloor(): ImageData {
	const tex = createTex();
	const rng = seededRand(111);

	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			// Herringbone pattern: alternating diagonal slats
			const blockX = Math.floor(x / 8);
			const blockY = Math.floor(y / 8);
			const isEven = (blockX + blockY) % 2 === 0;
			const lx = x % 8;
			const ly = y % 8;

			// Wood grain direction alternates per block
			const grain = isEven
				? Math.sin((lx + ly) * 1.2) * 8
				: Math.sin((lx - ly) * 1.2) * 8;

			// Seam lines between slats
			const seamH = ly === 0;
			const seamV = lx === 0;

			// Warm wood base — varies per block for plank variation
			const blockSeed = rng() * 20 - 10;
			const base = 75 + grain + blockSeed;

			if (seamH || seamV) {
				setPixel(tex, x, y, Math.max(0, base - 30), Math.max(0, base - 35), Math.max(0, base - 40));
			} else {
				setPixel(tex, x, y, Math.min(255, Math.max(0, base + 15)), Math.min(255, Math.max(0, base - 5)), Math.min(255, Math.max(0, base - 20)));
			}
		}
	}

	return tex;
}

/** Red carpet/rug texture — theater center aisle. */
export function generateRug(): ImageData {
	const tex = createTex();
	const rng = seededRand(333);

	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			const noise = rng() * 12 - 6;

			// Gold border trim (2px edges)
			const onEdge = x < 3 || x >= TEX_SIZE - 3;
			if (onEdge) {
				const g = 130 + noise;
				setPixel(tex, x, y, Math.max(0, Math.min(255, g + 20)), Math.max(0, Math.min(255, g - 10)), Math.max(0, Math.min(255, 20 + noise)));
				continue;
			}

			// Deep red carpet body with subtle pile texture
			const pile = Math.sin(x * 0.8) * Math.sin(y * 0.8) * 6;
			setPixel(tex, x, y, Math.max(0, Math.min(255, 100 + pile + noise)), Math.max(0, Math.min(255, 12 + noise * 0.3)), Math.max(0, Math.min(255, 15 + noise * 0.3)));
		}
	}

	return tex;
}

/** Ceiling texture — dark plaster. */
export function generateCeiling(): ImageData {
	const tex = createTex();
	const rng = seededRand(222);
	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			const base = 45 + Math.floor(rng() * 15) - 7;
			setPixel(tex, x, y, base, base - 2, base - 5);
		}
	}

	return tex;
}

// ── Texture atlas ───────────────────────────────────────────────

export type TextureAtlas = Map<number, ImageData>;

// ── Stick-figure drawing helpers for life-cycle walls ────────────

function drawStickFigure(
	tex: ImageData,
	ox: number,
	oy: number,
	scale: number,
	cr: number,
	cg: number,
	cb: number,
): void {
	// Head
	const hr = Math.floor(3 * scale);
	for (let dy = -hr; dy <= hr; dy++) {
		for (let dx = -hr; dx <= hr; dx++) {
			if (dx * dx + dy * dy <= hr * hr) {
				setPixel(tex, ox + dx, oy + dy, cr, cg, cb);
			}
		}
	}

	// Body
	const bodyLength = Math.floor(10 * scale);
	for (let i = 0; i < bodyLength; i++) {
		setPixel(tex, ox, oy + hr + i, cr, cg, cb);
	}

	// Arms
	const armLength = Math.floor(5 * scale);
	const armY = oy + hr + Math.floor(3 * scale);
	for (let i = 1; i <= armLength; i++) {
		setPixel(tex, ox - i, armY + Math.floor(i * 0.3), cr, cg, cb);
		setPixel(tex, ox + i, armY + Math.floor(i * 0.3), cr, cg, cb);
	}

	// Legs
	const legLength = Math.floor(6 * scale);
	const legY = oy + hr + bodyLength;
	for (let i = 1; i <= legLength; i++) {
		setPixel(tex, ox - Math.floor(i * 0.5), legY + i, cr, cg, cb);
		setPixel(tex, ox + Math.floor(i * 0.5), legY + i, cr, cg, cb);
	}
}

function renderGlyph(tex: ImageData, glyph: number[], px: number, ty: number, cr: number, cg: number, cb: number): void {
	for (let row = 0; row < 5; row++) {
		for (let col = 0; col < 3; col++) {
			if (glyph[row] & (1 << (2 - col))) {
				setPixel(tex, px + col, ty + row, cr, cg, cb);
			}
		}
	}
}

function drawText(tex: ImageData, text: string, startX: number, ty: number, cr: number, cg: number, cb: number): void {
	// Tiny 3x5 pixel font for uppercase Latin + Cyrillic subset
	const glyphs: Record<string, number[]> = {
		// Latin capitals used in life labels
		Р: [0b111, 0b101, 0b111, 0b100, 0b100], // Р
		О: [0b010, 0b101, 0b101, 0b101, 0b010], // О
		Ж: [0b101, 0b101, 0b010, 0b101, 0b101], // Ж
		Д: [0b011, 0b011, 0b101, 0b101, 0b111], // Д
		Е: [0b111, 0b100, 0b110, 0b100, 0b111], // Е
		Н: [0b101, 0b101, 0b111, 0b101, 0b101], // Н
		И: [0b101, 0b101, 0b101, 0b111, 0b101], // И
		С: [0b011, 0b100, 0b100, 0b100, 0b011], // С
		Т: [0b111, 0b010, 0b010, 0b010, 0b010], // Т
		Ь: [0b100, 0b100, 0b110, 0b101, 0b110], // Ь
		У: [0b101, 0b101, 0b011, 0b001, 0b110], // У
		М: [0b101, 0b111, 0b111, 0b101, 0b101], // М
		В: [0b110, 0b101, 0b110, 0b101, 0b110], // В
		А: [0b010, 0b101, 0b111, 0b101, 0b101], // А
		Ч: [0b101, 0b101, 0b011, 0b001, 0b001], // Ч
		З: [0b111, 0b001, 0b011, 0b001, 0b111], // З
	};
	let px = startX;
	for (const ch of text) {
		const g = glyphs[ch];
		if (g) {
			renderGlyph(tex, g, px, ty, cr, cg, cb);
		}

		px += 4;
	}
}

/** Life-cycle wall: generic dark wall with stick figure and label. */
function generateLifeWall(label: string, figScale: number, figTint: [number, number, number], bgTint: [number, number, number]): ImageData {
	const tex = createTex();
	const rng = seededRand(label.length * 17 + 3);

	// Background
	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			const noise = Math.floor(rng() * 10) - 5;
			setPixel(tex, x, y, bgTint[0] + noise, bgTint[1] + noise, bgTint[2] + noise);
		}
	}

	// Stick figure centered
	drawStickFigure(tex, 32, 12, figScale, figTint[0], figTint[1], figTint[2]);

	// Label text at bottom
	const textWidth = label.length * 4;
	const textX = Math.floor((TEX_SIZE - textWidth) / 2);
	drawText(tex, label, textX, 56, figTint[0], figTint[1], figTint[2]);

	return tex;
}

/** Exit tile — bright white square. */
function generateExitWall(): ImageData {
	const tex = createTex();
	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			const border = x < 2 || x >= 62 || y < 2 || y >= 62;
			if (border) {
				setPixel(tex, x, y, 200, 200, 210);
			} else {
				setPixel(tex, x, y, 240, 240, 245);
			}
		}
	}

	return tex;
}

/** Rear door — ornate theater entrance doors, reddish wood with brass fittings. */
function generateRearDoor(): ImageData {
	const tex = createTex();
	const rng = seededRand(888);

	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			// Reddish-brown wood base
			const grain = Math.sin(y * 0.6 + rng() * 0.4) * 6;
			const base = 55 + Math.floor(grain + rng() * 5);
			setPixel(tex, x, y, base + 20, base - 5, base - 18);
		}
	}

	// Center seam
	for (let y = 0; y < TEX_SIZE; y++) {
		setPixel(tex, 31, y, 25, 18, 14);
		setPixel(tex, 32, y, 25, 18, 14);
	}

	// Decorative panels — arched top insets
	for (const xOff of [5, 35]) {
		for (let y = 3; y < 56; y++) {
			for (let x = xOff; x < xOff + 24; x++) {
				// Arch at top of panel
				const pcx = xOff + 12;
				const inArch = y < 12 && Math.sqrt((x - pcx) ** 2 + (y - 12) ** 2) > 12;
				if (inArch) {
					continue;
				}

				const edge = x === xOff || x === xOff + 23 || y === 55
					|| (y < 12 && Math.abs(Math.sqrt((x - pcx) ** 2 + (y - 12) ** 2) - 12) < 1);
				if (edge) {
					setPixel(tex, x, y, 40, 30, 22);
				} else {
					const v = 48 + Math.floor(rng() * 5);
					setPixel(tex, x, y, v + 18, v - 6, v - 20);
				}
			}
		}
	}

	// Brass door handles (larger, ornate)
	for (let dy = -2; dy <= 2; dy++) {
		for (let dx = -2; dx <= 2; dx++) {
			if (dx * dx + dy * dy <= 4) {
				setPixel(tex, 26 + dx, 32 + dy, 200, 170, 60);
				setPixel(tex, 37 + dx, 32 + dy, 200, 170, 60);
			}
		}
	}

	// Brass kick plate at bottom
	for (let y = 58; y < 63; y++) {
		for (let x = 3; x < 61; x++) {
			const v = 150 + Math.floor(rng() * 15);
			setPixel(tex, x, y, v, v - 20, Math.floor(v * 0.3));
		}
	}

	return tex;
}

/**
 * Generate a procedural theater poster on a green easel stand.
 * Each call with a different seed produces a unique poster.
 */
export function generateTheaterPoster(seed: number): ImageData {
	const tex = createTex();
	const rng = seededRand(seed);

	// Transparent background
	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			setPixel(tex, x, y, 0, 0, 0, 0);
		}
	}

	// Green easel stand legs
	const cx = 32;
	for (let y = 35; y < 64; y++) {
		const spread = Math.floor((y - 35) * 0.3);
		setPixel(tex, cx - 4 - spread, y, 40, 70, 35);
		setPixel(tex, cx - 3 - spread, y, 45, 75, 40);
		setPixel(tex, cx + 3 + spread, y, 40, 70, 35);
		setPixel(tex, cx + 4 + spread, y, 45, 75, 40);
	}

	// Crossbar
	for (let x = cx - 8; x <= cx + 8; x++) {
		setPixel(tex, x, 48, 50, 80, 45);
	}

	// Poster board (on easel)
	const pw = 30;
	const ph = 32;
	const px = cx - Math.floor(pw / 2);
	const py = 3;

	// Pick a color scheme
	const schemes = [
		{bg: [20, 15, 35], accent: [180, 50, 40]}, // Dark purple + red
		{bg: [35, 15, 10], accent: [220, 180, 50]}, // Dark brown + gold
		{bg: [10, 20, 35], accent: [100, 180, 200]}, // Navy + cyan
		{bg: [30, 10, 15], accent: [200, 100, 80]}, // Dark crimson + salmon
		{bg: [15, 25, 15], accent: [180, 200, 80]}, // Forest + lime
	];
	const scheme = schemes[Math.floor(rng() * schemes.length)];

	// Poster background
	for (let y = py; y < py + ph; y++) {
		for (let x = px; x < px + pw; x++) {
			if (x >= 0 && x < TEX_SIZE && y >= 0 && y < TEX_SIZE) {
				const n = rng() * 8 - 4;
				setPixel(tex, x, y, Math.max(0, Math.min(255, scheme.bg[0] + n)), Math.max(0, Math.min(255, scheme.bg[1] + n)), Math.max(0, Math.min(255, scheme.bg[2] + n)));
			}
		}
	}

	// Border frame
	for (let x = px; x < px + pw; x++) {
		if (x >= 0 && x < TEX_SIZE) {
			setPixel(tex, x, py, 80, 65, 35);
			setPixel(tex, x, py + ph - 1, 80, 65, 35);
		}
	}

	for (let y = py; y < py + ph; y++) {
		setPixel(tex, Math.max(0, px), y, 80, 65, 35);
		setPixel(tex, Math.min(63, px + pw - 1), y, 80, 65, 35);
	}

	// Abstract decorative shapes — vary by seed type
	const pattern = Math.floor(rng() * 4);
	const ar = scheme.accent[0];
	const ag = scheme.accent[1];
	const ab = scheme.accent[2];
	drawPosterPattern(tex, pattern, px, py, pw, ph, ar, ag, ab, rng);

	// Title area — horizontal line under top
	for (let x = px + 4; x < px + pw - 4; x++) {
		setPixel(tex, x, py + 3, ar, ag, ab);
	}

	return tex;
}

function drawPosterPattern(
	tex: ImageData, pattern: number,
	px: number, py: number, pw: number, ph: number,
	ar: number, ag: number, ab: number,
	rng: () => number,
): void {
	switch (pattern) {
		case 0: {
		// Circle motif
			const r = 6 + Math.floor(rng() * 4);
			const ocx = px + Math.floor(pw / 2);
			const ocy = py + Math.floor(ph / 2) - 2;
			for (let dy = -r; dy <= r; dy++) {
				for (let dx = -r; dx <= r; dx++) {
					const d2 = dx * dx + dy * dy;
					const tx = ocx + dx;
					const ty = ocy + dy;
					if (d2 <= r * r && d2 > (r - 2) * (r - 2)
						&& tx > px && tx < px + pw - 1 && ty > py && ty < py + ph - 1) {
						setPixel(tex, tx, ty, ar, ag, ab);
					}
				}
			}

			break;
		}

		case 1: {
		// Diagonal stripes
			for (let y = py + 2; y < py + ph - 2; y++) {
				for (let x = px + 2; x < px + pw - 2; x++) {
					if ((x + y) % 6 < 2) {
						setPixel(tex, x, y, ar, ag, ab);
					}
				}
			}

			break;
		}

		case 2: {
		// Star / diamond
			const mid = px + Math.floor(pw / 2);
			const midy = py + Math.floor(ph / 2) - 2;
			for (let dy = -8; dy <= 8; dy++) {
				for (let dx = -8; dx <= 8; dx++) {
					const manhattan = Math.abs(dx) + Math.abs(dy);
					const tx = mid + dx;
					const ty = midy + dy;
					if (manhattan <= 8 && manhattan >= 5
						&& tx > px && tx < px + pw - 1 && ty > py && ty < py + ph - 1) {
						setPixel(tex, tx, ty, ar, ag, ab);
					}
				}
			}

			break;
		}

		default: {
		// Horizontal bars
			for (let i = 0; i < 3; i++) {
				const by = py + 5 + i * 8;
				for (let x = px + 3; x < px + pw - 3; x++) {
					if (by < py + ph - 2) {
						setPixel(tex, x, by, ar, ag, ab);
						setPixel(tex, x, by + 1, ar, ag, ab);
					}
				}
			}
		}
	}
}

/** Empty green easel stand — no poster board. */
export function generateEmptyEasel(): ImageData {
	const tex = createTex();

	// Transparent background
	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			setPixel(tex, x, y, 0, 0, 0, 0);
		}
	}

	const cx = 32;
	// Legs
	for (let y = 20; y < 64; y++) {
		const spread = Math.floor((y - 20) * 0.35);
		setPixel(tex, cx - 4 - spread, y, 40, 70, 35);
		setPixel(tex, cx - 3 - spread, y, 45, 75, 40);
		setPixel(tex, cx + 3 + spread, y, 40, 70, 35);
		setPixel(tex, cx + 4 + spread, y, 45, 75, 40);
	}

	// Crossbar
	for (let x = cx - 10; x <= cx + 10; x++) {
		setPixel(tex, x, 38, 50, 80, 45);
	}

	// Top ledge
	for (let x = cx - 6; x <= cx + 6; x++) {
		setPixel(tex, x, 20, 55, 85, 50);
		setPixel(tex, x, 21, 50, 80, 45);
	}

	return tex;
}

/** Build all wall textures. Keyed by Tile enum value. */
/** Velvet rope barrier — red velvet ropes on brass posts. */
function generateVelvetRope(): ImageData {
	const tex = createTex();
	const rng = seededRand(777);

	// Dark background (lobby floor visible behind)
	for (let y = 0; y < TEX_SIZE; y++) {
		for (let x = 0; x < TEX_SIZE; x++) {
			const base = 25 + Math.floor(rng() * 8) - 4;
			setPixel(tex, x, y, base, base - 2, base - 5);
		}
	}

	// Two brass posts
	for (const px of [14, 50]) {
		for (let y = 8; y < 60; y++) {
			for (let dx = -2; dx <= 2; dx++) {
				const shine = Math.abs(dx) < 2 ? 30 : 0;
				setPixel(tex, px + dx, y, 160 + shine, 130 + shine, 40);
			}
		}

		// Post caps (brass ball)
		for (let dy = -3; dy <= 0; dy++) {
			for (let dx = -3; dx <= 3; dx++) {
				if (dx * dx + dy * dy <= 9) {
					setPixel(tex, px + dx, 8 + dy, 190, 160, 55);
				}
			}
		}

		// Post bases
		for (let dx = -3; dx <= 3; dx++) {
			setPixel(tex, px + dx, 59, 140, 110, 35);
			setPixel(tex, px + dx, 60, 150, 120, 40);
		}
	}

	// Red velvet rope — catenary curve between posts
	for (let x = 16; x <= 48; x++) {
		const t = (x - 16) / 32;
		const sag = Math.sin(t * Math.PI) * 8;
		const ropeY = Math.floor(24 + sag);
		for (let dy = -2; dy <= 2; dy++) {
			const fold = Math.sin((x + dy) * 0.5) * 0.3 + 0.7;
			const base = Math.floor(140 * fold);
			setPixel(tex, x, ropeY + dy, base, Math.floor(base * 0.12), Math.floor(base * 0.1));
		}
	}

	return tex;
}

export function buildTextureAtlas(): TextureAtlas {
	const atlas: TextureAtlas = new Map();
	atlas.set(1, generateStoneWall());
	atlas.set(2, generatePosterWall());
	atlas.set(3, generateDarkWall());
	atlas.set(4, generateBrickWall());
	atlas.set(5, generateRedCurtain());
	atlas.set(6, generateEntrance());
	atlas.set(7, generateVortexPoster());
	// Life-cycle maze walls
	atlas.set(8, generateLifeWall('\u0420\u041E\u0416\u0414\u0415\u041D', 0.6, [180, 170, 150], [35, 30, 28])); // РОЖДЕН
	atlas.set(9, generateLifeWall('\u0420\u041E\u0421\u0422', 0.8, [160, 150, 130], [32, 28, 25])); // РОСТ
	atlas.set(10, generateLifeWall('\u0416\u0418\u0412', 1, [140, 130, 110], [30, 26, 23])); // ЖИВ
	atlas.set(11, generateLifeWall('\u0423\u0412\u0410\u0414', 0.9, [110, 100, 85], [28, 24, 22])); // УВАД
	atlas.set(12, generateLifeWall('\u0421\u0422\u0410\u0420', 0.7, [90, 80, 70], [25, 22, 20])); // СТАР
	atlas.set(13, generateLifeWall('\u041C\u0415\u0420\u0422\u0412', 0.5, [65, 55, 50], [18, 15, 13])); // МЕРТВ
	atlas.set(14, generateExitWall());
	atlas.set(15, generateMazePanel());
	atlas.set(16, generateDoubleDoor());
	atlas.set(17, generateRearDoor());
	atlas.set(18, generateVelvetRope());
	return atlas;
}
