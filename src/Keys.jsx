import React from 'react';
import Synth from './synth';

export default function Keys ({ noteStates, noteOn, noteOff }) {
    return <div id="keys">
        {
            range(96).map(i => (
                <button
                    key={i}
                    className={`key ${Synth.isSharp(i) ? "sharp" : "key"} ${noteStates.includes(i) ? "on" : "off"}`}
                    onMouseDown={() => noteOn(i)}
                    onMouseUp={() => noteOff(i)}
                    onMouseEnter={e => e.which === 1 && noteOn(i)}
                    onMouseLeave={() => noteOff(i)}
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