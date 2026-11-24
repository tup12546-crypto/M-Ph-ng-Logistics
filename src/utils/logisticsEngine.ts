/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CargoParams,
  CommitmentStatusKind,
  HubEvaluationResult,
  LegEvaluationResult,
  LegValidationError,
  LocationHub,
  OfficialRouteKey,
  RouteEvaluation,
  RouteLeg,
  RouteOption,
  RouteTemplateKey,
  RouteValidationResult,
  TransportMode,
  WorkshopRound
} from '../types/logistics';
import {
  DEFAULT_CARGO_PARAMS,
  EXTENDED_ROUTE_TEMPLATES,
  LOCATION_HUBS,
  OFFICIAL_ROUTE_KEYS,
  OFFICIAL_ROUTE_SPECS,
  round2
} from '../data/defaultData';

export function getHubById(hubId: string): LocationHub | undefined {
  return LOCATION_HUBS.find((h) => h.id === hubId);
}

export function getModeLabelVi(mode: TransportMode): string {
  switch (mode) {
    case 'ROAD':
      return 'Xe tải';
    case 'SEA':
      return 'Tàu biển';
    case 'RAIL':
      return 'Đường sắt';
    case 'AIR':
      return 'Máy bay';
  }
}

/**
 * Định dạng tiền USD theo chuẩn tiếng Việt:
 * - Số nguyên: 14545 -> "14.545"
 * - Có thập phân: 15171.8 -> "15.171,80", 14352.58 -> "14.352,58"
 */
export function formatWorkshopUSD(amount: number): string {
  const rounded = round2(amount);
  const hasDecimals = Math.abs(rounded - Math.round(rounded)) > 0.001;
  if (hasDecimals) {
    return rounded.toLocaleString('vi-VN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  return Math.round(rounded).toLocaleString('vi-VN');
}

export function formatNumberVi(value: number, maxFractionDigits = 1): string {
  return value.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits
  });
}

export function haversineDistanceKm(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(coord2[0] - coord1[0]);
  const dLon = toRad(coord2[1] - coord1[1]);
  const lat1 = toRad(coord1[0]);
  const lat2 = toRad(coord2[0]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const calculateHaversineKm = haversineDistanceKm;

interface VerifiedCorridorRate {
  distanceKm: number;
  baseDurationDays: number;
  baseCost3TonsUSD: number;
  reliability: number;
  customsDelayRisk: number;
}

const VERIFIED_CORRIDOR_RATES: Record<string, VerifiedCorridorRate> = {
  // Đường bộ tại Việt Nam & ASEAN
  'hub_vsip2_binhduong->hub_tan_son_nhat:ROAD': {
    distanceKm: 42,
    baseDurationDays: 0.4,
    baseCost3TonsUSD: 110,
    reliability: 0.98,
    customsDelayRisk: 0.02
  },
  'hub_vsip2_binhduong->hub_cat_lai:ROAD': {
    distanceKm: 68,
    baseDurationDays: 0.4,
    baseCost3TonsUSD: 110,
    reliability: 0.96,
    customsDelayRisk: 0.03
  },
  'hub_vsip2_binhduong->hub_song_than:ROAD': {
    distanceKm: 28,
    baseDurationDays: 0.2,
    baseCost3TonsUSD: 85,
    reliability: 0.98,
    customsDelayRisk: 0.01
  },
  'hub_vsip2_binhduong->hub_bangkok:ROAD': {
    distanceKm: 860,
    baseDurationDays: 2.0,
    baseCost3TonsUSD: 820,
    reliability: 0.91,
    customsDelayRisk: 0.08
  },

  // Đường bộ chuyển tải nội địa UAE (Cảng Jebel Ali -> Sân bay Dubai DXB)
  'hub_jebel_ali->hub_dubai:ROAD': {
    distanceKm: 42,
    baseDurationDays: 0.3,
    baseCost3TonsUSD: 220,
    reliability: 0.97,
    customsDelayRisk: 0.02
  },

  // Hàng không
  'hub_tan_son_nhat->hub_frankfurt:AIR': {
    distanceKm: 9646,
    baseDurationDays: 2.3,
    baseCost3TonsUSD: 13000,
    reliability: 0.94,
    customsDelayRisk: 0.03
  },
  'hub_tan_son_nhat->hub_singapore_air:AIR': {
    distanceKm: 1092,
    baseDurationDays: 1.5,
    baseCost3TonsUSD: 2700,
    reliability: 0.93,
    customsDelayRisk: 0.03
  },
  'hub_singapore_air->hub_frankfurt:AIR': {
    distanceKm: 10274,
    baseDurationDays: 3.5,
    baseCost3TonsUSD: 9800,
    reliability: 0.88,
    customsDelayRisk: 0.06
  },
  'hub_dubai->hub_frankfurt:AIR': {
    distanceKm: 4840,
    baseDurationDays: 1.3,
    baseCost3TonsUSD: 5000,
    reliability: 0.96,
    customsDelayRisk: 0.02
  },
  'hub_tan_son_nhat->hub_munich_airport:AIR': {
    distanceKm: 9610,
    baseDurationDays: 2.3,
    baseCost3TonsUSD: 12800,
    reliability: 0.95,
    customsDelayRisk: 0.03
  },
  'hub_bangkok->hub_frankfurt:AIR': {
    distanceKm: 8990,
    baseDurationDays: 2.1,
    baseCost3TonsUSD: 11200,
    reliability: 0.93,
    customsDelayRisk: 0.04
  },

  // Đường biển
  'hub_cat_lai->hub_hamburg:SEA': {
    distanceKm: 16260,
    baseDurationDays: 28.5,
    baseCost3TonsUSD: 1410,
    reliability: 0.72,
    customsDelayRisk: 0.08
  },
  'hub_cat_lai->hub_jebel_ali:SEA': {
    distanceKm: 6834,
    baseDurationDays: 12.8,
    baseCost3TonsUSD: 2306,
    reliability: 0.91,
    customsDelayRisk: 0.04
  },
  'hub_cat_lai->hub_rotterdam:SEA': {
    distanceKm: 15820,
    baseDurationDays: 27.0,
    baseCost3TonsUSD: 1380,
    reliability: 0.76,
    customsDelayRisk: 0.07
  },

  // Đường sắt
  'hub_song_than->hub_almaty_rail:RAIL': {
    distanceKm: 5650,
    baseDurationDays: 7.5,
    baseCost3TonsUSD: 2250,
    reliability: 0.91,
    customsDelayRisk: 0.05
  },
  'hub_almaty_rail->hub_duisburg:RAIL': {
    distanceKm: 5450,
    baseDurationDays: 7.5,
    baseCost3TonsUSD: 2350,
    reliability: 0.9,
    customsDelayRisk: 0.06
  },
  'hub_rotterdam->hub_duisburg:RAIL': {
    distanceKm: 225,
    baseDurationDays: 0.6,
    baseCost3TonsUSD: 320,
    reliability: 0.96,
    customsDelayRisk: 0.02
  },

  // Chặng cuối tại Đức về Stuttgart (DESTR)
  'hub_frankfurt->hub_stuttgart_iriso:ROAD': {
    distanceKm: 205,
    baseDurationDays: 0.5,
    baseCost3TonsUSD: 895,
    reliability: 0.98,
    customsDelayRisk: 0.02
  },
  'hub_hamburg->hub_stuttgart_iriso:ROAD': {
    distanceKm: 655,
    baseDurationDays: 1.0,
    baseCost3TonsUSD: 575,
    reliability: 0.93,
    customsDelayRisk: 0.03
  },
  'hub_duisburg->hub_stuttgart_iriso:ROAD': {
    distanceKm: 410,
    baseDurationDays: 0.7,
    baseCost3TonsUSD: 520,
    reliability: 0.95,
    customsDelayRisk: 0.02
  },
  'hub_munich_airport->hub_stuttgart_iriso:ROAD': {
    distanceKm: 215,
    baseDurationDays: 0.5,
    baseCost3TonsUSD: 480,
    reliability: 0.98,
    customsDelayRisk: 0.01
  }
};

export function calculateRealisticLegMetrics(
  fromHub: LocationHub,
  toHub: LocationHub,
  mode: TransportMode
): Omit<RouteLeg, 'id'> {
  const key = `${fromHub.id}->${toHub.id}:${mode}`;
  const exact = VERIFIED_CORRIDOR_RATES[key];
  if (exact) {
    return {
      fromHubId: fromHub.id,
      toHubId: toHub.id,
      mode,
      distanceKm: exact.distanceKm,
      baseDurationDays: exact.baseDurationDays,
      baseCost: exact.baseCost3TonsUSD,
      reliability: exact.reliability,
      customsDelayRisk: exact.customsDelayRisk
    };
  }

  const gcDist = Math.max(25, haversineDistanceKm(fromHub.coordinates, toHub.coordinates));

  switch (mode) {
    case 'AIR': {
      const distanceKm = Math.round(gcDist * 1.03);
      const flightDays = distanceKm / (860 * 24);
      const terminalPrepDays = distanceKm > 3000 ? 1.0 : 0.6;
      const baseDurationDays = Number(Math.max(0.8, flightDays + terminalPrepDays).toFixed(1));
      const baseCost = Math.round(650 + distanceKm * 1.15);
      return {
        fromHubId: fromHub.id,
        toHubId: toHub.id,
        mode,
        distanceKm,
        baseDurationDays,
        baseCost,
        reliability: 0.94,
        customsDelayRisk: 0.03
      };
    }
    case 'SEA': {
      const distanceKm = Math.round(gcDist * 1.48);
      const sailingDays = distanceKm / 600;
      const baseDurationDays = Number(Math.max(2.0, sailingDays + 0.8).toFixed(1));
      const baseCost = Math.round(350 + distanceKm * 0.095);
      return {
        fromHubId: fromHub.id,
        toHubId: toHub.id,
        mode,
        distanceKm,
        baseDurationDays,
        baseCost,
        reliability: 0.82,
        customsDelayRisk: 0.06
      };
    }
    case 'RAIL': {
      const distanceKm = Math.round(gcDist * 1.24);
      const railDays = distanceKm / 710;
      const baseDurationDays = Number(Math.max(0.5, railDays + 0.3).toFixed(1));
      const baseCost = Math.round(280 + distanceKm * 0.38);
      return {
        fromHubId: fromHub.id,
        toHubId: toHub.id,
        mode,
        distanceKm,
        baseDurationDays,
        baseCost,
        reliability: 0.92,
        customsDelayRisk: 0.05
      };
    }
    case 'ROAD':
    default: {
      const distanceKm = Math.round(gcDist * 1.22);
      const roadDays = distanceKm / 550;
      const baseDurationDays = Number(Math.max(0.2, roadDays).toFixed(1));
      const baseCost = Math.round(95 + distanceKm * 0.95);
      return {
        fromHubId: fromHub.id,
        toHubId: toHub.id,
        mode,
        distanceKm,
        baseDurationDays,
        baseCost,
        reliability: 0.96,
        customsDelayRisk: 0.03
      };
    }
  }
}

/**
 * Khớp hành trình thực tế (hubIds + modes) với 4 tuyến chuẩn của đề hoặc 4 mẫu mở rộng.
 * Nhờ tách biệt hoàn toàn mã bản sao (code/name) với hành trình thực tế, khi bản sao PA-5
 * áp mẫu C (hoặc A/B/D), nó tự động nhận đúng dữ liệu, thời gian, giá và sự cố của mẫu đó!
 */
export function matchRouteTemplate(
  hubIds: string[],
  modes: TransportMode[]
): RouteTemplateKey {
  for (const key of OFFICIAL_ROUTE_KEYS) {
    const spec = OFFICIAL_ROUTE_SPECS[key];
    if (
      spec.hubIds.length === hubIds.length &&
      spec.modes.length === modes.length &&
      spec.hubIds.every((id, idx) => id === hubIds[idx]) &&
      spec.modes.every((m, idx) => m === modes[idx])
    ) {
      return key;
    }
  }

  for (const ext of EXTENDED_ROUTE_TEMPLATES) {
    if (
      ext.hubIds.length === hubIds.length &&
      ext.modes.length === modes.length &&
      ext.hubIds.every((id, idx) => id === hubIds[idx]) &&
      ext.modes.every((m, idx) => m === modes[idx])
    ) {
      return ext.key;
    }
  }

  return 'CUSTOM';
}

export function isOfficialKey(key: RouteTemplateKey): key is OfficialRouteKey {
  return key === 'PA-A' || key === 'PA-B' || key === 'PA-C' || key === 'PA-D';
}

/**
 * Tạo mảng legs đồng bộ từ hubIds & modes (gắn ưu/nhược điểm chặng nếu khớp tuyến chuẩn)
 */
export function buildLegsForSequence(
  routeId: string,
  hubIds: string[],
  modes: TransportMode[]
): RouteLeg[] {
  const matched = matchRouteTemplate(hubIds, modes);
  const officialSpec = isOfficialKey(matched) ? OFFICIAL_ROUTE_SPECS[matched] : null;

  const legs: RouteLeg[] = [];
  for (let i = 0; i < hubIds.length - 1; i++) {
    const fromH = getHubById(hubIds[i]);
    const toH = getHubById(hubIds[i + 1]);
    const mode = modes[i] || 'ROAD';

    if (!fromH || !toH) {
      legs.push({
        id: `${routeId}_leg_${i + 1}`,
        fromHubId: hubIds[i],
        toHubId: hubIds[i + 1],
        mode,
        distanceKm: 0,
        baseDurationDays: 0,
        baseCost: 0,
        reliability: 0.5,
        customsDelayRisk: 0.1
      });
      continue;
    }

    const metrics = calculateRealisticLegMetrics(fromH, toH, mode);
    const officialLegInfo = officialSpec?.legProsCons[i];

    legs.push({
      id: `${routeId}_leg_${i + 1}`,
      ...metrics,
      pros: officialLegInfo?.pros,
      cons: officialLegInfo?.cons,
      troubleNote: officialLegInfo?.troubleNote
    });
  }
  return legs;
}

export function createOfficialRoutes(): RouteOption[] {
  return OFFICIAL_ROUTE_KEYS.map((key) => {
    const spec = OFFICIAL_ROUTE_SPECS[key];
    const id = `route_${key.toLowerCase().replace('-', '_')}`;
    return {
      id,
      code: spec.code,
      name: spec.name,
      notes: spec.notes,
      hubIds: [...spec.hubIds],
      legs: buildLegsForSequence(id, spec.hubIds, spec.modes),
      isOfficial: true,
      isCustom: false,
      appliedTemplateKey: key
    };
  });
}

export const DEFAULT_ROUTES: RouteOption[] = createOfficialRoutes();

/**
 * Tạo bản sao tuyến nhóm thử sạch sẽ (không giữ dữ liệu cũ ẩn sau khi đổi mẫu)
 */
export function createCustomRouteClone(
  sourceRoute: RouteOption,
  nextNumber: number
): RouteOption {
  const newId = `route_custom_${Date.now()}_${nextNumber}`;
  const modes = sourceRoute.legs.map((l) => l.mode);
  const matched = matchRouteTemplate(sourceRoute.hubIds, modes);
  return {
    id: newId,
    code: `PA-${nextNumber}`,
    name: `Tuyến thử #${nextNumber} (từ ${sourceRoute.code})`,
    notes: sourceRoute.notes,
    hubIds: [...sourceRoute.hubIds],
    legs: buildLegsForSequence(newId, sourceRoute.hubIds, modes),
    isOfficial: false,
    isCustom: true,
    appliedTemplateKey: matched
  };
}

/**
 * Áp một mẫu (4 tuyến chuẩn hoặc 4 mẫu mở rộng) lên tuyến tùy chỉnh đang sửa.
 * QUAN TRỌNG (sửa P0-1 & P0-2):
 * - Giữ nguyên id, code (ví dụ PA-5) và không mang bất kỳ khoảng ngày, mô hình hub,
 *   lời bình hay sự cố của tuyến trước đó sang.
 * - Có thể giữ nguyên tên do người chơi đã tự đặt nếu preserveUserLabel = true.
 */
export function applyTemplateToCustomRoute(
  targetRoute: RouteOption,
  templateKey: OfficialRouteKey | (typeof EXTENDED_ROUTE_TEMPLATES)[number]['key'],
  preserveUserName = false
): RouteOption {
  let hubIds: string[];
  let modes: TransportMode[];
  let defaultName: string;
  let defaultNotes: string;

  if (isOfficialKey(templateKey)) {
    const spec = OFFICIAL_ROUTE_SPECS[templateKey];
    hubIds = [...spec.hubIds];
    modes = [...spec.modes];
    defaultName = `${targetRoute.code} (theo ${spec.code}: ${spec.hubIds
      .map((id) => getHubById(id)?.shortName || id)
      .join(' → ')})`;
    defaultNotes = spec.notes;
  } else {
    const ext = EXTENDED_ROUTE_TEMPLATES.find((t) => t.key === templateKey)!;
    hubIds = [...ext.hubIds];
    modes = [...ext.modes];
    defaultName = ext.name;
    defaultNotes = ext.notes;
  }

  return {
    ...targetRoute,
    name: preserveUserName ? targetRoute.name : defaultName,
    notes: preserveUserName ? targetRoute.notes : defaultNotes,
    hubIds,
    legs: buildLegsForSequence(targetRoute.id, hubIds, modes),
    appliedTemplateKey: templateKey
  };
}

/**
 * Tạo gợi ý sửa lỗi rõ ràng ngay tại chặng vi phạm hạ tầng (sửa P0-3)
 */
function buildFixHint(fromHub: LocationHub, toHub: LocationHub, mode: TransportMode): string {
  if (fromHub.id === toHub.id) {
    return `Đổi một trong hai điểm dừng hoặc xóa bớt điểm trùng (${fromHub.shortName}).`;
  }

  const sharedModes = fromHub.allowedModes.filter((m) => toHub.allowedModes.includes(m));
  if (sharedModes.length > 0) {
    const suggested = sharedModes.map(getModeLabelVi).join(' hoặc ');
    return `Hai điểm này hỗ trợ chung: ${suggested}. Hãy chuyển chặng sang ${suggested}.`;
  }

  if (fromHub.type === 'WAREHOUSE' && mode === 'SEA') {
    const portHint =
      fromHub.id === 'hub_vsip_bacninh' ? 'Cảng Hải Phòng (HPH)' : 'Cảng Cái Mép – Thị Vải (VNVUT)';
    return `Kho chưa có cảng biển. Hãy dùng Xe tải đưa hàng ra ${portHint} trước, sau đó mới đi Tàu biển.`;
  }

  if (fromHub.type === 'WAREHOUSE' && mode === 'AIR') {
    const airHint =
      fromHub.id === 'hub_vsip_bacninh' ? 'Sân bay Nội Bài (HAN)' : 'Sân bay Tân Sơn Nhất (SGN)';
    return `Kho chưa có sân bay. Hãy dùng Xe tải đưa hàng ra ${airHint} trước.`;
  }

  if (fromHub.type === 'WAREHOUSE' && mode === 'RAIL') {
    const railHint =
      fromHub.id === 'hub_vsip_bacninh' ? 'Ga Yên Viên' : 'Ga Sóng Thần';
    return `Kho chưa có ga đường sắt. Hãy dùng Xe tải đưa hàng ra ${railHint} trước.`;
  }

  return `Kiểm tra lại điểm đi (${fromHub.shortName}) hoặc điểm đến (${toHub.shortName}) để chọn phương thức tương thích giữa hai đầu chặng.`;
}

export function validateRoute(route: RouteOption): RouteValidationResult {
  const globalErrors: string[] = [];
  const legErrors: Record<number, LegValidationError> = {};

  if (!route.hubIds || route.hubIds.length < 2) {
    globalErrors.push('Lộ trình cần tối thiểu 2 điểm (Kho xuất phát và Kho nhận hàng Stuttgart).');
    return { isValid: false, globalErrors, legErrors, allErrors: [...globalErrors] };
  }

  const firstHub = getHubById(route.hubIds[0]);
  const lastHub = getHubById(route.hubIds[route.hubIds.length - 1]);

  if (!firstHub || firstHub.type !== 'WAREHOUSE') {
    globalErrors.push('Điểm xuất phát đầu tiên phải là kho nhà máy tại Việt Nam.');
  }

  if (!lastHub || lastHub.type !== 'DESTINATION') {
    globalErrors.push('Điểm kết thúc phải là kho nhà máy nhận hàng tại Stuttgart (DESTR).');
  }

  if (route.legs.length !== route.hubIds.length - 1) {
    globalErrors.push('Số chặng vận chuyển chưa khớp với danh sách điểm dừng.');
  }

  route.legs.forEach((leg, index) => {
    const fromHub = getHubById(leg.fromHubId);
    const toHub = getHubById(leg.toHubId);

    if (!fromHub || !toHub) {
      legErrors[index] = {
        legIndex: index,
        message: `Chặng ${index + 1}: Không tìm thấy điểm đi hoặc điểm đến.`,
        fixHint: 'Chọn lại điểm dừng hợp lệ từ danh sách.'
      };
      return;
    }

    if (fromHub.id === toHub.id) {
      legErrors[index] = {
        legIndex: index,
        message: `Chặng ${index + 1}: Điểm đi và điểm đến trùng nhau (${fromHub.shortName}).`,
        fixHint: buildFixHint(fromHub, toHub, leg.mode)
      };
      return;
    }

    const fromAllows = fromHub.allowedModes.includes(leg.mode);
    const toAllows = toHub.allowedModes.includes(leg.mode);

    if (!fromAllows || !toAllows) {
      const missingParts: string[] = [];
      if (!fromAllows) {
        missingParts.push(`${fromHub.shortName} chưa có hạ tầng ${getModeLabelVi(leg.mode)}`);
      }
      if (!toAllows) {
        missingParts.push(`${toHub.shortName} chưa có hạ tầng ${getModeLabelVi(leg.mode)}`);
      }
      legErrors[index] = {
        legIndex: index,
        message: `Chặng ${index + 1}: ${missingParts.join('; ')}.`,
        fixHint: buildFixHint(fromHub, toHub, leg.mode)
      };
    }
  });

  const allErrors = [
    ...globalErrors,
    ...Object.values(legErrors).map((e) => `${e.message} ${e.fixHint}`)
  ];

  return {
    isValid: allErrors.length === 0,
    globalErrors,
    legErrors,
    allErrors
  };
}

function buildDynamicProsAndCons(
  matchedKey: RouteTemplateKey,
  round: WorkshopRound,
  _totalCostUSD: number,
  activeTimeRangeLabel: string,
  _committedMaxDays: number,
  _roundDaysLimit: number,
  _meetsNormalBudget: boolean,
  _withinEmergencyBudget: boolean,
  legs: RouteLeg[]
): { dynamicPros: string[]; dynamicCons: string[] } {
  if (matchedKey === 'PA-A') {
    if (round === 1) {
      return {
        dynamicPros: [
          `Thời gian vận chuyển ngắn nhất (${activeTimeRangeLabel}), bay thẳng không dừng trung chuyển quốc tế.`,
          'Ít điểm bốc dỡ (Sân bay Tân Sơn Nhất → Frankfurt), hạn chế rủi ro va chạm bo mạch.'
        ],
        dynamicCons: [
          'Cước vận tải hàng không trực tiếp ở mức cao nhất trong 4 tuyến.',
          'Phụ thuộc tải trọng khoang bay thẳng, dễ bị tách lô vào mùa cao điểm.'
        ]
      };
    }
    return {
      dynamicPros: [
        `Không phải nối chuyến hàng không qua điểm trung chuyển thứ ba (khung giao đủ 7 pallet: ${activeTimeRangeLabel}).`,
        'Ít chặng vận chuyển (3 chặng), hạn chế khâu bốc dỡ hàng điện tử.'
      ],
      dynamicCons: [
        '3 pallet đầy bị lùi chuyến 7 ngày do thiếu chỗ bay thẳng, phát sinh lưu kho và phí tách lô (+626,80 USD).',
        'Lô hàng bị chia làm 2 đợt trong khi nhà máy chỉ tính hoàn tất khi nhận đủ cả 7 pallet.'
      ]
    };
  }

  if (matchedKey === 'PA-B') {
    if (round === 1) {
      return {
        dynamicPros: [
          `Thời gian vận chuyển nhanh (${activeTimeRangeLabel}), tần suất chuyến bay nối chuyến qua Singapore cao.`,
          'Mức cước hàng không nối chuyến thấp hơn phương án bay thẳng.'
        ],
        dynamicCons: [
          'Phát sinh thêm một điểm trung chuyển quốc tế tại sân bay Changi (Singapore).',
          'Phụ thuộc lịch nối chuyến giữa 2 chặng bay, có rủi ro lưu kho khi sân bay đông.'
        ]
      };
    }
    return {
      dynamicPros: [
        `Khung giao đủ 7 pallet sau sự cố là ${activeTimeRangeLabel}, giữ nguyên lợi thế tần suất bay lớn qua Singapore.`,
        'Cả 7 pallet đi cùng nhau sau khi nối chuyến, không bị tách lô như bay thẳng.'
      ],
      dynamicCons: [
        'Chờ nối chuyến tại Singapore 3 ngày (lưu kho tính trên 3.282,2 kg cả pallet) và thêm 1 ngày đổi lịch xe tại Đức.',
        'Phát sinh phụ phí lưu kho và điều chỉnh xe giao nội địa Đức (+352,58 USD).'
      ]
    };
  }

  if (matchedKey === 'PA-C') {
    if (round === 1) {
      return {
        dynamicPros: [
          'Mức cước đường biển thẳng Cái Mép – Thị Vải → Hamburg thấp nhất trong 4 tuyến.',
          'Chỉ gồm 3 chặng, đi tàu biển trực tiếp không phải chuyển tải giữa hành trình biển.'
        ],
        dynamicCons: [
          `Hành trình biển kéo dài (${activeTimeRangeLabel}), dễ chịu ảnh hưởng bởi lịch tàu và ùn tắc cảng biển.`,
          'Chặng xe tải nội địa Đức từ cảng Hamburg về kho Stuttgart dài (~655 km).'
        ]
      };
    }
    return {
      dynamicPros: [
        'Mức phụ phí phát sinh do cao điểm Giáng sinh thấp (+195 USD: lưu bãi 75 USD + đổi lịch xe 120 USD).',
        'Không phát sinh thêm điểm trung chuyển quốc tế mới.'
      ],
      dynamicCons: [
        `Cảng Hamburg ùn tắc làm kéo dài khung giao lên ${activeTimeRangeLabel} (chậm thêm 1 ngày).`,
        'Cần xác nhận lịch tàu thực tế và thời gian thông quan/giao xe từ Hamburg về Stuttgart.'
      ]
    };
  }

  if (matchedKey === 'PA-D') {
    if (round === 1) {
      return {
        dynamicPros: [
          `Kết hợp tàu biển và hàng không qua Dubai giúp rút ngắn thời gian còn ${activeTimeRangeLabel} so với đi biển hoàn toàn.`,
          'Tránh hành trình biển kéo dài qua Kênh đào Suez lên Bắc Âu bằng chặng bay Dubai → Frankfurt.'
        ],
        dynamicCons: [
          'Gồm 5 chặng, cần điều phối chặt khâu rút hàng và chuyển tải nội địa giữa cảng Jebel Ali và sân bay Dubai (DXB).',
          'Mức cước cao hơn đường biển thuần túy do có chặng hàng không quốc tế.'
        ]
      };
    }
    return {
      dynamicPros: [
        `Giữ được lợi thế kết hợp Biển – Hàng không với khung giao đủ 7 pallet là ${activeTimeRangeLabel}.`,
        'Phụ phí phát sinh tại UAE (+212 USD) chủ yếu nằm ở khâu lưu kho ngắn và điều xe nội địa.'
      ],
      dynamicCons: [
        'Phát sinh chờ xe chuyển cảng Jebel Ali → sân bay Dubai thêm 2 ngày (+112 USD lưu kho, +100 USD điều lại xe).',
        'Cần phối hợp đồng bộ giờ rút hàng cảng và giờ cắt máng (cut-off) chuyến bay DXB → FRA.'
      ]
    };
  }

  // Tuyến mở rộng / Tự thiết kế
  const dynamicPros: string[] = [];
  const dynamicCons: string[] = [];
  const hasAir = legs.some((l) => l.mode === 'AIR');
  const hasSea = legs.some((l) => l.mode === 'SEA');
  const hasRail = legs.some((l) => l.mode === 'RAIL');

  if (hasRail) {
    dynamicPros.push('Khai thác hành lang đường sắt giúp cân bằng giữa tốc độ và cước vận chuyển.');
  }
  if (hasAir && !hasSea) {
    dynamicPros.push('Tận dụng vận tải hàng không giúp rút ngắn thời gian xuyên lục địa.');
  }
  if (hasSea) {
    dynamicPros.push('Sử dụng tàu biển giúp giảm mạnh cước vận chuyển chặng dài.');
  }
  if (dynamicPros.length === 0) {
    dynamicPros.push(`Cấu hình tuyến gồm ${legs.length} chặng, linh hoạt điều chỉnh điểm trung chuyển.`);
  }

  dynamicCons.push(
    'Số liệu thời gian và chi phí là giá ước tính từ cước chặng + phí xử lý nút, chưa có báo giá chính thức từ hãng.'
  );
  if (round === 2) {
    dynamicCons.push(
      'Tuyến mở rộng/tự thiết kế chưa có bộ phụ phí cao điểm Giáng sinh cố định trong phiếu workshop.'
    );
  }

  return { dynamicPros, dynamicCons };
}

/**
 * Nguồn tính toán duy nhất (Single Source of Truth) cho thẻ, bảng so sánh, bản đồ, trình thiết kế & tóm tắt.
 */
export function evaluateRoute(
  route: RouteOption,
  cargo: CargoParams = DEFAULT_CARGO_PARAMS,
  round: WorkshopRound = 1
): RouteEvaluation {
  const validation = validateRoute(route);
  const modes = route.legs.map((l) => l.mode);
  const matchedTemplateKey = matchRouteTemplate(route.hubIds, modes);
  const officialSpec = isOfficialKey(matchedTemplateKey)
    ? OFFICIAL_ROUTE_SPECS[matchedTemplateKey]
    : null;

  const isRound2 = round === 2;
  const roundDaysLimit = isRound2 ? cargo.round2MaxDaysLimit : cargo.round1MaxDaysLimit;
  const weightFactor = cargo.weightTons / 3;

  let totalDistanceKm = 0;
  let pureTransitDays = 0;
  let totalHubHandlingDays = 0;
  let pureFreightCostUSD = 0;
  let totalHubHandlingCostUSD = 0;
  let combinedReliability = 1.0;

  const legResults: LegEvaluationResult[] = route.legs.map((leg, idx) => {
    const fromHub = getHubById(leg.fromHubId) || LOCATION_HUBS[0];
    const toHub = getHubById(leg.toHubId) || LOCATION_HUBS[LOCATION_HUBS.length - 1];
    const effectiveCostUSD = round2(leg.baseCost * weightFactor);
    const effectiveDurationDays = round2(leg.baseDurationDays);

    totalDistanceKm += leg.distanceKm;
    pureTransitDays += effectiveDurationDays;
    pureFreightCostUSD += effectiveCostUSD;
    combinedReliability *= leg.reliability;

    const hasTroubleImpact =
      isRound2 &&
      officialSpec !== null &&
      officialSpec.christmasTrouble.affectedLegIndex === idx;

    return {
      legId: leg.id,
      legIndex: idx,
      fromHub,
      toHub,
      mode: leg.mode,
      distanceKm: leg.distanceKm,
      effectiveDurationDays,
      effectiveCostUSD,
      legReliability: leg.reliability,
      hasTroubleImpact,
      troubleImpactNote: hasTroubleImpact
        ? officialSpec?.christmasTrouble.incidentSummary
        : undefined
    };
  });

  const hubResults: HubEvaluationResult[] = route.hubIds.map((hubId, idx) => {
    const hub = getHubById(hubId) || LOCATION_HUBS[0];
    const effectiveHandlingDays = round2(hub.avgHandlingHours / 24);
    const effectiveCostUSD = round2(hub.handlingCostPerTon * cargo.weightTons);

    totalHubHandlingDays += effectiveHandlingDays;
    totalHubHandlingCostUSD += effectiveCostUSD;
    combinedReliability *= Math.max(0.75, 1 - hub.congestionProbability * 0.25);

    const hasTroubleImpact =
      isRound2 &&
      officialSpec !== null &&
      officialSpec.christmasTrouble.affectedHubId === hub.id;

    return {
      hub,
      hubIndex: idx,
      effectiveHandlingDays,
      effectiveCostUSD,
      includedInWorkshopQuote: officialSpec !== null,
      hasTroubleImpact,
      troubleImpactNote: hasTroubleImpact
        ? officialSpec?.christmasTrouble.incidentSummary
        : undefined
    };
  });

  const estimatedTransitDays = Number((pureTransitDays + totalHubHandlingDays).toFixed(1));
  const rawEstimatedCost = round2(pureFreightCostUSD + totalHubHandlingCostUSD);

  // Tách bạch báo giá trọn gói Workshop (4 tuyến A/B/C/D) vs giá ước tính tự thiết kế
  let pricingBasis: 'WORKSHOP_QUOTE' | 'ESTIMATED' = 'ESTIMATED';
  let troubleCoverage: 'OFFICIAL' | 'ESTIMATED_PARTIAL' | 'UNMODELED' = 'UNMODELED';
  let troubleCoverageNote = 'Chưa có kịch bản Giáng sinh cho tuyến này (mới tính cước chặng & phí xử lý nút, chưa tính phụ phí ùn tắc).';

  let baseCostUSD = rawEstimatedCost;
  let extraTroubleCostUSD = 0;
  let extraTroubleDays = 0;
  let totalCostUSD = rawEstimatedCost;

  let minExpectedDays = Math.max(1, Math.floor(estimatedTransitDays));
  let committedMaxDays = Math.max(minExpectedDays, Math.ceil(estimatedTransitDays));
  let activeTimeRangeLabel = `${formatNumberVi(estimatedTransitDays, 1)} ngày (ước tính)`;
  let isRangeEstimate = false;
  let costFormulaNote: string | undefined;
  let troubleIncidentSummary: string | undefined;
  let affectedLegIndex: number | undefined;
  let affectedHubId: string | undefined;

  if (officialSpec) {
    pricingBasis = 'WORKSHOP_QUOTE';
    troubleCoverage = 'OFFICIAL';
    baseCostUSD = officialSpec.baseAllInCostUSD;
    isRangeEstimate = true;

    if (isRound2) {
      const tr = officialSpec.christmasTrouble;
      extraTroubleCostUSD = tr.extraCostUSD;
      extraTroubleDays = tr.extraDays;
      totalCostUSD = tr.allInCostAfterTroubleUSD;
      minExpectedDays = tr.minDaysAfterTrouble;
      committedMaxDays = tr.maxDaysAfterTrouble;
      activeTimeRangeLabel = tr.deliveryRangeLabel;
      costFormulaNote = tr.costFormulaLabel;
      troubleIncidentSummary = tr.incidentSummary;
      affectedLegIndex = tr.affectedLegIndex;
      affectedHubId = tr.affectedHubId;
      troubleCoverageNote = `Kịch bản chuẩn Vòng 2: ${tr.costFormulaLabel}`;
    } else {
      totalCostUSD = officialSpec.baseAllInCostUSD;
      minExpectedDays = officialSpec.minExpectedDays;
      committedMaxDays = officialSpec.maxExpectedDays;
      activeTimeRangeLabel = officialSpec.expectedTimeRange;
      troubleCoverageNote = 'Báo giá trọn gói chuẩn Workshop (đã bao gồm phí xử lý bình thường tại các nút).';
    }
  } else {
    // Tuyến mở rộng hoặc tự thiết kế
    pricingBasis = 'ESTIMATED';
    if (!isRound2) {
      troubleCoverage = 'UNMODELED';
      troubleCoverageNote =
        'Giá ước tính = Tổng cước các chặng + Phí xử lý bình thường tại các điểm dừng.';
    } else {
      // Kiểm tra xem tuyến tự thiết kế có đi qua điểm sự cố cụ thể hay không
      const passesHamburgSea =
        route.hubIds.includes('hub_hamburg') && modes.includes('SEA');
      const passesJebelAliToDxb = route.legs.some(
        (l) => l.fromHubId === 'hub_jebel_ali' && l.toHubId === 'hub_dubai'
      );
      const passesSinAir =
        route.hubIds.includes('hub_singapore_air') && modes.includes('AIR');

      if (passesHamburgSea || passesJebelAliToDxb || passesSinAir) {
        troubleCoverage = 'ESTIMATED_PARTIAL';
        const notes: string[] = [];
        if (passesHamburgSea) {
          extraTroubleDays += 1;
          extraTroubleCostUSD = round2(extraTroubleCostUSD + 195);
          notes.push('Cảng Hamburg chậm 1 ngày (+195 USD)');
        }
        if (passesJebelAliToDxb) {
          extraTroubleDays += 2;
          extraTroubleCostUSD = round2(extraTroubleCostUSD + 212);
          notes.push('Chuyển tải Jebel Ali → DXB chậm 2 ngày (+212 USD)');
        }
        if (passesSinAir) {
          extraTroubleDays += 4;
          extraTroubleCostUSD = round2(extraTroubleCostUSD + 352.58);
          notes.push('Nối chuyến Singapore chậm 3 ngày + đổi xe 1 ngày (+352,58 USD)');
        }
        totalCostUSD = round2(baseCostUSD + extraTroubleCostUSD);
        committedMaxDays = Math.ceil(estimatedTransitDays + extraTroubleDays);
        minExpectedDays = Math.floor(estimatedTransitDays + extraTroubleDays);
        activeTimeRangeLabel = `${formatNumberVi(estimatedTransitDays + extraTroubleDays, 1)} ngày (ước tính)`;
        troubleIncidentSummary = `Áp phụ phí theo các điểm bị ảnh hưởng: ${notes.join('; ')}.`;
        costFormulaNote = `${formatWorkshopUSD(baseCostUSD)} + ${formatWorkshopUSD(extraTroubleCostUSD)} = ${formatWorkshopUSD(totalCostUSD)} USD`;
        troubleCoverageNote =
          'Áp phụ phí từng phần cho các điểm có dữ liệu sự cố; các chặng mở rộng khác chưa mô hình hóa phụ phí riêng.';
      } else {
        troubleCoverage = 'UNMODELED';
        troubleIncidentSummary =
          'Chưa có kịch bản cho tuyến này — mới tính cước gốc & phí nút, chưa cộng phụ phí ùn tắc Giáng sinh.';
        troubleCoverageNote = troubleIncidentSummary;
      }
    }
  }

  // Thông tin chuỗi chặng & điểm chuyển tải sinh trực tiếp từ hubIds + legs
  const shortModeSequence = route.legs.map((l) => getModeLabelVi(l.mode)).join(' → ');
  const fullItineraryLabel = route.hubIds
    .map((id) => getHubById(id)?.shortName || id)
    .join(' → ');
  const intermediateStopCount = Math.max(0, route.hubIds.length - 2);
  const transferCount = Math.max(0, route.legs.length - 1);

  const hubModelLabel = officialSpec
    ? officialSpec.hubModelLabel
    : `${route.legs.length} chặng · ${intermediateStopCount} điểm dừng trung gian`;

  const transferCodes = route.hubIds
    .slice(1, -1)
    .map((id) => getHubById(id)?.code || id);
  const transferPointsLabel =
    transferCodes.length > 0
      ? `${transferCodes.length} điểm dừng (${transferCodes.join(' → ')}) · ${transferCount} lần chuyển tải`
      : '0 điểm trung gian';

  // Đánh giá theo ĐẦU TRÊN của khoảng thời gian (committedMaxDays) — KHÔNG cắt về 35 ngày!
  const daysMargin = roundDaysLimit - committedMaxDays;
  const meetsTimeLimit = validation.isValid && committedMaxDays <= roundDaysLimit;
  const meetsDesired30Days = validation.isValid && committedMaxDays <= 30;
  const exceedsRound1Max35 = committedMaxDays > 35;

  const budgetDeltaFromNormalUSD = round2(cargo.targetBudgetMaxUSD - totalCostUSD);
  const budgetDeltaFromEmergencyUSD = round2(cargo.emergencyMaxBudgetUSD - totalCostUSD);
  const meetsNormalBudget = validation.isValid && totalCostUSD <= cargo.targetBudgetMaxUSD;
  const isBudgetSaving =
    validation.isValid && totalCostUSD < cargo.targetBudgetMinUSD && meetsTimeLimit;
  const withinEmergencyBudget =
    validation.isValid && totalCostUSD <= cargo.emergencyMaxBudgetUSD;

  let commitmentStatus: CommitmentStatusKind;
  let commitmentBadgeLabel: string;
  let commitmentSummary: string;

  if (!validation.isValid) {
    commitmentStatus = 'INVALID_ROUTE';
    commitmentBadgeLabel = 'Tuyến chưa hợp lệ';
    commitmentSummary = 'Cần sửa lỗi hạ tầng/điểm trùng trước khi so sánh, mô phỏng hoặc chốt phương án.';
  } else if (!meetsTimeLimit) {
    commitmentStatus = 'MAY_BE_LATE';
    commitmentBadgeLabel = 'Có thể trễ';
    commitmentSummary = exceedsRound1Max35 && !isRound2
      ? `Vượt giới hạn bài (${committedMaxDays} ngày > 35 ngày, trễ ${committedMaxDays - roundDaysLimit} ngày).`
      : `Muộn nhất ngày ${committedMaxDays} — có thể trễ ${committedMaxDays - roundDaysLimit} ngày so với hạn ngày ${roundDaysLimit}.`;
  } else if (!meetsNormalBudget) {
    commitmentStatus = !withinEmergencyBudget
      ? 'EXCEEDS_EMERGENCY_CAP'
      : 'NEEDS_EMERGENCY_APPROVAL';
    if (isRound2) {
      if (withinEmergencyBudget) {
        commitmentBadgeLabel = 'Trong trần 15.000 USD';
        commitmentSummary = `Đúng hạn (dư ${daysMargin} ngày), vượt mục tiêu 12.000 USD nhưng nằm trong giới hạn tối đa 15.000 USD của Vòng 2.`;
      } else {
        commitmentBadgeLabel = 'Vượt tối đa 15.000 USD';
        commitmentSummary = `Đúng hạn (dư ${daysMargin} ngày), nhưng vượt giới hạn tối đa 15.000 USD của Vòng 2 thêm ${formatWorkshopUSD(totalCostUSD - cargo.emergencyMaxBudgetUSD)} USD.`;
      }
    } else {
      commitmentBadgeLabel = 'Vượt ngân sách';
      commitmentSummary = `Đúng hạn (dư ${daysMargin} ngày), nhưng vượt ngân sách 12.000 USD thêm ${formatWorkshopUSD(totalCostUSD - cargo.targetBudgetMaxUSD)} USD.`;
    }
  } else if (isBudgetSaving) {
    commitmentStatus = 'ON_TIME_SAVING';
    commitmentBadgeLabel = 'Đúng hạn · Tiết kiệm';
    commitmentSummary = `Muộn nhất ngày ${committedMaxDays} (dư ${daysMargin} ngày), tiết kiệm dưới 8.000 USD.`;
  } else {
    commitmentStatus = 'ON_TIME_IN_BUDGET';
    commitmentBadgeLabel = 'Đúng hạn · Đạt ngân sách';
    commitmentSummary = `Muộn nhất ngày ${committedMaxDays} (dư ${daysMargin} ngày), còn dư ${formatWorkshopUSD(budgetDeltaFromNormalUSD)} USD trong ngân sách 8.000–12.000 USD.`;
  }

  const effectiveReliability = officialSpec
    ? isRound2
      ? Math.max(0.45, round2(officialSpec.baseReliability - 0.12))
      : officialSpec.baseReliability
    : Number(Math.max(0.4, Math.min(0.97, combinedReliability)).toFixed(2));

  const reliabilityNote = officialSpec
    ? isRound2
      ? 'Giả định workshop: trừ 12 điểm % so với Vòng 1 khi xảy ra ùn tắc cao điểm Giáng sinh.'
      : 'Giả định workshop theo mức độ ổn định của từng chuỗi phương thức ở điều kiện thường.'
    : 'Ước tính nhân xác suất ổn định qua các chặng và điểm trung chuyển (chỉ số tham khảo).';

  const { dynamicPros, dynamicCons } = buildDynamicProsAndCons(
    matchedTemplateKey,
    round,
    totalCostUSD,
    activeTimeRangeLabel,
    committedMaxDays,
    roundDaysLimit,
    meetsNormalBudget,
    withinEmergencyBudget,
    route.legs
  );

  return {
    route,
    validation,
    matchedTemplateKey,
    pricingBasis,
    troubleCoverage,
    troubleCoverageNote,
    round,
    legs: legResults,
    hubs: hubResults,
    shortModeSequence,
    fullItineraryLabel,
    transferCount,
    intermediateStopCount,
    hubModelLabel,
    transferPointsLabel,
    totalDistanceKm: Math.round(totalDistanceKm),
    pureTransitDays: Number(pureTransitDays.toFixed(1)),
    totalHubHandlingDays: Number(totalHubHandlingDays.toFixed(1)),
    estimatedTransitDays,
    minExpectedDays,
    committedMaxDays,
    activeTimeRangeLabel,
    isRangeEstimate,
    baseCostUSD,
    pureFreightCostUSD: Math.round(pureFreightCostUSD),
    totalHubHandlingCostUSD: Math.round(totalHubHandlingCostUSD),
    extraTroubleCostUSD,
    extraTroubleDays,
    totalCostUSD,
    costFormulaNote,
    troubleIncidentSummary,
    affectedLegIndex,
    affectedHubId,
    roundDaysLimit,
    daysMargin,
    budgetDeltaFromNormalUSD,
    budgetDeltaFromEmergencyUSD,
    meetsTimeLimit,
    meetsDesired30Days,
    meetsNormalBudget,
    isBudgetSaving,
    withinEmergencyBudget,
    exceedsRound1Max35,
    commitmentStatus,
    commitmentBadgeLabel,
    commitmentSummary,
    dynamicPros,
    dynamicCons,
    routeReliability: effectiveReliability,
    reliabilityNote
  };
}
