import { Canvas as R3FCanvas } from "@react-three/fiber";
// import { useState, useEffect } from "react";
// import { Spinner } from './spinner'
import { EcctrlJoystick } from "ecctrl";
// import { PropsWithChildren } from "react";
import useGame from "./stores/useGame";
// import Interface from "./Interface";

export interface CustomJoystickProps {
  // gasOn: boolean;
  // reverseOn: boolean;
}

const EcctrlJoystickControls = () =>
  // props: PropsWithChildren<CustomJoystickProps>
  {
    const gasToggle = useGame((state: any) => state.gasOn);
    const reverseToggle = useGame((state: any) => state.reverseOn);
    const brakeToggle = useGame((state: any) => state.brakeOn);
    const jumpToggle = useGame((state: any) => state.jumpOn);
    const joystickToggle = useGame((state: any) => state.joystickOn);

    return (
      <>
        {joystickToggle && (
          <EcctrlJoystick
            buttonNumber={4}
            buttonGroup1Position={[-2, 0, 0]} // button 1 posiiton in 3D scene
            buttonGroup2Position={[1, 0, 0]}
            buttonGroup3Position={[-0.5, -2.1, 0]}
            buttonGroup4Position={[-0.5, 2.1, 0]}
            buttonTop1Props={{ visible: reverseToggle }} // custom properties for the button 1 top mesh (large button)
            buttonTop2Props={{ visible: gasToggle }} //
            buttonTop3Props={{ visible: brakeToggle }} //
            buttonTop4Props={{ visible: jumpToggle }} //
          />
        )}
      </>
    );
  };

export const Canvas = ({
  children,
  ...rest
}: Parameters<typeof R3FCanvas>[0]) => (
  // props: PropsWithChildren<CustomJoystickProps>
  <>
    <EcctrlJoystickControls />
    {/* <Suspense fallback={<Spinner />}> */}
    <R3FCanvas id="gl" {...rest}>
      {children}
    </R3FCanvas>
    {/* </Suspense> */}
  </>
);
