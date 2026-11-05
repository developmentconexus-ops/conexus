import { cancelPublishRequest, decidePublishRequest, requestPublish } from '@conexus/hub-api'
import { hubMutation } from '../../platform/hub.ts'

export const sendPublishRequest = hubMutation(requestPublish)
export const sendDecision = hubMutation(decidePublishRequest)
export const sendCancellation = hubMutation(cancelPublishRequest)
