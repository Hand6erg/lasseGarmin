import { useState } from 'react';

interface Props {
  title: string;
  text: string;
  /** Resolves when the password works, rejects when it doesn't. */
  onSubmit: (password: string) => Promise<void>;
}

export function Unlock({ title, text, onSubmit }: Props) {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  return (
    <div className="page">
      <h1>{title}</h1>
      <p className="muted">{text}</p>
      <form
        className="unlock"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(undefined);
          try {
            await onSubmit(pw.trim());
          } catch {
            setError('Forkert kode – prøv igen.');
            setBusy(false);
          }
        }}
      >
        <label htmlFor="pw">Kode</label>
        <input id="pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="btn-primary" type="submit" disabled={!pw || busy}>
          {busy ? 'Låser op …' : 'Lås op'}
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
