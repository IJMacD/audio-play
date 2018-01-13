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

		const tempo = 500000;	// Microseconds per quater note (500000 = 120 bpm)

		const concertPitch = 440; // Note A4, 440 Hz
		const concertPitchMidiNum = 0x45;
		const noteRatio = Math.exp(Math.LN2 / 12);

		function getNoteFreq (num) {
			return concertPitch * Math.pow(noteRatio, num - concertPitchMidiNum);
		}

		midi.tracks.forEach(track => {

			let nextTime = when;

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

		const freq = getNoteFreq(key);

		const o = this.audioContext.createOscillator();
		o.connect(this.destination);
		o.frequency.setValueAtTime(freq, when);
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

		while (index < endIndex) {
			const res = parseVariableLength(view, index);
			const deltaTime = res.value;
			index = res.index;

			const status = view.getUint8(index++);
			const channel = status & 0x0f;

			let key;
			let velocity;

			switch (status & 0xf0) {
				case 0x80:
				case 0x90:
					key = view.getUint8(index++);
					velocity = view.getUint8(index++);

					track.events.push({ deltaTime, type: status & 0xf0, channel, key, velocity });

					break;
				case 0xA0:
					key = view.getUint8(index++);
					var pressure = view.getUint8(index++);

					track.events.push({ deltaTime, type: status & 0xf0, channel, key, pressure });
					break;
				case 0xB0:
					var controller = view.getUint8(index++);
					var value = view.getUint8(index++);

					track.events.push({ deltaTime, type: status & 0xf0, channel, controller, value });
					break;
				case 0xC0:
					var program = view.getUint8(index++);

					track.events.push({ deltaTime, type: status & 0xf0, channel, program });
					break;
				case 0xD0:
					var pressure = view.getUint8(index++);

					track.events.push({ deltaTime, type: status & 0xf0, channel, pressure });
					break;
				case 0xE0:
					var value = view.getUint16(index);
					index += 2;

					track.events.push({ deltaTime, type: status & 0xf0, channel, value });
					break;
				case 0xF0:
					switch (status) {
						case 0xF0:
						case 0xF7:
							console.error("Sysex Events not supported");
							break;
						case 0xFF:
							const type = view.getUint8(index++);
							const length = view.getUint8(index++);
							let text;
							if (type !== 0x00 && type < 0x08) {
								text = getAsciiText(view, index, length);
							}
							switch (type) {
								case 0x00:
									meta.sequenceNumber = view.getUint16(index);
									break;
								case 0x01:
								case 0x05:
								case 0x06:
								case 0x07:
									track.events.push({ deltaTime, type: status, text });
									break;
								case 0x02:
									meta.copyright = text;
									break;
								case 0x03:
									meta.name = text;
									break;
								case 0x04:
									meta.instrument = text;
									break;
								case 0x20:
									const channel = view.getUint8(index);
									if (!track.channelMeta) {
										track.channelMeta = {};
									}
									if (!track.channelMeta[channel]) {
										track.channelMeta[channel] = {};
									}
									meta = track.channelMeta[channel];
									break;
							}
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
							case 0x90:
								key = view.getUint8(index++);
								velocity = view.getUint8(index++);
								track.events.push({ deltaTime, type: prevStatus & 0xf0, channel: prevChannel, key, velocity });
								break;
							case 0xA0:
								key = view.getUint8(index++);
								var pressure = view.getUint8(index++);

								track.events.push({ deltaTime, type: prevStatus & 0xf0, channel: prevChannel, key, pressure });
								break;
							case 0xB0:
								var controller = view.getUint8(index++);
								var value = view.getUint8(index++);

								track.events.push({ deltaTime, type: prevStatus & 0xf0, channel: prevChannel, controller, value });
								break;
							case 0xC0:
								var program = view.getUint8(index++);

								track.events.push({ deltaTime, type: prevStatus & 0xf0, channel: prevChannel, program });
								break;
							case 0xD0:
								var pressure = view.getUint8(index++);

								track.events.push({ deltaTime, type: prevStatus & 0xf0, channel: prevChannel, pressure });
								break;
							case 0xE0:
								var value = view.getUint16(index);
								index += 2;

								track.events.push({ deltaTime, type: prevStatus & 0xf0, channel: prevChannel, value });
								break;
							case 0xF0:
								switch (status) {
									case 0xF0:
									case 0xF7:
										console.error("Sysex Continuation Events not supported");
										break;
									default:
										console.error("Continuation Meta events?");
								}
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

function getAsciiText(dataView, index, length) {
	const arr = [];
	for(let i = index; i < index + length; i++) {
		const b = dataView.getUint8(i);
		arr.push(String.fromCharCode(b));
	}
	return arr.join("");
}