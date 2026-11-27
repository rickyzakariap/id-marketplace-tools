'use strict';

importScripts('lib/expiry.js');

const ALARM_NAME = 'expiry-stock-check';
const EXPIRED_COLOR = '#b8431c';
const CRITICAL_COLOR = '#2231dd';

const ExpiryLib = self.ExpiryLib;

function ensureAlarm() {
  chrome.alarms.get(ALARM_NAME, function (alarm) {
    if (!alarm) {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: 60 });
    }
  });
}

function refreshBadge() {
  chrome.storage.local.get(['batches', 'settings'], function (data) {
    const batches = Array.isArray(data.batches) ? data.batches : [];
    const result = ExpiryLib.evaluateBatches(batches, data.settings, Date.now());
    const summary = result.summary;
    const urgent = summary.expired + summary.critical;

    chrome.action.setBadgeText({ text: urgent > 0 ? String(urgent) : '' });

    if (summary.expired > 0) {
      chrome.action.setBadgeBackgroundColor({ color: EXPIRED_COLOR });
    } else if (summary.critical > 0) {
      chrome.action.setBadgeBackgroundColor({ color: CRITICAL_COLOR });
    }

    let title = 'Pelacak Kedaluwarsa Stok';
    if (summary.totalBatches === 0) {
      title += ': belum ada batch';
    } else {
      title += ': ' + summary.totalBatches + ' batch, ' + summary.expired +
        ' kedaluwarsa, ' + summary.critical + ' kritis';
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
  if (areaName === 'local' && (changes.batches || changes.settings)) {
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
