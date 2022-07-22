function logN(n, value) {
	return Math.log(value) / Math.log(n);
}

function pitchFrequency({ scale, standard }, pitchIndex) {
	return (
		standard.frequency *
		Math.pow(scale.range, (pitchIndex - standard.pitchIndex) / scale.subdivisions)
	);
}

function frequencyPitch({ scale, standard }, frequency) {
	return (
		standard.pitchIndex + scale.subdivisions * logN(scale.range, frequency / standard.frequency)
	);
}

class WaveGen extends AudioWorkletProcessor {
	constructor() {
		super();
		this.port.onmessage = this.onmessage.bind(this);
		this.phase = 0;
	}
	onmessage({ data }) {
		this.settings = data;
	}
	process(inputs, outputs, parameters) {
		const output = outputs[0];
		// const {
		// 	scale: { range, subdivisions },
		// 	standard: { frequency, pitchIndex }
		// } = this.settings.pitch;

		output.forEach((channel) => {
			for (let i = 0; i < channel.length; i++) {
				this.phase += pitchFrequency(this.settings.pitch, 69) / 44100;
				if (this.phase >= 1) {
					this.phase -= 1;
				}

				channel[i] = Math.sin(this.phase * Math.PI * 2);
				// channel[i] = Math.random() * 2 - 1;
			}
		});

		return true;
	}
}

registerProcessor('wavegen', WaveGen);
