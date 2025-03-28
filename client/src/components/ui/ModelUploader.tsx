
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface ModelUploaderProps {
  onModelSelect: (model: THREE.Group) => void;
}

export function ModelUploader({ onModelSelect }: ModelUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.name.endsWith('.glb')) {
      setLoading(true);
      setError(null);
      try {
        const url = URL.createObjectURL(file);
        const loader = new GLTFLoader();
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
        
        if (gltf.scene) {
          onModelSelect(gltf.scene);
        }
      } catch (err) {
        setError('Failed to load model');
        console.error('Error loading model:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [onModelSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'model/gltf-binary': ['.glb']
    },
    multiple: false
  });

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        {...getRootProps()}
        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors"
      >
        <input {...getInputProps()} />
        {loading ? (
          <p>Loading model...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : isDragActive ? (
          <p>Drop the GLB file here...</p>
        ) : (
          <p>Upload GLB model</p>
        )}
      </div>
    </div>
  );
}
