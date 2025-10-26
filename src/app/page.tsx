export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🖼️ Momentarium</h1>
      <p>AI-Powered Image Gallery Service</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>API Endpoints</h2>
        <ul>
          <li>
            <code>POST /api/uploads/generate-urls</code> - Generate upload URLs
          </li>
          <li>
            <code>POST /api/galleries/process</code> - Process images into albums
          </li>
          <li>
            <code>GET /api/jobs/[jobId]/status</code> - Check processing status
          </li>
          <li>
            <code>GET /api/galleries/[userId]</code> - Get user's gallery
          </li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Quick Start</h2>
        <ol>
          <li>Configure your environment variables (see .env.example)</li>
          <li>Run database migrations: <code>npm run db:migrate</code></li>
          <li>Use the API endpoints or the client SDK</li>
        </ol>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>📚 Documentation</h3>
        <p>See the <a href="https://github.com/yourusername/momentarium/blob/main/README.md">README.md</a> for complete documentation.</p>
      </div>
    </main>
  );
}
