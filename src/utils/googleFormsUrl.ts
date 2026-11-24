/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkshopSessionState } from '../types/logistics';
import { buildSubmissionSummaryText } from './workshopStorage';

const MASTER_FORM_STORAGE_KEY = 'logistics_workshop_nhom7_master_form_v1';

export type WorkshopPrefillFieldKey =
  | 'groupName'
  | 'r1Route'
  | 'r1Reason'
  | 'r1Conditions'
  | 'r2Decision'
  | 'r2Reason'
  | 'r2Conditions'
  | 'r2ChangeMind'
  | 'fullSummary';

export interface MasterFormEntryIds {
  groupName: string;
  r1Route: string;
  r1Reason: string;
  r1Conditions: string;
  r2Decision: string;
  r2Reason: string;
  r2Conditions: string;
  r2ChangeMind: string;
  fullSummary: string;
}

export interface MasterFormConfig {
  formId: string;
  title: string;
  responderUri: string;
  shortUrl?: string;
  editUri: string;
  createdAtIso: string;
  isBuiltInDefault?: boolean;
  entryIds: MasterFormEntryIds;
}

/**
 * Built-in Master Google Form for Workshop Nhóm 7 (https://forms.gle/a5GkEwoETsqHrEASA).
 * Verified public (no Google login required) with all 9 exact entry.<id> fields mapped.
 */
export const DEFAULT_MASTER_FORM_CONFIG: MasterFormConfig = {
  formId: '1FAIpQLSdzlq_hlPKkA9EeLuwcF0GKMVH3s6jULxlY7x9sZ5FWEO6f3Q',
  title: 'Phiếu Nộp Kết Quả Workshop Logistics Nhóm 7 (VSIP II → Stuttgart)',
  responderUri:
    'https://docs.google.com/forms/d/e/1FAIpQLSdzlq_hlPKkA9EeLuwcF0GKMVH3s6jULxlY7x9sZ5FWEO6f3Q/viewform',
  shortUrl: 'https://forms.gle/a5GkEwoETsqHrEASA',
  editUri: '',
  createdAtIso: '2026-11-19T00:00:00.000Z',
  isBuiltInDefault: true,
  entryIds: {
    groupName: '948574909',
    r1Route: '505082067',
    r1Reason: '1757757263',
    r1Conditions: '1799491487',
    r2Decision: '1425478432',
    r2Reason: '1453858363',
    r2Conditions: '111634178',
    r2ChangeMind: '479704050',
    fullSummary: '635102439'
  }
};

export interface ParsedFormEntry {
  entryId: string;
  sampleValue: string;
  mappedField: WorkshopPrefillFieldKey | '';
}

export interface ParsedGoogleFormLinkResult {
  ok: true;
  formId: string;
  responderUri: string;
  entries: ParsedFormEntry[];
  entryIds: MasterFormEntryIds;
  hasPrefillEntries: boolean;
}

export interface ParsedGoogleFormLinkError {
  ok: false;
  error: string;
}

export const WORKSHOP_FIELD_OPTIONS: Array<{
  key: WorkshopPrefillFieldKey;
  label: string;
}> = [
  { key: 'groupName', label: 'Tên nhóm' },
  { key: 'r1Route', label: 'Vòng 1 — Phương án đã chốt (ngày & chi phí)' },
  { key: 'r1Reason', label: 'Vòng 1 — Lý do chọn phương án' },
  { key: 'r1Conditions', label: 'Vòng 1 — Điều kiện cần xác nhận thêm' },
  { key: 'r2Decision', label: 'Vòng 2 — Quyết định Giữ/Đổi & Phương án chốt' },
  { key: 'r2Reason', label: 'Vòng 2 — Lý do giữ hay đổi tuyến' },
  { key: 'r2Conditions', label: 'Vòng 2 — Điều kiện cần xác nhận trước khi đặt dịch vụ' },
  { key: 'r2ChangeMind', label: 'Vòng 2 — Điều kiện khiến nhóm đổi ý' },
  { key: 'fullSummary', label: 'Bản tóm tắt đầy đủ Vòng 1 & Vòng 2' }
];

export function createEmptyEntryIds(): MasterFormEntryIds {
  return {
    groupName: '',
    r1Route: '',
    r1Reason: '',
    r1Conditions: '',
    r2Decision: '',
    r2Reason: '',
    r2Conditions: '',
    r2ChangeMind: '',
    fullSummary: ''
  };
}

/**
 * Normalize Vietnamese text (lowercase, strip accents) for flexible keyword matching
 * when hosts paste a Google Forms "Get pre-filled link" URL.
 */
function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();
}

function guessFieldFromSampleValue(sampleValue: string): WorkshopPrefillFieldKey | '' {
  const norm = normalizeText(sampleValue);
  if (!norm) return '';

  if (norm.includes('tom tat') || norm.includes('tom_tat') || norm.includes('summary') || norm.includes('tong hop')) {
    return 'fullSummary';
  }
  if (norm.includes('ten nhom') || norm.includes('ten_nhom') || norm.includes('group') || norm === 'nhom') {
    return 'groupName';
  }

  const mentionsR1 = norm.includes('vong 1') || norm.includes('vong_1') || norm.includes('v1') || norm.includes('r1');
  const mentionsR2 = norm.includes('vong 2') || norm.includes('vong_2') || norm.includes('v2') || norm.includes('r2') || norm.includes('giang sinh');

  if (norm.includes('doi y') || norm.includes('doi_y') || norm.includes('change mind')) {
    return 'r2ChangeMind';
  }
  if (mentionsR1) {
    if (norm.includes('ly do') || norm.includes('ly_do') || norm.includes('reason')) return 'r1Reason';
    if (norm.includes('dieu kien') || norm.includes('dieu_kien') || norm.includes('cond')) return 'r1Conditions';
    return 'r1Route';
  }
  if (mentionsR2) {
    if (norm.includes('ly do') || norm.includes('ly_do') || norm.includes('reason')) return 'r2Reason';
    if (norm.includes('dieu kien') || norm.includes('dieu_kien') || norm.includes('cond')) return 'r2Conditions';
    return 'r2Decision';
  }

  return '';
}

function getDefaultPositionalFields(count: number): WorkshopPrefillFieldKey[] {
  if (count <= 1) return ['fullSummary'];
  if (count === 2) return ['groupName', 'fullSummary'];
  if (count === 3) return ['groupName', 'r1Route', 'r2Decision'];
  if (count === 4) return ['groupName', 'r1Route', 'r2Decision', 'fullSummary'];
  if (count === 5) return ['groupName', 'r1Route', 'r1Reason', 'r2Decision', 'r2Reason'];
  if (count === 6) return ['groupName', 'r1Route', 'r1Reason', 'r2Decision', 'r2Reason', 'fullSummary'];
  if (count === 7) return ['groupName', 'r1Route', 'r1Reason', 'r2Decision', 'r2Reason', 'r2Conditions', 'fullSummary'];
  if (count === 8) {
    return ['groupName', 'r1Route', 'r1Reason', 'r1Conditions', 'r2Decision', 'r2Reason', 'r2Conditions', 'r2ChangeMind'];
  }
  return [
    'groupName',
    'r1Route',
    'r1Reason',
    'r1Conditions',
    'r2Decision',
    'r2Reason',
    'r2Conditions',
    'r2ChangeMind',
    'fullSummary'
  ];
}

export function entriesToEntryIds(entries: ParsedFormEntry[]): MasterFormEntryIds {
  const result = createEmptyEntryIds();
  entries.forEach((item) => {
    if (item.mappedField && item.entryId) {
      result[item.mappedField] = item.entryId;
    }
  });
  return result;
}

/**
 * Parse a Google Forms URL pasted by the host (supports both "Get pre-filled link"
 * URLs with entry.<id>=... parameters and plain Google Form URLs).
 */
export function parsePrefilledGoogleFormUrl(
  rawUrl: string
): ParsedGoogleFormLinkResult | ParsedGoogleFormLinkError {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { ok: false, error: 'Vui lòng dán đường link Google Form vào ô trên.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false,
      error: 'Đường link chưa đúng định dạng URL (cần bắt đầu bằng https://...).'
    };
  }

  const host = parsed.hostname.toLowerCase();
  const isGoogleFormsHost =
    host === 'docs.google.com' || host === 'forms.gle' || host.endsWith('.forms.gle');

  if (!isGoogleFormsHost) {
    return {
      ok: false,
      error: 'Vui lòng dán đường link Google Form hợp lệ (docs.google.com/forms/... hoặc forms.gle/...).'
    };
  }

  // Extract clean responderUri (without old prefill query params)
  let responderUri = `${parsed.origin}${parsed.pathname}`;
  if (host === 'docs.google.com' && responderUri.endsWith('/edit')) {
    responderUri = responderUri.replace(/\/edit$/, '/viewform');
  }

  // Extract formId if present in path
  const formIdMatch = parsed.pathname.match(/\/forms\/d\/(?:e\/)?([^/]+)/);
  const formId = formIdMatch?.[1] || '';

  // Collect all unique entry.<digits> query params in order
  const rawEntries: Array<{ entryId: string; sampleValue: string }> = [];
  const seenIds = new Set<string>();
  parsed.searchParams.forEach((value, key) => {
    const match = key.match(/^entry\.(\d+)$/);
    if (match && !seenIds.has(match[1])) {
      seenIds.add(match[1]);
      rawEntries.push({
        entryId: match[1],
        sampleValue: value
      });
    }
  });

  // First pass: keyword matching from sample values
  const usedFields = new Set<WorkshopPrefillFieldKey>();
  const mappedEntries: ParsedFormEntry[] = rawEntries.map((item) => {
    const guessed = guessFieldFromSampleValue(item.sampleValue);
    if (guessed && !usedFields.has(guessed)) {
      usedFields.add(guessed);
      return { ...item, mappedField: guessed };
    }
    return { ...item, mappedField: '' };
  });

  // Second pass: positional auto-fill for any remaining unmapped entries
  const fallbackOrder = getDefaultPositionalFields(mappedEntries.length).filter(
    (f) => !usedFields.has(f)
  );
  let fallbackIdx = 0;
  mappedEntries.forEach((entry) => {
    if (!entry.mappedField && fallbackIdx < fallbackOrder.length) {
      entry.mappedField = fallbackOrder[fallbackIdx];
      usedFields.add(fallbackOrder[fallbackIdx]);
      fallbackIdx += 1;
    }
  });

  return {
    ok: true,
    formId,
    responderUri,
    entries: mappedEntries,
    entryIds: entriesToEntryIds(mappedEntries),
    hasPrefillEntries: mappedEntries.length > 0
  };
}

export function hasAnyMappedEntry(entryIds: MasterFormEntryIds): boolean {
  return Object.values(entryIds).some((id) => Boolean(id && id.trim()));
}

/**
 * Build a pre-filled Google Forms responder URL that automatically populates all
 * Round 1 & Round 2 answers when the student clicks to submit.
 */
export function buildPrefilledGoogleFormUrl(
  config: MasterFormConfig,
  session: WorkshopSessionState
): string {
  const url = new URL(config.responderUri);
  if (!hasAnyMappedEntry(config.entryIds)) {
    return url.toString();
  }

  url.searchParams.set('usp', 'pp_url');

  const setIfPresent = (entryId: string, value: string) => {
    if (entryId && value.trim()) {
      url.searchParams.set(`entry.${entryId}`, value.trim());
    }
  };

  setIfPresent(config.entryIds.groupName, session.groupName || 'Chưa nhập tên nhóm');

  if (session.round1Decision) {
    const r1 = session.round1Decision;
    setIfPresent(
      config.entryIds.r1Route,
      `${r1.routeCode} — ${r1.routeName} (${r1.activeTimeRangeLabel}, muộn nhất ngày ${r1.committedMaxDays} · ${r1.totalCostUSD.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} USD)`
    );
    setIfPresent(config.entryIds.r1Reason, r1.reason);
    setIfPresent(config.entryIds.r1Conditions, r1.conditionsToConfirm);
  }

  if (session.round2Decision) {
    const r2 = session.round2Decision;
    const actionLabel = r2.actionType === 'KEEP' ? 'GIỮ NGUYÊN TUYẾN' : 'ĐỔI TUYẾN';
    setIfPresent(
      config.entryIds.r2Decision,
      `${actionLabel} → ${r2.routeCode} — ${r2.routeName} (${r2.activeTimeRangeLabel}, muộn nhất ngày ${r2.committedMaxDays} · ${r2.totalCostUSD.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} USD)`
    );
    setIfPresent(config.entryIds.r2Reason, r2.reason);
    setIfPresent(config.entryIds.r2Conditions, r2.conditionsToConfirm);
    setIfPresent(config.entryIds.r2ChangeMind, r2.changeMindCondition || '');
  }

  setIfPresent(config.entryIds.fullSummary, buildSubmissionSummaryText(session));

  return url.toString();
}

export function encodeMasterFormParam(config: MasterFormConfig): string {
  const compactEntries: Partial<MasterFormEntryIds> = {};
  (Object.keys(config.entryIds) as WorkshopPrefillFieldKey[]).forEach((k) => {
    if (config.entryIds[k]) {
      compactEntries[k] = config.entryIds[k];
    }
  });
  const payload = {
    id: config.formId,
    r: config.responderUri,
    e: compactEntries
  };
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeMasterFormParam(raw: string): MasterFormConfig | null {
  try {
    if (!raw) return null;
    const base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
    const binary = atob(base64 + pad);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as {
      id?: string;
      r?: string;
      e?: Partial<MasterFormEntryIds>;
    };
    if (!parsed.r || !parsed.e) return null;
    const formId = parsed.id || '';
    return {
      formId,
      title: 'Google Form chủ Workshop Nhóm 7',
      responderUri: parsed.r,
      editUri: '',
      createdAtIso: new Date().toISOString(),
      entryIds: {
        ...createEmptyEntryIds(),
        ...parsed.e
      }
    };
  } catch {
    return null;
  }
}

export function buildShareableWorkshopUrl(config: MasterFormConfig): string {
  if (typeof window === 'undefined') return '';
  const encoded = encodeMasterFormParam(config);
  const shareUrl = new URL(window.location.origin + window.location.pathname);
  shareUrl.searchParams.set('mf', encoded);
  return shareUrl.toString();
}

export function parseMasterFormFromUrl(): MasterFormConfig | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('mf');
  if (!raw) return null;
  return decodeMasterFormParam(raw);
}

export function loadMasterFormConfig(): MasterFormConfig {
  const fromUrl = parseMasterFormFromUrl();
  if (fromUrl) {
    saveMasterFormConfig(fromUrl);
    return fromUrl;
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(MASTER_FORM_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MasterFormConfig;
        if (parsed?.responderUri && parsed?.entryIds) {
          return {
            ...parsed,
            entryIds: {
              ...createEmptyEntryIds(),
              ...parsed.entryIds
            }
          };
        }
      }
    } catch {
      // Ignore storage errors and fall back to built-in default
    }
  }
  return DEFAULT_MASTER_FORM_CONFIG;
}

export function saveMasterFormConfig(config: MasterFormConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MASTER_FORM_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

export function clearMasterFormConfig(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(MASTER_FORM_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
