// result_details.js

// 요소 참조
const rawDataContent = document.getElementById('rawData');
const copyRawBtn = document.querySelector('.raw-data-header .copy-btn');
const actionButtons = document.querySelectorAll('.actions .btn');
const jsonExportBtn = actionButtons[0];
const csvExportBtn = actionButtons[1];
const newScanBtn = document.querySelector('.btn.primary');
const headerActions = document.querySelectorAll('.header-actions .icon-btn');
const shareBtn = headerActions[0];
const printBtn = headerActions[1];
const closeBtn = headerActions[2];

// 일시 메시지 표시 (2초)
const showTemporaryMessage = (message) => {
    const msgEl = document.createElement('div');
    msgEl.textContent = message;
    msgEl.style.position = 'fixed';
    msgEl.style.top = '16px';
    msgEl.style.right = '16px';
    msgEl.style.background = 'rgba(0, 0, 0, 0.7)';
    msgEl.style.color = 'white';
    msgEl.style.padding = '8px 12px';
    msgEl.style.borderRadius = '4px';
    msgEl.style.zIndex = '1000';
    document.body.appendChild(msgEl);
    setTimeout(() => {
        document.body.removeChild(msgEl);
    }, 2000);
};

// 원본 데이터 복사
copyRawBtn.addEventListener('click', () => {
    const rawText = rawDataContent.textContent.trim();
    navigator.clipboard.writeText(rawText).then(() => {
        showTemporaryMessage('원본 데이터 복사 완료');
    }).catch((err) => {
        showTemporaryMessage('복사 실패');
    });
});

// JSON 내보내기
jsonExportBtn.addEventListener('click', () => {
    const result = {
        payloadCode: document.querySelector('.payload-code').textContent.trim(),
        payloadDescription: document.querySelector('.payload-description').textContent.trim(),
        info: Array.from(document.querySelectorAll('.info-item')).reduce((acc, item) => {
            const label = item.querySelector('.info-label').textContent.trim();
            const value = item.querySelector('.info-value').textContent.trim();
            acc[label] = value;
            return acc;
        }, {}),
        rawData: rawDataContent.textContent.trim()
    };
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'xss_scan_result.json';
    link.click();
    URL.revokeObjectURL(url);
});

// CSV 내보내기
csvExportBtn.addEventListener('click', () => {
    const rows = [];
    rows.push(['PAYLOAD CODE', document.querySelector('.payload-code').textContent.trim()]);
    rows.push(['DESCRIPTION', document.querySelector('.payload-description').textContent.trim()]);
    document.querySelectorAll('.info-item').forEach((item) => {
        const label = item.querySelector('.info-label').textContent.trim();
        const value = item.querySelector('.info-value').textContent.trim();
        rows.push([label, value]);
    });
    rows.push(['RAW DATA', rawDataContent.textContent.trim()]);
    const csvContent = rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'xss_scan_result.csv';
    link.click();
    URL.revokeObjectURL(url);
});

// 새 스캔 실행
newScanBtn.addEventListener('click', () => {
    window.location.href = '../popup/popup.html';
});

// 공유 버튼 (URL 복사)
shareBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showTemporaryMessage('URL 복사 완료');
    }).catch(() => {
        showTemporaryMessage('URL 복사 실패');
    });
});

// 인쇄 버튼
printBtn.addEventListener('click', () => {
    window.print();
});

// 닫기 버튼
closeBtn.addEventListener('click', () => {
    window.close();
});