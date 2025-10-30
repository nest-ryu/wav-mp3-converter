
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFilesAdded, disabled }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  }, [onFilesAdded, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <label
      htmlFor="file-upload"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`block w-full p-8 border-2 border-dashed rounded-xl transition-colors duration-300 ${isDragActive ? 'border-brand-blue bg-brand-gray-800' : 'border-brand-gray-700 hover:border-brand-gray-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input
        type="file"
        id="file-upload"
        multiple
        accept=".wav,audio/wav"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <UploadIcon className="w-12 h-12 text-brand-gray-500" />
        <div className="text-center">
            <p className="font-semibold text-lg text-brand-gray-200">
                <span className="text-brand-blue">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-brand-gray-400">WAV files only (up to 2GB)</p>
        </div>
      </div>
    </label>
  );
};
