/**
 * @typedef MelodyNote
 * @prop {number} note
 * @prop {number} count
 */

const concertPitch = 440; // Note 69, A4, 440 Hz
const concertPitchNum = 68; // (0 index)
const sharps = [false, true, false, true, false, false, true, false, true, false, true, false];
const noteRatio = Math.exp(Math.LN2 / 12);

const noteMap = {};
const noteListeners = [];

const samples = [
    /* Piano       */ [ 0.000,0.307,0.573,0.747,0.800,0.787,0.760,0.680,0.640,0.613,0.587,0.587,0.587,0.600,0.600,0.587,0.587,0.587,0.587,0.573,0.573,0.507,0.013,-0.360,-0.387,-0.480,-0.533,-0.533,-0.533,-0.520,-0.507,-0.480,-0.467,-0.467,-0.520,-0.707,-0.760,-0.693,-0.627,-0.440,-0.267 ],
    /* Harpsichord */ [ 0.16230,0.67908,0.32111,-0.58877,-1.00000,-0.94199,-0.55850,0.03696,0.46314,0.63582,0.61690,0.60914,0.74573,0.63213,0.06539,-0.39930,-0.26242,0.30947,0.85215,0.88659,0.16143,-0.52125,-0.15764,0.47264,0.55006,0.49175,0.16026,-0.23360,0.09168,0.63892,0.47759,-0.21595,-0.52192,-0.24893,0.02639,0.21168,0.18956,-0.14688,0.01834,0.64756,0.62990,-0.06248,-0.50504,-0.45004,-0.45111,-0.48428,-0.30258,-0.06713,0.14193,0.21624,0.28706,0.43597,0.24622,-0.17142,-0.29375,-0.30724,-0.49496,-0.40658,0.05510,0.17006,-0.09740,-0.13659,0.11913,0.29938,0.12544,-0.17608,-0.27386,-0.25795,-0.22342,-0.26339,-0.55598,-0.84953,-0.73477,-0.39785,-0.04210 ],
    /* Choir       */ [ 0.03568,0.02005,-0.04636,-0.13303,-0.19238,-0.17523,-0.10645,-0.01343,0.08777,0.19952,0.32382,0.44373,0.51953,0.56516,0.58679,0.59622,0.54001,0.46130,0.37369,0.29959,0.22723,0.18719,0.18375,0.20483,0.22873,0.25006,0.26489,0.28363,0.27853,0.24176,0.18591,0.12637,0.07309,0.02161,-0.01730,-0.05246,-0.06781,-0.05392,-0.02225,0.00888,0.03189,0.05997,0.06226,0.03143,-0.03683,-0.09927,-0.16299,-0.20020,-0.20230,-0.15891,-0.10721,-0.06949,-0.06332,-0.05640,-0.06375,-0.10211,-0.19461,-0.29913,-0.39014,-0.45462,-0.51138,-0.53207,-0.49725,-0.41360,-0.28113,-0.14691,-0.05469,-0.00754,-0.01120,-0.05746,-0.13190,-0.25491,-0.38263,-0.46844,-0.49261,-0.44897,-0.36417,-0.25906,-0.15750,-0.03897,0.08710,0.18152,0.26965,0.31418,0.28485,0.15210,-0.03308,-0.21692,-0.33725,-0.38489,-0.33484,-0.21060,-0.05225,0.07715,0.17068,0.23944,0.27191,0.28870,0.26999,0.19482,0.06689,-0.06195,-0.14246,-0.17422,-0.15198,-0.13409,-0.14099,-0.13870,-0.10385,-0.05020,-0.01602,-0.01657,-0.04510,-0.07977,-0.10782,-0.13654,-0.16281,-0.18256,-0.19461,-0.20175,-0.19836,-0.17972,-0.14316,-0.10953,-0.08905,-0.06522,-0.05203,-0.04471,-0.04486,-0.03708,-0.02136,0.01926,0.10120,0.17377,0.22662,0.24957,0.25198,0.22046,0.16263,0.10007,0.06323,0.06302,0.08740,0.11923,0.10339,0.06708,0.05386,0.10577,0.16187,0.18079,0.14703,0.09964,0.04730,-0.01596,-0.11298,-0.18866,-0.23373,-0.26852,-0.36072,-0.44635,-0.46646,-0.38968,-0.29800,-0.24115,-0.23203,-0.24078,-0.22574,-0.21500,-0.25705,-0.37564,-0.49863,-0.57373,-0.58920,-0.57523,-0.52945,-0.43576,-0.28656,-0.11670,0.02737,0.12018,0.18036,0.20862,0.19977,0.14685,0.08829,0.05408,0.05127,0.04370,0.03342,0.02905,0.05557,0.12738,0.22372,0.31030,0.36032,0.37692,0.35880,0.30276,0.19424,0.08890,0.00940,-0.04535,-0.05026,-0.04056,-0.02106,0.00009,0.05942,0.12598,0.17804,0.17911,0.15875,0.09726,-0.00290,-0.11053,-0.15283,-0.11978,-0.05515,0.01569,0.09503,0.18185,0.28070,0.30701,0.26477,0.20035,0.12842,0.03314,-0.08508,-0.17297,-0.18018,-0.09598,0.02405,0.12778,0.19162,0.24774,0.32516,0.35016,0.29181,0.15335,-0.00958,-0.16873,-0.30692,-0.42426,-0.51123,-0.51953,-0.43292,-0.28186,-0.14215,-0.04092,0.02283,0.07251,0.05078,-0.05728,-0.23386,-0.36804,-0.44592,-0.47284,-0.50055,-0.45642,-0.36832,-0.24289,-0.08362,0.08002,0.19836,0.23654,0.24930,0.23026,0.19028,0.12350,0.09869,0.11490,0.15887,0.19580,0.24118,0.30377,0.38928,0.46307,0.50055,0.49506,0.48160,0.46381,0.47015,0.49634,0.48264,0.45135,0.42023,0.40991,0.40927,0.40570,0.38437,0.34326,0.31754,0.32352,0.35382,0.37054,0.35892,0.32074,0.27368,0.24677,0.24869,0.26953,0.28748,0.29596,0.28506,0.25104,0.22314,0.18619,0.13983,0.07718,0.03262,-0.00812,-0.05087,-0.10229,-0.14175,-0.17236,-0.20193,-0.20016,-0.18283,-0.17642,-0.22397,-0.26501,-0.29770,-0.32184,-0.38168,-0.44507,-0.50339,-0.52859,-0.55429,-0.54095,-0.49783,-0.45435,-0.39893,-0.31290,-0.18768,-0.05920,0.03058 ],
];

/** @type {AudioContext} */
let audioCtx;

function getNoteFreq (num) {
    return concertPitch * Math.pow(noteRatio, num - concertPitchNum);
}

function notifyListeners () {
  for (const fn of noteListeners) {
    if (fn instanceof Function) {
      fn();
    }
  }
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

    /**
   * @param {number} program
   * @param {number} num
   * @param {number | undefined} [when]
   * @param {number} [gain]
   */
    noteOn (program, num, when, gain=1) {

        if (!audioCtx) {
            this.initCtx();
        }

        if (num === synth.REST) {
          return;
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

            notifyListeners();
        }
    },

    /**
     * @param {number} num
     * @param {number | undefined} [when]
     */
    noteOff (num, when) {
        if (noteMap[num]) {
            noteMap[num].stop(when);
            delete noteMap[num];

            notifyListeners();
        }
    },

    /**
     * @param {number} value
     * @param {number} when
     */
    setVolume (value, when) {
        if (this.destination) {
            if (typeof when === "undefined") {
                when = audioCtx.currentTime;
            }
            this.destination.gain.linearRampToValueAtTime(value, when);
        }
    },

    addAnalyser (fn) {
        if (!audioCtx) {
            this.initCtx();
        }

        const analyser = audioCtx.createAnalyser();

        this.destination.connect(analyser);
        analyser.connect(this.nextDestination);

        fn(analyser);
    },

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
            noteOn: this.noteOn.bind(this),
            noteOff: this.noteOff.bind(this),
            setVolume: this.setVolume.bind(this),
            addAnalyser: this.addAnalyser.bind(this),
        };
    },

    /**
     * @static
     * @param {number} num
     */
    getNoteName (num) {
        const mod = num % 12;
        const alpha = 'CCDDEFFGGAAB'[mod];
        const sharp = sharps[mod] ? '♯' : '';
        const octave = Math.floor((num-21)/12) + ((alpha === "A" || alpha === "B") ? 0 : 1);
        return alpha + sharp + octave;
    },

    /**
     * @static
     * @param {number} num
     */
    isSharp (num) {
        return sharps[num % 12];
    },

    addListener (fn) {
      noteListeners.push(fn);
    },

    removeListener (fn) {
      const index = noteListeners.indexOf(fn);
      noteListeners.splice(index, 1);
    },

    /**
     * @param {MelodyNote[]} notes
     */
    playTune (notes, tempo = 120) {
      if (!audioCtx) {
        this.initCtx();
      }

      let now = audioCtx.currentTime;

      for (const note of notes) {
        this.noteOn(203, note.note, now);
        now += note.count * 60 / tempo;
        this.noteOff(note.note, now);
      }
    },

    getInstrumentList () {
      const instrumentsCount = Object.keys(instruments).length - 1;
      const sampleCount = samples.length;
      const totalCount = instrumentsCount + sampleCount;
      const list = [...Array(totalCount)].map((_,i) => i);

      return [
        ...list.map(i => i + 100),
        ...list.map(i => i + 200),
        ...list.map(i => i + 300),
      ];
    }
};

Object.defineProperty(synth, "currentTime", { get: () => audioCtx.currentTime });

Object.defineProperty(synth, "noteStates", { get: () => Object.keys(noteMap).map(k => +k) });

Object.defineProperty(synth, "REST", { get: () => -1 });

export default synth;

const instruments = {
  sine (freq) {
      const source = audioCtx.createOscillator();
      source.frequency.setValueAtTime(freq, 0);
      source.type = "sine";

      // drawWave(fourier([0,1]));

      return source;
  },
  square (freq) {
      const source = audioCtx.createOscillator();
      source.frequency.setValueAtTime(freq, 0);
      source.type = "square";

      // const canvas = document.getElementById('wave-canvas');
      // const ctx = canvas.getContext('2d');
      // ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ctx.beginPath();
      // ctx.moveTo(0, 0);
      // ctx.lineTo(canvas.width / 2, 0);
      // ctx.lineTo(canvas.width / 2, canvas.height);
      // ctx.lineTo(canvas.width, canvas.height);
      // ctx.stroke();

      return source;
  },
  sawtooth (freq) {
      const source = audioCtx.createOscillator();
      source.frequency.setValueAtTime(freq, 0);
      source.type = "sawtooth";

      // const canvas = document.getElementById('wave-canvas');
      // const ctx = canvas.getContext('2d');
      // ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ctx.beginPath();
      // ctx.moveTo(0, canvas.height);
      // ctx.lineTo(canvas.width, 0);
      // ctx.stroke();

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
      // drawWave(fFn);

      const wave = audioCtx.createPeriodicWave(real, imag);

      source.setPeriodicWave(wave);

      return source;
  },
  piano (freq) {
      var waveFn = fourier([0, 1, 0, 0.5]);
      // drawWave(waveFn);

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
      // drawWave(waveFn);

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

    // const canvas = document.getElementById('wave-canvas');
    // const ctx = canvas.getContext('2d');
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ctx.beginPath();
    // ctx.moveTo(0, (1-values[0]) * canvas.height / 2);

    // for(var i = 1; i < values.length; i++) {
    //     ctx.lineTo(i / (values.length - 1) * canvas.width, (1-values[i]) * canvas.height / 2);
    // }
    // ctx.stroke();

    // Get an AudioBufferSourceNode.
    // This is the AudioNode to use when we want to play an AudioBuffer
    const source = audioCtx.createBufferSource();

    // set the buffer in the AudioBufferSourceNode
    source.buffer = myArrayBuffer;

    source.loop = true;

    return source;
  },
  fourierIn (freq) {
    // const values = fourierValues.value.split(" ").map(x => parseFloat(x, 10)).filter(x => isFinite(x));

    // return this.sampler(values, freq);
      const source = audioCtx.createOscillator();
      source.frequency.setValueAtTime(freq, 0);
      return source;
  },
  fourierOut (freq) {
      const source = audioCtx.createOscillator();
      source.frequency.setValueAtTime(freq, 0);

      // const wave = audioCtx.createPeriodicWave(Xk_re, Xk_im);

      // drawWave(fourier(Xk_im));

      // source.setPeriodicWave(wave);

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

    // const canvas = document.getElementById('wave-canvas');
    // const ctx = canvas.getContext('2d');
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ctx.beginPath();
    // ctx.moveTo(0, (1-nowBuffering[0]) * canvas.height / 2);

    // for(var i = 1; i < nowBuffering.length; i++) {
    //     ctx.lineTo(i / (nowBuffering.length - 1) * canvas.width, (1-nowBuffering[i]) * canvas.height / 2);
    // }
    // ctx.stroke();

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
* @return
*/
function rampOnOff (audioCtx, source, gain) {
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0;

  source.connect(gainNode);
  return {
    connect: gainNode.connect.bind(gainNode),
    start: (when = audioCtx.currentTime) => {
        source.start(when);
        gainNode.gain.linearRampToValueAtTime(gain, when + 0.01);
    },
    stop: (when = audioCtx.currentTime) => {
      gainNode.gain.linearRampToValueAtTime(0.1, when + 0.15);
      source.stop(when + 0.2);
    },
  };
}

/**
* @param {AudioContext} audioCtx
* @param {AudioScheduledSourceNode} source
* @param {number} gain
* @param {number} duration
* @return
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
* @param {AudioContext} audioCtx
* @param {AudioScheduledSourceNode} source
* @param {number} gain
* @param {number} duration
* @return
*/
function adsrNote (audioCtx, source, gain, duration = 2) {

  // Attack:  0.1s
  // Decay:   0.1s
  // Sustain: 2s

  const gainNode = audioCtx.createGain();

  source.connect(gainNode);

  let end;

  return {
      connect: gainNode.connect.bind(gainNode),
      start: (when = audioCtx.currentTime) => {
        // gainNode.gain.setValueAtTime(0, when);
        // gainNode.gain.linearRampToValueAtTime(gain, when + 0.001);
        // gainNode.gain.linearRampToValueAtTime(gain * 0.2, when + 0.2);

        gainNode.gain.setValueAtTime(gain, when);
        // gainNode.gain.exponentialRampToValueAtTime(gain, when + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(gain * 0.2, when + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, when + duration);
        source.start(when);
        source.stop(when + duration);
        end = when + duration;
      },
      stop: (when = audioCtx.currentTime) => {
        // source.stop(when + 0.5);
        // gainNode.gain.linearRampToValueAtTime(0, when + 0.5);
        if (when + 0.2 < end) {
          source.stop(when + 0.2);
          gainNode.gain.linearRampToValueAtTime(0, when + 0.2);
        }
    },
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
  const instrumentFamily = (program / 100)|0;
  const instrumentType = program % 100;

  /** @type {AudioScheduledSourceNode} */
  let source;
  switch (instrumentType) {
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
        const sampleNo = instrumentType - 9;

        if (sampleNo < samples.length) {
            source = instruments.sampler(samples[sampleNo], freq);
        } else {
            throw Error("No program (instrument) selected");
        }
  }

  return instrumentFamily === 3 ?
    adsrNote(audioCtx, source, gain) :
    instrumentFamily === 2 ?
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
