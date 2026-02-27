export default function ScanNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">?</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Sample Not Found
        </h1>
        <p className="text-gray-500 text-sm">
          This QR code does not match any sample in our system.
          <br />
          The sample may have been removed or the code may be incorrect.
        </p>
      </div>
    </div>
  );
}