import { notFound } from "next/navigation";
import UploadPageClient from "./UploadPageClient";

// SECURITY: This page is only accessible in development mode
// In production, it will return a 404
export default function UploadPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <UploadPageClient />;
}
