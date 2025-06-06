export async function callClaude(prompt: string) {
  const response = await fetch('http://localhost:4000/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) {
    throw new Error('Claude API error');
  }
  const data = await response.json();
  return data.content?.[0]?.text || '';
}