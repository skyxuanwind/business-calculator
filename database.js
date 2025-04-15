// 存儲所有會員的姓名和專業別
const memberDatabase = [
    { name: "陳佳歆", industry: "連鎖餐飲" },
    { name: "陳麗如", industry: "美髮業" },
    { name: "張傳賢", industry: "脂肪管理顧問" },
    { name: "黃靖翔", industry: "足墊熱儀" },
    { name: "楊秀城", industry: "商業空間設計" },
    { name: "林樂豁塵", industry: "圍棋教育" },
    { name: "吳宜靜", industry: "數學教育" },
    { name: "林巧文", industry: "投資理財" },
    { name: "李佳晨", industry: "人壽保險" },
    { name: "陳純銘", industry: "磁磚業" },
    { name: "邱柏越", industry: "律師業" },
    { name: "陳瀅月", industry: "實體黃金買賣" },
    { name: "余承諺", industry: "女性生活用品" },
    { name: "吳易霖", industry: "葡萄酒商" },
    { name: "王佩艷", industry: "紋綉業" },
    { name: "吳珮瑜", industry: "修復性護膚品" },
    { name: "朱南旗", industry: "AI系統開發" },
    { name: "陳鈺翔", industry: "OA辦公傢俱" },
    { name: "林譁恩", industry: "統包工程" },
    { name: "朱愷妍", industry: "皮膚管理" }
];

// 根據姓名查找會員專業別
function findIndustryByName(name) {
    const member = memberDatabase.find(member => member.name === name);
    return member ? member.industry : "";
}

// 獲取所有會員數據
function getAllMembers() {
    return memberDatabase;
}

function getMemberIndustry(name) {
    const member = memberDatabase.find(m => m.name === name);
    return member ? member.industry : null;
}

// 暴露函數供其他腳本使用
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = { getAllMembers, getMemberIndustry };
} else {
    window.getAllMembers = getAllMembers;
    window.getMemberIndustry = getMemberIndustry;
} 