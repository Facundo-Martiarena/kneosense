import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { useEffect, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import * as THREE from 'three';

/**
 * Interactive 3D of the KneoSense bioimpedance SENSOR PATCH (expo-gl + three.js,
 * direct glue, no expo-three). A soft rounded adhesive pad with a raised
 * electronics module, a status LED and metallic skin-contact electrodes.
 * Auto-rotates and responds to touch drag.
 *
 * This renders the DEVICE, not anatomy — there are intentionally no bones here.
 * It is illustrative, not a clinical reading. three is pinned to 0.162.x
 * (r163+ needs WebGL2, not detected on expo-gl's RN context).
 */

/** Rounded-rectangle shape used to extrude pad/module bodies. */
function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

function extrude(shape: THREE.Shape, depth: number, bevel = 0.06): THREE.ExtrudeGeometry {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 24,
  });
  g.center();
  return g;
}

export function Interactive3DJoint({
  highlight,
  size = 320,
}: {
  /** Illustrative demo value 0..1 (drives the status LED glow only). */
  highlight: number;
  /** Max rendered width; the view still fills the available width responsively. */
  size?: number;
}) {
  const rotation = useRef({ y: 0, x: 0, dragging: false });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        rotation.current.dragging = true;
      },
      onPanResponderMove: (_evt, gesture) => {
        rotation.current.y += gesture.dx * 0.01;
        rotation.current.x += gesture.dy * 0.01;
      },
      onPanResponderRelease: () => {
        rotation.current.dragging = false;
      },
      onPanResponderTerminate: () => {
        rotation.current.dragging = false;
      },
    }),
  ).current;

  function onContextCreate(gl: ExpoWebGLRenderingContext) {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    const renderer = new THREE.WebGLRenderer({
      canvas: {
        width,
        height,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientWidth: width,
        clientHeight: height,
        getContext: () => gl,
      } as unknown as HTMLCanvasElement,
      context: gl as unknown as WebGLRenderingContext,
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 7);
    camera.lookAt(0, 0, 0);

    // Soft, realistic 3-point rig + sky/ground hemisphere fill.
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb4c7, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(4, 6, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.5);
    fill.position.set(-5, -1, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.7);
    rim.position.set(0, 2, -6);
    scene.add(rim);

    const patch = new THREE.Group();

    // 1) Thin flexible adhesive base (slightly larger, lighter, matte).
    const baseGeo = extrude(roundedRect(3.6, 2.6, 0.7), 0.1, 0.05);
    const baseMat = new THREE.MeshPhysicalMaterial({
      color: 0x5eead4,
      roughness: 0.85,
      metalness: 0,
      sheen: 0.4,
      sheenColor: new THREE.Color(0x99f6e4),
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.z = -0.06;
    patch.add(base);

    // 2) Main silicone pad body (teal, soft, slightly glossy).
    const padGeo = extrude(roundedRect(3.0, 2.1, 0.6), 0.22, 0.09);
    const padMat = new THREE.MeshPhysicalMaterial({
      color: 0x14b8a6,
      roughness: 0.5,
      metalness: 0.03,
      clearcoat: 0.5,
      clearcoatRoughness: 0.5,
    });
    patch.add(new THREE.Mesh(padGeo, padMat));

    // 3) Raised electronics module (glossy charcoal plastic with clearcoat).
    const hubGeo = extrude(roundedRect(1.5, 1.1, 0.35), 0.28, 0.07);
    const hubMat = new THREE.MeshPhysicalMaterial({
      color: 0x111827,
      roughness: 0.35,
      metalness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
    });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.position.z = 0.3;
    patch.add(hub);

    // 3b) Subtle brand strip / vent line on the module.
    const stripGeo = new THREE.BoxGeometry(1.1, 0.06, 0.02);
    const stripMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.6 });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, -0.28, 0.48);
    patch.add(strip);

    // 4) Status LED (green), glow modulated by the demo value.
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 0.6 + highlight * 1.0,
    });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 24), ledMat);
    led.position.set(0.45, 0.28, 0.46);
    patch.add(led);

    // 5) Skin-contact electrodes on the back face (metallic discs).
    const electrodeMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.2,
      metalness: 0.9,
    });
    const electrodePositions: [number, number][] = [
      [-1.0, 0.6],
      [1.0, 0.6],
      [-1.0, -0.6],
      [1.0, -0.6],
    ];
    electrodePositions.forEach(([x, y]) => {
      const e = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.12, 28), electrodeMat);
      e.rotation.x = Math.PI / 2;
      e.position.set(x, y, -0.2);
      patch.add(e);
    });

    patch.rotation.x = -0.35; // tilt so the pad reads as 3D
    scene.add(patch);

    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      if (!rotation.current.dragging) rotation.current.y += 0.006;
      patch.rotation.y = rotation.current.y;
      patch.rotation.x = -0.35 + Math.max(-0.7, Math.min(0.7, rotation.current.x));
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  }

  return (
    <View style={[styles.container, { maxWidth: size }]} {...panResponder.panHandlers}>
      <GLView style={styles.gl} onContextCreate={onContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gl: { flex: 1 },
});
