import { Physics } from "@react-three/rapier";
import { Leva, useControls as useLeva } from "leva";
import { Suspense, useState, useEffect } from "react";
import { Canvas } from "./canvas";
import { usePageVisible } from "./use-page-visible";
import { useLoadingAssets } from "./use-loading-assets";
import Van from "./Van";
import { LEVA_KEY, RAPIER_UPDATE_PRIORITY } from "./constants";
import { SpeedTextTunnel } from "./speed-text-tunnel";
import Interface from "./Interface";
import useGame from "./stores/useGame";
import { useProgress } from "@react-three/drei";
import Setting from "./Setting";

// TODO: reinstate this once the time and restart button display is sorted
// undo commented out speed text components below:

// const Text = styled.div`
//   width: 100%;
//   text-align: center;
//   font-size: 2em;
//   color: white;
//   font-family: monospace;
//   text-shadow: 2px 2px black;
// `;

// const ControlsText = styled(Text)`
//   position: absolute;
//   bottom: 4em;
//   left: 0;
// `;

// const SpeedText = styled(Text)`
//   position: absolute;
//   top: 80px;
//   left: 0;
//   font-size: 1em;
// `;

export default () => {
  const loading = useLoadingAssets();
  const visible = usePageVisible();

  const { debug } = useLeva(`${LEVA_KEY}-physics`, {
    debug: false,
  });

  const [showControls, setShowControls] = useState(false);
  const toggleJoystickOn = useGame((state) => state.toggleJoystickOn);
  const toggleJoystickOff = useGame((state) => state.toggleJoystickOff);
  // const [isTouchScreen, setIsTouchScreen] = useState(false);

  useEffect(() => {
    // Check if using a touch control device, show/hide joystick
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      // setIsTouchScreen(true);
      toggleJoystickOn();
    } else {
      // setIsTouchScreen(false);
      toggleJoystickOff();
    }
    window.addEventListener("pointerdown", (e) => {
      e.preventDefault;
    });
    return () => {
      window.removeEventListener("pointerdown", (e) => {
        e.preventDefault;
      });
    };
  }, []);

  const loadingBarElement = document.querySelector<HTMLElement>(".loading-bar");
  const {
    // active,
    progress,
    // errors,
    // item,
    // loaded,
    // total
  } = useProgress();

  // const overlayOpacity = { value: 1 };
  // const [overlayAlpha, setOverlayAlpha] = useState(1);
  // const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
  // const overlayMaterial = new THREE.ShaderMaterial({
  //   transparent: true,
  //   uniforms: {
  //     uAlpha: { value: overlayAlpha },
  //   },
  //   vertexShader: `
  //       void main()
  //       {
  //           gl_Position = vec4(position, 1.0);
  //       }
  //   `,
  //   fragmentShader: `
  //       uniform float uAlpha;

  //       void main()
  //       {
  //           gl_FragColor = vec4(0.153, 0.153, 0.102, uAlpha);
  //       }
  //   `,
  // });

  useEffect(() => {
    loadingBarElement!.style.transform = `scaleX(${progress / 100})`;
    if (!loading) {
      window.setTimeout(() => {
        // animate overlay
        // gsap.to(overlayOpacity, {
        //   duration: 6,
        //   value: 0,
        //   delay: 1,
        //   // onUpdate: () => {
        //   //   setOverlayAlpha(overlayOpacity.value);
        //   // },
        //   onComplete: () => {
        //     // set show interface to true
        //   },
        // });

        // update loadingBarElement
        loadingBarElement!.classList.add("ended");
        loadingBarElement!.style.transform = "";
        setShowControls(true);
      }, 500);
    }
  }, [progress, loading]);

  return (
    <>
      <Suspense fallback={null}>
        <Canvas
          camera={{ fov: 60, position: [0, 30, -20] }}
          shadows
          // onPointerDown={(e) => {
          //   // if (e.pointerType === "mouse") {
          //   //   (e.target as HTMLCanvasElement).requestPointerLock();
          //   // }
          //   e.preventDefault;
          // }}
        >
          <color attach="background" args={["#27271a"]} />
          {/* <mesh geometry={overlayGeometry} material={overlayMaterial}></mesh> */}
          <Physics
            gravity={[0, -9.81, 0]}
            updatePriority={RAPIER_UPDATE_PRIORITY}
            // todo from source rapier-raycast-vehicle dev: support fixed timestepping
            // right now if timeStep is not "vary", the wheel positions will be incorrect and will visually jitter
            // timeStep={1 / 60} // originally set to "vary"
            // erp={0.25} // just trying out erp customizations
            // joint-erp={0.25} // ^
            paused={!visible || loading}
            debug={debug}
          >
            <Van />
            <Setting />
          </Physics>
        </Canvas>

        {showControls && <Interface />}
        <Leva hidden collapsed />
        {showControls && <SpeedTextTunnel.Out />}
        {/* <ControlsText>use wasd to drive, space to break</ControlsText> */}
      </Suspense>
    </>
  );
};
