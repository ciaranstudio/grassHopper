import {
  KeyboardControls,
  OrbitControls,
  useKeyboardControls,
  Edges,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CylinderCollider,
  Physics,
  RapierRigidBody,
  RigidBody,
  useFixedJoint,
  useRevoluteJoint,
} from "@react-three/rapier";
import { useControls } from "leva";
import React, {
  RefObject,
  createRef,
  useState,
  useEffect,
  useRef,
} from "react";
import { Quaternion, Vector3, Vector3Tuple, Vector4Tuple } from "three";
import { Canvas } from "./canvas";
import { usePageVisible } from "./use-page-visible";
import Grass from "./Grass";
import { useJoystickControls } from "ecctrl";
import useGame from "./stores/useGame.jsx";
import Interface from "./Interface";

const LEVA_KEY = "rapier-revolute-joint-vehicle";

const CONTROLS = {
  forward: "forward",
  back: "back",
  left: "left",
  right: "right",
  reverse: "reverse",
};

const CONTROLS_MAP = [
  { name: CONTROLS.forward, keys: ["ArrowUp", "w", "W"] },
  { name: CONTROLS.back, keys: ["ArrowDown", "s", "S"] },
  { name: CONTROLS.left, keys: ["ArrowLeft", "a", "A"] },
  { name: CONTROLS.right, keys: ["ArrowRight", "d", "D"] },
  { name: CONTROLS.reverse, keys: ["Space"] },
];

const RAPIER_UPDATE_PRIORITY = -50;
const AFTER_RAPIER_UPDATE = RAPIER_UPDATE_PRIORITY - 1;

const AXLE_TO_CHASSIS_JOINT_STIFFNESS = 150000;
const AXLE_TO_CHASSIS_JOINT_DAMPING = 20;

const DRIVEN_WHEEL_FORCE = 1600;
const DRIVEN_WHEEL_DAMPING = 10;

type FixedJointProps = {
  body: RefObject<RapierRigidBody>;
  wheel: RefObject<RapierRigidBody>;
  body1Anchor: Vector3Tuple;
  body1LocalFrame: Vector4Tuple;
  body2Anchor: Vector3Tuple;
  body2LocalFrame: Vector4Tuple;
};

const FixedJoint = ({
  body,
  wheel,
  body1Anchor,
  body1LocalFrame,
  body2Anchor,
  body2LocalFrame,
}: FixedJointProps) => {
  useFixedJoint(body, wheel, [
    body1Anchor,
    body1LocalFrame,
    body2Anchor,
    body2LocalFrame,
  ]);

  return null;
};

type AxleJointProps = {
  body: RefObject<RapierRigidBody>;
  wheel: RefObject<RapierRigidBody>;
  bodyAnchor: Vector3Tuple;
  wheelAnchor: Vector3Tuple;
  rotationAxis: Vector3Tuple;
  isDriven: boolean;
};

const AxleJoint = ({
  body,
  wheel,
  bodyAnchor,
  wheelAnchor,
  rotationAxis,
  isDriven,
}: AxleJointProps) => {
  const gasToggle = useGame((state: any) => state.gasOn);
  const reverseToggle = useGame((state: any) => state.reverseOn);

  const [gasOn, setGasOn] = useState(gasToggle);
  const [reverseOn, setReverseOn] = useState(reverseToggle);

  const joint = useRevoluteJoint(body, wheel, [
    bodyAnchor,
    wheelAnchor,
    rotationAxis,
  ]);

  const joyDis = useJoystickControls(
    (state: { curJoystickDis: any }) => state.curJoystickDis
  );
  const joyAng = useJoystickControls(
    (state: { curJoystickAng: any }) => state.curJoystickAng
  );
  const joyButton1 = useJoystickControls(
    (state: { curButton1Pressed: any }) => state.curButton1Pressed
  );
  const joyButton2 = useJoystickControls(
    (state: { curButton2Pressed: any }) => state.curButton2Pressed
  );

  const forwardPressed = useKeyboardControls((state) => state.forward);
  const backwardPressed = useKeyboardControls((state) => state.back);
  const brakePressed = useKeyboardControls((state) => state.brake);

  const toggleGasOn = useGame((state) => state.toggleGasOn);
  const toggleGasOff = useGame((state) => state.toggleGasOff);
  const toggleReverseOn = useGame((state) => state.toggleReverseOn);
  const toggleReverseOff = useGame((state) => state.toggleReverseOff);

  useEffect(() => {
    // console.log(getJoystickValues());
    if (!isDriven) return;
    let forward = 0;
    if (!gasOn) {
      console.log("gas = false");
      if (joyButton2) {
        setGasOn(!gasOn);
        toggleGasOn();
        console.log("toggling gas");

        // forward += 1;
        if (reverseOn) {
          setReverseOn(!reverseOn);
          toggleReverseOff();
          console.log("toggling reverse");
        }
      }
    } else {
      console.log("gas = true");
      forward += 1;
      if (joyButton2) {
        setGasOn(!gasOn);
        toggleGasOff();
        console.log("toggling gas");
      }
    }
    if (!reverseOn) {
      console.log("reverse = false");
      if (joyButton1) {
        setReverseOn(!reverseOn);
        toggleReverseOn();
        console.log("toggling reverse");

        // forward += 1;
        if (gasOn) {
          setGasOn(!gasOn);
          toggleGasOff();
          console.log("toggling gas");
        }
      }
    } else {
      console.log("reverse = true");
      forward -= 1;
      if (joyButton1) {
        setReverseOn(!reverseOn);
        toggleReverseOff();
        console.log("toggling reverse");
      }
    }

    if (joyDis > 0) {
      console.log("joyAng: ", joyAng);
      console.log("joyDis: ", joyDis);
      console.log("joyButton1: ", joyButton1);
    }
    if (forwardPressed) {
      forward += 1;
      if (brakePressed) forward -= 1;
    }
    if (backwardPressed) {
      forward -= 1;
      if (brakePressed) forward += 1;
    }
    if (brakePressed) {
      if (forwardPressed) forward -= 1;
      if (backwardPressed) forward += 1;
      if (!forwardPressed && !backwardPressed) forward -= 1;
    }

    forward *= DRIVEN_WHEEL_FORCE;

    if (forward !== 0) {
      wheel.current?.wakeUp();
    }

    joint.current?.configureMotorVelocity(forward, DRIVEN_WHEEL_DAMPING);
  }, [
    forwardPressed,
    backwardPressed,
    brakePressed,
    joyAng,
    joyButton1,
    joyButton2,
  ]);

  useEffect(() => {
    const unsubscribeToggleGas = useGame.subscribe(
      (state) => state.gasOn,
      (value) => {
        console.log("gasOn store value: ", value);
      }
    );

    const unsubscribeToggleReverse = useGame.subscribe(
      (state) => state.reverseOn,
      (value) => {
        console.log("reverseOn store value: ", value);
      }
    );

    // const unsubscribeAny = subscribeKeys(() => {
    //   start();
    // });

    return () => {
      unsubscribeToggleGas;
      unsubscribeToggleReverse;
      // unsubscribeAny();
    };
  }, []);

  return null;
};

type SteeredJointProps = {
  body: RefObject<RapierRigidBody>;
  wheel: RefObject<RapierRigidBody>;
  bodyAnchor: Vector3Tuple;
  wheelAnchor: Vector3Tuple;
  rotationAxis: Vector3Tuple;
};

const SteeredJoint = ({
  body,
  wheel,
  bodyAnchor,
  wheelAnchor,
  rotationAxis,
}: SteeredJointProps) => {
  const joint = useRevoluteJoint(body, wheel, [
    bodyAnchor,
    wheelAnchor,
    rotationAxis,
  ]);

  const joyDis = useJoystickControls(
    (state: { curJoystickDis: any }) => state.curJoystickDis
  );
  const joyAng = useJoystickControls(
    (state: { curJoystickAng: any }) => state.curJoystickAng
  );

  const left = useKeyboardControls((state) => state.left);
  const right = useKeyboardControls((state) => state.right);
  const targetPos = left ? 0.2 : right ? -0.2 : 0;

  const targetPosJoy =
    // left half (top and bottom quadrants) of joystick circle
    joyAng <= (Math.PI / 2) * 3 && joyAng >= Math.PI / 2
      ? ((joyAng - Math.PI / 2) / Math.PI) * 0.2
      : // top right quadrand of joystick circle
      joyAng < Math.PI / 2 && joyAng >= 0
      ? (joyAng === 0 ? Math.PI / 2 : (Math.PI / 2 - joyAng) / Math.PI) * -0.2
      : // bottom right quadrand of joystick circle
      joyAng <= Math.PI * 2 && joyAng > (Math.PI / 2) * 3
      ? ((joyAng === Math.PI * 2 ? Math.PI / 2 : Math.PI * 2 - joyAng) /
          Math.PI) *
          -0.2 -
        0.1
      : 0;

  useEffect(() => {
    if (joyDis > 0) {
      joint.current?.configureMotorPosition(
        targetPosJoy,
        AXLE_TO_CHASSIS_JOINT_STIFFNESS,
        AXLE_TO_CHASSIS_JOINT_DAMPING
      );
    } else
      joint.current?.configureMotorPosition(
        targetPos,
        AXLE_TO_CHASSIS_JOINT_STIFFNESS,
        AXLE_TO_CHASSIS_JOINT_DAMPING
      );
  }, [left, right, joyDis, joyAng]);

  return null;
};

type WheelInfo = {
  axlePosition: Vector3Tuple;
  wheelPosition: Vector3Tuple;
  isSteered: boolean;
  side: "left" | "right";
  isDriven: boolean;
};

const RevoluteJointVehicle = () => {
  const { cameraMode } = useControls(`${LEVA_KEY}-camera`, {
    cameraMode: {
      value: "follow",
      options: ["follow", "orbit"],
    },
  });

  const camera = useThree((state) => state.camera);
  const currentCameraPosition = useRef(new Vector3(15, 15, 0));
  const currentCameraLookAt = useRef(new Vector3());

  const chassisRef = useRef<RapierRigidBody>(null);

  const wheels: WheelInfo[] = [
    {
      axlePosition: [-1.2, -0.6, 0.7],
      wheelPosition: [-1.2, -0.4, 1],
      isSteered: true,
      side: "left",
      isDriven: false,
    },
    {
      axlePosition: [-1.2, -0.6, -0.7],
      wheelPosition: [-1.2, -0.4, -1],
      isSteered: true,
      side: "right",
      isDriven: false,
    },
    {
      axlePosition: [1.2, -0.6, 0.7],
      wheelPosition: [1.2, -0.4, 1],
      isSteered: false,
      side: "left",
      isDriven: true,
    },
    {
      axlePosition: [1.2, -0.6, -0.7],
      wheelPosition: [1.2, -0.4, -1],
      isSteered: false,
      side: "right",
      isDriven: true,
    },
  ];

  const wheelRefs = useRef<RefObject<RapierRigidBody>[]>(
    wheels.map(() => createRef())
  );

  const axleRefs = useRef<RefObject<RapierRigidBody>[]>(
    wheels.map(() => createRef())
  );

  useFrame((_, delta) => {
    if (!chassisRef.current || cameraMode !== "follow") {
      return;
    }

    const t = 1.0 - Math.pow(0.01, delta);

    const idealOffset = new Vector3(10, 5, 0);
    idealOffset.applyQuaternion(chassisRef.current.rotation() as Quaternion);
    idealOffset.add(chassisRef.current.translation() as Vector3);
    if (idealOffset.y < 0) {
      idealOffset.y = 0;
    }

    const idealLookAt = new Vector3(0, 1, 0);
    idealLookAt.applyQuaternion(chassisRef.current.rotation() as Quaternion);
    idealLookAt.add(chassisRef.current.translation() as Vector3);

    currentCameraPosition.current.lerp(idealOffset, t);
    currentCameraLookAt.current.lerp(idealLookAt, t);

    camera.position.copy(currentCameraPosition.current);
    camera.lookAt(currentCameraLookAt.current);
  }, AFTER_RAPIER_UPDATE);

  return (
    <>
      {cameraMode === "orbit" ? <OrbitControls /> : null}

      <group position={[0, 10, 0]}>
        {/* chassis */}
        <RigidBody ref={chassisRef} colliders="cuboid" mass={1} restitution={1}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.5, 0.5, 1.5]} />
            <meshStandardMaterial color="#ffffff" />
            <Edges />
          </mesh>
        </RigidBody>

        {/* wheels */}
        {wheels.map((wheel, i) => (
          <React.Fragment key={i}>
            {/* axle */}
            <RigidBody
              ref={axleRefs.current[i]}
              position={wheel.axlePosition}
              colliders="cuboid"
            >
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.3, 0.3, 0.3]} />
                <meshStandardMaterial color="#999" />
                <Edges />
              </mesh>
            </RigidBody>

            {/* wheel */}
            <RigidBody
              ref={wheelRefs.current[i]}
              position={wheel.wheelPosition}
              colliders={false}
            >
              <mesh rotation-x={-Math.PI / 2} castShadow receiveShadow>
                <cylinderGeometry args={[0.251, 0.251, 0.241, 16]} />
                <meshStandardMaterial color="#666" />
                <Edges />
              </mesh>

              <CylinderCollider
                mass={2.5}
                friction={1.5}
                args={[0.125, 0.25]}
                rotation={[-Math.PI / 2, 0, 0]}
              />
            </RigidBody>

            {/* axle to chassis joint */}
            {!wheel.isSteered ? (
              <FixedJoint
                body={chassisRef}
                wheel={axleRefs.current[i]}
                body1Anchor={wheel.axlePosition}
                body1LocalFrame={[0, 0, 0, 1]}
                body2Anchor={[0, 0, 0]}
                body2LocalFrame={[0, 0, 0, 1]}
              />
            ) : (
              <SteeredJoint
                body={chassisRef}
                wheel={axleRefs.current[i]}
                bodyAnchor={wheel.axlePosition}
                wheelAnchor={[0, 0, 0]}
                rotationAxis={[0, 1, 0]}
              />
            )}

            {/* wheel to axle joint */}
            <AxleJoint
              body={axleRefs.current[i]}
              wheel={wheelRefs.current[i]}
              bodyAnchor={[0, 0, wheel.side === "left" ? 0.35 : -0.35]}
              wheelAnchor={[0, 0, 0]}
              rotationAxis={[0, 0, 1]}
              isDriven={wheel.isDriven}
            />
          </React.Fragment>
        ))}
      </group>
    </>
  );
};

const Scene = () => {
  return (
    <>
      <Edges />
      <RigidBody colliders="cuboid" mass={10} position={[0, 5, -50]}>
        <mesh>
          <boxGeometry args={[5, 5, 5]} />
          <meshStandardMaterial color="orange" />
          <Edges />
        </mesh>
      </RigidBody>

      <RigidBody colliders="cuboid" mass={10} position={[0, 5, 50]}>
        <mesh>
          <boxGeometry args={[5, 5, 5]} />
          <meshStandardMaterial color="orange" />
          <Edges />
        </mesh>
      </RigidBody>

      <RigidBody colliders="cuboid" mass={10} position={[-50, 5, 0]}>
        <mesh>
          <boxGeometry args={[5, 5, 5]} />
          <meshStandardMaterial color="orange" />
          <Edges />
        </mesh>
      </RigidBody>

      <RigidBody colliders="cuboid" mass={10} position={[50, 5, 0]}>
        <mesh>
          <boxGeometry args={[5, 5, 5]} />
          <meshStandardMaterial color="orange" />
          <Edges />
        </mesh>
      </RigidBody>

      {/* ground */}
      <Grass />

      {/* lights */}
      <ambientLight intensity={1.5} />
      <pointLight
        intensity={500}
        decay={1.5}
        position={[10, 30, 10]}
        castShadow
        shadow-camera-top={8}
        shadow-camera-right={8}
        shadow-camera-bottom={-8}
        shadow-camera-left={-8}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
      />
    </>
  );
};

export default () => {
  const visible = usePageVisible();

  const { debug } = useControls(`${LEVA_KEY}-debug`, {
    debug: false,
  });

  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    // Check if using a touch control device, show/hide joystick
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      setIsTouchScreen(true);
    } else {
      setIsTouchScreen(false);
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

  return (
    <>
      <KeyboardControls map={CONTROLS_MAP}>
        <Canvas
          shadows
          camera={{
            fov: 65,
            near: 0.01,
            far: 1000,
            position: [90, 50, 30],
          }}
          onPointerDown={(e) => {
            if (e.pointerType === "mouse") {
              (e.target as HTMLCanvasElement).requestPointerLock();
            }
            e.preventDefault;
          }}
        >
          <Physics
            updatePriority={RAPIER_UPDATE_PRIORITY}
            paused={!visible}
            debug={debug}
            maxStabilizationIterations={50}
            maxVelocityFrictionIterations={50}
            maxVelocityIterations={100}
          >
            <RevoluteJointVehicle />
            <Scene />
          </Physics>
        </Canvas>

        {!isTouchScreen && <Interface />}
      </KeyboardControls>
    </>
  );
};
