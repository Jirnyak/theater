<script lang="ts">
	import TitleScreen from './screens/TitleScreen.svelte';
	import GameScreen from './screens/GameScreen.svelte';
	import {stopMusic} from './theater/audio';

	let screen: 'title' | 'game' | 'crashed' | 'debug-maze' | 'load-game' = $state('title');

	/** Debug: set to 1+ to skip stages (0 = normal game). */
	const DEBUG_START_STAGE = 0;
	let completedStage = $state(DEBUG_START_STAGE);

	function onNewGame() {
		screen = 'game';
	}

	function onCrash() {
		stopMusic();
		screen = 'crashed';
	}

	function onRestart() {
		completedStage++;
		screen = 'title';
	}

	function onDebugMaze() {
		screen = 'debug-maze';
	}

	function onLoadGame() {
		screen = 'load-game';
	}

	function onDebugStage(stage: number) {
		completedStage = stage;
		screen = 'game';
	}
</script>

<div class="h-screen w-screen overflow-hidden bg-black">
	{#if screen === 'title'}
		<TitleScreen {onNewGame} {onLoadGame} {onDebugMaze} {onDebugStage} {completedStage} />
	{:else if screen === 'game'}
		<GameScreen {onCrash} {onRestart} {completedStage} />
	{:else if screen === 'debug-maze'}
		<GameScreen {onCrash} {onRestart} debugMaze={true} {completedStage} />
	{:else if screen === 'load-game'}
		<GameScreen {onCrash} {onRestart} loadMode={true} {completedStage} />
	{:else if screen === 'crashed'}
		<!-- Game "crashed" to desktop — just black screen -->
		<div class="absolute inset-0 bg-black"></div>
	{/if}
</div>
