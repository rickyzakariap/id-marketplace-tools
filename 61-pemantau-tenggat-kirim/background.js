'use strict';

importScripts('lib/deadline.js');

const ALARM_NAME = 'dispatch-deadline-check';
const URGENT_COLOR = '#b8431c';
const CRITICAL_COLOR = '#2231dd';

const DeadlineLib = self.DeadlineLib;

function ensureAlarm() {
  chrome.alarms.get(ALARM_NAME, function (alarm) {
    if (!alarm) {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
    }
  });
}

function refreshBadge() {
  chrome.storage.local.get(['orders', 'settings'], function (data) {
    const orders = Array.isArray(data.orders) ? data.orders : [];
    const result = DeadlineLib.evaluateOrders(orders, data.settings, Date.now());
    const summary = result.summary;
    const urgent = summary.late + summary.critical;

    chrome.action.setBadgeText({ text: urgent > 0 ? String(urgent) : '' });

    if (summary.late > 0) {
      chrome.action.setBadgeBackgroundColor({ color: URGENT_COLOR });
    } else if (summary.critical > 0) {
      chrome.action.setBadgeBackgroundColor({ color: CRITICAL_COLOR });
    }

    let title = 'Pemantau Tenggat Kirim';
    if (summary.total === 0) {
      title += ': belum ada pesanan';
    } else {
      title += ': ' + summary.total + ' pesanan, ' + summary.late + ' terlambat, ' +
        summary.critical + ' kritis';
    }
    chrome.action.setTitle({ title: title });
  });
}

chrome.runtime.onInstalled.addListener(function () {
  ensureAlarm();
  refreshBadge();
});

chrome.runtime.onStartup.addListener(function () {
  ensureAlarm();
  refreshBadge();
});

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === ALARM_NAME) refreshBadge();
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName === 'local' && (changes.orders || changes.settings)) {
    refreshBadge();
  }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message && message.type === 'refresh-badge') {
    refreshBadge();
    sendResponse({ ok: true });
  }
});

ensureAlarm();
refreshBadge();
