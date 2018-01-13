const sample = new Uint8Array([
	// Header Chunk
	intval('M'), intval('T'), intval('h'), intval('d'),
	0, 0, 0, 6,	// Length
		0, 0, // Format
		0, 1, // Tracks
		0, 4, // Division, ticks per quarter note
	// Track 1 Chunk
	intval('M'), intval('T'), intval('r'), intval('k'),
	0, 0, 0, 88, // Length
		// Midi Event
		0, // delta-time (ticks)
		0x90, // Note on, Channel 0
		0x34, // E3
		0x40, // Velocity
		// Midi Event
		2, // delta-time (ticks)
		0x80, // Note off, Channel 0
		0x34, // E3
		0x40, // Velocity
		// Midi Event
		2, // delta-time (ticks)
		0x90, // Note on, Channel 0
		0x34, // E3
		0x40, // Velocity
		// Midi Event
		2, // delta-time (ticks)
		0x80, // Note off, Channel 0
		0x34, // E3
		0x40, // Velocity
		2, // delta-time (ticks)
		0x90, // Note on, Channel 0
		0x34, // E3
		0x40, // Velocity
		// Midi Event
		4, // delta-time (ticks)
		0x80, // Note off, Channel 0
		0x34, // E3
		0x40, // Velocity

		// Midi Event
		2, // delta-time (ticks)
		0x90, // Note on, Channel 0
		0x34, // E3
		0x40, // Velocity
		// Midi Event
		2, // delta-time (ticks)
		0x80, // Note off, Channel 0
		0x34, // E3
		0x40, // Velocity
		// Midi Event
		2, // delta-time (ticks)
		0x90, // Note on, Channel 0
		0x34, // E3
		0x40, // Velocity
		// Midi Event
		2, // delta-time (ticks)
		0x80, // Note off, Channel 0
		0x34, // E3
		0x40, // Velocity
		2, // delta-time (ticks)
		0x90, // Note on, Channel 0
		0x34, // E3
		0x40, // Velocity
		// Midi Event
		4, // delta-time (ticks)
		0x80, // Note off, Channel 0
		0x34, // E3
		0x40, // Velocity

		// Midi Event
		2, // delta-time (ticks)
		0x90, // Note on, Channel 0
		0x34, // E3
		0x40, // Velocity
		// Midi Event
		2, // delta-time (ticks)
		0x80, // Note off, Channel 0
		0x34, // E3
		0x40, // Velocity
		// Midi Event
		2, // delta-time (ticks)
		0x90, // Note on, Channel 0
		0x37, // G3
		0x40, // Velocity
		// Midi Event
		2, // delta-time (ticks)
		0x80, // Note off, Channel 0
		0x37, // G3
		0x40, // Velocity
		2, // delta-time (ticks)
		0x90, // Note on, Channel 0
		0x30, // C3
		0x40, // Velocity
		// Midi Event
		3, // delta-time (ticks)
		0x80, // Note off, Channel 0
		0x30, // C3
		0x40, // Velocity
		2, // delta-time (ticks)
		0x90, // Note on, Channel 0
		0x32, // D3
		0x40, // Velocity
		// Midi Event
		1, // delta-time (ticks)
		0x80, // Note off, Channel 0
		0x32, // D3
		0x40, // Velocity

		2, // delta-time (ticks)
		0x90, // Note on, Channel 0
		0x34, // E3
		0x40, // Velocity
		// Midi Event
		8, // delta-time (ticks)
		0x80, // Note off, Channel 0
		0x34, // E3
		0x40, // Velocity

]).buffer;

function intval (c) {
	return c.charCodeAt(0);
}