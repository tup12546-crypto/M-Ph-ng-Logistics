/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  RoundDecisionRecord,
  RouteEvaluation,
  WorkshopSessionState
} from '../types/logistics';
import {
  ROUND_2_CLOSING_QUESTION,
  ROUND_2_CUSTOMER_QUOTE,
  WORKSHOP_FORM_URL
} from '../data/defaultData';
import { formatWorkshopUSD } from '../utils/logisticsEngine';
import { buildSubmissionSummaryText } from '../utils/workshopStorage';
import {
  MasterFormConfig,
  ParsedFormEntry,
  WORKSHOP_FIELD_OPTIONS,
  WorkshopPrefillFieldKey,
  buildPrefilledGoogleFormUrl,
  buildShareableWorkshopUrl,
  entriesToEntryIds,
  hasAnyMappedEntry,
  parsePrefilledGoogleFormUrl
} from '../utils/googleFormsUrl';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  Link2,
  Share2,
  Siren,
  Sparkles,
  Unlink,
  Users
} from 'lucide-react';
import { AnimatedSnowflakeEmblem } from './ChristmasDecorations';

interface WorkshopDecisionPanelProps {
  session: WorkshopSessionState;
  onChangeGroupName: (name: string) => void;
  officialEvaluationsR1: RouteEvaluation[];
  customEvaluationsR1: RouteEvaluation[];
  officialEvaluationsR2: RouteEvaluation[];
  customEvaluationsR2: RouteEvaluation[];
  viewingRouteId: string;
  onLockRound1: (record: RoundDecisionRecord) => void;
  onUnlockRound2: () => void;
  onLockRound2: (record: RoundDecisionRecord) => void;
  masterForm: MasterFormConfig | null;
  onMasterFormChange: (config: MasterFormConfig | null) => void;
  isDark?: boolean;
  isFestive?: boolean;
}

export const WorkshopDecisionPanel: React.FC<WorkshopDecisionPanelProps> = ({
  session,
  onChangeGroupName,
  officialEvaluationsR1,
  customEvaluationsR1,
  officialEvaluationsR2,
  customEvaluationsR2,
  viewingRouteId,
  onLockRound1,
  onUnlockRound2,
  onLockRound2,
  masterForm,
  onMasterFormChange,
  isDark = false,
  isFestive = false
}) => {
  const allR1 = [...officialEvaluationsR1, ...customEvaluationsR1];
  const allR2 = [...officialEvaluationsR2, ...customEvaluationsR2];

  // Round 1 form draft state
  const [r1RouteId, setR1RouteId] = useState<string>(
    session.round1Decision?.routeId || viewingRouteId
  );
  const [r1Reason, setR1Reason] = useState<string>(session.round1Decision?.reason || '');
  const [r1Error, setR1Error] = useState<string>('');

  // Round 2 form draft state
  const [r2RouteId, setR2RouteId] = useState<string>(
    session.round2Decision?.routeId || session.round1Decision?.routeId || viewingRouteId
  );
  const [r2Reason, setR2Reason] = useState<string>(session.round2Decision?.reason || '');
  const [r2Error, setR2Error] = useState<string>('');

  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedFormLink, setCopiedFormLink] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Paste Pre-filled Google Form Link setup state (100% client-side, ZERO OAuth)
  const [showMasterSetup, setShowMasterSetup] = useState<boolean>(false);
  const [pastedUrl, setPastedUrl] = useState<string>('');
  const [parseError, setParseError] = useState<string>('');
  const [draftResponderUri, setDraftResponderUri] = useState<string>('');
  const [draftFormId, setDraftFormId] = useState<string>('');
  const [draftEntries, setDraftEntries] = useState<ParsedFormEntry[]>([]);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string>('');
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  // Sync selector when user resets session
  useEffect(() => {
    if (!session.round1Decision) {
      setR1Reason('');
      setR1RouteId(viewingRouteId);
    } else {
      setR1RouteId(session.round1Decision.routeId);
      setR1Reason(session.round1Decision.reason);
    }
  }, [session.round1Decision]);

  useEffect(() => {
    if (!session.round2Decision) {
      setR2Reason('');
      if (session.round1Decision) {
        setR2RouteId(session.round1Decision.routeId);
      }
    } else {
      setR2RouteId(session.round2Decision.routeId);
      setR2Reason(session.round2Decision.reason);
    }
  }, [session.round2Decision, session.round1Decision]);

  const chosenR1Eval = allR1.find((e) => e.route.id === r1RouteId) || allR1[0];
  const chosenR2Eval = allR2.find((e) => e.route.id === r2RouteId) || allR2[0];

  const isR1Conditional =
    !chosenR1Eval.meetsTimeLimit || !chosenR1Eval.meetsNormalBudget;
  const isR2Conditional =
    !chosenR2Eval.meetsTimeLimit || !chosenR2Eval.meetsNormalBudget;

  const handleSubmitRound1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenR1Eval.validation.isValid) {
      setR1Error('Tuyến đang chọn chưa hợp lệ về hạ tầng. Hãy chọn tuyến hợp lệ hoặc sửa chặng lỗi trước.');
      return;
    }
    if (!r1Reason.trim()) {
      setR1Error('Vui lòng ghi ngắn gọn lý do chọn phương án Vòng 1 trước khi chốt.');
      return;
    }
    setR1Error('');
    onLockRound1({
      round: 1,
      routeId: chosenR1Eval.route.id,
      routeCode: chosenR1Eval.route.code,
      routeName: chosenR1Eval.route.name,
      committedMaxDays: chosenR1Eval.committedMaxDays,
      activeTimeRangeLabel: chosenR1Eval.activeTimeRangeLabel,
      totalCostUSD: chosenR1Eval.totalCostUSD,
      reason: r1Reason.trim(),
      conditionsToConfirm: '',
      isConditionalProposal: isR1Conditional,
      savedAtIso: new Date().toISOString()
    });
  };

  const handleSubmitRound2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenR2Eval.validation.isValid) {
      setR2Error('Tuyến đang chọn chưa hợp lệ về hạ tầng. Hãy chọn tuyến hợp lệ trước khi chốt Vòng 2.');
      return;
    }
    if (!r2Reason.trim()) {
      setR2Error('Vui lòng ghi lý do giữ hoặc đổi tuyến (kèm ít nhất 1 con số thời gian và 1 con số chi phí).');
      return;
    }
    setR2Error('');
    const actionType =
      session.round1Decision && session.round1Decision.routeId === chosenR2Eval.route.id
        ? 'KEEP'
        : 'SWITCH';

    onLockRound2({
      round: 2,
      routeId: chosenR2Eval.route.id,
      routeCode: chosenR2Eval.route.code,
      routeName: chosenR2Eval.route.name,
      committedMaxDays: chosenR2Eval.committedMaxDays,
      activeTimeRangeLabel: chosenR2Eval.activeTimeRangeLabel,
      totalCostUSD: chosenR2Eval.totalCostUSD,
      reason: r2Reason.trim(),
      conditionsToConfirm: '',
      changeMindCondition: '',
      actionType,
      isConditionalProposal: isR2Conditional,
      savedAtIso: new Date().toISOString()
    });
  };

  const copyToClipboard = async (text: string, onSuccess: () => void) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      onSuccess();
    } catch {
      // Ignore copy failure
    }
  };

  const summaryText = buildSubmissionSummaryText(session);
  const masterHasPrefill = Boolean(masterForm && hasAnyMappedEntry(masterForm.entryIds));
  const prefilledFormUrl = masterForm
    ? buildPrefilledGoogleFormUrl(masterForm, session)
    : WORKSHOP_FORM_URL;
  const shareableWorkshopUrl = masterForm ? buildShareableWorkshopUrl(masterForm) : '';

  const handleCopySummary = () => {
    copyToClipboard(summaryText, () => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    });
  };

  const handleCopyFormLink = () => {
    if (!masterForm) return;
    copyToClipboard(masterForm.responderUri, () => {
      setCopiedFormLink(true);
      setTimeout(() => setCopiedFormLink(false), 2500);
    });
  };

  const handleCopyShareLink = () => {
    if (!shareableWorkshopUrl) return;
    copyToClipboard(shareableWorkshopUrl, () => {
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    });
  };

  const handleAnalyzePastedUrl = (rawValue: string) => {
    setPastedUrl(rawValue);
    setSaveSuccessNotice('');
    if (!rawValue.trim()) {
      setParseError('');
      setDraftResponderUri('');
      setDraftFormId('');
      setDraftEntries([]);
      return;
    }

    const result = parsePrefilledGoogleFormUrl(rawValue);
    if (!result.ok) {
      setParseError(result.error);
      setDraftResponderUri('');
      setDraftFormId('');
      setDraftEntries([]);
      return;
    }

    setParseError('');
    setDraftResponderUri(result.responderUri);
    setDraftFormId(result.formId);
    setDraftEntries(result.entries);
  };

  const handleChangeEntryMapping = (
    entryId: string,
    newField: WorkshopPrefillFieldKey | ''
  ) => {
    setDraftEntries((prev) =>
      prev.map((item) => {
        if (item.entryId === entryId) {
          return { ...item, mappedField: newField };
        }
        // Avoid two entry IDs pointing to the exact same Workshop field
        if (newField && item.mappedField === newField) {
          return { ...item, mappedField: '' };
        }
        return item;
      })
    );
  };

  const handleSaveMasterForm = () => {
    if (!draftResponderUri) {
      const check = parsePrefilledGoogleFormUrl(pastedUrl);
      if (!check.ok) {
        setParseError(check.error);
        return;
      }
      onMasterFormChange({
        formId: check.formId,
        title: 'Google Form chủ Workshop Nhóm 7',
        responderUri: check.responderUri,
        editUri: '',
        createdAtIso: new Date().toISOString(),
        entryIds: check.entryIds
      });
    } else {
      onMasterFormChange({
        formId: draftFormId,
        title: 'Google Form chủ Workshop Nhóm 7',
        responderUri: draftResponderUri,
        editUri: '',
        createdAtIso: new Date().toISOString(),
        entryIds: entriesToEntryIds(draftEntries)
      });
    }

    setSaveSuccessNotice(
      'Đã lưu Google Form chủ! Hãy sao chép "Link chia sẻ trang Workshop cho các nhóm" bên dưới để gửi cho sinh viên.'
    );
    setPastedUrl('');
    setDraftResponderUri('');
    setDraftFormId('');
    setDraftEntries([]);
  };

  const inputClass = `w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
    isDark
      ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
  }`;

  return (
    <section
      id="quyet-dinh"
      aria-label="Phiếu quyết định của nhóm"
      className={`scroll-mt-20 rounded-2xl border p-5 sm:p-6 space-y-6 transition-colors ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Header & Group Name */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Phiếu quyết định &amp; bảo vệ phương án của nhóm
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Bài làm được tự động lưu trên thiết bị này. Chốt Vòng 1 trước, sau đó nhận tin Giáng sinh để quyết định Vòng 2.
          </p>
        </div>

        <div className="w-full md:w-72">
          <label
            htmlFor="workshop-group-name"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
          >
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Tên nhóm</span>
          </label>
          <input
            id="workshop-group-name"
            type="text"
            value={session.groupName}
            onChange={(e) => onChangeGroupName(e.target.value)}
            placeholder="Ví dụ: Nhóm 7 — Lớp Logistics"
            className={inputClass}
          />
        </div>
      </div>

      {/* STEP 1: ROUND 1 DECISION */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            1. Chốt lựa chọn Vòng 1 (Hạn tối đa ngày 35 · Ngân sách 8.000–12.000 USD)
          </h4>
          {session.round1Decision && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Đã chốt Vòng 1: {session.round1Decision.routeCode}</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSubmitRound1} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 space-y-1.5">
              <label
                htmlFor="r1-route-select"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Phương án chốt Vòng 1
              </label>
              <select
                id="r1-route-select"
                value={r1RouteId}
                onChange={(e) => setR1RouteId(e.target.value)}
                className={inputClass}
              >
                {allR1.map((ev) => (
                  <option key={ev.route.id} value={ev.route.id}>
                    {ev.route.code} — {ev.validation.isValid ? `${ev.activeTimeRangeLabel} · ${formatWorkshopUSD(ev.totalCostUSD)} USD` : 'Chưa hợp lệ'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {chosenR1Eval.validation.isValid
                  ? `Thời gian: ${chosenR1Eval.activeTimeRangeLabel} (muộn nhất ngày ${chosenR1Eval.committedMaxDays}) · Tổng phí: ${formatWorkshopUSD(chosenR1Eval.totalCostUSD)} USD`
                  : 'Tuyến này chưa hợp lệ về hạ tầng — cần chọn tuyến hợp lệ hoặc sửa chặng lỗi.'}
              </p>
            </div>

            <div className="md:col-span-7 space-y-1.5">
              <label
                htmlFor="r1-reason"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Lý do chọn ở Vòng 1 (bắt buộc)
              </label>
              <textarea
                id="r1-reason"
                rows={2}
                value={r1Reason}
                onChange={(e) => setR1Reason(e.target.value)}
                placeholder="Nêu rõ phân tích của nhóm về thời gian giao hàng, chi phí cả lô và mức độ phù hợp với yêu cầu khách hàng..."
                className={inputClass}
              />
            </div>
          </div>

          {r1Error && (
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{r1Error}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!chosenR1Eval.validation.isValid}
              className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                !chosenR1Eval.validation.isValid
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              }`}
            >
              {session.round1Decision ? 'Cập nhật chốt Vòng 1' : 'Chốt vòng 1'}
            </button>

            {session.round1Decision && session.unlockedRound === 1 && (
              <button
                type="button"
                onClick={onUnlockRound2}
                data-testid="unlock-round2-btn"
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                {isFestive ? (
                  <AnimatedSnowflakeEmblem enabled={true} className="w-4 h-4 text-sky-100 shrink-0" />
                ) : (
                  <Siren className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span>Nhận tin Giáng sinh (Mở Vòng 2)</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* STEP 2: ROUND 2 DECISION (UNLOCKED ONLY AFTER ROUND 1) */}
      {session.unlockedRound === 2 && (
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <Siren className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>2. Chốt quyết định Vòng 2 — Khi gặp sự cố Giáng sinh</span>
              <AnimatedSnowflakeEmblem enabled={isFestive} className="w-4 h-4 text-sky-500 dark:text-sky-300 shrink-0" />
            </h4>
            {session.round2Decision && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  Đã chốt Vòng 2: {session.round2Decision.routeCode} (
                  {session.round2Decision.actionType === 'KEEP' ? 'Giữ tuyến' : 'Đổi tuyến'})
                </span>
              </span>
            )}
          </div>

          <div
            className={`p-4 rounded-xl border text-sm space-y-2 ${
              isDark
                ? 'bg-rose-950/20 border-rose-500/30 text-slate-200'
                : 'bg-rose-50/50 border-rose-200 text-slate-800'
            }`}
          >
            <p className="font-medium">“{ROUND_2_CUSTOMER_QUOTE}”</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Câu hỏi chốt: {ROUND_2_CLOSING_QUESTION}
            </p>
          </div>

          <form onSubmit={handleSubmitRound2} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 space-y-1.5">
                <label
                  htmlFor="r2-route-select"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Phương án chốt Vòng 2
                </label>
                <select
                  id="r2-route-select"
                  value={r2RouteId}
                  onChange={(e) => setR2RouteId(e.target.value)}
                  className={inputClass}
                >
                  {allR2.map((ev) => (
                    <option key={ev.route.id} value={ev.route.id}>
                      {ev.route.code} — {ev.validation.isValid ? `${ev.activeTimeRangeLabel} · ${formatWorkshopUSD(ev.totalCostUSD)} USD` : 'Chưa hợp lệ'}
                    </option>
                  ))}
                </select>
                <div className="text-xs leading-relaxed">
                  {chosenR2Eval.validation.isValid ? (
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      Thời gian Vòng 2: {chosenR2Eval.activeTimeRangeLabel} (muộn nhất ngày{' '}
                      {chosenR2Eval.committedMaxDays}) · Tổng phí:{' '}
                      {formatWorkshopUSD(chosenR2Eval.totalCostUSD)} USD
                    </span>
                  ) : (
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      Tuyến này chưa hợp lệ — không thể chốt.
                    </span>
                  )}
                </div>
              </div>

              <div className="md:col-span-7 space-y-1.5">
                <label
                  htmlFor="r2-reason"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Lý do giữ hay đổi tuyến (dùng ít nhất 1 số thời gian &amp; 1 số chi phí)
                </label>
                <textarea
                  id="r2-reason"
                  rows={2}
                  value={r2Reason}
                  onChange={(e) => setR2Reason(e.target.value)}
                  placeholder="Phân tích lý do nhóm giữ nguyên hoặc chuyển sang phương án mới dựa trên số ngày giao và chi phí Vòng 2..."
                  className={inputClass}
                />
              </div>
            </div>

            {r2Error && (
              <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{r2Error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!chosenR2Eval.validation.isValid}
              className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                !chosenR2Eval.validation.isValid
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              }`}
            >
              {session.round2Decision ? 'Cập nhật chốt Vòng 2' : 'Chốt vòng 2 & Tạo bản tóm tắt'}
            </button>
          </form>
        </div>
      )}

      {/* STEP 3: FINAL SUBMISSION SUMMARY & AUTO-PREFILL GOOGLE FORM */}
      {session.round2Decision && (
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                3. Gửi kết quả sang Google Form &amp; Bản tóm tắt cuối bài
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {masterHasPrefill
                  ? 'Đã gắn Google Form chủ — đáp án Vòng 1 & Vòng 2 tự động điền sẵn.'
                  : 'Sao chép tóm tắt hoặc dán link Google Form điền sẵn bên dưới để tự điền đáp án.'}
              </span>
            </div>

            {masterHasPrefill && (
              <div
                data-testid="prefill-ready-banner"
                className={`rounded-xl border p-4 space-y-2 ${
                  isDark
                    ? 'bg-emerald-950/25 border-emerald-500/35 text-emerald-100'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="text-xs sm:text-sm space-y-1">
                    <p className="font-bold">
                      Sẵn sàng tự động điền toàn bộ đáp án Vòng 1 &amp; Vòng 2 sang Google Form chủ
                    </p>
                    <p className="text-xs opacity-90">
                      Các câu trả lời của nhóm đã được gắn sẵn vào đường link bên dưới — nhóm chỉ cần kiểm tra lại trên Google Form và bấm <strong>Gửi (Submit)</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <pre
              className={`p-4 rounded-xl border text-xs sm:text-sm font-mono whitespace-pre-wrap break-words leading-relaxed overflow-x-auto ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {summaryText}
            </pre>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={prefilledFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="prefilled-google-form-link"
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {masterHasPrefill
                    ? 'Mở Google Form chủ (đã tự điền sẵn đáp án)'
                    : masterForm
                    ? 'Mở Google Form chủ'
                    : 'Mở phiếu nộp kết quả'}
                </span>
                <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={handleCopySummary}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Đã sao chép kết quả</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Sao chép kết quả</span>
                  </>
                )}
              </button>

              {!masterForm && (
                <button
                  type="button"
                  onClick={() => setShowMasterSetup(true)}
                  className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100'
                      : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <Link2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Gắn link Google Form tự điền đáp án</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MASTER GOOGLE FORM PRE-FILL LINK SETUP (100% CLIENT-SIDE, NO GOOGLE OAUTH) */}
      <div
        className="pt-5 border-t border-slate-200 dark:border-slate-800"
        data-testid="master-google-form-section"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowMasterSetup((v) => !v)}
            aria-expanded={showMasterSetup}
            data-testid="toggle-master-form-setup"
            className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
            <span>
              Gắn link Google Form chủ tự điền đáp án (không cần đăng nhập Google)
            </span>
            {showMasterSetup ? (
              <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
          </button>

          {masterForm && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>
                {masterHasPrefill ? 'Đã gắn Form chủ (tự điền đáp án)' : 'Đã gắn link Form chủ'}
              </span>
            </span>
          )}
        </div>

        {showMasterSetup && (
          <div
            className={`mt-4 rounded-xl border p-4 sm:p-5 space-y-4 ${
              isDark
                ? 'bg-slate-950/70 border-slate-800 text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            {/* 3-step quick instructions */}
            <div
              className={`rounded-xl border p-3.5 text-xs space-y-1.5 leading-relaxed ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <p className="font-bold text-slate-900 dark:text-white">
                Cách gắn Google Form chủ trong 30 giây (xuất bản công khai không cần OAuth):
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Mở Google Form của bạn → bấm biểu tượng <strong>⋮</strong> (góc trên bên phải) → chọn{' '}
                  <strong>Nhận đường liên kết được điền sẵn (Get pre-filled link)</strong>.
                </li>
                <li>
                  Điền chữ gợi nhớ vào các câu hỏi muốn tự điền (ví dụ: <code>Tên nhóm</code>,{' '}
                  <code>Vòng 1</code>, <code>Lý do V1</code>, <code>Vòng 2</code>, <code>Lý do V2</code>,{' '}
                  <code>Tóm tắt</code>) → bấm <strong>Nhận đường liên kết</strong> →{' '}
                  <strong>Sao chép</strong>.
                </li>
                <li>
                  Dán đường link vừa sao chép vào ô bên dưới → bấm <strong>Lưu Google Form chủ</strong> → gửi{' '}
                  <strong>Link chia sẻ cho nhóm</strong> để sinh viên tự động điền sẵn đáp án sau Vòng 2.
                </li>
              </ol>
            </div>

            {/* Existing linked Master Form details */}
            {masterForm && (
              <div
                className={`rounded-xl border p-4 space-y-3 ${
                  isDark
                    ? 'bg-slate-900 border-emerald-800/60'
                    : 'bg-white border-emerald-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{masterForm.title}</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {masterHasPrefill
                      ? `${Object.values(masterForm.entryIds).filter(Boolean).length} ô tự động điền sẵn`
                      : 'Chỉ gắn link mở Form (chưa có mã ô entry)'}
                  </span>
                </div>

                {/* Master Form direct responder link */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    1. Đường link Google Form chủ {masterForm.isBuiltInDefault ? '(đã gắn cứng mặc định trong trang web — ai mở web cũng tự điền)' : '(Form tùy chỉnh trên trình duyệt này)'}:
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <code
                      data-testid="master-form-responder-uri"
                      className={`flex-1 min-w-[200px] px-3 py-2 rounded-lg border text-xs font-mono truncate ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 text-slate-200'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {masterForm.shortUrl || masterForm.responderUri}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyFormLink}
                      className={`px-3 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                        isDark
                          ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100'
                          : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      {copiedFormLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFormLink ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                    <a
                      href={prefilledFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <span>Mở thử Form</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Shareable workshop link embedding public form URL + entryIds */}
                {!masterForm.isBuiltInDefault && shareableWorkshopUrl && (
                  <div className="space-y-1 pt-1">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      2. Link chia sẻ trang Workshop kèm Form tùy chỉnh này cho các nhóm:
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <code
                        className={`flex-1 min-w-[200px] px-3 py-2 rounded-lg border text-xs font-mono truncate ${
                          isDark
                            ? 'bg-slate-950 border-slate-800 text-slate-200'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        {shareableWorkshopUrl}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyShareLink}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedShareLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                        <span>{copiedShareLink ? 'Đã sao chép link chia sẻ' : 'Sao chép link cho nhóm'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline restore default confirmation (only when overridden with a custom form) */}
                {!masterForm.isBuiltInDefault && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    {!confirmUnlink ? (
                      <button
                        type="button"
                        onClick={() => setConfirmUnlink(true)}
                        className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        <span>Khôi phục về Form chủ mặc định (forms.gle/a5GkEwoETsqHrEASA)</span>
                      </button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          Xác nhận quay về Form chủ mặc định?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onMasterFormChange(null);
                            setConfirmUnlink(false);
                            setSaveSuccessNotice('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
                        >
                          Xác nhận khôi phục
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmUnlink(false)}
                          className={`px-2.5 py-1 rounded-lg border font-semibold cursor-pointer ${
                            isDark
                              ? 'border-slate-700 text-slate-300'
                              : 'border-slate-300 text-slate-700'
                          }`}
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Paste Pre-filled Google Form URL Input */}
            <div className="space-y-2.5">
              <label
                htmlFor="paste-prefill-url-input"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                {masterForm
                  ? 'Thay đổi bằng link Google Form điền sẵn mới:'
                  : 'Dán link Google Form điền sẵn (có chứa ?usp=pp_url&entry.xxxx=...):'}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="paste-prefill-url-input"
                  data-testid="paste-prefill-url-input"
                  type="url"
                  value={pastedUrl}
                  onChange={(e) => handleAnalyzePastedUrl(e.target.value)}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform?usp=pp_url&entry.123456=Ten+nhom&entry.789012=Vong+1..."
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleSaveMasterForm}
                  disabled={!pastedUrl.trim() || Boolean(parseError)}
                  data-testid="save-master-form-btn"
                  className={`shrink-0 min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                    !pastedUrl.trim() || Boolean(parseError)
                      ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  }`}
                >
                  Lưu Google Form chủ
                </button>
              </div>

              {parseError && (
                <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{parseError}</span>
                </div>
              )}

              {saveSuccessNotice && (
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{saveSuccessNotice}</span>
                </div>
              )}

              {/* Detected entries & interactive field mapping table */}
              {draftResponderUri && (
                <div
                  data-testid="detected-entries-panel"
                  className={`rounded-xl border p-3.5 space-y-3 ${
                    isDark
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {draftEntries.length > 0
                        ? `Đã nhận diện ${draftEntries.length} ô câu hỏi tự điền từ link Google Form:`
                        : 'Link Google Form hợp lệ nhưng chưa có tham số entry.xxxx (sẽ mở Form trắng).'}
                    </span>
                    {draftEntries.length === 0 && (
                      <span className="text-amber-700 dark:text-amber-400 font-medium">
                        Dùng tính năng "Nhận đường liên kết được điền sẵn" trong Google Form để tự điền đáp án.
                      </span>
                    )}
                  </div>

                  {draftEntries.length > 0 && (
                    <div className="space-y-2">
                      {draftEntries.map((entry, idx) => (
                        <div
                          key={entry.entryId}
                          className={`grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-2.5 rounded-lg border text-xs ${
                            isDark
                              ? 'bg-slate-950/70 border-slate-800'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="md:col-span-5 min-w-0">
                            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                              #{idx + 1} · entry.{entry.entryId}
                            </span>
                            {entry.sampleValue && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                Mẫu bạn điền: “{entry.sampleValue}”
                              </div>
                            )}
                          </div>
                          <div className="md:col-span-7">
                            <select
                              aria-label={`Chọn dữ liệu tự điền cho ô entry.${entry.entryId}`}
                              value={entry.mappedField}
                              onChange={(e) =>
                                handleChangeEntryMapping(
                                  entry.entryId,
                                  e.target.value as WorkshopPrefillFieldKey | ''
                                )
                              }
                              className={`w-full px-3 py-1.5 rounded-lg border text-xs font-medium ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-slate-100'
                                  : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            >
                              <option value="">— Bỏ qua (không tự điền ô này) —</option>
                              {WORKSHOP_FIELD_OPTIONS.map((opt) => (
                                <option key={opt.key} value={opt.key}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
