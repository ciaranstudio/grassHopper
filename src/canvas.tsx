import { Canvas as R3FCanvas } from "@react-three/fiber";
import { EcctrlJoystick } from "ecctrl";
import useGame from "./stores/useGame";
// import { PropsWithChildren } from "react";
import { useLoadingAssets } from "./use-loading-assets";
import { useState, useEffect } from "react";

export interface CustomJoystickProps {}

const EcctrlJoystickControls = () =>
  // props: PropsWithChildren<CustomJoystickProps>
  {
    const gasToggle = useGame((state: any) => state.gasOn);
    const reverseToggle = useGame((state: any) => state.reverseOn);
    const brakeToggle = useGame((state: any) => state.brakeOn);
    const jumpToggle = useGame((state: any) => state.jumpOn);
    const joystickToggle = useGame((state: any) => state.joystickOn);

    const loading = useLoadingAssets();
    const [showControls, setShowControls] = useState(false);

    useEffect(() => {
      if (!loading) {
        window.setTimeout(() => {
          setShowControls(true);
        }, 500);
      }
    }, [loading]);

    return (
      <>
        {joystickToggle && showControls && (
          <EcctrlJoystick
            buttonNumber={4}
            buttonGroup1Position={[-2, 0, 0]}
            buttonGroup2Position={[1, 0, 0]}
            buttonGroup3Position={[-0.5, -2.1, 0]}
            buttonGroup4Position={[-0.5, 2.1, 0]}
            buttonTop1Props={{ visible: reverseToggle }}
            buttonTop2Props={{ visible: gasToggle }}
            buttonTop3Props={{ visible: brakeToggle }}
            buttonTop4Props={{ visible: jumpToggle }}
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
    <R3FCanvas id="gl" {...rest}>
      {children}
    </R3FCanvas>
  </>
);
