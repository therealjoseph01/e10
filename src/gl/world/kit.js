import * as THREE from 'three'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { inkMaterial, inkTextured, outlineMaterial, LINE } from './ink.js'

// A tiny set-building kit. Every solid gets an ink fill; hard edges are collected per set and drawn as one batch
// of screen-space lines. Smooth things get an inverted-hull outline instead.

const GEO = new Map()
const boxGeo = () => GEO.get('box') || (GEO.set('box', new THREE.BoxGeometry(1, 1, 1)), GEO.get('box'))
const edgeCache = new Map()
function edgesOf(geo, angle = 25) {
  const key = geo.uuid + angle
  if (!edgeCache.has(key)) edgeCache.set(key, new THREE.EdgesGeometry(geo, angle).attributes.position.array)
  return edgeCache.get(key)
}

export class SetBuilder {
  constructor(name) {
    this.group = new THREE.Group()
    this.group.name = name
    this.edges = []
    this.anchors = {}
  }

  _edges(mesh, angle) {
    mesh.updateMatrix()
    const arr = edgesOf(mesh.geometry, angle)
    const v = new THREE.Vector3()
    for (let i = 0; i < arr.length; i += 3) {
      v.set(arr[i], arr[i + 1], arr[i + 2]).applyMatrix4(mesh.matrix)
      this.edges.push(v.x, v.y, v.z)
    }
  }

  add(mesh, { edges = true, angle = 25, cast = true, receive = true, outline = 0 } = {}) {
    mesh.castShadow = cast
    mesh.receiveShadow = receive
    this.group.add(mesh)
    if (edges) this._edges(mesh, angle)
    if (outline > 0) {
      const o = new THREE.Mesh(mesh.geometry, outlineMaterial(outline))
      o.position.copy(mesh.position)
      o.quaternion.copy(mesh.quaternion)
      o.scale.copy(mesh.scale)
      o.castShadow = false
      o.receiveShadow = false
      this.group.add(o)
    }
    return mesh
  }

  // Axis-aligned box by size and centre. rot: y rotation in radians.
  box(w, h, d, x, y, z, { tone = 0.9, rot = 0, rotX = 0, rotZ = 0, emissive = 0, edges = true, cast = true, flat = false, sky = false } = {}) {
    const m = new THREE.Mesh(boxGeo(), inkMaterial(tone, { emissive, flat, sky }))
    m.scale.set(w, h, d)
    m.position.set(x, y, z)
    m.rotation.set(rotX, rot, rotZ)
    return this.add(m, { edges, cast })
  }

  // Box from min/max corners (handy for architecture).
  slab(x0, y0, z0, x1, y1, z1, opts) {
    return this.box(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, opts)
  }

  cyl(rTop, rBot, h, x, y, z, { tone = 0.9, seg = 20, rot = 0, rotX = 0, rotZ = 0, emissive = 0, edges = true, outline = 0, cast = true, open = false } = {}) {
    const key = `cyl${rTop}|${rBot}|${h}|${seg}|${open}`
    if (!GEO.has(key)) GEO.set(key, new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, open))
    const m = new THREE.Mesh(GEO.get(key), inkMaterial(tone, { emissive, side: open ? THREE.DoubleSide : THREE.FrontSide }))
    m.position.set(x, y, z)
    m.rotation.set(rotX, rot, rotZ)
    return this.add(m, { edges, angle: 40, outline, cast })
  }

  sphere(r, x, y, z, { tone = 0.9, sx = 1, sy = 1, sz = 1, outline = 0.006, emissive = 0, cast = true, seg = 20 } = {}) {
    const key = `sph${seg}`
    if (!GEO.has(key)) GEO.set(key, new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)))
    const m = new THREE.Mesh(GEO.get(key), inkMaterial(tone, { emissive }))
    m.position.set(x, y, z)
    m.scale.set(r * sx, r * sy, r * sz)
    return this.add(m, { edges: false, outline: outline / r, cast })
  }

  // A flat picture or screen: a plane with a canvas texture.
  picture(tex, w, h, x, y, z, { rot = 0, rotX = 0, emissive = 0, frame = 0.02, frameTone = 0.1, depth = 0.02 } = {}) {
    const g = new THREE.Group()
    g.position.set(x, y, z)
    g.rotation.set(rotX, rot, 0)
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), inkTextured(tex, { emissive }))
    plane.position.z = depth / 2 + 0.001
    plane.receiveShadow = true
    g.add(plane)
    this.group.add(g)
    if (frame > 0) {
      const f = new THREE.Mesh(boxGeo(), inkMaterial(frameTone))
      f.scale.set(w + frame * 2, h + frame * 2, depth)
      g.add(f)
      g.updateMatrix()
      f.updateMatrix()
      const arr = edgesOf(f.geometry)
      const v = new THREE.Vector3()
      const mtx = new THREE.Matrix4().multiplyMatrices(g.matrix, f.matrix)
      for (let i = 0; i < arr.length; i += 3) {
        v.set(arr[i], arr[i + 1], arr[i + 2]).applyMatrix4(mtx)
        this.edges.push(v.x, v.y, v.z)
      }
    }
    return plane
  }

  // Straight ink strokes (window mullion hints, floor seams, grids).
  line(x0, y0, z0, x1, y1, z1) {
    this.edges.push(x0, y0, z0, x1, y1, z1)
  }

  finish() {
    if (this.edges.length) {
      const g = new LineSegmentsGeometry()
      g.setPositions(this.edges)
      const l = new LineSegments2(g, LINE)
      l.frustumCulled = false
      this.group.add(l)
    }
    this.edges = []
    return this.group
  }
}

// Merge every static mesh in a set into one mesh per material (keeps draw calls low on phones).
// Objects in `keep` (and their descendants) stay live for animation.
export function mergeStatic(group, keep = []) {
  const keepSet = new Set()
  for (const k of keep) k?.traverse((o) => keepSet.add(o))
  group.updateMatrixWorld(true)
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert()
  const buckets = new Map()
  const doomed = []
  group.traverse((o) => {
    if (!o.isMesh || keepSet.has(o) || o.isLineSegments2 || o.material?.map || o.userData.live) return
    const key = `${o.material.uuid}|${o.castShadow}|${o.receiveShadow}`
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, cast: o.castShadow, recv: o.receiveShadow, geos: [] })
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name)
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld))
    buckets.get(key).geos.push(g)
    doomed.push(o)
  })
  for (const o of doomed) o.parent.remove(o)
  for (const { mat, cast, recv, geos } of buckets.values()) {
    const merged = mergeGeometries(geos, false)
    geos.forEach((g) => g.dispose())
    if (!merged) continue
    const m = new THREE.Mesh(merged, mat)
    m.castShadow = cast
    m.receiveShadow = recv
    m.matrixAutoUpdate = false
    group.add(m)
  }
  return group
}

// Draw text or simple art onto a canvas texture.
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  draw(ctx, w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}
