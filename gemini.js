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
        // 構建提示詞，包含用戶的夢幻引薦和願合作行業信息
        const prompt = `
        作為一個BNI小組的一對一匹配專家，請根據以下會員信息推薦3個最適合進行一對一會談的夥伴。
        
        會員的夢幻引薦信息：
        - 夢幻引薦人脈：${dreamReferral.people || '未提供'}
        - 夢幻引薦行業：${dreamReferral.industry || '未提供'}
        - 夢幻引薦金額：${dreamReferral.amount ? `${dreamReferral.amount}元` : '未提供'}
        
        會員希望合作的行業：
        ${wishIndustries.map((industry, index) => `- 願合作行業 ${index + 1}：${industry}`).join('\n')}
        
        分析這位會員的需求後，請推薦3個最適合一對一會談的夥伴。每個推薦需包含：
        1. 推薦夥伴的名稱
        2. 推薦夥伴的行業/專業
        3. 詳細說明為什麼應該找此夥伴進行一對一（專業互補性、資源交換價值等）
        4. 這位夥伴可能擁有的潛在客戶名單（基於其行業和專業特點推測）
        
        重要要求：必須僅返回純 JSON 格式，不帶任何 Markdown 標記如 \`\`\`json 或 \`\`\`。不要添加任何註釋或額外文字。
        
        JSON格式如下：
        [
          {
            "name": "夥伴名稱",
            "industry": "夥伴行業/專業",
            "reason": "為什麼要安排一對一的理由",
            "potentialClients": "夥伴可能擁有的客戶名單描述"
          },
          {
            "name": "夥伴名稱2",
            "industry": "夥伴行業/專業2",
            "reason": "為什麼要安排一對一的理由2",
            "potentialClients": "夥伴可能擁有的客戶名單描述2"
          },
          {
            "name": "夥伴名稱3",
            "industry": "夥伴行業/專業3",
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
    // 獲取本地存儲的會員數據
    const memberDataJSON = localStorage.getItem('memberDataTable');
    let members = [];
    
    if (memberDataJSON) {
        try {
            members = JSON.parse(memberDataJSON);
        } catch (error) {
            console.error('解析本地會員數據時出錯:', error);
        }
    }
    
    // 如果沒有足夠的會員數據，返回默認推薦
    if (members.length < 3) {
        return [
            {
                name: "張禎娟",
                industry: "金融保險",
                reason: "專業提供全方位金融保險規劃，可討論您的客戶風險管理需求，為您客戶提供保障方案。",
                potentialClients: "高資產家庭、企業主、需要健康與退休規劃的專業人士、新婚家庭、有子女教育需求的父母。"
            },
            {
                name: "林世傑",
                industry: "設計印刷",
                reason: "可討論您客戶的品牌形象需求，提供印刷品設計解決方案，共享潛在商機。",
                potentialClients: "需要更新品牌形象的企業、籌備活動需要印刷品的組織、新創公司、零售商家。"
            },
            {
                name: "吳逸凡",
                industry: "數位行銷",
                reason: "分享數位行銷趨勢與客戶開發策略，討論如何互相引薦合適客戶增加業務量。",
                potentialClients: "想提升線上能見度的企業、電商業者、服務業專業人士、需要提升社群經營效果的品牌。"
            }
        ];
    }
    
    // 根據願合作行業和夢幻引薦行業篩選合適的會員
    let recommendations = [];
    
    // 預設的潛在客戶名單映射表（根據行業）
    const industryClientMap = {
        "金融保險": "高資產家庭、企業主、專業人士、新婚家庭、退休規劃人士",
        "設計印刷": "品牌企業、零售商家、餐飲業者、活動策劃公司、新創公司",
        "數位行銷": "傳統產業轉型企業、電商、服務業專業人士、品牌公司",
        "房地產": "投資者、首購族、換屋家庭、企業擴展需求客戶",
        "法律服務": "企業主、新創公司、有財產規劃需求的家庭、國際貿易商",
        "餐飲美食": "公司行號、活動主辦單位、家庭聚會需求、節慶送禮客戶",
        "教育培訓": "家有學齡兒童的父母、專業進修人士、企業培訓需求",
        "健康醫療": "養生保健需求族群、銀髮族、慢性病患者家庭、追求健康生活的專業人士",
        "旅遊服務": "企業獎勵旅遊需求、家庭旅遊規劃、蜜月旅行客戶、退休旅遊族群",
        "美容美髮": "專業形象需求人士、婚禮相關客戶、時尚關注者、社交活動頻繁人士"
    };
    
    // 獲取潛在客戶描述
    function getPotentialClients(industry) {
        // 嘗試從映射表獲取
        let clients = industryClientMap[industry];
        
        // 如果映射表中沒有，給出通用描述
        if (!clients) {
            // 從行業名稱推測可能的客戶
            clients = `需要${industry}服務的個人與企業客戶、對${industry}領域有興趣的潛在買家`;
        }
        
        return clients;
    }
    
    // 首先嘗試匹配願合作行業
    for (const industry of wishIndustries) {
        if (!industry) continue;
        
        const matchingMembers = members.filter(member => 
            member.industry && member.industry.includes(industry)
        );
        
        for (const member of matchingMembers) {
            if (!recommendations.some(rec => rec.name === member.name)) {
                recommendations.push({
                    name: member.name,
                    industry: member.industry,
                    reason: `專業與您希望合作的 ${industry} 行業直接相關，透過一對一可深入了解雙方客戶需求，建立互相引薦機制。`,
                    potentialClients: getPotentialClients(member.industry)
                });
                
                if (recommendations.length >= 3) {
                    return recommendations;
                }
            }
        }
    }
    
    // 如果推薦不足3個，嘗試匹配夢幻引薦行業
    if (recommendations.length < 3 && dreamReferral.industry) {
        const matchingMembers = members.filter(member => 
            !recommendations.some(rec => rec.name === member.name) &&
            member.industry && 
            (
                member.industry.includes(dreamReferral.industry) || 
                dreamReferral.industry.includes(member.industry)
            )
        );
        
        for (const member of matchingMembers) {
            recommendations.push({
                name: member.name,
                industry: member.industry,
                reason: `專業與您的夢幻引薦行業 ${dreamReferral.industry} 相關，一對一交流可助您接觸到更多該領域的人脈與商機。`,
                potentialClients: getPotentialClients(member.industry)
            });
            
            if (recommendations.length >= 3) {
                return recommendations;
            }
        }
    }
    
    // 如果仍然不足3個，添加隨機會員直到達到3個推薦
    const remainingMembers = members.filter(member => 
        !recommendations.some(rec => rec.name === member.name)
    );
    
    // 隨機打亂會員順序
    const shuffledMembers = remainingMembers.sort(() => 0.5 - Math.random());
    
    for (const member of shuffledMembers) {
        recommendations.push({
            name: member.name,
            industry: member.industry,
            reason: "專業背景多元，一對一交流可發掘意想不到的商機與合作可能，擴展您的人脈網絡。",
            potentialClients: getPotentialClients(member.industry)
        });
        
        if (recommendations.length >= 3) {
            return recommendations;
        }
    }
    
    return recommendations;
} 