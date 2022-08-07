import './TextEncoder.js';
import loadWasm, { initialize, process, getSettings } from '../.wasm/wasm.js';

// function logN(n, value) {
// 	return Math.log(value) / Math.log(n);
// }

// function pitchFrequency({ scale, standard }, pitchIndex) {
// 	return (
// 		standard.frequency *
// 		Math.pow(scale.range, (pitchIndex - standard.pitchIndex) / scale.subdivisions)
// 	);
// }

// function frequencyPitch({ scale, standard }, frequency) {
// 	return (
// 		standard.pitchIndex + scale.subdivisions * logN(scale.range, frequency / standard.frequency)
// 	);
// }

const BUFFER_SIZE = 128;

class WasmProcessor extends AudioWorkletProcessor {
	#wasm;
	#ptr;
	#buf;

	constructor() {
		super();
		this.port.onmessage = (e) => this.onmessage(e.data);
		this.phase = 0;
	}

	async onmessage({ type, data }) {
		console.log('wasm', type, data);
		if (type === 'loadWasm') {
			const { wasmBytes, sampleRate } = data;

			this.#wasm = await loadWasm(WebAssembly.compile(wasmBytes));

			this.#ptr = initialize(sampleRate, BUFFER_SIZE);
			this.#buf = new Float32Array(this.#wasm.memory.buffer, this.#ptr, BUFFER_SIZE);

			const settings = getSettings();
			console.log(settings);
			// this.mapping = Object.keys(settings.number).reduce((o, k, i) => o.set(k, i), new Map());

			this.port.postMessage({ type: 'wasmLoaded', data: settings });
		} else if (type === 'setNumber') {
			// const { key, value } = data;
			// setNumber(this.mapping.get(key), value);
		}
	}

	process(inputs, outputs, parameters) {
		if (!this.#wasm) {
			return true;
		}

		process();

		// NOTE: handle wasm memory growth
		// DOCS: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Memory/grow#detachment_upon_growing
		if (this.#buf.byteLength === 0) {
			this.#buf = new Float32Array(this.#wasm.memory.buffer, this.#ptr, BUFFER_SIZE);
		}

		for (let i = 0; i < outputs.length; i++) {
			for (let ch = 0; ch < outputs[i].length; ch++) {
				outputs[i][ch].set(this.#buf);
			}
		}

		return true;
	}
}

registerProcessor('WasmProcessor', WasmProcessor);
