<script lang="ts">
	interface Store {
		ctx?: AudioContext;
		mainGainNode?: GainNode;
		state: {
			port?: MessagePort;
		};
		settings: {
			number: Record<string, number>;
		};
	}

	let store: Store = {
		ctx: undefined,
		mainGainNode: undefined,
		state: {
			port: undefined
		},
		settings: {
			number: {}
		}
	};

	async function onMessage({ type, data }: { type: string; data: unknown }) {
		console.log('main', type, data);
		if (type === 'wasmLoaded') {
			store = {
				...store,
				settings: data as { number: Record<string, number> }
			};
		}
	}

	async function onLoad() {
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

		fetch('.wasm/wasm_bg.wasm')
			.then((r) => r.arrayBuffer())
			.then((r) =>
				wavegenNode.port.postMessage({
					type: 'loadWasm',
					data: {
						wasmBytes: r,
						sampleRate: ctx.sampleRate
					}
				})
			);
	}

	function setNumber(key: string) {
		return (e: any) => {
			const value = Number(e.target.value);
			store = {
				...store,
				settings: {
					...store.settings,
					number: {
						...store.settings.number,
						[key]: value
					}
				}
			};
			store.state.port?.postMessage({
				type: 'setNumber',
				data: {
					key,
					value
				}
			});
		};
	}
</script>

<h1>Music Thingy</h1>
<h2>Actions</h2>
{#if store.ctx === undefined}
	<button on:click={onLoad}>Load</button>
{:else}
	{#each Object.entries(store.settings.number) as [key, value]}
		<div>
			{key} <input {value} type="number" on:change={setNumber(key)} />
		</div>
	{/each}
{/if}
