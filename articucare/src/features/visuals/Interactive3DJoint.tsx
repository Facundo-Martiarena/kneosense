import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { useEffect, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import * as THREE from 'three';

/**
 * EXPERIMENTAL compatibility spike (plan section 6 "Intermedio: 3D interactivo").
 * Renders a stylized, generic joint with expo-gl + Three.js (direct glue, no
 * expo-three). Auto-rotates and responds to touch drag. The highlighted joint
 * color is an ILLUSTRATIVE demo overlay — never a reconstruction from a photo
 * and never a real tissue-fluid map (plan section 6.1).
 *
 * This is gated behind an experimental toggle; the 2.5D SVG view stays default.
 * On-device performance/compatibility sign-off remains a human step.
 */
export function Interactive3DJoint({
  highlight,
  size = 260,
}: {
  /** Illustrative overlay intensity 0..1 (scenario-driven demo value). */
  highlight: number;
  size?: number;
}) {
  // Shared mutable rotation state read by the render loop and written by touch.
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
      onMoveShouldSetPanResponder: () => true,
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
      // expo-gl canvas shim: Three only needs size + the gl context here.
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
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(3, 4, 5);
    scene.add(dir);

    const group = new THREE.Group();
    const limbMaterial = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.8 });

    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.8, 28), limbMaterial);
    upper.position.y = 1.4;
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.8, 28), limbMaterial);
    lower.position.y = -1.4;

    // Illustrative amber overlay scaled by the demo value (NOT a measurement).
    const overlay = new THREE.Color(0xb45309);
    const jointMaterial = new THREE.MeshStandardMaterial({
      color: overlay,
      emissive: overlay,
      emissiveIntensity: 0.15 + highlight * 0.55,
      roughness: 0.5,
    });
    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.75, 36, 36), jointMaterial);

    group.add(upper, lower, joint);
    scene.add(group);

    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      if (!rotation.current.dragging) {
        rotation.current.y += 0.006; // gentle auto-rotation
      }
      group.rotation.y = rotation.current.y;
      group.rotation.x = Math.max(-0.8, Math.min(0.8, rotation.current.x));
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  }

  return (
    <View style={[styles.container, { width: size, height: size }]} {...panResponder.panHandlers}>
      <GLView style={styles.gl} onContextCreate={onContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center', borderRadius: 12, overflow: 'hidden' },
  gl: { flex: 1 },
});
