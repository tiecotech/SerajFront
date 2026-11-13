"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SCENE_ACTIVE_EVENT, sceneState as S } from "../_lib/state";

const AMBER = new THREE.Color("#ffb45e"); // ≈ 2700–3000K
const BG = { night: "#120f0d", day: "#ffffff" };
const DAY_GLOW = new THREE.Color("#f3ae62"); // the same warm light, as a tint on white instead of an additive glow
type Theme = "day" | "night";
const FOV = 35;
const CAM_Z = 6.5;
const PIVOT_Y = 3.4; // ceiling anchor, above the frame
const DROP = 2.9; // pivot → centre of the globe

const lerp = THREE.MathUtils.lerp;
const smooth = THREE.MathUtils.smoothstep;

const CONE_VERT = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const CONE_FRAG = /* glsl */ `
  uniform vec3 uColor; uniform float uIntensity; uniform float uDay;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() {
    float h = vUv.y;                                   // 1 at the apex, 0 at the base
    float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6); // soft silhouette
    float a = pow(h, 1.7) * edge * smoothstep(0.0, 0.22, h) * uIntensity * 0.75;
    gl_FragColor = mix(vec4(uColor * a, a), vec4(uColor, min(a, 0.85)), uDay);
  }`;

const DISC_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const DISC_FRAG = /* glsl */ `
  uniform vec3 uColor; uniform float uIntensity; uniform float uDay; uniform float uFalloff;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5)) * 2.0;
    float a = exp(-d * d * uFalloff) * smoothstep(1.0, 0.55, d) * uIntensity;
    gl_FragColor = mix(vec4(uColor * a, a), vec4(uColor, min(a, 0.85)), uDay);
  }`;

/** Day glass: a fine bronze rim that fades to clear, so the globe reads as drawn glass on white paper. */
const RIM_FRAG = /* glsl */ `
  uniform vec3 uColor; uniform float uWarm;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() {
    float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
    float rim = pow(f, 3.2) * 0.75 + pow(f, 14.0) * 0.25;
    vec3 warm = vec3(0.96, 0.66, 0.30);
    float fill = uWarm * 0.16 * (1.0 - f);              // the globe fills with warm light as it is switched on
    gl_FragColor = vec4(mix(uColor, warm, clamp(fill * 3.0, 0.0, 1.0) * (1.0 - rim)), rim + fill);
  }`;

function lightMaterial(day: boolean, vertexShader: string, fragmentShader: string, extra: Record<string, THREE.IUniform> = {}) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { uColor: { value: (day ? DAY_GLOW : AMBER).clone() }, uIntensity: { value: 0 }, uDay: { value: day ? 1 : 0 }, ...extra },
    transparent: true,
    depthWrite: false,
    blending: day ? THREE.NormalBlending : THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

function Lamp({ lite, day }: { lite: boolean; day: boolean }) {
  const pivot = useRef<THREE.Group>(null);
  const bulb = useRef<THREE.MeshBasicMaterial>(null);
  const glass = useRef<THREE.MeshPhysicalMaterial>(null);
  const brass = useRef<THREE.MeshStandardMaterial>(null);
  const point = useRef<THREE.PointLight>(null);
  const pool = useRef<THREE.Mesh>(null);
  const swing = useRef({ a: 0, v: 0 });
  const { camera, scene, size } = useThree();

  const cone = useMemo(() => lightMaterial(day, CONE_VERT, CONE_FRAG), [day]);
  const glow = useMemo(() => lightMaterial(day, DISC_VERT, DISC_FRAG, { uFalloff: { value: 5.5 } }), [day]);
  const floor = useMemo(() => lightMaterial(day, DISC_VERT, DISC_FRAG, { uFalloff: { value: 2.6 } }), [day]);
  const dust = useMemo(() => {
    const n = lite ? 24 : 70;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const y = -Math.random() * 2.3; // inside the cone, below the globe
      const r = Math.random() * (0.15 + (-y / 2.3) * 1.2);
      const t = Math.random() * Math.PI * 2;
      pos.set([Math.cos(t) * r, y, Math.sin(t) * r], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [lite]);
  const rim = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: CONE_VERT,
    fragmentShader: RIM_FRAG,
    uniforms: { uColor: { value: new THREE.Color("#8a6a4f") }, uWarm: { value: 0 } },
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  }), []);
  const dustMat = useRef<THREE.PointsMaterial>(null);
  const dustGroup = useRef<THREE.Group>(null);

  useEffect(() => () => { cone.dispose(); glow.dispose(); floor.dispose(); dust.dispose(); rim.dispose(); }, [cone, glow, floor, dust, rim]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const aspect = size.width / size.height;
    const wide = aspect > 1.05;
    const halfW = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM_Z * aspect;

    // --- light levels ---
    let L = S.intro * 0.1 + S.hero * 0.9;
    L *= 1 - 0.72 * S.mid;
    L = lerp(L, 0.9, S.end);
    const beam = smooth(S.hero, 0.18, 0.95) * (1 - S.mid) * (1 - S.end);

    // --- pendulum: a soft spring towards the pointer, plus a breath of idle sway ---
    const target = S.px * 0.055 + Math.sin(state.clock.elapsedTime * 0.5) * 0.008;
    const sw = swing.current;
    sw.v += ((target - sw.a) * 7 - sw.v * 1.7) * dt;
    sw.a += sw.v * dt;

    const x = (wide ? -halfW * 0.56 : 0) * (1 - S.end);
    const lift = S.mid * 4.6 * (1 - S.end) + (wide ? 0 : 0.55);
    if (pivot.current) {
      pivot.current.position.set(x, PIVOT_Y + lift, 0);
      pivot.current.rotation.z = sw.a;
    }
    if (pool.current) pool.current.position.x = x;

    // --- materials ---
    rim.uniforms.uWarm.value = L;
    if (day) bulb.current?.color.set("#e4d6c0").lerp(AMBER, Math.min(1, L * 1.4)); // on white the filament warms up instead of blowing out
    else bulb.current?.color.copy(AMBER).multiplyScalar(0.22 + L * 5.2);
    if (glass.current) glass.current.emissiveIntensity = L * (day ? 0.08 : 0.22);
    if (brass.current) brass.current.opacity = 1 - S.end;
    if (point.current) point.current.intensity = L * 9;
    cone.uniforms.uIntensity.value = beam * (day ? 0.32 : 1);
    glow.uniforms.uIntensity.value = Math.pow(L, 1.4) * (day ? 0.32 : 0.62);
    floor.uniforms.uIntensity.value = beam * (day ? 0.2 : 0.34);
    if (dustMat.current) dustMat.current.opacity = day ? 0 : beam * 0.5;
    if (dustGroup.current) dustGroup.current.rotation.y += dt * 0.04;
    scene.environmentIntensity = day ? 0.9 : 0.1 + L * 0.5;

    // --- camera: slow pull-back through the philosophy, far away for the closing point of light ---
    const z = CAM_Z + S.away * 3.6 + S.end * 12;
    camera.position.set(S.px * 0.12 * (1 - S.end), 0.35 + S.away * 0.5 + S.py * -0.05, z);
    camera.lookAt(0, 0.15 - S.end * 1.5, 0); // the closing point of light sits behind the headline
  });

  return (
    <>
      <group ref={pivot} position={[0, PIVOT_Y, 0]}>
        {/* brass stem + collar */}
        <mesh position={[0, -(DROP - 0.42) / 2, 0]}>
          <cylinderGeometry args={[0.011, 0.011, DROP - 0.42, 12]} />
          <meshStandardMaterial ref={brass} color="#b8956f" metalness={1} roughness={0.26} transparent />
        </mesh>
        <mesh position={[0, -(DROP - 0.44), 0]}>
          <cylinderGeometry args={[0.03, 0.075, 0.13, 32]} />
          <meshStandardMaterial color="#b8956f" metalness={1} roughness={0.3} />
        </mesh>

        <group position={[0, -DROP, 0]}>
          {/* glass globe */}
          <mesh>
            <sphereGeometry args={[0.42, lite ? 32 : 64, lite ? 32 : 64]} />
            {day ? (
              <primitive object={rim} attach="material" />
            ) : lite ? (
              <meshPhysicalMaterial ref={glass} color="#fff4e2" roughness={0.1} metalness={0} transparent opacity={0.16} emissive={AMBER} emissiveIntensity={0} depthWrite={false} />
            ) : (
              <meshPhysicalMaterial
                ref={glass}
                color={day ? "#f3e7d6" : "#fff6ea"}
                transmission={1}
                thickness={0.55}
                roughness={0.05}
                ior={1.46}
                clearcoat={1}
                clearcoatRoughness={0.08}
                attenuationColor="#ffcf99"
                attenuationDistance={day ? 0.75 : 2.4}
                emissive={AMBER}
                emissiveIntensity={0}
              />
            )}
          </mesh>
          {/* filament */}
          <mesh>
            <sphereGeometry args={[0.075, 24, 24]} />
            <meshBasicMaterial ref={bulb} color={AMBER} toneMapped={false} />
          </mesh>
          <pointLight ref={point} color={AMBER} intensity={0} distance={9} decay={1.6} />
          {/* halo */}
          <mesh material={glow} renderOrder={3}>
            <planeGeometry args={[4.2, 4.2]} />
          </mesh>
          {/* volumetric cone: apex inside the globe, opening towards the floor */}
          <mesh material={cone} position={[0, -1.25, 0]} renderOrder={2}>
            <coneGeometry args={[1.5, 2.6, 48, 1, true]} />
          </mesh>
          <group ref={dustGroup} position={[0, -0.2, 0]}>
            <points geometry={dust}>
              <pointsMaterial ref={dustMat} color="#ffd9a8" size={0.016} sizeAttenuation transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
            </points>
          </group>
        </group>
      </group>

      {/* pool of light on the floor */}
      <mesh ref={pool} material={floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.02, 0]} renderOrder={1}>
        <circleGeometry args={[3.4, 48]} />
      </mesh>
    </>
  );
}

export default function Scene({ onReady, theme = "night" }: { onReady?: () => void; theme?: Theme }) {
  const day = theme === "day";
  const [active, setActive] = useState(true);
  const [lite] = useState(() => window.matchMedia("(max-width: 899px), (pointer: coarse)").matches);

  // Stop rendering whenever the stage is covered by opaque sections or the tab is hidden.
  useEffect(() => {
    let inZone = true;
    const sync = () => setActive(inZone && document.visibilityState === "visible");
    const onZone = (e: Event) => { inZone = (e as CustomEvent<boolean>).detail; sync(); };
    window.addEventListener(SCENE_ACTIVE_EVENT, onZone);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener(SCENE_ACTIVE_EVENT, onZone);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, lite ? 1.25 : 1.5]}
      camera={{ fov: FOV, near: 0.1, far: 60, position: [0, 0.35, CAM_Z] }}
      flat={day}
      gl={{ antialias: lite || day, alpha: false, powerPreference: "high-performance", stencil: false }}
      onCreated={() => onReady?.()}
    >
      <color attach="background" args={[BG[theme]]} />
      <Lamp lite={lite} day={day} />
      {/* procedural reflections only: no HDR download, no extra real lights */}
      <Environment resolution={64} frames={1} background={false}>
        <Lightformer form="rect" intensity={2.2} color="#ffd9a8" position={[4, 2, 3]} scale={[1.2, 6, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#fff1dc" position={[-5, 0, 2]} scale={[1, 5, 1]} />
        <Lightformer form="circle" intensity={0.8} color="#ffcf99" position={[0, -4, 1]} scale={3} />
      </Environment>
      {!lite && !day && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.62} luminanceThreshold={0.7} luminanceSmoothing={0.25} radius={0.72} />
          <Noise premultiply={false} blendFunction={BlendFunction.SCREEN} opacity={0.035} />
          <Vignette offset={0.28} darkness={0.72} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
