import React from 'react';
import './App.css';
import Keys from './Keys';
import Staff from './Staff';
import synth from './synth';

const keyMap = '`1234567890-=qwertyuiop[]\\asdfghjkl;\'zxcvbnm,./';
// const dvorakMap = '1234567890[]\',.pyfgcrl/=aoeuidhtns-\\\\;qjkxbmwvz';

function mapKeyEventToNote (e) {
    const index = e.key === "#" ? 25 : keyMap.indexOf(e.key.toLowerCase());

    if (index < 0) {
        return -1;
    };

    return index + 48;
}

class App extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            instrument: 303,
            melody: [],
            isRecording: false,
            midiDevices: { inputs: [], outputs: [] },
        };

        this.noteOn = this.noteOn.bind(this);
        this.noteOff = this.noteOff.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleSynthNote = () => this.forceUpdate();
        this.handleRecordingButton = this.handleRecordingButton.bind(this);
        this.handlePlayButton = this.handlePlayButton.bind(this);

        this.activeInputs = [];
    }

    noteOn (note) {
        synth.noteOn(this.state.instrument, note);

        if (this.state.isRecording) {
            this.setState({ melody: [ ...this.state.melody, note ] });
        }
    }

    noteOff (note) {
        synth.noteOff(note);
    }

    handleRecordingButton (e) {
        const { isRecording } = this.state;
        const melody = isRecording || e.shiftKey ? this.state.melody : [];
        this.setState({ isRecording: !isRecording, melody });
    }

    handlePlayButton () {
        this.setState({ isRecording: false });
        synth.playTune(this.state.melody);
    }

    /**
     *
     * @param {KeyboardEvent} e
     */
    handleKeyPress (e) {
        if (e.key === "Enter") {
            this.handleRecordingButton(e);
        } else if (e.key === " ") {
            this.handlePlayButton();
        }
    }

    handleKeyDown (e) {
        if (e.key === "ArrowUp") {
            this.previousInstrument();
        } else if (e.key === "ArrowDown") {
            this.nextInstrument();
        } else {

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

    componentDidMount () {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        document.addEventListener('keypress', this.handleKeyPress);
        synth.addListener(this.handleSynthNote);

        // @ts-ignore
        navigator.requestMIDIAccess().then(access => {
            const updateDevices = () => {
                const inputs = [...access.inputs.values()];

                for (const input of inputs) {
                    if (!this.activeInputs.includes(input.id)) {
                        input.addEventListener("midimessage", e => this.handleMidiEvent(parseMidiEvent(e.data)));
                        this.activeInputs.push(input.id);
                    }
                }

                this.setState({ midiDevices: { inputs, outputs: [...access.outputs.values()] }});
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

    componentWillUnmount () {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('keypress', this.handleKeyPress);
        synth.removeListener(this.handleSynthNote);

        this.midiAccess.removeEventListener("statechange", this.midiStateCallback);
    }

    render () {
        const { melody, isRecording, midiDevices } = this.state;
        const { noteStates } = synth;

        return (
            <div className="App">
                <Keys noteStates={noteStates} noteOn={this.noteOn} noteOff={this.noteOff} lowestNote={21} />
                <input type="number" value={this.state.instrument} onChange={e => this.setState({ instrument: e.target.value })} />
                <div>
                    <button onClick={this.handleRecordingButton}>{ isRecording ? "Stop" : "Record" }</button>
                    <button onClick={this.handlePlayButton} disabled={this.state.melody.length === 0}>Play</button>
                    <Staff notes={melody} />
                </div>
                <div>
                    <h2>Available MIDI devices</h2>
                    <h3>Inputs</h3>
                    <ul>
                        {
                            midiDevices.inputs.map(d => <li key={d.id}><input type="checkbox" checked={this.activeInputs.includes(d.id)} readOnly /> {d.manufacturer} {d.name}</li>)
                        }
                    </ul>
                    <h3>Outputs</h3>
                    <ul>
                        {
                            midiDevices.outputs.map(d => <li key={d.id}>{d.manufacturer} {d.name}</li>)
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