// Gemini API 配置
const API_KEY = "AIzaSyAJJSsbPl0enZ2iOd49MQ69ra70JWkX1S8";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

/**
 * 根據用戶的夢幻引薦和願合作行業獲取合作夥伴推薦
 * @param {Object} dreamReferral - 用戶的夢幻引薦信息
 * @param {Array<string>} wishIndustries - 用戶想要合作的行業列表
 * @returns {Promise<Array<Object>>} - 推薦的合作夥伴列表
 */
async function getPartnerRecommendations(dreamReferral, wishIndustries) {
    try {
        // 獲取所有會員數據庫
        const allMembers = getAllMembers();
        
        // 將會員數據庫轉換為字符串，以便納入提示詞
        const memberData = allMembers.map(member => 
            `姓名: ${member.name}, 行業別: ${member.industry}`
        ).join('\n');
        
        // 構建提示詞，包含用戶的夢幻引薦和願合作行業信息，以及會員數據庫
        const prompt = `
        作為一個BNI小組的一對一匹配專家，請根據以下會員信息推薦3個最適合進行一對一會談的夥伴。
        
        會員的夢幻引薦信息：
        - 夢幻引薦人脈：${dreamReferral.people || '未提供'}
        - 夢幻引薦行業：${dreamReferral.industry || '未提供'}
        - 夢幻引薦金額：${dreamReferral.amount ? `${dreamReferral.amount}元` : '未提供'}
        
        會員希望合作的行業：
        ${wishIndustries.map((industry, index) => `- 願合作行業 ${index + 1}：${industry}`).join('\n')}
        
        我們的BNI分會中有以下會員，請只從這些會員中選擇推薦：
        ${memberData}
        
        請根據上述會員的行業別和用戶的需求進行匹配，選出最適合進行一對一會談的3位會員。從我們的會員名單中選擇真實存在的人，而不是虛構的名字。每個推薦需包含：
        1. 推薦夥伴的姓名（必須是上述會員列表中的真實姓名）
        2. 推薦夥伴的行業/專業（與實際會員資料相符）
        3. 詳細說明為什麼應該找此夥伴進行一對一（專業互補性、資源交換價值等）
        4. 這位夥伴可能擁有的潛在客戶名單（基於其行業和專業特點推測）
        
        如果會員的行業別與用戶的夢幻引薦或願合作行業直接相關，優先選擇這些會員。考慮行業之間的互補性和潛在資源交換價值。
        
        重要要求：必須僅返回純 JSON 格式，不帶任何 Markdown 標記如 \`\`\`json 或 \`\`\`。不要添加任何註釋或額外文字。
        
        JSON格式如下：
        [
          {
            "name": "夥伴姓名（必須是實際會員列表中的姓名）",
            "industry": "夥伴行業/專業（必須與會員列表相符）",
            "reason": "為什麼要安排一對一的理由",
            "potentialClients": "夥伴可能擁有的客戶名單描述"
          },
          {
            "name": "夥伴姓名2（必須是實際會員列表中的姓名）",
            "industry": "夥伴行業/專業2（必須與會員列表相符）",
            "reason": "為什麼要安排一對一的理由2",
            "potentialClients": "夥伴可能擁有的客戶名單描述2"
          },
          {
            "name": "夥伴姓名3（必須是實際會員列表中的姓名）",
            "industry": "夥伴行業/專業3（必須與會員列表相符）",
            "reason": "為什麼要安排一對一的理由3",
            "potentialClients": "夥伴可能擁有的客戶名單描述3"
          }
        ]
        `;
        
        // 準備API請求
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.2,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };
        
        // 發送API請求
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });
        
        // 檢查響應
        if (!response.ok) {
            throw new Error(`API響應錯誤: ${response.status} ${response.statusText}`);
        }
        
        // 解析響應
        const data = await response.json();
        
        // 解析生成的內容
        if (data.candidates && data.candidates.length > 0) {
            const text = data.candidates[0].content.parts[0].text;
            console.log('API返回原始文本:', text);
            
            // 清理返回的文本，去除可能的 Markdown 標記
            let cleanedText = text.trim();
            
            // 移除可能的 Markdown JSON 代碼塊標記
            cleanedText = cleanedText.replace(/```json\s*/g, '');
            cleanedText = cleanedText.replace(/```\s*$/g, '');
            
            // 尋找 JSON 數組部分（在 [ 和 ] 之間的內容）
            const jsonRegex = /\[\s*\{[\s\S]*\}\s*\]/g;
            const jsonMatch = cleanedText.match(jsonRegex);
            
            if (jsonMatch) {
                cleanedText = jsonMatch[0];
            }
            
            console.log('清理後的JSON文本:', cleanedText);
            
            // 嘗試解析JSON
            try {
                const recommendations = JSON.parse(cleanedText);
                console.log('成功解析的推薦:', recommendations);
                return recommendations;
            } catch (error) {
                console.error('解析推薦JSON時出錯:', error);
                console.error('無法解析的文本:', cleanedText);
                // 如果仍然無法解析，使用備用推薦
                return generateFallbackRecommendations(dreamReferral, wishIndustries);
            }
        } else {
            console.error('API沒有返回有效推薦');
            return generateFallbackRecommendations(dreamReferral, wishIndustries);
        }
    } catch (error) {
        console.error('獲取推薦時出錯:', error);
        
        // 如果API請求失敗，使用內置會員數據生成推薦
        return generateFallbackRecommendations(dreamReferral, wishIndustries);
    }
}

/**
 * 根據現有會員數據生成備用推薦（當API請求失敗時使用）
 * @param {Object} dreamReferral - 用戶的夢幻引薦信息
 * @param {Array<string>} wishIndustries - 用戶想要合作的行業列表
 * @returns {Array<Object>} - 推薦的合作夥伴列表
 */
function generateFallbackRecommendations(dreamReferral, wishIndustries) {
    // 從數據庫獲取所有會員
    const allDatabaseMembers = getAllMembers();
    console.log('從數據庫獲取會員數量:', allDatabaseMembers.length);
    
    // 定義行業匹配度評分系統
    const industryMatchScores = {
        // 互補行業配對 (行業A與行業B配對時的加分值)
        pairs: {
            "房地產": ["法律服務", "設計印刷", "保險與財務規劃顧問", "商空設計業", "環控設備業"],
            "法律服務": ["會計師", "保險與財務規劃顧問", "保養品業", "房地產"],
            "保險與財務規劃顧問": ["房地產", "法律服務", "會計師", "高端商品或服務"],
            "網路行銷": ["電商相關", "咖啡業", "餐飲業", "商空設計業", "品牌形象設計"],
            "數位行銷": ["電商相關", "品牌形象設計", "影音行銷", "網路行銷"],
            "品牌形象設計": ["設計印刷", "網路行銷", "數位行銷", "電商相關"],
            "設計印刷": ["品牌形象設計", "網路行銷", "電商相關", "房地產"],
            "會計師": ["法律服務", "保險與財務規劃顧問", "高端商品或服務"],
            "商空設計業": ["房地產", "環控設備業", "五金工具業", "水電工程", "油漆工程", "木作裝修"],
            "頭皮.頭療spa顧問": ["髮妝造型教育顧問", "保養品業"],
            "髮妝造型教育顧問": ["頭皮.頭療spa顧問", "保養品業"],
            "保養品業": ["頭皮.頭療spa顧問", "髮妝造型教育顧問"]
        },
        
        // 行業關鍵詞匹配
        keywords: {
            "房地產": ["建築", "裝修", "室內設計", "房屋", "住宅", "土地"],
            "法律服務": ["合約", "法規", "專利", "智財", "訴訟", "律師"],
            "保險": ["理財", "財務", "風險", "保障", "醫療", "投資"],
            "行銷": ["銷售", "品牌", "推廣", "廣告", "宣傳", "市場"],
            "設計": ["創意", "美術", "視覺", "印刷", "包裝", "商標"],
            "健康": ["醫療", "保健", "養生", "運動", "營養", "治療"],
            "教育": ["培訓", "學習", "課程", "輔導", "研習", "教學"]
        }
    };
    
    // 預設的潛在客戶名單映射表（根據行業）
    const industryClientMap = {
        "髮妝造型教育顧問": "美容學校學生、想進修髮型技術的美髮師、婚禮造型需求客戶、專業造型攝影需求客戶",
        "疤痕紋路修復專家": "有肌膚問題的客戶、醫美術後修復需求客戶、想改善皮膚問題的中高收入客戶",
        "成人情趣保健品業": "新婚夫妻、想提升親密關係的伴侶、性健康諮詢需求客戶",
        "體態雕塑": "想改善體態的上班族、產後媽媽、健身愛好者、模特兒、藝人",
        "保養品業": "注重皮膚保養的女性、對抗衰老需求客戶、肌膚問題困擾者、高端美容院",
        "影音行銷": "需要宣傳影片的企業、創業者、實體店家、電商經營者、課程講師",
        "活動整合企劃": "企業活動需求客戶、展覽舉辦單位、公關公司、品牌發表會主辦方",
        "品牌形象設計": "新創企業、品牌升級需求客戶、連鎖商家、專業人士個人品牌建立需求",
        "網路行銷": "實體轉型電商企業、想擴大線上知名度的品牌、社群行銷需求客戶、內容創作者",
        "專業人像攝影": "需要形象照的專業人士、企業主管形象拍攝、婚紗攝影客戶、畢業照需求客戶",
        "中英文主持": "企業活動、婚禮、展覽、頒獎典禮、國際會議主辦單位",
        "花藝設計": "婚禮策劃公司、高級餐廳、飯店、企業活動場地佈置需求客戶、花藝課程學員",
        "海外留學顧問": "計畫出國留學的學生家庭、想進修海外學位的專業人士、國際教育交流機構",
        "頭皮.頭療spa顧問": "頭皮問題困擾者、壓力大的上班族、注重養生保健人士、失眠問題客戶",
        "三高健康管理師": "中年以上有健康問題的人士、企業主管、健康意識高的專業人士、醫療機構",
        "樹化玉": "珠寶收藏家、高端禮品需求客戶、居家藝術品收藏者、企業贈禮需求",
        "遠紅外線照射器材": "注重健康保健的中高齡客戶、運動傷害修復需求者、醫療復健中心、健身中心",
        "財富流教練": "企業主、創業者、專業人士、想改善財務狀況的個人",
        "抗紅外線涼感眼鏡": "戶外運動愛好者、開車族、電子產品重度使用者、時尚眼鏡需求客戶",
        "推拿觸療": "久坐辦公室的上班族、壓力大的企業主管、運動員、慢性疼痛患者",
        "會計師": "企業主、創業者、需要財務規劃的公司、報稅服務需求客戶、財務顧問需求客戶",
        "法律服務業": "企業法務需求、合約審查需求客戶、專利申請需求、訴訟代理需求、不動產交易客戶",
        "保險與財務規劃顧問": "家庭財務規劃需求、退休規劃需求、企業主、高收入專業人士、新婚家庭",
        "Google資訊整合顧問": "需數位轉型的企業、想提升線上曝光度的商家、數據分析需求企業",
        "進口車代表-賓士": "高收入專業人士、企業主管、成功企業家、高端消費者、退休金豐厚的資深經理人",
        "二手車代表": "換車需求家庭、預算有限的年輕客戶、需要增加車輛的小型企業",
        "汽車鍍膜包膜": "新車主、愛車人士、高級車主、注重車輛保養的客戶",
        "資訊科技顧問": "企業資訊系統升級需求、數位轉型企業、資安防護需求客戶、雲端服務需求",
        "單車業": "單車愛好者、鐵人三項運動員、戶外運動愛好者、健身需求客戶",
        "殯葬禮儀業": "家中有年長者的家庭、生命禮儀規劃需求客戶、喪葬服務需求家庭",
        "古物精品代銷業": "古董收藏家、藝術品投資者、高端禮品需求客戶、居家裝飾品需求客戶",
        "法式甜點": "企業下午茶需求、婚禮甜點需求、生日慶祝需求、高端送禮需求客戶",
        "滷味麻辣燙": "企業團膳需求、外送餐飲需求、節慶活動餐飲需求、聚會餐飲需求",
        "冷凍水產食品買賣": "餐飲業者、飯店採購、食品加工廠、大型企業團膳部門",
        "健康餐盒": "健身族群、減重需求客戶、養生保健族群、企業團體訂餐需求",
        "農業生技銷售": "農業相關企業、健康食品需求客戶、有機農產品消費者、生技產業相關公司",
        "咖啡業": "企業辦公室、專業人士辦公室、咖啡愛好者、精品咖啡收藏家",
        "住宅房仲業": "換屋需求家庭、首購族、投資置產需求客戶、企業租賃需求",
        "健康住宅設計": "新成家家庭、有嬰幼兒的家庭、注重健康生活的專業人士、長輩同住家庭",
        "餐廳廚房油污清潔": "餐飲業者、飯店、企業內部餐廳、食品加工廠",
        "環控設備業": "辦公大樓管理處、商場、企業總部、食品加工廠、科技公司",
        "商空設計業": "新開店面的企業、辦公室裝修需求、連鎖店面規劃客戶、展示空間設計需求",
        "窗簾業": "新居入住家庭、辦公室裝修企業、飯店旅館、商業空間",
        "五金工具業": "室內裝修公司、木工、建築工地、DIY愛好者、專業工程公司",
        "彩繪藝術文創工程": "商業空間業主、企業形象牆需求、景點設施管理單位、文創園區",
        "水電工程": "新建案開發商、室內裝修業者、舊屋翻新客戶、商業空間業主",
        "商用空調": "辦公大樓、商場、工廠、餐廳、醫療機構",
        "油漆工程": "新成屋業主、室內裝修公司、舊屋翻新客戶、商業空間業主",
        "木作裝修": "高級住宅業主、辦公室裝修需求、商業空間設計客戶、特殊空間訂製需求",
        "溫泉旅宿業": "企業員工旅遊、家庭旅遊客戶、情侶約會需求、養生度假需求客戶",
        "日本精品雜貨業": "日系品牌愛好者、居家雜貨收藏家、送禮需求客戶、設計師、室內設計公司"
    };
    
    // 獲取最適合用戶的行業關鍵詞（用於後續匹配）
    function getRelevantKeywords(dreamReferral, wishIndustries) {
        const keywords = new Set();
        
        // 從夢幻引薦行業獲取關鍵詞
        if (dreamReferral.industry) {
            // 直接添加夢幻引薦行業關鍵詞
            keywords.add(dreamReferral.industry);
            
            // 檢查關鍵詞表中是否有匹配項
            for (const [key, values] of Object.entries(industryMatchScores.keywords)) {
                if (dreamReferral.industry.includes(key) || values.some(v => dreamReferral.industry.includes(v))) {
                    values.forEach(v => keywords.add(v));
                    keywords.add(key);
                }
            }
        }
        
        // 從願合作行業獲取關鍵詞
        wishIndustries.forEach(industry => {
            if (!industry) return;
            
            keywords.add(industry);
            
            // 檢查關鍵詞表中是否有匹配項
            for (const [key, values] of Object.entries(industryMatchScores.keywords)) {
                if (industry.includes(key) || values.some(v => industry.includes(v))) {
                    values.forEach(v => keywords.add(v));
                    keywords.add(key);
                }
            }
        });
        
        return Array.from(keywords);
    }
    
    // 計算會員與用戶需求的匹配度分數
    function calculateMatchScore(member, dreamReferral, wishIndustries, relevantKeywords) {
        let score = 0;
        
        // 1. 直接匹配願合作行業 (高優先級)
        for (const industry of wishIndustries) {
            if (!industry) continue;
            if (member.industry.includes(industry) || industry.includes(member.industry)) {
                score += 40;
                break;
            }
        }
        
        // 2. 匹配夢幻引薦行業 (中優先級)
        if (dreamReferral.industry && 
            (member.industry.includes(dreamReferral.industry) || 
             dreamReferral.industry.includes(member.industry))) {
            score += 30;
        }
        
        // 3. 互補行業配對 (根據配對表)
        for (const [industry, complementaryIndustries] of Object.entries(industryMatchScores.pairs)) {
            if (member.industry.includes(industry)) {
                // 檢查用戶的夢幻引薦或願合作行業是否與此會員行業互補
                if (dreamReferral.industry && 
                    complementaryIndustries.some(comp => dreamReferral.industry.includes(comp))) {
                    score += 25;
                }
                
                for (const wishIndustry of wishIndustries) {
                    if (wishIndustry && complementaryIndustries.some(comp => wishIndustry.includes(comp))) {
                        score += 20;
                    }
                }
            }
        }
        
        // 4. 關鍵詞匹配 (低優先級)
        for (const keyword of relevantKeywords) {
            if (member.industry.includes(keyword)) {
                score += 5;
            }
        }
        
        return score;
    }
    
    // 獲取潛在客戶描述
    function getPotentialClients(industry) {
        // 嘗試精確匹配
        if (industryClientMap[industry]) {
            return industryClientMap[industry];
        }
        
        // 嘗試部分匹配
        for (const [key, clients] of Object.entries(industryClientMap)) {
            if (industry.includes(key) || key.includes(industry)) {
                return clients;
            }
        }
        
        // 如果沒有匹配，給出通用描述
        return `需要${industry}服務的個人與企業客戶、對${industry}領域有興趣的潛在買家、尋求專業${industry}解決方案的組織`;
    }
    
    // 生成推薦理由
    function generateRecommendationReason(memberIndustry, dreamReferral, wishIndustries) {
        // 檢查是否直接匹配願合作行業
        for (const industry of wishIndustries) {
            if (!industry) continue;
            if (memberIndustry.includes(industry) || industry.includes(memberIndustry)) {
                return `專業與您希望合作的 ${industry} 行業直接相關，透過一對一可深入了解雙方客戶需求，建立互相引薦機制。其專業能夠為您的客戶提供額外價值，同時您也可能認識適合他的潛在客戶。`;
            }
        }
        
        // 檢查是否匹配夢幻引薦行業
        if (dreamReferral.industry && 
            (memberIndustry.includes(dreamReferral.industry) || 
             dreamReferral.industry.includes(memberIndustry))) {
            return `專業與您的夢幻引薦行業 ${dreamReferral.industry} 高度相關，一對一會談可以讓您了解如何更有效地接觸和服務這類客戶，並獲得實質性引薦機會。`;
        }
        
        // 檢查是否有行業互補性
        for (const [industry, complementaryIndustries] of Object.entries(industryMatchScores.pairs)) {
            if (memberIndustry.includes(industry)) {
                // 檢查用戶的夢幻引薦或願合作行業是否與此會員行業互補
                if (dreamReferral.industry && 
                    complementaryIndustries.some(comp => dreamReferral.industry.includes(comp))) {
                    return `雖然行業不同，但${memberIndustry}專業與您的夢幻引薦行業 ${dreamReferral.industry} 有很強的互補性，可以共享客戶資源並建立互惠的業務關係。`;
                }
                
                for (const wishIndustry of wishIndustries) {
                    if (wishIndustry && complementaryIndustries.some(comp => wishIndustry.includes(comp))) {
                        return `${memberIndustry}與您希望合作的${wishIndustry}行業之間存在天然的業務互補性，通過一對一交流可以發掘許多合作機會和交叉推薦的可能性。`;
                    }
                }
            }
        }
        
        // 通用理由
        return `作為${memberIndustry}專業人士，他們可能接觸到廣泛的客戶網絡，透過一對一深入交流您的業務和目標客戶，可以建立互相了解和信任，進而發掘潛在的引薦機會和合作可能。`;
    }
    
    // 開始生成推薦
    try {
        // 從當地會員數據獲取資料
        const memberDataJSON = localStorage.getItem('memberDataTable');
        let localMembers = [];
        
        if (memberDataJSON) {
            try {
                localMembers = JSON.parse(memberDataJSON);
                console.log('從本地存儲載入會員數據:', localMembers.length, '條記錄');
            } catch (error) {
                console.error('解析本地會員數據時出錯:', error);
            }
        }
        
        // 合併會員數據庫與本地數據
        let allMembers = [...allDatabaseMembers];
        
        // 添加本地會員數據中不存在於資料庫的會員
        for (const localMember of localMembers) {
            if (!allMembers.some(m => m.name === localMember.name)) {
                allMembers.push({
                    name: localMember.name,
                    industry: localMember.industry
                });
            }
        }
        
        console.log('合併後總會員數量:', allMembers.length);
        
        // 如果沒有足夠的會員數據，返回默認推薦
        if (allMembers.length < 3) {
            console.log('會員數量不足，使用默認推薦');
            return [
                {
                    name: "張禎娟",
                    industry: "日本精品雜貨業",
                    reason: "專業提供精品雜貨，可討論如何透過高質量生活用品為您的客戶提供更優質的服務體驗，創造加值機會。",
                    potentialClients: "日系品牌愛好者、居家雜貨收藏家、送禮需求客戶、設計師、室內設計公司"
                },
                {
                    name: "林詠儀",
                    industry: "油漆工程",
                    reason: "專業油漆工程服務與多數行業都有交集，特別是任何有實體店面或辦公室的企業，一對一會談可以討論如何為客戶環境提升價值。",
                    potentialClients: "新成屋業主、室內裝修公司、舊屋翻新客戶、商業空間業主"
                },
                {
                    name: "吳岳軒",
                    industry: "影音行銷",
                    reason: "現代各行各業都需要影音行銷來提升品牌形象，透過一對一可以討論如何為您的業務製作吸引人的內容，提升市場曝光度。",
                    potentialClients: "需要宣傳影片的企業、創業者、實體店家、電商經營者、課程講師"
                }
            ];
        }
        
        // 獲取相關關鍵詞
        const relevantKeywords = getRelevantKeywords(dreamReferral, wishIndustries);
        console.log('相關關鍵詞:', relevantKeywords);
        
        // 計算每個會員的匹配分數
        const scoredMembers = allMembers.map(member => ({
            ...member,
            score: calculateMatchScore(member, dreamReferral, wishIndustries, relevantKeywords)
        }));
        
        // 按照分數排序
        scoredMembers.sort((a, b) => b.score - a.score);
        
        // 取前三名作為推薦
        const recommendations = scoredMembers.slice(0, 3).map(member => ({
            name: member.name,
            industry: member.industry,
            reason: generateRecommendationReason(member.industry, dreamReferral, wishIndustries),
            potentialClients: getPotentialClients(member.industry)
        }));
        
        console.log('生成的推薦:', recommendations);
        return recommendations;
        
    } catch (error) {
        console.error('生成備用推薦時發生錯誤:', error);
        
        // 發生錯誤時返回默認推薦
        return [
            {
                name: "張禎娟",
                industry: "日本精品雜貨業",
                reason: "專業提供精品雜貨，可討論客戶交叉引薦的機會，特別是送禮需求和室內裝飾方面的資源共享。",
                potentialClients: "日系品牌愛好者、居家雜貨收藏家、送禮需求客戶、設計師、室內設計公司"
            },
            {
                name: "陳志豪",
                industry: "遠紅外線照射器材",
                reason: "健康產業與各類客戶都有接觸點，一對一會談可以交流如何互相推薦合適的顧客，提升雙方業務。",
                potentialClients: "注重健康保健的中高齡客戶、運動傷害修復需求者、醫療復健中心、健身中心"
            },
            {
                name: "李子萱",
                industry: "中英文主持",
                reason: "主持人接觸各類活動和企業客戶，擁有廣泛人脈，透過一對一可以了解更多潛在合作機會和客戶引薦。",
                potentialClients: "企業活動、婚禮、展覽、頒獎典禮、國際會議主辦單位"
            }
        ];
    }
} 