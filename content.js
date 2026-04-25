(function () {
    'use strict';

    // ============================================================
    // الفكرة:
    // بدلا من استخدام العارض، نقوم بمحاكاة النقر على سهم القائمة المنسدلة 
    // لكل رسالة، ثم ننقر على زر "تنزيل" من القائمة السياقية (Context Menu).
    // هذا يضمن التنزيل النظيف لكافة أنواع الملفات دون فتح العارض.
    // ============================================================

    const fileExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.apk', '.txt', '.csv'];

    function getLang() {
        const htmlLang = document.documentElement.lang || navigator.language;
        const isArabic = htmlLang.toLowerCase().startsWith('ar') || document.documentElement.dir === 'rtl';
        return {
            downloadDirect: isArabic ? "تنزيل مباشر" : "Direct Download",
            downloaded: isArabic ? "تم التنزيل" : "Downloaded"
        };
    }

    // ---- الجزء الأول: التعرف على الملفات واعتراض النقر ----

    function isPdfButton(el) {
        if (!el) return false;
        const role = el.getAttribute('role');
        const tag = el.tagName;
        if (tag !== 'BUTTON' && role !== 'button') return false;
        const text = el.innerText || el.textContent || '';
        return text.includes('PDF') && text.toLowerCase().includes('.pdf');
    }

    function isFileButton(el) {
        if (!el) return false;
        const role = el.getAttribute('role');
        const tag = el.tagName;
        if (tag !== 'BUTTON' && role !== 'button') return false;

        const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
        // استبعاد الأزرار العادية مثل التشغيل والإيقاف
        if (ariaLabel.includes('play') || ariaLabel.includes('تشغيل') ||
            ariaLabel.includes('pause') || ariaLabel.includes('إيقاف') ||
            ariaLabel.includes('صورة') || ariaLabel.includes('image') ||
            ariaLabel.includes('sticker') || ariaLabel.includes('ملصق')) return false;

        const text = (el.innerText || el.textContent || '').toLowerCase();
        return fileExtensions.some(ext => text.includes(ext)) || isPdfButton(el);
    }

    // دالة تغيير شكل الزر بعد التنزيل
    function setButtonDownloadedState(dlBtn) {
        if (!dlBtn) return;
        dlBtn.style.backgroundColor = '#3498db'; // أزرق
        dlBtn.dataset.downloaded = 'true';
        dlBtn.onmouseover = () => dlBtn.style.backgroundColor = '#2980b9';
        dlBtn.onmouseout = () => dlBtn.style.backgroundColor = '#3498db';
        dlBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            <span>${getLang().downloaded}</span>
        `;
    }

    // ---- الجزء الثاني: منطق التنزيل من القائمة السياقية (Context Menu) ----

    function downloadViaContextMenu(fileBtn) {
        // البحث عن فقاعة الرسالة التي تحتوي على الملف
        let messageEl = fileBtn.closest('[data-id]') || fileBtn.closest('[role="row"]');
        if (!messageEl) {
            let current = fileBtn;
            while (current && current !== document.body) {
                if (current.querySelector('[data-testid="icon-down-context"], [aria-label="Context menu"], [aria-label="قائمة السياق"]')) {
                    messageEl = current;
                    break;
                }
                current = current.parentElement;
            }
        }

        if (!messageEl) {
            // كبديل لو فشلنا، نضغط الملف كالمعتاد
            fileBtn.dataset.ignoreClick = 'true';
            fileBtn.click();
            return;
        }

        // إرسال حدث تمرير الماوس لأن سهم القائمة قد يكون مخفياً
        messageEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
        messageEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));

        setTimeout(() => {
            let contextArrow = messageEl.querySelector('[data-testid="icon-down-context"], [aria-label="Context menu"], [aria-label="قائمة السياق"]');
            if (contextArrow) {
                // فتح القائمة
                contextArrow.click();

                let attempts = 0;
                const interval = setInterval(() => {
                    attempts++;
                    if (attempts > 20) { // بعد ثانية، نغلق إن لم نجد التنزيل
                        clearInterval(interval);
                        document.body.click(); // إغلاق القائمة
                        return;
                    }

                    // القائمة تفتح كعنصر منفصل [role="menu"]
                    const menus = document.querySelectorAll('[role="menu"]');
                    for (const menu of menus) {
                        const dlBtn = menu.querySelector('button[aria-label="Download"], button[aria-label="تنزيل"], li[data-testid="mi-download"]');
                        if (dlBtn) {
                            clearInterval(interval);
                            dlBtn.click();
                            return;
                        }
                    }
                }, 50);
            } else {
                // بديل لو لم نجد السهم
                fileBtn.dataset.ignoreClick = 'true';
                fileBtn.click();
            }
        }, 50); // انتظار 50 ملي ثانية ليظهر السهم بعد الـ mouseover
    }

    // اعتراض النقر اليدوي على بطاقة PDF أو غيرها (إن استلزم)
    document.addEventListener('click', function (e) {
        let target = e.target;

        while (target && target !== document.body) {
            if (isPdfButton(target)) {
                if (target.dataset.ignoreClick) {
                    delete target.dataset.ignoreClick;
                    return;
                }

                e.stopPropagation();
                e.preventDefault();

                // تحويل زر التنزيل المرافق إلى الحالة الزرقاء (تم التنزيل)
                const parent = target.parentElement;
                if (parent) {
                    const customBtn = parent.querySelector('.custom-wa-dl-btn');
                    setButtonDownloadedState(customBtn);
                }

                // التنفيذ عبر القائمة المنسدلة
                downloadViaContextMenu(target);
                return;
            }
            target = target.parentElement;
        }
    }, true);


    // ---- الجزء الثالث: إضافة زر التنزيل بجوار كل ملف ----

    function injectDownloadButtons() {
        const buttons = document.querySelectorAll('button, div[role="button"]');
        for (const btn of buttons) {
            if (btn.dataset.hasCustomDl) continue;

            if (isFileButton(btn)) {
                btn.dataset.hasCustomDl = 'true';

                const dlBtn = document.createElement('button');
                dlBtn.className = 'custom-wa-dl-btn';
                dlBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    <span>${getLang().downloadDirect}</span>
                `;
                dlBtn.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    background-color: #00a884;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 8px 12px;
                    margin-top: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: bold;
                    width: 100%;
                    box-sizing: border-box;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    transition: all 0.2s ease-in-out;
                `;

                dlBtn.onmouseover = () => dlBtn.style.backgroundColor = '#008f6f';
                dlBtn.onmouseout = () => dlBtn.style.backgroundColor = '#00a884';

                dlBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (dlBtn.disabled) return;

                    // أنيميشن بسيط للضغط
                    dlBtn.style.transform = 'scale(0.95)';
                    setTimeout(() => { dlBtn.style.transform = 'scale(1)'; }, 150);

                    dlBtn.disabled = true;
                    setTimeout(() => { dlBtn.disabled = false; }, 1500);

                    // تحويل الزر للون الأزرق للإشارة إلى اكتمال التنزيل
                    setTimeout(() => { setButtonDownloadedState(dlBtn); }, 500);

                    // استخدام طريقة القائمة المنسدلة للتنزيل لجميع الملفات
                    downloadViaContextMenu(btn);
                };

                const parent = btn.parentElement;
                if (parent) {
                    parent.insertBefore(dlBtn, btn.nextSibling);
                }
            }
        }
    }

    // ---- الجزء الرابع: مراقبة التغييرات في واتساب ----

    const observer = new MutationObserver(function (mutations) {
        let shouldInject = false;

        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue;
                shouldInject = true;
            }
        }

        if (shouldInject) {
            injectDownloadButtons();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    setInterval(injectDownloadButtons, 2000);

    console.log('[WA PDF Downloader] تم تفعيل الإضافة وتحديثها لتعمل مع القائمة السياقية ✓');
})();