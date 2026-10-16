"use client";
export default function BuilderError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl p-8" role="alert">
      <h1 className="text-2xl font-semibold">The customizer could not load</h1>
      <p className="my-4">
        Please try again. You can also send your specifications through our
        project intake.
      </p>
      <button className="rounded border px-4 py-2" onClick={reset}>
        Try again
      </button>
      <a className="ml-4 underline" href="/upload">
        Project intake
      </a>
    </div>
  );
}
