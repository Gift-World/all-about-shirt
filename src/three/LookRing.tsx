import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { MotionValue } from 'motion/react'
import { photo } from '../lib/img'

export type RingItem = { id: string; label: string; href: string }

const R = 3.3
const PW = 1.5
const PH = 2.0

const vert = /* glsl */ `
  uniform float uVel;
  uniform float uFocus;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.y += sin(uv.x * 3.14159) * uVel * 0.35;
    p.z += uFocus * 0.12;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const frag = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uR;
  uniform float uFocus;
  uniform float uHover;
  uniform float uLoaded;
  varying vec2 vUv;
  float rbox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) - r; }
  void main() {
    vec2 uv = (vUv - 0.5) * uR * (1.0 - uHover * 0.06) + 0.5;
    vec3 col = texture2D(uTex, uv).rgb;
    col = mix(vec3(0.89, 0.86, 0.8), col, uLoaded);
    float g = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(g), col, 0.35 + 0.65 * max(uFocus, uHover));
    col *= 0.62 + 0.38 * max(uFocus, uHover * 0.9);
    vec2 p = (vUv - 0.5) * vec2(${PW.toFixed(2)}, ${PH.toFixed(2)});
    float d = rbox(p, vec2(${(PW / 2).toFixed(3)}, ${(PH / 2).toFixed(3)}), 0.09);
    float a = 1.0 - smoothstep(0.0, 0.006, d);
    gl_FragColor = vec4(col, a);
  }
`

const loader = new THREE.TextureLoader()
loader.setCrossOrigin('anonymous')

function bentGeometry() {
  const g = new THREE.PlaneGeometry(PW, PH, 40, 1)
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const a = x / R
    pos.setX(i, Math.sin(a) * R)
    pos.setZ(i, Math.cos(a) * R - R)
  }
  g.computeVertexNormals()
  return g
}

function Panel({
  item,
  angle,
  ring,
  vel,
  onSelect,
  onHover,
}: {
  item: RingItem
  angle: number
  ring: React.RefObject<THREE.Group | null>
  vel: React.RefObject<number>
  onSelect: (href: string) => void
  onHover: (h: boolean) => void
}) {
  const geo = useMemo(bentGeometry, [])
  const hover = useRef(0)
  const mesh = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.ShaderMaterial>(null)
  const initial = useMemo(
    () => ({
      uTex: { value: new THREE.Texture() },
      uR: { value: new THREE.Vector2(1, 1) },
      uVel: { value: 0 },
      uFocus: { value: 0 },
      uHover: { value: 0 },
      uLoaded: { value: 0 },
    }),
    [],
  )

  const live = () => (mat.current?.uniforms ?? initial) as typeof initial

  useEffect(() => {
    loader.load(photo(item.id, 700, 930), (t) => {
      const uniforms = live()
      t.needsUpdate = true
      t.colorSpace = THREE.NoColorSpace
      t.minFilter = THREE.LinearMipmapLinearFilter
      const img = t.image as HTMLImageElement
      const ta = img.width / img.height
      const pa = PW / PH
      uniforms.uR.value.set(ta > pa ? pa / ta : 1, ta > pa ? 1 : ta / pa)
      uniforms.uTex.value = t
    })
  }, [item.id])

  useFrame((_, dt) => {
    const uniforms = live()
    const world = angle + (ring.current?.rotation.y ?? 0)
    const facing = Math.cos(world)
    uniforms.uFocus.value = THREE.MathUtils.smoothstep(facing, 0.82, 1)
    uniforms.uHover.value = THREE.MathUtils.damp(uniforms.uHover.value, hover.current, 6, dt)
    uniforms.uVel.value = THREE.MathUtils.damp(uniforms.uVel.value, vel.current ?? 0, 5, dt)
    if (uniforms.uTex.value.image) uniforms.uLoaded.value = THREE.MathUtils.damp(uniforms.uLoaded.value, 1, 3, dt)
    const s = 1 + uniforms.uHover.value * 0.05
    mesh.current?.scale.set(s, s, 1)
  })

  return (
    <group rotation={[0, angle, 0]}>
      <mesh
        ref={mesh}
        geometry={geo}
        position={[0, 0, R]}
        onPointerOver={(e) => {
          e.stopPropagation()
          hover.current = 1
          onHover(true)
        }}
        onPointerOut={() => {
          hover.current = 0
          onHover(false)
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(item.href)
        }}
      >
        <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={initial} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Ring({
  items,
  progress,
  drag,
  onFront,
  onSelect,
  onHover,
}: {
  items: RingItem[]
  progress: MotionValue<number>
  drag: React.RefObject<number>
  onFront: (i: number) => void
  onSelect: (href: string) => void
  onHover: (h: boolean) => void
}) {
  const ring = useRef<THREE.Group>(null)
  const vel = useRef(0)
  const last = useRef(0)
  const front = useRef(-1)
  const auto = useRef(0)
  const { viewport } = useThree()
  const step = (Math.PI * 2) / items.length

  useFrame((_, dt) => {
    if (!ring.current) return
    auto.current += dt * 0.05
    const target = -progress.get() * Math.PI * 2 * 0.85 - (drag.current ?? 0) - auto.current
    const y = THREE.MathUtils.damp(ring.current.rotation.y, target, 4, dt)
    vel.current = THREE.MathUtils.clamp((y - last.current) / Math.max(dt, 0.001) * 0.12, -0.6, 0.6)
    last.current = y
    ring.current.rotation.y = y
    // which panel faces the camera
    const idx = (((Math.round(-y / step) % items.length) + items.length) % items.length)
    if (idx !== front.current) {
      front.current = idx
      onFront(idx)
    }
  })

  const s = Math.min(0.9, viewport.width / 7.6)
  return (
    <group scale={s} rotation={[0.06, 0, 0]} position={[0, 0.32, 0]}>
      <group ref={ring}>
        {items.map((it, i) => (
          <Panel key={it.id} item={it} angle={i * step} ring={ring} vel={vel} onSelect={onSelect} onHover={onHover} />
        ))}
      </group>
    </group>
  )
}

export default function LookRing({
  items,
  progress,
  active,
  onFront,
  onSelect,
}: {
  items: RingItem[]
  progress: MotionValue<number>
  active: boolean
  onFront: (i: number) => void
  onSelect: (href: string) => void
}) {
  const drag = useRef(0)
  const down = useRef<number | null>(null)
  const [hover, setHover] = useState(false)

  return (
    <div
      className="h-full w-full"
      style={{ cursor: hover ? 'pointer' : down.current !== null ? 'grabbing' : 'grab', touchAction: 'pan-y' }}
      onPointerDown={(e) => (down.current = e.clientX)}
      onPointerMove={(e) => {
        if (down.current === null) return
        drag.current -= (e.clientX - down.current) * 0.006
        down.current = e.clientX
      }}
      onPointerUp={() => (down.current = null)}
      onPointerLeave={() => (down.current = null)}
    >
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 1.8]}
        camera={{ position: [0, 0.35, R + 5.4], fov: 34 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Ring items={items} progress={progress} drag={drag} onFront={onFront} onSelect={onSelect} onHover={setHover} />
      </Canvas>
    </div>
  )
}
