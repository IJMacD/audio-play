import React from 'react';
import synth from "./synth";

const NOTES = {
    0.25: "𝅘𝅥𝅯",
    0.5: "𝅘𝅥𝅮",
    1: "𝅘𝅥",
    2: "𝅗𝅥",
    4: "𝅝",
};

const REST_SYMBOL = {
    0.25: "𝄿",
    0.5: "𝄾",
    1: "𝄽",
    2: "𝄼",
    4: "𝄻",
}

const CIRCLE_OF_FIFTHS_SHARP = "fcgdaeb";
const CIRCLE_OF_FIFTHS_FLAT = "beadgcf";

const KEY_OFFSETS_SHARP = {
    a: 0,
    b: 1,
    c: 2,
    d: 3,
    e: 4,
    f: 5,
    g: 6,
};

const KEY_OFFSETS_FLAT = {
    a: 0,
    b: 1,
    c: 2,
    d: 3,
    e: 4,
    f: -2,
    g: -1,
};

/**
 *
 * @param {object} props
 * @param {import('./synth').MelodyNote[]} props.notes
 * @param {[number,number]} [props.timeSignature]
 * @param {number} [props.keySignature]
 * @param {(index: number, e: import('react').MouseEvent) => void} [props.onNoteClick]
 * @param {number} [props.selectedIndex]
 * @returns
 */
export default function Staff ({ notes, timeSignature, keySignature, onNoteClick, selectedIndex }) {
    const scale = 5; // CSS pixels; (CSS background 10px spacing)

    const staffParts = [];

    const keySharps = keySignature && keySignature > 0 ? [...CIRCLE_OF_FIFTHS_SHARP.slice(0, keySignature)] : [];
    const keyFlats = keySignature && keySignature < 0 ? [...CIRCLE_OF_FIFTHS_FLAT.slice(0, -keySignature)] : [];

    let count = 0;
    let i = 0;

    for (const n of notes) {
        if (n.pitch === synth.REST) {
            staffParts.push({
                type: "rest",
                symbol: REST_SYMBOL[n.count],
                selected: i === selectedIndex,
                index: i++,
            });

        }
        else
        {

            const offset = getNoteStaffOffset(n.pitch);

            let symbol = NOTES[n.count];

            if (!symbol) {
                symbol = NOTES[n.count / 1.5];

                if (symbol) {
                    symbol += "\u200d\u{1d16d}";
                }
                else {
                    symbol = "𝅆";
                }
            }

            const noteName = synth.getNoteName(n.pitch)[0].toLowerCase();

            if (synth.isSharp(n.pitch) && !keySharps.includes(noteName)) {
                symbol = <><span className='Staff-Accidental'>♯</span>{symbol}</>;
            }
            else if (!synth.isSharp(n.pitch) && keySharps.includes(noteName)) {
                symbol = <><span className='Staff-Accidental'>♮</span>{symbol}</>;
            }

            staffParts.push({
                type: "note",
                title: synth.getNoteName(n.pitch),
                bottom: offset * scale,
                symbol,
                selected: i === selectedIndex,
                index: i++,
            });
        }

        count += n.count;

        if (timeSignature && count / 4 * timeSignature[1] % timeSignature[0] === 0) {
            staffParts.push({ type: "bar", symbol: i === notes.length ? "𝄂 " : "𝄀 " });
        }
    }

    const keySignatureMarkers =
        [
            ...keySharps.map(c => ({ bottom: KEY_OFFSETS_SHARP[c] * scale - 2, symbol: "♯" })),
            ...keyFlats.map(c => ({ bottom: KEY_OFFSETS_FLAT[c] * scale + 1, symbol: "♭" })),
        ];

    return (
        <p className="Staff">
            𝄞
            {
                keySignatureMarkers.map(marker => <span key={marker.bottom} className='Staff-KeySignature' style={{ bottom: marker.bottom }}>{marker.symbol}</span>)
            }
            {
                timeSignature && <span className='Staff-TimeSignature'><sup>{timeSignature[0]}</sup><br/><sub>{timeSignature[1]}</sub></span>
            }
            { staffParts.map((part,i) => {
                const { index, bottom } = part;
                const onClick = typeof index === "number" && onNoteClick ?
                    e => onNoteClick(index, e) :
                    undefined;

                return <span
                    key={i}
                    className={`Staff-${ucfirst(part.type)}`}
                    title={part.title}
                    style={{ bottom, color: part.selected ? "red" : void 0 }}
                    onClick={onClick}
                >
                    {part.symbol}
                </span>
            }) }
        </p>
    );
}

const sharps = [0,0,1,1,2,3,3,4,4,5,5,6];
function getNoteStaffOffset (note) {
    return Math.floor(note/12) * 7 + sharps[note%12] - 38;
}

/**
 * @param {string} string
 */
function ucfirst (string) {
    return string[0]?.toUpperCase() + string.substring(1);
}