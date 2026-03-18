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
