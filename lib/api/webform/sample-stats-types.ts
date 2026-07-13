export type SampleStatsRow = {
  brand: string;
  model: string;
  count: number;
};

export type SampleStatsBuckets = {
  currentAction: SampleStatsRow[];
  lastAction: SampleStatsRow[];
  currentMonth: SampleStatsRow[];
  lastMonth: SampleStatsRow[];
};

export type SampleStatsRequestBody = {
  sample: {
    hostessCode: string;
    currentAction: string;
  };
};

export type SampleStatsResponse = {
  meta?: {
    id?: string;
    et?: number;
    bc?: string;
    ts?: string;
  };
  time?: {
    date?: string;
    timezone_type?: number;
    timezone?: string;
  };
  status?: {
    success?: boolean;
    code?: number;
  };
  data?: {
    sample?: SampleStatsBuckets;
    error?: string;
    details?: string;
  };
};

export const SAMPLE_STATS_FIELDS = [
  "currentAction",
  "lastAction",
  "currentMonth",
  "lastMonth",
] as const;

export type SampleStatsField = (typeof SAMPLE_STATS_FIELDS)[number];

export const GLO_TRACKED_MODELS = {
  hilo: "Hilo",
  hyperPro: "Hyper Pro",
  hiloPlus: "Hilo+",
} as const;

export type GloTrackedModelKey = keyof typeof GLO_TRACKED_MODELS;

export type SampleStatsGloCounts = Record<GloTrackedModelKey, number>;

export type SampleStatsFieldCounts = {
  glo: SampleStatsGloCounts;
  /** Suma count dla brandu Velo. (Nie odejmujemy już brandu Glo.) */
  veloNet: number;
};

export type SampleStatsCountsByField = Record<SampleStatsField, SampleStatsFieldCounts>;
