
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ModelUploaderProps {
  onModelSelect: (file: File) => void;
}

export function ModelUploader({ onModelSelect }: ModelUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.name.endsWith('.glb')) {
      onModelSelect(file);
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
        {isDragActive ? (
          <p>Drop the GLB file here...</p>
        ) : (
          <p>Drag & drop or click to select GLB model</p>
        )}
      </div>
    </div>
  );
}
