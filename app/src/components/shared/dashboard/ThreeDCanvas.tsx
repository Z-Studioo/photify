"use client"
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import { Suspense, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useUpload, type CanvasShape } from '@/context/UploadContext'

interface ThreeDCanvasProps {
  isVisible: boolean
}

// 3D Frame component with realistic materials
const Frame3D = ({ imageUrl, shape }: { imageUrl: string; shape: CanvasShape }) => {
  const frameRef = useRef<THREE.Group>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    if (imageUrl) {
      const loader = new THREE.TextureLoader()
      loader.load(imageUrl, (loadedTexture) => {
        loadedTexture.flipY = true
        loadedTexture.wrapS = THREE.ClampToEdgeWrapping
        loadedTexture.wrapT = THREE.ClampToEdgeWrapping
        loadedTexture.minFilter = THREE.LinearFilter
        loadedTexture.magFilter = THREE.LinearFilter
        loadedTexture.generateMipmaps = false
        loadedTexture.colorSpace = THREE.SRGBColorSpace
        setTexture(loadedTexture)
      })
    }
  }, [imageUrl])

  // Create geometry based on shape with proper scaling
  const createGeometry = () => {
    switch (shape) {
      case 'round':
        return new THREE.CircleGeometry(0.9, 64)
      case 'hexagon':
        return new THREE.CircleGeometry(0.9, 6)
      case 'octagon':
        return new THREE.CircleGeometry(0.9, 8)
      case 'dodecagon':
        return new THREE.CircleGeometry(0.9, 12)
      default: // rectangle
        return new THREE.PlaneGeometry(1.8, 1.35) // Adjusted to fit inside frame
    }
  }

  // Frame geometry based on shape - optimized for standalone view
  const createFrameGeometry = () => {
    const frameThickness = 0.08
    const frameDepth = 0.06
    
    if (shape === 'rectangle') {
      return (
        <group>
          {/* Main frame - sleek modern design */}
          <mesh position={[0, 0, -frameDepth/2]}>
            <boxGeometry args={[2.0, 1.55, frameDepth]} />
            <meshStandardMaterial 
              color="#2c2c2c" 
              roughness={0.3}
              metalness={0.7}
            />
          </mesh>
          
          {/* Inner bevel edges for depth */}
          <mesh position={[0, 0.775, -frameDepth/4]}>
            <boxGeometry args={[2.0, frameThickness/2, frameDepth/2]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh position={[0, -0.775, -frameDepth/4]}>
            <boxGeometry args={[2.0, frameThickness/2, frameDepth/2]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh position={[1.0, 0, -frameDepth/4]}>
            <boxGeometry args={[frameThickness/2, 1.55, frameDepth/2]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh position={[-1.0, 0, -frameDepth/4]}>
            <boxGeometry args={[frameThickness/2, 1.55, frameDepth/2]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      )
    } else {
      // Circular frame for other shapes
      return (
        <group>
          <mesh position={[0, 0, -frameDepth/2]}>
            <cylinderGeometry args={[1.15, 1.15, frameDepth, 64]} />
            <meshStandardMaterial 
              color="#2c2c2c" 
              roughness={0.3}
              metalness={0.7}
            />
          </mesh>
          {/* Inner ring for depth */}
          <mesh position={[0, 0, -frameDepth/4]}>
            <cylinderGeometry args={[1.0, 1.0, frameDepth/2, 64]} />
            <meshStandardMaterial 
              color="#1a1a1a" 
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        </group>
      )
    }
  }

  return (
    <group ref={frameRef} position={[0, 0, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
      {/* Frame */}
      {createFrameGeometry()}
      
      {/* Acrylic glass effect */}
      <mesh position={[0, 0, 0.02]}>
        {shape === 'rectangle' ? (
          <planeGeometry args={[1.8, 1.35]} />
        ) : (
          <primitive object={new THREE.CircleGeometry(0.9, 64)} />
        )}
        <meshPhysicalMaterial
          color="white"
          transparent
          opacity={0.02}
          roughness={0.05}
          metalness={0.0}
          transmission={0.98}
          thickness={0.005}
          ior={1.5}
        />
      </mesh>
      
      {/* Photo/Image with enhanced material */}
      {texture && (
        <mesh position={[0, 0, 0.01]} rotation={[0, 0, 0]} castShadow>
          <primitive object={createGeometry()} />
          <meshStandardMaterial 
            map={texture} 
            transparent={shape !== 'rectangle'}
            side={THREE.FrontSide}
            roughness={0.1}
            metalness={0.0}
            emissive={"#000000"}
            emissiveIntensity={0}
          />
        </mesh>
      )}
      
      {/* Subtle inner shadow */}
      <mesh position={[0, 0, 0.005]}>
        {shape === 'rectangle' ? (
          <planeGeometry args={[1.8, 1.35]} />
        ) : (
          <primitive object={new THREE.CircleGeometry(0.9, 64)} />
        )}
        <meshBasicMaterial 
          color="black" 
          transparent 
          opacity={0.03}
        />
      </mesh>
    </group>
  )
}





const ThreeDCanvas = ({ isVisible }: ThreeDCanvasProps) => {
  const { preview, shape } = useUpload()
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 0, 4])

  useEffect(() => {
    // Animate camera position when view becomes visible
    if (isVisible) {
      setCameraPosition([2, 1, 5])
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 50 }}
        style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}
      >
        <Suspense fallback={null}>
          {/* Enhanced lighting for vibrant photos */}
          <ambientLight intensity={0.4} color="#ffffff" />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.5}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={20}
            shadow-camera-left={-5}
            shadow-camera-right={5}
            shadow-camera-top={5}
            shadow-camera-bottom={-5}
          />
          <pointLight position={[-3, 4, 3]} intensity={0.8} color="#fff8dc" />
          <pointLight position={[3, 4, 3]} intensity={0.6} color="#f0f8ff" />
          <spotLight
            position={[0, 6, 4]}
            angle={0.4}
            penumbra={0.3}
            intensity={1.2}
            color="#ffffff"
            target-position={[0, 0, 0]}
          />
          
          {/* Frame with image - centered in view */}
          {preview && (
            <Frame3D imageUrl={preview} shape={shape} />
          )}
          
          {/* Simple ground shadow */}
          <ContactShadows
            rotation-x={Math.PI / 2}
            position={[0, -1.5, 0]}
            opacity={0.15}
            width={4}
            height={4}
            blur={1.5}
            far={2}
          />
          
          {/* Camera controls with full freedom */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={1}
            maxDistance={15}
            autoRotate={false}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default ThreeDCanvas