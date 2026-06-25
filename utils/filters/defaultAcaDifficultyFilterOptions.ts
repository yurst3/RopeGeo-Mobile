import {
  AcaDifficultyFilterOptions,
  AcaRiskSubRating,
  AcaTechnicalSubRating,
  AcaTimeSubRating,
  AcaWaterSubRating,
  RiskMinMax,
  TechnicalMinMax,
  TimeMinMax,
  WaterMinMax,
} from "ropegeo-common/models";

/** Widest ACA ranges (matches “no difficulty constraint” when passed to the API). */
export function fullRangeAcaDifficultyFilterOptions(): AcaDifficultyFilterOptions {
  return new AcaDifficultyFilterOptions(
    new TechnicalMinMax(AcaTechnicalSubRating.One, AcaTechnicalSubRating.Four),
    new WaterMinMax(AcaWaterSubRating.A, AcaWaterSubRating.C4),
    new TimeMinMax(AcaTimeSubRating.I, AcaTimeSubRating.VI),
    new RiskMinMax(AcaRiskSubRating.G, AcaRiskSubRating.XX),
  );
}
