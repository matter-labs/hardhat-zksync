import type * as viemTypes from "viem";

export type PublicClient = viemTypes.PublicClient<
  viemTypes.Transport,
  viemTypes.Chain
>;