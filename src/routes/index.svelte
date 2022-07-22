<script lang="ts">
	import type { PitchSettings } from '../lib/stores/pitch';
	import { Imm, object2, object4 } from '../lib/lens';

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

	async function onMessage({ type, data }: { type: string; data: unknown }) {
		console.log('main', type, data);
	}

	async function onPlay() {
		async function setup() {
			const ctx = new AudioContext();
			store.ctx = ctx;

			const mainGainNode = ctx.createGain();
			store.mainGainNode = mainGainNode;

			mainGainNode.connect(ctx.destination);
			mainGainNode.gain.value = 0.1;

			await ctx.audioWorklet.addModule('worklet/WasmProcessor.js');
			const wavegenNode = new AudioWorkletNode(ctx, 'WasmProcessor');
			wavegenNode.connect(mainGainNode);
			store.state.port = wavegenNode.port;
			store.state.port!.onmessage = (e) => onMessage(e.data);

			store = Imm.set(stateIsPlaying, true, store);
			store.state.port!.postMessage({ type: 'settings', data: store.settings });

			fetch('.wasm/wasm_bg.wasm')
				.then((r) => r.arrayBuffer())
				.then((r) => wavegenNode.port.postMessage({ type: 'loadWasm', data: r }));
		}

		await setup();
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

	function capitalized(x: string) {
		return x[0].toUpperCase() + x.slice(1);
	}
</script>

<h1>Music Thingy</h1>
<h2>Actions</h2>
{#if store.state.isPlaying}
	<button on:click={onStop}>Stop</button>
{:else}
	<button on:click={onPlay}>Play</button>
{/if}
{#each Object.entries(store.settings) as [settingName, setting]}
	<h2>{capitalized(settingName)}</h2>
	<ul>
		{#each Object.entries(setting) as [n0, v0]}
			<li>
				<div>{capitalized(n0)}</div>
				<ul>
					{#each Object.entries(v0) as [n1, value]}
						<li>
							{capitalized(n1)}
							<input {value} on:change={updateSetting([settingName, n0, n1])} />
						</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ul>
{/each}
