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

        this.state = {
            noteStates: [],
        };

        this.noteOn = i => this.setState(oldState => ({ noteStates: [ ...oldState.noteStates, i ] }),synth.noteOn(203,i));
        this.noteOff = i => this.setState(oldState => ({ noteStates: oldState.noteStates.filter(n => n !== i) }),synth.noteOff(i));

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
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
    }

    componentWillUnmount () {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }

    render () {
        const { noteStates } = this.state;

        return (
            <div className="App">
                <Keys noteStates={noteStates} noteOn={this.noteOn} noteOff={this.noteOff} />
            </div>
        );
    }
}

export default App;
