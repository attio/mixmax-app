import {getUserConnection} from "attio/server"
import {MixmaxClient} from "./mixmax-client"

export function getMixmax(): MixmaxClient {
    return new MixmaxClient(getUserConnection().value)
}
