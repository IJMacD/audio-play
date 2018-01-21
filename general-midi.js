const GM_PROGRAMS = ["Acoustic Grand Piano","Bright Acoustic Piano","Electric Grand Piano","Honky-tonk Piano","Electric Piano 1","Electric Piano 2","Harpsichord","Clavi","Celesta","Glockenspiel","Music Box","Vibraphone","Marimba","Xylophone","Tubular Bells","Dulcimer","Drawbar Organ","Percussive Organ","Rock Organ","Church Organ","Reed Organ","Accordion","Harmonica","Tango Accordion","Acoustic Guitar (nylon)","Acoustic Guitar (steel)","Electric Guitar (jazz)","Electric Guitar (clean)","Electric Guitar (muted)","Overdriven Guitar","Distortion Guitar","Guitar harmonics","Acoustic Bass","Electric Bass (finger)","Electric Bass (pick)","Fretless Bass","Slap Bass 1","Slap Bass 2","Synth Bass 1","Synth Bass 2","Violin","Viola","Cello","Contrabass","Tremolo Strings","Pizzicato Strings","Orchestral Harp","Timpani","String Ensemble 1","String Ensemble 2","SynthStrings 1","SynthStrings 2","Choir Aahs","Voice Oohs","Synth Voice","Orchestra Hit","Trumpet","Trombone","Tuba","Muted Trumpet","French Horn","Brass Section","SynthBrass 1","SynthBrass 2","Soprano Sax","Alto Sax","Tenor Sax","Baritone Sax","Oboe","English Horn","Bassoon","Clarinet","Piccolo","Flute","Recorder","Pan Flute","Blown Bottle","Shakuhachi","Whistle","Ocarina","Synth Lead 1 (square)","Synth Lead 2 (sawtooth)","Synth Lead 3 (calliope)","Synth Lead 4 (chiff)","Synth Lead 5 (charang)","Synth Lead 6 (voice)","Synth Lead 7 (fifths)","Synth Lead 8 (bass + lead)","Synth Pad 1 (new age)","Synth Pad 2 (warm)","Synth Pad 3 (polysynth)","Synth Pad 4 (choir)","Synth Pad 5 (bowed)","Synth Pad 6 (metallic)","Synth Pad 7 (halo)","Synth Pad 8 (sweep)","Synth FX 1 (rain)","Synth FX 2 (soundtrack)","Synth FX 3 (crystal)","Synth FX 4 (atmosphere)","Synth FX 5 (brightness)","Synth FX 6 (goblins)","Synth FX 7 (echoes)","Synth FX 8 (sci-fi)","Sitar","Banjo","Shamisen","Koto","Kalimba","Bag pipe","Fiddle","Shanai","Tinkle Bell","Agogo","Steel Drums","Woodblock","Taiko Drum","Melodic Tom","Synth Drum","Reverse Cymbal","Guitar Fret Noise","Breath Noise","Seashore","Bird Tweet","Telephone Ring","Helicopter","Applause","Gunshot"];

const GM_CONTROLLERS = ["Bank Select","Modulation Wheel","Breath Contoller","<undefined>","Foot Controller","Portamento Time","Data Entry MSB","Main Volume","Balance","<undefined>","Pan","0Ch","Effect Control 1","Effect Control 2","<undefined>","<undefined>","General Purpose Controllers (No. 1)","General Purpose Controllers (No. 2)","General Purpose Controllers (No. 3)","General Purpose Controllers (No. 4)","<undefined>","<undefined>","<undefined>","<undefined>","<undefined>","<undefined>","<undefined>","<undefined>","<undefined>","<undefined>","<undefined>","<undefined>","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","LSB for Controllers 0-31","Damper Pedal (Sustain) [Data Byte of 0-63=0ff, 64-127=On]","Portamento","Sostenuto","Soft Pedal","Legato Footswitch","Hold 2","Sound Controller 1 (default: Sound Variation)","Sound Controller 2 (default: Timbre/Harmonic Content)","Sound Controller 3 (default: Release Time)","Sound Controller 4 (default: Attack Time)","Sound Controller 5 (default: Brightness)","Sound Controller 6 (no default)","Sound Controller 7 (no default)","Sound Controller 8 (no default)","Sound Controller 9 (no default)","Sound Controller 10 (no default)","General Purpose Controllers (No. 5)","General Purpose Controllers (No. 6)","General Purpose Controllers (No. 7)","General Purpose Controllers (No. 8)","Portamento Control","<undefined>","<undefined>","<undefined>","<undefined>","<undefined>","<undefined>","Effects 1 Depth (previously External Effects Depth)","Effects 2 Depth (previously Tremolo Depth)","Effects 3 Depth (previously Chorus Depth)","Effects 4 Depth (previously Detune Depth)","Effects 5 Depth (previously Phaser Depth)","Data Increment","Data Decrement","Non-Registered Parameter Number LSB","Non-Registered Parameter Number LSB","Registered Parameter Number LSB","Registered Parameter Number MSB"];

// First Index is 34
const GM_PERCUSSION = ["Acoustic Bass Drum","Bass Drum 1","Side Stick","Acoustic Snare","Hand Clap","Electric Snare","Low Floor Tom","Closed Hi Hat","High Floor Tom","Pedal Hi-Hat","Low Tom","Open Hi-Hat","Low-Mid Tom","Hi-Mid Tom","Crash Cymbal 1","High Tom","Ride Cymbal 1","Chinese Cymbal","Ride Bell","Tambourine","Splash Cymbal","Cowbell","Crash Cymbal 2","Vibraslap","Ride Cymbal 2","Hi Bongo","Low Bongo","Mute Hi Conga","Open Hi Conga","Low Conga","High Timbale","Low Timbale","High Agogo","Low Agogo","Cabasa","Maracas","Short Whistle","Long Whistle","Short Guiro","Long Guiro","Claves","Hi Wood Block","Low Wood Block","Mute Cuica","Open Cuica","Mute Triangle","Open Triangle"];
