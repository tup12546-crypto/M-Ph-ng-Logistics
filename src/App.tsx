/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  LocationHub,
  RoundDecisionRecord,
  RouteOption,
  WorkshopRound,
  WorkshopSessionState
} from './types/logistics';
import { DEFAULT_CARGO_PARAMS } from './data/defaultData';
import {
  DEFAULT_ROUTES,
  createCustomRouteClone,
  evaluateRoute
} from './utils/logisticsEngine';
import {
  clearWorkshopSession,
  createInitialSessionState,
  loadWorkshopSession,
  saveWorkshopSession
} from './utils/workshopStorage';
import { ShipmentDashboard } from './components/ShipmentDashboard';
import { InteractiveMap } from './components/InteractiveMap';
import { AnalyticsOptimization } from './components/AnalyticsOptimization';
import { RouteBuilder } from './components/RouteBuilder';
import { WorkshopDecisionPanel } from './components/WorkshopDecisionPanel';
import {
  DEFAULT_MASTER_FORM_CONFIG,
  MasterFormConfig,
  clearMasterFormConfig,
  loadMasterFormConfig,
  saveMasterFormConfig
} from './utils/googleFormsUrl';
import {
  AlertTriangle,
  Compass,
  Moon,
  RotateCcw,
  Sliders,
  Snowflake,
  Sun,
  Table2,
  X
} from 'lucide-react';
import {
  ChristmasSnowCanvas,
  FestiveAmbientBackdrop,
  FooterWinterLogisticsScene,
  HeaderFairyLights,
  Round2FrostEdgeShimmer,
  Round2WinterArrivalBanner,
  SantaHatBrandBadge
} from './components/ChristmasDecorations';
import { ChristmasMusicPlayer } from './components/ChristmasMusicPlayer';

type WorkspaceTab = 'COMPARE' | 'BUILDER';

export function App() {
  const initialLoaded = useMemo(() => loadWorkshopSession(), []);
  const [session, setSession] = useState<WorkshopSessionState>(initialLoaded.state);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('COMPARE');
  const [selectedHub, setSelectedHub] = useState<LocationHub | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [snowBurstTrigger, setSnowBurstTrigger] = useState<number>(0);
  const [musicAutoPlaySignal, setMusicAutoPlaySignal] = useState<number>(0);
  const [showWinterToast, setShowWinterToast] = useState<boolean>(false);
  const [masterForm, setMasterForm] = useState<MasterFormConfig>(() =>
    loadMasterFormConfig()
  );

  const handleMasterFormChange = (config: MasterFormConfig | null) => {
    if (config && !config.isBuiltInDefault) {
      setMasterForm(config);
      saveMasterFormConfig(config);
    } else {
      clearMasterFormConfig();
      setMasterForm(DEFAULT_MASTER_FORM_CONFIG);
    }
  };

  const cargo = DEFAULT_CARGO_PARAMS;
  const officialRoutes = DEFAULT_ROUTES;
  const isDark = session.isDark;
  const isFestive = session.isFestive;

  // Auto-hide the non-blocking Round 2 winter arrival toast after 5.5s
  useEffect(() => {
    if (!showWinterToast) return;
    const timer = window.setTimeout(() => {
      setShowWinterToast(false);
    }, 5500);
    return () => window.clearTimeout(timer);
  }, [showWinterToast]);

  // Sync dark mode class on root document element
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Persist session to localStorage
  useEffect(() => {
    saveWorkshopSession(session);
  }, [session]);

  // Close reset modal on Escape
  useEffect(() => {
    if (!showResetModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowResetModal(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showResetModal]);

  // Single Source of Truth evaluations for both rounds
  const officialEvaluationsR1 = useMemo(
    () => officialRoutes.map((r) => evaluateRoute(r, cargo, 1)),
    [officialRoutes, cargo]
  );
  const customEvaluationsR1 = useMemo(
    () => session.customRoutes.map((r) => evaluateRoute(r, cargo, 1)),
    [session.customRoutes, cargo]
  );
  const officialEvaluationsR2 = useMemo(
    () => officialRoutes.map((r) => evaluateRoute(r, cargo, 2)),
    [officialRoutes, cargo]
  );
  const customEvaluationsR2 = useMemo(
    () => session.customRoutes.map((r) => evaluateRoute(r, cargo, 2)),
    [session.customRoutes, cargo]
  );

  const currentOfficialEvaluations =
    session.viewingRound === 2 ? officialEvaluationsR2 : officialEvaluationsR1;
  const currentCustomEvaluations =
    session.viewingRound === 2 ? customEvaluationsR2 : customEvaluationsR1;

  const allCurrentEvaluations = useMemo(
    () => [...currentOfficialEvaluations, ...currentCustomEvaluations],
    [currentOfficialEvaluations, currentCustomEvaluations]
  );

  const selectedEvaluation = useMemo(() => {
    return (
      allCurrentEvaluations.find((ev) => ev.route.id === session.viewingRouteId) ||
      currentOfficialEvaluations[0]
    );
  }, [allCurrentEvaluations, currentOfficialEvaluations, session.viewingRouteId]);

  const handleSelectRoute = (routeId: string) => {
    setSession((prev) => ({ ...prev, viewingRouteId: routeId }));
    setSelectedHub(null);
  };

  const handleChangeViewingRound = (round: WorkshopRound) => {
    setSession((prev) => {
      if (round === 2 && prev.unlockedRound < 2) return prev;
      return { ...prev, viewingRound: round };
    });
  };

  const handleCreateCustomCopy = (sourceRoute: RouteOption) => {
    const nextNumber =
      4 +
      session.customRoutes.reduce((maxNum, r) => {
        const match = r.code.match(/^PA-(\d+)$/);
        if (match) {
          return Math.max(maxNum, Number(match[1]) - 4);
        }
        return maxNum;
      }, session.customRoutes.length) +
      1;

    const cloned = createCustomRouteClone(sourceRoute, nextNumber);
    setSession((prev) => ({
      ...prev,
      customRoutes: [...prev.customRoutes, cloned],
      viewingRouteId: cloned.id
    }));
    setActiveTab('BUILDER');
    setSelectedHub(null);
    window.setTimeout(() => {
      document.getElementById('workspace-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleUpdateCustomRoute = (updatedRoute: RouteOption) => {
    setSession((prev) => ({
      ...prev,
      customRoutes: prev.customRoutes.map((r) =>
        r.id === updatedRoute.id ? updatedRoute : r
      )
    }));
  };

  const handleDeleteCustomRoute = (routeId: string) => {
    setSession((prev) => {
      const remaining = prev.customRoutes.filter((r) => r.id !== routeId);
      const nextViewing =
        prev.viewingRouteId === routeId
          ? remaining[0]?.id || DEFAULT_ROUTES[0].id
          : prev.viewingRouteId;
      return {
        ...prev,
        customRoutes: remaining,
        viewingRouteId: nextViewing
      };
    });
    setSelectedHub(null);
  };

  const handleLockRound1 = (record: RoundDecisionRecord) => {
    setSession((prev) => ({
      ...prev,
      round1Decision: record,
      viewingRouteId: record.routeId
    }));
  };

  const handleUnlockRound2 = () => {
    setSession((prev) => ({
      ...prev,
      unlockedRound: 2,
      viewingRound: 2
    }));
    setMusicAutoPlaySignal((n) => n + 1);
    if (isFestive) {
      setSnowBurstTrigger((n) => n + 1);
      setShowWinterToast(true);
    }
    window.setTimeout(() => {
      document.getElementById('nhiem-vu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleLockRound2 = (record: RoundDecisionRecord) => {
    setSession((prev) => ({
      ...prev,
      round2Decision: record,
      viewingRouteId: record.routeId
    }));
  };

  // Scope 1: Restore view to official route without erasing group progress
  const handleRestoreOfficialView = () => {
    setSession((prev) => ({
      ...prev,
      viewingRouteId: DEFAULT_ROUTES[0].id
    }));
    setActiveTab('COMPARE');
    setSelectedHub(null);
    setShowResetModal(false);
  };

  // Scope 2: Full restart of group session (clears localStorage & state)
  const handleFullWorkshopReset = () => {
    clearWorkshopSession();
    const fresh = createInitialSessionState();
    setSession({ ...fresh, isDark, isFestive });
    setActiveTab('COMPARE');
    setSelectedHub(null);
    setShowWinterToast(false);
    setMusicAutoPlaySignal(0);
    setShowResetModal(false);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className={`relative min-h-screen transition-colors duration-500 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Ethereal Editorial Winter Atmosphere Backdrop (Northern Aurora in Dark / Glacier Glow in Light) */}
      <FestiveAmbientBackdrop
        enabled={isFestive}
        isDark={isDark}
        isRound2={session.viewingRound === 2}
      />

      {/* Content-Safe Click-Through Christmas Snowfall (activates on Round 1 -> Round 2 transition & Round 2) */}
      <ChristmasSnowCanvas
        isFestiveEnabled={isFestive}
        viewingRound={session.viewingRound}
        snowBurstTrigger={snowBurstTrigger}
        isDark={isDark}
      />

      {/* Brief silky outer-edge frost shimmer on Round 1 -> Round 2 transition */}
      <Round2FrostEdgeShimmer
        burstKey={snowBurstTrigger}
        enabled={isFestive}
        isDark={isDark}
      />

      {/* Clean 3-Zone Top Navigation Bar (NO CSV export) */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-500 ${
          isDark
            ? 'bg-slate-950/90 border-slate-800'
            : 'bg-white/92 border-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#nhiem-vu"
            className="flex items-center gap-2.5 min-w-0 focus:outline-none"
          >
            <div className="relative w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <SantaHatBrandBadge enabled={isFestive} isDark={isDark} />
              <Compass className="w-4 h-4" />
            </div>
            <div className="leading-tight truncate">
              <span className="font-extrabold tracking-tight text-sm sm:text-base block">
                LOGISTICS
              </span>
              <span className={`text-[11px] font-medium block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Workshop Nhóm 7 · VSIP II → Stuttgart
              </span>
            </div>
          </a>

          {/* Zone 2: Primary Section Links */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden md:flex items-center gap-1 text-sm font-semibold"
          >
            <button
              type="button"
              onClick={() => scrollToSection('nhiem-vu')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isDark
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Nhiệm vụ
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('ban-do')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isDark
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Bản đồ
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('COMPARE');
                scrollToSection('workspace-tabs');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isDark
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              So sánh
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('quyet-dinh')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isDark
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Phiếu chốt
            </button>
          </nav>

          {/* Zone 3: Festive Decor Toggle + Theme + Reset */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                setSession((prev) => {
                  const nextFestive = !prev.isFestive;
                  if (!nextFestive) setShowWinterToast(false);
                  return { ...prev, isFestive: nextFestive };
                })
              }
              aria-pressed={isFestive}
              aria-label={isFestive ? 'Tắt trang trí Giáng sinh' : 'Bật trang trí Giáng sinh'}
              data-testid="festive-toggle-btn"
              className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
                isFestive
                  ? isDark
                    ? 'border-amber-400/45 bg-amber-950/40 hover:bg-amber-950/65 text-amber-200 shadow-[0_0_12px_-3px_rgba(251,191,36,0.35)]'
                    : 'border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 shadow-[0_1px_8px_-3px_rgba(14,165,233,0.35)]'
                  : isDark
                  ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-400'
                  : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-500'
              }`}
            >
              <Snowflake
                className={`w-4 h-4 shrink-0 transition-colors duration-300 ${
                  isFestive ? 'text-sky-500 dark:text-amber-300 festive-spin-slow' : ''
                }`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Giáng sinh</span>
            </button>

            <button
              type="button"
              onClick={() => setSession((prev) => ({ ...prev, isDark: !prev.isDark }))}
              aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              data-testid="theme-toggle-btn"
              className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isDark
                  ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                  : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              <span className="hidden sm:inline">{isDark ? 'Sáng' : 'Tối'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              data-testid="open-reset-modal-btn"
              className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isDark
                  ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                  : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          </div>
        </div>

        {/* Slim animated Nordic fairy-light garland hanging delicately beneath the header */}
        <HeaderFairyLights
          enabled={isFestive}
          isDark={isDark}
          isRound2={session.viewingRound === 2}
        />
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Cute non-overlapping inline Round 2 winter arrival banner */}
        <Round2WinterArrivalBanner
          visible={showWinterToast && isFestive}
          isDark={isDark}
          onDismiss={() => setShowWinterToast(false)}
        />

        {/* Inline Christmas Instrumental Music Player (appears only after transitioning Round 1 -> Round 2) */}
        <ChristmasMusicPlayer
          visible={session.unlockedRound === 2}
          autoPlaySignal={musicAutoPlaySignal}
          isDark={isDark}
          isFestive={isFestive}
        />

        {/* Section 1: Mission, Packaging & Route Selector */}
        <ShipmentDashboard
          cargo={cargo}
          officialEvaluations={currentOfficialEvaluations}
          customEvaluations={currentCustomEvaluations}
          viewingRouteId={selectedEvaluation.route.id}
          onSelectRoute={handleSelectRoute}
          unlockedRound={session.unlockedRound}
          viewingRound={session.viewingRound}
          onChangeViewingRound={handleChangeViewingRound}
          round1Decision={session.round1Decision}
          round2Decision={session.round2Decision}
          onScrollToComparison={() => {
            setActiveTab('COMPARE');
            scrollToSection('workspace-tabs');
          }}
          onScrollToDecision={() => scrollToSection('quyet-dinh')}
          onOpenRouteBuilder={() => {
            setActiveTab('BUILDER');
            scrollToSection('workspace-tabs');
          }}
          onCreateCustomCopyFromViewing={() => handleCreateCustomCopy(selectedEvaluation.route)}
          isDark={isDark}
          isFestive={isFestive}
        />

        {/* Section 2: Interactive Map */}
        <InteractiveMap
          officialEvaluations={currentOfficialEvaluations}
          customEvaluations={currentCustomEvaluations}
          viewingRouteId={selectedEvaluation.route.id}
          onSelectRoute={handleSelectRoute}
          selectedEvaluation={selectedEvaluation}
          viewingRound={session.viewingRound}
          selectedHub={selectedHub}
          onSelectHub={setSelectedHub}
          isDark={isDark}
        />

        {/* Section 3: Comparison Table & Custom Route Builder Tabs */}
        <div id="workspace-tabs" className="space-y-4 scroll-mt-20">
          <div className="flex flex-wrap items-center gap-2 border-b pb-3 border-slate-200 dark:border-slate-800">
            <button
              type="button"
              data-testid="tab-compare"
              onClick={() => setActiveTab('COMPARE')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                activeTab === 'COMPARE'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                  : isDark
                  ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Table2 className="w-4 h-4" />
              <span>01. Bảng so sánh & Đối chiếu</span>
            </button>

            <button
              type="button"
              data-testid="tab-builder"
              onClick={() => setActiveTab('BUILDER')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                activeTab === 'BUILDER'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                  : isDark
                  ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>
                02. Tự thiết kế tuyến thử
                {session.customRoutes.length > 0 ? ` (${session.customRoutes.length})` : ''}
              </span>
            </button>
          </div>

          {activeTab === 'COMPARE' ? (
            <AnalyticsOptimization
              officialEvaluations={currentOfficialEvaluations}
              customEvaluations={currentCustomEvaluations}
              viewingRouteId={selectedEvaluation.route.id}
              onSelectRoute={handleSelectRoute}
              viewingRound={session.viewingRound}
              isDark={isDark}
            />
          ) : (
            <RouteBuilder
              officialEvaluations={currentOfficialEvaluations}
              customEvaluations={currentCustomEvaluations}
              viewingRouteId={selectedEvaluation.route.id}
              onSelectRoute={handleSelectRoute}
              onCreateCustomCopy={handleCreateCustomCopy}
              onUpdateCustomRoute={handleUpdateCustomRoute}
              onDeleteCustomRoute={handleDeleteCustomRoute}
              onBackToMain={() => {
                setActiveTab('COMPARE');
                scrollToSection('nhiem-vu');
              }}
              viewingRound={session.viewingRound}
              isDark={isDark}
            />
          )}
        </div>

        {/* Section 4: Two-Round Workshop Decision Panel & MC Debrief */}
        <WorkshopDecisionPanel
          session={session}
          onChangeGroupName={(groupName) =>
            setSession((prev) => ({ ...prev, groupName }))
          }
          officialEvaluationsR1={officialEvaluationsR1}
          customEvaluationsR1={customEvaluationsR1}
          officialEvaluationsR2={officialEvaluationsR2}
          customEvaluationsR2={customEvaluationsR2}
          viewingRouteId={selectedEvaluation.route.id}
          onLockRound1={handleLockRound1}
          onUnlockRound2={handleUnlockRound2}
          onLockRound2={handleLockRound2}
          masterForm={masterForm}
          onMasterFormChange={handleMasterFormChange}
          isDark={isDark}
          isFestive={isFestive}
        />
      </main>

      {/* Cute Nordic Christmas Express Logistics Scene anchoring the bottom edge */}
      <div className="relative z-10 mt-8">
        <FooterWinterLogisticsScene enabled={isFestive} isDark={isDark} />
      </div>

      {/* Accessible Reset Scope Confirmation Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
          data-testid="reset-scope-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowResetModal(false);
          }}
        >
          <div
            className={`w-full max-w-lg rounded-2xl border p-5 sm:p-6 shadow-2xl space-y-5 ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="reset-modal-title" className="text-base font-bold">
                    Chọn phạm vi đặt lại
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Phân biệt giữa việc quay về tuyến gốc để xem và việc xóa toàn bộ bài làm của nhóm.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                aria-label="Đóng hộp thoại đặt lại"
                className={`p-1.5 rounded-lg border ${
                  isDark
                    ? 'border-slate-700 text-slate-400 hover:text-slate-200'
                    : 'border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scope 1 */}
            <div
              className={`rounded-xl border p-4 space-y-2 ${
                isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <h3 className="text-sm font-bold">1. Khôi phục tuyến chuẩn (không xóa bài nhóm)</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Quay lại xem Phương án A và bảng so sánh. Giữ nguyên tên nhóm, các tuyến thử đã tạo và quyết định Vòng 1 / Vòng 2.
              </p>
              <button
                type="button"
                onClick={handleRestoreOfficialView}
                className={`mt-1 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100'
                    : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
                }`}
              >
                Khôi phục tuyến chuẩn
              </button>
            </div>

            {/* Scope 2 */}
            <div
              className={`rounded-xl border p-4 space-y-2.5 ${
                isDark
                  ? 'border-rose-900/70 bg-rose-950/25'
                  : 'border-rose-200 bg-rose-50/70'
              }`}
            >
              <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">
                2. Bắt đầu lại bài của nhóm (xóa dữ liệu đã lưu)
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-rose-200/90' : 'text-rose-900'}`}>
                Thao tác này sẽ xóa toàn bộ dữ liệu sau trên trình duyệt:
              </p>
              <ul className={`text-xs space-y-1 list-disc list-inside ${isDark ? 'text-rose-200/85' : 'text-rose-900/90'}`}>
                <li>
                  Tên nhóm:{' '}
                  <strong>{session.groupName.trim() || '(Chưa nhập)'}</strong>
                </li>
                <li>
                  Quyết định Vòng 1:{' '}
                  <strong>
                    {session.round1Decision
                      ? `${session.round1Decision.routeCode} (${session.round1Decision.activeTimeRangeLabel})`
                      : 'Chưa chốt'}
                  </strong>
                </li>
                <li>
                  Quyết định Vòng 2:{' '}
                  <strong>
                    {session.round2Decision
                      ? `${session.round2Decision.routeCode} (${session.round2Decision.activeTimeRangeLabel})`
                      : session.unlockedRound === 2
                      ? 'Đã mở Vòng 2, chưa chốt'
                      : 'Chưa mở'}
                  </strong>
                </li>
                <li>
                  Tuyến nhóm thử đã tạo: <strong>{session.customRoutes.length} tuyến</strong>
                </li>
              </ul>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  data-testid="reset-modal-cancel"
                  onClick={() => setShowResetModal(false)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    isDark
                      ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                      : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  data-testid="reset-modal-confirm-full"
                  onClick={handleFullWorkshopReset}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                >
                  Xác nhận bắt đầu lại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
