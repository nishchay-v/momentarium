'use client';

import { useState, useRef, useCallback } from 'react';
import { useGallery } from './GalleryProvider';
import { validateImageFiles } from '@/lib/imageStore';
import { Upload, X, Image as ImageIcon, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PreviewFile {
  file: File;
  preview: string;
  id: string;
}

const UploadModal = ({ isOpen, onClose }: UploadModalProps) => {
  const { addUploadedImages, isUploading, uploadError } = useGallery();
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generatePreviewId = () => `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const { valid, invalid } = validateImageFiles(fileArray);
    
    setValidationErrors(invalid.length > 0 ? invalid : []);
    
    if (valid.length === 0) return;

    const newPreviews: PreviewFile[] = valid.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: generatePreviewId(),
    }));

    setPreviewFiles(prev => [...prev, ...newPreviews]);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removePreview = (id: string) => {
    setPreviewFiles(prev => {
      const fileToRemove = prev.find(p => p.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const handleUpload = async () => {
    if (previewFiles.length === 0) return;
    
    const files = previewFiles.map(p => p.file);
    await addUploadedImages(files);
    
    // Clean up previews
    previewFiles.forEach(p => URL.revokeObjectURL(p.preview));
    setPreviewFiles([]);
    setValidationErrors([]);
    
    // Close modal on success
    if (!uploadError) {
      onClose();
    }
  };

  const handleClose = () => {
    // Clean up previews
    previewFiles.forEach(p => URL.revokeObjectURL(p.preview));
    setPreviewFiles([]);
    setValidationErrors([]);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upload Images</h2>
              <p className="text-sm text-gray-500">Add images to your gallery</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Drag and Drop Zone */}
          {previewFiles.length === 0 && (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop images here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports JPG, PNG, GIF, WebP and other image formats
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Choose Files
                </button>
              </div>
            </div>
          )}

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                <AlertCircle className="w-4 h-4" />
                Invalid Files
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                <AlertCircle className="w-4 h-4" />
                Upload Error
              </div>
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          )}

          {/* Preview Grid */}
          {previewFiles.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Preview ({previewFiles.length} files)
                </h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add More
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previewFiles.map((preview) => (
                  <div key={preview.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={preview.preview}
                        alt={preview.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                    <button
                      onClick={() => removePreview(preview.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {preview.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(preview.file.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Demo Link */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Want to see the gallery in action?</p>
                <p className="text-xs text-gray-500">Check out our demo with sample images</p>
              </div>
              <Link
                href="/demo"
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                View Demo
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {previewFiles.length > 0 && (
              <span>
                {previewFiles.length} file{previewFiles.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={previewFiles.length === 0 || isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Add to Gallery
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;


