import React from 'react';
import './App.css';
import Keys from './Keys';
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

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleSynthNote = () => this.forceUpdate();
    }

    handleKeyDown (e) {
        const note = mapKeyEventToNote(e);

        if (note >= 0) {
            e.preventDefault();
            synth.noteOn(203, note);
        }
    }

    handleKeyUp (e) {
        const note = mapKeyEventToNote(e);

        if (note >= 0) {
            e.preventDefault();
            synth.noteOff(note);
        }
    }

    componentDidMount () {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        synth.addListener(this.handleSynthNote);
    }

    componentWillUnmount () {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        synth.removeListener(this.handleSynthNote);
    }

    render () {
        const { noteStates } = synth;

        return (
            <div className="App">
                <Keys noteStates={noteStates} noteOn={(i) => synth.noteOn(203, i)} noteOff={synth.noteOff.bind(synth)} />
            </div>
        );
    }
}

export default App;
