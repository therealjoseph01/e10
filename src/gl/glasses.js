import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { ASSETS } from '../config.js'

// E1O's own product model (the one behind e1o.com/glasses.html). Nothing about the hardware is re-modelled here:
// we re-centre it, keep its materials, and add one extra material for the lenses (the "portal", which shows the
// world render through the glass during the put-on and take-off transitions).

const PORTAL_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = -mv.xyz;
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`
const PORTAL_FRAG = /* glsl */ `
  uniform sampler2D uWorld;
  uniform vec2 uRes;
  uniform float uBright;
  uniform float uGlint;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 w = texture2D(uWorld, uv).rgb * uBright;
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 4.0);
    gl_FragColor = vec4(w + vec3(0.9, 0.92, 0.95) * f * uGlint, 1.0);
    gl_FragColor = linearToOutputTexel(gl_FragColor);
  }
`
const OUTSIDE_FRAG = /* glsl */ `
  uniform sampler2D uWorld;
  uniform vec2 uRes;
  uniform float uBright;
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 w = texture2D(uWorld, uv).rgb * uBright;
    gl_FragColor = linearToOutputTexel(vec4(w, 1.0));
  }
`

export function loadGlasses(onProgress) {
  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  return new Promise((resolve, reject) => {
    loader.load(
      ASSETS.model,
      (gltf) => resolve(gltf),
      (e) => e.total && onProgress?.(e.loaded / e.total),
      reject,
    )
  })
}

export function buildGlasses(gltf, { cheapGlass = false } = {}) {
  const src = gltf.scene
  src.updateMatrixWorld(true)

  const find = (n) => {
    let hit = null
    src.traverse((o) => {
      if (!hit && o.name && o.name.replace(/[\s_]+/g, '').toLowerCase() === n.replace(/[\s_]+/g, '').toLowerCase()) hit = o
    })
    return hit
  }
  const lensL = find('Protective_lens_L')
  const lensR = find('Protective_lens_R')
  const boxL = new THREE.Box3().setFromObject(lensL)
  const boxR = new THREE.Box3().setFromObject(lensR)
  const cL = boxL.getCenter(new THREE.Vector3())
  const cR = boxR.getCenter(new THREE.Vector3())
  const pivot = cL.clone().add(cR).multiplyScalar(0.5)
  pivot.z = Math.max(boxL.max.z, boxR.max.z) - 0.004

  // Re-centre: origin between the lenses, on the lens plane. The front faces +Z.
  const root = new THREE.Group()
  root.name = 'E1O'
  src.position.sub(pivot)
  root.add(src)
  root.updateMatrixWorld(true)

  const whole = new THREE.Box3().setFromObject(root)
  const size = whole.getSize(new THREE.Vector3())
  const center = whole.getCenter(new THREE.Vector3())

  // Materials: keep E1O's, tune a little for our lighting, add the portal.
  const lensMeshes = []
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.02,
    metalness: 0,
    ior: 1.46,
    transmission: cheapGlass ? 0 : 1,
    thickness: 0.0015,
    transparent: cheapGlass,
    opacity: cheapGlass ? 0.14 : 1,
    envMapIntensity: 1.4,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    depthWrite: !cheapGlass,
  })
  const uniforms = {
    uWorld: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uBright: { value: 0 },
    uGlint: { value: 0.35 },
  }
  const portalMat = new THREE.ShaderMaterial({ vertexShader: PORTAL_VERT, fragmentShader: PORTAL_FRAG, uniforms })
  const bodyMats = new Set()

  root.traverse((o) => {
    if (!o.isMesh) return
    o.castShadow = false
    o.receiveShadow = false
    const n = o.name.toLowerCase()
    if (n.includes('lens')) {
      lensMeshes.push(o)
      o.userData.glass = glassMat
      o.material = glassMat
      o.renderOrder = 2
    } else {
      bodyMats.add(o.material)
    }
  })
  for (const m of bodyMats) {
    m.envMapIntensity = m.metalness > 0.5 ? 1.25 : 1.0
    m.userData.baseEnv = m.envMapIntensity
  }

  // Fullscreen quad that shows the world *around* the frame (peripheral vision) during portal passes.
  const outside = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.9999, 1.0); }',
      fragmentShader: OUTSIDE_FRAG,
      uniforms: { uWorld: uniforms.uWorld, uRes: uniforms.uRes, uBright: { value: 0 } },
      depthWrite: false,
      depthTest: false,
    }),
  )
  outside.frustumCulled = false
  outside.renderOrder = -100
  outside.visible = false

  // The official fold and unfold animation drives both hinges.
  const mixer = new THREE.AnimationMixer(src)
  const clip = gltf.animations[0]
  let action = null
  let foldTime = 0
  if (clip) {
    action = mixer.clipAction(clip)
    action.play()
    action.paused = true
    // Find the most folded moment in the clip (largest hinge rotation from its rest pose).
    const track = clip.tracks.find((t) => t.name.endsWith('.quaternion'))
    if (track) {
      const q0 = new THREE.Quaternion().fromArray(track.values, 0)
      let best = 0
      for (let i = 0; i < track.times.length; i++) {
        const q = new THREE.Quaternion().fromArray(track.values, i * 4)
        const a = q.angleTo(q0)
        if (a > best) {
          best = a
          foldTime = track.times[i]
        }
      }
    }
  }
  const setFold = (k) => {
    if (!action) return
    action.time = foldTime * k
    mixer.update(0)
  }
  setFold(0)

  // Anchors for the hardware labels. Each is a mesh plus a point in its local space.
  const anchor = (name, where = 'center') => {
    const m = find(name)
    if (!m) return null
    m.geometry.computeBoundingBox()
    const b = m.geometry.boundingBox
    const p = b.getCenter(new THREE.Vector3())
    if (where === 'top') p.y = b.max.y
    if (where === 'front') p.z = b.max.z
    if (where === 'bottom') p.y = b.min.y
    return { mesh: m, local: p }
  }
  const anchors = {
    bridge: (() => {
      const a = anchor('Acetate_front')
      if (!a) return null
      const b = a.mesh.geometry.boundingBox
      // top of the bridge between the lenses
      return { mesh: a.mesh, local: new THREE.Vector3(0, b.max.y - 0.009, b.max.z - 0.002) }
    })(),
    front: (() => {
      const a = anchor('Acetate_front')
      if (!a) return null
      const b = a.mesh.geometry.boundingBox
      return { mesh: a.mesh, local: new THREE.Vector3(-0.058, b.min.y + 0.008, b.max.z - 0.006) }
    })(),
    lens: anchor('Protective_lens_R'),
    rivet: anchor('Keyhole_corner_rivet_R'),
    hinge: anchor('Offset_titanium_hinge_link_R'),
    arm: anchor('Rounded_titanium_arm_R'),
    pod: anchor('Rear_electronics_pod_R'),
    podL: anchor('Rear_electronics_pod_L'),
    armL: anchor('Rounded_titanium_arm_L'),
    hingeL: anchor('Offset_titanium_hinge_link_L'),
  }
  const tmp = new THREE.Vector3()
  const anchorWorld = (key, out = new THREE.Vector3()) => {
    const a = anchors[key]
    if (!a) return null
    return out.copy(a.local).applyMatrix4(a.mesh.matrixWorld)
  }

  function setPortal(on) {
    for (const m of lensMeshes) m.material = on ? portalMat : m.userData.glass
    outside.visible = on
  }

  function setBodyEnv(k) {
    for (const m of bodyMats) m.envMapIntensity = m.userData.baseEnv * k
  }

  return {
    root,
    outside,
    size,
    center,
    lensCenters: { L: cL.clone().sub(pivot), R: cR.clone().sub(pivot) },
    lensMeshes,
    uniforms,
    outsideUniforms: outside.material.uniforms,
    setPortal,
    setFold,
    setBodyEnv,
    anchorWorld,
    glassMat,
    tmp,
  }
}
