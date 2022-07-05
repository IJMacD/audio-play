import React from 'react';
import synth from "./synth";

const NOTES = {
    0.25: "𝅘𝅥𝅯",
    0.5: "𝅘𝅥𝅮",
    1: "𝅘𝅥",
    2: "𝅗𝅥",
    4: "𝅝",
};

/**
 *
 * @param {object} props
 * @param {import('./synth').MelodyNote[]} props.notes
 * @param {[number,number]} [props.timeSignature]
 * @param {(index: number, e: import('react').MouseEvent) => void} [props.onNoteClick]
 * @param {number} [props.selectedIndex]
 * @returns
 */
export default function Staff ({ notes, timeSignature, onNoteClick, selectedIndex }) {
    const scale = 5; // CSS pixels

    const staffParts = [];

    let count = 0;
    let i = 0;

    for (const n of notes) {
        const offset = getNoteStaffOffset(n.note);

        if (offset >= -3 && offset <= 12) {
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

            if (synth.isSharp(n.note)) {
                symbol = <><span className='Staff-Accidental'>♯</span>{symbol}</>;
            }

            staffParts.push({
                type: "note",
                title: synth.getNoteName(n.note),
                bottom: offset * scale,
                symbol,
                selected: i === selectedIndex,
                index: i++,
            });

            count += n.count;

            if (timeSignature && count / 4 * timeSignature[1] % timeSignature[0] === 0) {
                staffParts.push({ type: "bar", symbol: i === notes.length ? "𝄂" : "𝄀" });
            }
        }
    }

    return (
        <p className="Staff">
            𝄞
            {
                timeSignature && <span className='Staff-TimeSignature'><sup>{timeSignature[0]}</sup><br/><sub>{timeSignature[1]}</sub></span>
            }
            { staffParts.map((part,i) => {
                if (part.type === "note") {
                    return <span
                        key={i}
                        className="Staff-note"
                        title={part.title}
                        style={{ bottom: part.bottom, color: part.selected ? "red" : void 0 }}
                        onClick={e => onNoteClick?.(part.index??-1, e)}
                    >
                        {part.symbol}
                    </span>
                }
                else if (part.type === "bar") {
                    return <span
                        key={i}
                        className="Staff-bar"
                    >
                        {part.symbol}{' '}
                    </span>

                }
            }) }
        </p>
    );
}

const sharps = [0,0,1,1,2,3,3,4,4,5,5,6];
function getNoteStaffOffset (note) {
    return Math.floor(note/12) * 7 + sharps[note%12] - 38;
}