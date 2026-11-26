const WEB = '^apps/web/src'

module.exports = (testHelper) => {
  const tests = [`${WEB}/.*\\.test\\.tsx?$`, testHelper]
  return [
    {
      name: 'web-harness-imports-no-agent',
      comment: 'W4: harness/ is what the agents run on, and imports none of them.',
      severity: 'error',
      from: { path: `${WEB}/harness/`, pathNot: tests },
      to: { path: `${WEB}/agents/` },
    },
    {
      name: 'web-agent-imports-no-other-agent',
      comment: 'W4: an agent imports no other agent; the agent builder is the next rule.',
      severity: 'error',
      from: { path: `${WEB}/agents/([^/]+)/`, pathNot: [`${WEB}/agents/agent-builder/`, ...tests] },
      to: { path: `${WEB}/agents/`, pathNot: `${WEB}/agents/$1/` },
    },
    {
      name: 'web-agent-builder-imports-only-the-saved-agent',
      comment:
        'W4: the agent builder imports the saved agent, as on the server, and no other agent.',
      severity: 'error',
      from: { path: `${WEB}/agents/agent-builder/`, pathNot: tests },
      to: { path: `${WEB}/agents/`, pathNot: `${WEB}/agents/(agent-builder|saved-agent)/` },
    },
  ]
}
