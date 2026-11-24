/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransportMode = 'ROAD' | 'SEA' | 'RAIL' | 'AIR';

export type HubType = 'WAREHOUSE' | 'SEAPORT' | 'AIRPORT' | 'RAIL_STATION' | 'DESTINATION';

export type WorkshopRound = 1 | 2;

export type RiskScenarioType = 'NORMAL' | 'PORT_CONGESTION';

export type OfficialRouteKey = 'PA-A' | 'PA-B' | 'PA-C' | 'PA-D';

export type ExtendedTemplateKey =
  | 'EXT_MUNICH'
  | 'EXT_EURASIAN_RAIL'
  | 'EXT_ROTTERDAM_RAIL'
  | 'EXT_BANGKOK_AIR';

export type RouteTemplateKey = OfficialRouteKey | ExtendedTemplateKey | 'CUSTOM';

export type PricingBasis = 'WORKSHOP_QUOTE' | 'ESTIMATED';

export type TroubleCoverage = 'OFFICIAL' | 'ESTIMATED_PARTIAL' | 'UNMODELED';

export interface LocationHub {
  id: string;
  name: string;
  shortName: string;
  code: string;
  country: string;
  city: string;
  address: string;
  type: HubType;
  coordinates: [number, number]; // [lat, lng]
  avgHandlingHours: number;
  handlingCostPerTon: number;
  congestionProbability: number;
  allowedModes: TransportMode[];
}

export interface RouteLeg {
  id: string;
  fromHubId: string;
  toHubId: string;
  mode: TransportMode;
  distanceKm: number;
  baseDurationDays: number;
  baseCost: number;
  reliability: number;
  customsDelayRisk: number;
  pros?: string;
  cons?: string;
  troubleNote?: string;
}

export interface ChristmasCongestionSpec {
  affectedHubId?: string;
  affectedLegIndex?: number;
  incidentSummary: string;
  costFormulaLabel: string;
  extraCostUSD: number;
  extraDays: number;
  minDaysAfterTrouble: number;
  maxDaysAfterTrouble: number;
  deliveryRangeLabel: string;
  allInCostAfterTroubleUSD: number;
}

export interface RouteOption {
  id: string;
  code: string;
  name: string;
  notes: string;
  hubIds: string[];
  legs: RouteLeg[];
  isOfficial?: boolean;
  isCustom?: boolean;
  appliedTemplateKey?: RouteTemplateKey;
}

export interface CargoParams {
  commodityName: string;
  weightTons: number;
  boardCount: number;
  boardWeightKg: number;
  cartonCount: number;
  fullCartonCount: number;
  partialCartonCount: number;
  partialCartonBoards: number;
  cartonShellKg: number;
  palletCount: number;
  fullPalletCount: number;
  partialPalletCount: number;
  palletShellKg: number;
  netBoardWeightKg: number; // 3.000 kg
  cartonGrossWeightKg: number; // 3.107,2 kg
  palletGrossWeightKg: number; // 3.282,2 kg
  fullPalletHeightCm: number; // 139,4 cm
  partialPalletHeightCm: number; // 114,4 cm
  palletizedVolumeCBM: number; // 9,12768 m3 (~9,13 m3)
  cartonVolumetricWeightKg: number; // 1.167 kg (134 thùng rời / 6000)
  palletVolumetricWeightKg: number; // 1.521,28 kg (9,12768 m3 * 10^6 / 6000)
  desiredDaysRange: string; // "25–30 ngày"
  round1MaxDaysLimit: number; // 35 ngày
  round2MaxDaysLimit: number; // 30 ngày
  targetBudgetMinUSD: number; // 8.000
  targetBudgetMaxUSD: number; // 12.000
  emergencyMaxBudgetUSD: number; // 15.000
}

export interface LegValidationError {
  legIndex: number;
  message: string;
  fixHint: string;
}

export interface RouteValidationResult {
  isValid: boolean;
  globalErrors: string[];
  legErrors: Record<number, LegValidationError>;
  allErrors: string[];
}

export interface LegEvaluationResult {
  legId: string;
  legIndex: number;
  fromHub: LocationHub;
  toHub: LocationHub;
  mode: TransportMode;
  distanceKm: number;
  effectiveDurationDays: number;
  effectiveCostUSD: number;
  legReliability: number;
  hasTroubleImpact: boolean;
  troubleImpactNote?: string;
}

export interface HubEvaluationResult {
  hub: LocationHub;
  hubIndex: number;
  effectiveHandlingDays: number;
  effectiveCostUSD: number;
  includedInWorkshopQuote: boolean;
  hasTroubleImpact: boolean;
  troubleImpactNote?: string;
}

export type CommitmentStatusKind =
  | 'ON_TIME_SAVING'
  | 'ON_TIME_IN_BUDGET'
  | 'NEEDS_EMERGENCY_APPROVAL'
  | 'EXCEEDS_EMERGENCY_CAP'
  | 'MAY_BE_LATE'
  | 'INVALID_ROUTE';

export interface RouteEvaluation {
  route: RouteOption;
  validation: RouteValidationResult;
  matchedTemplateKey: RouteTemplateKey;
  pricingBasis: PricingBasis;
  troubleCoverage: TroubleCoverage;
  troubleCoverageNote: string;
  round: WorkshopRound;
  legs: LegEvaluationResult[];
  hubs: HubEvaluationResult[];
  shortModeSequence: string;
  fullItineraryLabel: string;
  transferCount: number;
  intermediateStopCount: number;
  hubModelLabel: string;
  transferPointsLabel: string;
  totalDistanceKm: number;
  pureTransitDays: number;
  totalHubHandlingDays: number;
  estimatedTransitDays: number;
  minExpectedDays: number;
  committedMaxDays: number;
  activeTimeRangeLabel: string;
  isRangeEstimate: boolean;
  baseCostUSD: number;
  pureFreightCostUSD: number;
  totalHubHandlingCostUSD: number;
  extraTroubleCostUSD: number;
  extraTroubleDays: number;
  totalCostUSD: number;
  costFormulaNote?: string;
  troubleIncidentSummary?: string;
  affectedLegIndex?: number;
  affectedHubId?: string;
  roundDaysLimit: number;
  daysMargin: number; // positive = early buffer, negative = late days
  budgetDeltaFromNormalUSD: number; // positive = remaining, negative = over 12k
  budgetDeltaFromEmergencyUSD: number; // positive = remaining under 15k, negative = over 15k
  meetsTimeLimit: boolean;
  meetsDesired30Days: boolean;
  meetsNormalBudget: boolean;
  isBudgetSaving: boolean;
  withinEmergencyBudget: boolean;
  exceedsRound1Max35: boolean;
  commitmentStatus: CommitmentStatusKind;
  commitmentBadgeLabel: string;
  commitmentSummary: string;
  dynamicPros: string[];
  dynamicCons: string[];
  routeReliability: number;
  reliabilityNote: string;
}

export interface RoundDecisionRecord {
  round: WorkshopRound;
  routeId: string;
  routeCode: string;
  routeName: string;
  committedMaxDays: number;
  activeTimeRangeLabel: string;
  totalCostUSD: number;
  reason: string;
  conditionsToConfirm: string;
  changeMindCondition?: string;
  actionType?: 'KEEP' | 'SWITCH';
  isConditionalProposal: boolean;
  savedAtIso: string;
}

export interface WorkshopSessionState {
  groupName: string;
  unlockedRound: WorkshopRound;
  viewingRound: WorkshopRound;
  viewingRouteId: string;
  round1Decision: RoundDecisionRecord | null;
  round2Decision: RoundDecisionRecord | null;
  customRoutes: RouteOption[];
  isDark: boolean;
  isFestive: boolean;
}
