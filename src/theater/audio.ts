// === Theater audio system ===
// Generates all sounds procedurally using Web Audio API.
// No external audio files needed — everything synthesized at runtime.

let ctx: AudioContext | undefined;
let mainGain: GainNode | undefined;
let muted = false;

// ── Background music loop (HTML Audio) ──────────────────────────
let currentMusic: HTMLAudioElement | undefined;
let currentMusicUrl = '';

function ensureContext(): AudioContext {
	if (!ctx) {
		ctx = new AudioContext();
		mainGain = ctx.createGain();
		mainGain.gain.value = muted ? 0 : 0.5;
		mainGain.connect(ctx.destination);
	}

	return ctx;
}

export function resumeAudio(): void {
	if (ctx?.state === 'suspended') {
		void ctx.resume();
	}

	// Retry music playback if it was blocked by autoplay policy
	if (currentMusic?.paused && currentMusicUrl) {
		try {
			void currentMusic.play();
		} catch {}
	}
}

export function toggleMute(): boolean {
	muted = !muted;
	if (mainGain) {
		mainGain.gain.value = muted ? 0 : 0.5;
	}

	if (currentMusic) {
		currentMusic.volume = muted ? 0 : 0.4;
	}

	return muted;
}

export function isMuted(): boolean {
	return muted;
}

// ── Sound generators ────────────────────────────────────────────

/** "СПАСИБО, НАСЛАЖДАЙТЕСЬ ПРОСМОТРОМ" — low quality garbled voice. */
export function playWelcome(): void {
	const audio = ensureContext();
	if (!mainGain) {
		return;
	}

	// Simulate crackly speech with filtered noise + formant-like tones
	const duration = 2.5;
	const bufferSize = Math.floor(audio.sampleRate * duration);
	const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
	const data = buffer.getChannelData(0);

	// Generate vowel-like formants with noise
	for (let i = 0; i < bufferSize; i++) {
		const t = i / audio.sampleRate;
		// Syllable rhythm
		const syllable = Math.sin(t * 4 * Math.PI) * 0.5 + 0.5;
		// Formant frequencies (rough speech approximation)
		const f1 = Math.sin(t * 300 * 2 * Math.PI) * 0.3;
		const f2 = Math.sin(t * 800 * 2 * Math.PI) * 0.15;
		const noise = (Math.random() - 0.5) * 0.2;
		// Crackle
		const crackle = Math.random() < 0.02 ? (Math.random() - 0.5) * 0.8 : 0;
		data[i] = (f1 + f2 + noise + crackle) * syllable * 0.4;
	}

	const source = audio.createBufferSource();
	source.buffer = buffer;

	// Low-pass for muffled quality
	const filter = audio.createBiquadFilter();
	filter.type = 'lowpass';
	filter.frequency.value = 1200;

	source.connect(filter);
	filter.connect(mainGain);
	source.start();
}

/** Footstep in darkness — dull thud. */
export function playFootstep(): void {
	const audio = ensureContext();
	if (!mainGain) {
		return;
	}

	const osc = audio.createOscillator();
	const gain = audio.createGain();

	osc.frequency.value = 60 + Math.random() * 20;
	osc.type = 'sine';
	gain.gain.setValueAtTime(0.3, audio.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.2);

	osc.connect(gain);
	gain.connect(mainGain);
	osc.start();
	osc.stop(audio.currentTime + 0.2);
}

/** Piercing scream — builds and sustains. */
export function playScream(): void {
	const audio = ensureContext();
	if (!mainGain) {
		return;
	}

	const duration = 8;
	const bufferSize = Math.floor(audio.sampleRate * duration);
	const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < bufferSize; i++) {
		const t = i / audio.sampleRate;
		// Rising frequency scream
		const freq = 400 + t * 200;
		const base = Math.sin(t * freq * 2 * Math.PI) * 0.4;
		// Harmonics
		const h2 = Math.sin(t * freq * 4 * Math.PI) * 0.2;
		const h3 = Math.sin(t * freq * 6 * Math.PI) * 0.1;
		// Noise overlay
		const noise = (Math.random() - 0.5) * 0.15;
		// Envelope
		const env = Math.min(1, t * 2) * Math.max(0, 1 - (t - duration + 0.5) * 2);
		data[i] = (base + h2 + h3 + noise) * env;
	}

	const source = audio.createBufferSource();
	source.buffer = buffer;
	source.connect(mainGain);
	source.start();
}

/** Brief unsettling sound for vortex flash. */
export function playFlash(): void {
	const audio = ensureContext();
	if (!mainGain) {
		return;
	}

	const osc = audio.createOscillator();
	const gain = audio.createGain();

	osc.frequency.value = 200 + Math.random() * 300;
	osc.type = 'sawtooth';
	gain.gain.setValueAtTime(0.2, audio.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.15);

	osc.connect(gain);
	gain.connect(mainGain);
	osc.start();
	osc.stop(audio.currentTime + 0.15);
}

/** Garbled warning voice. */
export function playWarning(): void {
	const audio = ensureContext();
	if (!mainGain) {
		return;
	}

	const duration = 3;
	const bufferSize = Math.floor(audio.sampleRate * duration);
	const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < bufferSize; i++) {
		const t = i / audio.sampleRate;
		// Deeper, more distorted voice
		const freq = 150 + Math.sin(t * 3) * 50;
		const base = Math.sin(t * freq * 2 * Math.PI) * 0.3;
		const distortion = Math.tanh(base * 3);
		const noise = (Math.random() - 0.5) * 0.3;
		const crackle = Math.random() < 0.05 ? (Math.random() - 0.5) * 1 : 0;
		const env = Math.min(1, t * 3) * Math.max(0, 1 - (t - duration + 0.3) * 3);
		data[i] = (distortion + noise + crackle) * env * 0.4;
	}

	const source = audio.createBufferSource();
	source.buffer = buffer;

	const filter = audio.createBiquadFilter();
	filter.type = 'lowpass';
	filter.frequency.value = 800;

	source.connect(filter);
	filter.connect(mainGain);
	source.start();
}

/** Start a looping background music track (mp3). Skips if already playing same URL. */
export function playMusicLoop(url: string): void {
	if (currentMusicUrl === url && currentMusic && !currentMusic.paused) {
		return;
	}

	stopMusic();
	currentMusic = new Audio(url);
	currentMusic.loop = true;
	currentMusic.volume = muted ? 0 : 0.4;
	currentMusicUrl = url;

	// Attempt playback — may be blocked by autoplay policy
	try {
		void currentMusic.play();
	} catch {}
}

/** Stop current background music. */
export function stopMusic(): void {
	if (currentMusic) {
		currentMusic.pause();
		currentMusic.src = '';
		currentMusic = undefined;
		currentMusicUrl = '';
	}
}

/** Play audio trigger by name. */
export function playAudioTrigger(name: string): void {
	switch (name) {
		case 'welcome': {
			playWelcome();
			break;
		}

		case 'footstep': {
			playFootstep();
			break;
		}

		case 'scream': {
			playScream();
			break;
		}

		case 'flash': {
			playFlash();
			break;
		}

		case 'warning': {
			playWarning();
			break;
		}

		case 'rush': {
			playRush();
			break;
		}

		default: {
			break;
		}
	}
}

// ── Stage 3 corridor audio ─────────────────────────────────────

/** Active drone nodes for cleanup. */
let droneOsc: OscillatorNode | undefined;
let droneOsc2: OscillatorNode | undefined;
let droneNoise: AudioBufferSourceNode | undefined;
let droneGain: GainNode | undefined;
let droneFilter: BiquadFilterNode | undefined;

/** Start rumbling corridor drone — deep layered growl. */
export function startDrone(): void {
	const audio = ensureContext();
	if (!mainGain) {
		return;
	}

	stopDrone();

	droneGain = audio.createGain();
	droneGain.gain.value = 0;

	// Low-pass filter to keep it rumbly
	droneFilter = audio.createBiquadFilter();
	droneFilter.type = 'lowpass';
	droneFilter.frequency.value = 120;
	droneFilter.Q.value = 4;

	// Primary: deep square wave for growl body
	droneOsc = audio.createOscillator();
	droneOsc.type = 'square';
	droneOsc.frequency.value = 35;
	droneOsc.connect(droneFilter);

	// Secondary: detuned sawtooth for grit
	droneOsc2 = audio.createOscillator();
	droneOsc2.type = 'sawtooth';
	droneOsc2.frequency.value = 37;
	droneOsc2.connect(droneFilter);

	// Noise layer for rumble texture
	const noiseDuration = 4;
	const noiseBuffer = audio.createBuffer(1, Math.floor(audio.sampleRate * noiseDuration), audio.sampleRate);
	const noiseData = noiseBuffer.getChannelData(0);
	for (let i = 0; i < noiseData.length; i++) {
		noiseData[i] = (Math.random() - 0.5) * 0.3;
	}

	droneNoise = audio.createBufferSource();
	droneNoise.buffer = noiseBuffer;
	droneNoise.loop = true;
	const noiseGain = audio.createGain();
	noiseGain.gain.value = 0.4;
	droneNoise.connect(noiseGain);
	noiseGain.connect(droneFilter);

	droneFilter.connect(droneGain);
	droneGain.connect(mainGain);
	droneOsc.start();
	droneOsc2.start();
	droneNoise.start();
}

/**
 * Update drone for Doppler effect.
 * @param distance  — Distance to the face (tiles)
 * @param approaching — True when face moves toward player
 * @param moving — True when face is actively rushing
 */
export function updateDroneDoppler(distance: number, approaching: boolean, moving: boolean): void {
	if (!droneOsc || !droneGain || !droneFilter || !droneOsc2) {
		return;
	}

	if (!moving) {
		// Silence when face is not moving
		droneGain.gain.value = Math.max(0, droneGain.gain.value - 0.02);
		return;
	}

	// Distance factor: 0 = far, 1 = very close
	const proximity = Math.max(0, Math.min(1, 1 - distance / 50));

	// Doppler pitch shift: approaching raises pitch, receding lowers it
	const baseFreq = 35;
	const dopplerShift = approaching ? 1 + proximity * 0.6 : 1 - proximity * 0.25;
	const targetFreq = baseFreq * dopplerShift;

	droneOsc.frequency.value = targetFreq;
	droneOsc2.frequency.value = targetFreq * 1.06; // Slight detune for thickness

	// Filter opens as face gets closer — more harmonics = more menacing
	droneFilter.frequency.value = 120 + proximity * 350;

	// Volume: louder when close + approaching
	const volume = proximity * (approaching ? 0.18 : 0.08);
	droneGain.gain.value = volume;
}

/** Ramp drone pitch up to signal incoming rush. */
export function rampDrone(factor: number): void {
	if (droneOsc && droneGain && droneFilter && droneOsc2) {
		// Factor 0..1 → gentle anticipation rumble
		droneOsc.frequency.value = 35 + factor * 15;
		droneOsc2.frequency.value = 37 + factor * 15;
		droneFilter.frequency.value = 120 + factor * 80;
		droneGain.gain.value = factor * 0.06;
	}
}

/** Stop ambient drone. */
export function stopDrone(): void {
	for (const osc of [droneOsc, droneOsc2]) {
		if (osc) {
			try {
				osc.stop();
			} catch {}
		}
	}

	if (droneNoise) {
		try {
			droneNoise.stop();
		} catch {}

		droneNoise = undefined;
	}

	droneOsc = undefined;
	droneOsc2 = undefined;

	if (droneFilter) {
		droneFilter.disconnect();
		droneFilter = undefined;
	}

	if (droneGain) {
		droneGain.disconnect();
		droneGain = undefined;
	}
}

/** Rushing face Doppler scream — pitch drops as it passes. */
function playRush(): void {
	const audio = ensureContext();
	if (!mainGain) {
		return;
	}

	const duration = 3;
	const bufferSize = Math.floor(audio.sampleRate * duration);
	const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
	const data = buffer.getChannelData(0);

	for (let i = 0; i < bufferSize; i++) {
		const t = i / audio.sampleRate;
		// Doppler: high pitch approaching (0-1s), drops as passing (1-2s), fades receding
		const progress = t / duration;
		const dopplerFreq = progress < 0.4
			? 600 + (1 - progress / 0.4) * 400 // Approaching: 1000→600
			: 600 - (progress - 0.4) * 500; // Receding: 600→300
		const base = Math.sin(t * dopplerFreq * 2 * Math.PI) * 0.5;
		const h2 = Math.sin(t * dopplerFreq * 3 * Math.PI) * 0.2;
		const noise = (Math.random() - 0.5) * 0.25;
		// Volume envelope: builds, peaks at center, fades
		const peak = 1 - Math.abs(progress - 0.4) * 2.5;
		const env = Math.max(0, Math.min(1, peak));
		data[i] = (base + h2 + noise) * env * 0.7;
	}

	const source = audio.createBufferSource();
	source.buffer = buffer;
	source.connect(mainGain);
	source.start();
}
