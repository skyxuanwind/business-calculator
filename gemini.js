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
        作為一個BNI小組的分析專家，請根據以下會員信息推薦3個最適合合作的夥伴。
        
        會員的夢幻引薦信息：
        - 夢幻引薦人脈：${dreamReferral.people || '未提供'}
        - 夢幻引薦行業：${dreamReferral.industry || '未提供'}
        - 夢幻引薦金額：${dreamReferral.amount ? `${dreamReferral.amount}元` : '未提供'}
        
        會員希望合作的行業：
        ${wishIndustries.map((industry, index) => `- 願合作行業 ${index + 1}：${industry}`).join('\n')}
        
        分析這位會員的需求後，請推薦3個最適合的合作夥伴。每個推薦需包含：
        1. 推薦夥伴的名稱
        2. 推薦夥伴的行業/專業
        3. 詳細說明為什麼推薦這個夥伴（專業互補性、客戶重疊可能性、合作機會等）
        
        請用JSON格式回答，格式如下：
        [
          {
            "name": "夥伴名稱",
            "industry": "夥伴行業/專業",
            "reason": "推薦理由"
          },
          ...
        ]
        
        只返回JSON格式，不要有任何其他文字。
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
            
            // 嘗試解析JSON
            try {
                const recommendations = JSON.parse(text.trim());
                return recommendations;
            } catch (error) {
                console.error('解析推薦JSON時出錯:', error);
                // 如果無法解析JSON，返回空數組
                return [];
            }
        } else {
            console.error('API沒有返回有效推薦');
            return [];
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
                reason: "專業提供全方位金融保險規劃，能協助夢幻引薦客戶進行風險管理和資產保障。"
            },
            {
                name: "林世傑",
                industry: "設計印刷",
                reason: "專業提供品牌視覺設計和印刷服務，可協助任何行業的客戶提升品牌形象。"
            },
            {
                name: "吳逸凡",
                industry: "數位行銷",
                reason: "專精於數位行銷策略，能幫助企業擴大市場影響力和客戶觸及率。"
            }
        ];
    }
    
    // 根據願合作行業和夢幻引薦行業篩選合適的會員
    let recommendations = [];
    
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
                    reason: `專業與您希望合作的 ${industry} 行業直接相關，可提供專業服務和合作機會。`
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
                reason: `專業與您的夢幻引薦行業 ${dreamReferral.industry} 相關，有助於拓展該行業的人脈和機會。`
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
            reason: "具備多元專業能力，可在不同場合提供互補服務，擴展您的合作網絡。"
        });
        
        if (recommendations.length >= 3) {
            return recommendations;
        }
    }
    
    return recommendations;
} 