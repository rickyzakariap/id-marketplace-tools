'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const tool = require('../lib/ongkir');

function base(overrides) {
  return Object.assign({}, tool.example(), overrides || {});
}

function analyze(overrides) {
  return tool.analyze(base(overrides));
}

test('meta memuat pembagi, langkah pembulatan, batas, dan asumsi', () => {
  const data = tool.meta();
  assert.equal(data.divisors.length, 4);
  assert.equal(data.rounding_steps.length, 4);
  assert.equal(data.limits.max_dimension_cm, 300);
  assert.equal(data.limits.max_weight_kg, 500);
  assert.ok(data.formula.indexOf('Berat volume') !== -1);
  assert.ok(data.assumptions.length >= 5);
  assert.ok(data.scope_note.indexOf('tidak menetapkan tarif resmi') !== -1);
  assert.ok(data.disclaimer.indexOf('bukan tagihan resmi') !== -1);
});

test('contoh menghitung berat volume, biaya, tier, dan penghematan', () => {
  const result = analyze({});
  assert.equal(result.volume_cm3, 7500);
  assert.equal(result.volumetric_kg, 1.25);
  assert.equal(result.chargeable_kg, 1.3);
  assert.equal(result.billed_by, 'volume');
  assert.equal(result.billed_by_label, 'Berat volume');
  assert.equal(result.breakdown.weight_charge, 23400);
  assert.equal(result.breakdown.total_per_shipment, 25600);
  assert.equal(result.breakdown.monthly_total, 10240000);
  assert.equal(result.breakdown.annual_total, 122880000);
  assert.equal(result.breakdown.volume_extra_per_shipment, 12600);
  assert.equal(result.breakdown.volume_extra_monthly, 5040000);
  assert.equal(result.tier.next_chargeable_kg, 1.4);
  assert.equal(result.tier.next_tier_extra, 1800);
  assert.equal(result.tier.max_volume_for_tier_cm3, 7800);
  assert.equal(result.tier.volume_headroom_cm3, 300);
  assert.equal(result.verdict.level, 'ember');
  assert.equal(result.verdict.label, 'Ongkir ditentukan volume');
});

test('ukuran usulan menghasilkan penghematan per kirim dan per bulan', () => {
  const result = analyze({});
  assert.equal(result.proposed.volume_cm3, 3696);
  assert.equal(result.proposed.volumetric_kg, 0.62);
  assert.equal(result.proposed.chargeable_kg, 0.7);
  assert.equal(result.proposed.total_per_shipment, 14800);
  assert.equal(result.proposed.volume_extra_per_shipment, 1800);
  assert.equal(result.savings.per_shipment, 10800);
  assert.equal(result.savings.monthly, 4320000);
  assert.equal(result.savings.annual, 51840000);
  assert.equal(result.savings.chargeable_kg, 0.6);
});

test('berat aktual yang lebih besar menjadi dasar ongkir', () => {
  const result = analyze({
    length_cm: 10,
    width_cm: 10,
    height_cm: 10,
    actual_weight_kg: 2,
    proposed_dimensions: null,
  });
  assert.equal(result.volume_cm3, 1000);
  assert.equal(result.volumetric_kg, 0.17);
  assert.equal(result.chargeable_kg, 2);
  assert.equal(result.billed_by, 'actual');
  assert.equal(result.breakdown.total_per_shipment, 38200);
  assert.equal(result.breakdown.volume_extra_per_shipment, 0);
  assert.equal(result.verdict.level, 'ok');
  assert.equal(result.verdict.label, 'Ongkir ditentukan berat aktual');
});

test('berat volume yang sama dengan berat aktual tidak dihitung ganda', () => {
  const result = analyze({
    length_cm: 20,
    width_cm: 20,
    height_cm: 15,
    actual_weight_kg: 1,
    proposed_dimensions: null,
  });
  assert.equal(result.volume_cm3, 6000);
  assert.equal(result.volumetric_kg, 1);
  assert.equal(result.chargeable_kg, 1);
  assert.equal(result.billed_by, 'actual');
  assert.equal(result.breakdown.total_per_shipment, 20200);
  assert.equal(result.breakdown.volume_extra_per_shipment, 0);
});

test('pembulatan mengikuti langkah 0,1 kg dan 1 kg', () => {
  const fine = analyze({
    length_cm: 10,
    width_cm: 10,
    height_cm: 10,
    actual_weight_kg: 1.01,
    rounding_step: 0.1,
    proposed_dimensions: null,
  });
  assert.equal(fine.chargeable_kg, 1.1);
  assert.equal(fine.breakdown.total_per_shipment, 22000);

  const coarse = analyze({
    length_cm: 10,
    width_cm: 10,
    height_cm: 10,
    actual_weight_kg: 1.01,
    rounding_step: 1,
    proposed_dimensions: null,
  });
  assert.equal(coarse.chargeable_kg, 2);
  assert.equal(coarse.breakdown.total_per_shipment, 38200);
});

test('minimum charge menahan biaya saat berat tertagih kecil', () => {
  const result = analyze({
    length_cm: 10,
    width_cm: 10,
    height_cm: 10,
    actual_weight_kg: 0.1,
    rate_per_kg: 5000,
    minimum_charge: 9000,
    admin_fee: 1000,
    packaging_cost: 0,
    rounding_step: 0.1,
    shipments_per_month: 10,
    proposed_dimensions: null,
  });
  assert.equal(result.chargeable_kg, 0.2);
  assert.equal(result.breakdown.weight_charge, 9000);
  assert.equal(result.breakdown.total_per_shipment, 10000);
  assert.equal(result.breakdown.volume_extra_per_shipment, 0);
});

test('volume menentukan tetapi minimum charge memberi verdict waspada', () => {
  const result = analyze({
    length_cm: 30,
    width_cm: 25,
    height_cm: 10,
    actual_weight_kg: 0.1,
    rate_per_kg: 1000,
    minimum_charge: 5000,
    admin_fee: 1000,
    packaging_cost: 0,
    rounding_step: 1,
    proposed_dimensions: null,
  });
  assert.equal(result.billed_by, 'volume');
  assert.equal(result.breakdown.volume_extra_per_shipment, 0);
  assert.equal(result.verdict.level, 'signal');
  assert.equal(result.verdict.label, 'Volume menentukan, biaya tertahan minimum');
});

test('perbandingan pembagi menandai pilihan termurah', () => {
  const result = analyze({});
  assert.equal(result.divisors.length, 4);
  const selected = result.divisors.find((item) => item.selected);
  assert.equal(selected.divisor, 6000);
  assert.equal(selected.total_per_shipment, 25600);
  assert.equal(selected.volume_extra_per_shipment, 12600);

  const cheapest = result.divisors.reduce(
    (best, item) => (item.total_per_shipment < best.total_per_shipment ? item : best),
    result.divisors[0]
  );
  assert.equal(cheapest.divisor, 8000);
  assert.equal(cheapest.total_per_shipment, 20200);
  assert.equal(cheapest.extra_vs_cheapest, 0);
});

test('compare menilai beberapa ukuran dan memilih termurah', () => {
  const result = tool.compare(base({
    options: [
      { label: 'Box sekarang', length_cm: 30, width_cm: 25, height_cm: 10 },
      { label: 'Box sedang', length_cm: 28, width_cm: 22, height_cm: 6 },
      { label: 'Box kecil', length_cm: 20, width_cm: 20, height_cm: 5 },
    ],
  }));
  assert.equal(result.options.length, 3);
  assert.equal(result.options[0].total_per_shipment, 25600);
  assert.equal(result.options[1].savings_per_shipment, 10800);
  assert.equal(result.cheapest.label, 'Box kecil');
  assert.equal(result.cheapest.total_per_shipment, 13000);
  assert.equal(result.cheapest.savings_per_shipment, 12600);
  assert.equal(result.cheapest.savings_monthly, 5040000);
});

test('compare menolak daftar opsi kosong dan ukuran tidak valid', () => {
  assert.throws(() => tool.compare(base({ options: [] })), /Minimal satu opsi/);
  assert.throws(
    () => tool.compare(base({ options: [{ label: 'Rusak', length_cm: 0 }] })),
    /Panjang harus lebih dari 0 cm/
  );
});

test('compare membatasi jumlah opsi ukuran', () => {
  const options = [];
  for (let index = 0; index < 9; index += 1) {
    options.push({ label: 'Opsi ' + index, length_cm: 20, width_cm: 20, height_cm: 5 });
  }
  assert.throws(() => tool.compare(base({ options })), /Maksimal 8 opsi ukuran/);
});

test('jumlah kiriman nol tetap menghitung biaya per kirim', () => {
  const result = analyze({ shipments_per_month: 0, proposed_dimensions: null });
  assert.equal(result.breakdown.total_per_shipment, 25600);
  assert.equal(result.breakdown.monthly_total, 0);
  assert.equal(result.breakdown.annual_total, 0);
  assert.equal(result.breakdown.volume_extra_monthly, 0);
});

test('batas dimensi 300 cm diterima dan 301 cm ditolak', () => {
  const result = analyze({
    length_cm: 300,
    width_cm: 1,
    height_cm: 1,
    actual_weight_kg: 1,
    proposed_dimensions: null,
  });
  assert.equal(result.volume_cm3, 300);
  assert.throws(
    () => analyze({ length_cm: 301, proposed_dimensions: null }),
    /Panjang maksimal 300 cm/
  );
});

test('input salah ditolak dengan pesan yang jelas', () => {
  assert.throws(
    () => analyze({ length_cm: 0, proposed_dimensions: null }),
    /Panjang harus lebih dari 0 cm/
  );
  assert.throws(
    () => analyze({ actual_weight_kg: -1, proposed_dimensions: null }),
    /Berat aktual harus lebih dari 0 kg/
  );
  assert.throws(
    () => analyze({ divisor: 999, proposed_dimensions: null }),
    /Pembagi volume minimal 1000/
  );
  assert.throws(
    () => analyze({ rate_per_kg: 0, proposed_dimensions: null }),
    /Tarif per kg harus lebih dari 0/
  );
  assert.throws(
    () => analyze({ shipments_per_month: 1.5, proposed_dimensions: null }),
    /bilangan bulat/
  );
  assert.throws(
    () => analyze({ rounding_step: 0, proposed_dimensions: null }),
    /Langkah pembulatan harus lebih dari 0/
  );
  assert.throws(
    () => analyze({ proposed_dimensions: { length_cm: 0, width_cm: 10, height_cm: 10 } }),
    /Ukuran usulan: Panjang harus lebih dari 0 cm/
  );
});

test('normalisasi memberi nilai aman untuk field opsional', () => {
  const input = tool.normalizeInput({});
  assert.equal(input.divisor, 6000);
  assert.equal(input.rounding_step, 0.1);
  assert.equal(input.proposed_dimensions, null);
  assert.equal(input.package_label, '');
});

test('CSV memuat baris utama, usulan, pembanding, dan menetralkan formula', () => {
  const csv = tool.csvRows(base({ package_label: '=SUM(A1)' }));
  const lines = csv.split('\n');
  assert.equal(lines.length, 7);
  assert.ok(lines[0].indexOf('kelebihan_biaya_volume') !== -1);
  assert.ok(csv.indexOf('utama') !== -1);
  assert.ok(csv.indexOf('usulan') !== -1);
  assert.ok(csv.indexOf('pembanding') !== -1);
  assert.ok(csv.indexOf("'=SUM(A1)") !== -1);
  assert.ok(csv.indexOf('25600') !== -1);
});

test('semua keluaran bebas em dash dan en dash', () => {
  const texts = [
    JSON.stringify(tool.meta()),
    JSON.stringify(tool.example()),
    JSON.stringify(tool.analyze(tool.example())),
    JSON.stringify(tool.compare(base({
      options: [{ label: 'Box kecil', length_cm: 20, width_cm: 20, height_cm: 5 }],
    }))),
    tool.csvRows(tool.example()),
  ];
  texts.forEach((text) => {
    assert.equal(text.indexOf('\u2014'), -1, 'em dash ditemukan');
    assert.equal(text.indexOf('\u2013'), -1, 'en dash ditemukan');
  });
});
