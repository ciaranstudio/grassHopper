import { Physics } from "@react-three/rapier";
import { Leva, useControls as useLeva } from "leva";
import { Suspense, useState, useEffect } from "react";
import { Canvas } from "./Canvas";
import { usePageVisible } from "./hooks/usePageVisible";
import { useLoadingAssets } from "./hooks/useLoadingAssets";
import Van from "./vehicle/Van";
import { LEVA_KEY, RAPIER_UPDATE_PRIORITY } from "./vehicle/constants";
import { SpeedTextTunnel } from "./controls/SpeedTextTunnel";
import Interface from "./controls/Interface";
import useGame from "./store/useGame";
import Setting from "./space/Setting";
import Placeholder from "./loading/Placeholder";

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
    window.document.body.style.cursor = "wait";
  }, []);

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

  useEffect(() => {
    if (!loading) {
      window.setTimeout(() => {
        setShowControls(true);
        window.document.body.style.cursor = "auto";
      }, 500);
    }
  }, [loading]);

  return (
    <>
      <Suspense fallback={<Placeholder />}>
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
        <Leva collapsed hidden />
        {showControls && <SpeedTextTunnel.Out />}
        {/* <ControlsText>use wasd to drive, space to break</ControlsText> */}
      </Suspense>
    </>
  );
};
