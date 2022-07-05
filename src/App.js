import React from 'react';
import './App.css';
import gmn from './gmn';
import Keys from './Keys';
import Staff from './Staff';
import synth from './synth';

const keyMap = '`1234567890-=qwertyuiop[]\\asdfghjkl;\'zxcvbnm,./';
const KEYBOARD_START = 48;
// const dvorakMap = '1234567890[]\',.pyfgcrl/=aoeuidhtns-\\\\;qjkxbmwvz';
const SAVED_STATE_KEY = "AUDIO_PLAY_STATE";
const HIFI = false;

function mapKeyEventToNote (e) {
    const index = e.key === "#" ? 25 : keyMap.indexOf(e.key.toLowerCase());

    if (index < 0) {
        return -1;
    };

    return index + KEYBOARD_START;
}

/**
 * @typedef AppState
 * @prop {number} instrument
 * @prop {import('./synth').MelodyNote[]} melody
 * @prop {boolean} isRecording
 * @prop {{ inputs: MIDIInput[]; outputs: MIDIOutput[] }} midiDevices
 * @prop {boolean} showKeyMap
 * @prop {number} tempo
 * @prop {number} currentMelodyIndex
 * @prop {string} gmnText
 * @prop {boolean} keyboardEnabled
 * @prop {boolean} synthEnabled
 */

class App extends React.Component {
    constructor (props) {
        super(props);

        /**
         * @type {AppState}
         */
        this.state = {
            instrument: 303,
            melody: [],
            isRecording: false,
            midiDevices: { inputs: [], outputs: [] },
            showKeyMap: false,
            tempo: 120,
            currentMelodyIndex: -1,
            gmnText: "",
            keyboardEnabled: true,
            synthEnabled: true,
            ...getSavedState(SAVED_STATE_KEY),
        };

        this.noteOn = this.noteOn.bind(this);
        this.noteOff = this.noteOff.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleSynthNote = () => this.forceUpdate();
        this.handleRecordingButton = this.handleRecordingButton.bind(this);
        this.handlePlayButton = this.handlePlayButton.bind(this);
        this.handleMelodyClick = this.handleMelodyClick.bind(this);
        this.handleGMNTextChange = this.handleGMNTextChange.bind(this);

        this.activeInputs = [];
    }

    /**
     * @param {number} note
     */
    noteOn (note) {
        if (this.state.synthEnabled) {
            synth.noteOn(this.state.instrument, note);
        }

        for (const output of this.state.midiDevices.outputs) {
            output.send(makeMidiMessage(MIDI_NOTE_ON, 1, note, 100))
        }

        if (this.state.isRecording) {
            this.setState({ melody: [ ...this.state.melody, { note, count: 1 } ] });
        }
    }

    /**
     * @param {number} note
     */
    noteOff (note) {
        synth.noteOff(note);

        for (const output of this.state.midiDevices.outputs) {
            output.send(makeMidiMessage(MIDI_NOTE_OFF, 1, note))
        }
    }

    /**
     * @param {import('./synth').MelodyNote[]} melody
     * @param {number} tempo
     */
    playTune (melody, tempo) {
        let now = 0.1; // tenth of a second delay to give JS a chance
        let index = 0;
        for (const n of melody) {
            const i = index++;
            setTimeout(() => {
                this.noteOn(n.note);
                this.setState({ currentMelodyIndex: i });
            }, now * 1000);
            now += n.count * 60 / tempo;
            setTimeout(() => this.noteOff(n.note), now * 1000);
        }
        setTimeout(() => this.setState({ currentMelodyIndex: -1 }), now * 1000);
    }

    /**
     * @param {KeyboardEvent|import("react").MouseEvent} e
     */
    handleRecordingButton (e) {
        const { isRecording } = this.state;
        const melody = isRecording || e.shiftKey ? this.state.melody : [];
        this.setState({ isRecording: !isRecording, melody });
    }

    handlePlayButton () {
        this.setState({ isRecording: false });
        if (HIFI) {
            // Could offload to synth to handle playback
            // (beter note timing)
            synth.playTune(this.state.melody, this.state.tempo);
        }
        else {
            // or use our own setTimeout based implementation
            // (visual feedback)
            this.playTune(this.state.melody, this.state.tempo);
        }
    }

    /**
     *
     * @param {KeyboardEvent} e
     */
    handleKeyPress (e) {
        if (e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement)
        {
            return;
        }

        if (e.key === "Enter") {
            this.handleRecordingButton(e);
        } else if (e.key === " ") {
            this.handlePlayButton();
        }
    }

    /**
     * @param {KeyboardEvent} e
     */
    handleKeyDown (e) {
        if (e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement)
        {
            return;
        }

        if (e.key === "ArrowUp") {
            this.previousInstrument();
        } else if (e.key === "ArrowDown") {
            this.nextInstrument();
        } else if (this.state.keyboardEnabled) {

            const note = mapKeyEventToNote(e);

            if (note >= 0) {
                e.preventDefault();
                this.noteOn(note);
            }
        }
    }

    nextInstrument() {
        const instrumentList = synth.getInstrumentList();
        const currentIndex = instrumentList.indexOf(this.state.instrument);
        const instrument = instrumentList[(currentIndex + instrumentList.length - 1) % instrumentList.length];
        this.setState({ instrument });
    }

    previousInstrument() {
        const instrumentList = synth.getInstrumentList();
        const currentIndex = instrumentList.indexOf(this.state.instrument);
        const instrument = instrumentList[(currentIndex + 1) % instrumentList.length];
        this.setState({ instrument });
    }

    handleKeyUp (e) {
        const note = mapKeyEventToNote(e);

        if (note >= 0) {
            e.preventDefault();
            this.noteOff(note);
        }
    }

    /**
     *
     * @param {MIDIEvent} event
     */
    handleMidiEvent (event) {
        if (event.type === MIDI_NOTE_ON) {
            this.noteOn(event.note);
        } else if (event.type === MIDI_NOTE_OFF) {
            this.noteOff(event.note);
        }
    }

    /**
     * @param {number} index
     * @param {import('react').MouseEvent} e
     */
    handleMelodyClick (index, e) {
        this.setState(({ melody: oldMelody }) =>
            ({
                melody: oldMelody.map((/** @type {import('./synth').MelodyNote} */ n, /** @type {number} */ i) => {
                    if (i === index) {
                        let { note, count } = n;
                        count /= 2;
                        if (count < 0.25) count = 4;
                        return { note, count };
                    }
                    return n;
                })
            })
        );
    }

    /**
     *
     * @param {import("react").ChangeEvent<HTMLTextAreaElement>} e
     */
    handleGMNTextChange (e) {
        const gmnText = e.target.value;
        this.setState({ gmnText });

        const melody = gmn.parse(gmnText);
        if (melody) {
            this.setState({ melody });
        }
    }

    componentDidMount () {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        document.addEventListener('keypress', this.handleKeyPress);
        synth.addListener(this.handleSynthNote);

        // @ts-ignore
        navigator.requestMIDIAccess().then(access => {
            const updateDevices = () => {
                const inputs = [...access.inputs.values()];
                const outputs = [...access.outputs.values()];

                for (const input of inputs) {
                    if (!this.activeInputs.includes(input.id)) {
                        input.addEventListener("midimessage",
                            e => this.handleMidiEvent(
                                // @ts-ignore
                                parseMidiEvent(e.data)
                            )
                        );
                        this.activeInputs.push(input.id);
                    }
                }

                this.setState({ midiDevices: { inputs, outputs }});
            };

            updateDevices();

            this.midiAccess = access;
            this.midiStateCallback = e => {
                console.log(e);
                updateDevices();
            };

            access.addEventListener("statechange", this.midiStateCallback);
        });
    }

    componentDidUpdate () {
        const { instrument, showKeyMap, melody, tempo, gmnText } = this.state;

        setSavedState(SAVED_STATE_KEY, { instrument, showKeyMap, melody, tempo, gmnText });
    }

    componentWillUnmount () {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('keypress', this.handleKeyPress);
        synth.removeListener(this.handleSynthNote);

        this.midiAccess && this.midiStateCallback &&
            this.midiAccess.removeEventListener("statechange", this.midiStateCallback);
    }

    render () {
        const { melody, isRecording, midiDevices, showKeyMap, tempo, currentMelodyIndex } = this.state;
        const { noteStates } = synth;

        const keyMapIndexed = showKeyMap ?
            // eslint-disable-next-line
            [...keyMap].reduce((o,c,i) => (o[i + KEYBOARD_START] = c, o), {})
            :
            undefined;

        return (
            <div className="App">
                <Keys noteStates={noteStates} noteOn={this.noteOn} noteOff={this.noteOff} lowestNote={21} keyMap={keyMapIndexed} />
                <input type="number" value={this.state.instrument} onChange={e => this.setState({ instrument: e.target.value })} />
                <label>
                    <input type="checkbox" checked={showKeyMap} onChange={e => this.setState({ showKeyMap: e.target.checked })} />
                    Show Key Map
                </label>
                <div>
                    <button onClick={this.handleRecordingButton}>{ isRecording ? "Stop" : "Record" }</button>
                    <button onClick={this.handlePlayButton} disabled={this.state.melody.length === 0}>Play</button>
                    <label>
                        Tempo
                        <input type="number" value={tempo} onChange={e => { e.stopPropagation(); this.setState({ tempo: +e.target.value }); }} />
                    </label>
                    <Staff notes={melody} onNoteClick={this.handleMelodyClick} selectedIndex={currentMelodyIndex} />
                </div>
                <div>
                    <textarea value={this.state.gmnText} onChange={this.handleGMNTextChange} style={{width: 500, height: 180}} />
                </div>
                <div>
                    <h2>Available devices</h2>
                    <h3>Inputs</h3>
                    <ul>
                        <li><label><input type="checkbox" checked={this.state.keyboardEnabled} onChange={e => this.setState({ keyboardEnabled: e.target.checked })} /> Keyboard</label></li>
                        {
                            midiDevices.inputs.map(d => <li key={d.id}><input type="checkbox" checked={this.activeInputs.includes(d.id)} readOnly /> {d.manufacturer} {d.name}</li>)
                        }
                    </ul>
                    <h3>Outputs</h3>
                    <ul>
                        <li><label><input type="checkbox" checked={this.state.synthEnabled} onChange={e => this.setState({ synthEnabled: e.target.checked })} /> Synth</label></li>
                        {
                            midiDevices.outputs.map(d => <li key={d.id}><input type="checkbox" checked readOnly /> {d.manufacturer} {d.name}</li>)
                        }
                    </ul>
                </div>
            </div>
        );
    }
}

export default App;

/**
 * @typedef {{type: number;channel: number;note: number;velocity: number;}} MIDIEvent
 */

/**
 *
 * @param {Uint8Array} bytes
 * @returns {MIDIEvent} */
function parseMidiEvent (bytes) {
    const [ status, note, velocity ] = bytes;
    const type = status & 0xf0;
    const channel = status & 0x0f;

    return { type, channel, note, velocity };
}

const MIDI_NOTE_ON = 0x90;
const MIDI_NOTE_OFF = 0x80;

function makeMidiMessage (type, channel, note, velocity = 0) {
    return [ type | channel, note, velocity ];
}

function getSavedState (key) {
    const saved = localStorage.getItem(key);

    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {}
    }

    return {};
}

function setSavedState (key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}