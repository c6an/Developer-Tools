(function () {
  console.log("Starting XSS hook installation...");

  if (window.__xssHookInstalled) {
    console.log("Hooks already installed, skipping...");
    return;
  }

  var originals = {
    alert: window.alert,
    prompt: window.prompt,
    confirm: window.confirm,
    eval: window.eval,
  };

  function sendDetection(method, msg, extraInfo = {}) {
    console.log(`XSS Detection - ${method} called with:`, msg);

    const detectionData = {
      source: "xss-detector",
      type: "XSS_EXECUTED",
      method: method,
      message: msg,
      url: window.location.href,
      timestamp: Date.now(),
      ...extraInfo,
    };

    console.log("Sending detection message:", detectionData);
    window.postMessage(detectionData, "*");

    try {
      if (window !== window.top) {
        window.top.postMessage(detectionData, "*");
      }
    } catch (e) {
      console.log("Could not send to parent:", e);
    }
  }

  // Hook the alert function
  window.alert = function (msg) {
    console.log("Alert intercepted:", msg);
    sendDetection("alert", msg, {
      stack: new Error().stack,
      context: "direct-call",
    });
    return originals.alert.apply(this, arguments);
  };

  window.prompt = function (msg) {
    sendDetection("prompt", msg);
    return originals.prompt.apply(this, arguments);
  };

  window.confirm = function (msg) {
    sendDetection("confirm", msg);
    return originals.confirm.apply(this, arguments);
  };

  const originalEval = window.eval;
  window.eval = function (code) {
    if (typeof code === "string") {
      console.log("Eval intercepted:", code);
      if (
        code.includes("alert") ||
        code.includes("prompt") ||
        code.includes("confirm")
      ) {
        sendDetection("eval", code, {
          context: "eval-execution",
        });
      }
    }
    return originals.eval.apply(this, arguments);
  };

  const originalFunction = window.Function;
  window.Function = function () {
    const code = Array.from(arguments).join("");
    if (
      code.includes("alert") ||
      code.includes("prompt") ||
      code.includes("confirm")
    ) {
      console.log("Function constructor intercepted:", code);
      sendDetection("new-function", code, {
        context: "function-constructor",
      });
    }
    return originalFunction.apply(this, arguments);
  };

  window.addEventListener("error", function (event) {
    if (event.message.includes("alert") || event.message.includes("XSS")) {
      console.log("Error event intercepted:", event);
      sendDetection("error", event.message, {
        context: "error-handler",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    }
  });

  window.__xssHookInstalled = true;
  window.postMessage(
    {
      source: "xss-detector",
      type: "HOOK_INSTALLED",
    },
    "*"
  );

  console.log("XSS hooks installed with additional protections");
})();
