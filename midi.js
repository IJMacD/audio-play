class MidiNode {
	constructor (audioContext) {
		this.audioContext = audioContext;
	}

	openFile (buffer) {
		this.buffer = buffer;
	}

	connect (destination) {
		this.destination = destination;
	}

	start (when = 0) {
		when = Math.max(when, this.audioContext.currentTime);

		const midi = parseMidi(this.buffer);
		console.log(midi);

		midi.tracks.forEach(track => {

			let nextTime = when;

			const tempo = track.tempo || 500000;	// Microseconds per quater note (500000 = 120 bpm)

			track.events.forEach(evt => {
				nextTime += evt.deltaTime * ((tempo / midi.division) * 1e-6);

				if (evt.type === 0x80) {
					this.noteOff(nextTime, evt.channel, evt.key, evt.velocity);
				}
				else if (evt.type === 0x90) {
					this.noteOn(nextTime, evt.channel, evt.key, evt.velocity);
				}
			});
		})
	}

	noteOn (when, channel, key, velocity) {
		if (!this.channels) {
			this.channels = {};
		}
		if (!this.channels[channel]) {
			this.channels[channel] = {};
		}
		const oscillators = this.channels[channel];

		if (oscillators[key]) {
			// If the note is already on, do nothing
			return;
		}

		const concertPitch = 440; // Note A4, 440 Hz
		const concertPitchMidiNum = 0x45; // MIDI Note Number 65, Middle C = 60
		const noteRatio = Math.exp(Math.LN2 / 12);

		const freq = concertPitch * Math.pow(noteRatio, key - concertPitchMidiNum);

		const o = createNote(this.audioContext, freq, velocity / 127, 0);
		o.connect(this.destination);
		o.start(when);

		oscillators[key] = o;
	}

	noteOff (when, channel, key, velocity) {
		if (!this.channels) {
			this.channels = {};
		}
		if (!this.channels[channel]) {
			this.channels[channel] = {};
		}
		const oscillators = this.channels[channel];

		if (oscillators[key]) {
			oscillators[key].stop(when);
			oscillators[key] = null;
		}
	}
}

function intval (c) {
	return c.charCodeAt(0);
}

function charval (i) {
	return String.fromCharCode(i);
}

function parseMidi (buffer) {
	const view = new DataView(buffer);
	let index = 0;

	if (view.getUint8(0) !== intval('M') ||
		view.getUint8(1) !== intval('T') ||
		view.getUint8(2) !== intval('h') ||
		view.getUint8(3) !== intval('d'))
	{
		throw new Error("Not a MIDI file");
	}

	const headerLength = view.getUint32(4);

	const format = view.getUint16(8);
	const trackCount = view.getUint16(10);
	const division = view.getUint16(12);	// ticks per quater note

	const midi = { format, trackCount, division };

	index += 8 + headerLength;

	let trackNo = 0;

	midi.tracks = [];

	while (index < buffer.byteLength) {
		const type = [
			charval(view.getUint8(index + 0)),
			charval(view.getUint8(index + 1)),
			charval(view.getUint8(index + 2)),
			charval(view.getUint8(index + 3)),
		].join("");

		const length = view.getUint32(index + 4);

		index += 8;

		const endIndex = index + length;

		if (type !== "MTrk")
		{
			console.log("Unrecognised chunk", type);
			index += length;
			continue;
		}

		const track = { events: [] };
		let meta = track;

		let prevStatus;
		let currTime = 0;

		while (index < endIndex) {
			const res = parseVariableLength(view, index);
			const deltaTime = res.value;
			index = res.index;

			currTime += deltaTime;

			let status = view.getUint8(index++);

			if (status < 0x80) {
				status = prevStatus;
				index--;
			}

			if(typeof status === "undefined") {
				throw new Error("Continuation Event found without previous event");
			}

			const eventRes = parseEvent(view, index, status);

			if (eventRes.event) {
				if (eventRes.event.type === 0xFF &&
					eventRes.event.metaType === 0x2F)
				{
					// 0x2F: End of Track Meta Event
					track.length = currTime;
				}
				else {
					eventRes.event.deltaTime = deltaTime;
					track.events.push(eventRes.event);
				}
			}

			if (eventRes.meta) {
				if (eventRes.meta.channel) {
					if (!track.channelMeta) {
						track.channelMeta = {};
					}
					if (!track.channelMeta[eventRes.meta.channel]) {
						track.channelMeta[eventRes.meta.channel] = {};
					}
					meta = track.channelMeta[eventRes.meta.channel];
				}
				Object.assign(meta, eventRes.meta);
			}

			index = eventRes.index;

			prevStatus = status;
		}

		trackNo++;
		midi.tracks.push(track);
	}

	return midi;
}

function parseVariableLength (dataView, index) {
	let value = 0;
	let byte = dataView.getUint8(index++);

	while (byte > 0x80) {
		value = (value << 14) + ((byte & 0x7F) << 7)
		byte = dataView.getUint8(index++);
	}

	value += byte;

	return { value, index };
}

function parseEvent (view, index, status) {
	const type = status &0xf0;
	const channel = status & 0x0f;

	let event;
	let meta;

	let key;
	let velocity;

	switch (status & 0xf0) {
		case 0x80:
		case 0x90:
			key = view.getUint8(index++);
			velocity = view.getUint8(index++);

			event = { type, channel, key, velocity };

			break;
		case 0xA0:
			key = view.getUint8(index++);
			var pressure = view.getUint8(index++);

			event = {type, channel, key, pressure };
			break;
		case 0xB0:
			var controller = view.getUint8(index++);
			var value = view.getUint8(index++);

			if (controller >= 120 && controller <= 127) {
				console.info("Channel Mode Message");
			}

			event = { type, channel, controller, value };
			break;
		case 0xC0:
			var program = view.getUint8(index++);

			event = { type, channel, program };
			break;
		case 0xD0:
			var pressure = view.getUint8(index++);

			event = { type, channel, pressure };
			break;
		case 0xE0:
			var value = view.getUint16(index);
			index += 2;

			event = { type, channel, value };
			break;
		case 0xF0:
			switch (status) {
				case 0xF0:
				case 0xF7:
					console.info("Sysex Events not supported");
					break;
				case 0xFF:
					const metaType = view.getUint8(index++);
					const length = view.getUint8(index++);

					let text;
					if (metaType !== 0x00 && metaType < 0x08) {
						text = getAsciiText(view, index, length);
					}

					switch (metaType) {
						case 0x00:
							meta = { sequenceNumber: view.getUint16(index) };
							break;
						case 0x01:
						case 0x05:
						case 0x06:
						case 0x07:
							event = { type: status, metaType, text };
							break;
						case 0x02:
							meta = { copyright: text };
							break;
						case 0x03:
							meta = { name: text };
							break;
						case 0x04:
							meta = { instrument: text };
							break;
						case 0x20:
							const channel = view.getUint8(index);
							meta = { channel };
							break;
						case 0x2F:
							event = { type: status, metaType };
							break;
						case 0x51:
							const tempoHI = view.getUint8(index);
							const tempoLO = view.getUint16(index + 1);
							const tempo = (tempoHI << 16) + tempoLO;
							meta = { tempo };
							break;
						case 0x54:
							const hours = view.getUint8(index);
							const minutes = view.getUint8(index + 1);
							const seconds = view.getUint8(index + 2);
							const frames = view.getUint8(index + 3);
							const fractions = view.getUint8(index + 4);
							meta = { smpte: { hours, minutes, seconds, frames, fractions } };
							break;
						case 0x58:
							const numerator = view.getUint8(index);
							const denominator = view.getUint8(index + 1);
							const clocksPerTick = view.getUint8(index + 2);
							const notesPer24Clocks = view.getUint8(index + 3);
							meta = { timeSignature: { numerator, denominator, clocksPerTick, notesPer24Clocks } };
							break;
						case 0x59:
							const sharpsFlats = view.getUint8(index);
							const majorMinor = view.getUint8(index + 1);
							meta = { sharpsFlats, majorMinor };
							break;
						case 0x7F:
							console.info("System Exclusive Message not supported");
							break;
					}
					index += length;
					break;
				default:
					throw new Error("Unsupported Event Type " +  "0x" + status.toString(16) + " at 0x" + index.toString(16));
			}
			break;
		default:
			throw new Error("Unsupported Event Type " + "0x" + status.toString(16) + " at 0x" + (index-1).toString(16));
	}

	return { event, meta, index };
}

function getAsciiText(dataView, index, length) {
	const arr = [];
	for(let i = index; i < index + length; i++) {
		const b = dataView.getUint8(i);
		arr.push(String.fromCharCode(b));
	}
	return arr.join("");
}

function createNote (audioCtx, freq, gain, program) {

	const source = getSource(audioCtx, freq, program);

	const gainNode = audioCtx.createGain();
	gainNode.gain.setValueAtTime(0, 0);

	source.connect(gainNode);

	return {
		connect: gainNode.connect.bind(gainNode),
		start: when => {
			source.start(when);
			gainNode.gain.linearRampToValueAtTime(gain, when + 0.1);
		},
		stop: when => {
			source.stop(when + 0.1);
			gainNode.gain.linearRampToValueAtTime(0, when + 0.1);
		},
	};
}

function getSource (audioCtx, freq, program) {
	let source;
	switch (program) {
		case 0:
			source = audioCtx.createOscillator();
			source.frequency.setValueAtTime(freq, 0);
			source.type = "sine";
			return source;
		case 1:
			source = audioCtx.createOscillator();
			source.frequency.setValueAtTime(freq, 0);
			source.type = "square";
			return source;
		case 2:
			source = audioCtx.createOscillator();
			source.frequency.setValueAtTime(freq, 0);
			const real = new Float32Array(3);
			const imag = new Float32Array(3);

			real[0] = 0;
			imag[0] = 0;
			real[1] = 1;
			imag[1] = 0;
			real[2] = 0.2;
			imag[2] = 0;

			const wave = audioCtx.createPeriodicWave(real, imag);

			source.setPeriodicWave(wave);
			return source;
		case 3:

			const waveValue = fourier([0, 1, 0.2, 0.04, 0.0016])(freq, audioCtx.sampleRate);

			// Create an empty three-second stereo buffer at the sample rate of the AudioContext
			var myArrayBuffer = audioCtx.createBuffer(2, audioCtx.sampleRate / freq, audioCtx.sampleRate);

			for (var channel = 0; channel < myArrayBuffer.numberOfChannels; channel++) {
			  // This gives us the actual array that contains the data
			  var nowBuffering = myArrayBuffer.getChannelData(channel);
			  for (var i = 0; i < myArrayBuffer.length; i++) {

				// nowBuffering[i] = average(tone(freq, i), 0.2 * tone(freq*2, i), 0.04 * tone(freq*4, i));
				// nowBuffering[i] = (tone(freq, i) + 0.2 * tone(freq*1.5, i)) / 1.2;
				nowBuffering[i] = waveValue(i);
			  }
			}

			// Get an AudioBufferSourceNode.
			// This is the AudioNode to use when we want to play an AudioBuffer
			source = audioCtx.createBufferSource();

			// set the buffer in the AudioBufferSourceNode
			source.buffer = myArrayBuffer;

			source.loop = true;
			source.loopLength = 1 / freq;
			return source;
	}
}

function average() {
	return Array.prototype.reduce.call(arguments, (a,b) => a + b, 0) / arguments.length;
}

function fourier (coef) {
	const coefSum = coef.reduce((a,b) => a+b, 0);
	if (coefSum === 0) {
		throw Error("You must supply some coefficients");
	}
	return function (freq, sampleRate) {
		const sampleCount = (freq / sampleRate);
		return function (i) {
			return coef.map((c,f) => (c / coefSum) * Math.sin(i * f * sampleCount * Math.PI * 2)).reduce((a,b) => a+b, 0);
		}
	}
}