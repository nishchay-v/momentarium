'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { uploadImage, validateImageFile, type UploadResponse } from '@/lib/api/upload';

export default function ImageUploadTest() {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImage(selectedFile);
      setUploadResult(result);
      
      if (result.success) {
        console.log('Upload successful:', result.data);
      } else {
        console.error('Upload failed:', result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Image Upload Test</h2>
      
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {selectedFile && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading...' : 'Upload Image'}
      </button>

      {uploadResult && (
        <div className="mt-4 p-4 rounded-md border">
          {uploadResult.success ? (
            <div className="text-green-800 bg-green-50 p-3 rounded">
              <h3 className="font-semibold mb-2">Upload Successful!</h3>
              <div className="text-sm space-y-1">
                <p><strong>URL:</strong> <a href={uploadResult.data!.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Image</a></p>
                <p><strong>Size:</strong> {uploadResult.data!.width} × {uploadResult.data!.height}px</p>
                <p><strong>Format:</strong> {uploadResult.data!.format}</p>
                <p><strong>File Size:</strong> {(uploadResult.data!.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              
              {uploadResult.data && (
                <div className="mt-3">
                  <Image 
                    src={uploadResult.data.url} 
                    alt="Uploaded" 
                    width={uploadResult.data.width}
                    height={uploadResult.data.height}
                    className="max-w-full h-32 object-cover rounded border"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-800 bg-red-50 p-3 rounded">
              <h3 className="font-semibold mb-2">Upload Failed</h3>
              <p className="text-sm">{uploadResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}