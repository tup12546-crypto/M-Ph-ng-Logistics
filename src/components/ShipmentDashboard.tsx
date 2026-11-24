/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CargoParams,
  RoundDecisionRecord,
  RouteEvaluation,
  WorkshopRound
} from '../types/logistics';
import { ROUND_2_CUSTOMER_QUOTE } from '../data/defaultData';
import { formatWorkshopUSD } from '../utils/logisticsEngine';
import {
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  Plus,
  Siren,
  XCircle
} from 'lucide-react';
import {
  AnimatedSnowflakeEmblem,
  MissionCardFestiveAccent
} from './ChristmasDecorations';

interface ShipmentDashboardProps {
  cargo: CargoParams;
  officialEvaluations: RouteEvaluation[];
  customEvaluations: RouteEvaluation[];
  viewingRouteId: string;
  onSelectRoute: (routeId: string) => void;
  unlockedRound: WorkshopRound;
  viewingRound: WorkshopRound;
  onChangeViewingRound: (round: WorkshopRound) => void;
  round1Decision: RoundDecisionRecord | null;
  round2Decision: RoundDecisionRecord | null;
  onScrollToComparison: () => void;
  onScrollToDecision: () => void;
  onOpenRouteBuilder: () => void;
  onCreateCustomCopyFromViewing: () => void;
  isDark?: boolean;
  isFestive?: boolean;
}

export const ShipmentDashboard: React.FC<ShipmentDashboardProps> = ({
  cargo,
  officialEvaluations,
  customEvaluations,
  viewingRouteId,
  onSelectRoute,
  unlockedRound,
  viewingRound,
  onChangeViewingRound,
  round1Decision,
  round2Decision,
  onScrollToComparison,
  onScrollToDecision,
  onOpenRouteBuilder,
  onCreateCustomCopyFromViewing,
  isDark = false,
  isFestive = false
}) => {
  const [showPackaging, setShowPackaging] = useState(false);

  const isRound2View = viewingRound === 2;

  const renderRouteCard = (ev: RouteEvaluation) => {
    const r = ev.route;
    const isViewing = r.id === viewingRouteId;
    const isLockedR1 = round1Decision?.routeId === r.id;
    const isLockedR2 = round2Decision?.routeId === r.id;

    return (
      <button
        key={r.id}
        type="button"
        onClick={() => onSelectRoute(r.id)}
        aria-pressed={isViewing}
        className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
          isViewing
            ? isDark
              ? 'bg-slate-900 border-blue-500 ring-1 ring-blue-500/40'
              : 'bg-blue-50/40 border-blue-600 ring-1 ring-blue-600/20'
            : isDark
            ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
              {r.code}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              {isViewing ? 'Đang xem' : `${ev.legs.length} chặng`}
            </span>
          </div>

          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug break-words">
            {r.name}
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed break-words">
            {ev.shortModeSequence}
          </div>

          {(isLockedR1 || isLockedR2) && (
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex flex-wrap gap-x-2">
              {isLockedR1 && <span>Đã chốt Vòng 1</span>}
              {isLockedR1 && isLockedR2 && <span aria-hidden="true">·</span>}
              {isLockedR2 && <span>Đã chốt Vòng 2</span>}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
          {ev.validation.isValid ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Thời gian</div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {ev.activeTimeRangeLabel}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Muộn nhất: ngày {ev.committedMaxDays}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Tổng phí cả lô</div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {formatWorkshopUSD(ev.totalCostUSD)} USD
                </div>
                {isRound2View && ev.extraTroubleCostUSD > 0 ? (
                  <div className="text-xs font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                    +{formatWorkshopUSD(ev.extraTroubleCostUSD)} USD
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {ev.pricingBasis === 'WORKSHOP_QUOTE' ? 'Báo giá trọn gói' : 'Giá ước tính'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>Tuyến chưa hợp lệ — mở Tự thiết kế để sửa chặng lỗi.</span>
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div id="nhiem-vu" className="space-y-6 scroll-mt-20">
      {/* 1. THẺ NHIỆM VỤ & YÊU CẦU HIỆN TẠI CỦA KHÁCH */}
      <section
        aria-label="Yêu cầu hiện tại của khách hàng"
        className={`relative rounded-2xl border p-5 sm:p-6 transition-all duration-500 ${
          isRound2View
            ? isDark
              ? 'bg-slate-900 border-rose-500/50 shadow-[0_0_0_1px_rgba(56,189,248,0.12)]'
              : 'bg-white border-rose-300 shadow-[0_2px_16px_-6px_rgba(14,165,233,0.12)]'
            : isDark
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-slate-200'
        }`}
      >
        <MissionCardFestiveAccent
          enabled={isFestive}
          isDark={isDark}
          isRound2={isRound2View}
        />
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span
                className={`inline-flex items-center gap-1.5 ${
                  isRound2View
                    ? 'text-rose-600 dark:text-rose-400 font-bold'
                    : 'text-blue-600 dark:text-blue-400 font-bold'
                }`}
              >
                {isRound2View && <AnimatedSnowflakeEmblem enabled={isFestive} className="w-3.5 h-3.5 text-sky-500 dark:text-sky-300 shrink-0" />}
                <span>{isRound2View ? 'Vòng 2 · Sự cố Giáng sinh' : 'Vòng 1 · Khảo sát ban đầu'}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>Yêu cầu hiện tại của khách</span>
              <span aria-hidden="true">·</span>
              <span>VSIP II Bình Dương → Kho Stuttgart (Đức)</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white text-balance leading-tight">
              Giao đủ 7 pallet bo mạch từ Bình Dương đến Stuttgart
            </h2>

            {isRound2View ? (
              <blockquote
                className={`p-4 rounded-xl border text-sm sm:text-base leading-relaxed ${
                  isDark
                    ? 'bg-rose-950/25 border-rose-500/30 text-slate-100'
                    : 'bg-rose-50/60 border-rose-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 mb-1.5">
                  <Siren className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Tin nhắn mới từ nhà máy Stuttgart (Cao điểm Giáng sinh)</span>
                  <AnimatedSnowflakeEmblem enabled={isFestive} className="w-3.5 h-3.5 text-sky-500 dark:text-sky-300 shrink-0 ml-auto" />
                </div>
                <p>“{ROUND_2_CUSTOMER_QUOTE}”</p>
              </blockquote>
            ) : (
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Nhà máy chỉ tính đã giao khi nhận <strong>đủ cả 7 pallet</strong>. Ở Vòng 1, khách mong muốn nhận trong <strong>25–30 ngày</strong>, cho phép đến <strong>ngày 35</strong> và có thể hẹn nhận sớm. Ngân sách mục tiêu <strong>8.000 – 12.000 USD</strong> (dưới 8.000 USD là tiết kiệm nếu đạt điều kiện giao).
              </p>
            )}

            {/* Key Constraints Strip (Unboxed clean metrics) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {isRound2View ? 'Hạn chốt nhận đủ hàng' : 'Hạn giao Vòng 1'}
                </div>
                <div className="font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {isRound2View ? 'Chậm nhất ngày 30' : 'Tối đa ngày 35'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isRound2View
                    ? 'Đánh giá theo ngày giao muộn nhất'
                    : 'Mong muốn 25–30 ngày · Có thể nhận sớm'}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Ngân sách đơn hàng
                </div>
                <div className="font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  8.000 – 12.000 USD
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isRound2View
                    ? 'Tối đa 15.000 USD · Dưới 8.000 USD là tiết kiệm'
                    : 'Tối đa 12.000 USD · Dưới 8.000 USD là tiết kiệm'}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Quy cách lô hàng
                </div>
                <div className="font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  7 pallet · 3.282,2 kg
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  3.750 bo mạch · 134 thùng · 9,13 m³
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Stack */}
          <div className="flex flex-col gap-2.5 lg:w-64 shrink-0">
            <button
              type="button"
              onClick={onScrollToComparison}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span>So sánh 4 tuyến</span>
              <ArrowDown className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onScrollToDecision}
              className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                  : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <span>
                {!round1Decision
                  ? 'Chốt lựa chọn Vòng 1'
                  : !round2Decision
                  ? 'Chốt lựa chọn Vòng 2'
                  : 'Xem tóm tắt & nộp bài'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowPackaging((prev) => !prev)}
              aria-expanded={showPackaging}
              className={`w-full min-h-[44px] px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isDark
                  ? 'bg-transparent border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  : 'bg-transparent border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Xem cách đóng gói</span>
              {showPackaging ? (
                <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Packaging Details (Reconciled Numbers per Section 4) */}
        {showPackaging && (
          <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Chi tiết đóng gói và cơ sở tính khối lượng / thể tích
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Đơn vị: cm · kg · m³ · hệ số quy đổi hàng không 6.000
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  1. Bo mạch &amp; thùng carton
                </div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  3.750 bo · 134 thùng
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Bo mạch 22 × 14 × 3 cm (0,8 kg/bo). Thùng 55 × 38 × 25 cm (vỏ 0,8 kg), chứa 28 bo/thùng → <strong>133 thùng đủ</strong> (28 bo) + <strong>1 thùng lẻ</strong> (26 bo).
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  2. Chiều cao xếp 7 pallet Euro
                </div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  139,4 cm (đủ) · 114,4 cm (lẻ)
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pallet Euro 120 × 80 × 14,4 cm (4 thùng/lớp): <strong>6 pallet đủ</strong> (20 thùng, 5 lớp = 5×25 + 14,4 = <strong>139,4 cm</strong>) + <strong>1 pallet lẻ</strong> (14 thùng, 4 lớp = <strong>114,4 cm</strong>).
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  3. Tiến trình khối lượng thực tế
                </div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  3.000 → 3.107,2 → 3.282,2 kg
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Bo mạch: <strong>3.000 kg</strong> → Cả 134 vỏ carton (+107,2 kg): <strong>3.107,2 kg</strong> → Cả 7 vỏ pallet (giả định 25 kg/pallet, +175 kg): <strong>3.282,2 kg</strong> (cơ sở tính phí lưu kho hàng không PA-B).
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  4. Thể tích quy đổi hàng không
                </div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  1.167 kg (rời) · 1.521,28 kg (pallet)
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Theo 134 thùng rời: (134×55×38×25)/6.000 = <strong>1.167 kg</strong>. Theo 7 pallet đã xếp ({cargo.palletizedVolumeCBM.toLocaleString('vi-VN', { maximumFractionDigits: 5 })} m³): <strong>1.521,28 kg</strong>. Nhỏ hơn 3.282,2 kg nên tính cước theo cân nặng thực tế.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Round Switcher & Progression Strip */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="w-full sm:w-auto">
            <div
              role="tablist"
              aria-label="Chọn vòng đang xem"
              className={`grid grid-cols-1 sm:inline-flex items-stretch sm:items-center gap-1 sm:gap-0 p-1 rounded-xl border w-full sm:w-auto ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewingRound === 1}
                onClick={() => onChangeViewingRound(1)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-center ${
                  viewingRound === 1
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Vòng 1 · Điều kiện thường
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={viewingRound === 2}
                disabled={unlockedRound < 2}
                onClick={() => onChangeViewingRound(2)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  unlockedRound < 2
                    ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    : viewingRound === 2
                    ? 'bg-rose-600 text-white cursor-pointer'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer'
                }`}
              >
                {unlockedRound < 2 ? (
                  <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <Siren className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>Vòng 2 · Sự cố Giáng sinh</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            {unlockedRound < 2 ? (
              <span>
                Hoàn thành <strong>Chốt Vòng 1</strong> ở phần Phiếu quyết định để mở tình huống Giáng sinh (Vòng 2).
              </span>
            ) : (
              <span>
                Đã mở Vòng 2. Bạn có thể chuyển qua lại để xem lại Vòng 1 mà không làm mất bản ghi đã chốt.
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 2. 4 TUYẾN CỦA ĐỀ (PA-A, PA-B, PA-C, PA-D) */}
      <section aria-label="4 tuyến chuẩn của đề" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              4 tuyến của đề ({isRound2View ? 'Vòng 2 · Có sự cố Giáng sinh' : 'Vòng 1 · Chưa có sự cố'})
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Bấm vào một tuyến để xem lộ trình trên bản đồ và đối chiếu chi tiết. Bấm xem không làm thay đổi lựa chọn đã chốt.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenRouteBuilder}
            className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Tự thiết kế tuyến thử</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {officialEvaluations.map(renderRouteCard)}
        </div>
      </section>

      {/* 3. TUYẾN NHÓM THỬ (TÁCH BIỆT KHỎI 4 TUYẾN CHUẨN) */}
      {customEvaluations.length > 0 && (
        <section aria-label="Tuyến nhóm thử" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tuyến nhóm thử ({customEvaluations.length} tuyến)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Các bản sao và tuyến mở rộng do nhóm tự tạo (tách riêng với 4 tuyến chuẩn của đề).
              </p>
            </div>

            <button
              type="button"
              onClick={onCreateCustomCopyFromViewing}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              + Nhân bản tuyến đang xem
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {customEvaluations.map(renderRouteCard)}
          </div>
        </section>
      )}
    </div>
  );
};
