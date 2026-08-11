import {errored, isErrored} from "@attio/fetchable"
import {Workflows} from "attio/server"
import {getMixmax} from "../../../mixmax/get-mixmax"
import {mixmaxApiErrorUserMessage, unexpectedMixmaxError} from "../../../mixmax/types"
import block from "./block"

export default Workflows.defineWorkflowBlockExecute(block, async ({config}) => {
    const {sequenceId, name} = config

    let result: Awaited<ReturnType<ReturnType<typeof getMixmax>["addEmailToSequence"]>>

    try {
        result = await getMixmax().addEmailToSequence({
            sequenceId,
            email: config.email.normalized,
            name: name?.full_name ?? undefined,
        })
    } catch (error) {
        console.error(error)
        result = errored(unexpectedMixmaxError())
    }

    if (isErrored(result)) {
        return {
            type: "error",
            errorMessage: mixmaxApiErrorUserMessage(result.error),
        }
    }

    return {
        type: "outcome",
        id: "success",
        data: null,
    }
})
