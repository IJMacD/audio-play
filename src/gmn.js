const noteRe = /([a-g])(-?\d)?(?:\/(\d{1,2}))?/i;

const NOTE_INDEX = "ccddeffggaab";

// See https://wiki.ccarh.org/wiki/Guido_Music_Notation

// Example: [ c4 d e f/8 g ]
// Example: a a/8 a a/4 a/8 a a/4 d f a g g/8 g g/4 g/8 g g/4 c e g a a/8 a a/4 a/8 a a/4 b c2 d c a1 g e d/2 d

const gmn = {
    parse (input) {
        const parts = input.trim().split(/\s+/);
        const melody = /** @type {import("./synth").MelodyNote[]} */ ([]);

        let stickyOctave = 1;   // Octave 1 = C4 -> B4
        let stickyDuration = 4; // Quarter note

        for (const part of parts) {
            const match = noteRe.exec(part);

            if (!match) {
                // Failed to parse whole string
                return null;
            }

            if (match[2]) {
                stickyOctave = +match[2];
            }

            if (match[3]) {
                stickyDuration = +match[3];
            }

            const trueOctave = stickyOctave + 4;

            const noteOffset = NOTE_INDEX.indexOf(match[1].toLowerCase());

            if (noteOffset < 0) {
                return null;
            }

            const note = trueOctave * 12 + noteOffset;

            const count = 4 / stickyDuration;

            melody.push({ note, count });
        }

        return melody;
    }
}

export default gmn;

