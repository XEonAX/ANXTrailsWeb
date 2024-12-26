import './styles.css';
import { sendMove, sendClick } from './communication';
import { updateTrail, updateClick } from './graphics';
import { GetFrequncy } from './sounds';

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
});

let freqSpan = document.getElementById("Frequency") as HTMLSpanElement;
window.addEventListener("mousemove", (event: MouseEvent) => {
  let x = (event.clientX / sizes.width) * 2 - 1;
  let y = -(event.clientY / sizes.height) * 2 + 1;
  updateTrail("selfm", x, y);
  sendMove(-1, x, y);
  let freq = GetFrequncy(x, y);
  freqSpan.innerText = freq.toFixed(2).toString();
});

window.addEventListener("touchmove", (event: TouchEvent) => {
  for (let i = 0; i < event.touches.length; i++) {
    const touch = event.touches[i];
    let x = (touch.clientX / sizes.width) * 2 - 1;
    let y = -(touch.clientY / sizes.height) * 2 + 1;
    updateTrail("self" + i, x, y);
    sendMove(i, x, y);
  }
});

window.addEventListener('click', (event) => {
  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = -(event.clientY / window.innerHeight) * 2 + 1;
  updateClick(x, y, true);
  sendClick(x, y);
});


document.getElementById("FullscreenToggle")?.addEventListener("click", (_event) => {
  (document.querySelector("canvas.webgl") as HTMLElement).requestFullscreen()
})
fetch("https://ping.aeonax.com/" + window.location, {
  mode: "no-cors",
  referrerPolicy: "unsafe-url"
})