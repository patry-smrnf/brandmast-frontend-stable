import { ApiError } from "@/lib/api/errors";
import { apiFetch } from "@/lib/api/http";

import { getBrowserWebformApiBaseUrl } from "./base-url";
import { computeSampleStatsCountsByField } from "./sample-stats-utils";
import type {
  SampleStatsBuckets,
  SampleStatsCountsByField,
  SampleStatsRequestBody,
  SampleStatsResponse,
} from "./sample-stats-types";

export type FetchSampleStatsParams = {
  hostessCode: string;
  currentAction: string;
};

export type FetchSampleStatsResult = {
  buckets: SampleStatsBuckets;
  counts: SampleStatsCountsByField;
  raw: SampleStatsResponse;
};

const EMPTY_BUCKETS: SampleStatsBuckets = {
  currentAction: [],
  lastAction: [],
  currentMonth: [],
  lastMonth: [],
};

export async function fetchSampleStats(
  params: FetchSampleStatsParams,
): Promise<FetchSampleStatsResult> {
  const hostessCode = params.hostessCode.trim();
  const currentAction = params.currentAction.trim();

  if (!hostessCode || !currentAction) {
    throw new ApiError({
      message: "hostessCode i currentAction są wymagane do pobrania statystyk próbek.",
      status: 400,
    });
  }

  const body: SampleStatsRequestBody = {
    sample: { hostessCode, currentAction },
  };

  const raw = await apiFetch<SampleStatsResponse>("/sample/stats", {
    baseUrl: getBrowserWebformApiBaseUrl(),
    method: "POST",
    body,
  });

  if (raw.status?.success === false) {
    const details = raw.data?.details ?? raw.data?.error;
    throw new ApiError({
      message: details
        ? `Statystyki próbek: ${details}`
        : `Statystyki próbek nie powiodły się (kod ${raw.status?.code ?? "?"})`,
      status: raw.status?.code ?? 502,
      details: raw.data,
    });
  }

  const buckets: SampleStatsBuckets = {
    ...EMPTY_BUCKETS,
    ...(raw.data?.sample ?? {}),
  };

  return {
    buckets,
    counts: computeSampleStatsCountsByField(buckets),
    raw,
  };
}

export {
  computeSampleStatsCountsByField,
  computeSampleStatsFieldCounts,
  getGloCounts,
  getModelCount,
  getSampleStatsFieldCounts,
  getVeloNetTotal,
} from "./sample-stats-utils";

export {
  GLO_TRACKED_MODELS,
  SAMPLE_STATS_FIELDS,
  type SampleStatsBuckets,
  type SampleStatsCountsByField,
  type SampleStatsField,
  type SampleStatsFieldCounts,
  type SampleStatsGloCounts,
  type SampleStatsRow,
} from "./sample-stats-types";
