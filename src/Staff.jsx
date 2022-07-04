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
 * @param {(index: number, e: import('react').MouseEvent) => void} [props.onNoteClick]
 * @returns
 */
export default function Staff ({ notes, onNoteClick }) {
    const scale = 5; // CSS pixels

    const staffParts = [];

    let count = 0;
    let i = 0;

    for (const n of notes) {
        const offset = getNoteStaffOffset(n.note);

        if (offset >= -3 && offset <= 12) {
            staffParts.push({
                type: "note",
                title: synth.getNoteName(n.note),
                bottom: offset * scale,
                symbol: NOTES[n.count],
                index: i++,
            });

            count += n.count;

            if (count % 4 === 0) {
                staffParts.push({ type: "bar" });
            }
        }
    }

    return (
        <p className="Staff">
            𝄞
            { staffParts.map((part,i) => {
                if (part.type === "note") {
                    return <span
                        key={i}
                        title={part.title}
                        className="Staff-note"
                        style={{ bottom: part.bottom }}
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
                        𝄀
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