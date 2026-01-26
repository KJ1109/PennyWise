'use client'

import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 3000

function CursorTrail() {
    const mesh = useRef<THREE.Points>(null!)

    // 1. Global Mouse Tracking (Works over HTML overlays)
    const mouseRef = useRef(new THREE.Vector2(0, 0))

    const { size, viewport } = useThree()

    // Particle Data
    const particles = useMemo(() => {
        return new Array(PARTICLE_COUNT).fill(0).map(() => ({
            x: 0, y: 0, z: 0,
            vx: 0, vy: 0, vz: 0,
            life: 0,
            size: Math.random() * 0.5 + 0.5
        }))
    }, [])

    const lastMouse = useRef(new THREE.Vector3(0, 0, 0))
    const currentIdx = useRef(0)
    const initialized = useRef(false)

    // Listen to Window Mouse events to bypass z-index blocking
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const updateMouse = (e: MouseEvent) => {
                // Normalize to -1 to 1
                const x = (e.clientX / window.innerWidth) * 2 - 1
                const y = -(e.clientY / window.innerHeight) * 2 + 1
                mouseRef.current.set(x, y)
            }
            window.addEventListener('mousemove', updateMouse)
            return () => window.removeEventListener('mousemove', updateMouse)
        }
    }, [])

    useFrame((state) => {
        if (!mesh.current) return

        // Precise World Dimensions at Z=0
        const { width, height } = viewport.getCurrentViewport(state.camera, [0, 0, 0])

        const mx = (mouseRef.current.x * width) / 2
        const my = (mouseRef.current.y * height) / 2

        // Initialize lastMouse on first frame
        if (!initialized.current) {
            lastMouse.current.set(mx, my, 0)
            initialized.current = true
            return
        }

        // --- 1. EMISSION with High Density ---
        const dist = Math.sqrt(Math.pow(mx - lastMouse.current.x, 2) + Math.pow(my - lastMouse.current.y, 2))
        // High density steps for smooth lines
        const steps = Math.min(Math.floor(dist * 20), 100)

        if (steps > 0) {
            // Debug emission once
            if (Math.random() < 0.01) console.log("Spawning", steps, "particles at", mx, my)

            for (let i = 0; i <= steps; i++) {
                const t = i / steps
                const x = lastMouse.current.x + (mx - lastMouse.current.x) * t
                const y = lastMouse.current.y + (my - lastMouse.current.y) * t

                const p = particles[currentIdx.current]
                p.life = 1.0
                p.x = x + (Math.random() - 0.5) * 0.15 // Tighter scatter
                p.y = y + (Math.random() - 0.5) * 0.15
                p.z = 0

                // Gentle drift
                const angle = Math.random() * Math.PI * 2
                const speed = 0.02
                p.vx = Math.cos(angle) * speed
                p.vy = Math.sin(angle) * speed
                p.vz = 0

                currentIdx.current = (currentIdx.current + 1) % PARTICLE_COUNT
            }
        }

        lastMouse.current.set(mx, my, 0)

        // --- 2. UPDATE ---
        const positions = mesh.current.geometry.attributes.position.array as Float32Array
        const sizes = mesh.current.geometry.attributes.size.array as Float32Array
        const opacities = mesh.current.geometry.attributes.opacity.array as Float32Array

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const p = particles[i]

            if (p.life > 0) {
                p.x += p.vx
                p.y += p.vy
                p.life -= 0.02 // Fade speed

                positions[i * 3] = p.x
                positions[i * 3 + 1] = p.y
                positions[i * 3 + 2] = p.z
                sizes[i] = p.size * p.life
                opacities[i] = p.life
            } else {
                positions[i * 3] = 9999
                sizes[i] = 0
                opacities[i] = 0
            }
        }

        mesh.current.geometry.attributes.position.needsUpdate = true
        mesh.current.geometry.attributes.size.needsUpdate = true
        mesh.current.geometry.attributes.opacity.needsUpdate = true
    })

    // Buffers setup
    const [posArray, sizeArray, opacityArray] = useMemo(() => {
        const pos = new Float32Array(PARTICLE_COUNT * 3).fill(9999)
        const size = new Float32Array(PARTICLE_COUNT).fill(0)
        const op = new Float32Array(PARTICLE_COUNT).fill(0)
        return [pos, size, op]
    }, [])

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={PARTICLE_COUNT}
                    array={posArray}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-size"
                    count={PARTICLE_COUNT}
                    array={sizeArray}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-opacity"
                    count={PARTICLE_COUNT}
                    array={opacityArray}
                    itemSize={1}
                />
            </bufferGeometry>
            {/* Custom Shader Material */}
            <shaderMaterial
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                uniforms={{
                    uColor: { value: new THREE.Color('#00ff41') },
                    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
                }}
                vertexShader={`
                    attribute float size;
                    attribute float opacity;
                    varying float vOpacity;
                    uniform float uPixelRatio;
                    
                    void main() {
                        vOpacity = opacity;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_Position = projectionMatrix * mvPosition;
                        // INCREASED SIZE MULTIPLIER to 400.0 from 35.0
                        gl_PointSize = size * 400.0 * uPixelRatio * (1.0 / -mvPosition.z);
                    }
                `}
                fragmentShader={`
                    uniform vec3 uColor;
                    varying float vOpacity;
                    
                    void main() {
                        vec2 uv = gl_PointCoord.xy - 0.5;
                        float dist = length(uv);
                        if (dist > 0.5) discard;
                        
                        // Sharp bright core
                        float glow = 1.0 - (dist * 2.0);
                        glow = pow(glow, 1.5);
                        
                        gl_FragColor = vec4(uColor, vOpacity * glow);
                    }
                `}
            />
        </points>
    )
}

// Background Wrapper
export function RupeeBackground() {
    return (
        <div className="absolute inset-0 z-0 bg-transparent pointer-events-none">
            <Canvas camera={{ position: [0, 0, 10], fov: 45 }} style={{ pointerEvents: 'auto' }}>
                <color attach="background" args={['black']} />
                <CursorTrail />
            </Canvas>
        </div>
    )
}
