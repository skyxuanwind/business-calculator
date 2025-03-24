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
    
    // 建立會員數據庫表格
    let memberDataTable = [];
    
    // 保存會員數據到表格數據庫
    function saveToDataTable(data) {
        // 檢查是否已有此會員資料
        const existingIndex = memberDataTable.findIndex(item => item.name === data.name);
        
        if (existingIndex !== -1) {
            // 更新現有會員資料
            memberDataTable[existingIndex] = data;
        } else {
            // 添加新會員資料
            memberDataTable.push(data);
        }
        
        // 保存到本地存儲
        localStorage.setItem('memberDataTable', JSON.stringify(memberDataTable));
        
        // 將保存的數據輸出到控制台（僅供開發查看）
        console.log('已保存會員數據:', data);
        console.log('當前數據庫內容:', memberDataTable);
    }
    
    // 初始化時從本地存儲載入會員數據表
    function loadDataTable() {
        const savedData = localStorage.getItem('memberDataTable');
        if (savedData) {
            try {
                memberDataTable = JSON.parse(savedData);
                console.log('成功載入會員數據表，共有', memberDataTable.length, '條記錄');
            } catch (e) {
                console.error('載入會員數據表時出錯:', e);
                memberDataTable = [];
            }
        }
    }
    
    // 載入數據表
    loadDataTable();
    
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
        
        // 獲取基本輸入值
        const name = document.getElementById('name').value.trim();
        const industry = document.getElementById('industry').value.trim();
        
        // 檢查是否有專業別
        if (!industry) {
            alert("請輸入有效的姓名，以便填充專業別。");
            return;
        }
        
        const yearlyRevenue = parseFloat(document.getElementById('yearlyRevenue').value);
        const bniForecast = parseFloat(document.getElementById('bniForecast').value);
        const avgTransactionAmount = parseFloat(document.getElementById('avgTransactionAmount').value);
        const closingRate = parseFloat(document.getElementById('closingRate').value);
        
        // 獲取個人期望與承諾欄位
        const dreamReferralPeople = document.getElementById('dreamReferralPeople').value.trim();
        const dreamReferralIndustry = document.getElementById('dreamReferralIndustry').value.trim();
        const dreamReferralAmount = parseFloat(document.getElementById('dreamReferralAmount').value) || 0;
        
        const wishIndustry1 = document.getElementById('wishIndustry1').value.trim();
        const wishIndustry2 = document.getElementById('wishIndustry2').value.trim();
        const wishIndustry3 = document.getElementById('wishIndustry3').value.trim();
        const wishIndustry4 = document.getElementById('wishIndustry4').value.trim();
        
        const expectedMembers = parseInt(document.getElementById('expectedMembers').value) || 0;
        const guestInvites = parseInt(document.getElementById('guestInvites').value) || 0;
        const referralsProvided = parseInt(document.getElementById('referralsProvided').value) || 0;
        const oneOnOneMeetings = parseInt(document.getElementById('oneOnOneMeetings').value) || 0;
        const trainingAttendance = parseInt(document.getElementById('trainingAttendance').value) || 0;
        const suggestions = document.getElementById('suggestions').value.trim();
        
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
        
        // 顯示個人期望與承諾欄位的結果
        const dreamReferralText = dreamReferralPeople || dreamReferralIndustry || dreamReferralAmount 
            ? `人脈：${dreamReferralPeople || '未填寫'}，行業別：${dreamReferralIndustry || '未填寫'}，金額：${dreamReferralAmount ? formatCurrency(dreamReferralAmount) : '未填寫'}`
            : '未填寫';
        document.getElementById('result-dreamReferral').textContent = dreamReferralText;
        
        // 顯示想要合作的行業別
        const wishIndustriesDiv = document.getElementById('result-wishIndustries');
        wishIndustriesDiv.innerHTML = '';
        
        if (wishIndustry1 || wishIndustry2 || wishIndustry3 || wishIndustry4) {
            if (wishIndustry1) wishIndustriesDiv.innerHTML += `<p>1. ${wishIndustry1}</p>`;
            if (wishIndustry2) wishIndustriesDiv.innerHTML += `<p>2. ${wishIndustry2}</p>`;
            if (wishIndustry3) wishIndustriesDiv.innerHTML += `<p>3. ${wishIndustry3}</p>`;
            if (wishIndustry4) wishIndustriesDiv.innerHTML += `<p>4. ${wishIndustry4}</p>`;
        } else {
            wishIndustriesDiv.textContent = '未填寫';
        }
        
        document.getElementById('result-expectedMembers').textContent = expectedMembers ? `${expectedMembers} 人` : '未填寫';
        document.getElementById('result-guestInvites').textContent = guestInvites ? `${guestInvites} 人/月` : '未填寫';
        document.getElementById('result-referralsProvided').textContent = referralsProvided ? `${referralsProvided} 單/週` : '未填寫';
        document.getElementById('result-oneOnOneMeetings').textContent = oneOnOneMeetings ? `${oneOnOneMeetings} 次/週` : '未填寫';
        document.getElementById('result-trainingAttendance').textContent = trainingAttendance ? `${trainingAttendance} 場` : '未填寫';
        document.getElementById('result-suggestions').textContent = suggestions || '未填寫';
        
        // 準備要保存的數據
        const memberData = {
            name: name,
            industry: industry,
            yearlyRevenue: yearlyRevenue,
            bniForecast: bniForecast,
            avgTransactionAmount: avgTransactionAmount,
            closingRate: closingRate,
            casesNeeded: casesNeeded,
            contactsNeeded: contactsNeeded,
            yearlyMeetings: yearlyMeetings,
            weeklyMeetings: weeklyMeetings,
            dreamReferral: {
                people: dreamReferralPeople,
                industry: dreamReferralIndustry,
                amount: dreamReferralAmount
            },
            wishIndustries: [
                wishIndustry1,
                wishIndustry2,
                wishIndustry3,
                wishIndustry4
            ].filter(item => item), // 過濾空值
            expectedMembers: expectedMembers,
            commitment: {
                guestInvites: guestInvites,
                referralsProvided: referralsProvided,
                oneOnOneMeetings: oneOnOneMeetings,
                trainingAttendance: trainingAttendance
            },
            suggestions: suggestions,
            timestamp: new Date().toISOString()
        };
        
        // 保存數據到表格數據庫
        saveToDataTable(memberData);
        
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
    
    // 添加導出資料庫功能按鈕
    const exportDbBtn = document.createElement('button');
    exportDbBtn.id = 'exportDbBtn';
    exportDbBtn.className = 'export-db-btn';
    exportDbBtn.textContent = '導出會員資料庫';
    exportDbBtn.addEventListener('click', exportDatabase);
    
    // 插入到重置按鈕之前
    resultsContainer.insertBefore(exportDbBtn, resetBtn);
    
    // 導出資料庫為CSV格式
    function exportDatabase() {
        if (memberDataTable.length === 0) {
            alert('目前沒有資料可導出');
            return;
        }
        
        try {
            // 建立CSV標題行
            let csvContent = "資料時間,姓名,專業別,年營業額,BNI年營業額,每筆交易金額,成交率,必須完成案件數,需報價案件數,每年會議次數,每週會議次數,夢幻引薦人脈,夢幻引薦行業,夢幻引薦金額,願合作行業1,願合作行業2,願合作行業3,願合作行業4,期望會員數,邀請來賓數,提供引薦數,一對一次數,培訓場次,期許與建議\n";
            
            // 添加資料行
            memberDataTable.forEach(member => {
                const row = [
                    new Date(member.timestamp).toLocaleString(),
                    member.name,
                    member.industry,
                    member.yearlyRevenue,
                    member.bniForecast,
                    member.avgTransactionAmount,
                    member.closingRate,
                    member.casesNeeded,
                    member.contactsNeeded,
                    member.yearlyMeetings,
                    member.weeklyMeetings,
                    member.dreamReferral.people || '',
                    member.dreamReferral.industry || '',
                    member.dreamReferral.amount || '',
                    member.wishIndustries[0] || '',
                    member.wishIndustries[1] || '',
                    member.wishIndustries[2] || '',
                    member.wishIndustries[3] || '',
                    member.expectedMembers || '',
                    member.commitment.guestInvites || '',
                    member.commitment.referralsProvided || '',
                    member.commitment.oneOnOneMeetings || '',
                    member.commitment.trainingAttendance || '',
                    (member.suggestions || '').replace(/\n/g, ' ') // 移除換行符以避免CSV格式問題
                ];
                
                // 處理CSV中的逗號和引號
                const processedRow = row.map(field => {
                    // 將所有字段轉為字符串
                    const str = String(field);
                    
                    // 如果字段包含逗號、引號或換行符，則用引號將其包裹
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        // 將引號轉義為兩個引號
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                });
                
                csvContent += processedRow.join(',') + '\n';
            });
            
            // 創建Blob對象和臨時下載鏈接
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            // 設置下載文件名
            link.setAttribute('href', url);
            link.setAttribute('download', `BNI富揚分會數據_${new Date().toLocaleDateString()}.csv`);
            link.style.display = 'none';
            
            // 添加到頁面並觸發點擊
            document.body.appendChild(link);
            link.click();
            
            // 清理
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            alert('資料庫導出成功！');
        } catch (error) {
            console.error('導出資料庫時出錯:', error);
            alert('導出資料時出錯，請稍後再試');
        }
    }
}); 