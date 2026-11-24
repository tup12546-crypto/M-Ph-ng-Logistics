/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CARGO_PARAMS, EXTENDED_ROUTE_TEMPLATES } from '../data/defaultData';
import {
  applyTemplateToCustomRoute,
  buildLegsForSequence,
  createCustomRouteClone,
  DEFAULT_ROUTES,
  evaluateRoute,
  formatWorkshopUSD,
  getHubById,
  validateRoute
} from './logisticsEngine';
import { getRealisticPathCoordinates } from './geoPaths';
import {
  buildPrefilledGoogleFormUrl,
  decodeMasterFormParam,
  DEFAULT_MASTER_FORM_CONFIG,
  encodeMasterFormParam,
  MasterFormConfig,
  parsePrefilledGoogleFormUrl
} from './googleFormsUrl';
import { createInitialSessionState } from './workshopStorage';

test('1. Packaging & cargo parameters reconcile 3.000 kg -> 3.107,2 kg -> 3.282,2 kg and Vol 1.167 / 1.521,28 kg', () => {
  assert.equal(DEFAULT_CARGO_PARAMS.netBoardWeightKg, 3000);
  assert.equal(DEFAULT_CARGO_PARAMS.cartonGrossWeightKg, 3107.2);
  assert.equal(DEFAULT_CARGO_PARAMS.palletGrossWeightKg, 3282.2);
  assert.equal(DEFAULT_CARGO_PARAMS.fullPalletHeightCm, 139.4);
  assert.equal(DEFAULT_CARGO_PARAMS.partialPalletHeightCm, 114.4);
  assert.equal(DEFAULT_CARGO_PARAMS.cartonVolumetricWeightKg, 1167);
  assert.equal(DEFAULT_CARGO_PARAMS.palletVolumetricWeightKg, 1521.28);
  assert.equal(DEFAULT_CARGO_PARAMS.round1MaxDaysLimit, 35);
  assert.equal(DEFAULT_CARGO_PARAMS.round2MaxDaysLimit, 30);
});

test('2. All 8 official Round 1 and Round 2 pairs match Section 1 exactly (repeated toggles stay exact)', () => {
  assert.equal(DEFAULT_ROUTES.length, 4);

  // Round 1 (limit 35 days)
  const r1 = DEFAULT_ROUTES.map((r) => evaluateRoute(r, DEFAULT_CARGO_PARAMS, 1));
  assert.equal(r1[0].activeTimeRangeLabel, '3–5 ngày');
  assert.equal(r1[0].totalCostUSD, 14545);
  assert.equal(r1[1].activeTimeRangeLabel, '6–8 ngày');
  assert.equal(r1[1].totalCostUSD, 14000);
  assert.equal(r1[2].activeTimeRangeLabel, '28–34 ngày');
  assert.equal(r1[2].totalCostUSD, 2500);
  assert.equal(r1[2].meetsTimeLimit, true);
  assert.equal(r1[2].daysMargin, 1);
  assert.equal(r1[3].activeTimeRangeLabel, '15–18 ngày');
  assert.equal(r1[3].totalCostUSD, 9200);
  assert.equal(r1[3].legs.length, 5); // PA-D must explicitly have 5 legs including Jebel Ali -> DXB truck

  // Round 2 (limit 30 days, Christmas trouble)
  const r2 = DEFAULT_ROUTES.map((r) => evaluateRoute(r, DEFAULT_CARGO_PARAMS, 2));
  assert.equal(r2[0].activeTimeRangeLabel, '10–12 ngày');
  assert.equal(r2[0].totalCostUSD, 15171.8);
  assert.equal(formatWorkshopUSD(r2[0].totalCostUSD), '15.171,80');
  assert.equal(r2[0].withinEmergencyBudget, false);
  // PA-A Round 2 commentary must NOT claim "nhanh nhất (3–5 ngày)"
  assert.ok(!r2[0].dynamicPros.join(' ').includes('3–5'));

  assert.equal(r2[1].activeTimeRangeLabel, '10–12 ngày');
  assert.equal(r2[1].totalCostUSD, 14352.58);
  assert.equal(formatWorkshopUSD(r2[1].totalCostUSD), '14.352,58');
  assert.equal(r2[1].withinEmergencyBudget, true);
  assert.equal(r2[1].meetsNormalBudget, false);

  assert.equal(r2[2].activeTimeRangeLabel, '29–35 ngày');
  assert.equal(r2[2].totalCostUSD, 2695);
  assert.equal(r2[2].meetsTimeLimit, false);
  assert.equal(r2[2].daysMargin, -5);

  assert.equal(r2[3].activeTimeRangeLabel, '17–20 ngày');
  assert.equal(r2[3].totalCostUSD, 9412);
  assert.equal(r2[3].meetsTimeLimit, true);
  assert.equal(r2[3].daysMargin, 10);
  assert.equal(r2[3].budgetDeltaFromNormalUSD, 2588);

  // Re-evaluating Round 1 after Round 2 always calculates from base cost (no double-charging)
  const r1Again = evaluateRoute(DEFAULT_ROUTES[3], DEFAULT_CARGO_PARAMS, 1);
  assert.equal(r1Again.totalCostUSD, 9200);
  const r2Again = evaluateRoute(DEFAULT_ROUTES[3], DEFAULT_CARGO_PARAMS, 2);
  assert.equal(r2Again.totalCostUSD, 9412);
});

test('3. P0-1 & P0-2: Cloning PA-D -> applying C, A, B, D and all 4 extended templates uses actual itinerary cleanly', () => {
  const paD = DEFAULT_ROUTES[3];
  const copy5 = createCustomRouteClone(paD, 5);

  // Apply C onto clone of D, then rename it
  const copyAsC = {
    ...applyTemplateToCustomRoute(copy5, 'PA-C'),
    name: 'Bản thử Hamburg của nhóm'
  };

  const cRound1 = evaluateRoute(copyAsC, DEFAULT_CARGO_PARAMS, 1);
  const cRound2 = evaluateRoute(copyAsC, DEFAULT_CARGO_PARAMS, 2);
  assert.equal(cRound1.activeTimeRangeLabel, '28–34 ngày');
  assert.equal(cRound1.totalCostUSD, 2500);
  assert.ok(cRound1.fullItineraryLabel.includes('Hamburg'));
  assert.ok(!cRound1.fullItineraryLabel.includes('Dubai'));
  assert.equal(cRound2.activeTimeRangeLabel, '29–35 ngày');
  assert.equal(cRound2.totalCostUSD, 2695);
  assert.equal(cRound2.affectedHubId, 'hub_hamburg');

  // Original PA-D untouched
  const origD = evaluateRoute(paD, DEFAULT_CARGO_PARAMS, 2);
  assert.equal(origD.totalCostUSD, 9412);
  assert.ok(origD.fullItineraryLabel.includes('Jebel Ali'));

  // Sequentially apply A -> B -> C -> D on the same copy (fixes P0-2: 14.545 / 14.000 / 2.500 / 9.200)
  const asA = applyTemplateToCustomRoute(copyAsC, 'PA-A');
  assert.equal(evaluateRoute(asA, DEFAULT_CARGO_PARAMS, 1).totalCostUSD, 14545);
  assert.equal(evaluateRoute(asA, DEFAULT_CARGO_PARAMS, 2).totalCostUSD, 15171.8);

  const asB = applyTemplateToCustomRoute(asA, 'PA-B');
  assert.equal(evaluateRoute(asB, DEFAULT_CARGO_PARAMS, 1).totalCostUSD, 14000);
  assert.equal(evaluateRoute(asB, DEFAULT_CARGO_PARAMS, 2).totalCostUSD, 14352.58);

  const asC = applyTemplateToCustomRoute(asB, 'PA-C');
  assert.equal(evaluateRoute(asC, DEFAULT_CARGO_PARAMS, 1).totalCostUSD, 2500);
  assert.equal(evaluateRoute(asC, DEFAULT_CARGO_PARAMS, 2).totalCostUSD, 2695);

  const asD = applyTemplateToCustomRoute(asC, 'PA-D');
  assert.equal(evaluateRoute(asD, DEFAULT_CARGO_PARAMS, 1).totalCostUSD, 9200);
  assert.equal(evaluateRoute(asD, DEFAULT_CARGO_PARAMS, 2).totalCostUSD, 9412);

  // Extended templates: Munich must NOT keep D's 15-18 days; Rotterdam must match Cái Mép – Thị Vải
  for (const ext of EXTENDED_ROUTE_TEMPLATES) {
    const applied = applyTemplateToCustomRoute(asD, ext.key);
    const ev1 = evaluateRoute(applied, DEFAULT_CARGO_PARAMS, 1);
    const ev2 = evaluateRoute(applied, DEFAULT_CARGO_PARAMS, 2);
    assert.equal(ev1.pricingBasis, 'ESTIMATED');
    assert.equal(ev1.validation.isValid, true);
    if (ext.key === 'EXT_MUNICH') {
      assert.ok(ev1.committedMaxDays <= 6);
      assert.equal(ev2.troubleCoverage, 'UNMODELED');
    }
    if (ext.key === 'EXT_ROTTERDAM_RAIL') {
      assert.ok(ev1.fullItineraryLabel.includes('Cái Mép – Thị Vải'));
      assert.ok(!applied.notes.includes('Cát Lái'));
    }
  }
});

test('4. P0-3: Infrastructure validation catches SEA from warehouse & duplicate hubs with per-leg hints, and never clamps >35 days', () => {
  const base = createCustomRouteClone(DEFAULT_ROUTES[2], 5);
  // Invalid mode: SEA directly from VSIP II warehouse
  const badSeaRoute = {
    ...base,
    legs: buildLegsForSequence(base.id, base.hubIds, ['SEA', 'SEA', 'ROAD'])
  };
  const valSea = validateRoute(badSeaRoute);
  assert.equal(valSea.isValid, false);
  assert.ok(valSea.legErrors[0]);
  assert.ok(valSea.legErrors[0].fixHint.includes('Xe tải'));

  const evBad = evaluateRoute(badSeaRoute, DEFAULT_CARGO_PARAMS, 1);
  assert.equal(evBad.commitmentStatus, 'INVALID_ROUTE');
  assert.equal(evBad.meetsTimeLimit, false);

  // Duplicate consecutive hub: Hamburg -> Hamburg
  const dupHubIds = [
    'hub_vsip2_binhduong',
    'hub_cat_lai',
    'hub_hamburg',
    'hub_hamburg',
    'hub_stuttgart_iriso'
  ];
  const dupRoute = {
    ...base,
    hubIds: dupHubIds,
    legs: buildLegsForSequence(base.id, dupHubIds, ['ROAD', 'SEA', 'ROAD', 'ROAD'])
  };
  const valDup = validateRoute(dupRoute);
  assert.equal(valDup.isValid, false);
  assert.ok(valDup.legErrors[2]);
  assert.ok(valDup.legErrors[2].message.includes('trùng nhau'));

  // Custom long route exceeding 35 days must NOT clamp days to 35
  const longHubIds = [
    'hub_vsip2_binhduong',
    'hub_cat_lai',
    'hub_singapore',
    'hub_jebel_ali',
    'hub_rotterdam',
    'hub_hamburg',
    'hub_stuttgart_iriso'
  ];
  const longRoute = {
    ...base,
    hubIds: longHubIds,
    legs: buildLegsForSequence(base.id, longHubIds, ['ROAD', 'SEA', 'SEA', 'SEA', 'SEA', 'ROAD'])
  };
  const evLong = evaluateRoute(longRoute, DEFAULT_CARGO_PARAMS, 1);
  assert.ok(evLong.committedMaxDays > 35);
  assert.equal(evLong.exceedsRound1Max35, true);
  assert.equal(evLong.meetsTimeLimit, false);

  // Maritime path offshore sanity check
  const catLai = getHubById('hub_cat_lai')!;
  const jebelAli = getHubById('hub_jebel_ali')!;
  assert.ok(getRealisticPathCoordinates(catLai, jebelAli, 'SEA').length >= 6);
});

test('5. Zero-OAuth Google Form pre-filled link parser, auto-mapping & ?mf= round-trip', () => {
  // Invalid URL rejected cleanly
  const invalidRes = parsePrefilledGoogleFormUrl('https://example.com/not-a-form');
  assert.equal(invalidRes.ok, false);

  // Keyword-based pre-filled link parsing
  const pastedPrefillUrl =
    'https://docs.google.com/forms/d/e/1FAIpQLSampleFormId123/viewform?usp=pp_url' +
    '&entry.101=T%C3%AAn+nh%C3%B3m' +
    '&entry.102=V%C3%B2ng+1' +
    '&entry.103=L%C3%BD+do+V1' +
    '&entry.105=V%C3%B2ng+2' +
    '&entry.106=L%C3%BD+do+V2' +
    '&entry.109=T%C3%B3m+t%E1%BA%AFt';

  const parsed = parsePrefilledGoogleFormUrl(pastedPrefillUrl);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.responderUri, 'https://docs.google.com/forms/d/e/1FAIpQLSampleFormId123/viewform');
  assert.equal(parsed.hasPrefillEntries, true);
  assert.equal(parsed.entryIds.groupName, '101');
  assert.equal(parsed.entryIds.r1Route, '102');
  assert.equal(parsed.entryIds.r1Reason, '103');
  assert.equal(parsed.entryIds.r2Decision, '105');
  assert.equal(parsed.entryIds.r2Reason, '106');
  assert.equal(parsed.entryIds.fullSummary, '109');

  // Positional 2-field form (no keywords needed) -> maps to groupName + fullSummary
  const twoFieldParsed = parsePrefilledGoogleFormUrl(
    'https://docs.google.com/forms/d/e/1FAIpQLTwoField/viewform?usp=pp_url&entry.501=abc&entry.502=xyz'
  );
  assert.equal(twoFieldParsed.ok, true);
  if (twoFieldParsed.ok) {
    assert.equal(twoFieldParsed.entryIds.groupName, '501');
    assert.equal(twoFieldParsed.entryIds.fullSummary, '502');
  }

  const sampleConfig: MasterFormConfig = {
    formId: parsed.formId,
    title: 'Google Form chủ Workshop Nhóm 7',
    responderUri: parsed.responderUri,
    editUri: '',
    createdAtIso: '2026-01-01T00:00:00.000Z',
    entryIds: parsed.entryIds
  };

  // Encode/decode ?mf= round-trip
  const encoded = encodeMasterFormParam(sampleConfig);
  const decoded = decodeMasterFormParam(encoded);
  assert.ok(decoded);
  assert.equal(decoded.responderUri, sampleConfig.responderUri);
  assert.deepEqual(decoded.entryIds, sampleConfig.entryIds);

  // Build pre-filled URL with Round 1 + Round 2 session
  const session = createInitialSessionState();
  session.groupName = 'Nhóm 7 Test';
  session.round1Decision = {
    round: 1,
    routeId: 'route_c',
    routeCode: 'PA-C',
    routeName: 'Đường biển thẳng Hamburg',
    committedMaxDays: 34,
    activeTimeRangeLabel: '28–34 ngày',
    totalCostUSD: 2500,
    reason: 'Chi phí 2.500 USD tối ưu Vòng 1',
    conditionsToConfirm: 'Xác nhận kho nhận ngày 34',
    isConditionalProposal: false,
    savedAtIso: '2026-01-01T01:00:00.000Z'
  };
  session.round2Decision = {
    round: 2,
    routeId: 'route_d',
    routeCode: 'PA-D',
    routeName: 'Sea–Air qua Dubai',
    committedMaxDays: 20,
    activeTimeRangeLabel: '17–20 ngày',
    totalCostUSD: 9412,
    reason: 'Đổi sang D: 17-20 ngày, 9.412 USD',
    conditionsToConfirm: 'Giữ chỗ bay DXB',
    changeMindCondition: 'Nếu PA-C cam kết dưới 30 ngày',
    actionType: 'SWITCH',
    isConditionalProposal: false,
    savedAtIso: '2026-01-01T02:00:00.000Z'
  };

  const prefilled = new URL(buildPrefilledGoogleFormUrl(sampleConfig, session));
  assert.equal(prefilled.searchParams.get('usp'), 'pp_url');
  assert.equal(prefilled.searchParams.get('entry.101'), 'Nhóm 7 Test');
  assert.ok(prefilled.searchParams.get('entry.102')?.includes('PA-C'));
  assert.equal(prefilled.searchParams.get('entry.103'), 'Chi phí 2.500 USD tối ưu Vòng 1');
  assert.ok(prefilled.searchParams.get('entry.105')?.includes('ĐỔI TUYẾN → PA-D'));
  assert.equal(prefilled.searchParams.get('entry.106'), 'Đổi sang D: 17-20 ngày, 9.412 USD');
  assert.ok(prefilled.searchParams.get('entry.109')?.includes('Tên nhóm: Nhóm 7 Test'));
  assert.ok(!prefilled.searchParams.get('entry.109')?.includes('Phân loại đề xuất'));

  // Built-in Master Form (https://forms.gle/a5GkEwoETsqHrEASA) pre-fills all 9 verified entry IDs
  const builtInPrefilled = new URL(
    buildPrefilledGoogleFormUrl(DEFAULT_MASTER_FORM_CONFIG, session)
  );
  assert.equal(builtInPrefilled.searchParams.get('usp'), 'pp_url');
  assert.equal(builtInPrefilled.searchParams.get('entry.948574909'), 'Nhóm 7 Test');
  assert.ok(builtInPrefilled.searchParams.get('entry.505082067')?.includes('PA-C'));
  assert.equal(builtInPrefilled.searchParams.get('entry.1757757263'), 'Chi phí 2.500 USD tối ưu Vòng 1');
  assert.equal(builtInPrefilled.searchParams.get('entry.1799491487'), 'Xác nhận kho nhận ngày 34');
  assert.ok(builtInPrefilled.searchParams.get('entry.1425478432')?.includes('ĐỔI TUYẾN → PA-D'));
  assert.equal(builtInPrefilled.searchParams.get('entry.1453858363'), 'Đổi sang D: 17-20 ngày, 9.412 USD');
  assert.equal(builtInPrefilled.searchParams.get('entry.111634178'), 'Giữ chỗ bay DXB');
  assert.equal(builtInPrefilled.searchParams.get('entry.479704050'), 'Nếu PA-C cam kết dưới 30 ngày');
  assert.ok(builtInPrefilled.searchParams.get('entry.635102439')?.includes('Tên nhóm: Nhóm 7 Test'));
});
