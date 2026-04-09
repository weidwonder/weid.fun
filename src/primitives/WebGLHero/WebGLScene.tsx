import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface WebGLSceneProps {
  primaryColor: string
  isMobile: boolean
}

/**
 * WebGLScene · Three.js scene，由 WebGLHero 包装在 Canvas 里
 *
 * 当前效果：一个轻微起伏的 color blob。
 * mobile 上通过降低 geometry segments 控制复杂度。
 */
export function WebGLScene({ primaryColor, isMobile }: WebGLSceneProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(primaryColor) },
    }),
    [primaryColor],
  )

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.1
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.05
    uniforms.uTime.value = state.clock.elapsedTime
  })

  const segments = isMobile ? 32 : 96

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, segments, segments]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vPos;
            uniform float uTime;
            void main() {
              vNormal = normal;
              vec3 p = position;
              float wave = sin(uTime * 0.5 + position.x * 2.0) * 0.08;
              p += normal * wave;
              vPos = p;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            varying vec3 vPos;
            uniform vec3 uColor;
            uniform float uTime;
            void main() {
              float fresnel = pow(1.0 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 2.0);
              vec3 color = mix(uColor * 0.4, uColor, fresnel);
              color += 0.15 * sin(uTime + vPos.x * 3.0);
              gl_FragColor = vec4(color, 1.0);
            }
          `}
        />
      </mesh>
    </>
  )
}
