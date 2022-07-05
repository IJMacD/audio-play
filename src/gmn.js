const noteRe = /([a-g])(#|&)?(-?\d)?(?:\/(\d{1,2}))?(\.*)/i;
const tsRe = /\\meter<"(\d)\/(\d)">/

const NOTE_INDEX = "ccddeffggaab";

// See https://wiki.ccarh.org/wiki/Guido_Music_Notation

// Example: Drunken Sailor
//      a a/8 a a/4 a/8 a a/4 d f a g g/8 g g/4 g/8 g g/4 c e g a a/8 a a/4 a/8 a a/4 b c2 d c a1 g e d/2 d
// Example: Incy Wincy Spider
//     \meter<"6/8"> g g/8 g/4 a/8 b/4. b b/8 a/4 g/8 a/4 b/8 g/2.
//     b/4. b c2/8 d/4. d d/8 c/4 b1/8 c2/4 d/8 b1/2. g/4. g a/8
//     b/4. b b/8 a/4 g/8 a/4 b/8 g/4. d. g g/8 g/4 a/8
//     b/4. b b/8 a/4 g/8 a/4 b/8 g/2.
// Example Ba Ba Black Sheep
//     \meter<"2/4">
//     d d a a b/8 c#2 d b1 a/2 g/4 g
//     f# f# e e d/2 a/4 a/8 a g/4 g/8 g
//     f#/4 f#/8 f# e/4 e a/4 a/8 a g a b g f#/4 e/8 e d/2

const gmn = {
    /**
     * @param {string} input
     * @returns {{ melody: import("./synth").MelodyNote[], timeSignature: [number,number]? }?}
     */
    parse (input) {
        let timeSignature = null;

        const tsMatch = tsRe.exec(input);
        if (tsMatch) {
            /** @type {[number,number]} */
            timeSignature = [+tsMatch[1],+tsMatch[2]];
            input = input.replace(tsRe, "");
        }

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

            if (match[3]) {
                stickyOctave = +match[3];
            }

            if (match[4]) {
                stickyDuration = +match[4];
            }

            const trueOctave = stickyOctave + 4;

            let noteOffset = NOTE_INDEX.indexOf(match[1].toLowerCase());

            if (noteOffset < 0) {
                return null;
            }

            if (match[2] === "#") {
                noteOffset++;
            }
            else if (match[2] === "&") {
                noteOffset--;
            }

            const note = trueOctave * 12 + noteOffset;

            const multiplier = match[5] === "." ? 1.5 : 1;

            const count = 4 / stickyDuration * multiplier;

            melody.push({ note, count });
        }

        return { melody, timeSignature };
    }
}

export default gmn;

