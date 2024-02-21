import type {
    Chain,
    PublicClient,
    Transport,
} from "viem";

export type HardhatViemPublicClient = PublicClient<Transport, Chain>;