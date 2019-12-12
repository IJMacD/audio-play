import React from 'react';
import synth from "./synth";

export default function Staff ({ notes }) {
    const scale = 5;
    const offset = 270;

    return (
        <p className="Staff">
            𝄞
            { notes.map((n,i) => 
                <span key={i} title={synth.getNoteName(n)} className="Staff-note" style={{ bottom: n * scale - offset }}>𝅘𝅥</span>
            ) }
        </p>
    );
}