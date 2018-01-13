class MidiNode {
	constructor (audioContext) {
		this.audioContext = audioContext;
	}

	openFile (buffer) {
		this.buffer = buffer;

		const arr = new Uint8Array(buffer);

		console.log(arr.map(b => b.toString(16)).join(" "));
	}

	connect (destination) {
		this.destination = destination;
	}

	start (when = 0) {
		when = Math.max(when, this.audioContext.currentTime);

		const view = new DataView(this.buffer);
		let index = 0;

		const tempo = 500000;	// Microseconds per quater note (500000 = 120 bpm)

		const concertPitch = 440; // Note A4, 440 Hz
		const concertPitchMidiNum = 0x45;
		const noteRatio = Math.exp(Math.LN2 / 12);

		function getNoteFreq (num) {
			return concertPitch * Math.pow(noteRatio, num - concertPitchMidiNum);
		}

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

		console.log({ format, trackCount, division });

		index += 8 + headerLength;

		let trackNo = 0;

		while (index < this.buffer.byteLength) {
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

			console.log("Track ", trackNo);

			let nextTime = when;
			let prevStatus;

			while (index < endIndex) {
				let deltaTime = view.getUint8(index++);

				if (deltaTime > 127) {
					const nextByte = view.getUint8(index++);
					if (nextByte > 127) {
						const thirdByte = view.getUint8(index++);
						if (thirdByte > 127) {
							throw new Error("Not Implemented: Variable Length Encoding");
						}
						deltaTime = ((deltaTime & 0x7f) * 128 + (nextByte & 0x7f)) * 128 + thirdByte;

					}
					else {
						deltaTime = (deltaTime & 0x7f) * 128 + nextByte;
					}
				}

				nextTime += deltaTime * ((tempo / division) * 1e-6);

				const status = view.getUint8(index++);
				const channel = status & 0x0f;

				let key;
				let velocity;

				switch (status & 0xf0) {
					case 0x80:
						key = view.getUint8(index++);
						velocity = view.getUint8(index++);

						this.noteOff(nextTime, channel, key, velocity);

						break;
					case 0x90:
						key = view.getUint8(index++);
						velocity = view.getUint8(index++);

						this.noteOn(nextTime, channel, key, velocity);

						break;
					case 0xA0:
					case 0xB0:
					case 0xE0:
						console.log("Unsupported Event", "0x" + (status & 0xf0).toString(16) + " at 0x" + (index-1).toString(16));
						index++;
						index++;
						break;
					case 0xC0:
					case 0xD0:
						console.log("Unsupported Event", "0x" + (status & 0xf0).toString(16) + " at 0x" + (index-1).toString(16));
						index++;
						break;
					case 0xF0:
						switch (status) {
							case 0xF0:
							case 0xF7:
								throw new Error("Sysex Events not supported");
							case 0xFF:
								const type = view.getUint8(index++);
								const length = view.getUint8(index++);
								index += length;
								break;
							default:
								throw new Error("Unsupported Event Type " +  "0x" + status.toString(16) + " at 0x" + index.toString(16));
						}
						break;
					default:
						if (status < 0x80) {
							// Continuation - "Running Mode"
							index--; // backtrack
							const prevChannel = prevStatus & 0x0F;
							switch (prevStatus & 0xF0) {
								case 0x80:
									key = view.getUint8(index++);
									velocity = view.getUint8(index++);
									this.noteOff(nextTime, prevChannel, key, velocity);
									break;
								case 0x90:
									key = view.getUint8(index++);
									velocity = view.getUint8(index++);
									this.noteOff(nextTime, prevChannel, key, velocity);
									break;
								case 0xA0:
								case 0xB0:
								case 0xE0:
									console.log("Unsupported Continuation Event", "0x" + (prevStatus & 0xf0).toString(16) + " at 0x" + (index-1).toString(16));
									index++;
									index++;
									break;
								case 0xC0:
								case 0xD0:
									console.log("Unsupported Continuation Event", "0x" + (prevStatus & 0xf0).toString(16) + " at 0x" + (index-1).toString(16));
									index++;
									break;
								default:
									throw new Error("Unsupported Continuation Event Type " +  "0x" + prevStatus.toString(16) + " at 0x" + index.toString(16));

							}
						}
						else {
							throw new Error("Unsupported Event Type " + "0x" + status.toString(16) + " at 0x" + (index-1).toString(16));
						}
				}

				if (status & 0x80) {
					prevStatus = status;
				}
			}

			trackNo++;
		}
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

		const freq = getNoteFreq(key);

		const o = this.audioContext.createOscillator();
		o.connect(this.destination);
		o.frequency.setValueAtTime(freq, when);
		o.start(when);

		oscillators[key] = o;

		console.log({ status: "NOTE_ON", key, velocity, time: when });
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

		console.log({ status: "NOTE_OFF", key, velocity, time: when });
	}
}

function intval (c) {
	return c.charCodeAt(0);
}

function charval (i) {
	return String.fromCharCode(i);
}