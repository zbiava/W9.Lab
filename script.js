//----------------------------------------AUDIO CONTEXT----------------------------------------

// Create a new AudioContext for our live ring modulation patch.
// The AudioContext is the main "engine" that powers all Web Audio nodes.
const liveRingModCtx = new AudioContext();

// Start the AudioContext in a suspended state so it’s silent until the user presses the On/Off button.
// Many browsers block audio playback until a user interacts with the page.
await liveRingModCtx.suspend();


//----------------------------------------FUNCTION DEFINITIONS----------------------------------------

// Converts decibels full scale (dBFS) to linear amplitude gain.
// This lets the dB slider control output loudness in a musical way.
const db2a = function(dBFS){
    return 10**(dBFS / 20);
}

// Converts MIDI note numbers to frequency in Hz.
const m2f = function(midiNote){
    return 440 * 2 ** ((midiNote - 69) / 12);
}


//----------------------------------------SOURCE NODES----------------------------------------

// MICROPHONE INPUT
// Request live audio from the user’s microphone.
// Disable echo cancellation, noise suppression, and auto gain control to keep the raw signal clean.
const micInputStream = await navigator.mediaDevices.getUserMedia({
    audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
    }
});

// Convert the MediaStream (from getUserMedia) into a Web Audio node.
// This node will act as the *carrier* signal for the ring modulation.
const micNode = new MediaStreamAudioSourceNode(liveRingModCtx, { mediaStream: micInputStream });


// MODULATOR OSCILLATOR
// Create an oscillator that will act as the *modulator* signal.
// Its frequency is initially 0 Hz (it will be controlled later by another node).
const modOsc = new OscillatorNode(liveRingModCtx, { frequency: 0 });

// Oscillators must be started before they produce any signal.
modOsc.start();


// CONSTANT SOURCE NODE
// Create a ConstantSourceNode to control the modulator’s frequency.
// The ConstantSourceNode outputs a steady DC signal (its "offset") that can be used to drive AudioParams.
// Here it starts at 5 Hz but will be changed by the modulation rate slider.
const modFreq = new ConstantSourceNode(liveRingModCtx, { offset: 5. });

// Like oscillators, constant sources must be started before use.
modFreq.start();


//----------------------------------------PROCESSING NODES----------------------------------------

// MODULATOR GAIN NODE
// This GainNode will scale how strongly the modulator affects the carrier.
// Its gain will determine the *depth* of modulation (how much amplitude is multiplied).
const modulationGainNode = new GainNode(liveRingModCtx, { gain: 0. });

// MASTER GAIN NODE
// The final output level before the audio is sent to the speakers.
// Controlled by the dBFS slider in the interface.
const masterGainNode = new GainNode(liveRingModCtx, { gain: 1. });


//----------------------------------------CONNECTIONS AND DESTINATION----------------------------------------

// STUDENT WORK AREA

























// END STUDENT WORK AREA

//----------------------------------------HTML EVENT LISTENERS----------------------------------------

// Grab references to HTML elements: button, sliders, and labels.
let buttons = document.querySelectorAll("button");
let onOff = buttons[0];
let audioOn = false;

// Check if the context is already running and set the button text accordingly.
if (liveRingModCtx.state === "running") {
    audioOn = true;
    onOff.innerText = "Off";
}

let sliders = document.querySelectorAll("input");
let modSlider = sliders[0];
let gainSlider = sliders[1];

let labels = document.querySelectorAll("label");
let modLabel = labels[0];
let gainLabel = labels[1];


//----------------------------------------ON/OFF BUTTON----------------------------------------

// Toggles audio on and off by resuming or suspending the AudioContext.
// Browsers require user interaction before audio starts.
onOff.addEventListener("click", async () => {
    console.log(audioOn);
    if (audioOn) {
        onOff.innerText = "Turn Off";
        audioOn = false;
        await liveRingModCtx.suspend();
    } else {
        onOff.innerText = "Turn On";
        audioOn = true;
        await liveRingModCtx.resume();
    }
});


//----------------------------------------MODULATION RATE SLIDER----------------------------------------

// Controls the modulation rate (Hz).
// Updates the ConstantSourceNode offset, which controls modOsc.frequency.
modSlider.addEventListener("input", (event) => {
    let newModRate = Number(event.target.value);
    modLabel.innerText = `${event.target.value} Hz`;

    let now = liveRingModCtx.currentTime;
    modFreq.offset.cancelScheduledValues(now);
    modFreq.offset.linearRampToValueAtTime(newModRate, now + 0.01);

    console.log(modOsc.frequency.value);
});


//----------------------------------------OUTPUT GAIN SLIDER----------------------------------------

// Controls the master output gain in dBFS (decibels full scale).
// Uses the db2a() function to convert to linear amplitude.
gainSlider.addEventListener("input", (event) => {
    let newDBFS = Number(event.target.value);
    gainLabel.innerText = `${newDBFS} dBFS`;

    let now = liveRingModCtx.currentTime;
    masterGainNode.gain.cancelScheduledValues(now);
    masterGainNode.gain.linearRampToValueAtTime(db2a(newDBFS), now + 0.01);
});
