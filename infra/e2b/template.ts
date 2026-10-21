// Builds the E2B template the Builder's machines start from (decision 0051): Node 24 and git, with
// the app folder ready. Firstmate runs it once, with the account's key in E2B_API_KEY (the SDK reads
// it), and writes the name it prints into HUB_E2B_TEMPLATE.
import { defaultBuildLogger, Template } from 'e2b'

const NAME = 'conexus-builder'

const template = Template()
  .fromNodeImage('24')
  .aptInstall(['git'])
  .runCmd('mkdir -p /home/user/app && chown user:user /home/user/app')
  .setWorkdir('/home/user/app')

const built = await Template.build(template, NAME, { onBuildLogs: defaultBuildLogger() })
console.log(built.name)
