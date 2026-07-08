import {Workflows} from "attio"

export default Workflows.defineWorkflowBlock({
    type: "step",
    id: "add-email-to-sequence",
    title: "Add to Mixmax sequence",
    description: "Add an email to a Mixmax sequence",
    requireUserConnection: true,
    schema: Workflows.ConfigSchema.struct({
        sequenceId: Workflows.ConfigSchema.string(),
        email: Workflows.ConfigSchema.emailAddress(),
        name: Workflows.ConfigSchema.personalName().optional(),
    }),
})
