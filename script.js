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
}); 