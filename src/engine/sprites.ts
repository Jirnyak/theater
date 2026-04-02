// === Procedural sprite generation ===
// Generates pixel-art sprites for the Theater characters at runtime.
// All sprites are 64×64 ImageData with transparency.

const SPRITE_SIZE = 64;

function createSprite(): ImageData {
	return new ImageData(SPRITE_SIZE, SPRITE_SIZE);
}

function setPixel(img: ImageData, x: number, y: number, r: number, g: number, b: number, a = 255): void {
	if (x < 0 || x >= img.width || y < 0 || y >= img.height) {
		return;
	}

	const i = (y * img.width + x) * 4;
	img.data[i] = r;
	img.data[i + 1] = g;
	img.data[i + 2] = b;
	img.data[i + 3] = a;
}

function fillRect(img: ImageData, x0: number, y0: number, w: number, h: number, r: number, g: number, b: number): void {
	for (let y = y0; y < y0 + h; y++) {
		for (let x = x0; x < x0 + w; x++) {
			setPixel(img, x, y, r, g, b);
		}
	}
}

function fillEllipse(img: ImageData, cx: number, cy: number, rx: number, ry: number, r: number, g: number, b: number): void {
	for (let y = cy - ry; y <= cy + ry; y++) {
		for (let x = cx - rx; x <= cx + rx; x++) {
			const dx = (x - cx) / rx;
			const dy = (y - cy) / ry;
			if (dx * dx + dy * dy <= 1) {
				setPixel(img, Math.floor(x), Math.floor(y), r, g, b);
			}
		}
	}
}

/**
 * The Usher (Билетер) — bald man, red jacket, white shirt, black pants.
 * "Unconvincingly drawn" European man with big red lips, emotionless face.
 */
export function generateUsher(): ImageData {
	const s = createSprite();

	// Black pants (legs)
	fillRect(s, 24, 46, 7, 14, 20, 20, 25);
	fillRect(s, 33, 46, 7, 14, 20, 20, 25);

	// Shoes
	fillRect(s, 23, 58, 9, 4, 15, 12, 10);
	fillRect(s, 32, 58, 9, 4, 15, 12, 10);

	// White shirt (torso center)
	fillRect(s, 27, 28, 10, 18, 220, 215, 210);

	// Red jacket
	fillRect(s, 21, 28, 6, 18, 180, 30, 25);
	fillRect(s, 37, 28, 6, 18, 180, 30, 25);

	// Arms (red jacket sleeves)
	fillRect(s, 17, 30, 5, 16, 170, 28, 22);
	fillRect(s, 42, 30, 5, 16, 170, 28, 22);

	// Hands (skin)
	fillRect(s, 17, 44, 5, 4, 210, 180, 150);
	fillRect(s, 42, 44, 5, 4, 210, 180, 150);

	// Head (bald, skin colored)
	fillEllipse(s, 32, 18, 9, 10, 215, 185, 155);

	// Eyes (small, dark, emotionless)
	fillRect(s, 27, 16, 3, 2, 30, 25, 20);
	fillRect(s, 34, 16, 3, 2, 30, 25, 20);

	// Nose
	fillRect(s, 31, 19, 2, 3, 195, 165, 135);

	// Big red lips
	fillEllipse(s, 32, 24, 4, 2, 200, 40, 35);

	return s;
}

/** Usher with scared expression — wide eyes, open mouth, running pose. */
export function generateUsherScared(): ImageData {
	const s = generateUsher();

	// Overwrite eyes — wide open (white with small pupil)
	fillRect(s, 26, 15, 5, 3, 235, 235, 235);
	fillRect(s, 33, 15, 5, 3, 235, 235, 235);
	setPixel(s, 28, 16, 20, 15, 10);
	setPixel(s, 35, 16, 20, 15, 10);

	// Open mouth
	fillEllipse(s, 32, 24, 3, 3, 40, 10, 10);

	return s;
}

/**
 * The Vortex-Headed Man (Вихреголовый человек) —
 * Usher's body but with a swirling void instead of a face.
 * The vortex is a black hole of distorted flesh, spiraling inward,
 * with glimpses of teeth, eye fragments, and stretched skin.
 */
export function generateVortexMan(phase = 0): ImageData {
	const s = createSprite();

	// Same body as usher but darker, wronger
	// Black pants
	fillRect(s, 24, 46, 7, 14, 15, 15, 18);
	fillRect(s, 33, 46, 7, 14, 15, 15, 18);

	// Shoes
	fillRect(s, 23, 58, 9, 4, 10, 8, 8);
	fillRect(s, 32, 58, 9, 4, 10, 8, 8);

	// White shirt (yellowed, stained)
	fillRect(s, 27, 28, 10, 18, 170, 160, 130);

	// Red jacket (darker, almost maroon)
	fillRect(s, 21, 28, 6, 18, 100, 12, 10);
	fillRect(s, 37, 28, 6, 18, 100, 12, 10);

	// Arms
	fillRect(s, 17, 30, 5, 16, 90, 10, 8);
	fillRect(s, 42, 30, 5, 16, 90, 10, 8);

	// Hands (pale, dead-looking)
	fillRect(s, 17, 44, 5, 4, 140, 130, 120);
	fillRect(s, 42, 44, 5, 4, 140, 130, 120);

	// Neck stump — torn red flesh where head meets vortex
	for (let y = 26; y < 30; y++) {
		for (let x = 26; x < 38; x++) {
			const v = 60 + Math.floor(Math.sin(x * 1.7 + y) * 30);
			setPixel(s, x, y, v + 40, v >> 2, v >> 3);
		}
	}

	// ── VORTEX HEAD — eerie spiral-distorted face ─────────────
	// Skin-tone face being sucked inward into a spiral; uncanny,
	// no red — pallid flesh tones, smeared features, faint eye glints.
	const headCx = 32;
	const headCy = 16;
	const headR = 13;

	for (let y = 2; y < 30; y++) {
		for (let x = 18; x < 46; x++) {
			const dx = x - headCx;
			const dy = y - headCy;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist > headR) {
				continue;
			}

			const normDist = dist / headR;
			const angle = Math.atan2(dy, dx);

			// Spiral warp — positions get dragged inward
			const spiralA = angle + dist * 0.7 + phase * 0.4;
			const spiral2 = angle * 1.5 - dist * 0.9 + phase * 0.25;

			// Skin base: pallid warm gray at edge, darker toward center
			const skinBase = 0.3 + normDist * 0.7;
			const baseR = skinBase * 175;
			const baseG = skinBase * 150;
			const baseB = skinBase * 130;

			// Spiral grooves — creases in skin being pulled inward
			const groove1 = (Math.sin(spiralA * 3.5) * 0.5 + 0.5) ** 3;
			const groove2 = (Math.sin(spiral2 * 2.8 + 0.7) * 0.5 + 0.5) ** 4 * 0.5;
			const grooveDepth = (groove1 + groove2) * (1 - normDist * 0.4);

			// Eye sockets — smeared by spiral, dark hollows
			const eyeLx = dx + 4 + Math.sin(phase * 0.3) * 0.5;
			const eyeLy = dy + 1;
			const eyeRx = dx - 4 - Math.sin(phase * 0.3) * 0.5;
			const eyeRy = dy + 1;
			const eyeDistL = Math.sqrt(eyeLx * eyeLx + eyeLy * eyeLy);
			const eyeDistR = Math.sqrt(eyeRx * eyeRx + eyeRy * eyeRy);
			const socketL = eyeDistL < 3.5 ? (1 - eyeDistL / 3.5) ** 1.5 : 0;
			const socketR = eyeDistR < 3.5 ? (1 - eyeDistR / 3.5) ** 1.5 : 0;
			const socketDark = (socketL + socketR) * 0.7;

			// Tiny eye glints — pinpoints of pale light
			const glintL = eyeDistL < 1.2 ? (1 - eyeDistL / 1.2) * 0.6 : 0;
			const glintR = eyeDistR < 1.2 ? (1 - eyeDistR / 1.2) * 0.6 : 0;
			const glint = glintL + glintR;

			// Mouth shadow — slightly open, dark slit
			const mouthDy = dy - 5;
			const mouthShadow = (mouthDy > -1 && mouthDy < 2 && Math.abs(dx) < 4)
				? (1 - Math.abs(mouthDy) / 2) * (1 - Math.abs(dx) / 4) * 0.5
				: 0;

			// Compose color
			let r = baseR;
			let g = baseG;
			let b = baseB;

			// Spiral grooves — darken and shift toward gray-brown
			r -= grooveDepth * 60;
			g -= grooveDepth * 55;
			b -= grooveDepth * 45;

			// Eye socket darkness
			r -= socketDark * 120;
			g -= socketDark * 110;
			b -= socketDark * 90;

			// Eye glints — cold pale
			r += glint * 160;
			g += glint * 155;
			b += glint * 140;

			// Mouth shadow
			r -= mouthShadow * 80;
			g -= mouthShadow * 75;
			b -= mouthShadow * 60;

			// Center darkness — void pulling inward
			const centerPull = Math.max(0, 1 - normDist * 2.2);
			r -= centerPull * 90;
			g -= centerPull * 80;
			b -= centerPull * 70;

			// Subtle skin noise for organic feel
			const noise = (Math.sin(x * 11.3 + y * 8.7 + phase) * 0.5 + 0.5) * 8;
			r += noise - 4;
			g += noise - 4;
			b += noise - 4;

			setPixel(s, x, y, Math.min(255, Math.max(0, Math.floor(r))), Math.min(255, Math.max(0, Math.floor(g))), Math.min(255, Math.max(0, Math.floor(b))));
		}
	}

	// Outer border — subtle skin-tone darkening
	for (let a = 0; a < Math.PI * 2; a += 0.05) {
		const edgeR = headR + Math.sin(a * 7 + phase);
		const ex = Math.floor(headCx + Math.cos(a) * edgeR);
		const ey = Math.floor(headCy + Math.sin(a) * edgeR);
		setPixel(s, ex, ey, 80, 65, 55);
		setPixel(s, ex + (Math.random() > 0.5 ? 1 : -1), ey, 60, 50, 42);
	}

	return s;
}

/**
 * Generate an array of vortex frames for animation.
 * Each frame has slight spiral rotation, making the face writhe.
 */
export function generateVortexFrames(count = 8): ImageData[] {
	const frames: ImageData[] = [];
	for (let i = 0; i < count; i++) {
		frames.push(generateVortexMan(i * (Math.PI * 2 / count)));
	}

	return frames;
}

/**
 * Vortex-Headed Man — corner flash variant.
 * Larger vortex, more contrast, optimized for split-second terror.
 */
export function generateVortexManFlash(): ImageData {
	const base = generateVortexMan(Math.random() * Math.PI * 2);
	// High contrast — crush blacks, boost flesh
	for (let i = 0; i < base.data.length; i += 4) {
		if (base.data[i + 3] > 0) {
			// Boost reds, crush darks
			base.data[i] = Math.min(255, Math.floor(base.data[i] * 1.4));
			base.data[i + 1] = Math.floor(base.data[i + 1] * 0.4);
			base.data[i + 2] = Math.floor(base.data[i + 2] * 0.3);
		}
	}

	return base;
}

/** Normal person — civilian in the theater lobby queue. Variant 0-5 for variety. */
export function generateNormalPerson(variant: number): ImageData {
	const s = createSprite();
	const rng = variant;

	// Color palettes for variety
	const jackets = [
		[70, 70, 80], // Dark gray
		[50, 40, 30], // Brown
		[30, 40, 60], // Navy
		[60, 30, 30], // Maroon
		[40, 50, 40], // Olive
		[80, 70, 60], // Tan
	];
	const skins = [
		[210, 180, 150],
		[200, 170, 140],
		[190, 160, 130],
		[220, 190, 160],
		[195, 165, 135],
		[215, 185, 155],
	];
	const jacket = jackets[rng % jackets.length];
	const skin = skins[rng % skins.length];
	const isWoman = rng % 3 === 0;

	// Pants / skirt
	const pantsColor = isWoman ? [40, 30, 35] : [25, 25, 30];
	const pantsH = isWoman ? 10 : 14;
	fillRect(s, 24, 60 - pantsH, 7, pantsH, pantsColor[0], pantsColor[1], pantsColor[2]);
	fillRect(s, 33, 60 - pantsH, 7, pantsH, pantsColor[0], pantsColor[1], pantsColor[2]);

	// Shoes
	fillRect(s, 23, 58, 9, 4, 20, 15, 12);
	fillRect(s, 32, 58, 9, 4, 20, 15, 12);

	// Torso
	fillRect(s, 23, 28, 18, 18, jacket[0], jacket[1], jacket[2]);

	// Arms
	fillRect(s, 18, 30, 5, 14, jacket[0] - 5, jacket[1] - 5, jacket[2] - 5);
	fillRect(s, 41, 30, 5, 14, jacket[0] - 5, jacket[1] - 5, jacket[2] - 5);

	// Hands
	fillRect(s, 18, 42, 5, 4, skin[0], skin[1], skin[2]);
	fillRect(s, 41, 42, 5, 4, skin[0], skin[1], skin[2]);

	// Head
	fillEllipse(s, 32, 18, 8, 9, skin[0], skin[1], skin[2]);

	// Hair
	const hairColor = rng % 2 === 0 ? [40, 30, 20] : [80, 60, 40];
	if (isWoman) {
		// Longer hair
		fillEllipse(s, 32, 14, 9, 6, hairColor[0], hairColor[1], hairColor[2]);
		fillRect(s, 23, 14, 4, 12, hairColor[0], hairColor[1], hairColor[2]);
		fillRect(s, 37, 14, 4, 12, hairColor[0], hairColor[1], hairColor[2]);
	} else {
		fillEllipse(s, 32, 13, 8, 5, hairColor[0], hairColor[1], hairColor[2]);
	}

	// Faceless — no eyes, no mouth. Just smooth skin for uncanny alienation.

	return s;
}

/**
 * Scary rushing face — wide grinning mouth, hollow eyes, pale skin.
 * Designed for the Stage 3 corridor chase — fills the frame as it approaches.
 */
export function generateScaryFace(phase = 0): ImageData {
	const s = createSprite();
	const cx = 32;
	const cy = 26;

	// Gaunt, skull-like head — very pale, almost lunar, fills the sprite
	for (let y = 1; y < 62; y++) {
		for (let x = 4; x < 60; x++) {
			const dx = (x - cx + Math.sin(y * 0.4) * 2) / 28;
			const dy = (y - cy) / 31;
			if (dx * dx + dy * dy <= 1) {
				const blotch = Math.sin(x * 5.3 + y * 3.7) * Math.cos(x * 2.1 - y * 6.3);
				const crack = Math.abs(Math.sin(x * 13 + y * 9)) < 0.06 ? -40 : 0;
				const shadow = dy > 0.3 ? Math.floor((dy - 0.3) * 30) : 0;
				const r = Math.floor(180 + blotch * 20 + crack - shadow);
				const g = Math.floor(165 + blotch * 10 + crack - shadow);
				const b = Math.floor(155 + blotch * 6 + crack - shadow);
				setPixel(s, x, y, r, g, b);
			}
		}
	}

	// Massive cavernous eye sockets with spinning vortex spirals
	const leftEcx = cx - 11;
	const rightEcx = cx + 9;
	for (const [ecx, rx, ry] of [[leftEcx, 8, 8], [rightEcx, 9, 7]] as const) {
		const ecy = cy - 6;
		for (let y = ecy - ry; y < ecy + ry; y++) {
			for (let x = ecx - rx; x < ecx + rx; x++) {
				const edx = (x - ecx) / rx;
				const edy = (y - ecy) / ry;
				const d2 = edx * edx + edy * edy;
				if (d2 > 1) {
					continue;
				}

				// Spinning vortex spiral inside the socket
				const dist = Math.sqrt(d2);
				const angle = Math.atan2(edy, edx);
				const spiralA = angle + dist * 5 + phase * 0.5;
				const spiral2 = angle * 1.5 - dist * 4 + phase * 0.3;
				const groove = (Math.sin(spiralA * 3) * 0.5 + 0.5) ** 2;
				const groove2 = (Math.sin(spiral2 * 2.5) * 0.5 + 0.5) ** 3 * 0.4;
				const intensity = (groove + groove2) * (1 - dist * 0.3);
				const centerDark = Math.max(0, 1 - dist * 2.5);

				// Dark void base with spiral highlights in sickly pale tones
				const r = Math.floor(intensity * 140 - centerDark * 60);
				const g = Math.floor(intensity * 110 - centerDark * 50);
				const b = Math.floor(intensity * 90 - centerDark * 40);
				setPixel(s, x, y, Math.max(0, r), Math.max(0, g), Math.max(0, b));
			}
		}
	}

	// Veins radiating from sockets
	for (let angle = 0; angle < Math.PI * 2; angle += 0.5) {
		for (const [ecx, ecy] of [[leftEcx, cy - 6], [rightEcx, cy - 5]]) {
			for (let r = 6; r < 15; r++) {
				const wobble = Math.sin(r * 0.7 + angle * 3) * 0.4;
				const vx = Math.floor(ecx + Math.cos(angle + wobble) * r);
				const vy = Math.floor(ecy + Math.sin(angle + wobble) * r);
				if (vx > 4 && vx < 60 && vy > 1 && vy < 62) {
					setPixel(s, vx, vy, 110, 25, 35);
				}
			}
		}
	}

	// Wide sinister grin — curves up at corners like a Cheshire smile
	const mouthW = 20;
	const grinCy = cy + 14;
	for (let x = cx - mouthW; x <= cx + mouthW; x++) {
		const t = (x - cx) / mouthW;
		// Smile curve: corners go UP (smaller y), center stays low (larger y)
		const smile = Math.floor(3 - t * t * 11);
		const topY = grinCy + smile;
		const gapH = Math.max(2, 8 - Math.floor(Math.abs(t) * 5));

		for (let dy = 0; dy < gapH; dy++) {
			const py = topY + dy;
			if (py < 1 || py >= 62) {
				continue;
			}

			const throatRed = dy > gapH * 0.5 ? Math.floor((dy / gapH) * 35) : 0;
			setPixel(s, x, py, throatRed, 0, 2);
		}

		// Thin cracked lips — top
		if (topY - 1 > 1 && topY - 1 < 62) {
			const lipColor = 90 + Math.floor(Math.sin(x * 4) * 25);
			setPixel(s, x, topY - 1, lipColor, 15, 20);
		}

		// Thin cracked lips — bottom
		const botY = topY + gapH;
		if (botY > 1 && botY < 62) {
			setPixel(s, x, botY, 75 + Math.floor(Math.sin(x * 3) * 20), 10, 14);
		}
	}

	// Jagged teeth filling the grin
	for (let x = cx - mouthW + 2; x <= cx + mouthW - 2; x += 2) {
		const t = (x - cx) / mouthW;
		const smile = Math.floor(3 - t * t * 11);
		const toothBase = grinCy + smile;
		const gapH = Math.max(2, 8 - Math.floor(Math.abs(t) * 5));
		const missing = ((x * 7 + 3) & 0xF) < 2;
		if (missing) {
			continue;
		}

		// Top fangs dropping down
		const fangLength = Math.min(gapH - 1, 2 + ((x * 11 + 7) & 3));
		for (let dy = 0; dy < fangLength; dy++) {
			const shade = 220 - dy * 20;
			if (toothBase + dy >= 1 && toothBase + dy < 62) {
				setPixel(s, x, toothBase + dy, shade, shade - 10, shade - 30);
			}
		}

		// Bottom teeth poking up
		const bottomBase = toothBase + gapH - 1;
		if (bottomBase < 62 && bottomBase > 1) {
			const bottomLength = Math.min(gapH - fangLength, 1 + ((x * 13 + 2) & 1));
			for (let dy = 0; dy < bottomLength; dy++) {
				setPixel(s, x, bottomBase - dy, 200, 190, 160);
			}
		}
	}

	// Collapsed nose — just a dark cavity
	for (let y = cy + 2; y < cy + 7; y++) {
		for (let x = cx - 2; x <= cx + 1; x++) {
			const ndx = (x - cx + 0.5) / 2;
			const ndy = (y - (cy + 4)) / 2.5;
			if (ndx * ndx + ndy * ndy < 1) {
				setPixel(s, x, y, 30, 10, 15);
			}
		}
	}

	// Deep forehead creases
	for (let row = 0; row < 4; row++) {
		const wy = cy - 18 + row * 3;
		for (let x = cx - 14; x <= cx + 14; x++) {
			if (Math.sin(x * 0.9 + row * 1.7) > 0.2) {
				setPixel(s, x, wy, 140, 120, 115);
			}
		}
	}

	// Sunken cheeks — dark shadows
	for (let y = cy; y < cy + 10; y++) {
		for (let x = cx - 20; x < cx - 12; x++) {
			const chk = Math.sin((x - cx + 16) * 0.5) * Math.sin((y - cy) * 0.4);
			if (chk > 0.2) {
				setPixel(s, x, y, 120, 100, 95);
			}
		}

		for (let x = cx + 12; x < cx + 20; x++) {
			const chk = Math.sin((x - cx - 16) * 0.5) * Math.sin((y - cy) * 0.4);
			if (chk > 0.2) {
				setPixel(s, x, y, 120, 100, 95);
			}
		}
	}

	return s;
}

/** Generate animated scary face frames with spinning eye spirals. */
export function generateScaryFaceFrames(count = 12): ImageData[] {
	return Array.from({length: count}, (_, i) =>
		generateScaryFace(i * ((Math.PI * 2) / count)));
}

/** High-contrast scary face for fullscreen flash screamers. */
export function generateScaryFaceFlash(): ImageData {
	const base = generateScaryFace(Math.random() * Math.PI * 2);
	for (let i = 0; i < base.data.length; i += 4) {
		if (base.data[i + 3] > 0) {
			base.data[i] = Math.min(255, Math.floor(base.data[i] * 1.5));
			base.data[i + 1] = Math.floor(base.data[i + 1] * 0.3);
			base.data[i + 2] = Math.floor(base.data[i + 2] * 0.2);
		}
	}

	return base;
}

/** Velvet rope barrier sprite — brass post with red rope. */
export function generateVelvetRopeSprite(): ImageData {
	const s = createSprite();

	// Brass post — center
	const px = 32;
	for (let y = 12; y < 60; y++) {
		for (let dx = -2; dx <= 2; dx++) {
			const shine = Math.abs(dx) < 2 ? 25 : 0;
			setPixel(s, px + dx, y, 155 + shine, 125 + shine, 38);
		}
	}

	// Post cap (brass ball)
	for (let dy = -3; dy <= 1; dy++) {
		for (let dx = -3; dx <= 3; dx++) {
			if (dx * dx + dy * dy <= 9) {
				setPixel(s, px + dx, 12 + dy, 185, 155, 50);
			}
		}
	}

	// Post base
	for (let dx = -4; dx <= 4; dx++) {
		setPixel(s, px + dx, 58, 135, 105, 32);
		setPixel(s, px + dx, 59, 140, 110, 35);
		setPixel(s, px + dx, 60, 130, 100, 30);
	}

	// Red velvet rope — horizontal catenary on both sides
	for (let side = -1; side <= 1; side += 2) {
		for (let i = 0; i < 20; i++) {
			const rx = px + side * (5 + i);
			if (rx < 0 || rx >= 64) {
				continue;
			}

			const sag = Math.sin((i / 19) * Math.PI) * 5;
			const ropeY = Math.floor(22 + sag);
			for (let dy = -2; dy <= 1; dy++) {
				const fold = Math.sin((rx + dy) * 0.5) * 0.3 + 0.7;
				const base = Math.floor(130 * fold);
				setPixel(s, rx, ropeY + dy, base, Math.floor(base * 0.1), Math.floor(base * 0.08));
			}
		}
	}

	return s;
}
