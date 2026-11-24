/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CargoParams,
  ChristmasCongestionSpec,
  ExtendedTemplateKey,
  LocationHub,
  OfficialRouteKey,
  RouteOption,
  TransportMode
} from '../types/logistics';

/**
 * Thông số đóng gói chuẩn đối chiếu (Workshop Nhóm 7):
 * - 3.750 bo mạch (22 × 14 × 3 cm, 0,8 kg/bo) = 3.000 kg hàng
 * - 134 thùng carton (55 × 38 × 25 cm, 0,8 kg/vỏ): 133 thùng đủ (28 bo) + 1 thùng lẻ (26 bo)
 *   -> Khối lượng cả carton = 133 × (28 × 0,8 + 0,8) + (26 × 0,8 + 0,8) = 3.107,2 kg
 * - Xếp lên 7 Pallet Euro (120 × 80 × 14,4 cm, giả định 25 kg/vỏ pallet):
 *   -> 6 pallet đủ (20 thùng, cao 5 × 25 + 14,4 = 139,4 cm) + 1 pallet lẻ (14 thùng, cao 4 × 25 + 14,4 = 114,4 cm)
 *   -> Khối lượng cả 7 pallet = 3.107,2 + 7 × 25 = 3.282,2 kg (cơ sở tính lưu kho hàng không)
 * - Thể tích quy đổi (hệ số 6.000):
 *   -> 134 thùng rời: (134 × 55 × 38 × 25) / 6.000 = 1.167 kg
 *   -> 7 pallet đã xếp: 9,12768 m³ (≈ 9,13 m³) × 10^6 / 6.000 = 1.521,28 kg
 */
export const DEFAULT_CARGO_PARAMS: CargoParams = {
  commodityName: 'Bo mạch điện tử',
  weightTons: 3,
  boardCount: 3750,
  boardWeightKg: 0.8,
  cartonCount: 134,
  fullCartonCount: 133,
  partialCartonCount: 1,
  partialCartonBoards: 26,
  cartonShellKg: 0.8,
  palletCount: 7,
  fullPalletCount: 6,
  partialPalletCount: 1,
  palletShellKg: 25,
  netBoardWeightKg: 3000,
  cartonGrossWeightKg: 3107.2,
  palletGrossWeightKg: 3282.2,
  fullPalletHeightCm: 139.4,
  partialPalletHeightCm: 114.4,
  palletizedVolumeCBM: 9.12768,
  cartonVolumetricWeightKg: 1167,
  palletVolumetricWeightKg: 1521.28,
  desiredDaysRange: '25–30 ngày',
  round1MaxDaysLimit: 35,
  round2MaxDaysLimit: 30,
  targetBudgetMinUSD: 8000,
  targetBudgetMaxUSD: 12000,
  emergencyMaxBudgetUSD: 15000
};

export const WORKSHOP_FORM_URL = 'https://forms.gle/a5GkEwoETsqHrEASA';

export const ROUND_2_CUSTOMER_QUOTE =
  'Bước vào cao điểm mùa lễ Giáng sinh, nhà máy Stuttgart đang thiếu hụt linh kiện trong khi phải đẩy mạnh sản lượng để chuẩn bị cho đợt xả hàng cuối năm. Chúng tôi cần nhận đủ cả 7 pallet tại Stuttgart chậm nhất ngày 30 (có thể giao sớm nếu hẹn trước). Ngân sách mục tiêu vẫn là 8.000 – 12.000 USD, và trong tình huống khẩn cấp có thể nới tối đa lên 15.000 USD nếu chứng minh được tính cần thiết.';

export const ROUND_2_CLOSING_QUESTION =
  'Nhóm quyết định giữ nguyên hay đổi tuyến? Hãy trình bày rõ lý do kèm ít nhất một con số về thời gian giao hàng và một con số về chi phí.';

export const MC_DEBRIEF_POINTS = [
  'Phương án D sử dụng 9.412 USD, giao muộn nhất ngày 20 — dư 10 ngày so với hạn ngày 30 và còn dư 2.588 USD so với ngân sách mục tiêu 12.000 USD.',
  'Chọn D đồng nghĩa chi thêm 6.717 USD so với C (2.695 USD) để loại bỏ nguy cơ giao muộn 5 ngày (ngày 35 so với hạn ngày 30).',
  'Phương án C vẫn có lý khi và chỉ khi hãng tàu/đại lý cam kết bằng văn bản ngày giao đủ hàng trước hoặc trong ngày 30.',
  'Phương án B (14.352,58 USD · 10–12 ngày) vượt mức mục tiêu 12.000 USD nhưng vẫn nằm trong trần tối đa 15.000 USD của Vòng 2; trong khi Phương án A (15.171,80 USD) vượt cả mức tối đa 15.000 USD.',
  'Khi chấm điểm Vòng 2, đối chiếu trực tiếp ngày giao muộn nhất (chậm nhất ngày 30) và tổng chi phí trọn gói so với ngân sách 8.000–12.000 USD (tối đa 15.000 USD).'
];

export const LOCATION_HUBS: LocationHub[] = [
  // 1. Kho xuất phát tại Việt Nam
  {
    id: 'hub_vsip2_binhduong',
    name: 'Kho Nhà máy KCN VSIP II Bình Dương',
    shortName: 'VSIP II Bình Dương',
    code: 'VSIP2-BD',
    country: 'Việt Nam',
    city: 'Bình Dương',
    address: 'KCN VSIP II, TP. Thủ Dầu Một, Bình Dương, Việt Nam',
    type: 'WAREHOUSE',
    coordinates: [11.0525, 106.6822],
    avgHandlingHours: 4,
    handlingCostPerTon: 25,
    congestionProbability: 0.05,
    allowedModes: ['ROAD']
  },
  {
    id: 'hub_vsip_bacninh',
    name: 'Kho Nhà máy KCN VSIP Bắc Ninh',
    shortName: 'VSIP Bắc Ninh',
    code: 'VSIP-BN',
    country: 'Việt Nam',
    city: 'Bắc Ninh',
    address: 'KCN VSIP Bắc Ninh, Từ Sơn, Bắc Ninh, Việt Nam',
    type: 'WAREHOUSE',
    coordinates: [21.0812, 105.9615],
    avgHandlingHours: 4,
    handlingCostPerTon: 25,
    congestionProbability: 0.05,
    allowedModes: ['ROAD']
  },

  // 2. Cửa ngõ Việt Nam
  {
    id: 'hub_tan_son_nhat',
    name: 'Sân bay Quốc tế Tân Sơn Nhất (SGN)',
    shortName: 'Tân Sơn Nhất',
    code: 'SGN',
    country: 'Việt Nam',
    city: 'TP. Hồ Chí Minh',
    address: 'Ga Hàng hóa TCS, Tân Bình, TP. Hồ Chí Minh',
    type: 'AIRPORT',
    coordinates: [10.8188, 106.6519],
    avgHandlingHours: 6,
    handlingCostPerTon: 45,
    congestionProbability: 0.1,
    allowedModes: ['ROAD', 'AIR']
  },
  {
    id: 'hub_cat_lai',
    name: 'Cảng Cái Mép – Thị Vải (VNVUT)',
    shortName: 'Cái Mép – Thị Vải',
    code: 'VNVUT',
    country: 'Việt Nam',
    city: 'Bà Rịa – Vũng Tàu',
    address: 'Cụm cảng nước sâu Cái Mép – Thị Vải, Bà Rịa – Vũng Tàu',
    type: 'SEAPORT',
    coordinates: [10.5186, 107.0185],
    avgHandlingHours: 12,
    handlingCostPerTon: 35,
    congestionProbability: 0.16,
    allowedModes: ['ROAD', 'SEA']
  },
  {
    id: 'hub_song_than',
    name: 'Ga Đường sắt Liên vận Sóng Thần',
    shortName: 'Ga Sóng Thần',
    code: 'ST-RAIL',
    country: 'Việt Nam',
    city: 'Bình Dương',
    address: 'Dĩ An, Bình Dương, Việt Nam',
    type: 'RAIL_STATION',
    coordinates: [10.8935, 106.7525],
    avgHandlingHours: 8,
    handlingCostPerTon: 30,
    congestionProbability: 0.08,
    allowedModes: ['ROAD', 'RAIL']
  },
  {
    id: 'hub_yen_vien',
    name: 'Ga Đường sắt Liên vận Yên Viên',
    shortName: 'Ga Yên Viên',
    code: 'YV-RAIL',
    country: 'Việt Nam',
    city: 'Hà Nội',
    address: 'Gia Lâm, Hà Nội, Việt Nam',
    type: 'RAIL_STATION',
    coordinates: [21.0865, 105.9212],
    avgHandlingHours: 8,
    handlingCostPerTon: 28,
    congestionProbability: 0.08,
    allowedModes: ['ROAD', 'RAIL']
  },
  {
    id: 'hub_noi_bai',
    name: 'Sân bay Quốc tế Nội Bài (HAN)',
    shortName: 'Nội Bài',
    code: 'HAN',
    country: 'Việt Nam',
    city: 'Hà Nội',
    address: 'Sóc Sơn, Hà Nội, Việt Nam',
    type: 'AIRPORT',
    coordinates: [21.2187, 105.8042],
    avgHandlingHours: 6,
    handlingCostPerTon: 45,
    congestionProbability: 0.09,
    allowedModes: ['ROAD', 'AIR']
  },
  {
    id: 'hub_hai_phong',
    name: 'Cảng Quốc tế Lạch Huyện – Hải Phòng',
    shortName: 'Cảng Hải Phòng',
    code: 'HPH',
    country: 'Việt Nam',
    city: 'Hải Phòng',
    address: 'Cát Hải, Hải Phòng, Việt Nam',
    type: 'SEAPORT',
    coordinates: [20.8225, 106.8855],
    avgHandlingHours: 12,
    handlingCostPerTon: 35,
    congestionProbability: 0.12,
    allowedModes: ['ROAD', 'SEA']
  },

  // 3. Điểm trung chuyển quốc tế
  {
    id: 'hub_singapore_air',
    name: 'Sân bay Quốc tế Changi Singapore (SIN)',
    shortName: 'Singapore (SIN)',
    code: 'SIN',
    country: 'Singapore',
    city: 'Singapore',
    address: 'Changi Airfreight Centre, Singapore',
    type: 'AIRPORT',
    coordinates: [1.3644, 103.9915],
    avgHandlingHours: 8,
    handlingCostPerTon: 50,
    congestionProbability: 0.14,
    allowedModes: ['AIR', 'ROAD']
  },
  {
    id: 'hub_jebel_ali',
    name: 'Cảng biển Quốc tế Jebel Ali, Dubai (AEJEA)',
    shortName: 'Cảng Jebel Ali',
    code: 'AEJEA',
    country: 'UAE',
    city: 'Dubai',
    address: 'Jebel Ali Free Zone, Dubai, UAE',
    type: 'SEAPORT',
    coordinates: [25.0112, 55.0615],
    avgHandlingHours: 8,
    handlingCostPerTon: 38,
    congestionProbability: 0.08,
    allowedModes: ['SEA', 'ROAD']
  },
  {
    id: 'hub_dubai',
    name: 'Sân bay Quốc tế Dubai (DXB)',
    shortName: 'Sân bay Dubai (DXB)',
    code: 'DXB',
    country: 'UAE',
    city: 'Dubai',
    address: 'Dubai Cargo Village, Dubai, UAE',
    type: 'AIRPORT',
    coordinates: [25.2532, 55.3657],
    avgHandlingHours: 6,
    handlingCostPerTon: 45,
    congestionProbability: 0.08,
    allowedModes: ['ROAD', 'AIR']
  },
  {
    id: 'hub_singapore',
    name: 'Cảng Quốc tế PSA Singapore (SGSIN)',
    shortName: 'Cảng Singapore',
    code: 'SGSIN',
    country: 'Singapore',
    city: 'Singapore',
    address: 'Pasir Panjang Terminal, Singapore',
    type: 'SEAPORT',
    coordinates: [1.2644, 103.8225],
    avgHandlingHours: 10,
    handlingCostPerTon: 40,
    congestionProbability: 0.1,
    allowedModes: ['SEA', 'ROAD']
  },
  {
    id: 'hub_bangkok',
    name: 'Sân bay Suvarnabhumi Bangkok (BKK)',
    shortName: 'Bangkok (BKK)',
    code: 'BKK',
    country: 'Thái Lan',
    city: 'Bangkok',
    address: 'Samut Prakan, Thái Lan',
    type: 'AIRPORT',
    coordinates: [13.69, 100.7501],
    avgHandlingHours: 8,
    handlingCostPerTon: 40,
    congestionProbability: 0.09,
    allowedModes: ['ROAD', 'AIR']
  },
  {
    id: 'hub_almaty_rail',
    name: 'Trạm Đường sắt Almaty / Khorgos',
    shortName: 'Trạm Almaty',
    code: 'ALA-RAIL',
    country: 'Kazakhstan',
    city: 'Almaty',
    address: 'Almaty Rail Junction, Kazakhstan',
    type: 'RAIL_STATION',
    coordinates: [43.2389, 76.8897],
    avgHandlingHours: 12,
    handlingCostPerTon: 35,
    congestionProbability: 0.12,
    allowedModes: ['RAIL']
  },

  // 4. Cửa ngõ Châu Âu
  {
    id: 'hub_frankfurt',
    name: 'Sân bay Quốc tế Frankfurt (FRA)',
    shortName: 'Frankfurt (FRA)',
    code: 'FRA',
    country: 'Đức',
    city: 'Frankfurt am Main',
    address: 'CargoCity Süd, 60549 Frankfurt am Main, Đức',
    type: 'AIRPORT',
    coordinates: [50.0379, 8.5622],
    avgHandlingHours: 6,
    handlingCostPerTon: 50,
    congestionProbability: 0.09,
    allowedModes: ['AIR', 'ROAD', 'RAIL']
  },
  {
    id: 'hub_hamburg',
    name: 'Cảng biển Quốc tế Hamburg (DEHAM)',
    shortName: 'Cảng Hamburg',
    code: 'DEHAM',
    country: 'Đức',
    city: 'Hamburg',
    address: '21129 Hamburg, Đức',
    type: 'SEAPORT',
    coordinates: [53.5395, 9.9325],
    avgHandlingHours: 14,
    handlingCostPerTon: 45,
    congestionProbability: 0.18,
    allowedModes: ['SEA', 'ROAD', 'RAIL']
  },
  {
    id: 'hub_munich_airport',
    name: 'Sân bay Quốc tế Munich (MUC)',
    shortName: 'Munich (MUC)',
    code: 'MUC',
    country: 'Đức',
    city: 'Munich',
    address: '85356 München-Flughafen, Đức',
    type: 'AIRPORT',
    coordinates: [48.3537, 11.775],
    avgHandlingHours: 5,
    handlingCostPerTon: 48,
    congestionProbability: 0.06,
    allowedModes: ['AIR', 'ROAD']
  },
  {
    id: 'hub_rotterdam',
    name: 'Cảng biển Quốc tế Rotterdam (RTM)',
    shortName: 'Cảng Rotterdam',
    code: 'RTM',
    country: 'Hà Lan',
    city: 'Rotterdam',
    address: 'Maasvlakte Rotterdam, Hà Lan',
    type: 'SEAPORT',
    coordinates: [51.9565, 4.0125],
    avgHandlingHours: 12,
    handlingCostPerTon: 45,
    congestionProbability: 0.11,
    allowedModes: ['SEA', 'ROAD', 'RAIL']
  },
  {
    id: 'hub_duisburg',
    name: 'Ga Đường sắt Quốc tế Duisburg (DUI)',
    shortName: 'Ga Duisburg',
    code: 'DUI',
    country: 'Đức',
    city: 'Duisburg',
    address: '47119 Duisburg, Đức',
    type: 'RAIL_STATION',
    coordinates: [51.4425, 6.7355],
    avgHandlingHours: 6,
    handlingCostPerTon: 42,
    congestionProbability: 0.08,
    allowedModes: ['RAIL', 'ROAD']
  },

  // 5. Kho đích tại Stuttgart
  {
    id: 'hub_stuttgart_iriso',
    name: 'Kho Nhà máy Nhận hàng Stuttgart (DESTR)',
    shortName: 'Kho Stuttgart',
    code: 'DESTR',
    country: 'Đức',
    city: 'Stuttgart',
    address: 'IRISO Electronics Europe GmbH, Zettachring 10, 70567 Stuttgart, Đức',
    type: 'DESTINATION',
    coordinates: [48.7186, 9.1569],
    avgHandlingHours: 3,
    handlingCostPerTon: 30,
    congestionProbability: 0.03,
    allowedModes: ['ROAD', 'RAIL']
  }
];

/**
 * Công thức phụ phí Giáng sinh chính xác bằng số trước khi làm tròn:
 * - PA-A: 3 × 489 × 5 × 0,08 + 40 = 586,80 + 40 = 626,80 USD -> 14.545 + 626,80 = 15.171,80 USD
 * - PA-B: 3.282,2 × 2 × 0,04 + 90 = 262,576 -> 262,58 + 90 = 352,58 USD -> 14.000 + 352,58 = 14.352,58 USD
 * - PA-C: 75 + 120 = 195 USD -> 2.500 + 195 = 2.695 USD
 * - PA-D: 7 × 2 × 8 + 100 = 112 + 100 = 212 USD -> 9.200 + 212 = 9.412 USD
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const PA_A_STORAGE = round2(3 * 489 * 5 * 0.08); // 586.80
const PA_A_EXTRA = round2(PA_A_STORAGE + 40); // 626.80
const PA_B_STORAGE = round2(3282.2 * 2 * 0.04); // 262.58
const PA_B_EXTRA = round2(PA_B_STORAGE + 90); // 352.58
const PA_C_EXTRA = round2(75 + 120); // 195
const PA_D_STORAGE = round2(7 * 2 * 8); // 112
const PA_D_EXTRA = round2(PA_D_STORAGE + 100); // 212

export interface OfficialRouteSpec {
  key: OfficialRouteKey;
  code: string;
  name: string;
  notes: string;
  hubIds: string[];
  modes: TransportMode[];
  minExpectedDays: number;
  maxExpectedDays: number;
  expectedTimeRange: string;
  baseAllInCostUSD: number;
  hubModelLabel: string;
  baseReliability: number;
  christmasTrouble: ChristmasCongestionSpec;
  legProsCons: Array<{ pros: string; cons: string; troubleNote?: string }>;
}

export const OFFICIAL_ROUTE_SPECS: Record<OfficialRouteKey, OfficialRouteSpec> = {
  'PA-A': {
    key: 'PA-A',
    code: 'PA-A',
    name: 'Phương án A: Bay thẳng Frankfurt (VSIP II → Tân Sơn Nhất → Frankfurt → Stuttgart)',
    notes: 'Chặng cuối giao bằng xe tải đến kho Stuttgart.',
    hubIds: [
      'hub_vsip2_binhduong',
      'hub_tan_son_nhat',
      'hub_frankfurt',
      'hub_stuttgart_iriso'
    ],
    modes: ['ROAD', 'AIR', 'ROAD'],
    minExpectedDays: 3,
    maxExpectedDays: 5,
    expectedTimeRange: '3–5 ngày',
    baseAllInCostUSD: 14545,
    hubModelLabel: 'Đi thẳng (0 điểm trung chuyển quốc tế)',
    baseReliability: 0.9,
    christmasTrouble: {
      affectedHubId: 'hub_tan_son_nhat',
      affectedLegIndex: 1,
      incidentSummary:
        '3 pallet đầy chờ chuyến sau thêm 7 ngày (miễn 2 ngày lưu kho, tính 5 ngày lưu kho) và phát sinh phí tách lô. Nhà máy chỉ tính hoàn tất khi nhận đủ cả 7 pallet.',
      costFormulaLabel: '3 × 489 × 5 × 0,08 + 40 = +626,80 USD',
      extraCostUSD: PA_A_EXTRA,
      extraDays: 7,
      minDaysAfterTrouble: 10,
      maxDaysAfterTrouble: 12,
      deliveryRangeLabel: '10–12 ngày',
      allInCostAfterTroubleUSD: round2(14545 + PA_A_EXTRA)
    },
    legProsCons: [
      {
        pros: 'Quãng đường ngắn (42 km), linh hoạt giờ nhận hàng tại VSIP II.',
        cons: 'Cần canh giờ tránh ùn tắc cửa ngõ sân bay Tân Sơn Nhất.'
      },
      {
        pros: 'Bay thẳng Tân Sơn Nhất → Frankfurt, ít lần bốc xếp bo mạch.',
        cons: 'Giá cước hàng không trực tiếp cao; mùa cao điểm dễ bị tách tải 3 pallet.',
        troubleNote: 'Sự cố Giáng sinh: 3 pallet đầy bị lùi tải 7 ngày (+626,80 USD phí kho & tách lô).'
      },
      {
        pros: 'Xe tải đi cao tốc từ sân bay Frankfurt về thẳng kho Stuttgart (~205 km).',
        cons: 'Phụ thuộc thời gian thông quan và trả hàng tại ga hàng hóa Frankfurt.'
      }
    ]
  },
  'PA-B': {
    key: 'PA-B',
    code: 'PA-B',
    name: 'Phương án B: Bay nối chuyến Singapore (VSIP II → Tân Sơn Nhất → Singapore → Frankfurt → Stuttgart)',
    notes: 'Nối chuyến hàng không qua Changi Singapore, chặng cuối bằng xe tải.',
    hubIds: [
      'hub_vsip2_binhduong',
      'hub_tan_son_nhat',
      'hub_singapore_air',
      'hub_frankfurt',
      'hub_stuttgart_iriso'
    ],
    modes: ['ROAD', 'AIR', 'AIR', 'ROAD'],
    minExpectedDays: 6,
    maxExpectedDays: 8,
    expectedTimeRange: '6–8 ngày',
    baseAllInCostUSD: 14000,
    hubModelLabel: '1 điểm trung chuyển hàng không (Singapore)',
    baseReliability: 0.78,
    christmasTrouble: {
      affectedHubId: 'hub_singapore_air',
      affectedLegIndex: 2,
      incidentSummary:
        'Chờ nối chuyến tại Singapore 3 ngày (miễn 1 ngày lưu kho, tính 2 ngày trên 3.282,2 kg cả pallet) và đổi lịch xe giao tại Đức chậm thêm 1 ngày.',
      costFormulaLabel: '3.282,2 × 2 × 0,04 + 90 = +352,58 USD',
      extraCostUSD: PA_B_EXTRA,
      extraDays: 4,
      minDaysAfterTrouble: 10,
      maxDaysAfterTrouble: 12,
      deliveryRangeLabel: '10–12 ngày',
      allInCostAfterTroubleUSD: round2(14000 + PA_B_EXTRA)
    },
    legProsCons: [
      {
        pros: 'Đường bộ ngắn từ VSIP II đến Tân Sơn Nhất (42 km).',
        cons: 'Phải bàn giao trước giờ đóng chuyến đi Singapore.'
      },
      {
        pros: 'Tần suất chuyến bay SGN → SIN dày đặc.',
        cons: 'Phát sinh thêm khâu trung chuyển tại sân bay Changi.'
      },
      {
        pros: 'Nhiều chuyến bay thân rộng từ Singapore đi Frankfurt.',
        cons: 'Dễ ùn tắc nối chuyến tại Singapore vào cao điểm Giáng sinh.',
        troubleNote: 'Sự cố Giáng sinh: Chờ nối chuyến 3 ngày tại Singapore (+262,58 USD lưu kho).'
      },
      {
        pros: 'Xe tải giao trực tiếp từ Frankfurt về Stuttgart (~205 km).',
        cons: 'Chuyến bay về trễ kéo theo đổi lịch xe (+90 USD và thêm 1 ngày).'
      }
    ]
  },
  'PA-C': {
    key: 'PA-C',
    code: 'PA-C',
    name: 'Phương án C: Tàu biển thẳng Hamburg (VSIP II → Cái Mép – Thị Vải → Hamburg → Stuttgart)',
    notes: 'Tuyến biển trực tiếp đến Hamburg, chặng cuối bằng xe tải.',
    hubIds: [
      'hub_vsip2_binhduong',
      'hub_cat_lai',
      'hub_hamburg',
      'hub_stuttgart_iriso'
    ],
    modes: ['ROAD', 'SEA', 'ROAD'],
    minExpectedDays: 28,
    maxExpectedDays: 34,
    expectedTimeRange: '28–34 ngày',
    baseAllInCostUSD: 2500,
    hubModelLabel: 'Đi thẳng đường biển (0 điểm trung chuyển quốc tế)',
    baseReliability: 0.62,
    christmasTrouble: {
      affectedHubId: 'hub_hamburg',
      affectedLegIndex: 1,
      incidentSummary:
        'Cảng Hamburg bàn giao container chậm 1 ngày; phát sinh phí lưu bãi 75 USD và đổi lịch xe 120 USD (xe lấy hàng trong ngày bàn giao).',
      costFormulaLabel: '75 + 120 = +195 USD',
      extraCostUSD: PA_C_EXTRA,
      extraDays: 1,
      minDaysAfterTrouble: 29,
      maxDaysAfterTrouble: 35,
      deliveryRangeLabel: '29–35 ngày',
      allInCostAfterTroubleUSD: round2(2500 + PA_C_EXTRA)
    },
    legProsCons: [
      {
        pros: 'Xe tải chở 7 pallet từ VSIP II ra cảng nước sâu Cái Mép – Thị Vải (~68 km).',
        cons: 'Cần hạ bãi trước giờ cắt máng của tàu mẹ.'
      },
      {
        pros: 'Cước vận tải biển thấp nhất trong 4 phương án.',
        cons: 'Thời gian đi biển kéo dài (28–34 ngày), dễ chậm lịch ở cảng đích.',
        troubleNote: 'Sự cố Giáng sinh: Cảng Hamburg giao cont chậm 1 ngày (+75 USD lưu bãi, +120 USD đổi lịch xe).'
      },
      {
        pros: 'Xe tải lấy container trực tiếp tại cảng Hamburg giao thẳng kho Stuttgart.',
        cons: 'Quãng đường bộ nội địa Đức dài (~655 km).'
      }
    ]
  },
  'PA-D': {
    key: 'PA-D',
    code: 'PA-D',
    name: 'Phương án D: Kết hợp Biển – Hàng không qua Dubai (VSIP II → Cái Mép → Jebel Ali → Sân bay Dubai → Frankfurt → Stuttgart)',
    notes: 'Gồm đủ 5 chặng, trong đó có chặng xe tải chuyển từ cảng Jebel Ali sang sân bay Dubai (DXB).',
    hubIds: [
      'hub_vsip2_binhduong',
      'hub_cat_lai',
      'hub_jebel_ali',
      'hub_dubai',
      'hub_frankfurt',
      'hub_stuttgart_iriso'
    ],
    modes: ['ROAD', 'SEA', 'ROAD', 'AIR', 'ROAD'],
    minExpectedDays: 15,
    maxExpectedDays: 18,
    expectedTimeRange: '15–18 ngày',
    baseAllInCostUSD: 9200,
    hubModelLabel: '1 điểm chuyển tải Biển–Hàng không (Dubai: Jebel Ali → DXB)',
    baseReliability: 0.88,
    christmasTrouble: {
      affectedHubId: 'hub_jebel_ali',
      affectedLegIndex: 2,
      incidentSummary:
        'Tại Dubai, 7 pallet chờ xe chuyển từ cảng Jebel Ali sang sân bay Dubai thêm 2 ngày; hãng bay vẫn giữ chỗ. Lưu kho 7 × 2 × 8 = 112 USD và điều lại xe 100 USD.',
      costFormulaLabel: '7 × 2 × 8 + 100 = +212 USD',
      extraCostUSD: PA_D_EXTRA,
      extraDays: 2,
      minDaysAfterTrouble: 17,
      maxDaysAfterTrouble: 20,
      deliveryRangeLabel: '17–20 ngày',
      allInCostAfterTroubleUSD: round2(9200 + PA_D_EXTRA)
    },
    legProsCons: [
      {
        pros: 'Xe tải chuyển 7 pallet từ VSIP II ra cảng Cái Mép – Thị Vải (~68 km).',
        cons: 'Hoàn tất thủ tục hải quan trước giờ đóng chuyến tàu biển.'
      },
      {
        pros: 'Đi biển đến Jebel Ali (UAE) tiết kiệm cước hơn nhiều so với bay từ Việt Nam.',
        cons: 'Dài ngày hơn đường hàng không thuần túy (~12,8 ngày trên biển).'
      },
      {
        pros: 'Quãng đường chuyển tiếp nội địa Dubai giữa cảng Jebel Ali và sân bay DXB ngắn (~42 km).',
        cons: 'Điểm dễ phát sinh chờ xe rút hàng khi cảng Jebel Ali đông vào cao điểm.',
        troubleNote: 'Sự cố Giáng sinh phát sinh tại chặng này: 7 pallet chờ xe chuyển cảng–sân bay thêm 2 ngày (+112 USD lưu kho, +100 USD điều lại xe).'
      },
      {
        pros: 'Bay thẳng từ sân bay Dubai (DXB) đến Frankfurt rút ngắn toàn bộ hành trình sang Đức.',
        cons: 'Cần phối hợp giữ chỗ bay đồng bộ với lịch cập cảng Jebel Ali.'
      },
      {
        pros: 'Xe tải giao tận kho Stuttgart từ Frankfurt (~205 km).',
        cons: 'Cần đặt lịch hẹn nhận hàng trước với kho nhà máy Stuttgart.'
      }
    ]
  }
};

export interface ExtendedTemplateSpec {
  key: ExtendedTemplateKey;
  name: string;
  notes: string;
  hubIds: string[];
  modes: TransportMode[];
}

export const EXTENDED_ROUTE_TEMPLATES: ExtendedTemplateSpec[] = [
  {
    key: 'EXT_MUNICH',
    name: 'Mở rộng 1: Bay thẳng Munich (VSIP II → Tân Sơn Nhất → Munich → Stuttgart)',
    notes: 'Tuyến mở rộng thử nghiệm hạ cánh tại sân bay Munich (MUC) thay vì Frankfurt.',
    hubIds: [
      'hub_vsip2_binhduong',
      'hub_tan_son_nhat',
      'hub_munich_airport',
      'hub_stuttgart_iriso'
    ],
    modes: ['ROAD', 'AIR', 'ROAD']
  },
  {
    key: 'EXT_EURASIAN_RAIL',
    name: 'Mở rộng 2: Đường sắt Liên vận Á – Âu (VSIP II → Ga Sóng Thần → Almaty → Duisburg → Stuttgart)',
    notes: 'Tuyến mở rộng thử nghiệm kết hợp đường sắt liên vận qua Kazakhstan và Đức.',
    hubIds: [
      'hub_vsip2_binhduong',
      'hub_song_than',
      'hub_almaty_rail',
      'hub_duisburg',
      'hub_stuttgart_iriso'
    ],
    modes: ['ROAD', 'RAIL', 'RAIL', 'ROAD']
  },
  {
    key: 'EXT_ROTTERDAM_RAIL',
    name: 'Mở rộng 3: Biển qua Rotterdam + Đường sắt nội địa EU (VSIP II → Cái Mép – Thị Vải → Rotterdam → Duisburg → Stuttgart)',
    notes: 'Xuất từ cảng nước sâu Cái Mép – Thị Vải (VNVUT), đi tàu biển đến Rotterdam rồi chạy đường sắt vào ga Duisburg và xe tải về Stuttgart.',
    hubIds: [
      'hub_vsip2_binhduong',
      'hub_cat_lai',
      'hub_rotterdam',
      'hub_duisburg',
      'hub_stuttgart_iriso'
    ],
    modes: ['ROAD', 'SEA', 'RAIL', 'ROAD']
  },
  {
    key: 'EXT_BANGKOK_AIR',
    name: 'Mở rộng 4: Đường bộ sang Bangkok + Bay Frankfurt (VSIP II → Bangkok → Frankfurt → Stuttgart)',
    notes: 'Tuyến mở rộng chạy xe tải xuyên biên giới sang sân bay Suvarnabhumi (BKK) rồi bay đến Frankfurt.',
    hubIds: [
      'hub_vsip2_binhduong',
      'hub_bangkok',
      'hub_frankfurt',
      'hub_stuttgart_iriso'
    ],
    modes: ['ROAD', 'AIR', 'ROAD']
  }
];

export const OFFICIAL_ROUTE_KEYS: OfficialRouteKey[] = ['PA-A', 'PA-B', 'PA-C', 'PA-D'];
