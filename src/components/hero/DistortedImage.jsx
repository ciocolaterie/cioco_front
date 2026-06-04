import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import styles from './DistortedImage.module.css'

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const FRAG = `
uniform sampler2D uTex;
uniform vec2  uMouse;
uniform float uTime;
uniform float uStrength;
varying vec2  vUv;
void main() {
  vec2 uv = vUv;
  uv.x += sin(uv.y * 10.0 + uTime * 0.6) * 0.0025;
  uv.y += cos(uv.x *  8.0 + uTime * 0.5) * 0.0020;
  vec2  toMouse = uMouse - uv;
  float dist    = length(toMouse);
  float ripple  = sin(dist * 20.0 - uTime * 5.0) * 0.014 * uStrength;
  uv += normalize(toMouse + 0.0001) * ripple * smoothstep(0.55, 0.0, dist);
  gl_FragColor = texture2D(uTex, clamp(uv, 0.001, 0.999));
}`

export default function DistortedImage() {
  const mountRef    = useRef(null)
  const mouseRef    = useRef(new THREE.Vector2(0.5, 0.4))
  const targetStr   = useRef(0)
  const currentStr  = useRef(0)

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

    const uniforms = {
      uTex:      { value: null },
      uMouse:    { value: new THREE.Vector2(0.5, 0.4) },
      uTime:     { value: 0 },
      uStrength: { value: 0 },
    }
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms })
    )
    scene.add(mesh)

    new THREE.TextureLoader().load('/hero.jpg', (tex) => { uniforms.uTex.value = tex })

    const clock = new THREE.Clock()
    let rafId
    const tick = () => {
      rafId = requestAnimationFrame(tick)
      uniforms.uTime.value = clock.getElapsedTime()
      uniforms.uMouse.value.lerp(mouseRef.current, 0.05)
      currentStr.current += (targetStr.current - currentStr.current) * 0.05
      uniforms.uStrength.value = currentStr.current
      renderer.render(scene, camera)
    }
    tick()

    const ro = new ResizeObserver(() => renderer.setSize(el.clientWidth, el.clientHeight))
    ro.observe(el)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      mesh.geometry.dispose()
      mesh.material.dispose()
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  const onMove = useCallback((e) => {
    const t    = e.touches?.[0] ?? e
    const rect = mountRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseRef.current.set(
      (t.clientX - rect.left) / rect.width,
      1 - (t.clientY - rect.top) / rect.height
    )
  }, [])

  return (
    <div
      ref={mountRef}
      className={styles.wrap}
      onMouseMove={onMove}
      onMouseEnter={() => { targetStr.current = 1 }}
      onMouseLeave={() => { targetStr.current = 0 }}
      onTouchMove={onMove}
      onTouchStart={() => { targetStr.current = 1 }}
      onTouchEnd={() => { targetStr.current = 0 }}
    />
  )
}
