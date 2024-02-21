// import { Canvas } from '@react-three/fiber'
// import Grass from './Grass'
// import RevoluteCar from "./RevoluteCar";
// import { Leva } from "leva";
import Game from "./Experience";
// import useGame from "./stores/useGame.jsx";
// import { useEffect } from "react";
import { Suspense } from "react";

function App() {
  return (
    <>
      {/* <RevoluteCar /> */}

      <Suspense fallback={null}>
      {/* <Suspense fallback={<Placeholder />}> */}
      <Game />
      {/* <Leva hidden /> */}
      </Suspense>
    </>
  );
}

export default App;
