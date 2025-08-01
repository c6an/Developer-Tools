import Xss_Bayev from "../lib/xss_bayev.js";
import { Recver } from "../lib/messegeController.js";
import Dom_Storage from "../lib/dom_storage.js";
import {
  OPTION_KEYS,
  START_MSG,
  FILTER_CHECK,
  ATTACK_START,
  REPLAY_CHECK,
} from "../lib/config.js";

const xss = new Xss_Bayev(OPTION_KEYS);
const sensor = new Dom_Storage();
const filter_recver = new Recver(),
  replay_recver = new Recver(),
  attack_recver = new Recver();
let lastDetection = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;

  if (msg.type === "INJECT_XSS_DETECTOR") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;

      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          files: ["popup3/xss_new.js"],
          world: "MAIN",
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error("Inject error:", chrome.runtime.lastError);
          }
        }
      );
    });

    return true;
  }

  if (msg.type === "fetchHTML") {
    (async () => {
      try {
        const res = await fetch(msg.url, { cache: "no-store" });
        sendResponse({ html: await res.text() });
      } catch (e) {
        sendResponse({ error: e.message });
      }
    })();

    return true;
  }

  if (msg.type === "XSS_EXECUTED") {
    console.log("[background] Received XSS_EXECUTED message:", msg);

    const payload = msg.payload || msg;
    const method = payload.method || "unknown";
    const message = payload.message || "";
    const url = payload.url || "unknown";

    if (!["alert", "prompt", "confirm"].includes(method)) {
      console.log("[background] Ignoring non-dialog method:", method);
      return;
    }

    lastDetection = {
      method,
      message,
      url,
      timestamp: payload.timestamp || Date.now(),
    };

    console.warn("[background] XSS Detected:", lastDetection);

    chrome.runtime.sendMessage({
      type: "XSS_EXECUTED",
      ...lastDetection,
    });

    sendResponse?.({ success: true });
    return true;
  }

  if (msg === "GET_LAST_DETECTION") {
    sendResponse(lastDetection);
    return true;
  }
});
