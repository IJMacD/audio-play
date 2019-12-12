import React from 'react';
import './App.css';
import Keys from './Keys';
import Staff from './Staff';
import synth from './synth';

const keyMap = '`1234567890-=qwertyuiop[]\\asdfghjkl;\'zxcvbnm,./';
const dvorakMap = '1234567890[]\',.pyfgcrl/=aoeuidhtns-\\\\;qjkxbmwvz';

function mapKeyEventToNote (e) {
    const index = e.key === "#" ? 25 : keyMap.indexOf(e.key.toLowerCase());

    if (index < 0) {
        return -1;
    };

    return index + 23;
}

class App extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            instrument: 303,
            melody: [],
            isRecording: false,
        };

        this.noteOn = this.noteOn.bind(this);
        this.noteOff = this.noteOff.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleSynthNote = () => this.forceUpdate();
        this.handleRecordingButton = this.handleRecordingButton.bind(this);
        this.handlePlayButton = this.handlePlayButton.bind(this);
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
        const note = mapKeyEventToNote(e);

        if (note >= 0) {
            e.preventDefault();
            this.noteOn(note);
        }
    }

    handleKeyUp (e) {
        const note = mapKeyEventToNote(e);

        if (note >= 0) {
            e.preventDefault();
            this.noteOff(note);
        }
    }

    componentDidMount () {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        document.addEventListener('keypress', this.handleKeyPress);
        synth.addListener(this.handleSynthNote);
    }
    
    componentWillUnmount () {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('keypress', this.handleKeyPress);
        synth.removeListener(this.handleSynthNote);
    }

    render () {
        const { melody, isRecording } = this.state;
        const { noteStates } = synth;

        return (
            <div className="App">
                <Keys noteStates={noteStates} noteOn={this.noteOn} noteOff={this.noteOff} />
                <input type="number" value={this.state.instrument} onChange={e => this.setState({ instrument: e.target.value })} />
                <div>
                    <button onClick={this.handleRecordingButton}>{ isRecording ? "Stop" : "Record" }</button>
                    <button onClick={this.handlePlayButton} disabled={this.state.melody.length === 0}>Play</button>
                    <Staff notes={melody} />
                </div>
            </div>
        );
    }
}

export default App;
