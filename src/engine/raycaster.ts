// === Wolfenstein-style raycasting renderer ===
// DDA algorithm, textured walls, floor/ceiling, fog, sprite billboards.
// Renders to an offscreen canvas at low resolution, then scales up for retro look.

import {
	type Camera, type RayHit, type TileMap, type Sprite,
} from './types';
import {
	type TextureAtlas, generateFloor, generateCeiling, generateRug,
} from './textures';

// ── Internal resolution (retro look) ───────────────────────────
const INTERNAL_W = 320;
const INTERNAL_H = 200;
const TEX_SIZE = 64;

export class Raycaster {
	private readonly offscreen: OffscreenCanvas;
	private readonly ctx: OffscreenCanvasRenderingContext2D;
	private readonly depthBuffer = new Float64Array(INTERNAL_W);

	private textures!: TextureAtlas;
	private floorTex!: ImageData;
	private ceilTex!: ImageData;
	private rugTex!: ImageData;

	// Sprite texture cache: textureId → ImageData
	private readonly spriteTextures = new Map<string, ImageData>();

	// Rug zone (world-space rectangle where rug replaces floor)
	rugZone: {x0: number; y0: number; x1: number; y1: number} | undefined;

	// Fog / darkness
	fogColor: [number, number, number] = [0, 0, 0];
	fogDensity = 0.08;

	// Visual glitch state
	glitchIntensity = 0;

	constructor() {
		this.offscreen = new OffscreenCanvas(INTERNAL_W, INTERNAL_H);
		const c = this.offscreen.getContext('2d', {willReadFrequently: true});
		if (!c) {
			throw new Error('Failed to get 2d context');
		}

		this.ctx = c;
		this.ctx.imageSmoothingEnabled = false;
	}

	/** Load texture atlas + floor/ceiling. Call once at init. */
	init(atlas: TextureAtlas): void {
		this.textures = atlas;
		this.floorTex = generateFloor();
		this.ceilTex = generateCeiling();
		this.rugTex = generateRug();
	}

	/** Register a sprite texture (ImageData) by id. */
	registerSprite(id: string, img: ImageData): void {
		this.spriteTextures.set(id, img);
	}

	/** Update a sprite texture (for animation frames). */
	updateSprite(id: string, img: ImageData): void {
		this.spriteTextures.set(id, img);
	}

	/** Main render call — draws everything onto the target canvas. */
	render(
		target: HTMLCanvasElement,
		camera: Camera,
		map: TileMap,
		sprites: Sprite[],
		darkness = 0,
	): void {
		const fov = Math.PI / 3; // 60 degree FOV
		const halfFov = fov / 2;
		const w = INTERNAL_W;
		const h = INTERNAL_H;

		// Clear to black
		this.ctx.fillStyle = '#000';
		this.ctx.fillRect(0, 0, w, h);

		const imageData = this.ctx.getImageData(0, 0, w, h);
		const {data} = imageData;

		// ── Cast rays for walls ─────────────────────────────────
		for (let col = 0; col < w; col++) {
			const rayAngle = (camera.angle - halfFov) + (col / w) * fov;
			const hit = this.castRay(camera.x, camera.y, rayAngle, map);

			// Fish-eye correction
			const correctedDist = hit.distance * Math.cos(rayAngle - camera.angle);
			this.depthBuffer[col] = correctedDist;

			// Wall height on screen
			const wallHeight = Math.floor(h / correctedDist);
			const drawStart = Math.max(0, Math.floor((h - wallHeight) / 2) + camera.pitch);
			const drawEnd = Math.min(h, Math.floor((h + wallHeight) / 2) + camera.pitch);

			// Get wall texture
			const tex = this.textures.get(hit.tileValue);

			// Draw wall column
			for (let y = drawStart; y < drawEnd; y++) {
				const texY = Math.floor(((y - drawStart) / (drawEnd - drawStart)) * TEX_SIZE) & (TEX_SIZE - 1);
				const texX = Math.floor(hit.wallX * TEX_SIZE) & (TEX_SIZE - 1);

				let r: number;
				let g: number;
				let b: number;

				if (tex) {
					const ti = (texY * TEX_SIZE + texX) * 4;
					r = tex.data[ti];
					g = tex.data[ti + 1];
					b = tex.data[ti + 2];
				} else {
					r = 128;
					g = 128;
					b = 128;
				}

				// Side shading (darker on one axis)
				if (hit.side === 1) {
					r = Math.floor(r * 0.7);
					g = Math.floor(g * 0.7);
					b = Math.floor(b * 0.7);
				}

				// Distance fog
				const fogFactor = Math.min(1, correctedDist * this.fogDensity);
				r = Math.floor(r * (1 - fogFactor) + this.fogColor[0] * fogFactor);
				g = Math.floor(g * (1 - fogFactor) + this.fogColor[1] * fogFactor);
				b = Math.floor(b * (1 - fogFactor) + this.fogColor[2] * fogFactor);

				const pi = (y * w + col) * 4;
				data[pi] = r;
				data[pi + 1] = g;
				data[pi + 2] = b;
				data[pi + 3] = 255;
			}

			// ── Floor & ceiling casting ─────────────────────────
			this.renderFloorCeiling(data, col, drawEnd, drawStart, camera, rayAngle, w, h);
		}

		// ── Render sprites ──────────────────────────────────────
		this.renderSprites(data, camera, sprites, w, h);

		// ── Darkness overlay ────────────────────────────────────
		if (darkness > 0) {
			const alpha = Math.min(1, darkness);
			for (let i = 0; i < data.length; i += 4) {
				data[i] = Math.floor(data[i] * (1 - alpha));
				data[i + 1] = Math.floor(data[i + 1] * (1 - alpha));
				data[i + 2] = Math.floor(data[i + 2] * (1 - alpha));
			}
		}

		// ── Glitch effect ───────────────────────────────────────
		if (this.glitchIntensity > 0) {
			this.applyGlitch(data, w, h);
		}

		this.ctx.putImageData(imageData, 0, 0);

		// ── Scale up to target canvas ───────────────────────────
		const tCtx = target.getContext('2d');
		if (tCtx) {
			tCtx.imageSmoothingEnabled = false;
			tCtx.drawImage(this.offscreen, 0, 0, target.width, target.height);
		}
	}

	// ── DDA raycasting ──────────────────────────────────────────

	private castRay(ox: number, oy: number, angle: number, map: TileMap): RayHit {
		const dirX = Math.cos(angle);
		const dirY = Math.sin(angle);

		let mapX = Math.floor(ox);
		let mapY = Math.floor(oy);

		const deltaDistX = Math.abs(1 / dirX);
		const deltaDistY = Math.abs(1 / dirY);

		let stepX: number;
		let sideDistX: number;
		if (dirX < 0) {
			stepX = -1;
			sideDistX = (ox - mapX) * deltaDistX;
		} else {
			stepX = 1;
			sideDistX = (mapX + 1 - ox) * deltaDistX;
		}

		let stepY: number;
		let sideDistY: number;
		if (dirY < 0) {
			stepY = -1;
			sideDistY = (oy - mapY) * deltaDistY;
		} else {
			stepY = 1;
			sideDistY = (mapY + 1 - oy) * deltaDistY;
		}

		let side: 0 | 1 = 0;

		// DDA loop
		for (let i = 0; i < 64; i++) {
			if (sideDistX < sideDistY) {
				sideDistX += deltaDistX;
				mapX += stepX;
				side = 0;
			} else {
				sideDistY += deltaDistY;
				mapY += stepY;
				side = 1;
			}

			// Bounds check
			if (mapY < 0 || mapY >= map.length || mapX < 0 || mapX >= (map[0]?.length ?? 0)) {
				return {
					distance: 64, tileValue: 1, side, wallX: 0, mapX, mapY,
				};
			}

			const cell = map[mapY][mapX];
			if (cell > 0) {
				// Calculate perpendicular distance
				let perpDist: number;
				let wallX: number;
				if (side === 0) {
					perpDist = sideDistX - deltaDistX;
					wallX = oy + perpDist * dirY;
				} else {
					perpDist = sideDistY - deltaDistY;
					wallX = ox + perpDist * dirX;
				}

				wallX -= Math.floor(wallX);

				return {
					distance: Math.max(perpDist, 0.001), tileValue: cell, side, wallX, mapX, mapY,
				};
			}
		}

		return {
			distance: 64, tileValue: 0, side: 0, wallX: 0, mapX, mapY,
		};
	}

	// ── Floor & ceiling ─────────────────────────────────────────

	private renderFloorCeiling(
		data: Uint8ClampedArray,
		col: number,
		wallBottom: number,
		wallTop: number,
		camera: Camera,
		rayAngle: number,
		w: number,
		h: number,
	): void {
		const cosAngle = Math.cos(rayAngle - camera.angle);

		// Floor (below wall)
		const rz = this.rugZone;
		for (let y = wallBottom; y < h; y++) {
			const rowDist = (h / 2) / (y - h / 2 - camera.pitch);
			const corrected = rowDist / cosAngle;

			const floorX = camera.x + corrected * Math.cos(rayAngle);
			const floorY = camera.y + corrected * Math.sin(rayAngle);

			const tx = Math.floor(floorX * TEX_SIZE) & (TEX_SIZE - 1);
			const ty = Math.floor(floorY * TEX_SIZE) & (TEX_SIZE - 1);

			// Choose floor or rug texture based on world position
			const useRug = rz
				&& floorX >= rz.x0 && floorX < rz.x1
				&& floorY >= rz.y0 && floorY < rz.y1;
			const tex = useRug ? this.rugTex : this.floorTex;

			const ti = (ty * TEX_SIZE + tx) * 4;
			const fogFactor = Math.min(1, corrected * this.fogDensity);
			const pi = (y * w + col) * 4;

			data[pi] = Math.floor(tex.data[ti] * (1 - fogFactor));
			data[pi + 1] = Math.floor(tex.data[ti + 1] * (1 - fogFactor));
			data[pi + 2] = Math.floor(tex.data[ti + 2] * (1 - fogFactor));
			data[pi + 3] = 255;
		}

		// Ceiling (above wall)
		for (let y = 0; y < wallTop; y++) {
			const rowDist = (h / 2) / (h / 2 - y + camera.pitch);
			const corrected = rowDist / cosAngle;

			const ceilX = camera.x + corrected * Math.cos(rayAngle);
			const ceilY = camera.y + corrected * Math.sin(rayAngle);

			const tx = Math.floor(ceilX * TEX_SIZE) & (TEX_SIZE - 1);
			const ty = Math.floor(ceilY * TEX_SIZE) & (TEX_SIZE - 1);

			const ti = (ty * TEX_SIZE + tx) * 4;
			const fogFactor = Math.min(1, corrected * this.fogDensity);
			const pi = (y * w + col) * 4;

			data[pi] = Math.floor(this.ceilTex.data[ti] * (1 - fogFactor));
			data[pi + 1] = Math.floor(this.ceilTex.data[ti + 1] * (1 - fogFactor));
			data[pi + 2] = Math.floor(this.ceilTex.data[ti + 2] * (1 - fogFactor));
			data[pi + 3] = 255;
		}
	}

	// ── Sprite rendering (billboards) ───────────────────────────

	private renderSprites(
		data: Uint8ClampedArray,
		camera: Camera,
		sprites: Sprite[],
		w: number,
		h: number,
	): void {
		// Sort by distance (farthest first)
		const sorted = sprites
			.filter(s => s.visible)
			.map(s => ({
				...s,
				dist: Math.sqrt((s.x - camera.x) ** 2 + (s.y - camera.y) ** 2),
			}))
			.sort((a, b) => b.dist - a.dist);

		for (const sprite of sorted) {
			const tex = this.spriteTextures.get(sprite.textureId);
			if (!tex) {
				continue;
			}

			// Translate relative to camera
			const dx = sprite.x - camera.x;
			const dy = sprite.y - camera.y;

			// Transform to camera space
			const dirX = Math.cos(camera.angle);
			const dirY = Math.sin(camera.angle);
			// Depth = dot(delta, dir)
			const transformY = dirX * dx + dirY * dy;
			// Horizontal offset = cross(dir, delta), scaled by FOV
			const fovScale = Math.tan(Math.PI / 6); // Tan(halfFov) for 60° FOV
			const transformX = (dirX * dy - dirY * dx) / fovScale;

			if (transformY <= 0.1) {
				continue; // Behind camera
			}

			const spriteScreenX = (w / 2) * (1 + transformX / transformY);
			const spriteHeight = Math.abs(h / transformY) * sprite.scale;
			const spriteWidth = spriteHeight; // Square sprites

			const drawStartY = Math.max(0, Math.floor(-spriteHeight / 2 + h / 2 + camera.pitch));
			const drawEndY = Math.min(h, Math.floor(spriteHeight / 2 + h / 2 + camera.pitch));
			const drawStartX = Math.max(0, Math.floor(spriteScreenX - spriteWidth / 2));
			const drawEndX = Math.min(w, Math.floor(spriteScreenX + spriteWidth / 2));

			const fogFactor = Math.min(1, transformY * this.fogDensity);

			for (let x = drawStartX; x < drawEndX; x++) {
				// Depth check
				if (transformY >= this.depthBuffer[x]) {
					continue;
				}

				const texX = Math.floor(((x - (spriteScreenX - spriteWidth / 2)) / spriteWidth) * tex.width);

				for (let y = drawStartY; y < drawEndY; y++) {
					const texY = Math.floor(((y - (Math.floor(-spriteHeight / 2 + h / 2 + camera.pitch))) / spriteHeight) * tex.height);

					if (texX < 0 || texX >= tex.width || texY < 0 || texY >= tex.height) {
						continue;
					}

					const si = (texY * tex.width + texX) * 4;
					const a = tex.data[si + 3];
					if (a < 128) {
						continue; // Transparent
					}

					const pi = (y * w + x) * 4;
					data[pi] = Math.floor(tex.data[si] * (1 - fogFactor));
					data[pi + 1] = Math.floor(tex.data[si + 1] * (1 - fogFactor));
					data[pi + 2] = Math.floor(tex.data[si + 2] * (1 - fogFactor));
					data[pi + 3] = 255;
				}
			}
		}
	}

	// ── Glitch effect ───────────────────────────────────────────

	private applyGlitch(data: Uint8ClampedArray, w: number, h: number): void {
		const intensity = this.glitchIntensity;

		// Random horizontal line shifts
		for (let y = 0; y < h; y++) {
			if (Math.random() < intensity * 0.3) {
				const shift = Math.floor((Math.random() - 0.5) * intensity * 40);
				if (shift === 0) {
					continue;
				}

				const row = y * w * 4;
				// Shift pixel data
				if (shift > 0) {
					for (let x = w - 1; x >= shift; x--) {
						const dst = row + x * 4;
						const src = row + (x - shift) * 4;
						data[dst] = data[src];
						data[dst + 1] = data[src + 1];
						data[dst + 2] = data[src + 2];
					}
				} else {
					for (let x = 0; x < w + shift; x++) {
						const dst = row + x * 4;
						const src = row + (x - shift) * 4;
						data[dst] = data[src];
						data[dst + 1] = data[src + 1];
						data[dst + 2] = data[src + 2];
					}
				}
			}
		}

		// Random color channel corruption
		if (Math.random() < intensity * 0.5) {
			const blockY = Math.floor(Math.random() * h);
			const blockH = Math.floor(Math.random() * 20 * intensity);
			const channel = Math.floor(Math.random() * 3);
			for (let y = blockY; y < Math.min(h, blockY + blockH); y++) {
				for (let x = 0; x < w; x++) {
					const pi = (y * w + x) * 4;
					data[pi + channel] = Math.min(255, data[pi + channel] + Math.floor(Math.random() * 100 * intensity));
				}
			}
		}
	}
}
