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
        const storedText = localStorage.getItem('wa_pdf_dl_text');
        const htmlLang = (document.documentElement.lang || navigator.language || '').toLowerCase();

        let texts = {};
        if (htmlLang.startsWith('ar') || document.documentElement.dir === 'rtl') {
            texts = { downloadDirect: "تنزيل مباشر", downloaded: "تم التنزيل" };
        } else if (htmlLang.startsWith('es')) {
            texts = { downloadDirect: "Descarga directa", downloaded: "Descargado" };
        } else if (htmlLang.startsWith('pt')) {
            texts = { downloadDirect: "Baixar Direto", downloaded: "Baixado" };
        } else if (htmlLang.startsWith('hi')) {
            texts = { downloadDirect: "सीधा डाउनलोड", downloaded: "डाउनलोड हो गया" };
        } else if (htmlLang.startsWith('fr')) {
            texts = { downloadDirect: "Téléchargement direct", downloaded: "Téléchargé" };
        } else if (htmlLang.startsWith('de')) {
            texts = { downloadDirect: "Direkter Download", downloaded: "Heruntergeladen" };
        } else if (htmlLang.startsWith('it')) {
            texts = { downloadDirect: "Download diretto", downloaded: "Scaricato" };
        } else if (htmlLang.startsWith('id')) {
            texts = { downloadDirect: "Unduhan Langsung", downloaded: "Telah Diunduh" };
        } else if (htmlLang.startsWith('ru')) {
            texts = { downloadDirect: "Прямое скачивание", downloaded: "Скачано" };
        } else if (htmlLang.startsWith('tr')) {
            texts = { downloadDirect: "Doğrudan İndir", downloaded: "İndirildi" };
        } else if (htmlLang.startsWith('nl')) {
            texts = { downloadDirect: "Directe download", downloaded: "Gedownload" };
        } else if (htmlLang.startsWith('pl')) {
            texts = { downloadDirect: "Pobieranie bezpośrednie", downloaded: "Pobrano" };
        } else if (htmlLang.startsWith('zh')) {
            texts = { downloadDirect: "直接下载", downloaded: "已下载" };
        } else if (htmlLang.startsWith('ja')) {
            texts = { downloadDirect: "直接ダウンロード", downloaded: "ダウンロード済み" };
        } else if (htmlLang.startsWith('ko')) {
            texts = { downloadDirect: "직접 다운로드", downloaded: "다운로드 완료" };
        } else if (htmlLang.startsWith('ms')) {
            texts = { downloadDirect: "Muat Turun Terus", downloaded: "Telah Dimuat Turun" };
        } else if (htmlLang.startsWith('vi')) {
            texts = { downloadDirect: "Tải xuống trực tiếp", downloaded: "Đã tải xuống" };
        } else {
            texts = { downloadDirect: "Direct Download", downloaded: "Downloaded" };
        }

        if (storedText) {
            texts.downloadDirect = storedText;
            texts.downloaded = storedText + " ✓";
        }

        return texts;
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
        // استبعاد الأزرار العادية بمختلف اللغات
        const ignoredKeywords = [
            'play', 'تشغيل', 'reproduzir', 'tocar', 'reproducir', 'चलाएं', 'lire', 'abspielen', 'riproduci', 'putar', 'воспроизвести', 'oynat', 'afspelen', 'odtwórz', '播放', '再生', '재생', 'mainkan', 'phát',
            'pause', 'إيقاف', 'pausar', 'रोकें', 'anhalten', 'pausa', 'jeda', 'пауза', 'duraklat', 'pauze', 'wstrzymaj', '暂停', '暫停', '一時停止', '일시 정지', 'tạm dừng',
            'image', 'صورة', 'imagem', 'foto', 'imagen', 'फ़ोटो', 'चित्र', 'bild', 'immagine', 'gambar', 'изображение', 'fotoğraf', 'resim', 'afbeelding', 'obraz', '图片', '照片', '画像', '사진', 'imej', 'hình ảnh',
            'sticker', 'ملصق', 'figurinha', 'autocolante', 'pegatina', 'स्टिकर', 'autocollant', 'aufkleber', 'adesivo', 'stiker', 'стикер', 'çıkartma', 'naklejka', '贴纸', 'ステッカー', '스티커', 'pelekat', 'nhãn dán'
        ];
        if (ignoredKeywords.some(keyword => ariaLabel.includes(keyword))) return false;

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
        const contextArrowSelector = '[data-testid="icon-down-context"], [aria-label="Context menu"], [aria-label="قائمة السياق"], [aria-label="Menú contextual"], [aria-label="Opciones de mensaje"], [aria-label="Menu de contexto"], [aria-label="Opções da mensagem"], [aria-label="संदेश विकल्प"]';

        // البحث عن فقاعة الرسالة التي تحتوي على الملف
        let messageEl = fileBtn.closest('[data-id]') || fileBtn.closest('[role="row"]');
        if (!messageEl) {
            let current = fileBtn;
            while (current && current !== document.body) {
                if (current.querySelector(contextArrowSelector)) {
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
            let contextArrow = messageEl.querySelector(contextArrowSelector);
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
                        // 1. البحث باستخدام data-testid (المعيار الأساسي)
                        let dlBtn = menu.querySelector('li[data-testid="mi-download"]');

                        // 2. البحث باستخدام أيقونة التنزيل (تدعم جميع اللغات بفضل ic-download)
                        if (!dlBtn) {
                            const svgs = menu.querySelectorAll('svg');
                            for (const svg of svgs) {
                                const title = svg.querySelector('title');
                                if (title && title.textContent === 'ic-download') {
                                    // العثور على العنصر القابل للنقر (الأب)
                                    dlBtn = svg.closest('li, [role="menuitem"], button, div[role="button"]') || svg.parentElement;
                                    break;
                                }
                            }
                        }

                        // 3. طريقة احتياطية أخيرة بالنصوص
                        if (!dlBtn) {
                            const fallbackSelector = 'button[aria-label="Download"], button[aria-label="تنزيل"], button[aria-label="Baixar"], button[aria-label="Descargar"], button[aria-label="डाउनलोड"], button[aria-label="डाउनलोड करें"], button[aria-label="Télécharger"], button[aria-label="Herunterladen"], button[aria-label="Scarica"], button[aria-label="Unduh"], button[aria-label="Скачать"], button[aria-label="İndir"], button[aria-label="Downloaden"], button[aria-label="Pobierz"], button[aria-label="下载"], button[aria-label="下載"], button[aria-label="ダウンロード"], button[aria-label="다운로드"], button[aria-label="Muat turun"], button[aria-label="Tải xuống"]';
                            dlBtn = menu.querySelector(fallbackSelector);
                        }

                        if (dlBtn) {
                            clearInterval(interval);

                            // التعلم الذاتي للغة: استخراج نص زر التنزيل وحفظه
                            try {
                                let btnText = dlBtn.innerText || dlBtn.textContent || '';
                                btnText = btnText.replace(/ic-download/gi, '').trim();
                                if (btnText && btnText.length > 1 && btnText.length < 30) {
                                    if (localStorage.getItem('wa_pdf_dl_text') !== btnText) {
                                        localStorage.setItem('wa_pdf_dl_text', btnText);
                                        // التحديث الفوري لجميع الأزرار في الصفحة
                                        document.querySelectorAll('.custom-wa-dl-btn').forEach(btn => {
                                            const span = btn.querySelector('span');
                                            if (span) {
                                                span.textContent = btn.dataset.downloaded === 'true' ? (btnText + ' ✓') : btnText;
                                            }
                                        });
                                    }
                                }
                            } catch (e) { }

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

            // تجاهل الأزرار الموجودة داخل رسائل مقتبسة (ردود) أو داخل لوحة الرد، وكذلك القائمة الجانبية للمستندات
            if (btn.closest('[data-testid="quoted-message"]') ||
                btn.closest('[data-testid="popup_panel"]') ||
                btn.closest('[data-testid="drawer-right"]')) {
                continue;
            }

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
