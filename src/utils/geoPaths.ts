/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocationHub, TransportMode } from '../types/logistics';

/**
 * 1. HẢI TRÌNH ĐƯỜNG BIỂN QUỐC TẾ (100% TRÊN MẶT BIỂN - KHÔNG CẮT QUA ĐẤT LIỀN)
 */
const MARITIME_CATLAI_TO_SINGAPORE: [number, number][] = [
  [10.515, 107.018], // Cảng Cái Mép - Thị Vải / TP.HCM (VNVUT)
  [10.310, 107.080], // Vịnh Gành Rái - Vũng Tàu
  [9.850, 107.180],  // Ngoài khơi Vũng Tàu
  [8.550, 106.850],  // Đông Nam Côn Đảo
  [6.800, 106.100],  // Nam Biển Đông
  [4.500, 105.200],  // Ngoài khơi bán đảo Mã Lai
  [2.400, 104.580],  // Đông Pulau Tioman
  [1.430, 104.320],  // Hải đăng Horsburgh (Cửa Đông Eo biển Singapore)
  [1.235, 103.980],  // Eo biển Singapore
  [1.355, 103.988]   // Singapore (SIN / SGSIN)
];

const MARITIME_HAIPHONG_TO_SINGAPORE: [number, number][] = [
  [20.835, 106.885], // Cảng Hải Phòng - Lạch Huyện
  [20.200, 107.350], // Vịnh Bắc Bộ
  [18.300, 108.200], // Ngoài khơi Bắc Trung Bộ
  [16.200, 109.100], // Ngoài khơi Đà Nẵng
  [13.500, 109.850], // Ngoài khơi Quy Nhơn - Phú Yên
  [10.800, 109.200], // Ngoài khơi Bình Thuận
  [8.550, 106.850],  // Đông Nam Côn Đảo
  [6.800, 106.100],
  [4.500, 105.200],
  [2.400, 104.580],
  [1.430, 104.320],
  [1.235, 103.980],
  [1.355, 103.988]   // Cảng PSA Singapore
];

const MARITIME_SINGAPORE_TO_ARABIAN_SEA: [number, number][] = [
  [1.355, 103.988],  // Singapore
  [1.175, 103.580],  // Phillip Channel
  [1.420, 103.120],  // Nam Eo biển Malacca
  [2.350, 101.650],  // Ngoài khơi Port Dickson
  [3.850, 99.950],   // Giữa Eo biển Malacca
  [5.350, 97.800],   // Bắc Eo biển Malacca
  [5.950, 95.300],   // Mũi Aceh (Bắc Sumatra)
  [5.900, 88.000],   // Nam Vịnh Bengal
  [5.720, 80.550],   // Nam đảo Sri Lanka (Dondra Head)
  [7.400, 76.200],   // Biển Laccadive
  [11.200, 63.000]   // Biển Ả Rập (Arabian Sea Junction)
];

const MARITIME_ARABIAN_SEA_TO_DUBAI: [number, number][] = [
  [11.200, 63.000],  // Biển Ả Rập
  [16.500, 61.500],  // Giữa Biển Ả Rập
  [21.800, 60.400],  // Ngoài khơi Ras al Hadd (Oman)
  [24.300, 58.000],  // Vịnh Oman
  [26.380, 56.420],  // Eo biển Hormuz
  [25.650, 55.250],  // Vịnh Ba Tư
  [24.985, 55.027]   // Cảng Jebel Ali, Dubai (AEJEA)
];

const MARITIME_ARABIAN_SEA_TO_ROTTERDAM: [number, number][] = [
  [11.200, 63.000],  // Biển Ả Rập
  [12.350, 51.600],  // Mũi Guardafui (Sừng Châu Phi)
  [12.050, 45.200],  // Vịnh Aden
  [12.620, 43.350],  // Eo biển Bab-el-Mandeb
  [15.600, 41.450],  // Nam Biển Đỏ
  [20.200, 38.400],  // Giữa Biển Đỏ
  [25.100, 35.650],  // Bắc Biển Đỏ
  [27.650, 33.920],  // Vịnh Suez
  [29.880, 32.550],  // Cảng Suez
  [30.580, 32.340],  // Kênh đào Suez
  [31.280, 32.320],  // Port Said (Địa Trung Hải)
  [33.400, 27.800],  // Đông Địa Trung Hải
  [34.800, 23.500],  // Nam đảo Crete
  [36.250, 15.600],  // Eo biển Malta
  [37.350, 11.400],  // Eo biển Sicily
  [37.750, 6.500],   // Ngoài khơi Algeria
  [36.550, -1.200],  // Biển Alboran
  [35.960, -5.520],  // Eo biển Gibraltar
  [36.750, -9.150],  // Mũi St. Vincent (Bồ Đào Nha)
  [39.800, -9.750],  // Ngoài khơi Bồ Đào Nha
  [43.250, -9.550],  // Mũi Finisterre (Tây Ban Nha)
  [46.100, -6.600],  // Vịnh Biscay
  [48.620, -5.320],  // Ngoài khơi Ushant (Cửa vào Eo biển Manche)
  [49.950, -2.100],  // Eo biển Manche (English Channel)
  [50.920, 1.380],   // Eo biển Dover
  [51.580, 2.550],   // Nam Biển Bắc
  [51.985, 3.920],   // Luồng nước sâu vào Rotterdam
  [51.955, 4.145]    // Cảng Rotterdam (Maasvlakte)
];

const MARITIME_ROTTERDAM_TO_HAMBURG: [number, number][] = [
  [51.955, 4.145],   // Rotterdam
  [52.650, 4.100],   // Ngoài khơi Hà Lan (Biển Bắc)
  [53.750, 6.300],   // Ngoài khơi quần đảo Frisian
  [53.960, 8.450],   // Cửa sông Elbe (Cuxhaven)
  [53.540, 9.930]    // Cảng Hamburg (DEHAM)
];

/**
 * 2. HÀNH LANG ĐƯỜNG SẮT LIÊN VẬN Á – ÂU (EURASIAN RAIL CORRIDOR)
 */
const RAIL_SONGTHAN_TO_YENVIEN: [number, number][] = [
  [10.892, 106.748], // Ga Sóng Thần (Bình Dương)
  [10.950, 107.150], // Đồng Nai
  [11.560, 108.990], // Tháp Chàm
  [12.250, 109.180], // Nha Trang
  [13.770, 109.210], // Diêu Trì (Quy Nhơn)
  [16.070, 108.210], // Đà Nẵng
  [16.460, 107.580], // Huế
  [17.480, 106.600], // Đồng Hới
  [18.680, 105.670], // Vinh
  [19.800, 105.770], // Thanh Hóa
  [21.088, 105.915]  // Ga Yên Viên (Hà Nội)
];

const RAIL_YENVIEN_TO_ALMATY: [number, number][] = [
  [21.088, 105.915], // Ga Yên Viên
  [21.950, 106.700], // Cửa khẩu đường sắt Đồng Đăng
  [22.820, 108.320], // Nam Ninh
  [26.580, 106.710], // Quý Dương
  [29.600, 106.500], // Trùng Khánh
  [36.060, 103.830], // Lan Châu
  [43.820, 87.610],  // Urumqi
  [44.210, 80.410],  // Cảng cạn Khorgos
  [43.255, 76.912]   // Trạm Almaty (Kazakhstan)
];

const RAIL_ALMATY_TO_DUISBURG: [number, number][] = [
  [43.255, 76.912],  // Trạm Almaty
  [46.000, 68.000],  // Kazakhstan
  [50.280, 57.160],  // Aktobe
  [51.530, 46.030],  // Saratov
  [53.900, 27.560],  // Minsk
  [52.030, 23.530],  // Brest / Małaszewicze (Biên giới Ba Lan - EU)
  [52.230, 21.010],  // Warsaw (Ba Lan)
  [52.400, 16.920],  // Poznań
  [52.520, 13.400],  // Berlin (Đức)
  [52.370, 9.730],   // Hannover
  [51.445, 6.745]    // Ga Đường sắt Liên vận Duisburg (DITU - Đức)
];

/**
 * Returns realistic intermediate waypoints for routes across all 4 modes:
 * SEA (strictly ocean lanes), RAIL (railway corridors), ROAD (highways/Autobahn), and AIR (great-circle arcs).
 */
export function getRealisticPathCoordinates(
  fromHub: LocationHub,
  toHub: LocationHub,
  mode: TransportMode
): [number, number][] {
  const start = fromHub.coordinates;
  const end = toHub.coordinates;

  // ============================================================================
  // 1. SEA FREIGHT CORRIDORS (100% OCEAN LANES)
  // ============================================================================
  if (mode === 'SEA') {
    const pair = `${fromHub.id}__${toHub.id}`;
    const revPair = `${toHub.id}__${fromHub.id}`;

    const seaMap: Record<string, [number, number][]> = {
      'hub_cat_lai__hub_singapore': MARITIME_CATLAI_TO_SINGAPORE,
      'hub_hai_phong__hub_singapore': MARITIME_HAIPHONG_TO_SINGAPORE,
      'hub_cat_lai__hub_jebel_ali': [
        ...MARITIME_CATLAI_TO_SINGAPORE.slice(0, -1),
        ...MARITIME_SINGAPORE_TO_ARABIAN_SEA.slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_DUBAI
      ],
      'hub_cat_lai__hub_dubai': [
        ...MARITIME_CATLAI_TO_SINGAPORE.slice(0, -1),
        ...MARITIME_SINGAPORE_TO_ARABIAN_SEA.slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_DUBAI.slice(0, -1),
        [25.253, 55.365]
      ],
      'hub_hai_phong__hub_jebel_ali': [
        ...MARITIME_HAIPHONG_TO_SINGAPORE.slice(0, -1),
        ...MARITIME_SINGAPORE_TO_ARABIAN_SEA.slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_DUBAI
      ],
      'hub_hai_phong__hub_dubai': [
        ...MARITIME_HAIPHONG_TO_SINGAPORE.slice(0, -1),
        ...MARITIME_SINGAPORE_TO_ARABIAN_SEA.slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_DUBAI
      ],
      'hub_singapore__hub_jebel_ali': [
        ...MARITIME_SINGAPORE_TO_ARABIAN_SEA.slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_DUBAI
      ],
      'hub_singapore__hub_dubai': [
        ...MARITIME_SINGAPORE_TO_ARABIAN_SEA.slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_DUBAI
      ],
      'hub_cat_lai__hub_rotterdam': [
        ...MARITIME_CATLAI_TO_SINGAPORE.slice(0, -1),
        ...MARITIME_SINGAPORE_TO_ARABIAN_SEA.slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_ROTTERDAM
      ],
      'hub_hai_phong__hub_rotterdam': [
        ...MARITIME_HAIPHONG_TO_SINGAPORE.slice(0, -1),
        ...MARITIME_SINGAPORE_TO_ARABIAN_SEA.slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_ROTTERDAM
      ],
      'hub_singapore__hub_rotterdam': [
        ...MARITIME_SINGAPORE_TO_ARABIAN_SEA.slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_ROTTERDAM
      ],
      'hub_cat_lai__hub_hamburg': [
        ...MARITIME_CATLAI_TO_SINGAPORE.slice(0, -1),
        ...MARITIME_SINGAPORE_TO_ARABIAN_SEA.slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_ROTTERDAM.slice(0, -1),
        ...MARITIME_ROTTERDAM_TO_HAMBURG
      ],
      'hub_hai_phong__hub_hamburg': [
        ...MARITIME_HAIPHONG_TO_SINGAPORE.slice(0, -1),
        ...MARITIME_SINGAPORE_TO_ARABIAN_SEA.slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_ROTTERDAM.slice(0, -1),
        ...MARITIME_ROTTERDAM_TO_HAMBURG
      ],
      'hub_singapore__hub_hamburg': [
        ...MARITIME_SINGAPORE_TO_ARABIAN_SEA.slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_ROTTERDAM.slice(0, -1),
        ...MARITIME_ROTTERDAM_TO_HAMBURG
      ],
      'hub_jebel_ali__hub_rotterdam': [
        ...[...MARITIME_ARABIAN_SEA_TO_DUBAI].reverse().slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_ROTTERDAM
      ],
      'hub_jebel_ali__hub_hamburg': [
        ...[...MARITIME_ARABIAN_SEA_TO_DUBAI].reverse().slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_ROTTERDAM.slice(0, -1),
        ...MARITIME_ROTTERDAM_TO_HAMBURG
      ],
      'hub_dubai__hub_rotterdam': [
        ...[...MARITIME_ARABIAN_SEA_TO_DUBAI].reverse().slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_ROTTERDAM
      ],
      'hub_dubai__hub_hamburg': [
        ...[...MARITIME_ARABIAN_SEA_TO_DUBAI].reverse().slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_ROTTERDAM.slice(0, -1),
        ...MARITIME_ROTTERDAM_TO_HAMBURG
      ],
      'hub_rotterdam__hub_hamburg': MARITIME_ROTTERDAM_TO_HAMBURG
    };

    if (seaMap[pair]) return seaMap[pair];
    if (seaMap[revPair]) return [...seaMap[revPair]].reverse();

    if (start[1] > 80 && end[1] < 30) {
      return [
        start,
        [8.550, 106.850],
        ...MARITIME_SINGAPORE_TO_ARABIAN_SEA.slice(0, -1),
        ...MARITIME_ARABIAN_SEA_TO_ROTTERDAM.slice(0, -1),
        end
      ];
    }

    return [start, [8.550, 106.850], [1.355, 103.988], end];
  }

  // ============================================================================
  // 2. RAIL FREIGHT CORRIDORS (EURASIAN & VIETNAM RAILWAY)
  // ============================================================================
  if (mode === 'RAIL') {
    const pair = `${fromHub.id}__${toHub.id}`;
    const revPair = `${toHub.id}__${fromHub.id}`;

    const railMap: Record<string, [number, number][]> = {
      'hub_song_than__hub_yen_vien': RAIL_SONGTHAN_TO_YENVIEN,
      'hub_song_than__hub_almaty_rail': [
        ...RAIL_SONGTHAN_TO_YENVIEN.slice(0, -1),
        ...RAIL_YENVIEN_TO_ALMATY
      ],
      'hub_yen_vien__hub_almaty_rail': RAIL_YENVIEN_TO_ALMATY,
      'hub_almaty_rail__hub_duisburg': RAIL_ALMATY_TO_DUISBURG,
      'hub_song_than__hub_duisburg': [
        ...RAIL_SONGTHAN_TO_YENVIEN.slice(0, -1),
        ...RAIL_YENVIEN_TO_ALMATY.slice(0, -1),
        ...RAIL_ALMATY_TO_DUISBURG
      ],
      'hub_yen_vien__hub_duisburg': [
        ...RAIL_YENVIEN_TO_ALMATY.slice(0, -1),
        ...RAIL_ALMATY_TO_DUISBURG
      ],
      'hub_duisburg__hub_stuttgart_iriso': [
        [51.445, 6.745],
        [50.940, 6.960],
        [50.030, 8.550],
        [49.006, 8.435],
        [48.718, 9.176]
      ],
      'hub_frankfurt__hub_stuttgart_iriso': [
        [50.026, 8.543],
        [49.487, 8.466],
        [49.006, 8.435],
        [48.718, 9.176]
      ],
      'hub_rotterdam__hub_duisburg': [
        [51.955, 4.145],
        [51.840, 5.850],
        [51.445, 6.745]
      ],
      'hub_rotterdam__hub_stuttgart_iriso': [
        [51.955, 4.145],
        [51.445, 6.745],
        [50.030, 8.550],
        [48.718, 9.176]
      ],
      'hub_hamburg__hub_stuttgart_iriso': [
        [53.540, 9.930],
        [52.370, 9.730],
        [50.030, 8.550],
        [48.718, 9.176]
      ]
    };

    if (railMap[pair]) return railMap[pair];
    if (railMap[revPair]) return [...railMap[revPair]].reverse();

    if (start[1] > 80 && end[1] < 30) {
      return [
        start,
        ...RAIL_YENVIEN_TO_ALMATY,
        ...RAIL_ALMATY_TO_DUISBURG.slice(1, -1),
        end
      ];
    }
  }

  // ============================================================================
  // 3. ROAD CORRIDORS (HIGHWAYS, DUBAI DRAYAGE & GERMAN AUTOBAHN)
  // ============================================================================
  if (mode === 'ROAD') {
    if (fromHub.id === 'hub_vsip2_binhduong' && toHub.id === 'hub_cat_lai') {
      return [start, [10.950, 106.760], [10.760, 106.850], [10.630, 106.960], end];
    }
    if (fromHub.id === 'hub_vsip2_binhduong' && toHub.id === 'hub_tan_son_nhat') {
      return [start, [10.960, 106.700], [10.840, 106.710], end];
    }
    if (fromHub.id === 'hub_jebel_ali' && toHub.id === 'hub_dubai') {
      return [start, [25.095, 55.160], [25.185, 55.275], end];
    }
    if (fromHub.id === 'hub_vsip2_binhduong' && toHub.id === 'hub_bangkok') {
      return [
        start,
        [11.076, 106.171],
        [11.556, 104.928],
        [13.095, 103.202],
        [13.658, 102.564],
        end
      ];
    }
    if (fromHub.id === 'hub_frankfurt' && toHub.id === 'hub_stuttgart_iriso') {
      return [
        start,
        [49.872, 8.630],
        [49.409, 8.672],
        [49.006, 8.435],
        [48.892, 8.705],
        end
      ];
    }
    if (fromHub.id === 'hub_munich_airport' && toHub.id === 'hub_stuttgart_iriso') {
      return [
        start,
        [48.370, 10.890],
        [48.400, 9.980],
        end
      ];
    }
    if (fromHub.id === 'hub_duisburg' && toHub.id === 'hub_stuttgart_iriso') {
      return [
        start,
        [50.937, 6.990],
        [50.030, 8.550],
        [49.006, 8.435],
        end
      ];
    }
    if (fromHub.id === 'hub_rotterdam' && toHub.id === 'hub_stuttgart_iriso') {
      return [
        start,
        [51.842, 5.852],
        [51.434, 6.762],
        [50.937, 6.990],
        [50.030, 8.550],
        [49.006, 8.435],
        end
      ];
    }
    if (fromHub.id === 'hub_hamburg' && toHub.id === 'hub_stuttgart_iriso') {
      return [
        start,
        [52.375, 9.732],
        [51.312, 9.492],
        [49.791, 9.953],
        [49.142, 9.210],
        end
      ];
    }
  }

  // ============================================================================
  // 4. AIR ROUTES: Curved Great-Circle Flight Corridor
  // ============================================================================
  if (mode === 'AIR') {
    const lat1 = start[0];
    const lon1 = start[1];
    const lat2 = end[0];
    const lon2 = end[1];

    const points: [number, number][] = [start];
    const numSteps = 20;
    for (let i = 1; i < numSteps; i++) {
      const f = i / numSteps;
      const latInterp = lat1 + (lat2 - lat1) * f;
      const lonInterp = lon1 + (lon2 - lon1) * f;
      const arcBonus = Math.sin(f * Math.PI) * (Math.abs(lon1 - lon2) > 40 ? 5.5 : 1.5);
      points.push([Number((latInterp + arcBonus).toFixed(4)), Number(lonInterp.toFixed(4))]);
    }
    points.push(end);
    return points;
  }

  return [start, end];
}
