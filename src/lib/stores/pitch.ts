export interface PitchSettings {
	scale: {
		range: number;
		subdivisions: number;
	};
	standard: {
		frequency: number;
		pitchIndex: number;
	};
}

function logN(n: number, value: number) {
	return Math.log(value) / Math.log(n);
}

export function pitchFrequency({ scale, standard }: PitchSettings, pitchIndex: number) {
	return (
		standard.frequency *
		Math.pow(scale.range, (pitchIndex - standard.pitchIndex) / scale.subdivisions)
	);
}

export function frequencyPitch({ scale, standard }: PitchSettings, frequency: number) {
	return (
		standard.pitchIndex + scale.subdivisions * logN(scale.range, frequency / standard.frequency)
	);
}
