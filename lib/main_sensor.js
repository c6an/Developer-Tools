let html_capture = function() {
    let html = document.documentElement.outerHTML;
    let url  = window.location.href;
    chrome.runtime.sendMessage({
        type    : "HTML_CAPTURED",
        payload : { url, html }
    });
}


html_capture();


(function spa_interceptor() {
    let originalPush = history.pushState;
    let originalReplace = history.replaceState;

    history.pushState = function(...args) {
        originalPush.apply(this, args);
        setTimeout(html_capture, 500);
    };

    history.replaceState = function(...args) {
        originalReplace.apply(this, args);
        setTimeout(html_capture, 500);
    };

    window.addEventListener("popstate", () => setTimeout(html_capture, 500));
})();