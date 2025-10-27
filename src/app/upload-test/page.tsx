import ImageUploadTest from '@/components/ImageUploadTest';

export default function UploadTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Backend Upload Test</h1>
        <ImageUploadTest />
      </div>
    </div>
  );
}