import { addEffect } from "@react-three/fiber";
import { useJoystickControls } from "ecctrl";
import useGame from "./stores/useGame.js";
import { useControls } from "./use-controls";
import { useEffect, useState } from "react";

export interface InterfaceProps {
  joystickOn: boolean;
}

export default function Interface() {
  // should i unsubscribe this from inside useEffect hook?
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
    (state: { curJoystickDis: any }) => state.curJoystickDis,
  );
  const joystickAng = useJoystickControls(
    (state: { curJoystickAng: any }) => state.curJoystickAng,
  );
  const joystickButton1 = useJoystickControls(
    (state: { curButton1Pressed: any }) => state.curButton1Pressed,
  );
  const joystickButton2 = useJoystickControls(
    (state: { curButton2Pressed: any }) => state.curButton2Pressed,
  );

  const joystickButton3 = useJoystickControls(
    (state: { curButton3Pressed: any }) => state.curButton3Pressed,
  );

  const joystickButton4 = useJoystickControls(
    (state: { curButton4Pressed: any }) => state.curButton4Pressed,
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

  const [time, setTime] = useState("0");
  const restart = useGame((state) => state.restart);
  const phase = useGame((state) => state.phase);

  const controls = useControls();
  // TBC but it appears that joystick controls have their own auto subscribe / unsubscribe
  useEffect(() => {
    // const unsubscribeEffect = addEffect(() => {
    // const state = useGame.getState();
    const { phase, gasOn, reverseOn, joystickOn } = useGame.getState();
    if (joystickOn) {
      if (joystickButton4) {
        toggleJumpOn();
        setTimeout(() => {
          toggleJumpOff();
        }, 80);
      } else {
        toggleJumpOff();
      }
      if (joystickButton2) {
        if (gasOn) {
          toggleGasOff();
        } else if (!gasOn) {
          toggleGasOn();
          toggleReverseOff();
        }
      }
      if (joystickButton1) {
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
        if (phase === "playing") toggleBrakeOff();
      }

      if (joystickDis > 0) {
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
    // }
    // );
    // return () => {
    //   unsubscribeEffect();
    // };
  }, [
    joystickButton1,
    joystickButton2,
    joystickButton3,
    joystickButton4,
    joystickDis,
    joystickAng,
  ]);

  useEffect(() => {
    const unsubscribeEffect = addEffect(() => {
      // const { joystickOn } = useGame.getState();
      // const { phase } = useGame.getState();
      const { phase, joystickOn, startTime, endTime } = useGame.getState();

      let elapsedTime = 0;
      let elapsedTimeString = "0";

      if (phase === "playing") elapsedTime = Date.now() - startTime;
      else if (phase === "ended") elapsedTime = endTime - startTime;

      elapsedTime /= 1000;
      elapsedTimeString = elapsedTime.toFixed(0);
      setTime(elapsedTimeString);
      // console.log("time: ", time);

      if (!joystickOn) {
        if (controls.current.forward) {
          toggleGasOn();
          toggleReverseOff();
        } else {
          toggleGasOff();
        }
        if (controls.current.back) {
          toggleReverseOn();
          toggleGasOff();
        } else {
          toggleReverseOff();
        }
        if (controls.current.left) {
          toggleLeftOn();
          toggleRightOff();
        } else {
          toggleLeftOff();
        }
        if (controls.current.right) {
          toggleLeftOff();
          toggleRightOn();
        } else {
          toggleRightOff();
        }
        if (controls.current.brake) {
          toggleBrakeOn();
        } else {
          if (phase === "playing") toggleBrakeOff();
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

  // useEffect(() => {
  //   const unsubscribeEffect = addEffect(() => {
  //     const { phase, startTime, endTime } = useGame.getState();

  //     let elapsedTime = 0;
  //     let elapsedTimeString = "0";

  //     if (phase === "playing") elapsedTime = Date.now() - startTime;
  //     else if (phase === "ended") elapsedTime = endTime - startTime;

  //     elapsedTime /= 1000;
  //     elapsedTimeString = elapsedTime.toFixed(0);
  //     setTime(elapsedTimeString);
  //     console.log("time: ", time);
  //   });

  //   return () => {
  //     unsubscribeEffect();
  //   };
  // }, []);

  // useEffect(() => {
  //   const { gasOn, reverseOn, joystickOn } = useGame.getState();
  //   if (joystickOn) {
  //     if (joystickButton4) {
  //       toggleJumpOn();
  //       setTimeout(() => {
  //         toggleJumpOff();
  //       }, 80);
  //     } else {
  //       toggleJumpOff();
  //     }
  //     if (joystickButton2) {
  //       if (gasOn) {
  //         toggleGasOff();
  //       } else if (!gasOn) {
  //         toggleGasOn();
  //         toggleReverseOff();
  //       }
  //     }
  //     if (joystickButton1) {
  //       if (reverseOn) {
  //         toggleReverseOff();
  //       } else if (!reverseOn) {
  //         toggleReverseOn();
  //         toggleGasOff();
  //       }
  //     }
  //     if (joystickButton3) {
  //       toggleBrakeOn();
  //     } else {
  //       toggleBrakeOff();
  //     }

  //     if (joystickDis > 0) {
  //       if (joystickAng >= Math.PI / 2 && joystickAng <= (Math.PI / 2) * 3) {
  //         toggleLeftOn();
  //         toggleRightOff();
  //       } else if (joystickAng < Math.PI / 2 && joystickAng >= 0) {
  //         toggleLeftOff();
  //         toggleRightOn();
  //       } else if (
  //         joystickAng <= Math.PI * 2 &&
  //         joystickAng > (Math.PI / 2) * 3
  //       ) {
  //         toggleLeftOff();
  //         toggleRightOn();
  //       }
  //     } else if (joystickDis === 0) {
  //       toggleLeftOff();
  //       toggleRightOff();
  //     }
  //   }
  // }, [
  //   joystickButton1,
  //   joystickButton2,
  //   joystickButton3,
  //   joystickButton4,
  //   joystickDis,
  //   joystickAng,
  // ]);

  return (
    <>
      {/* Time */}
      <div className="time">{time}</div>

      {/* Restart */}
      {phase === "ended" && (
        <div className="restart" onClick={restart}>
          Restart
        </div>
      )}

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
            <div className={`key large ${brakeToggle ? "active" : ""}`}>
              SPACE
            </div>
            <div className={`key ${jumpToggle ? "active" : ""}`}>J</div>
          </div>
        </div>
      </div>
    </>
  );
}
