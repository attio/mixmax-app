import {complete, errored, isErrored} from "@attio/fetchable"
import {z} from "zod"
import {type MixmaxError, type MixmaxResult, unexpectedMixmaxError} from "./types"

const BASE_URL = "https://api.mixmax.com/v1"

const listSequencesResponseSchema = z.object({
    results: z.array(
        z.object({
            _id: z.string(),
            name: z.string(),
        })
    ),
})

/**
 * POST /v1/sequences/:id/recipients — success payloads use `{ recipients: [...] }` at the root.
 * Non-success items may omit `id` / `stages` (see Mixmax docs for `status` + `errors`).
 *
 * @see https://developer.mixmax.com/reference/sequencessequenceidrecipients
 */
const sequenceRecipientResultSchema = z.object({
    id: z.string().optional(),
    email: z.string(),
    stages: z.array(z.string()).optional(),
    status: z.enum(["success", "error", "duplicated", "unsubscribed"]),
    errors: z.array(z.string()).optional(),
})

const addRecipientsResponseSchema = z.object({
    recipients: z.array(sequenceRecipientResultSchema),
})

export class MixmaxClient {
    constructor(private readonly token: string) {}

    async listSequences(): MixmaxResult<Array<{id: string; name: string}>> {
        const result = await this.requestJson("/sequences")

        if (isErrored(result)) {
            return result
        }

        const parseResult = listSequencesResponseSchema.safeParse(result.value)

        if (!parseResult.success) {
            console.error(
                JSON.stringify({
                    msg: "Failed to parse Mixmax sequences response",
                    error: parseResult.error.issues,
                })
            )
            return errored(unexpectedMixmaxError())
        }

        return complete(parseResult.data.results.map((seq) => ({id: seq._id, name: seq.name})))
    }

    async addEmailToSequence({
        sequenceId,
        email,
        name,
    }: {
        sequenceId: string
        email: string
        name?: string
    }): MixmaxResult<{email: string; status: "success"; id: string; stages: string[]}> {
        const result = await this.requestJson(`/sequences/${sequenceId}/recipients`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                recipients: [
                    {
                        email,
                        variables: {
                            email,
                            name: name ?? "",
                        },
                    },
                ],
            }),
        })

        if (isErrored(result)) {
            return result
        }

        const parseResult = addRecipientsResponseSchema.safeParse(result.value)

        if (!parseResult.success) {
            console.error(
                JSON.stringify({
                    msg: "Failed to parse Mixmax recipients response",
                    error: parseResult.error.issues,
                })
            )
            return errored(unexpectedMixmaxError())
        }

        const firstRecipient = parseResult.data.recipients[0]

        if (!firstRecipient) {
            console.error(JSON.stringify({msg: "No recipients returned in Mixmax response"}))
            return errored(unexpectedMixmaxError())
        }

        if (firstRecipient.status === "error") {
            return errored([
                {
                    title: "Recipient error",
                    detail:
                        firstRecipient.errors?.join("; ") ??
                        "Mixmax could not add this recipient to the sequence.",
                    code: "RECIPIENT_ERROR",
                },
            ])
        }

        if (firstRecipient.status === "duplicated") {
            return errored([
                {
                    title: "Recipient duplicated",
                    detail: "This recipient was already added to the sequence and was skipped.",
                    code: "RECIPIENT_DUPLICATED",
                },
            ])
        }

        if (firstRecipient.status === "unsubscribed") {
            return errored([
                {
                    title: "Recipient unsubscribed",
                    detail: "This recipient has unsubscribed and was skipped.",
                    code: "RECIPIENT_UNSUBSCRIBED",
                },
            ])
        }

        const {id, stages} = firstRecipient
        if (id === undefined || stages === undefined) {
            console.error(
                JSON.stringify({
                    msg: "Mixmax success recipient missing id or stages",
                    recipient: firstRecipient,
                })
            )
            return errored(unexpectedMixmaxError())
        }

        return complete({
            email: firstRecipient.email,
            status: "success",
            id,
            stages,
        })
    }

    private async requestJson(path: string, options?: RequestInit): MixmaxResult<unknown> {
        const method = options?.method ?? "GET"
        const response = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: {
                "X-API-Token": this.token,
                ...options?.headers,
            },
        })

        const text = await response.text()
        const json = text ? safeParseJson(text) : undefined

        if (!response.ok) {
            const error = mixmaxErrorFromHttpResponse(response.status, json)
            if (error) {
                return errored([error])
            }

            console.error(
                JSON.stringify({
                    msg: "Mixmax request failed",
                    method,
                    path,
                    status: response.status,
                    status_text: response.statusText,
                    body: text.slice(0, 500),
                })
            )
            throw new Error(text || response.statusText)
        }

        return complete(json)
    }
}

function safeParseJson(text: string): unknown {
    try {
        return JSON.parse(text)
    } catch {
        return undefined
    }
}

function mixmaxErrorFromHttpResponse(status: number, json: unknown): MixmaxError | undefined {
    const detail = mixmaxHttpErrorMessage(json)
    if (!detail) return undefined

    return {
        title: mixmaxHttpErrorTitle(status),
        detail,
        code: mixmaxHttpErrorCode(status),
    }
}

function mixmaxHttpErrorMessage(body: unknown): string | undefined {
    if (body == null || typeof body !== "object") return undefined
    const message = (body as {message?: unknown}).message
    return typeof message === "string" && message.trim() !== "" ? message : undefined
}

function mixmaxHttpErrorTitle(status: number): string {
    switch (status) {
        case 401:
            return "Unauthorized"
        case 403:
            return "Forbidden"
        case 404:
            return "Invalid resource"
        default:
            return "Mixmax API error"
    }
}

function mixmaxHttpErrorCode(status: number): string {
    switch (status) {
        case 401:
            return "UNAUTHORIZED"
        case 403:
            return "FORBIDDEN"
        case 404:
            return "INVALID_RESOURCE"
        default:
            return "MIXMAX_API_ERROR"
    }
}
