'use client'

import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Center } from '@react-three/drei'
import * as THREE from 'three'

// ─── GLB Coin Model ───────────────────────────────────────────────────────────
function CoinModel() {
    const { scene } = useGLTF('/rupee.glb')
    const groupRef = useRef<THREE.Group>(null)
    const lightRef = useRef<THREE.PointLight>(null)
    
    const [hovered, setHovered] = useState(false)
    const [clicked, setClicked] = useState(false)

    useFrame((state) => {
        if (!groupRef.current) return

        // Interactive Scale
        const targetScale = hovered ? 11 : 10
        const currentScale = clicked ? targetScale * 0.95 : targetScale
        groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, currentScale, 0.1))

        // Parallax - slight rotation following the mouse
        const targetRotY = state.pointer.x * 0.6
        const targetRotX = -state.pointer.y * 0.6
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05)
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05)

        // Brighten on hover
        if (lightRef.current) {
            lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, hovered ? 6.0 : 0.0, 0.1)
        }
    })
    
    return (
        <group 
            ref={groupRef}
            scale={[10, 10, 10]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onPointerDown={() => setClicked(true)}
            onPointerUp={() => setClicked(false)}
        >
            <primitive object={scene} />
            <pointLight ref={lightRef} position={[0, 3, 3]} color="#ffffff" distance={15} />
        </group>
    )
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene() {
    return (
        <>
            {/* Brightened lighting for clear visibility of original materials */}
            <ambientLight intensity={1.5} />
            <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
            <directionalLight position={[-5, -5, -5]} intensity={0.5} color="#ffffff" />
            <pointLight position={[-3, 2, 2]} color="#ffffff" intensity={1.0} />
            <pointLight position={[3, -2, -2]} color="#ffffff" intensity={1.0} />

            <Center>
                <CoinModel />
            </Center>
            
            {/* OrbitControls for 360 degree drag/rotate interactivity */}
            <OrbitControls 
                enableZoom={false} 
                enablePan={false} 
                autoRotate={true}
                autoRotateSpeed={0.5}
            />
        </>
    )
}

// Preload for faster initial render
useGLTF.preload('/rupee.glb')

// ─── Exported Canvas Wrapper ──────────────────────────────────────────────────
export default function CurrencyCanvas({
    isMobile = false,
    scrollProgress = 0,
}: {
    isMobile?: boolean
    scrollProgress?: number
}) {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Canvas
                camera={{ position: [0, 0, 5.5], fov: 40 }}
                dpr={isMobile ? 1 : Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <Scene />
            </Canvas>
        </div>
    )
}
