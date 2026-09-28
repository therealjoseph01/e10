import * as THREE from 'three'
import { INK } from './ink.js'
import { mergeStatic } from './kit.js'
import { animateFigure, headWorld } from './figure.js'
import {
  buildOffice, buildHallway, buildGarden, buildPavilion, buildRestaurant, buildVoid, buildStage, buildGym, makeLaptopScreen,
} from './sets.js'

// The world seen through E1O. One scene holds every place; the director decides which are visible, how they are
// lit, and where the wearer's eyes are.

export const RESTAURANT_AT = new THREE.Vector3(0, 0, -80)
export const STAGE_AT = new THREE.Vector3(0, 0, -140)
export const GYM_AT = new THREE.Vector3(0, 0, -170)
export const VOID_AT = new THREE.Vector3(0, 0, -200)

const PRESETS = {
  morning: { paper: 0xf4f2ed, sky: 1, hemi: 1.15, sun: 3.2, dir: [-0.35, 0.62, -0.7], lamps: 0, fog: [30, 120], lift: 0.0, lo: 0.24, hi: 0.8 },
  day: { paper: 0xf3f1ec, sky: 1, hemi: 1.25, sun: 3.0, dir: [-0.45, 0.72, -0.52], lamps: 0, fog: [26, 95], lift: 0.0, lo: 0.24, hi: 0.8 },
  dusk: { paper: 0xebe7df, sky: 0.94, hemi: 0.8, sun: 2.6, dir: [-0.8, 0.28, -0.52], lamps: 0.3, fog: [20, 80], lift: 0, lo: 0.24, hi: 0.84 },
  night: { paper: 0xf0ede6, sky: 0.08, hemi: 0.3, sun: 0, dir: [-0.3, 0.8, -0.5], lamps: 1, fog: [14, 40], lift: 0, lo: 0.1, hi: 0.72 },
  officeNight: { paper: 0xf0ede6, sky: 0.1, hemi: 0.2, sun: 0, dir: [-0.3, 0.8, -0.5], lamps: 1, fog: [20, 60], lift: 0, lo: 0.1, hi: 0.72 },
  stage: { paper: 0xf0ede6, sky: 0.08, hemi: 0.35, sun: 2.2, dir: [0.0, 0.8, -0.6], lamps: 0.6, fog: [14, 40], lift: 0, lo: 0.12, hi: 0.76 },
  meeting: { paper: 0xf3f1ec, sky: 1, hemi: 1.25, sun: 2.8, dir: [0.35, 0.7, 0.62], lamps: 0, fog: [26, 95], lift: 0.0, lo: 0.24, hi: 0.8 },
  page: { paper: 0xf6f5f1, sky: 1, hemi: 1.4, sun: 0.0, dir: [-0.4, 0.8, -0.4], lamps: 0, fog: [8, 42], lift: 0.06, lo: 0.2, hi: 0.8 },
}

export class World {
  constructor({ shadows = true, shadowSize = 2048 } = {}) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xf4f2ed)
    this.scene.fog = new THREE.Fog(0xf4f2ed, 30, 120)
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.05, 260)
    this.camera.rotation.order = 'YXZ'

    this.hemi = new THREE.HemisphereLight(0xffffff, 0xd6d4cf, 1)
    this.sun = new THREE.DirectionalLight(0xffffff, 2.4)
    this.sun.castShadow = shadows
    this.sun.shadow.mapSize.set(shadowSize, shadowSize)
    Object.assign(this.sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.5, far: 60 })
    this.sun.shadow.bias = -0.0006
    this.sun.shadow.normalBias = 0.02
    this.scene.add(this.hemi, this.sun, this.sun.target)

    this.laptop = makeLaptopScreen()
    const office = buildOffice(this.laptop)
    const hallway = buildHallway()
    const garden = buildGarden()
    const pavilion = buildPavilion()
    const restaurant = buildRestaurant()
    const voidSet = buildVoid()
    const stage = buildStage()
    const gym = buildGym()
    restaurant.group.position.copy(RESTAURANT_AT)
    stage.group.position.copy(STAGE_AT)
    gym.group.position.copy(GYM_AT)
    voidSet.group.position.copy(VOID_AT)

    this.people = {
      colleague: pavilion.colleague,
      waiter: restaurant.waiter,
      friend: garden.anchors.friend,
    }
    this.sets = {
      office: office.group,
      hallway: hallway.group,
      garden: garden.group,
      pavilion: pavilion.group,
      restaurant: restaurant.group,
      void: voidSet.group,
      stage: stage.group,
      gym: gym.group,
    }
    for (const [k, g] of Object.entries(this.sets)) {
      mergeStatic(g, Object.values(this.people))
      g.visible = false
      this.scene.add(g)
    }

    // lamps (restaurant pendants, office desk lamp, stage wash)
    this.lamps = []
    const lamp = (pos, intensity, distance) => {
      const l = new THREE.PointLight(0xffffff, 0, distance, 1.6)
      l.position.copy(pos)
      l.userData.base = intensity
      this.scene.add(l)
      this.lamps.push(l)
      return l
    }
    lamp(new THREE.Vector3(0, 1.8, -0.72).add(RESTAURANT_AT), 3.0, 3.6)
    lamp(new THREE.Vector3(-2.2, 1.8, -2.3).add(RESTAURANT_AT), 2.2, 4)
    lamp(new THREE.Vector3(2.3, 1.8, -2.6).add(RESTAURANT_AT), 2.2, 4)
    lamp(new THREE.Vector3(0, 2.1, -0.96), 2.6, 5)
    lamp(new THREE.Vector3(0, 3.5, 3).add(STAGE_AT), 6, 12)

    this.preset = null
    this.tmpV = new THREE.Vector3()
  }

  setPreset(name, dim = 1) {
    const p = PRESETS[name] || PRESETS.day
    if (this.preset !== name) {
      this.preset = name
      INK.uPaper.value.set(p.paper)
      this.hemi.intensity = p.hemi
      // intensity only: toggling visibility would change the light count and recompile shaders mid-film
      this.sun.intensity = p.sun
      this.scene.fog.near = p.fog[0]
      this.scene.fog.far = p.fog[1]
      INK.uLift.value = p.lift
      INK.uLo.value = p.lo
      INK.uHi.value = p.hi
      for (const l of this.lamps) l.intensity = l.userData.base * p.lamps
      this._dir = new THREE.Vector3(...p.dir).normalize()
      this._sky = p.sky
    }
    const bg = new THREE.Color(p.paper).multiplyScalar(this._sky * dim)
    this.scene.background.copy(bg)
    this.scene.fog.color.copy(bg)
    INK.uDim.value = dim
    INK.uSky.value = this._sky
  }

  // Keep the shadow camera around the wearer, snapped to texels so the window light does not shimmer.
  followSun(center) {
    const cam = this.sun.shadow.camera
    const span = cam.right - cam.left
    const texel = span / this.sun.shadow.mapSize.x
    const c = center.clone()
    c.x = Math.round(c.x / texel) * texel
    c.z = Math.round(c.z / texel) * texel
    this.sun.target.position.copy(c)
    this.sun.position.copy(c).addScaledVector(this._dir || new THREE.Vector3(0, 1, 0), 24)
    this.sun.target.updateMatrixWorld()
  }

  show(names) {
    for (const [k, g] of Object.entries(this.sets)) g.visible = names.includes(k)
  }

  // pose: { pos:[x,y,z], yaw, pitch, roll, fov }
  setCamera(pose, aspect) {
    const c = this.camera
    c.position.fromArray(pose.pos)
    c.rotation.set((pose.pitch * Math.PI) / 180, (pose.yaw * Math.PI) / 180, ((pose.roll || 0) * Math.PI) / 180)
    if (c.fov !== pose.fov || c.aspect !== aspect) {
      c.fov = pose.fov
      c.aspect = aspect
      c.updateProjectionMatrix()
    }
    c.updateMatrixWorld()
  }

  animatePeople(time, cues) {
    for (const [k, f] of Object.entries(this.people)) if (f.parent?.visible) animateFigure(f, time, cues[k] || {})
  }

  headOf(name, out = new THREE.Vector3()) {
    const f = this.people[name]
    if (!f) return null
    return headWorld(f, out)
  }
}
