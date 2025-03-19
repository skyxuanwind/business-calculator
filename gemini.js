// Gemini API 配置
const API_KEY = "AIzaSyAJJSsbPl0enZ2iOd49MQ69ra70JWkX1S8";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

// 使用 Gemini API 獲取推薦合作夥伴
async function getPartnerRecommendations(userName, userIndustry) {
    try {
        // 獲取所有會員數據，排除當前用戶
        const allMembers = getAllMembers().filter(member => member.name !== userName);
        
        // 準備 Gemini API 提示詞
        const prompt = `
我有一位名為 "${userName}" 的會員，專業別是 "${userIndustry}"。
請從以下會員列表中選擇3位最適合與該會員進行一對一深度合作的夥伴：

${allMembers.map(m => `${m.name}: ${m.industry}`).join('\n')}

請根據以下幾個方面進行分析：
1. 專業的互補性和合作潛力
2. 可能的共同客戶群體
3. 具體的合作方式和機會
4. 潛在的商業價值

回答格式要求：
1. 只回傳 JSON 格式
2. JSON 格式為包含3個物件的陣列，每個物件有以下屬性：
   - name: 推薦夥伴姓名
   - industry: 推薦夥伴專業別
   - reason: 詳細的推薦原因（包含合作潛力和共同客戶分析）
   - potentialClients: 可能的共同客戶群體描述
   - collaborationOpportunities: 具體的合作機會建議

只需回傳這個 JSON 數據，不要有其他文字。
`;

        // 呼叫 Gemini API
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': API_KEY
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_NONE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_NONE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_NONE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_NONE"
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 錯誤詳情:', errorText);
            throw new Error(`API 回應錯誤: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
            throw new Error('API 回應解析錯誤');
        }
        
        // 提取回應文本
        const responseText = data.candidates[0].content.parts[0].text;
        
        // 解析 JSON 回應
        // 尋找 JSON 文本（可能被其他文字包圍）
        const jsonMatch = responseText.match(/(\[.*\])/s);
        if (!jsonMatch) {
            throw new Error('未找到 JSON 格式的回應');
        }
        
        // 解析 JSON 文本
        const recommendations = JSON.parse(jsonMatch[0]);
        
        // 驗證回應格式
        if (!Array.isArray(recommendations) || recommendations.length === 0) {
            throw new Error('無效的推薦格式');
        }
        
        return recommendations;
    } catch (error) {
        console.error('獲取推薦夥伴時出錯:', error);
        // 發生錯誤時返回固定推薦
        return generateFallbackRecommendations(userName, userIndustry);
    }
}

// 生成備用推薦（當 API 調用失敗時）
function generateFallbackRecommendations(userName, userIndustry) {
    // 獲取所有會員數據，排除當前用戶
    const allMembers = getAllMembers().filter(member => member.name !== userName);
    
    // 隨機選擇三個不同的會員
    const shuffled = [...allMembers].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    // 生成簡單的理由
    return selected.map(member => ({
        name: member.name,
        industry: member.industry,
        reason: `${member.industry}與${userIndustry}可能有共同的客戶群或互補的服務，建議深入交流。`
    }));
} 