document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('businessCalculator');
    const resultsContainer = document.getElementById('results');
    const printBtn = document.getElementById('printBtn');
    const resetBtn = document.getElementById('resetBtn');
    const nameInput = document.getElementById('name');
    const industryInput = document.getElementById('industry');
    const partnersContainer = document.getElementById('partners-container');
    const partnersLoading = document.getElementById('partners-loading');
    
    // 常量
    const REFERRALS_PER_MEETING = 1.5; // 每次一对一産生引薦單數
    const WEEKS_PER_YEAR = 50; // 每年的工作周數
    
    // 添加下載按鈕
    const downloadContainer = document.createElement('div');
    downloadContainer.className = 'download-buttons';
    downloadContainer.innerHTML = `
        <button id="downloadImageBtn" class="download-btn image-btn">下載結果圖片</button>
        <button id="downloadPdfBtn" class="download-btn pdf-btn">下載結果PDF</button>
    `;
    resultsContainer.insertBefore(downloadContainer, printBtn);
    
    const downloadImageBtn = document.getElementById('downloadImageBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    
    // 姓名輸入事件 - 自動填充專業別
    nameInput.addEventListener('blur', function() {
        const name = nameInput.value.trim();
        if (name) {
            const industry = findIndustryByName(name);
            industryInput.value = industry;
            
            if (!industry) {
                alert("未找到此姓名對應的專業別，請確認姓名是否正確。");
            }
        } else {
            industryInput.value = "";
        }
    });
    
    // 格式化金額的函數（添加千位分隔符）
    function formatCurrency(amount) {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: 'TWD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace('NT$', 'NT$ ');
    }
    
    // 格式化百分比
    function formatPercent(value) {
        return value + '%';
    }
    
    // 渲染推薦夥伴
    function renderPartners(partners) {
        partnersContainer.innerHTML = '';
        
        partners.forEach(partner => {
            const partnerCard = document.createElement('div');
            partnerCard.className = 'partner-card';
            
            partnerCard.innerHTML = `
                <div class="partner-header">
                    <span class="partner-name">${partner.name}</span>
                    <span class="partner-industry">${partner.industry}</span>
                </div>
                <div class="partner-content">
                    <div class="partner-section">
                        <h4>推薦原因</h4>
                        <p class="partner-reason">${partner.reason}</p>
                    </div>
                    <div class="partner-section">
                        <h4>可能的共同客戶</h4>
                        <p class="partner-clients">${partner.potentialClients}</p>
                    </div>
                    <div class="partner-section">
                        <h4>合作機會</h4>
                        <p class="partner-opportunities">${partner.collaborationOpportunities}</p>
                    </div>
                </div>
            `;
            
            partnersContainer.appendChild(partnerCard);
        });
        
        // 隱藏加載動畫，顯示結果
        partnersLoading.classList.add('hidden');
        partnersContainer.classList.remove('hidden');
    }
    
    // 獲取並顯示推薦夥伴
    async function loadPartnerRecommendations(userName, userIndustry) {
        try {
            // 顯示加載動畫
            partnersLoading.classList.remove('hidden');
            partnersContainer.classList.add('hidden');
            
            // 獲取推薦
            const recommendations = await getPartnerRecommendations(userName, userIndustry);
            
            // 渲染推薦
            renderPartners(recommendations);
        } catch (error) {
            console.error('載入推薦夥伴時出錯:', error);
            partnersLoading.classList.add('hidden');
            
            // 顯示錯誤信息
            partnersContainer.innerHTML = `
                <div class="error-message">
                    <p>無法載入推薦夥伴。請稍後再試。</p>
                </div>
            `;
            partnersContainer.classList.remove('hidden');
        }
    }
    
    // 處理表單提交
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 獲取輸入值
        const name = document.getElementById('name').value;
        const industry = document.getElementById('industry').value;
        
        // 檢查是否有專業別
        if (!industry) {
            alert("請輸入有效的姓名，以便填充專業別。");
            return;
        }
        
        const yearlyRevenue = parseFloat(document.getElementById('yearlyRevenue').value);
        const bniForecast = parseFloat(document.getElementById('bniForecast').value);
        const avgTransactionAmount = parseFloat(document.getElementById('avgTransactionAmount').value);
        const closingRate = parseFloat(document.getElementById('closingRate').value);
        
        // 計算結果
        // 6. 必須完成的案件數 = 預計BNI年營業額 ÷ 每筆交易平均金額
        const casesNeeded = Math.ceil(bniForecast / avgTransactionAmount);
        
        // 8. 報價或接觸案數 = 必須完成的案件數 ÷ 成交率
        const contactsNeeded = Math.ceil(casesNeeded / (closingRate / 100));
        
        // 9. 每次一對一産生引薦單數（固定值 1.5）
        
        // 10. 每年一對一次數 = 報價或接觸案數 ÷ 每次一對一産生引薦單數
        const yearlyMeetings = Math.ceil(contactsNeeded / REFERRALS_PER_MEETING);
        
        // 11. 每週一對一次數 = 每年一對一次數 ÷ 50
        const weeklyMeetings = Math.ceil(yearlyMeetings / WEEKS_PER_YEAR * 10) / 10;
        
        // 顯示結果
        document.getElementById('result-name').textContent = name;
        document.getElementById('result-industry').textContent = industry;
        document.getElementById('result-yearlyRevenue').textContent = formatCurrency(yearlyRevenue);
        document.getElementById('result-bniForecast').textContent = formatCurrency(bniForecast);
        document.getElementById('result-avgTransactionAmount').textContent = formatCurrency(avgTransactionAmount);
        document.getElementById('result-casesNeeded').textContent = casesNeeded;
        document.getElementById('result-closingRate').textContent = formatPercent(closingRate);
        document.getElementById('result-contactsNeeded').textContent = `${contactsNeeded} 個案件`;
        document.getElementById('result-referralsPerMeeting').textContent = `${REFERRALS_PER_MEETING} 個引薦`;
        document.getElementById('result-yearlyMeetings').textContent = `${yearlyMeetings} 次會議`;
        document.getElementById('result-weeklyMeetings').textContent = `${weeklyMeetings} 次會議`;
        
        // 顯示結果容器
        resultsContainer.classList.remove('hidden');
        
        // 獲取推薦夥伴
        await loadPartnerRecommendations(name, industry);
        
        // 滾動到結果區域
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    });
    
    // 打印結果
    printBtn.addEventListener('click', function() {
        window.print();
    });
    
    // 重置計算
    resetBtn.addEventListener('click', function() {
        form.reset();
        resultsContainer.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // 下載圖片功能
    async function downloadAsImage() {
        try {
            // 創建一個新的結果容器用於截圖
            const tempContainer = resultsContainer.cloneNode(true);
            tempContainer.style.padding = '20px';
            tempContainer.style.background = 'white';
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.width = '100%';
            tempContainer.style.maxWidth = '800px';
            
            // 移除按鈕
            const buttons = tempContainer.querySelectorAll('button');
            buttons.forEach(button => button.remove());
            
            document.body.appendChild(tempContainer);
            
            // 使用 html2canvas 生成圖片
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            
            // 移除臨時容器
            document.body.removeChild(tempContainer);
            
            // 生成圖片
            const image = canvas.toDataURL('image/png');
            
            // 檢測是否為 iOS 設備
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            if (isIOS) {
                // 在 iOS 上，創建一個新頁面並顯示圖片
                // 用戶可以長按圖片並選擇"儲存圖片"
                const newTab = window.open();
                if (newTab) {
                    const fileName = `商務結果_${nameInput.value}_${new Date().toLocaleDateString()}.png`;
                    newTab.document.write(`
                        <html>
                            <head>
                                <title>${fileName}</title>
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <style>
                                    body {
                                        margin: 0;
                                        padding: 20px;
                                        text-align: center;
                                        font-family: Arial, sans-serif;
                                        background-color: #f8f9fa;
                                    }
                                    h2 {
                                        margin-bottom: 20px;
                                        color: #1a73e8;
                                    }
                                    img {
                                        max-width: 100%;
                                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                                        border-radius: 8px;
                                    }
                                    .instructions {
                                        margin-top: 20px;
                                        padding: 15px;
                                        background-color: #e8f0fe;
                                        border-radius: 8px;
                                        text-align: left;
                                        font-size: 14px;
                                        color: #444;
                                        line-height: 1.6;
                                    }
                                </style>
                            </head>
                            <body>
                                <h2>您的商務結果圖片</h2>
                                <img src="${image}" alt="商務結果">
                                <div class="instructions">
                                    <strong>如何儲存到照片：</strong>
                                    <ol>
                                        <li>長按上方圖片</li>
                                        <li>在彈出選單中點選「儲存圖片」</li>
                                        <li>圖片將被儲存到您的照片應用程式中</li>
                                    </ol>
                                </div>
                            </body>
                        </html>
                    `);
                } else {
                    alert('無法開啟新視窗。請檢查您的瀏覽器設定，或嘗試使用其他瀏覽器。');
                }
            } else {
                // 在非 iOS 設備上繼續使用原來的下載方式
                const link = document.createElement('a');
                const fileName = `商務結果_${nameInput.value}_${new Date().toLocaleDateString()}.png`;
                link.download = fileName;
                link.href = image;
                link.click();
            }
        } catch (error) {
            console.error('生成圖片時出錯:', error);
            alert('生成圖片時出錯，請稍後再試');
        }
    }
    
    // 下載PDF功能
    async function downloadAsPdf() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'pt', 'a4');
            
            // 創建臨時容器
            const tempContainer = resultsContainer.cloneNode(true);
            tempContainer.style.padding = '20px';
            tempContainer.style.width = '800px';
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            
            // 移除按鈕
            const buttons = tempContainer.querySelectorAll('button');
            buttons.forEach(button => button.remove());
            
            document.body.appendChild(tempContainer);
            
            // 轉換為圖片
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            
            // 移除臨時容器
            document.body.removeChild(tempContainer);
            
            // 將圖片添加到PDF
            const imgData = canvas.toDataURL('image/png');
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            // 檢測是否為 iOS 設備
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            const fileName = `商務結果_${nameInput.value}_${new Date().toLocaleDateString()}.pdf`;
            
            if (isIOS) {
                // 在 iOS 上，直接在新頁面中打開 PDF，用戶可以使用分享功能儲存
                const pdfOutput = doc.output('bloburl');
                const newTab = window.open();
                if (newTab) {
                    newTab.document.write(`
                        <html>
                            <head>
                                <title>${fileName}</title>
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <style>
                                    body {
                                        margin: 0;
                                        padding: 0;
                                        height: 100vh;
                                        display: flex;
                                        flex-direction: column;
                                        font-family: Arial, sans-serif;
                                    }
                                    .header {
                                        padding: 15px;
                                        background-color: #f8f9fa;
                                        text-align: center;
                                        border-bottom: 1px solid #ddd;
                                    }
                                    h2 {
                                        margin: 0;
                                        color: #1a73e8;
                                        font-size: 18px;
                                    }
                                    .instructions {
                                        padding: 10px 15px;
                                        background-color: #e8f0fe;
                                        font-size: 14px;
                                        color: #444;
                                        line-height: 1.5;
                                    }
                                    .pdf-container {
                                        flex-grow: 1;
                                        width: 100%;
                                    }
                                    iframe {
                                        width: 100%;
                                        height: 100%;
                                        border: none;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="header">
                                    <h2>您的商務結果 PDF</h2>
                                </div>
                                <div class="instructions">
                                    <strong>如何儲存 PDF：</strong>點擊 Safari 底部的分享按鈕 <span style="font-size:18px;">⬆️</span>，然後選擇「儲存至檔案」或「iBooks」等選項。
                                </div>
                                <div class="pdf-container">
                                    <iframe src="${pdfOutput}"></iframe>
                                </div>
                            </body>
                        </html>
                    `);
                } else {
                    alert('無法開啟新視窗。請檢查您的瀏覽器設定，或嘗試使用其他瀏覽器。');
                }
            } else {
                // 在非 iOS 設備上繼續使用原來的下載方式
                doc.save(fileName);
            }
        } catch (error) {
            console.error('生成PDF時出錯:', error);
            alert('生成PDF時出錯，請稍後再試');
        }
    }
    
    // 添加下載按鈕事件監聽器
    downloadImageBtn.addEventListener('click', downloadAsImage);
    downloadPdfBtn.addEventListener('click', downloadAsPdf);
}); 