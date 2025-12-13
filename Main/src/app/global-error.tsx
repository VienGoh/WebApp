// src/app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div>
          <h2>Terjadi Kesalahan!</h2>
          <button onClick={() => reset()}>Coba Lagi</button>
        </div>
      </body>
    </html>
  );
}