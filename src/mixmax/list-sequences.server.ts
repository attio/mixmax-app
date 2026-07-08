import {getMixmax} from "./get-mixmax"
import type {MixmaxResult} from "./types"

export default async function listSequences(): MixmaxResult<Array<{id: string; name: string}>> {
    return getMixmax().listSequences()
}
