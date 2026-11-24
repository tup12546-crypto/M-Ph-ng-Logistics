/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RouteEvaluation, WorkshopRound } from '../types/logistics';
import { formatWorkshopUSD, getModeLabelVi } from '../utils/logisticsEngine';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Info,
  Siren,
  ThumbsDown,
  ThumbsUp
} from 'lucide-react';

interface AnalyticsOptimizationProps {
  officialEvaluations: RouteEvaluation[];
  customEvaluations: RouteEvaluation[];
  viewingRouteId: string;
  onSelectRoute: (routeId: string) => void;
  viewingRound: WorkshopRound;
  isDark?: boolean;
}

export const AnalyticsOptimization: React.FC<AnalyticsOptimizationProps> = ({
  officialEvaluations,
  customEvaluations,
  viewingRouteId,
  onSelectRoute,
  viewingRound,
  isDark = false
}) => {
  const [expandedLegsRouteId, setExpandedLegsRouteId] = useState<string | null>(null);
  const [showReliabilityInfo, setShowReliabilityInfo] = useState(false);

  const allEvaluations = [...officialEvaluations, ...customEvaluations];
  const selectedEval =
    allEvaluations.find((ev) => ev.route.id === viewingRouteId) || officialEvaluations[0];

  const isRound2 = viewingRound === 2;
  const totalRouteCount = allEvaluations.length;

  const renderTableRow = (ev: RouteEvaluation) => {
    const r = ev.route;
    const isSelected = r.id === viewingRouteId;

    return (
      <tr
        key={r.id}
        onClick={() => onSelectRoute(r.id)}
        className={`transition-colors cursor-pointer ${
          isSelected
            ? isDark
              ? 'bg-blue-950/35'
              : 'bg-blue-50/70'
            : isDark
            ? 'hover:bg-slate-800/40'
            : 'hover:bg-slate-50'
        }`}
      >
        <td className="py-3.5 px-4 align-top">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
              {r.code}
            </span>
            {r.isCustom && (
              <span className="text-xs text-slate-500 dark:text-slate-400">· Tuyến thử</span>
            )}
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 break-words max-w-md">
            {r.name}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
            {ev.shortModeSequence} · {ev.legs.length} chặng
          </div>
        </td>

        <td className="py-3.5 px-3 align-top whitespace-nowrap">
          {ev.validation.isValid ? (
            <>
              <div className="font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                {ev.activeTimeRangeLabel}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Muộn nhất: ngày {ev.committedMaxDays}
                {isRound2 && ev.extraTroubleDays > 0 ? ` (+${ev.extraTroubleDays} ngày sự cố)` : ''}
              </div>
            </>
          ) : (
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Chưa tính (lỗi tuyến)
            </span>
          )}
        </td>

        <td className="py-3.5 px-3 align-top whitespace-nowrap">
          {ev.validation.isValid ? (
            <>
              <div className="font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                {formatWorkshopUSD(ev.totalCostUSD)} USD
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                {isRound2 && ev.extraTroubleCostUSD > 0
                  ? `Gốc ${formatWorkshopUSD(ev.baseCostUSD)} + ${formatWorkshopUSD(ev.extraTroubleCostUSD)}`
                  : ev.pricingBasis === 'WORKSHOP_QUOTE'
                  ? 'Báo giá trọn gói'
                  : 'Giá ước tính'}
              </div>
            </>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </td>

        <td className="py-3.5 px-4 align-top">
          {ev.validation.isValid ? (
            <>
              <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 break-words">
                {ev.hubModelLabel}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs break-words">
                {isRound2 && ev.troubleIncidentSummary
                  ? ev.troubleIncidentSummary
                  : `${ev.transferPointsLabel} · ${ev.totalDistanceKm.toLocaleString('vi-VN')} km`}
              </div>
            </>
          ) : (
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 max-w-xs break-words">
              Tuyến chưa hợp lệ — cần sửa lỗi hạ tầng hoặc điểm trùng.
            </div>
          )}
        </td>
      </tr>
    );
  };

  const isLegsExpanded = expandedLegsRouteId === selectedEval.route.id;

  return (
    <div className="space-y-4">
      {/* 1. BẢNG ĐỌC NHANH */}
      <div
        className={`rounded-2xl border overflow-hidden transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Bảng so sánh {totalRouteCount} tuyến ({customEvaluations.length > 0 ? `4 tuyến chuẩn + ${customEvaluations.length} tuyến thử` : 'PA-A, PA-B, PA-C, PA-D'})
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {isRound2
                ? 'Vòng 2 · Hạn chậm nhất ngày 30 · Ngân sách 8.000–12.000 USD (tối đa 15.000 USD). Bấm vào một hàng để xem chi tiết cước gốc, phụ phí và từng chặng.'
                : 'Vòng 1 · Hạn tối đa ngày 35 (mong muốn 25–30 ngày) · Ngân sách 8.000–12.000 USD. Bấm vào một hàng để xem chi tiết đối chiếu.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowReliabilityInfo((v) => !v)}
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Ghi chú độ tin cậy</span>
          </button>
        </div>

        {showReliabilityInfo && (
          <div
            className={`px-4 sm:px-5 py-3 border-b text-xs leading-relaxed ${
              isDark
                ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <strong>Giả định độ tin cậy của workshop:</strong> Ở Vòng 1, A = 90%, B = 78%, C = 62%, D = 88% (phản ánh mức ổn định tương đối của mỗi chuỗi phương thức). Ở Vòng 2 khi xảy ra ùn tắc Giáng sinh, hệ thống trừ 12 điểm % cho 4 tuyến chuẩn (còn 78% / 66% / 50% / 76%) như một chỉ số tham khảo thảo luận, không thay thế điều kiện ngày và ngân sách của khách.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`border-b text-xs font-bold ${
                  isDark
                    ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <th className="py-3 px-4">Tuyến &amp; phương thức</th>
                <th className="py-3 px-3">Thời gian (đầu trên)</th>
                <th className="py-3 px-3">Tổng phí cả lô</th>
                <th className="py-3 px-4">
                  {isRound2 ? 'Mô hình tuyến & sự cố Vòng 2' : 'Mô hình tuyến & điểm dừng'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {officialEvaluations.map(renderTableRow)}
              {customEvaluations.length > 0 && (
                <tr className={isDark ? 'bg-slate-950/80' : 'bg-slate-100/80'}>
                  <td
                    colSpan={4}
                    className="py-2 px-4 text-xs font-bold text-slate-600 dark:text-slate-300"
                  >
                    Tuyến nhóm thử ({customEvaluations.length} tuyến)
                  </td>
                </tr>
              )}
              {customEvaluations.map(renderTableRow)}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. CHI TIẾT ĐỐI CHIẾU CỦA TUYẾN ĐANG XEM */}
      <div
        className={`rounded-2xl border p-5 space-y-5 transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              Bằng chứng chi tiết tuyến đang xem · {selectedEval.route.code}
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white break-words">
              {selectedEval.route.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 break-words">
              {selectedEval.fullItineraryLabel} · {selectedEval.hubModelLabel} · {selectedEval.totalDistanceKm.toLocaleString('vi-VN')} km · Độ tin cậy tham khảo: {Math.round(selectedEval.routeReliability * 100)}%
            </p>
          </div>

          <div className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
            {selectedEval.legs.length} chặng · {selectedEval.transferCount} lần chuyển tải
          </div>
        </div>

        {/* 4 Factual Decision Evidence Figures (students evaluate against customer limits themselves) */}
        {selectedEval.validation.isValid ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-0.5">
              <div className="text-xs text-slate-500 dark:text-slate-400">Ngày giao đủ muộn nhất</div>
              <div className="font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                Ngày {selectedEval.committedMaxDays}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Khoảng giao: {selectedEval.activeTimeRangeLabel}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Phát sinh thời gian (Vòng {viewingRound})
              </div>
              <div className="font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                {selectedEval.extraTroubleDays > 0
                  ? `+${selectedEval.extraTroubleDays} ngày`
                  : '0 ngày'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {selectedEval.extraTroubleDays > 0
                  ? 'Thời gian chậm thêm do cao điểm Giáng sinh'
                  : 'Chưa cộng ngày trễ sự cố'}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-xs text-slate-500 dark:text-slate-400">Tổng phí cả lô</div>
              <div className="font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                {formatWorkshopUSD(selectedEval.totalCostUSD)} USD
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {selectedEval.pricingBasis === 'WORKSHOP_QUOTE'
                  ? `Giá gốc ${formatWorkshopUSD(selectedEval.baseCostUSD)} USD (trọn gói đã gồm phí nút)`
                  : `Cước chặng ${formatWorkshopUSD(selectedEval.pureFreightCostUSD)} + Phí nút ${formatWorkshopUSD(selectedEval.totalHubHandlingCostUSD)}`}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Phụ phí sự cố &amp; quãng đường
              </div>
              <div className="font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                {selectedEval.extraTroubleCostUSD > 0
                  ? `+${formatWorkshopUSD(selectedEval.extraTroubleCostUSD)} USD`
                  : `${selectedEval.totalDistanceKm.toLocaleString('vi-VN')} km`}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {selectedEval.extraTroubleCostUSD > 0
                  ? `Quãng đường: ${selectedEval.totalDistanceKm.toLocaleString('vi-VN')} km`
                  : selectedEval.transferPointsLabel}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50/70 dark:bg-rose-950/30 text-sm text-rose-800 dark:text-rose-200">
            <strong>Tuyến đang chọn chưa hợp lệ:</strong> {selectedEval.validation.allErrors.join(' ')}
          </div>
        )}

        {/* Round 2 Incident Box */}
        {isRound2 && selectedEval.validation.isValid && (
          <div
            className={`p-4 rounded-xl border text-sm space-y-1.5 ${
              selectedEval.troubleCoverage === 'UNMODELED'
                ? isDark
                  ? 'bg-slate-950/70 border-slate-700 text-slate-200'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
                : isDark
                ? 'bg-rose-950/25 border-rose-500/40 text-slate-100'
                : 'bg-rose-50/60 border-rose-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
              <Siren className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {selectedEval.troubleCoverage === 'UNMODELED'
                  ? 'Chưa có kịch bản Giáng sinh cho tuyến này'
                  : `Tác động sự cố Giáng sinh trên ${selectedEval.route.code}`}
              </span>
            </div>
            <p className="leading-relaxed">
              {selectedEval.troubleIncidentSummary || selectedEval.troubleCoverageNote}
            </p>
            {selectedEval.costFormulaNote && (
              <p className="font-mono text-xs font-semibold text-rose-700 dark:text-rose-300">
                Công thức phụ phí: {selectedEval.costFormulaNote}
              </p>
            )}
          </div>
        )}

        {/* Dynamic Round-Aware Pros & Cons */}
        {selectedEval.validation.isValid && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                <ThumbsUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Điểm thuận lợi (Vòng {viewingRound})</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedEval.dynamicPros.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                <ThumbsDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Hạn chế &amp; rủi ro cần lưu ý (Vòng {viewingRound})</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedEval.dynamicCons.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Collapsible Leg-by-Leg & Cost Breakdown */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() =>
              setExpandedLegsRouteId(isLegsExpanded ? null : selectedEval.route.id)
            }
            aria-expanded={isLegsExpanded}
            className="min-h-[40px] text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            {isLegsExpanded ? (
              <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>
              {isLegsExpanded
                ? `Ẩn chi tiết ${selectedEval.legs.length} chặng & bảng cộng chi phí`
                : `Xem chi tiết ${selectedEval.legs.length} chặng & bảng cộng chi phí`}
            </span>
          </button>

          {isLegsExpanded && (
            <div className="mt-3 space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {selectedEval.pricingBasis === 'WORKSHOP_QUOTE'
                  ? `Lưu ý cơ cấu giá: Tổng phí gốc ${formatWorkshopUSD(selectedEval.baseCostUSD)} USD là báo giá trọn gói trong phiếu workshop (đã bao gồm phí xử lý bình thường tại các điểm dừng; không cộng thêm lần hai).`
                  : `Cơ cấu giá ước tính: Tổng cước ${selectedEval.legs.length} chặng (${formatWorkshopUSD(selectedEval.pureFreightCostUSD)} USD) + Phí xử lý bình thường tại ${selectedEval.hubs.length} điểm dừng (${formatWorkshopUSD(selectedEval.totalHubHandlingCostUSD)} USD) = ${formatWorkshopUSD(selectedEval.baseCostUSD)} USD.`}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr
                      className={`border-b font-semibold ${
                        isDark
                          ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <th className="py-2.5 px-3">Chặng</th>
                      <th className="py-2.5 px-3">Hành trình</th>
                      <th className="py-2.5 px-3">Phương thức</th>
                      <th className="py-2.5 px-3">Cự ly / Ước tính</th>
                      <th className="py-2.5 px-3">Ghi chú &amp; sự cố chặng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {selectedEval.legs.map((legEval, idx) => {
                      const rawLeg = selectedEval.route.legs[idx];
                      return (
                        <tr
                          key={legEval.legId}
                          className={
                            legEval.hasTroubleImpact
                              ? isDark
                                ? 'bg-rose-950/30'
                                : 'bg-rose-50/70'
                              : ''
                          }
                        >
                          <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">
                            Chặng {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap items-center gap-1 font-semibold">
                              <span>{legEval.fromHub.shortName}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                              <span>{legEval.toHub.shortName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                            {getModeLabelVi(legEval.mode)}
                          </td>
                          <td className="py-2.5 px-3 font-mono whitespace-nowrap tabular-nums">
                            {legEval.distanceKm.toLocaleString('vi-VN')} km · {legEval.effectiveDurationDays} ngày
                            {selectedEval.pricingBasis === 'ESTIMATED' && (
                              <div className="text-xs text-slate-500">
                                ~{formatWorkshopUSD(legEval.effectiveCostUSD)} USD
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-xs space-y-1">
                            {legEval.hasTroubleImpact && legEval.troubleImpactNote && (
                              <div className="font-bold text-rose-600 dark:text-rose-400">
                                Sự cố Vòng 2: {legEval.troubleImpactNote}
                              </div>
                            )}
                            {rawLeg?.pros && (
                              <div className="text-slate-700 dark:text-slate-300">
                                + {rawLeg.pros}
                              </div>
                            )}
                            {rawLeg?.cons && (
                              <div className="text-slate-500 dark:text-slate-400">
                                - {rawLeg.cons}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
