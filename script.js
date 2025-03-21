document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('businessCalculator');
    const resultsContainer = document.getElementById('results');
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
    resultsContainer.insertBefore(downloadContainer, resetBtn);
    
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
                // 在 iOS 上，直接在當前頁面顯示圖片，提供下載說明
                // 創建遮罩層
                const overlay = document.createElement('div');
                overlay.className = 'image-overlay';
                overlay.innerHTML = `
                    <div class="overlay-content">
                        <div class="overlay-header">
                            <h2>您的商務結果圖片</h2>
                            <button class="close-btn">&times;</button>
                        </div>
                        <div class="image-container">
                            <img src="${image}" alt="商務結果">
                        </div>
                        <div class="instructions">
                            <strong>如何儲存到照片：</strong>
                            <ol>
                                <li>長按上方圖片</li>
                                <li>在彈出選單中點選「儲存圖片」</li>
                                <li>圖片將被儲存到您的照片應用程式中</li>
                            </ol>
                        </div>
                    </div>
                `;
                
                // 添加遮罩層到頁面
                document.body.appendChild(overlay);
                
                // 點擊關閉按鈕時移除遮罩層
                const closeBtn = overlay.querySelector('.close-btn');
                closeBtn.addEventListener('click', function() {
                    document.body.removeChild(overlay);
                });
                
                // 點擊遮罩層背景時也移除遮罩層
                overlay.addEventListener('click', function(e) {
                    if (e.target === overlay) {
                        document.body.removeChild(overlay);
                    }
                });
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
                // 在 iOS 上，直接在當前頁面顯示 PDF，提供下載說明
                const pdfOutput = doc.output('bloburl');
                
                // 創建遮罩層
                const overlay = document.createElement('div');
                overlay.className = 'pdf-overlay';
                overlay.innerHTML = `
                    <div class="overlay-content">
                        <div class="overlay-header">
                            <h2>您的商務結果 PDF</h2>
                            <button class="close-btn">&times;</button>
                        </div>
                        <div class="pdf-container">
                            <iframe src="${pdfOutput}" title="商務結果PDF"></iframe>
                        </div>
                        <div class="instructions">
                            <strong>如何儲存 PDF：</strong>點擊 Safari 底部的分享按鈕 <span style="font-size:18px;">⬆️</span>，然後選擇「儲存至檔案」或「iBooks」等選項。
                        </div>
                    </div>
                `;
                
                // 添加遮罩層到頁面
                document.body.appendChild(overlay);
                
                // 點擊關閉按鈕時移除遮罩層
                const closeBtn = overlay.querySelector('.close-btn');
                closeBtn.addEventListener('click', function() {
                    document.body.removeChild(overlay);
                });
                
                // 點擊遮罩層背景時也移除遮罩層
                overlay.addEventListener('click', function(e) {
                    if (e.target === overlay) {
                        document.body.removeChild(overlay);
                    }
                });
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