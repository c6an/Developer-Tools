console.log("content_detector loaded");

let isXssHookLoaded = false;

function detectXssInUrl() {
  const url = window.location.href;
  const decodedUrl = decodeURIComponent(url);
  const patterns = [
    /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
    /javascript:/gi,
    /data:/gi,
    /on\w+\s*=/gi,
    /alert\s*\(/gi,
    /prompt\s*\(/gi,
    /confirm\s*\(/gi,
  ];
  return patterns.some((pattern) => pattern.test(decodedUrl));
}

function observeAndTransformScripts() {
  function checkScripts() {
    const scripts = document.getElementsByTagName("script");
    for (let script of scripts) {
      if (!script.__processed && script.textContent.includes("alert(")) {
        const originalCode = script.textContent;

        const transformedCode = originalCode.replace(
          /alert\((.*?)\)/g,
          (match, args) => `
          (() => {
            console.log("alert 발생"); 
            window.postMessage({
              source: "xss-detector",
              type: "XSS_EXECUTED",
              method: "alert",
              message: ${args},
              url: location.href,
              timestamp: Date.now(),
              context: "script-tag"
            }, "*");
            alert(${args});
          })()
        `
        );

        script.textContent = transformedCode;
        script.__processed = true;
        console.log("[XSS-Detector] Script transformed.");
      }
    }
  }

  checkScripts();

  const observer = new MutationObserver(() => checkScripts());
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  return observer;
}

function injectXssHook() {
  return new Promise((resolve, reject) => {
    if (window.__xssHookInstalled || isXssHookLoaded) {
      console.log("XSS hook already installed, skipping...");
      return resolve();
    }

    let timeoutId;
    let installed = false;

    function hookInstalledListener(event) {
      if (
        event.source === window &&
        event.data &&
        event.data.source === "xss-detector" &&
        event.data.type === "HOOK_INSTALLED"
      ) {
        installed = true;
        clearTimeout(timeoutId);
        window.removeEventListener("message", hookInstalledListener);
        isXssHookLoaded = true;
        console.log("XSS hook installation verified");
        resolve();
      }
    }

    window.addEventListener("message", hookInstalledListener);

    timeoutId = setTimeout(() => {
      if (!installed) {
        window.removeEventListener("message", hookInstalledListener);
        reject(new Error("Hook installation timeout"));
      }
    }, 5000);

    console.log("Requesting XSS hook injection");
    try {
      chrome.runtime.sendMessage({ type: "INJECT_XSS_DETECTOR" });
    } catch (error) {
      clearTimeout(timeoutId);
      window.removeEventListener("message", hookInstalledListener);
      reject(error);
    }
  });
}

async function initialize() {
  try {
    if (detectXssInUrl()) {
      console.log("Potential XSS in URL detected.");
    }

    const observer = observeAndTransformScripts();
    await injectXssHook();

    console.log("Initial XSS protection setup complete");

    window.addEventListener("unload", () => observer.disconnect());
  } catch (err) {
    console.error("❌ Error during initialization:", err);
    setTimeout(initialize, 1000);
  }
}

initialize();

const processedMessages = new Set();

window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  const data = event.data;
  if (!data || data.source !== "xss-detector") return;

  console.log("Received message:", data);

  if (data.type === "HOOK_INSTALLED") {
    console.log("XSS hook installation verified (event)");
    return;
  }

  if (data.type === "XSS_EXECUTED") {
    const allowedMethods = ["alert", "prompt", "confirm"];
    if (!allowedMethods.includes(data.method)) return;

    const messageId = `${data.method}-${data.message}-${data.timestamp}`;
    if (processedMessages.has(messageId)) {
      console.log("⏭️ Duplicate message skipped");
      return;
    }

    processedMessages.add(messageId);
    console.log("XSS execution detected:", {
      method: data.method,
      message: data.message,
      url: data.url,
    });

    setTimeout(() => {
      processedMessages.delete(messageId);
    }, 5000);

    const messageToSend = {
      type: "XSS_EXECUTED",
      payload: {
        method: data.method,
        message: data.message,
        url: data.url || window.location.href,
        timestamp: data.timestamp || Date.now(),
      },
    };

    console.log("Sending to background.js:", messageToSend);

    const sendMessageWithRetry = (retryCount = 0) => {
      chrome.runtime.sendMessage(messageToSend, (response) => {
        if (chrome.runtime.lastError) {
          console.warn(
            `❌ Send attempt ${retryCount + 1} failed:`,
            chrome.runtime.lastError.message
          );
          if (retryCount < 2) {
            setTimeout(() => sendMessageWithRetry(retryCount + 1), 1000);
          }
        } else {
          console.log("Message sent successfully");
        }
      });
    };

    sendMessageWithRetry();
  }
});
