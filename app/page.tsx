export default function Home() {
  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ fontFamily: 'var(--font)', fontSize: 32, fontWeight: 600, letterSpacing: '-0.022em' }}>
        Tokens loaded
      </h1>
      <p style={{ color: 'var(--body)' }}>If the background is warm cream and this text is Inter, the tokens are wired.</p>
      <code style={{ fontFamily: 'var(--mono)', fontSize: 12.5, background: 'var(--surface-card)', padding: '2px 6px', borderRadius: 4 }}>
        var(--mono) test
      </code>
    </main>
  );
}
