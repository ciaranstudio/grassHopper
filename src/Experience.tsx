import {
  OrbitControls,
  Sky,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Physics, useBeforePhysicsStep } from "@react-three/rapier";
import { Leva, useControls as useLeva } from "leva";
import { Suspense, useState, useEffect, useRef } from "react";
import styled from "styled-components";
import {
  Quaternion,
  Vector3,
} from "three";
import { Canvas } from "./canvas";
import { usePageVisible } from "./use-page-visible";
import { useLoadingAssets } from "./use-loading-assets";
import Grass from "./Grass";
import { Vehicle, VehicleRef } from "./vehicle";
import {
  AFTER_RAPIER_UPDATE,
  LEVA_KEY,
  RAPIER_UPDATE_PRIORITY,
} from "./constants";
import { SpeedTextTunnel } from "./speed-text-tunnel";
import Interface from "./Interface";
import useGame from "./stores/useGame";
import { useProgress } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";

const Text = styled.div`
  width: 100%;
  text-align: center;
  font-size: 2em;
  color: white;
  font-family: monospace;
  text-shadow: 2px 2px black;
`;

// const ControlsText = styled(Text)`
//   position: absolute;
//   bottom: 4em;
//   left: 0;
// `;

const SpeedText = styled(Text)`
  position: absolute;
  bottom: 2em;
  left: 0;
  font-size: 1em;
`;

const cameraIdealOffset = new Vector3();
const cameraIdealLookAt = new Vector3();
const chassisTranslation = new Vector3();
const chassisRotation = new Quaternion();

const Scene = () => {
  const loadingBarElement = document.querySelector<HTMLElement>(".loading-bar");
  const { 
    // active, 
    progress, 
    // errors, 
    // item, 
    // loaded, 
    // total 
  } = useProgress();
  const overlayOpacity = { value: 1 };
  const [overlayAlpha, setOverlayAlpha] = useState(1);
  const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
  const overlayMaterial = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uAlpha: { value: overlayAlpha },
    },
    vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uAlpha;

        void main()
        {
            gl_FragColor = vec4(0.153, 0.153, 0.102, uAlpha);
        }
    `,
  });

  useEffect(() => {
    loadingBarElement!.style.transform = `scaleX(${progress / 100})`;
    if (progress == 100) {
      window.setTimeout(() => {
        // animate overlay
        gsap.to(overlayOpacity, {
          duration: 6,
          value: 0,
          delay: 1,
          onUpdate: () => {
            setOverlayAlpha(overlayOpacity.value);
          },
          // onComplete: () => {
          //   // set show interface to true
          // },
        });
        // update loadingBarElement
        loadingBarElement!.classList.add("ended");
        loadingBarElement!.style.transform = "";
      }, 500);
    }
    console.log(overlayGeometry);
  }, [progress]);


  const raycastVehicle = useRef<VehicleRef>(null);
  const currentSpeedTextDiv = useRef<HTMLDivElement>(null);
  const camera = useThree((state) => state.camera);
  const currentCameraPosition = useRef(new Vector3(15, 15, 0));
  const currentCameraLookAt = useRef(new Vector3());
  const dirLight: any = useRef();

  const { cameraMode } = useLeva(`${LEVA_KEY}-camera`, {
    cameraMode: {
      value: "drive",
      options: ["drive", "orbit"],
    },
  });

  const { maxForce, maxSteer, maxBrake } = useLeva(`${LEVA_KEY}-controls`, {
    maxForce: 45, // was 30 originally
    maxSteer: 10, //  was 10 originally
    maxBrake: 1, //  was 2 originally
  });

  const gasToggle = useGame((state: any) => state.gasOn);
  const reverseToggle = useGame((state: any) => state.reverseOn);
  const brakeToggle = useGame((state: any) => state.brakeOn);
  const leftToggle = useGame((state: any) => state.leftOn);
  const rightToggle = useGame((state: any) => state.rightOn);
  const jumpToggle = useGame((state: any) => state.jumpOn);

  useBeforePhysicsStep((world) => {
    if (
      !raycastVehicle.current ||
      !raycastVehicle.current.rapierRaycastVehicle.current
    ) {
      return;
    }

    const {
      wheels,
      rapierRaycastVehicle: { current: vehicle },
      setBraking,
    } = raycastVehicle.current;

    // update wheels from controls
    let engineForce = 0;
    let steering = 0;

    if (gasToggle) {
      engineForce += maxForce;
    }
    if (reverseToggle) {
      engineForce -= maxForce;
    }

    if (leftToggle) {
      steering += maxSteer;
    }
    if (rightToggle) {
      steering -= maxSteer;
    }
    if (jumpToggle) {
      // const { x, y, z } =
      //   raycastVehicle.current.rapierRaycastVehicle.current.chassisRigidBody.translation();
      // console.log("x: ", x, "y: ", y, "z: ", z);
      // raycastVehicle.current.rapierRaycastVehicle.current.chassisRigidBody.setTranslation(
      //   { x: x, y: y + 0.15, z: z },
      //   true
      // );
      // console.log(
      //   raycastVehicle.current.rapierRaycastVehicle.current.chassisRigidBody
      // );
      raycastVehicle.current.rapierRaycastVehicle.current.chassisRigidBody.applyImpulse(
        { x: 0, y: 10, z: 0 },
        true
      );
      raycastVehicle.current.rapierRaycastVehicle.current.chassisRigidBody.applyTorqueImpulse(
        { x: 20, y: 0, z: 10 },
        true
      );
      // raycastVehicle.current.rapierRaycastVehicle.current.chassisRigidBody.setAdditionalMass();
    }

    const brakeForce = brakeToggle ? maxBrake : 0;

    for (let i = 0; i < vehicle.wheels.length; i++) {
      vehicle.setBrakeValue(brakeForce, i);
    }

    // steer front wheels
    vehicle.setSteeringValue(steering, 0);
    vehicle.setSteeringValue(steering, 1);

    // apply engine force to back wheels
    vehicle.applyEngineForce(engineForce, 2);
    vehicle.applyEngineForce(engineForce, 3);

    // update the vehicle
    vehicle.update(world.timestep);

    // update the wheels
    for (let i = 0; i < vehicle.wheels.length; i++) {
      const wheelObject = wheels[i].object.current;
      if (!wheelObject) continue;

      const wheelState = vehicle.wheels[i].state;
      wheelObject.position.copy(wheelState.worldTransform.position);
      wheelObject.quaternion.copy(wheelState.worldTransform.quaternion);
    }

    // update speed text
    if (currentSpeedTextDiv.current) {
      const km = Math.abs(vehicle.state.currentVehicleSpeedKmHour).toFixed();
      currentSpeedTextDiv.current.innerText = `${km} km/h`;
    }

    // update brake lights
    setBraking(brakeForce > 0, reverseToggle, gasToggle);
  });

  useFrame((_, delta) => {
    if (cameraMode !== "drive") return;

    const chassis = raycastVehicle.current?.chassisRigidBody;
    if (!chassis?.current) return;

    chassisRotation.copy(chassis.current.rotation() as Quaternion);
    chassisTranslation.copy(chassis.current.translation() as Vector3);

    const t = 1.0 - Math.pow(0.01, delta);

    cameraIdealOffset.set(-10, 3, 0);
    cameraIdealOffset.applyQuaternion(chassisRotation);
    cameraIdealOffset.add(chassisTranslation);

    if (cameraIdealOffset.y < 0) {
      cameraIdealOffset.y = 0.5;
    }

    cameraIdealLookAt.set(0, 1, 0);
    cameraIdealLookAt.applyQuaternion(chassisRotation);
    cameraIdealLookAt.add(chassisTranslation);

    currentCameraPosition.current.lerp(cameraIdealOffset, t);
    currentCameraLookAt.current.lerp(cameraIdealLookAt, t);

    camera.position.copy(currentCameraPosition.current);
    camera.lookAt(currentCameraLookAt.current);
  }, AFTER_RAPIER_UPDATE);

  return (
    <>
     <mesh geometry={overlayGeometry} material={overlayMaterial}></mesh>
      <SpeedTextTunnel.In>
        <SpeedText ref={currentSpeedTextDiv} />
      </SpeedTextTunnel.In>

      {/* raycast vehicle */}
      <Vehicle
        ref={raycastVehicle}
        position={[0, 4, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      />

      {/* boxes */}
      {/* {Array.from({ length: 6 }).map((_, idx) => (
        <RigidBody key={idx} colliders="cuboid" mass={0.2}>
          <mesh position={[0, 2 + idx * 2.5, 70]}>
            <boxGeometry args={[2, 1, 2]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        </RigidBody>
      ))} */}

      <Grass />
      <Sky distance={3500} sunPosition={[50, 30, 50]} rayleigh={0.3} />

      <ambientLight intensity={0.25} />
      <directionalLight
        ref={dirLight}
        castShadow
        position={[50, 30, 50]}
        intensity={5}
        target-position={[0, 0, 0]}
        // target={raycastVehicle.current}
      />

      {cameraMode === "orbit" && <OrbitControls />}
    </>
  );
};

export default () => {
  const loading = useLoadingAssets();
  const visible = usePageVisible();

  const { debug } = useLeva(`${LEVA_KEY}-physics`, {
    debug: false,
  });

  const [showControls, setShowControls] = useState(false)
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

  useEffect(()=>{
    if (!loading) {
      window.setTimeout(() => {
        setShowControls(true)
      }, 1750);
    }
  }, [loading])

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

        <Physics
          gravity={[0, -9.81, 0]}
          updatePriority={RAPIER_UPDATE_PRIORITY}
          // todo: support fixed timestepping
          // right now if timeStep is not "vary", the wheel positions will be incorrect and will visually jitter
          // timeStep={1 / 60} // originally set to "vary"
          // erp={0.25} // just trying out erp customizations
          // joint-erp={0.25} // ^
          paused={!visible || loading}
          debug={debug}
        > 
          <Scene />
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
