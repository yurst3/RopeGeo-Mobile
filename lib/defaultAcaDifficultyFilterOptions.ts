import {
  AcaDifficultyFilterOptions,
  AcaRiskRating,
  AcaTechnicalRating,
  AcaTimeRating,
  AcaWaterRating,
  RiskMinMax,
  TechnicalMinMax,
  TimeMinMax,
  WaterMinMax,
} from "ropegeo-common/models";

/** Widest ACA ranges (matches “no difficulty constraint” when passed to the API). */
export function fullRangeAcaDifficultyFilterOptions(): AcaDifficultyFilterOptions {
  return new AcaDifficultyFilterOptions(
    new TechnicalMinMax(AcaTechnicalRating.One, AcaTechnicalRating.Four),
    new WaterMinMax(AcaWaterRating.A, AcaWaterRating.C4),
    new TimeMinMax(AcaTimeRating.I, AcaTimeRating.VI),
    new RiskMinMax(AcaRiskRating.G, AcaRiskRating.XX),
  );
}
