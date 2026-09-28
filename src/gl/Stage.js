import * as THREE from 'three'
import { buildGlasses, loadGlasses } from './glasses.js'
import { buildStudio, loadShadow } from './studio.js'
import { World } from './world/World.js'
import { INK, setLineResolution } from './world/ink.js'
import { everything, MARKS } from '../film/director.js'
import { reducedTime, lerp } from '../film/timeline.js'
import { ASSETS, device } from '../config.js'

// The one canvas. Three passes, chosen per frame by the director:
//   product: E1O in the studio (we look AT it)
//   portal:  the world is rendered off-screen and shown through the lenses (putting them on, taking them off)
//   world:   the wearer's view (we look THROUGH it)

const OFFICIAL_SCALE = 6.6 // the official viewer scales the model to 6.6 units wide

export const view = {
  t: 0,
  mode: 'product',
  w: 1,
  h: 1,
  aspect: 1,
  anchors: {},
  heads: {},
  glasses: { x: 0, y: 0, r: 0 },
  ready: false,
}

export class Stage {
  constructor(canvas) {
    this.canvas = canvas
    const tier = device.tier
    this.maxDpr = tier === 2 ? Math.min(2, window.devicePixelRatio || 1) : Math.min(1.5, window.devicePixelRatio || 1)
    this.minDpr = tier === 0 ? 0.75 : 1
    this.dpr = this.maxDpr
    const r = new THREE.WebGLRenderer({ canvas, antialias: tier > 0, alpha: false, powerPreference: 'high-performance', stencil: false })
    r.setPixelRatio(this.dpr)
    r.outputColorSpace = THREE.SRGBColorSpace
    r.toneMapping = THREE.ACESFilmicToneMapping
    r.toneMappingExposure = 1
    r.shadowMap.enabled = true
    r.shadowMap.type = THREE.PCFShadowMap
    r.shadowMap.autoUpdate = true
    r.setClearColor(0x000000, 1)
    this.renderer = r

    this.studio = buildStudio(r)
    this.pcam = new THREE.PerspectiveCamera(24, 1, 0.002, 6)
    this.world = new World({ shadows: true, shadowSize: tier === 2 ? 2048 : 1024 })
    // half-float keeps the world's dark fades smooth; fall back to 8-bit where float targets aren't renderable
    const floatOK = r.extensions.has('EXT_color_buffer_float') || r.extensions.has('EXT_color_buffer_half_float')
    this.rt = new THREE.WebGLRenderTarget(2, 2, {
      type: floatOK ? THREE.HalfFloatType : THREE.UnsignedByteType,
      samples: tier === 2 ? 4 : 0,
      depthBuffer: true,
    })
    this._tv = new THREE.Vector3()
    this._c1 = new THREE.Color()
    this._c2 = new THREE.Color()
    this._tv2 = new THREE.Vector3()
    this.frameTimes = []
    this.lastDprChange = 0
    this.resize()
    // size to the canvas box itself (100lvh on phones), not innerHeight, so toolbars never stretch the image
    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(canvas)
    this.idle = false
  }

  async load(onProgress) {
    const gltf = await loadGlasses(onProgress)
    this.g = buildGlasses(gltf, { cheapGlass: device.tier < 2 })
    this.studio.scene.add(this.g.root)
    this.studio.scene.add(this.g.outside)
    this.g.uniforms.uWorld.value = this.rt.texture
    loadShadow(ASSETS.shadow, this.studio.floor)
    // floor sits under the glasses
    const box = new THREE.Box3().setFromObject(this.g.root)
    this.studio.floor.position.set(this.g.center.x, box.min.y - 0.0008, this.g.center.z)
    this.lensHalf = (() => {
      const b = new THREE.Box3().setFromObject(this.g.lensMeshes.find((m) => m.name.toLowerCase().includes('_r')) || this.g.lensMeshes[0])
      const s = b.getSize(new THREE.Vector3())
      return { w: s.x / 2, h: s.y / 2 }
    })()
    this.frontHalf = { w: this.g.size.x / 2, h: this.lensHalf.h + 0.004 }
    this.resize()
    await this.warmUp()
    view.ready = true
  }

  // Compile every shader variant (screen and off-screen) before the film starts.
  async warmUp() {
    const r = this.renderer
    const w = this.world
    const all = Object.keys(w.sets)
    for (const name of all) {
      w.show([name])
      w.setPreset(name === 'restaurant' || name === 'stage' ? 'night' : 'day')
      const g = w.sets[name]
      const b = new THREE.Box3().setFromObject(g)
      const c = b.getCenter(new THREE.Vector3())
      w.camera.position.set(c.x, 1.6, c.z + 3)
      w.camera.lookAt(c.x, 1.2, c.z)
      w.camera.updateMatrixWorld()
      w.followSun(c)
      r.setRenderTarget(this.rt)
      r.render(w.scene, w.camera)
      r.setRenderTarget(null)
      r.render(w.scene, w.camera)
      await new Promise((res) => {
        const ch = new MessageChannel()
        ch.port1.onmessage = () => res()
        ch.port2.postMessage(0)
      })
    }
    this.g.setPortal(true)
    r.render(this.studio.scene, this.pcam)
    this.g.setPortal(false)
    r.render(this.studio.scene, this.pcam)
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.renderer.setPixelRatio(this.dpr)
    this.renderer.setSize(w, h, false)
    const bw = Math.round(w * this.dpr)
    const bh = Math.round(h * this.dpr)
    this.rt.setSize(bw, bh)
    setLineResolution(w, h)
    if (this.g) this.g.uniforms.uRes.value.set(bw, bh)
    INK.uCell.value = 3.3 * this.dpr * (device.mobile ? 0.9 : 1)
    view.w = w
    view.h = h
    view.aspect = w / h
    this.dirty = true
  }

  adaptDpr(dt, now) {
    this.frameTimes.push(dt)
    if (this.frameTimes.length < 90) return
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
    this.frameTimes.length = 0
    if (now - this.lastDprChange < 2500) return
    if (avg > 0.021 && this.dpr > this.minDpr) {
      this.dpr = Math.max(this.minDpr, this.dpr - 0.25)
      this.lastDprChange = now
      this.resize()
    } else if (avg < 0.0125 && this.dpr < this.maxDpr) {
      this.dpr = Math.min(this.maxDpr, this.dpr + 0.25)
      this.lastDprChange = now
      this.resize()
    }
  }

  // ---------------------------------------------------------------------------------------------------------
  productCamera(P, aspect, worldFov) {
    const s = P.shot
    const portrait = aspect < 1
    // wide shots step back on narrow screens so the whole frame still fits
    const fitScale = Math.max(1, Math.pow(1.55 / aspect, portrait ? 0.9 : 0.6))
    const dist = s.dist * lerp(1, fitScale, s.fit ?? 0)
    const az = (s.az * Math.PI) / 180
    const el = (s.el * Math.PI) / 180
    const tg = this._tv.fromArray(s.tg)
    if (portrait) tg.y += s.py ?? 0.012 * (s.fit ?? 0)
    const pos = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist).add(tg)
    let target = tg.clone()
    let fov = s.fov

    if (P.eye && P.eyeBlend > 0) {
      const e = P.eye
      const lx = this.g.lensCenters.R.x
      const x = lerp(0, lx, e.eyeX)
      const hw = lerp(this.frontHalf.w, this.lensHalf.w, e.eyeX)
      const hh = lerp(this.frontHalf.h, this.lensHalf.h, e.eyeX)
      const tv = Math.tan(((worldFov * Math.PI) / 180) / 2)
      const th = tv * aspect
      // on tall screens the lens is allowed to overflow the sides so it still fills the height
      const f = e.frame * (aspect < 1 ? lerp(1, 1.75, Math.min(1, (1 - aspect) / 0.5)) : 1)
      const d = Math.max(hw / (f * th), hh / (f * tv))
      const epos = new THREE.Vector3(x, 0, -d)
      const etg = new THREE.Vector3(x, 0, 0.2)
      pos.lerp(epos, P.eyeBlend)
      target.lerp(etg, P.eyeBlend)
      fov = lerp(fov, worldFov, P.eyeBlend)
    }

    if (P.mark) {
      const c = this.g.center
      const k = 1 / (OFFICIAL_SCALE / this.g.size.x)
      const toM = (arr) => new THREE.Vector3(arr[0] * k, arr[1] * k, arr[2] * k).add(c)
      const markCam = (m) => {
        const p = toM(m.pos)
        const t = toM(m.tg)
        if (aspect < 1.25) {
          const off = p.clone().sub(t).multiplyScalar(1.25 / aspect)
          p.copy(t).add(off)
        }
        return { p, t }
      }
      const A = markCam(P.mark.a)
      const B = markCam(P.mark.b)
      const mp = A.p.lerp(B.p, P.mark.k)
      const mt = A.t.lerp(B.t, P.mark.k)
      const mb = P.shot.markBlend ?? 1
      pos.lerp(mp, mb)
      target.lerp(mt, mb)
      fov = lerp(fov, 28, mb)
    }
    const cam = this.pcam
    cam.position.copy(pos)
    cam.up.set(0, 1, 0)
    cam.lookAt(target)
    if (cam.fov !== fov || cam.aspect !== aspect) {
      cam.fov = fov
      cam.aspect = aspect
      cam.updateProjectionMatrix()
    }
    cam.updateMatrixWorld()
  }

  project(v, cam) {
    const p = this._tv2.copy(v).project(cam)
    return { x: (p.x * 0.5 + 0.5) * view.w, y: (-p.y * 0.5 + 0.5) * view.h, z: p.z, on: p.z < 1 && Math.abs(p.x) < 1.2 && Math.abs(p.y) < 1.2 }
  }

  // ---------------------------------------------------------------------------------------------------------
  frame(tRaw, dt, clock, reduced) {
    if (!this.g) return
    let t = tRaw
    let rmVeil = 0
    if (reduced) {
      const r = reducedTime(tRaw)
      t = r.t
      rmVeil = r.veil
    }
    const S = everything(t)
    const P = S.product
    const L = S.lens
    const W = S.world
    const aspect = view.aspect
    const r = this.renderer
    const st = this.studio

    // world camera field of view: a fixed horizontal view, clamped on tall screens
    const fovV = THREE.MathUtils.clamp((2 * Math.atan(Math.tan(((W.fovH * Math.PI) / 180) / 2) / aspect) * 180) / Math.PI, 46, 76)

    // --- product
    this.productCamera(P, aspect, fovV)
    r.toneMappingExposure = P.exposure
    st.scene.environmentRotation.set(0, P.envRot, 0)
    st.scene.environmentIntensity = P.envI * lerp(1, 0.18, L.worn)
    st.key.intensity = P.key * lerp(1, 0.05, L.worn)
    st.rim.intensity = P.rim * lerp(1, 0.25, L.worn)
    st.hemi.intensity = P.hemi * lerp(1, 0.2, L.worn)
    st.key.position.set(Math.sin(P.envRot * 0.6) * 0.5 - 0.3, 0.7, 0.5)
    const bu = st.backdrop.material.uniforms
    const glow = P.glow ?? 1
    bu.uInner.value.set(0x000000).lerp(this._c1.set(0x17171a), glow).lerp(this._c2.set(0xf4f2ee), P.paper)
    bu.uOuter.value.set(0x000000).lerp(this._c2.set(0xd8d5ce), P.paper)
    bu.uAspect.value = aspect
    bu.uRadius.value = aspect < 1 ? 0.7 : 0.95
    st.floor.material.opacity = P.floor * (1 - P.fold * 0.7)
    this.g.setFold(P.fold)
    const sway = reduced ? 0 : P.idle * Math.sin(clock * 0.32) * 0.09
    this.g.root.rotation.y = sway
    this.g.root.updateMatrixWorld(true)

    const portal = L.mode === 'portal'
    this.g.setPortal(portal)
    this.g.uniforms.uBright.value = L.bright
    this.g.uniforms.uGlint.value = L.glint
    this.g.outsideUniforms.uBright.value = L.outside
    st.backdrop.visible = !portal

    // --- world
    const needWorld = L.mode !== 'product'
    if (needWorld) {
      const w = this.world
      w.show(W.sets)
      w.setPreset(W.preset, W.dim)
      if (W.lift != null) INK.uLift.value = Math.max(INK.uLift.value, W.lift)
      // tall screens: look a little lower so faces sit above the display plate
      const bias = aspect < 1 ? -5 * (1 - aspect) : 0
      w.setCamera({ ...W.pose, pitch: W.pose.pitch + bias, fov: fovV }, aspect)
      w.followSun(w.camera.position.clone().add(new THREE.Vector3(0, 0, 0)))
      w.laptop.draw(W.laptop)
      const wt = w.people.waiter
      wt.position.set(W.waiter.pos[0], W.waiter.pos[1], W.waiter.pos[2])
      wt.rotation.y = W.waiter.rot
      w.animatePeople(reduced ? 0 : clock, W.cues)
    }

    // --- render
    if (L.mode === 'product') {
      r.setRenderTarget(null)
      r.render(st.scene, this.pcam)
    } else if (portal) {
      r.setRenderTarget(this.rt)
      r.render(this.world.scene, this.world.camera)
      r.setRenderTarget(null)
      r.render(st.scene, this.pcam)
    } else {
      r.setRenderTarget(null)
      r.render(this.world.scene, this.world.camera)
    }

    // anything moving on its own (breathing people, the glasses' sway) keeps the loop drawing while scroll rests
    this.idle = (!reduced && P.idle > 0.001) || (needWorld && !reduced && W.sets.some((k) => ['pavilion', 'restaurant', 'garden'].includes(k)))

    // --- publish what the overlays need
    view.t = tRaw
    view.tc = t
    view.mode = L.mode
    view.veil = Math.max(S.veil, rmVeil)
    view.hush = W.hush
    view.fovV = fovV
    if (L.mode === 'product') {
      for (const k of ['bridge', 'front', 'lens', 'rivet', 'hinge', 'arm', 'pod']) {
        const p = this.g.anchorWorld(k)
        view.anchors[k] = p ? this.project(p, this.pcam) : null
      }
      const c = this.project(this.g.center, this.pcam)
      const edge = this.project(this._tv.copy(this.g.center).add(new THREE.Vector3(this.g.size.x / 2, 0, 0)), this.pcam)
      view.glasses = { x: c.x, y: c.y, r: Math.abs(edge.x - c.x) }
      st.backdrop.material.uniforms.uCenter.value.set(c.x / view.w, 1 - c.y / view.h)
    } else {
      for (const k of ['colleague', 'waiter', 'friend']) {
        const h = this.world.headOf(k, new THREE.Vector3())
        view.heads[k] = h && this.world.people[k].parent?.visible ? this.project(h, this.world.camera) : null
      }
    }
    if (!reduced) this.adaptDpr(dt, performance.now())
  }
}
