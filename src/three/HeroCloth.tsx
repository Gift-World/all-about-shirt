import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { photo } from '../lib/img'

/* ──────────────────────────────────────────────────────────────
   A campaign photograph printed on a hanging length of linen.
   Vertex shader: wind, gravity and a cursor bulge; normals from
   finite differences so the folds catch real light.
   Fragment shader: cover fit, woven texture, a noisy wipe between
   photographs, soft sheen and fold shadows.
   ────────────────────────────────────────────────────────────── */

const W = 2.3
const H = 2.95

const vert = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uGust;
  varying vec2 vUv;
  varying vec3 vN;
  varying float vZ;

  float disp(vec2 p, vec2 uv) {
    float hang = pow(1.0 - uv.y, 1.35);
    float g = 1.0 + uGust;
    float w = sin(p.x * 2.4 + uTime * 1.25 + p.y * 0.9) * 0.13 * g
            + sin(p.y * 3.3 - uTime * 0.95 + p.x * 1.6) * 0.08 * g
            + sin(p.x * 6.5 + p.y * 4.5 + uTime * 2.1) * 0.014;
    float d = distance(uv, uMouse);
    float bulge = exp(-d * d * 26.0) * 0.34 * uHover;
    return (w + bulge) * hang;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    vec2 res = vec2(${W.toFixed(2)}, ${H.toFixed(2)});
    float e = 0.012;
    float z  = disp(pos.xy, uv);
    float zx = disp(pos.xy + vec2(e, 0.0), uv + vec2(e / res.x, 0.0));
    float zy = disp(pos.xy + vec2(0.0, e), uv + vec2(0.0, e / res.y));
    vec3 n = normalize(vec3(-(zx - z) / e, -(zy - z) / e, 1.0));
    float hang = pow(1.0 - uv.y, 1.35);
    pos.z += z;
    pos.x += sin(uTime * 0.7 + pos.y * 1.3) * 0.035 * hang;
    pos.y -= abs(z) * 0.06;
    vN = normalize(normalMatrix * n);
    vZ = z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const frag = /* glsl */ `
  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform sampler2D uWeave;
  uniform vec2 uRa;
  uniform vec2 uRb;
  uniform float uMix;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vN;
  varying float vZ;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  vec2 cover(vec2 uv, vec2 r) { return (uv - 0.5) * r + 0.5; }

  void main() {
    float n = noise(vUv * 6.0 + uTime * 0.15) * 0.6 + noise(vUv * 18.0) * 0.4;
    float wobble = sin(uMix * 3.14159) * 0.035;
    vec2 ua = cover(vUv, uRa) + (n - 0.5) * wobble;
    vec2 ub = cover(vUv, uRb) - (n - 0.5) * wobble;
    float edge = vUv.x * 0.35 + (1.0 - vUv.y) * 0.4 + n * 0.25;
    float m = 1.0 - smoothstep(uMix * 1.3 - 0.22, uMix * 1.3 - 0.04, edge);
    vec3 col = mix(texture2D(uA, ua).rgb, texture2D(uB, ub).rgb, m);

    // light on the folds
    vec3 L = normalize(vec3(-0.55, 0.55, 0.85));
    float diff = dot(normalize(vN), L);
    col *= 0.8 + 0.32 * diff;
    col += pow(max(diff, 0.0), 10.0) * 0.07;
    col *= 1.0 - clamp(-vZ * 0.9, 0.0, 0.18);

    // woven linen texture
    float wv = texture2D(uWeave, vUv * vec2(7.0, 9.0)).r;
    col *= mix(1.0, wv * 1.14, 0.42);

    if (!gl_FrontFacing) col = mix(col, vec3(0.86, 0.82, 0.75), 0.75) * 0.82;
    gl_FragColor = vec4(col, 1.0);
  }
`

function weaveTexture() {
  const s = 256
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  g.fillStyle = '#fff'
  g.fillRect(0, 0, s, s)
  const r = (a: number, b: number) => a + Math.random() * (b - a)
  for (let i = 0; i < s; i += 2) {
    g.fillStyle = `rgba(0,0,0,${r(0.04, 0.14)})`
    g.fillRect(0, i, s, r(0.6, 1.3))
    g.fillStyle = `rgba(0,0,0,${r(0.04, 0.12)})`
    g.fillRect(i, 0, r(0.6, 1.3), s)
  }
  for (let i = 0; i < 140; i++) {
    g.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${r(0.06, 0.18)})`
    if (Math.random() > 0.5) g.fillRect(r(0, s), r(0, s), r(14, 60), r(1, 2))
    else g.fillRect(r(0, s), r(0, s), r(1, 2), r(14, 60))
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

const loader = new THREE.TextureLoader()
loader.setCrossOrigin('anonymous')
const cache = new Map<string, Promise<THREE.Texture>>()
function load(id: string, q: 'lo' | 'hi' = 'hi') {
  const key = `${id}:${q}`
  if (!cache.has(key)) {
    cache.set(
      key,
      new Promise((res, rej) =>
        loader.load(
          q === 'hi' ? photo(id, 1100, 1400) : photo(id, 440, 560),
          (t) => {
            t.colorSpace = THREE.NoColorSpace
            t.minFilter = THREE.LinearMipmapLinearFilter
            t.anisotropy = 8
            t.needsUpdate = true
            res(t)
          },
          undefined,
          rej,
        ),
      ),
    )
  }
  return cache.get(key)!
}
const ratio = (t: THREE.Texture) => {
  const img = t.image as HTMLImageElement
  const ta = img.width / img.height
  const pa = W / H
  return ta > pa ? new THREE.Vector2(pa / ta, 1) : new THREE.Vector2(1, ta / pa)
}

function Banner({ image, onReady }: { image: string; onReady?: () => void }) {
  const { viewport } = useThree()
  const group = useRef<THREE.Group>(null)
  const hoverTarget = useRef(0)
  const mouseTarget = useRef(new THREE.Vector2(0.5, 0.5))
  const current = useRef<string | null>(null)
  const anim = useRef<{ from: number } | null>(null)
  const geo = useMemo(() => new THREE.PlaneGeometry(W, H, 110, 140), [])
  const mat = useRef<THREE.ShaderMaterial>(null)
  const initial = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 },
      uGust: { value: 0 },
      uA: { value: new THREE.Texture() },
      uB: { value: new THREE.Texture() },
      uRa: { value: new THREE.Vector2(1, 1) },
      uRb: { value: new THREE.Vector2(1, 1) },
      uMix: { value: 0 },
      uWeave: { value: weaveTexture() },
    }),
    [],
  )

  // always talk to the uniforms the material actually holds
  const U = () => (mat.current?.uniforms ?? initial) as typeof initial

  useEffect(() => {
    let alive = true
    // First paint: show a light texture fast, then swap in the sharp one in place.
    if (!current.current) {
      const first = image
      load(first, 'lo').then((t) => {
        if (!alive || current.current) return
        const uniforms = U()
        uniforms.uA.value = t
        uniforms.uRa.value = ratio(t)
        current.current = first
        onReady?.()
        load(first, 'hi').then((hi) => {
          const u = U()
          if (current.current === first && !anim.current && u.uA.value === t) u.uA.value = hi
        })
      })
      return () => {
        alive = false
      }
    }
    load(image).then((t) => {
      if (!alive) return
      const uniforms = U()
      if (current.current === image) return
      // finish any running wipe instantly, then start a new one
      if (anim.current) {
        uniforms.uA.value = uniforms.uB.value
        uniforms.uRa.value = uniforms.uRb.value
      }
      uniforms.uB.value = t
      uniforms.uRb.value = ratio(t)
      uniforms.uMix.value = 0
      anim.current = { from: performance.now() }
      uniforms.uGust.value = 0.9
      current.current = image
    })
    return () => {
      alive = false
    }
  }, [image, onReady])

  useFrame((state, dt) => {
    const u = U()
    u.uTime.value = state.clock.elapsedTime
    u.uHover.value = THREE.MathUtils.damp(u.uHover.value, hoverTarget.current, 4, dt)
    u.uMouse.value.lerp(mouseTarget.current, 0.12)
    u.uGust.value = THREE.MathUtils.damp(u.uGust.value, 0, 1.6, dt)
    if (anim.current) {
      const t = Math.min(1, (performance.now() - anim.current.from) / 1500)
      u.uMix.value = 1 - Math.pow(1 - t, 3)
      if (t >= 1) {
        u.uA.value = u.uB.value
        u.uRa.value = u.uRb.value
        u.uMix.value = 0
        anim.current = null
      }
    }
    if (group.current) {
      const p = state.pointer
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, p.x * 0.22, 3, dt)
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -p.y * 0.06, 3, dt)
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.03
    }
  })

  const s = Math.min(1, viewport.width / 3.15, viewport.height / 3.55)

  return (
    <group ref={group} scale={s}>
      <mesh position={[0, H / 2 + 0.05, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.032, 0.032, W + 0.42, 32]} />
        <meshStandardMaterial color="#a8834e" metalness={0.9} roughness={0.25} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * (W / 2 + 0.21), H / 2 + 0.05, 0.02]}>
          <sphereGeometry args={[0.058, 32, 32]} />
          <meshStandardMaterial color="#a8834e" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      <mesh
        geometry={geo}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          if (e.uv) mouseTarget.current.copy(e.uv)
          hoverTarget.current = 1
        }}
        onPointerLeave={() => (hoverTarget.current = 0)}
      >
        <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={initial} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export default function HeroCloth({ image, active = true, onReady }: { image: string; active?: boolean; onReady?: () => void }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.8]}
      camera={{ position: [0, 0.05, 4.6], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent', touchAction: 'pan-y' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[-3, 4, 4]} intensity={2.2} />
      <pointLight position={[2, 2, 2]} intensity={6} color="#ffe2b8" />
      <Banner image={image} onReady={onReady} />
    </Canvas>
  )
}

/** Warm the texture cache so later wipes are instant. */
export function preloadHero(ids: string[]) {
  ids.forEach((id) => load(id).catch(() => undefined))
}
