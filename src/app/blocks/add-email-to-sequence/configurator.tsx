import {isErrored} from "@attio/fetchable"
import {Workflows, useAsyncCache} from "attio/client"
import listSequences from "../../../mixmax/list-sequences.server"
import {mixmaxApiErrorUserMessage} from "../../../mixmax/types"
import block from "./block"

export default Workflows.defineConfigurator(block, (workflowBlock) => {
    const {ComboboxInput, EmailAddressInput, PersonalNameInput, Outcome} =
        Workflows.useConfigurator(workflowBlock.configSchema)
    const {
        values: {sequences: sequencesResult},
    } = useAsyncCache({sequences: listSequences})

    return (
        <>
            <ComboboxInput
                name="sequenceId"
                label="Sequence"
                placeholder="Select a sequence..."
                searchPlaceholder="Search sequences..."
                options={{
                    async getOption(value: string) {
                        if (isErrored(sequencesResult)) {
                            return {
                                label: mixmaxApiErrorUserMessage(sequencesResult.error),
                                value: "error",
                            }
                        }

                        const sequence = sequencesResult.value.find((s) => s.id === value)
                        return sequence
                            ? {label: sequence.name, value: sequence.id}
                            : {label: "Unknown sequence", value}
                    },
                    async search(query: string) {
                        if (isErrored(sequencesResult)) {
                            return [
                                {
                                    label: mixmaxApiErrorUserMessage(sequencesResult.error),
                                    value: "error",
                                },
                            ]
                        }

                        return sequencesResult.value
                            .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
                            .map((s) => ({label: s.name, value: s.id}))
                    },
                }}
                disableVariables
            />

            <EmailAddressInput
                name="email"
                label="Recipient email"
                placeholder="Enter email address..."
            />

            <PersonalNameInput
                name="name"
                label="Recipient name"
                placeholder="Enter full name..."
            />

            <Outcome id="success" label="Success" schema={null} />
        </>
    )
})
