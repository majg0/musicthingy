<script lang="ts">
	import Foo from '$lib/components/foo.svelte';
	import type { PitchSettings } from '$lib/stores/pitch';
	import { Imm, object2, object4 } from '../lib/lens';
	import * as F from 'rusty';

	console.log(F);
	window.F = F;

	interface Store {
		ctx?: AudioContext;
		mainGainNode?: GainNode;
		state: {
			port?: MessagePort;
			isPlaying: boolean;
		};
		settings: {
			pitch: PitchSettings;
		};
	}

	const stateIsPlaying = object2<Store>()(['state', 'isPlaying']);

	let store: Store = {
		ctx: undefined,
		mainGainNode: undefined,
		state: {
			isPlaying: false
		},
		settings: {
			pitch: {
				scale: {
					range: 2,
					subdivisions: 12
				},
				standard: {
					frequency: 440,
					pitchIndex: 69
				}
			}
		}
	};

	async function onPlay() {
		async function setup() {
			const ctx = new AudioContext();
			store.ctx = ctx;

			const mainGainNode = ctx.createGain();
			store.mainGainNode = mainGainNode;

			mainGainNode.connect(ctx.destination);
			mainGainNode.gain.value = 0.1;

			await ctx.audioWorklet.addModule('worklet/wavegen.js');
			const wavegenNode = new AudioWorkletNode(ctx, 'wavegen');
			wavegenNode.connect(mainGainNode);
			store.state.port = wavegenNode.port;

			store = Imm.set(stateIsPlaying, true, store);
			store.state.port!.postMessage(store.settings);
		}

		// function playTone(frequency: number) {
		// 	const { ctx, mainGainNode } = store;
		// 	if (!ctx || !mainGainNode) {
		// 		return;
		// 	}
		// 	const osc = ctx.createOscillator();
		// 	osc.connect(mainGainNode);
		// 	osc.frequency.value = frequency;
		// 	osc.start();
		// 	osc.stop(0.5);
		// 	return osc;
		// }

		await setup();

		// playTone(pitchFrequency(store.settings.pitch, 69));
	}

	async function onStop() {
		store.ctx?.close();
		store = Imm.set(stateIsPlaying, false, store);
	}

	function updateSetting<
		K extends keyof typeof store.settings,
		K1 extends keyof typeof store.settings[K]
	>([setting, k0, k1]: [K, K1, keyof typeof store.settings[K][K1]]) {
		// TODO: fix any
		return (e: any) => {
			store = Imm.set(object4<Store>()(['settings', setting, k0, k1]), e.target.value, store);
			store.state.port?.postMessage(store.settings);
		};
	}
</script>

<h1>Music Thingy</h1>
<h2>Actions</h2>
{#if store.state.isPlaying}
	<button on:click={onStop}>Stop</button>
{:else}
	<button on:click={onPlay}>Play</button>
{/if}
<h2>Settings</h2>
{#each Object.entries(store.settings) as [settingName, setting]}
	<h3>{settingName}</h3>
	{#each Object.entries(setting) as [n0, v0]}
		{#if typeof v0 === 'object'}
			{#each Object.entries(v0) as [n1, value]}
				<div>{n0} {n1}: <input {value} on:change={updateSetting([settingName, n0, n1])} /></div>
			{/each}
		{:else}
			<div>{n0}: <input value={v0} /></div>
		{/if}
	{/each}
{/each}

<Foo />
