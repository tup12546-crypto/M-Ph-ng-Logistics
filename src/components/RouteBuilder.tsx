/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  ExtendedTemplateKey,
  OfficialRouteKey,
  RouteEvaluation,
  RouteOption,
  TransportMode,
  WorkshopRound
} from '../types/logistics';
import {
  EXTENDED_ROUTE_TEMPLATES,
  LOCATION_HUBS,
  OFFICIAL_ROUTE_KEYS,
  OFFICIAL_ROUTE_SPECS
} from '../data/defaultData';
import {
  applyTemplateToCustomRoute,
  buildLegsForSequence,
  formatWorkshopUSD,
  getHubById,
  getModeLabelVi,
  matchRouteTemplate
} from '../utils/logisticsEngine';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CopyPlus,
  Lock,
  Plus,
  Plane,
  Ship,
  Train,
  Trash2,
  Truck
} from 'lucide-react';

interface RouteBuilderProps {
  officialEvaluations: RouteEvaluation[];
  customEvaluations: RouteEvaluation[];
  viewingRouteId: string;
  onSelectRoute: (routeId: string) => void;
  onCreateCustomCopy: (sourceRoute: RouteOption) => void;
  onUpdateCustomRoute: (updatedRoute: RouteOption) => void;
  onDeleteCustomRoute: (routeId: string) => void;
  onBackToMain: () => void;
  viewingRound: WorkshopRound;
  isDark?: boolean;
}

const MODE_OPTIONS: Array<{ mode: TransportMode; label: string; icon: React.ReactNode }> = [
  { mode: 'ROAD', label: 'Xe tải', icon: <Truck className="w-3.5 h-3.5" /> },
  { mode: 'SEA', label: 'Tàu biển', icon: <Ship className="w-3.5 h-3.5" /> },
  { mode: 'RAIL', label: 'Đường sắt', icon: <Train className="w-3.5 h-3.5" /> },
  { mode: 'AIR', label: 'Máy bay', icon: <Plane className="w-3.5 h-3.5" /> }
];

export const RouteBuilder: React.FC<RouteBuilderProps> = ({
  officialEvaluations,
  customEvaluations,
  viewingRouteId,
  onSelectRoute,
  onCreateCustomCopy,
  onUpdateCustomRoute,
  onDeleteCustomRoute,
  onBackToMain,
  viewingRound,
  isDark = false
}) => {
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [userEditedNameIds, setUserEditedNameIds] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const allEvaluations = useMemo(
    () => [...officialEvaluations, ...customEvaluations],
    [officialEvaluations, customEvaluations]
  );

  const activeEval =
    allEvaluations.find((ev) => ev.route.id === viewingRouteId) || officialEvaluations[0];
  const activeRoute = activeEval.route;
  const isOfficialRoute = Boolean(activeRoute.isOfficial);

  const warehouseHubs = useMemo(
    () => LOCATION_HUBS.filter((h) => h.type === 'WAREHOUSE'),
    []
  );
  const intermediateHubs = useMemo(
    () => LOCATION_HUBS.filter((h) => h.type !== 'WAREHOUSE' && h.type !== 'DESTINATION'),
    []
  );

  const commitHubsAndModes = (nextHubIds: string[], nextModes: TransportMode[]) => {
    const matched = matchRouteTemplate(nextHubIds, nextModes);
    const updated: RouteOption = {
      ...activeRoute,
      hubIds: nextHubIds,
      legs: buildLegsForSequence(activeRoute.id, nextHubIds, nextModes),
      appliedTemplateKey: matched
    };
    onUpdateCustomRoute(updated);
  };

  const handleApplyTemplate = (templateKey: OfficialRouteKey | ExtendedTemplateKey) => {
    const preserveCustomName = Boolean(userEditedNameIds[activeRoute.id]);
    const updated = applyTemplateToCustomRoute(activeRoute, templateKey, preserveCustomName);
    onUpdateCustomRoute(updated);
  };

  const handleChangeOrigin = (newOriginId: string) => {
    const nextHubIds = [...activeRoute.hubIds];
    nextHubIds[0] = newOriginId;
    const currentModes = activeRoute.legs.map((l) => l.mode);
    commitHubsAndModes(nextHubIds, currentModes);
  };

  const handleChangeIntermediateHub = (hubIndex: number, newHubId: string) => {
    const nextHubIds = [...activeRoute.hubIds];
    nextHubIds[hubIndex] = newHubId;
    const currentModes = activeRoute.legs.map((l) => l.mode);
    commitHubsAndModes(nextHubIds, currentModes);
  };

  const handleAddIntermediateHub = () => {
    if (activeRoute.hubIds.length >= 7) return;
    // Pick a sensible default hub not yet in the route
    const unused = intermediateHubs.find((h) => !activeRoute.hubIds.includes(h.id)) || intermediateHubs[0];
    const insertIdx = activeRoute.hubIds.length - 1;
    const nextHubIds = [
      ...activeRoute.hubIds.slice(0, insertIdx),
      unused.id,
      activeRoute.hubIds[insertIdx]
    ];
    const currentModes = activeRoute.legs.map((l) => l.mode);
    const nextModes: TransportMode[] = [
      ...currentModes.slice(0, insertIdx - 1),
      currentModes[insertIdx - 1] || 'ROAD',
      'ROAD'
    ];
    commitHubsAndModes(nextHubIds, nextModes);
  };

  const handleRemoveIntermediateHub = (hubIndex: number) => {
    if (activeRoute.hubIds.length <= 2) return;
    if (hubIndex <= 0 || hubIndex >= activeRoute.hubIds.length - 1) return;
    const nextHubIds = activeRoute.hubIds.filter((_, idx) => idx !== hubIndex);
    const currentModes = activeRoute.legs.map((l) => l.mode);
    // Remove leg entering removed hub, keep remaining
    const nextModes = currentModes.filter((_, idx) => idx !== hubIndex - 1);
    commitHubsAndModes(nextHubIds, nextModes);
  };

  const handleChangeLegMode = (legIndex: number, mode: TransportMode) => {
    const nextModes = activeRoute.legs.map((l, idx) => (idx === legIndex ? mode : l.mode));
    commitHubsAndModes([...activeRoute.hubIds], nextModes);
  };

  const originHub = getHubById(activeRoute.hubIds[0]);
  const destHub = getHubById(activeRoute.hubIds[activeRoute.hubIds.length - 1]);

  // If currently viewing one of the 4 official routes, protect it and prompt to clone into "Tuyến nhóm thử"
  if (isOfficialRoute) {
    return (
      <section
        data-testid="route-builder-official-guard"
        className={`rounded-2xl border p-5 sm:p-6 space-y-5 ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Bảo vệ 4 tuyến gốc của đề bài</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              {activeRoute.code} là tuyến chuẩn của đề — hãy tạo bản sao để thử nghiệm
            </h2>
            <p className={`text-sm max-w-2xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Để giữ nguyên số liệu gốc của 4 phương án A, B, C, D phục vụ so sánh và đối chiếu cuối buổi,
              bạn không sửa trực tiếp lên {activeRoute.code}. Hãy tạo một bản sao vào mục{' '}
              <strong>Tuyến nhóm thử</strong> để tự do đổi điểm trung chuyển, phương thức hoặc áp 4 mẫu mở rộng.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToMain}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border shrink-0 transition-colors ${
              isDark
                ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay về bài chính</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => onCreateCustomCopy(activeRoute)}
            data-testid="builder-create-copy-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <CopyPlus className="w-4 h-4" />
            <span>Tạo bản sao từ {activeRoute.code} vào Tuyến nhóm thử</span>
          </button>
        </div>

        {customEvaluations.length > 0 && (
          <div
            className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Hoặc tiếp tục chỉnh sửa tuyến nhóm đã tạo ({customEvaluations.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {customEvaluations.map((ev) => (
                <button
                  key={ev.route.id}
                  type="button"
                  onClick={() => onSelectRoute(ev.route.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span className="font-mono text-blue-600 dark:text-blue-400 mr-1.5">
                    {ev.route.code}
                  </span>
                  <span>{ev.route.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  // Editing a custom route
  return (
    <section
      data-testid="route-builder-editor"
      className={`rounded-2xl border overflow-hidden ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Top Editing Header */}
      <div
        className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/70'
        }`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Tuyến nhóm thử · {activeRoute.code}
            </span>
            <span
              className={`text-xs font-semibold ${
                activeEval.validation.isValid
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {activeEval.validation.isValid
                ? `Hợp lệ (${originHub?.shortName || 'Việt Nam'} → ${destHub?.shortName || 'Stuttgart'})`
                : `Chưa hợp lệ (${activeEval.validation.allErrors.length} lỗi cần sửa)`}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight mt-0.5 truncate">
            Đang chỉnh sửa: {activeRoute.code} — {activeRoute.name}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onBackToMain}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              isDark
                ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay về bài chính</span>
          </button>

          {confirmDeleteId === activeRoute.id ? (
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteId(null);
                  onDeleteCustomRoute(activeRoute.id);
                }}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Xác nhận xóa {activeRoute.code}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className={`px-2.5 py-2 rounded-lg text-xs font-semibold border ${
                  isDark
                    ? 'border-slate-700 text-slate-300'
                    : 'border-slate-300 text-slate-700'
                }`}
              >
                Hủy
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDeleteId(activeRoute.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                isDark
                  ? 'border-rose-900/70 bg-rose-950/30 text-rose-300 hover:bg-rose-950/60'
                  : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa tuyến này</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Custom Route Switcher if multiple custom routes exist */}
        {customEvaluations.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Các tuyến nhóm đang thử:
            </span>
            {customEvaluations.map((ev) => (
              <button
                key={ev.route.id}
                type="button"
                onClick={() => onSelectRoute(ev.route.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  ev.route.id === activeRoute.id
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {ev.route.code}
              </button>
            ))}
          </div>
        )}

        {/* Two separated template groups: 4 Official Workshop Templates + 4 Extended Templates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            className={`rounded-xl border p-4 ${
              isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/70'
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Áp nhanh 4 mẫu chuẩn của đề (báo giá workshop)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {OFFICIAL_ROUTE_KEYS.map((key) => {
                const spec = OFFICIAL_ROUTE_SPECS[key];
                const isMatched = activeEval.matchedTemplateKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    data-testid={`apply-template-${key}`}
                    onClick={() => handleApplyTemplate(key)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                      isMatched
                        ? isDark
                          ? 'border-blue-500 bg-blue-950/50 text-blue-200'
                          : 'border-blue-600 bg-blue-50 text-blue-900'
                        : isDark
                        ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {spec.code} · {formatWorkshopUSD(spec.baseAllInCostUSD)} USD
                    </div>
                    <div className="truncate opacity-80 mt-0.5">{spec.expectedTimeRange}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 ${
              isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/70'
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              4 mẫu mở rộng để thử thêm (giá ước tính)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXTENDED_ROUTE_TEMPLATES.map((ext) => {
                const isMatched = activeEval.matchedTemplateKey === ext.key;
                return (
                  <button
                    key={ext.key}
                    type="button"
                    data-testid={`apply-template-${ext.key}`}
                    onClick={() => handleApplyTemplate(ext.key)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                      isMatched
                        ? isDark
                          ? 'border-indigo-500 bg-indigo-950/50 text-indigo-200'
                          : 'border-indigo-600 bg-indigo-50 text-indigo-900'
                        : isDark
                        ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="font-semibold truncate">{ext.name.split(':')[0]}</div>
                    <div className="truncate opacity-80 mt-0.5">
                      {ext.name.split(':')[1]?.trim() || ext.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Route Name & Notes (preserved across hub/mode edits) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="custom-route-name"
              className="block text-xs font-semibold mb-1.5"
            >
              Tên tuyến thử của nhóm
            </label>
            <input
              id="custom-route-name"
              data-testid="custom-route-name-input"
              type="text"
              value={activeRoute.name}
              onChange={(e) => {
                setUserEditedNameIds((prev) => ({ ...prev, [activeRoute.id]: true }));
                onUpdateCustomRoute({ ...activeRoute, name: e.target.value });
              }}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium ${
                isDark
                  ? 'border-slate-700 bg-slate-950 text-slate-100 focus:border-blue-500'
                  : 'border-slate-300 bg-white text-slate-900 focus:border-blue-600'
              } focus:outline-none`}
            />
          </div>
          <div>
            <label
              htmlFor="custom-route-notes"
              className="block text-xs font-semibold mb-1.5"
            >
              Ghi chú phương án thử
            </label>
            <input
              id="custom-route-notes"
              data-testid="custom-route-notes-input"
              type="text"
              value={activeRoute.notes}
              onChange={(e) => {
                onUpdateCustomRoute({ ...activeRoute, notes: e.target.value });
              }}
              placeholder="Ví dụ: Thử đổi sang đi qua cảng Rotterdam kết hợp đường sắt..."
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm ${
                isDark
                  ? 'border-slate-700 bg-slate-950 text-slate-100 focus:border-blue-500'
                  : 'border-slate-300 bg-white text-slate-900 focus:border-blue-600'
              } focus:outline-none`}
            />
          </div>
        </div>

        {/* Live Evaluation Summary Bar */}
        <div
          className={`rounded-xl border p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 ${
            !activeEval.validation.isValid
              ? isDark
                ? 'border-rose-800 bg-rose-950/30'
                : 'border-rose-300 bg-rose-50'
              : isDark
              ? 'border-slate-800 bg-slate-950/70'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div>
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Thời gian (Vòng {viewingRound})
            </p>
            <p className="font-mono text-base font-bold tabular-nums mt-0.5">
              {activeEval.activeTimeRangeLabel}
            </p>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Muộn nhất ngày {activeEval.committedMaxDays} (hạn ngày {activeEval.roundDaysLimit})
            </p>
          </div>
          <div>
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tổng chi phí (Vòng {viewingRound})
            </p>
            <p className="font-mono text-base font-bold tabular-nums mt-0.5">
              {formatWorkshopUSD(activeEval.totalCostUSD)} USD
            </p>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {activeEval.pricingBasis === 'WORKSHOP_QUOTE'
                ? 'Báo giá trọn gói workshop'
                : 'Giá ước tính (chặng + phí nút)'}
            </p>
          </div>
          <div>
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Mức phủ sự cố Vòng 2
            </p>
            <p className="text-xs font-semibold mt-1">
              {activeEval.troubleCoverage === 'OFFICIAL'
                ? 'Đủ kịch bản chuẩn đề'
                : activeEval.troubleCoverage === 'ESTIMATED_PARTIAL'
                ? 'Áp phụ phí từng phần'
                : 'Chưa có kịch bản cho tuyến này'}
            </p>
          </div>
          <div>
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Trạng thái hạ tầng
            </p>
            <p className="text-xs font-bold mt-1 flex items-center gap-1.5">
              {activeEval.validation.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>
                {activeEval.validation.isValid ? 'Tuyến hợp lệ' : 'Tuyến chưa hợp lệ'}
              </span>
            </p>
          </div>
        </div>

        {/* Origin & Intermediate Hubs + Per-leg Mode Editor */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold">
                Chuỗi điểm dừng & phương thức từng chặng ({activeRoute.legs.length} chặng)
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {activeEval.fullItineraryLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddIntermediateHub}
              disabled={activeRoute.hubIds.length >= 7}
              data-testid="builder-add-hub-btn"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 ${
                isDark
                  ? 'border-blue-500/50 bg-blue-950/40 text-blue-300 hover:bg-blue-950/70'
                  : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm điểm trung gian</span>
            </button>
          </div>

          <div className="space-y-3">
            {activeRoute.hubIds.map((hubId, idx) => {
              const hub = getHubById(hubId);
              const isOrigin = idx === 0;
              const isDest = idx === activeRoute.hubIds.length - 1;
              const leg = idx < activeRoute.legs.length ? activeRoute.legs[idx] : null;
              const legError = leg ? activeEval.validation.legErrors[idx] : undefined;
              const nextHub = leg ? getHubById(leg.toHubId) : undefined;

              return (
                <div key={`stop-${idx}`} className="space-y-2.5">
                  {/* Stop row */}
                  <div
                    className={`rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                          isOrigin
                            ? 'bg-emerald-600 text-white'
                            : isDest
                            ? 'bg-blue-600 text-white'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      {isOrigin ? (
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor="builder-origin-select"
                            className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            Kho xuất phát (chế độ thử thêm)
                          </label>
                          <select
                            id="builder-origin-select"
                            data-testid="builder-origin-select"
                            value={hubId}
                            onChange={(e) => handleChangeOrigin(e.target.value)}
                            className={`w-full sm:max-w-md px-3 py-1.5 rounded-lg border text-sm font-medium ${
                              isDark
                                ? 'border-slate-700 bg-slate-900 text-slate-100'
                                : 'border-slate-300 bg-white text-slate-900'
                            }`}
                          >
                            {warehouseHubs.map((wh) => (
                              <option key={wh.id} value={wh.id}>
                                {wh.name} ({wh.code})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : isDest ? (
                        <div className="min-w-0">
                          <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Điểm giao hàng cuối cùng (cố định)
                          </p>
                          <p className="text-sm font-bold truncate">
                            {hub?.name || hubId} ({hub?.code})
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={`builder-hub-${idx}`}
                            className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            Điểm dừng trung gian #{idx}
                          </label>
                          <select
                            id={`builder-hub-${idx}`}
                            data-testid={`builder-hub-select-${idx}`}
                            value={hubId}
                            onChange={(e) => handleChangeIntermediateHub(idx, e.target.value)}
                            className={`w-full sm:max-w-md px-3 py-1.5 rounded-lg border text-sm font-medium ${
                              isDark
                                ? 'border-slate-700 bg-slate-900 text-slate-100'
                                : 'border-slate-300 bg-white text-slate-900'
                            }`}
                          >
                            {intermediateHubs.map((ih) => (
                              <option key={ih.id} value={ih.id}>
                                {ih.name} ({ih.code}) — Hỗ trợ:{' '}
                                {ih.allowedModes.map(getModeLabelVi).join(', ')}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {!isOrigin && !isDest && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIntermediateHub(idx)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border self-end sm:self-center ${
                          isDark
                            ? 'border-slate-700 text-slate-400 hover:text-rose-300 hover:border-rose-800'
                            : 'border-slate-300 text-slate-600 hover:text-rose-700 hover:border-rose-300'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Bỏ điểm</span>
                      </button>
                    )}
                  </div>

                  {/* Leg Mode Selector Card */}
                  {leg && hub && nextHub && (
                    <div
                      className={`ml-3 sm:ml-6 pl-4 border-l-2 space-y-2 ${
                        legError
                          ? 'border-rose-500'
                          : isDark
                          ? 'border-slate-700'
                          : 'border-slate-300'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold">
                          Chặng {idx + 1}: {hub.shortName} → {nextHub.shortName}
                        </span>
                        <span className={`font-mono text-xs tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {leg.distanceKm.toLocaleString('vi-VN')} km · ~{leg.baseDurationDays} ngày ·{' '}
                          {formatWorkshopUSD(leg.baseCost)} USD (cước chặng)
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {MODE_OPTIONS.map((opt) => {
                          const isCurrent = leg.mode === opt.mode;
                          const isSupportedBoth =
                            hub.id !== nextHub.id &&
                            hub.allowedModes.includes(opt.mode) &&
                            nextHub.allowedModes.includes(opt.mode);
                          return (
                            <button
                              key={opt.mode}
                              type="button"
                              data-testid={`leg-${idx}-mode-${opt.mode}`}
                              onClick={() => handleChangeLegMode(idx, opt.mode)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                isCurrent
                                  ? isSupportedBoth
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-rose-600 text-white border-rose-600'
                                  : isSupportedBoth
                                  ? isDark
                                    ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                                  : isDark
                                  ? 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300'
                                  : 'border-slate-200 bg-slate-100 text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              {opt.icon}
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Inline per-leg validation warning + concrete fix hint (P0-3) */}
                      {legError && (
                        <div
                          role="alert"
                          data-testid={`leg-error-${idx}`}
                          className={`rounded-lg border px-3 py-2.5 text-xs flex items-start gap-2 ${
                            isDark
                              ? 'border-rose-800/80 bg-rose-950/40 text-rose-200'
                              : 'border-rose-300 bg-rose-50 text-rose-900'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                          <div className="space-y-0.5">
                            <p className="font-bold">{legError.message}</p>
                            <p className="opacity-95">
                              <span className="font-semibold">Gợi ý sửa:</span> {legError.fixHint}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Collapsible Transparent Cost Breakdown */}
        <div
          className={`rounded-xl border overflow-hidden ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => setShowCostBreakdown((v) => !v)}
            className={`w-full px-4 py-3 flex items-center justify-between text-xs font-semibold transition-colors ${
              isDark
                ? 'bg-slate-950/60 hover:bg-slate-800/60 text-slate-200'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <span>
              Xem bảng cộng chi phí {activeEval.pricingBasis === 'WORKSHOP_QUOTE' ? '(báo giá workshop)' : '(giá ước tính)'} & giả định thời gian
            </span>
            {showCostBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showCostBreakdown && (
            <div className="p-4 space-y-3 text-xs border-t border-slate-200 dark:border-slate-800">
              <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                {activeEval.troubleCoverageNote}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  className={`rounded-lg border p-3 ${
                    isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <p className="font-bold mb-2">Cước vận chuyển từng chặng</p>
                  <ul className="space-y-1.5">
                    {activeEval.legs.map((l) => (
                      <li key={l.legId} className="flex justify-between gap-2">
                        <span className="truncate">
                          Chặng {l.legIndex + 1} ({getModeLabelVi(l.mode)}: {l.fromHub.shortName} →{' '}
                          {l.toHub.shortName})
                        </span>
                        <span className="font-mono font-semibold tabular-nums shrink-0">
                          {formatWorkshopUSD(l.effectiveCostUSD)} USD
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className={`rounded-lg border p-3 ${
                    isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <p className="font-bold mb-2">
                    Phí xử lý tại các điểm dừng{' '}
                    <span className="font-normal opacity-80">
                      ({activeEval.pricingBasis === 'WORKSHOP_QUOTE'
                        ? 'đã gồm trong giá trọn gói'
                        : 'cộng vào giá ước tính'})
                    </span>
                  </p>
                  <ul className="space-y-1.5">
                    {activeEval.hubs.map((h) => (
                      <li key={`${h.hub.id}-${h.hubIndex}`} className="flex justify-between gap-2">
                        <span className="truncate">{h.hub.shortName}</span>
                        <span className="font-mono font-semibold tabular-nums shrink-0">
                          {formatWorkshopUSD(h.effectiveCostUSD)} USD
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
