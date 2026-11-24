/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkshopSessionState } from '../types/logistics';

export const STORAGE_KEY = 'logistics_workshop_nhom7_v2';

export function createInitialSessionState(): WorkshopSessionState {
  return {
    groupName: '',
    unlockedRound: 1,
    viewingRound: 1,
    viewingRouteId: 'route_pa_a',
    round1Decision: null,
    round2Decision: null,
    customRoutes: [],
    isDark: false,
    isFestive: true
  };
}

export function loadWorkshopSession(): {
  state: WorkshopSessionState;
  hasSavedProgress: boolean;
} {
  if (typeof window === 'undefined') {
    return { state: createInitialSessionState(), hasSavedProgress: false };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { state: createInitialSessionState(), hasSavedProgress: false };
    }
    const parsed = JSON.parse(raw) as Partial<WorkshopSessionState>;
    const initial = createInitialSessionState();
    const state: WorkshopSessionState = {
      groupName: typeof parsed.groupName === 'string' ? parsed.groupName : initial.groupName,
      unlockedRound: parsed.unlockedRound === 2 ? 2 : 1,
      viewingRound: parsed.viewingRound === 2 && parsed.unlockedRound === 2 ? 2 : 1,
      viewingRouteId:
        typeof parsed.viewingRouteId === 'string' && parsed.viewingRouteId
          ? parsed.viewingRouteId
          : initial.viewingRouteId,
      round1Decision: parsed.round1Decision || null,
      round2Decision: parsed.round2Decision || null,
      customRoutes: Array.isArray(parsed.customRoutes) ? parsed.customRoutes : [],
      isDark: Boolean(parsed.isDark),
      isFestive: typeof parsed.isFestive === 'boolean' ? parsed.isFestive : true
    };

    const hasSavedProgress = Boolean(
      state.groupName.trim() ||
        state.round1Decision ||
        state.round2Decision ||
        state.customRoutes.length > 0
    );

    return { state, hasSavedProgress };
  } catch {
    return { state: createInitialSessionState(), hasSavedProgress: false };
  }
}

export function saveWorkshopSession(state: WorkshopSessionState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

export function clearWorkshopSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function buildSubmissionSummaryText(state: WorkshopSessionState): string {
  const lines: string[] = [];
  lines.push('=== TÓM TẮT KẾT QUẢ WORKSHOP LOGISTICS NHÓM 7 ===');
  lines.push(`Tên nhóm: ${state.groupName.trim() || '(Chưa nhập tên nhóm)'}`);
  lines.push('Đơn hàng: Giao đủ 7 pallet bo mạch (3.282,2 kg) từ VSIP II Bình Dương → Kho Stuttgart (Đức)');
  lines.push('');

  if (state.round1Decision) {
    const r1 = state.round1Decision;
    lines.push('1) VÒNG 1 (Hạn tối đa ngày 35 · Ngân sách 8.000–12.000 USD):');
    lines.push(`   - Phương án chốt: ${r1.routeCode} — ${r1.routeName}`);
    lines.push(`   - Thời gian: ${r1.activeTimeRangeLabel} (muộn nhất ngày ${r1.committedMaxDays})`);
    lines.push(`   - Tổng chi phí: ${r1.totalCostUSD.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} USD`);
    lines.push(`   - Lý do Vòng 1: ${r1.reason}`);
    if (r1.conditionsToConfirm) {
      lines.push(`   - Điều kiện cần xác nhận: ${r1.conditionsToConfirm}`);
    }
  } else {
    lines.push('1) VÒNG 1: Chưa chốt');
  }

  lines.push('');

  if (state.round2Decision) {
    const r2 = state.round2Decision;
    lines.push('2) VÒNG 2 — SỰ CỐ GIÁNG SINH (Chậm nhất ngày 30 · Ngân sách 8.000–12.000 USD (tối đa có thể 15.000 USD)):');
    lines.push(
      `   - Quyết định: ${r2.actionType === 'KEEP' ? 'GIỮ NGUYÊN TUYẾN' : 'ĐỔI TUYẾN'} → ${r2.routeCode} — ${r2.routeName}`
    );
    lines.push(`   - Thời gian: ${r2.activeTimeRangeLabel} (muộn nhất ngày ${r2.committedMaxDays})`);
    lines.push(`   - Tổng chi phí: ${r2.totalCostUSD.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} USD`);
    lines.push(`   - Lý do giữ/đổi: ${r2.reason}`);
    if (r2.conditionsToConfirm) {
      lines.push(`   - Điều kiện cần xác nhận trước khi đặt dịch vụ: ${r2.conditionsToConfirm}`);
    }
    if (r2.changeMindCondition) {
      lines.push(`   - Điều kiện khiến nhóm đổi ý: ${r2.changeMindCondition}`);
    }
  } else {
    lines.push('2) VÒNG 2: Chưa chốt');
  }

  return lines.join('\n');
}
