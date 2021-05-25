import React from 'react';
import Synth from './synth';

export default function Keys ({ noteStates, noteOn, noteOff, lowestNote = 21 }) {
    return <div id="keys">
        {
            range(96).map(i => {
                const note = i + lowestNote;

                return (
                    <button
                        key={note}
                        className={`key ${Synth.isSharp(note) ? "sharp" : "key"} ${noteStates.includes(note) ? "on" : "off"}`}
                        onPointerDown={() => noteOn(note)}
                        onPointerUp={() => noteOff(note)}
                        onPointerEnter={e => e.buttons & 1 && noteOn(note)}
                        onPointerLeave={() => noteOff(note)}
                    >
                        {Synth.getNoteName(note)}
                    </button>
                );
            })
        }
    </div>
}

function range (n) {
    return Array(n).fill(0).map((_,i)=>i);
}