import { useState } from "react";

export function Metronome ({ tempo }) {
    const [ paused, setPaused ] = useState(true);
    const togglePaused = () => setPaused(!paused);
    return <div className="Metronome" title="Metronome" onClick={togglePaused}><div className="Metronome-Hand" style={{ animationDuration: `${60/tempo}s`, animationPlayState: paused ? "paused" : "running" }} /></div>;
}