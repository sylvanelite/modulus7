
/** 
 * LittleJS Audio System
 * - <a href=https://killedbyapixel.github.io/ZzFX/>ZzFX Sound Effects</a> - ZzFX Sound Effect Generator
 * - <a href=https://keithclark.github.io/ZzFXM/>ZzFXM Music</a> - ZzFXM Music System
 * - Caches sounds and music for fast playback
 * - Can attenuate and apply stereo panning to sounds
 * - Ability to play mp3, ogg, and wave files
 * - Speech synthesis functions
 * @namespace Audio
 */

import { ISound, type EngineInstance, type IVector2 } from "./definitions.mjs";
import { EngineMath } from "./engineMath.mjs";



///////////////////////////////////////////////////////////////////////////////

class EngineSound{
    static audioInit(instance:EngineInstance){
        if (!instance.soundEnable) return;
        // (createGain is more widely supported then GainNode constructor)
        instance.audioGainNode = instance.audioContext.createGain();
        instance.audioGainNode.connect(instance.audioContext.destination);
        instance.audioGainNode.gain.value = instance.soundVolume; // set starting value
    }


    
    /** Set volume scale to apply to all sound, music and speech *  @param {Number} volume
     *  @memberof Settings */
    static setSoundVolume(instance:EngineInstance,volume:number) {
        instance.soundVolume = volume;
        if (instance.soundEnable && !instance.headlessMode && instance.audioGainNode){
            instance.audioGainNode.gain.value = volume; // update gain immediately
        }
    }
    /** Speak text with passed in settings *  @param {String} text - The text to speak *  @param {String} [language] - The language/accent to use (examples: en, it, ru, ja, zh) *  @param {Number} [volume] - How much to scale volume by *  @param {Number} [rate] - How quickly to speak *  @param {Number} [pitch] - How much to change the pitch by
     *  @return {SpeechSynthesisUtterance} - The utterance that was spoken
     *  @memberof Audio */
    static speak(instance:EngineInstance,text:string, language='', volume=1, rate=1, pitch=1) {
        if (!instance.soundEnable || instance.headlessMode) return;
        if (!speechSynthesis) return;

        // common languages (not supported by all browsers)
        // en - english,  it - italian, fr - french,  de - german, es - spanish
        // ja - japanese, ru - russian, zh - chinese, hi - hindi,  ko - korean

        // build utterance and speak
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.volume = 2*volume*instance.soundVolume;
        utterance.rate = rate;
        utterance.pitch = pitch;
        speechSynthesis.speak(utterance);
        return utterance;
    }

    /** Stop all queued speech
     *  @memberof Audio */
    static speakStop() {speechSynthesis && speechSynthesis.cancel();}

    /** Get frequency of a note on a musical scale *  @param {Number} semitoneOffset - How many semitones away from the root note *  @param {Number} [rootFrequency=220] - Frequency at semitone offset 0
     *  @return {Number} - The frequency of the note
     *  @memberof Audio */
    static getNoteFrequency(semitoneOffset:number, rootFrequency=220) { return rootFrequency * 2**(semitoneOffset/12); }

    ///////////////////////////////////////////////////////////////////////////////

    /** Play cached audio samples with given settings *  @param {Array}    sampleChannels - Array of arrays of samples to play (for stereo playback) *  @param {Number}   [volume] - How much to scale volume by *  @param {Number}   [rate] - The playback rate to use *  @param {Number}   [pan] - How much to apply stereo panning *  @param {Boolean}  [loop] - True if the sound should loop when it reaches the end *  @param {Number}   [sampleRate=44100] - Sample rate for the sound *  @param {GainNode} [gainNode] - Optional gain node for volume control while playing
     *  @return {AudioBufferSourceNode} - The audio node of the sound played
     *  @memberof Audio */
    static playSamples(instance:EngineInstance,sampleChannels:Array<Array<number>>, volume=1, rate=1, pan=0, loop=false, sampleRate=EngineSound.zzfxR, gainNode:GainNode=null) 
    {
        if (!instance.soundEnable || instance.headlessMode) return;

        // create buffer and source
        const channelCount = sampleChannels.length;
        const sampleLength = sampleChannels[0].length;
        const buffer = instance.audioContext.createBuffer(channelCount, sampleLength, sampleRate);
        const source = instance.audioContext.createBufferSource();

        // copy samples to buffer and setup source
        sampleChannels.forEach((c,i)=> buffer.getChannelData(i).set(c));
        source.buffer = buffer;
        source.playbackRate.value = rate;
        source.loop = loop;

        // create and connect gain node
        gainNode = gainNode || instance.audioContext.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(instance.audioGainNode);

        // connect source to stereo panner and gain
        const pannerNode = new StereoPannerNode(instance.audioContext, {'pan':EngineMath.clamp(pan, -1, 1)});
        source.connect(pannerNode).connect(gainNode);

        // play the sound
        if (instance.audioContext.state != 'running') {
            // fix stalled audio and play
            instance.audioContext.resume().then(()=>source.start());
        } else{
            source.start();
        }
        // return sound
        return source;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // ZzFXMicro - Zuper Zmall Zound Zynth - v1.3.1 by Frank Force

    /** Generate and play a ZzFX sound
     *  
     *  <a href=https://killedbyapixel.github.io/ZzFX/>Create sounds using the ZzFX Sound Designer.</a> *  @param {Array} zzfxSound - Array of ZzFX parameters, ex. [.5,.5]
     *  @return {AudioBufferSourceNode} - The audio node of the sound played
     *  @memberof Audio */
    static zzfx(instance:EngineInstance,...zzfxSound:Array<number>) { return EngineSound.playSamples(instance,[EngineSound.zzfxG(...zzfxSound)]); }

    /** Sample rate used for all ZzFX sounds
     *  @default 44100
     *  @memberof Audio */
    static readonly zzfxR = 44100; 

    /** Generate samples for a ZzFX sound *  @param {Number}  [volume] - Volume scale (percent) *  @param {Number}  [randomness] - How much to randomize frequency (percent Hz) *  @param {Number}  [frequency] - Frequency of sound (Hz) *  @param {Number}  [attack] - Attack time, how fast sound starts (seconds) *  @param {Number}  [sustain] - Sustain time, how long sound holds (seconds) *  @param {Number}  [release] - Release time, how fast sound fades out (seconds) *  @param {Number}  [shape] - Shape of the sound wave *  @param {Number}  [shapeCurve] - Squareness of wave (0=square, 1=normal, 2=pointy) *  @param {Number}  [slide] - How much to slide frequency (kHz/s) *  @param {Number}  [deltaSlide] - How much to change slide (kHz/s/s) *  @param {Number}  [pitchJump] - Frequency of pitch jump (Hz) *  @param {Number}  [pitchJumpTime] - Time of pitch jump (seconds) *  @param {Number}  [repeatTime] - Resets some parameters periodically (seconds) *  @param {Number}  [noise] - How much random noise to add (percent) *  @param {Number}  [modulation] - Frequency of modulation wave, negative flips phase (Hz) *  @param {Number}  [bitCrush] - Resamples at a lower frequency in (samples*100) *  @param {Number}  [delay] - Overlap sound with itself for reverb and flanger effects (seconds) *  @param {Number}  [sustainVolume] - Volume level for sustain (percent) *  @param {Number}  [decay] - Decay time, how long to reach sustain after attack (seconds) *  @param {Number}  [tremolo] - Trembling effect, rate controlled by repeat time (percent) *  @param {Number}  [filter] - Filter cutoff frequency, positive for HPF, negative for LPF (Hz)
     *  @return {Array} - Array of audio samples
     *  @memberof Audio
     */
    static zzfxG
    (
        // parameters
        volume = 1, randomness = .05, frequency = 220, attack = 0, sustain = 0,
        release = .1, shape = 0, shapeCurve = 1, slide = 0, deltaSlide = 0,
        pitchJump = 0, pitchJumpTime = 0, repeatTime = 0, noise = 0, modulation = 0,
        bitCrush = 0, delay = 0, sustainVolume = 1, decay = 0, tremolo = 0, filter = 0
    ) {
        // LJS Note: ZZFX modded so randomness is handled by Sound class

        // init parameters
        let PI2 = Math.PI*2, sampleRate = EngineSound.zzfxR,
            startSlide = slide *= 500 * PI2 / sampleRate / sampleRate,
            startFrequency = frequency *= 
                EngineMath.rand(1 + randomness, 1-randomness) * PI2 / sampleRate,
            b = [], t = 0, tm = 0, i = 0, j = 1, r = 0, c = 0, s = 0, f, length,

            // biquad LP/HP filter
            quality = 2, w = PI2 * Math.abs(filter) * 2 / sampleRate,
            cos = Math.cos(w), alpha = Math.sin(w) / 2 / quality,
            a0 = 1 + alpha, a1 = -2*cos / a0, a2 = (1 - alpha) / a0,
            b0 = (1 + Math.sign(filter) * cos) / 2 / a0, 
            b1 = -(Math.sign(filter) + cos) / a0, b2 = b0,
            x2 = 0, x1 = 0, y2 = 0, y1 = 0;

        // scale by sample rate
        attack = attack * sampleRate + 9; // minimum attack to prevent pop
        decay *= sampleRate;
        sustain *= sampleRate;
        release *= sampleRate;
        delay *= sampleRate;
        deltaSlide *= 500 * PI2 / sampleRate**3;
        modulation *= PI2 / sampleRate;
        pitchJump *= PI2 / sampleRate;
        pitchJumpTime *= sampleRate;
        repeatTime = repeatTime * sampleRate | 0;

        // generate waveform
        for(length = attack + decay + sustain + release + delay | 0;
            i < length; b[i++] = s * volume) {              // sample
            if (!(++c%(bitCrush*100|0))) {                  // bit crush
                s = shape? shape>1? shape>2? shape>3?      // wave shape
                    Math.sin(t**3) :                       // 4 noise
                    EngineMath.clamp(Math.tan(t),1,-1):               // 3 tan
                    1-(2*t/PI2%2+2)%2:                     // 2 saw
                    1-4*Math.abs(Math.round(t/PI2)-t/PI2):      // 1 triangle
                    Math.sin(t);                           // 0 sin

                s = (repeatTime ?
                        1 - tremolo + tremolo*Math.sin(PI2*i/repeatTime) // tremolo
                        : 1) *
                    Math.sign(s)*(Math.abs(s)**shapeCurve) *           // curve
                    (i < attack ? i/attack :                 // attack
                    i < attack + decay ?                     // decay
                    1-((i-attack)/decay)*(1-sustainVolume) : // decay falloff
                    i < attack  + decay + sustain ?          // sustain
                    sustainVolume :                          // sustain volume
                    i < length - delay ?                     // release
                    (length - i - delay)/release *           // release falloff
                    sustainVolume :                          // release volume
                    0);                                      // post release

                s = delay ? s/2 + (delay > i ? 0 :           // delay
                    (i<length-delay? 1 : (length-i)/delay) * // release delay 
                    b[i-delay|0]/2/volume) : s;              // sample delay

                if (filter)                                   // apply filter
                    s = y1 = b2*x2 + b1*(x2=x1) + b0*(x1=s) - a2*y2 - a1*(y2=y1);
            }

            f = (frequency += slide += deltaSlide) *// frequency
                Math.cos(modulation*tm++);          // modulation
            t += f + f*noise*Math.sin(i**5);        // noise

            if (j && ++j > pitchJumpTime) {          // pitch jump

                frequency += pitchJump;             // apply pitch jump
                startFrequency += pitchJump;        // also apply to start
                j = 0;                              // stop pitch jump time
            } 

            if (repeatTime && !(++r % repeatTime)) { // repeat 
                frequency = startFrequency;         // reset frequency
                slide = startSlide;                 // reset slide
                j = j || 1;                         // reset pitch jump time
            }
        }

        return b;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // ZzFX Music Renderer v2.0.3 by Keith Clark and Frank Force

    /** Generate samples for a ZzFM song with given parameters *  @param {Array} instruments - Array of ZzFX sound parameters *  @param {Array} patterns - Array of pattern data *  @param {Array} sequence - Array of pattern indexes *  @param {Number} [BPM] - Playback speed of the song in BPM
     *  @return {Array} - Left and right channel sample data
     *  @memberof Audio */
    static zzfxM(instruments:Array<Array<number>>, patterns:Array<Array<Array<number>>>, sequence:Array<number>, BPM = 125) 
    {
    let i, j, k;
    let instrumentParameters;
    let note;
    let sample;
    let patternChannel:Array<number>;
    let notFirstBeat:number;
    let stop;
    let instrument:number;
    let attenuation:number;
    let outSampleOffset:number;
    let isSequenceEnd;
    let sampleOffset = 0;
    let nextSampleOffset;
    let sampleBuffer:Array<number> = [];
    let leftChannelBuffer:Array<number> = [];
    let rightChannelBuffer:Array<number> = [];
    let channelIndex = 0;
    let panning = 0;
    let hasMore = 1;
    let sampleCache:Record<any,any> = {};
    let beatLength = EngineSound.zzfxR / BPM * 60 >> 2;

    // for each channel in order until there are no more
    for (; hasMore; channelIndex++) {

        // reset current values
        sampleBuffer = [hasMore = notFirstBeat = outSampleOffset = 0];

        // for each pattern in sequence
        sequence.forEach((patternIndex, sequenceIndex) => {
        // get pattern for current channel, use empty 1 note pattern if none found
        patternChannel = patterns[patternIndex][channelIndex] || [0, 0, 0];

        // check if there are more channels
        hasMore |= patterns[patternIndex][channelIndex]&&1;

        // get next offset, use the length of first channel
        nextSampleOffset = outSampleOffset + (patterns[patternIndex][0].length - 2 - (notFirstBeat?0:1)) * beatLength;
        // for each beat in pattern, plus one extra if end of sequence
        isSequenceEnd = sequenceIndex == sequence.length - 1;
        for (i = 2, k = outSampleOffset; i < patternChannel.length + (isSequenceEnd as any as number); notFirstBeat = ++i) {

            // <channel-note>
            note = patternChannel[i];

            // stop if end, different instrument or new note
            stop = i == patternChannel.length + (isSequenceEnd as any as number) - 1 && isSequenceEnd ||
                instrument != (patternChannel[0] || 0) || note | 0;

            // fill buffer with samples for previous beat, most cpu intensive part
            for (j = 0; j < beatLength && notFirstBeat;

                // fade off attenuation at end of beat if stopping note, prevents clicking
                j++ > beatLength - 99 && stop && attenuation < 1? attenuation += 1 / 99 : 0
            ) {
            // copy sample to stereo buffers with panning
            sample = (1 - attenuation) * sampleBuffer[sampleOffset++] / 2 || 0;
            leftChannelBuffer[k] = (leftChannelBuffer[k] || 0) - sample * panning + sample;
            rightChannelBuffer[k] = (rightChannelBuffer[k++] || 0) + sample * panning + sample;
            }

            // set up for next note
            if (note) {
                // set attenuation
                attenuation = note % 1;
                panning = patternChannel[1] || 0;
                if (note |= 0) {
                    // get cached sample
                    sampleBuffer = sampleCache[
                    ([
                        instrument = patternChannel[sampleOffset = 0] || 0,
                        note
                    ]) as any
                    ] = sampleCache[[instrument, note] as any] || (
                        // add sample to cache
                        instrumentParameters = [...instruments[instrument]],
                        instrumentParameters[2] *= 2 ** ((note - 12) / 12),

                        // allow negative values to stop notes
                        note > 0 ? EngineSound.zzfxG(...instrumentParameters) : []
                    );
                }
            }
        }

        // update the sample offset
        outSampleOffset = nextSampleOffset;
        });
    }

    return [leftChannelBuffer, rightChannelBuffer];
    }


    static sound(instance:EngineInstance,zzfxSound:Array<number>, range:number=undefined, taper:number=undefined) : ISound{
        if(range===undefined){range=instance.soundDefaultRange;}
        if(taper===undefined){taper=instance.soundDefaultTaper;}
        if (!instance.soundEnable || instance.headlessMode) return;
        const res  :ISound={
            range:0,
            taper:0,
            randomness:0,
            sampleChannels:[],
            sampleRate:0,
            gainNode:undefined,
            source:undefined
        };
        res.range = range;
        res.taper = taper;
        res.randomness = 0;

        if (zzfxSound) {
            // generate zzfx sound now for fast playback
            const defaultRandomness = .05;
            res.randomness = zzfxSound[1] != undefined ? zzfxSound[1] : defaultRandomness;
            zzfxSound[1] = 0; // generate without randomness
            res.sampleChannels = [EngineSound.zzfxG(...zzfxSound)];
            res.sampleRate = EngineSound.zzfxR;
        }
        return res;
    }

    
    /** Play the sound
     *  @param {Vector2} [pos] - World space position to play the sound, sound is not attenuated if null
     *  @param {Number}  [volume] - How much to scale volume by (in addition to range fade)
     *  @param {Number}  [pitch] - How much to scale pitch by (also adjusted by this.randomness)
     *  @param {Number}  [randomnessScale] - How much to scale randomness
     *  @param {Boolean} [loop] - Should the sound loop
     *  @return {AudioBufferSourceNode} - The audio source node
     */
    static play(instance:EngineInstance,sound:ISound,pos:IVector2, volume=1, pitch=1, randomnessScale=1, loop=false) {
        if (!instance.soundEnable || instance.headlessMode) return;
        if (!sound.sampleChannels) return;

        const pan = 0.5;

        // play the sound
        const playbackRate = pitch + pitch * sound.randomness*randomnessScale*EngineMath.rand(-1,1);
        sound.gainNode = instance.audioContext.createGain();
        sound.source = EngineSound.playSamples(instance,sound.sampleChannels, volume, playbackRate, pan, loop, sound.sampleRate, sound.gainNode);
        return sound.source;
    }

    /** Set the sound volume of the most recently played instance of this sound
     *  @param {Number}  [volume] - How much to scale volume by
     */
    static setVolume(sound:ISound,volume=1) {
        if (sound.gainNode){
            sound.gainNode.gain.value = volume;
        }
    }

    /** Stop the last instance of this sound that was played */
    static stop(sound:ISound) {
        if (sound.source){
            sound.source.stop();
        }
        sound.source = undefined;
    }
    
    /** Get source of most recent instance of this sound that was played
     *  @return {AudioBufferSourceNode}
     */
    static getSource(sound:ISound) { return sound.source; }

    /** Play the sound as a note with a semitone offset
     *  @param {Number}  semitoneOffset - How many semitones to offset pitch
     *  @param {Vector2} [pos] - World space position to play the sound, sound is not attenuated if null
     *  @param {Number}  [volume=1] - How much to scale volume by (in addition to range fade)
     *  @return {AudioBufferSourceNode} - The audio source node
     */
    static playNote(instance:EngineInstance,sound:ISound,semitoneOffset:number, pos:IVector2, volume:number) {
         return EngineSound.play(instance,sound,pos, volume, 2**(semitoneOffset/12), 0); }

    /** Get how long this sound is in seconds
     *  @return {Number} - How long the sound is in seconds (undefined if loading)
     */
    static getDuration(sound:ISound) 
    { return sound.sampleChannels && sound.sampleChannels[0].length / sound.sampleRate; }
    
    /** Check if sound is loading, for sounds fetched from a url
     *  @return {Boolean} - True if sound is loading and not ready to play
     */
    static isLoading(sound:ISound) { return !sound.sampleChannels; }
}

/** 
 * Sound Object - Stores a sound for later use and can be played positionally
 * 
 * <a href=https://killedbyapixel.github.io/ZzFX/>Create sounds using the ZzFX Sound Designer.</a>
 * @example
 * // create a sound
 * const sound_example = new Sound([.5,.5]);
 * 
 */


export {EngineSound}
