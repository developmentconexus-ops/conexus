/** The models and efforts the fake Hub offers, by provider. */
const EFFORTS: Record<string, string[]> = {
  'claude-sonnet-4': ['off', 'low', 'high'],
  'gpt-5': ['low', 'medium', 'high'],
  'gemini-2.5-flash': ['off', 'medium', 'high'],
}

export const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', models: ['claude-sonnet-4', 'claude-opus-4'] },
  { id: 'google', name: 'Google', models: ['gemini-2.5-pro', 'gemini-2.5-flash'] },
  { id: 'openai', name: 'OpenAI', models: ['gpt-5'] },
].map((p) => ({
  ...p,
  models: p.models.map((name) => ({ id: `${p.id}/${name}`, efforts: EFFORTS[name] ?? ['off'] })),
}))
