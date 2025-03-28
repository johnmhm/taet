
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

interface ModelUploaderProps {
  onModelSelect: (model: THREE.Group) => void;
}

export function ModelUploader({ onModelSelect }: ModelUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result;
      if (!arrayBuffer || typeof arrayBuffer === 'string') return;

      const loader = new GLTFLoader();
      loader.parse(arrayBuffer, '', 
        (gltf) => {
          const model = gltf.scene;
          onModelSelect(model);
        },
        (error) => {
          console.error('Error loading model:', error);
        }
      );
    };
    reader.readAsArrayBuffer(file);
  }, [onModelSelect]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'model/gltf+binary': ['.glb'],
      'model/gltf+json': ['.gltf']
    }
  });

  return (
    <div {...getRootProps()} style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      cursor: 'pointer'
    }}>
      <input {...getInputProps()} />
      <p style={{ margin: 0, color: 'white' }}>Drop .glb/.gltf model here</p>
    </div>
  );
}
