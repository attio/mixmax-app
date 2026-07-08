import type {AsyncResult} from "@attio/fetchable"

export type MixmaxError = {
    title: string
    detail: string
    code?: string
    id?: string
}

export type MixmaxResult<T = void> = AsyncResult<T, MixmaxError[]>

const MIXMAX_USER_LABEL = "Mixmax"

export function unexpectedMixmaxError(): MixmaxError[] {
    return [
        {
            title: "Unexpected error",
            detail: "An unexpected error occurred.",
        },
    ]
}

export function mixmaxApiErrorUserMessage(errors: MixmaxError[]): string {
    return mixmaxUserMessage(errors.map((error) => error.detail).join(" "))
}

function mixmaxUserMessage(message: string): string {
    return `${MIXMAX_USER_LABEL}: ${message}`
}
