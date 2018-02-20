"use strict";

const concertPitch = 440; // Note 49, A4, 440 Hz
const concertPitchNum = 48; // (0 index)
const sharps = [false, true, false, false, true, false, true, false, false, true, false, true];
const noteRatio = Math.exp(Math.LN2 / 12);

const noteMap = {};

const samples = [
    /* Piano       */ [ 0.000,0.307,0.573,0.747,0.800,0.787,0.760,0.680,0.640,0.613,0.587,0.587,0.587,0.600,0.600,0.587,0.587,0.587,0.587,0.573,0.573,0.507,0.013,-0.360,-0.387,-0.480,-0.533,-0.533,-0.533,-0.520,-0.507,-0.480,-0.467,-0.467,-0.520,-0.707,-0.760,-0.693,-0.627,-0.440,-0.267 ],
    /* Harpsichord */ [ 0.16230,0.67908,0.32111,-0.58877,-1.00000,-0.94199,-0.55850,0.03696,0.46314,0.63582,0.61690,0.60914,0.74573,0.63213,0.06539,-0.39930,-0.26242,0.30947,0.85215,0.88659,0.16143,-0.52125,-0.15764,0.47264,0.55006,0.49175,0.16026,-0.23360,0.09168,0.63892,0.47759,-0.21595,-0.52192,-0.24893,0.02639,0.21168,0.18956,-0.14688,0.01834,0.64756,0.62990,-0.06248,-0.50504,-0.45004,-0.45111,-0.48428,-0.30258,-0.06713,0.14193,0.21624,0.28706,0.43597,0.24622,-0.17142,-0.29375,-0.30724,-0.49496,-0.40658,0.05510,0.17006,-0.09740,-0.13659,0.11913,0.29938,0.12544,-0.17608,-0.27386,-0.25795,-0.22342,-0.26339,-0.55598,-0.84953,-0.73477,-0.39785,-0.04210 ],
];

/** @type {AudioContext} */
let audioCtx;

function getNoteFreq (num) {
    return concertPitch * Math.pow(noteRatio, num - concertPitchNum);
}

function noteOn (program, num, when, gain=1) {

    if (!audioCtx) {
        this.initCtx();
    }

    if (!noteMap[num]) {

        const freq = getNoteFreq(num);
        const source = createNote(audioCtx, freq, gain, program);

        // connect the AudioBufferSourceNode to the
        // destination so we can hear the sound
        source.connect(this.destination);

        // start the source playing
        source.start(when);

        noteMap[num] = source;
    }
}

function noteOff (num, when) {

    if (noteMap[num]) {
        noteMap[num].stop(when);
        noteMap[num] = null;
    }
}

function setVolume (value, when) {
    if (this.destination) {
        if (typeof when === "undefined") {
            when = audioCtx.currentTime;
        }
        this.destination.gain.linearRampToValueAtTime(value, when);
    }
}

function addAnalyser (fn) {

    if (!audioCtx) {
        this.initCtx();
    }

    const analyser = audioCtx.createAnalyser();

    this.destination.connect(analyser);
    analyser.connect(this.nextDestination);

    fn(analyser);
}

const synth = {
    initCtx () {
        // @ts-ignore
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.destination = audioCtx.createGain();

        this.destination.gain.setValueAtTime(0.25, 0);

        // Save next destination so an analyser node can insert itself
        this.nextDestination = audioCtx.destination;
        this.destination.connect(this.nextDestination);
    },

    noteOn,

    noteOff,

    setVolume,

    addAnalyser,

    /** @static */
    createTrack(id) {

        if (!audioCtx) {
            this.initCtx();
        }

        const trackGain = audioCtx.createGain();

        trackGain.connect(this.destination);

        return {
            destination: trackGain,
            nextDestination: this.destination,
            noteOn,
            noteOff,
            setVolume,
            addAnalyser,
        };
    },

    /** @static */
    getNoteName (num) {
        const mod = num % 12;
        const alpha = 'AABCCDDEFFGG'[mod];
        const sharp = sharps[mod] ? '♯' : '';
        const octave = Math.floor(num/12) + ((alpha === "A" || alpha === "B") ? 0 : 1);
        return alpha + sharp + octave;
    },

    /** @static */
    isSharp (num) {
        return sharps[num % 12];
    },
};

Object.defineProperty(synth, "currentTime", { get: () => audioCtx.currentTime });


const instruments = {
  sine (freq) {
      const source = audioCtx.createOscillator();
      source.frequency.setValueAtTime(freq, 0);
      source.type = "sine";

      drawWave(fourier([0,1]));

      return source;
  },
  square (freq) {
      const source = audioCtx.createOscillator();
      source.frequency.setValueAtTime(freq, 0);
      source.type = "square";

      const canvas = document.getElementById('wave-canvas');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.stroke();

      return source;
  },
  sawtooth (freq) {
      const source = audioCtx.createOscillator();
      source.frequency.setValueAtTime(freq, 0);
      source.type = "sawtooth";

      const canvas = document.getElementById('wave-canvas');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      ctx.lineTo(canvas.width, 0);
      ctx.stroke();

      return source;
  },
  periodic (freq) {
      const source = audioCtx.createOscillator();
      source.frequency.setValueAtTime(freq, 0);
      const real = new Float32Array(6);
      const imag = new Float32Array(6);

      real[0] = 0;
      imag[0] = 0;
      real[1] = 0;
      imag[1] = 131;
      real[2] = 0;
      imag[2] = 27;
      real[3] = 0;
      imag[3] = 37;
      real[4] = 0;
      imag[4] = 14;
      real[5] = 0;
      imag[5] = 10;

      const fFn = fourier(imag.map(x=> x/131));
      drawWave(fFn);

      const wave = audioCtx.createPeriodicWave(real, imag);

      source.setPeriodicWave(wave);

      return source;
  },
  piano (freq) {
      var waveFn = fourier([0, 1, 0, 0.5]);
      drawWave(waveFn);

      const sampleCount = audioCtx.sampleRate / freq;
      const wave = waveFn(sampleCount);

      const myArrayBuffer = generateArrayBuffer(audioCtx, wave, sampleCount);

      // Get an AudioBufferSourceNode.
      // This is the AudioNode to use when we want to play an AudioBuffer
      const source = audioCtx.createBufferSource();

      // set the buffer in the AudioBufferSourceNode
      source.buffer = myArrayBuffer;

      source.loop = true;

      return source;
  },
  organ (freq) {
      var waveFn = fourier([0, 1, 0, 0.2, 0, 0.04, 0, 0.08]);
      drawWave(waveFn);

      const sampleCount = audioCtx.sampleRate / freq;
      const wave = waveFn(sampleCount);

      const myArrayBuffer = generateArrayBuffer(audioCtx, wave, sampleCount);

      // Get an AudioBufferSourceNode.
      // This is the AudioNode to use when we want to play an AudioBuffer
      const source = audioCtx.createBufferSource();

      // set the buffer in the AudioBufferSourceNode
      source.buffer = myArrayBuffer;

      source.loop = true;

      return source;
  },
  sampler (values, freq) {

    var myArrayBuffer = audioCtx.createBuffer(2, values.length, values.length * freq);

    for (var channel = 0; channel < myArrayBuffer.numberOfChannels; channel++) {
    // This gives us the actual array that contains the data
        var nowBuffering = myArrayBuffer.getChannelData(channel);
        for (var i = 0; i < myArrayBuffer.length; i++) {
            nowBuffering[i] = values[i];
        }
    }

    const canvas = document.getElementById('wave-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(0, (1-values[0]) * canvas.height / 2);

    for(var i = 1; i < values.length; i++) {
        ctx.lineTo(i / (values.length - 1) * canvas.width, (1-values[i]) * canvas.height / 2);
    }
    ctx.stroke();

    // Get an AudioBufferSourceNode.
    // This is the AudioNode to use when we want to play an AudioBuffer
    const source = audioCtx.createBufferSource();

    // set the buffer in the AudioBufferSourceNode
    source.buffer = myArrayBuffer;

    source.loop = true;

    return source;
  },
  fourierIn (freq) {
    const values = fourierValues.value.split(" ").map(x => parseFloat(x, 10)).filter(x => isFinite(x));

    return this.sampler(values, freq);
  },
  fourierOut (freq) {
      const source = audioCtx.createOscillator();
      source.frequency.setValueAtTime(freq, 0);

      const wave = audioCtx.createPeriodicWave(Xk_re, Xk_im);

      drawWave(fourier(Xk_im));

      source.setPeriodicWave(wave);

      return source;
  },
  harpsichord (freq) {
    const sampleCount = audioCtx.sampleRate / freq;

    var myArrayBuffer = audioCtx.createBuffer(2, sampleCount, audioCtx.sampleRate);

    const x0 = 0;
    const x1 = 0.05;
    const x2 = 0.5;
    const x3 = 0.95;
    const x4 = 1;

    const yMax0 = 0.9;
    const yMax1 = 0.4;
    const yMid = 0;

    for (var channel = 0; channel < myArrayBuffer.numberOfChannels; channel++) {
    // This gives us the actual array that contains the data
      var nowBuffering = myArrayBuffer.getChannelData(channel);
      for (var i = 0; i < myArrayBuffer.length; i++) {
        const x = i / sampleCount;

        if (x < x1) {
          nowBuffering[i] = yMax0 * (x / x1);
        } else if (x < x2) {
          nowBuffering[i] = (yMax1 - yMax0) * ((x - x1) / (x2 - x1)) + yMax0;
        } else if (x < x3) {
          nowBuffering[i] = (-yMax1 + yMax0) * ((x - x2) / (x3 - x2)) + -yMax0;
        } else {
          nowBuffering[i] = (yMid - -yMax1) * ((x - x3) / (x4 - x3)) + -yMax1;
        }
      }
    }

    const canvas = document.getElementById('wave-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(0, (1-nowBuffering[0]) * canvas.height / 2);

    for(var i = 1; i < nowBuffering.length; i++) {
        ctx.lineTo(i / (nowBuffering.length - 1) * canvas.width, (1-nowBuffering[i]) * canvas.height / 2);
    }
    ctx.stroke();

    // Get an AudioBufferSourceNode.
    // This is the AudioNode to use when we want to play an AudioBuffer
    const source = audioCtx.createBufferSource();

    // set the buffer in the AudioBufferSourceNode
    source.buffer = myArrayBuffer;

    source.loop = true;

    return source;

  },
}

/**
* @param {AudioContext} audioCtx
* @param {AudioScheduledSourceNode} source
* @param {number} gain
* @return {AudioScheduledSourceNode}
*/
function rampOnOff (audioCtx, source, gain) {
  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, 0);

  source.connect(gainNode);
  return {
      connect: gainNode.connect.bind(gainNode),
      start: (when = audioCtx.currentTime) => {
          source.start(when);
          gainNode.gain.linearRampToValueAtTime(gain, when + 0.1);
      },
      stop: (when = audioCtx.currentTime) => {
          source.stop(when + 0.1);
          gainNode.gain.linearRampToValueAtTime(0, when + 0.1);
      },
  };
}

/**
* @param {AudioContext} audioCtx
* @param {AudioScheduledSourceNode} source
* @param {number} gain
* @param {number} duration
* @return {AudioScheduledSourceNode}
*/
function impactNote (audioCtx, source, gain, duration = 1) {

  const fadeNode = audioCtx.createGain();

  source.connect(fadeNode);

  return {
      connect: fadeNode.connect.bind(fadeNode),
      start: (when = audioCtx.currentTime) => {
        fadeNode.gain.setValueAtTime(gain, when);
        source.start(when);
        fadeNode.gain.exponentialRampToValueAtTime(0.01, when + duration);
        source.stop(when + duration);
      },
      stop: () => { },
  };
}

/**
 *
 * @param {AudioContext} audioCtx
 * @param {number} freq
 * @param {number} gain
 * @param {number} program
 */
function createNote (audioCtx, freq, gain, program) {
  /** @type {AudioNode} */
  let source;
  switch ((program/2)|0) {
    case 0: // Sine
      source = instruments.sine(freq);
      break;
    case 1: // Square
      source = instruments.square(freq);
      break;
    case 2: // Sawtooth
      source = instruments.sawtooth(freq);
      break;
    case 3: // Periodic
      source = instruments.periodic(freq);
      break;
    case 4: // Organ
      source = instruments.organ(freq);
      break;
    case 5: // Piano
      source = instruments.piano(freq);
      break;
    case 6: // Fourier In
      source = instruments.fourierIn(freq);
      break;
    case 7: // Fourier Out
      source = instruments.fourierOut(freq);
      break;
    case 8: // Harpsichord
      source = instruments.harpsichord(freq);
      break;
    default:
        const sampleNo = ((program/2)|0) - 9;
        if (sampleNo < samples.length) {
            source = instruments.sampler(samples[sampleNo], freq);
        } else {
            throw Error("No program (instrument) selected");
        }
  }

  return program % 2 ?
    impactNote(audioCtx, source, gain) :
    rampOnOff(audioCtx, source, gain);
}

function fourier (coef) {
const coefSum = coef.reduce((a,b) => a+b, 0);
if (coefSum === 0) {
  throw Error("You must supply some coefficients");
}
return function (sampleCount) {
  return function (i) {
    return coef.map((c,n) => (c / coefSum) * Math.sin(i * n / sampleCount * Math.PI * 2)).reduce((a,b) => a+b, 0);
  }
}
}

function generateArrayBuffer(audioCtx, wave, sampleCount) {

  // Create an empty stereo buffer at the sample rate of the AudioContext
  var myArrayBuffer = audioCtx.createBuffer(2, sampleCount, audioCtx.sampleRate);

  for (var channel = 0; channel < myArrayBuffer.numberOfChannels; channel++) {
    // This gives us the actual array that contains the data
    var nowBuffering = myArrayBuffer.getChannelData(channel);
    for (var i = 0; i < myArrayBuffer.length; i++) {
      nowBuffering[i] = wave(i);
    }
  }

  return myArrayBuffer;
}
