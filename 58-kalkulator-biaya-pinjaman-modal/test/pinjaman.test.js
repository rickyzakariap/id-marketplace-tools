'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const tool = require('../lib/pinjaman');

function base(overrides) {
  return Object.assign({}, tool.example(), overrides || {});
}

function analyze(overrides) {
  return tool.analyze(base(overrides));
}

function noFees(overrides) {
  return base(Object.assign({
    admin_fee_pct: 0,
    admin_fee_amount: 0,
    provision_pct: 0,
    insurance_pct: 0,
    other_fee_amount: 0,
  }, overrides || {}));
}

test('meta memuat jenis bunga, asumsi, rumus, dan batas', () => {
  const data = tool.meta();
  assert.equal(data.interest_types.length, 2);
  assert.equal(data.interest_types[0].id, 'flat');
  assert.equal(data.interest_types[1].id, 'efektif');
  assert.equal(data.assumptions.length, 6);
  assert.equal(data.formulas.length, 4);
  assert.equal(data.defaults.max_installment_pct, 30);
  assert.equal(data.limits.max_tenor_months, 120);
  assert.equal(data.limits.max_offers, 8);
  assert.ok(data.rules.scope_note.indexOf('tidak menilai kelayakan kredit') !== -1);
  assert.ok(data.rules.disclaimer.indexOf('bukan penawaran resmi') !== -1);
});

test('contoh menghitung biaya, bunga efektif, dan beban cicilan', () => {
  const result = analyze({});
  assert.equal(result.loan.principal, 20000000);
  assert.equal(result.loan.monthly_installment, 1966666.67);
  assert.equal(result.loan.total_interest, 3600000);
  assert.equal(result.loan.upfront_fees.total, 300000);
  assert.equal(result.loan.net_disbursed, 19700000);
  assert.equal(result.loan.total_cost, 3900000);
  assert.equal(result.loan.cost_ratio_pct, 19.8);
  assert.equal(result.loan.nominal_annual_pct, 18);
  assert.equal(result.loan.effective_annual_pct, 40.83);
  assert.equal(result.loan.rate_gap_points, 22.83);
  assert.equal(result.affordability.total_installment, 2466666.67);
  assert.equal(result.affordability.total_debt_ratio_pct, 41.11);
  assert.equal(result.affordability.net_monthly_after_debt, 3533333.33);
  assert.equal(result.max_safe.max_safe_principal, 13220338.98);
  assert.equal(result.verdict.level, 'signal');
  assert.equal(result.verdict.label, 'Cicilan menipiskan laba');
  assert.equal(result.schedule.rows.length, 12);
  assert.equal(result.schedule.rows[11].closing, 0);
});

test('bunga flat menghitung bunga dari plafon awal', () => {
  const result = tool.analyze(noFees({
    principal: 12000000,
    tenor_months: 12,
    interest_rate_pct: 1,
    interest_type: 'flat',
    monthly_gross_profit: 5000000,
    existing_installment: 0,
  }));
  assert.equal(result.loan.monthly_installment, 1120000);
  assert.equal(result.loan.total_interest, 1440000);
  assert.equal(result.loan.net_disbursed, 12000000);
  assert.equal(result.loan.total_cost, 1440000);
  assert.equal(result.loan.cost_ratio_pct, 12);
  assert.ok(result.loan.effective_annual_pct > result.loan.nominal_annual_pct);
});

test('biaya awal memotong uang diterima dan nominal admin menang', () => {
  const fees = tool.calculateFees(tool.normalizeInput(base({
    admin_fee_pct: 5,
    admin_fee_amount: 250000,
  })));
  assert.equal(fees.admin, 250000);
  assert.equal(fees.insurance, 100000);
  assert.equal(fees.total, 350000);

  const result = analyze({ admin_fee_amount: 250000, admin_fee_pct: 5 });
  assert.equal(result.loan.net_disbursed, 19650000);
  assert.equal(result.loan.total_cost, 3950000);
  assert.ok(result.loan.cost_ratio_pct > 20);
});

test('bunga efektif nol persen membagi pokok rata tanpa biaya', () => {
  const result = tool.analyze(noFees({
    principal: 12000000,
    tenor_months: 12,
    interest_type: 'efektif',
    interest_rate_pct: 0,
    monthly_gross_profit: 5000000,
    existing_installment: 0,
  }));
  assert.equal(result.loan.monthly_installment, 1000000);
  assert.equal(result.loan.total_interest, 0);
  assert.equal(result.loan.total_cost, 0);
  assert.equal(result.loan.effective_annual_pct, 0);
  assert.equal(result.verdict.level, 'ok');
});

test('bunga efektif memakai rumus anuitas saldo menurun', () => {
  const result = tool.analyze(noFees({
    principal: 12000000,
    tenor_months: 12,
    interest_type: 'efektif',
    interest_rate_pct: 1,
    monthly_gross_profit: 5000000,
    existing_installment: 0,
  }));
  assert.equal(result.loan.monthly_installment, 1066185.46);
  assert.equal(result.loan.total_interest, 794225.57);
  assert.ok(result.schedule.rows[0].interest > result.schedule.rows[11].interest);
  assert.equal(result.schedule.rows[0].opening, 12000000);
  assert.equal(result.schedule.rows[11].closing, 0);
});

test('verdict membedakan aman, tipis, berat, dan laba kosong', () => {
  assert.equal(analyze({ monthly_gross_profit: 10000000, existing_installment: 0 })
    .verdict.level, 'ok');

  const thin = analyze({ monthly_gross_profit: 6000000, existing_installment: 500000 });
  assert.equal(thin.verdict.level, 'signal');
  assert.equal(thin.verdict.label, 'Cicilan menipiskan laba');

  const heavy = analyze({ monthly_gross_profit: 2000000, existing_installment: 0 });
  assert.equal(heavy.verdict.level, 'ember');
  assert.equal(heavy.verdict.label, 'Beban cicilan terlalu berat');

  const negative = analyze({ monthly_gross_profit: 1500000, existing_installment: 0 });
  assert.equal(negative.verdict.level, 'ember');
  assert.equal(negative.verdict.label, 'Cicilan melebihi laba bulanan');

  const empty = analyze({ monthly_gross_profit: 0 });
  assert.equal(empty.affordability.total_debt_ratio_pct, null);
  assert.equal(empty.verdict.label, 'Laba bulanan belum diisi');
});

test('bunga efektif sangat tinggi memicu peringatan biaya', () => {
  const result = tool.analyze(noFees({
    principal: 10000000,
    tenor_months: 12,
    interest_type: 'flat',
    interest_rate_pct: 8,
    monthly_gross_profit: 100000000,
    existing_installment: 0,
  }));
  assert.ok(result.loan.effective_annual_pct >= 100);
  assert.equal(result.verdict.level, 'ember');
  assert.equal(result.verdict.label, 'Biaya pinjaman sangat tinggi');
});

test('plafon aman mengikuti batas cicilan dan cicilan lain', () => {
  const result = analyze({});
  assert.equal(result.affordability.safe_installment_limit, 1800000);
  assert.equal(result.affordability.max_safe_installment, 1300000);
  assert.equal(result.max_safe.max_safe_principal, 13220338.98);

  const noExisting = analyze({ existing_installment: 0 });
  assert.equal(noExisting.max_safe.max_safe_principal, 18305084.75);
});

test('denda telat menambah biaya sesuai hari dan persen', () => {
  const result = analyze({ late_days: 5, late_fee_per_day_pct: 0.1 });
  assert.equal(result.loan.late_fee, 9833.33);
  assert.equal(result.loan.total_cost_with_late, 3909833.33);
  assert.ok(result.recommendations.some((item) => item.indexOf('Skenario telat 5 hari') !== -1));
});

test('jadwal angsuran menutup pokok dan menjumlahkan bunga', () => {
  const result = analyze({});
  assert.equal(result.schedule.rows[0].opening, 20000000);
  assert.equal(result.schedule.rows[11].closing, 0);
  assert.ok(Math.abs(result.schedule.totals.principal - 20000000) < 0.1);
  assert.ok(Math.abs(result.schedule.totals.interest - 3600000) < 0.1);
  assert.ok(Math.abs(result.schedule.totals.installment - 23600000) < 0.1);
});

test('perbandingan memilih bunga efektif tahunan terendah', () => {
  const result = tool.compare({
    monthly_gross_profit: 6000000,
    existing_installment: 500000,
    offers: [
      tool.example(),
      {
        lender: 'Bank',
        principal: 20000000,
        tenor_months: 18,
        interest_type: 'efektif',
        interest_rate_pct: 1.2,
        admin_fee_pct: 0.5,
        insurance_pct: 0.2,
      },
    ],
  });
  assert.equal(result.offers.length, 2);
  assert.equal(result.best_label, 'Bank');
  assert.deepEqual(result.ranked_labels, ['Bank', 'Pinjaman modal toko']);
  assert.ok(result.offers[0].effective_annual_pct > result.offers[1].effective_annual_pct);
  assert.ok(result.note.indexOf('bunga efektif tahunan') !== -1);
});

test('perbandingan menolak jumlah penawaran di luar batas', () => {
  assert.throws(() => tool.compare({ offers: [tool.example()] }), /minimal dua penawaran/);
  const many = [];
  for (let index = 0; index < 9; index += 1) many.push(tool.example());
  assert.throws(() => tool.compare({ offers: many }), /Maksimal 8 penawaran/);
});

test('validasi menolak nominal, tenor, bunga, dan biaya yang salah', () => {
  assert.throws(() => analyze({ principal: 0 }), /lebih dari 0/);
  assert.throws(() => analyze({ principal: -1000 }), /lebih dari 0/);
  assert.throws(() => analyze({ tenor_months: 0 }), /minimal 1 bulan/);
  assert.throws(() => analyze({ tenor_months: 12.5 }), /bilangan bulat/);
  assert.throws(() => analyze({ tenor_months: 121 }), /maksimal 120 bulan/);
  assert.throws(() => analyze({ interest_rate_pct: -1 }), /tidak boleh negatif/);
  assert.throws(() => analyze({ interest_rate_pct: 101 }), /maksimal 100 persen/);
  assert.throws(() => analyze({ admin_fee_pct: 101 }), /antara 0 dan 100 persen/);
  assert.throws(() => analyze({ monthly_gross_profit: -1 }), /angka 0 atau lebih/);
  assert.throws(() => analyze({ late_days: 366 }), /antara 0 dan 365/);
  assert.throws(
    () => analyze({ admin_fee_pct: 100, provision_pct: 0, insurance_pct: 0 }),
    /lebih kecil dari plafon/
  );
});

test('pilihan bunga tidak dikenal jatuh ke flat', () => {
  const result = analyze({ interest_type: 'tidak-ada' });
  assert.equal(result.input.interest_type, 'flat');
  assert.equal(result.loan.interest_type_label, 'Bunga flat');
});

test('CSV memuat ringkasan, jadwal, dan netralisasi formula', () => {
  const csv = tool.csvRows(base({ lender: '=SUM(A1)', late_days: 2 }));
  assert.ok(csv.indexOf('ringkasan,nilai') !== -1);
  assert.ok(csv.indexOf('angsuran_per_bulan') !== -1);
  assert.ok(csv.indexOf('bulan,saldo_awal,pokok,bunga,angsuran,sisa') !== -1);
  assert.ok(csv.indexOf("'=SUM(A1)") !== -1);
  assert.ok(csv.indexOf('40.83') !== -1);
});

test('meta, contoh, analisis, perbandingan, dan CSV tidak memakai em dash', () => {
  const texts = [
    JSON.stringify(tool.meta()),
    JSON.stringify(tool.example()),
    JSON.stringify(analyze({})),
    JSON.stringify(tool.compare({
      monthly_gross_profit: 6000000,
      existing_installment: 500000,
      offers: [
        tool.example(),
        Object.assign(tool.example(), { lender: 'Bank', interest_type: 'efektif' }),
      ],
    })),
    tool.csvRows(tool.example()),
  ];
  texts.forEach((text) => {
    assert.equal(text.indexOf('\u2014'), -1, 'em dash ditemukan');
  });
});
