import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import styles from './HeroCanvas.module.css'

/* ── SHADERS ──────────────────────────────────────────── */

const FLUID_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const FLUID_FRAG = `
uniform float uTime;
uniform vec2  uMouse;
varying vec2  vUv;
float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)),f.x),f.y);
}
void main() {
  vec2 uv = vUv;
  vec2 m  = uMouse * 0.5 + 0.5;
  float d = length(uv - m);
  uv += normalize(uv - m + 0.001) * smoothstep(0.45, 0.0, d) * 0.05;
  float n = noise(uv * 3.5 + vec2(uTime*.10, uTime*.07)) * 0.65
          + noise(uv * 7.0 - vec2(uTime*.08, uTime*.12)) * 0.35;
  vec3 c1 = vec3(0.980, 0.976, 0.969);
  vec3 c2 = vec3(0.929, 0.894, 0.847);
  gl_FragColor = vec4(mix(c1, c2, n * 0.75), 1.0);
}`

const PART_VERT = `
attribute float aSize;
attribute float aOpacity;
attribute float aSpeed;
uniform vec2  uMouse;
uniform float uTime;
varying float vOpacity;
void main() {
  vOpacity = aOpacity;
  vec3 pos = position;
  pos.y = mod(position.y + uTime * aSpeed, 2.2) - 1.1;
  vec2 delta = pos.xy - uMouse;
  float dist = length(delta);
  pos.xy += normalize(delta + 0.001) * smoothstep(0.28, 0.0, dist) * 0.18;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aSize * (280.0 / -mv.z);
  gl_Position  = projectionMatrix * mv;
}`

const PART_FRAG = `
varying float vOpacity;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  gl_FragColor = vec4(0.482, 0.239, 0.114, (1.0 - r * 2.0) * vOpacity);
}`

/* ── COMPONENT ────────────────────────────────────────── */

export default function HeroCanvas() {
  const mountRef = useRef(null)
  const mouseRef = useRef(new THREE.Vector2(0, 0))

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(el.clientWidth, el.clientHeight)
    el.appendChild(renderer.domElement)

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.position.z = 1
    const scene = new THREE.Scene()

    // Fluid background
    const fluidU = { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(0, 0) } }
    scene.add(new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: FLUID_VERT, fragmentShader: FLUID_FRAG, uniforms: fluidU })
    ))

    // Particles
    const COUNT = el.clientWidth < 768 ? 35 : 65
    const pos = new Float32Array(COUNT * 3)
    const siz = new Float32Array(COUNT)
    const opa = new Float32Array(COUNT)
    const spd = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 2
      pos[i*3+1] = (Math.random() - 0.5) * 2.2
      pos[i*3+2] = 0.01
      siz[i] = Math.random() * 3 + 1.2
      opa[i] = Math.random() * 0.28 + 0.06
      spd[i] = Math.random() * 0.03 + 0.02
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSize',    new THREE.BufferAttribute(siz, 1))
    geo.setAttribute('aOpacity', new THREE.BufferAttribute(opa, 1))
    geo.setAttribute('aSpeed',   new THREE.BufferAttribute(spd, 1))
    const partU = { uMouse: { value: new THREE.Vector2(0, 0) }, uTime: { value: 0 } }
    scene.add(new THREE.Points(geo,
      new THREE.ShaderMaterial({ vertexShader: PART_VERT, fragmentShader: PART_FRAG, uniforms: partU, transparent: true, depthWrite: false })
    ))

    // Loop
    const clock = new THREE.Clock()
    let rafId
    const tick = () => {
      rafId = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()
      fluidU.uTime.value = t
      partU.uTime.value  = t
      fluidU.uMouse.value.lerp(mouseRef.current, 0.04)
      partU.uMouse.value.lerp(mouseRef.current, 0.07)
      renderer.render(scene, camera)
    }
    tick()

    const ro = new ResizeObserver(() => renderer.setSize(el.clientWidth, el.clientHeight))
    ro.observe(el)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      geo.dispose()
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  const onMove = useCallback((e) => {
    const t    = e.touches?.[0] ?? e
    const rect = mountRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseRef.current.set(
      ((t.clientX - rect.left) / rect.width)  * 2 - 1,
      -(((t.clientY - rect.top)  / rect.height) * 2 - 1)
    )
  }, [])

  return <div ref={mountRef} className={styles.root} onMouseMove={onMove} onTouchMove={onMove} />
}
