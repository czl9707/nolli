import "@nolli/ui/global.css";
import { continueRender, delayRender, registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

// Fonts arrive via @fontsource CSS with font-display:swap — load them eagerly
// so a capture can't beat the swap window and bake in the fallback.
const fontsReady = delayRender("Loading reel fonts");
Promise.all([
  document.fonts.load('400 96px "Architects Daughter"'),
  document.fonts.load('400 96px "Quicksand Variable"'),
]).then(
  () => continueRender(fontsReady),
  (err) => {
    continueRender(fontsReady);
    throw err;
  },
);

registerRoot(RemotionRoot);
