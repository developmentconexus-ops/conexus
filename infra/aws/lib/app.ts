import type { Environment } from 'aws-cdk-lib'
import { App, DefaultStackSynthesizer, LegacyStackSynthesizer } from 'aws-cdk-lib'
import { LakeStack } from './lake.ts'
import { PLATFORM_STACK, PREPARATION_STACK } from './names.ts'
import { PlatformStack } from './platform.ts'
import { PreparationStack } from './preparation.ts'

/** The three stacks, as `cdk synth` and the tests build them; `env` pins them only in a test. */
export function conexusApp(env?: Environment) {
  const app = new App({ analyticsReporting: false })
  return {
    app,
    // Deployed before the bootstrap exists: its template goes in the request, with no bootstrap role.
    preparation: new PreparationStack(app, 'PreparationStack', {
      env,
      stackName: PREPARATION_STACK,
      synthesizer: new LegacyStackSynthesizer(),
    }),
    platform: new PlatformStack(app, 'PlatformStack', { env, stackName: PLATFORM_STACK }),
    // The Hub creates it from lake.template.json, so it carries no bootstrap rule (card L.7).
    lake: new LakeStack(app, 'LakeStack', {
      env,
      synthesizer: new DefaultStackSynthesizer({ generateBootstrapVersionRule: false }),
    }),
  }
}
