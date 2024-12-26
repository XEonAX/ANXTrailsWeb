import * as Tone from "tone";

const synth = new Tone.PolySynth().toDestination();
synth.volume.value = (document.getElementById("volume") as HTMLInputElement).valueAsNumber;
(document.getElementById("volume") as HTMLInputElement).addEventListener("change", (evt) => {
    synth.volume.value = (evt.target as HTMLInputElement).valueAsNumber;
})
// set the attributes across all the voices using 'set'
// synth.set({ detune: -1200 });
// play a chord
// synth.triggerAttackRelease(["C4", "E4", "A4"], 1);

let firstClick = true;
interface FrequencyMap {
    [key: number]: number | undefined;
}

export const Frequencies: FrequencyMap = {}; // Object to store trails by sessionId
export function playSound(x: number, y: number) {
    if (firstClick) {
        Tone.start();
        firstClick = false;
    }
    // Map the value from [-1, 1] to [0, 12]
    let freq = GetFrequncy(x, y);
    synth.triggerAttackRelease(freq, 0.01);
}
export function GetFrequncy(x: number, y: number) {
    const mapToRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    };

    // Map x and y from [-1, 1] to [0, 12]
    let mappedX = mapToRange(x, -1, 1, 0, 12);
    let mappedY = mapToRange(y, -1, 1, 11, -1);

    // Snap the values to integers
    mappedX = Math.floor(mappedX);
    mappedY = Math.floor(mappedY);
    const midiNo = mappedX * 12 + mappedY;

    if (Frequencies[midiNo] == undefined) {
        Frequencies[midiNo] = 440 * Math.pow(2, ((midiNo) - 69) / 12);
    }
    let Frequency = Frequencies[midiNo];
    return Frequency;
}

