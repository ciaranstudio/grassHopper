import { addEffect } from "@react-three/fiber";
import { useJoystickControls } from "ecctrl";
import useGame from "./stores/useGame.js";
import { useControls } from "./use-controls";
import { useEffect } from "react";

export interface InterfaceProps {
  joystickOn: boolean;
}

export default function Interface() {
  const joystickToggle = useGame((state: any) => state.joystickOn);
  const gasToggle = useGame((state: any) => state.gasOn);
  const reverseToggle = useGame((state: any) => state.reverseOn);
  const brakeToggle = useGame((state: any) => state.brakeOn);
  const leftToggle = useGame((state: any) => state.leftOn);
  const rightToggle = useGame((state: any) => state.rightOn);
  const jumpToggle = useGame((state: any) => state.jumpOn);

  // const getJoystickValues = useJoystickControls(
  //   (state: { getJoystickValues: any }) => state.getJoystickValues
  // );
  const joystickDis = useJoystickControls(
    (state: { curJoystickDis: any }) => state.curJoystickDis
  );
  const joystickAng = useJoystickControls(
    (state: { curJoystickAng: any }) => state.curJoystickAng
  );
  const joystickButton1 = useJoystickControls(
    (state: { curButton1Pressed: any }) => state.curButton1Pressed
  );
  const joystickButton2 = useJoystickControls(
    (state: { curButton2Pressed: any }) => state.curButton2Pressed
  );

  const joystickButton3 = useJoystickControls(
    (state: { curButton3Pressed: any }) => state.curButton3Pressed
  );

  const joystickButton4 = useJoystickControls(
    (state: { curButton4Pressed: any }) => state.curButton4Pressed
  );
  // const pressButton3 = useJoystickControls(
  //   (state: { pressButton3: any }) => state.pressButton3
  // );

  const toggleGasOn = useGame((state) => state.toggleGasOn);
  const toggleGasOff = useGame((state) => state.toggleGasOff);
  const toggleReverseOn = useGame((state) => state.toggleReverseOn);
  const toggleReverseOff = useGame((state) => state.toggleReverseOff);
  const toggleBrakeOn = useGame((state) => state.toggleBrakeOn);
  const toggleBrakeOff = useGame((state) => state.toggleBrakeOff);
  const toggleRightOn = useGame((state) => state.toggleRightOn);
  const toggleRightOff = useGame((state) => state.toggleRightOff);
  const toggleLeftOn = useGame((state) => state.toggleLeftOn);
  const toggleLeftOff = useGame((state) => state.toggleLeftOff);
  const toggleJumpOn = useGame((state) => state.toggleJumpOn);
  const toggleJumpOff = useGame((state) => state.toggleJumpOff);

  const controls = useControls();

  useEffect(() => {
    const unsubscribeEffect = addEffect(() => {
      const { joystickOn } = useGame.getState();
      // const joyValues = getJoystickValues();
      if (!joystickOn) {
        if (controls.current.forward) {
          toggleGasOn();
          toggleReverseOff();
        } else {
          toggleGasOff();
        }
        // setBack(controls.current.back);
        if (controls.current.back) {
          toggleReverseOn();
          toggleGasOff();
        } else {
          toggleReverseOff();
        }
        // setLeft(controls.current.left);
        if (controls.current.left) {
          toggleLeftOn();
          toggleRightOff();
        } else {
          toggleLeftOff();
        }
        // setRight(controls.current.right);
        if (controls.current.right) {
          toggleLeftOff();
          toggleRightOn();
        } else {
          toggleRightOff();
        }
        // setBrake(controls.current.brake);
        if (controls.current.brake) {
          toggleBrakeOn();
        } else {
          toggleBrakeOff();
        }
        if (controls.current.jump) {
          toggleJumpOn();
        } else {
          toggleJumpOff();
        }
      }
    });
    return () => {
      unsubscribeEffect();
    };
  }, []);

  useEffect(() => {
    const { gasOn, reverseOn, joystickOn } = useGame.getState();
    if (joystickOn) {
      if (joystickButton4) {
        toggleJumpOn();
        setTimeout(() => {
          // console.log("Delayed with timeout.");
          toggleJumpOff();
        }, 80);
      } else {
        toggleJumpOff();
      }
      if (joystickButton2) {
        // console.log("joyButton2 pressed and gasOn: ", gasOn);
        if (gasOn) {
          toggleGasOff();
        } else if (!gasOn) {
          toggleGasOn();
          toggleReverseOff();
        }
      }
      if (joystickButton1) {
        // console.log("joyButton1 pressed and reverseOn: ", reverseOn);
        if (reverseOn) {
          toggleReverseOff();
        } else if (!reverseOn) {
          toggleReverseOn();
          toggleGasOff();
        }
      }
      if (joystickButton3) {
        toggleBrakeOn();
      } else {
        toggleBrakeOff();
      }

      if (joystickDis > 0) {
        // console.log("joyDis: ", joystickDis, " / joyAng: ", joystickAng);

        if (joystickAng >= Math.PI / 2 && joystickAng <= (Math.PI / 2) * 3) {
          toggleLeftOn();
          toggleRightOff();
        } else if (joystickAng < Math.PI / 2 && joystickAng >= 0) {
          toggleLeftOff();
          toggleRightOn();
        } else if (
          joystickAng <= Math.PI * 2 &&
          joystickAng > (Math.PI / 2) * 3
        ) {
          toggleLeftOff();
          toggleRightOn();
        }
      } else if (joystickDis === 0) {
        toggleLeftOff();
        toggleRightOff();
      }
    }
  }, [
    joystickButton1,
    joystickButton2,
    joystickButton3,
    joystickButton4,
    joystickDis,
    joystickAng,
  ]);

  return (
    <div
      className="interface"
      style={joystickToggle ? { display: "none" } : {}}
    >
      {/* Controls */}
      <div className="controls">
        <div className="raw">
          <div className={`key ${gasToggle ? "active" : ""}`}>W</div>
        </div>
        <div className="raw">
          <div className={`key ${leftToggle ? "active" : ""}`}>A</div>
          <div className={`key ${reverseToggle ? "active" : ""}`}>S</div>
          <div className={`key ${rightToggle ? "active" : ""}`}>D</div>
        </div>
        <div className="raw">
          <div className={`key large ${brakeToggle ? "active" : ""}`}>SPACE</div>
          <div className={`key ${jumpToggle ? "active" : ""}`}>J</div>
        </div>
      </div>
    </div>
  );
}
