
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface ModelUploaderProps {
  onModelSelect: (model: THREE.Group) => void;
}

export function ModelUploader({ onModelSelect }: ModelUploaderProps) {
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.name.endsWith('.glb')) {
      setLoading(true);
      try {
        const url = URL.createObjectURL(file);
        const gltf = await new Promise((resolve, reject) => {
          const loader = new GLTFLoader();
          loader.load(url, resolve, undefined, reject);
        });
        if (gltf.scene) {
          onModelSelect(gltf.scene);
        }
      } catch (error) {
        console.error('Error loading model:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [onModelSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'model/gltf-binary': ['.glb'] },
    multiple: false
  });

  return (
    <div className="fixed top-4 left-4 z-10">
      <div
        {...getRootProps()}
        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors"
      >
        <input {...getInputProps()} />
        {loading ? (
          <p>Loading model...</p>
        ) : isDragActive ? (
          <p>Drop the GLB file here...</p>
        ) : (
          <p>Drag & drop or click to select GLB model</p>
        )}
      </div>
    </div>
  );
}
