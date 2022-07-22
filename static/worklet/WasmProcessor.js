/* global currentFrame:readonly */

import './TextEncoder.js';
import init, { buffer_alloc, process } from '../.wasm/wasm.js';

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

const SAMPLE_BUFSIZE = 128;

class WasmProcessor extends AudioWorkletProcessor {
	#wasm;
	#settings;
	#ptr;
	#buf;

	constructor() {
		super();
		this.port.onmessage = (e) => this.onmessage(e.data);
		this.phase = 0;
	}

	async onmessage({ type, data }) {
		console.log('wasm', type, data);
		if (type === 'settings') {
			this.#settings = data;
		} else if (type === 'loadWasm') {
			this.#wasm = await init(WebAssembly.compile(data));

			this.#ptr = buffer_alloc(SAMPLE_BUFSIZE);
			this.#buf = new Float32Array(this.#wasm.memory.buffer, this.#ptr, SAMPLE_BUFSIZE);

			console.log(this.#wasm, this.#ptr, this.#buf);
			this.port.postMessage({ type: 'wasmLoaded' });
		}
	}

	process(inputs, outputs, parameters) {
		if (!this.#wasm) {
			return true;
		}

		process(this.#ptr, SAMPLE_BUFSIZE);
		// const {
		// 	scale: { range, subdivisions },
		// 	standard: { frequency, pitchIndex }
		// } = this.settings.pitch;

		// output.forEach((channel) => {
		// 	for (let i = 0; i < channel.length; i++) {
		// 		this.phase += pitchFrequency(this.settings.pitch, 69) / 44100;
		// 		if (this.phase >= 1) {
		// 			this.phase -= 1;
		// 		}

		// 		channel[i] = Math.sin(this.phase * Math.PI * 2);
		// 		// channel[i] = Math.random() * 2 - 1;
		// 	}
		// });

		for (let i = 0; i < outputs.length; i++) {
			for (let ch = 0; ch < outputs[i].length; ch++) {
				outputs[i][ch].set(this.#buf);
			}
		}

		return true;
	}
}

registerProcessor('WasmProcessor', WasmProcessor);
