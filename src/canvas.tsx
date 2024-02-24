import { Canvas as R3FCanvas } from "@react-three/fiber";
import JoystickControls from "./JoystickControls";

export const Canvas = ({
  children,
  ...rest
}: Parameters<typeof R3FCanvas>[0]) => (
  <>
    <JoystickControls />
    <R3FCanvas id="gl" {...rest}>
      {children}
    </R3FCanvas>
  </>
);
