import sign from "../lib/operator.js";
import Input_Parser from "../lib/inputpaser.js";
import Storage_Controller from "../lib/storageController.js";
import Dom_Observer from "../lib/dom_obsever.js";

class Popup3 {
  constructor() {
    this.op = sign();
    this.sc = new Storage_Controller();
    this.obser = new Dom_Observer();
    this.parser = new Input_Parser();

    this.prevHtmlList = [];
    this.historyBox = null;
    this.alertBox = null;
    this.testCount = 0;
    this.lastHtmlSnapshot = "";
  }

  async grabCurrentHTML() {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tab = tabs[0];
      if (!tab || !tab.id) throw new Error("No active tab found");

      const url = tab.url || "";
      if (
        url.startsWith("chrome://") ||
        url.startsWith("edge://") ||
        url.startsWith("about:")
      ) {
        throw new Error("Cannot access internal browser page");
      }

      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.documentElement.outerHTML,
      });

      return { tab, html: result.result, url };
    } catch (err) {
      console.warn("grabCurrentHTML skipped:", err);
      return { tab: null, html: "", url: "" };
    }
  }

  renderRawHtmlBlock(html, url, testNum) {
    const block = document.createElement("div");
    block.className = "diff-block";
    block.innerHTML = `
      <button class="del-btn">❌</button>
      <div class="caption"><strong>Test #${testNum}</strong> - 최초 HTML (URL: ${url})</div>
      <pre>${html.replace(/</g, "&lt;")}</pre>
    `;
    block.querySelector(".del-btn").onclick = () => {
      block.remove();
      this.removeHistory(testNum);
    };
    this.historyBox.appendChild(block);
  }

  renderDiffBlock(oldHTML, newHTML, url, testNum) {
    const diff = Diff.diffLines(oldHTML, newHTML);
    const summary = `<div class="summary">
      <strong>Summary:</strong> Added: ${
        diff.filter((p) => p.added).length
      }, Removed: ${diff.filter((p) => p.removed).length}
    </div>`;

    const html = diff
      .map((p) => {
        const style = p.added
          ? "background:#c8facc;"
          : p.removed
          ? "background:#ffc8c8;text-decoration:line-through;"
          : "";
        return `<span style="${style}">${p.value.replace(/</g, "&lt;")}</span>`;
      })
      .join("");

    const block = document.createElement("div");
    block.className = "diff-block";
    block.innerHTML = `
      <button class="del-btn">❌</button>
      <div class="caption"><strong>Test #${testNum}</strong> - 변경 비교 (URL: ${url})</div>
      <pre>${summary + html}</pre>
    `;
    block.querySelector(".del-btn").onclick = () => {
      block.remove();
      this.removeHistory(testNum);
    };
    this.historyBox.appendChild(block);

    chrome.runtime.sendMessage("GET_LAST_DETECTION", (data) => {
      if (
        data &&
        data.url === url &&
        typeof data.message === "string" &&
        data.message.includes("<script")
      ) {
        this.displayXssAlert(data, this.alertBox);
      }
    });
  }

  async startAutoObserver() {
    const checkHtml = async () => {
      const { html, url } = await this.grabCurrentHTML();
      if (!html || this.lastHtmlSnapshot === html) return;

      this.testCount++;
      if (this.prevHtmlList.length === 0) {
        this.renderRawHtmlBlock(html, url, this.testCount);
      } else {
        const prevHtml = this.prevHtmlList[this.prevHtmlList.length - 1].html;
        this.renderDiffBlock(prevHtml, html, url, this.testCount);
      }

      this.prevHtmlList.push({ html, url, testNum: this.testCount });
      this.lastHtmlSnapshot = html;
      this.saveHistory();
    };

    await checkHtml();
    setInterval(checkHtml, 2000);
  }

  saveHistory() {
    chrome.storage.local.set({
      prevHtmlList: this.prevHtmlList,
      testCount: this.testCount,
      lastHtmlSnapshot: this.lastHtmlSnapshot,
    });
  }

  removeHistory(testNum) {
    this.prevHtmlList = this.prevHtmlList.filter(
      (item) => item.testNum !== testNum
    );
    this.saveHistory();
  }

  async restoreHistory() {
    return new Promise((res) => {
      chrome.storage.local.get(
        ["prevHtmlList", "testCount", "lastHtmlSnapshot"],
        (result) => {
          if (result.prevHtmlList) {
            this.prevHtmlList = result.prevHtmlList;
            this.testCount = result.testCount || 0;
            this.lastHtmlSnapshot = result.lastHtmlSnapshot || "";
            for (let i = 0; i < this.prevHtmlList.length; i++) {
              const { html, url, testNum } = this.prevHtmlList[i];
              if (i === 0) this.renderRawHtmlBlock(html, url, testNum);
              else
                this.renderDiffBlock(
                  this.prevHtmlList[i - 1].html,
                  html,
                  url,
                  testNum
                );
            }
          }
          res();
        }
      );
    });
  }

  async showXssExecution() {
    chrome.runtime.sendMessage("GET_LAST_DETECTION", (data) => {
      if (data) this.displayXssAlert(data);
    });
  }

  displayXssAlert(data, container = this.alertBox) {
    const htmlEsc = (str) =>
      String(str).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const block = document.createElement("div");
    block.className = "alert-block";
    block.innerHTML = `
      <div class="alert-content" style="background:#f8d7da;padding:10px;border:1px solid #f5c2c7;border-radius:5px;margin:10px 0;color:#842029;position:relative">
        <button class="alert-del-btn" style="position:absolute;right:10px;top:5px;background:none;border:none;font-weight:bold;font-size:16px;color:#842029;cursor:pointer">X</button>
        <strong>alert occur</strong><br/>
        Method: <code>${htmlEsc(data.method)}</code><br/>
        Message: <code>${htmlEsc(data.message)}</code><br/>
        URL: <small>${htmlEsc(data.url)}</small>
      </div>
    `;
    block.querySelector(".alert-del-btn").onclick = () => block.remove();
    container.appendChild(block);

    // 자동으로 observ ON
    const toggle = this.op.id("observ");
    if (toggle && !toggle.checked) {
      toggle.checked = true;
      this.alertBox.style.display = "block";
      this.op.print("toggle_status", "on");
    }
  }

  bindElements() {
    this.historyBox = this.op.id("diffFrame");
    this.alertBox = this.op.id("alertFrame");

    if (this._messageListener)
      chrome.runtime.onMessage.removeListener(this._messageListener);

    this._messageListener = (message) => {
      if (message.type === "XSS_EXECUTED") {
        const payload = message.payload || message;
        this.displayXssAlert({
          method: payload.method || "alert",
          message: payload.message || "Unknown message",
          url: payload.url || "",
          timestamp: payload.timestamp || Date.now(),
        });
      }
    };
    chrome.runtime.onMessage.addListener(this._messageListener);
  }

  async status_auto_set() {
    if (await this.obser.exist()) {
      this.op.id("observ").checked = true;
      this.alertBox.style.display = "block";
      this.op.print("toggle_status", "on");
    }
  }

  async toggle_status_print() {
    this.op.change("observ", () => {
      const toggle = this.op.id("observ");
      if (toggle.checked) {
        this.alertBox.style.display = "block";
        this.op.print("toggle_status", "on");
      } else {
        this.alertBox.style.display = "none";
        this.op.print("toggle_status", "off");
      }
    });
  }

  async init() {
    await this.status_auto_set();
    await this.toggle_status_print();
    this.bindElements();
    await this.restoreHistory();
    await this.showXssExecution();
    this.startAutoObserver();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const pop = new Popup3();
  await pop.init();
});
