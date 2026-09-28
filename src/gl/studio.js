import * as THREE from 'three'

// The product studio. Like e1o.com's own viewer, reflections come from real rectangular softboxes (no fake rim
// glow on the product). The environment is rotated over time, which walks the reflections across the acetate
// and titanium: that is the "light travelling across the hardware" in the opening.

export function buildStudio(renderer) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)

  const studio = new THREE.Scene()
  studio.background = new THREE.Color(0.0, 0.0, 0.0)
  const panel = (pos, scale, intensity) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(...scale),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity, intensity, intensity), side: THREE.DoubleSide }),
    )
    m.position.fromArray(pos)
    m.lookAt(0, 0, 0)
    studio.add(m)
  }
  // A long strip overhead (the travelling highlight), two verticals, a low fill.
  panel([0, 7, 2], [11, 1.4], 7)
  panel([-6.5, 1.5, 3.5], [1.2, 7], 3.2)
  panel([6.5, 2.5, -3], [2.4, 6.5], 3.6)
  panel([0, -1.5, 8], [7, 1.2], 0.9)
  panel([2, 3, 7], [2, 2], 1.6)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromScene(studio, 0.03)
  studio.traverse((o) => {
    o.geometry?.dispose()
    o.material?.dispose()
  })
  scene.environment = env.texture
  scene.environmentIntensity = 1

  const hemi = new THREE.HemisphereLight(0xffffff, 0x9a9a9a, 0.35)
  const key = new THREE.DirectionalLight(0xffffff, 2.2)
  key.position.set(-0.3, 0.7, 0.5)
  const rim = new THREE.DirectionalLight(0xffffff, 1.4)
  rim.position.set(0.6, 0.35, -0.8)
  const fill = new THREE.DirectionalLight(0xfff4ea, 0.4)
  fill.position.set(0.8, -0.1, 0.6)
  scene.add(hemi, key, rim, fill)

  // A paper floor for "Every angle", carrying the official baked area shadow.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(0.265, 0.265),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, toneMapped: false, color: 0x000000 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.renderOrder = -1
  scene.add(floor)

  // A soft pool of light behind the product so black acetate still reads against the dark.
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: {
        uInner: { value: new THREE.Color(0x000000) },
        uOuter: { value: new THREE.Color(0x000000) },
        uCenter: { value: new THREE.Vector2(0.5, 0.5) },
        uAspect: { value: 1 },
        uRadius: { value: 0.75 },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.99999, 1.0); }',
      fragmentShader: `
        uniform vec3 uInner; uniform vec3 uOuter; uniform vec2 uCenter; uniform float uAspect; uniform float uRadius;
        varying vec2 vUv;
        void main(){
          vec2 d = vUv - uCenter; d.x *= uAspect;
          float k = smoothstep(0.0, uRadius, length(d));
          vec3 c = mix(uInner, uOuter, k);
          // a whisper of grain keeps the gradient from banding
          float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
          gl_FragColor = linearToOutputTexel(vec4(c + n / 255.0, 1.0));
        }`,
      depthWrite: false,
      depthTest: false,
    }),
  )
  backdrop.frustumCulled = false
  backdrop.renderOrder = -200
  scene.add(backdrop)
  scene.background = null

  return { scene, env, pmrem, hemi, key, rim, fill, floor, backdrop }
}

export function loadShadow(url, floor) {
  new THREE.TextureLoader().load(url, (tex) => {
    // The official bake is black with the shadow in its alpha channel.
    tex.colorSpace = THREE.SRGBColorSpace
    floor.material.map = tex
    floor.material.color.set(0xffffff)
    floor.material.needsUpdate = true
  })
}
