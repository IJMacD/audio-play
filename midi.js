class MidiPlayer {
	constructor (synth) {
		this.synth = synth;
	}

	openFile (buffer) {
		this.buffer = buffer;
	}

	connect (destination) {
		this.destination = destination;
	}

	start (when = 0) {
		when = Math.max(when, this.synth.currentTime);

		const midi = parseMidi(this.buffer);

		const synthTracks = [];

		midi.tracks.forEach((track,i) => {

			let nextTime = when;

			const tempo = track.tempo || 500000;	// Microseconds per quarter note (500000 = 120 bpm)

			const program = 11;

			const synthTrack = this.synth.createTrack();

			synthTracks.push(synthTrack);

			track.events.forEach(evt => {
				nextTime += evt.deltaTime * ((tempo / midi.division) * 1e-6);

				if (evt.type === 0x80) {
					synthTrack.noteOff(evt.key - 17, nextTime, evt.velocity / 127);
				}
				else if (evt.type === 0x90) {
					synthTrack.noteOn(program, evt.key - 17, nextTime, evt.velocity / 127);
				}
			});
		});

		return synthTracks;
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
	const division = view.getUint16(12);	// ticks per quarter note

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

		const track = { events: [], channels: {} };
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
				// Continuation Data
				status = prevStatus;
				index--;
			}

			if(typeof status === "undefined") {
				throw new Error("Continuation Event found without previous event");
			}

			const eventRes = parseEvent(view, index, status);

			if (eventRes.event) {
				const { event }  = eventRes;
				if (event.type === 0xFF &&
					event.metaType === 0x2F)
				{
					// 0x2F: End of Track Meta Event
					track.length = currTime;
				}
				else {
					event.deltaTime = deltaTime;
					track.events.push(event);

					const { channel } = event;
					if (!track.channels[channel]) {
						track.channels[channel] = { };
					}

					if(typeof event.controller !== "undefined") {
						const { controller, value } = event;
						if (!track.channels[channel].controllers) {
							track.channels[channel].controllers = {};
						}
						if (typeof track.channels[channel].controllers[controller] === "undefined") {
							// Only capture first first controller value
							track.channels[channel].controllers[controller] = value;
						} else {
							// Controller values changed in the middle of the track - that's
							// interesting so we'll log it.
							console.info("Controller Value changed in middle of Track", event);
						}
					}

					if(typeof event.program !== "undefined") {
						const { program } = event;
						if (typeof track.channels[channel].program === "undefined") {
							// Only capture first first program value
							track.channels[channel].program = program;
						} else {
							// Program changed in the middle of the track - that's
							// interesting so we'll log it.
							console.info("Program changed in middle of Track", event);
						}
					}
				}
			}

			if (eventRes.meta) {
				const { channel, ...rest } = eventRes.meta;
				if (typeof channel !== "undefined") {
					if (!track.channels[channel]) {
						track.channels[channel] = {};
					}
					meta = track.channels[channel];
				}
				Object.assign(meta, rest);
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
							// Lyrics, notes etc.
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
						default:
							console.debug("Unrecognised meta event 0x" + metaType.toString(16));
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
