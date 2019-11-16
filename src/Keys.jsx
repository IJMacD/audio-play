import React from 'react';
import Synth from './synth';

export default function Keys ({ noteStates, noteOn, noteOff }) {
    return <div id="keys">
        {
            range(96).map(i => (
                <button
                    key={i}
                    className={`key ${Synth.isSharp(i) ? "sharp" : "key"} ${noteStates.includes(i) ? "on" : "off"}`}
                    onPointerDown={() => noteOn(i)}
                    onPointerUp={() => noteOff(i)}
                    onPointerEnter={e => e.buttons & 1 && noteOn(i)}
                    onPointerLeave={() => noteOff(i)}
                >
                    {Synth.getNoteName(i)}
                </button>
            ))
        }
    </div>
}

function range (n) {
    return Array(n).fill(0).map((_,i)=>i);
}