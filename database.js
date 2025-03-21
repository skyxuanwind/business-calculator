// 存儲所有會員的姓名和專業別
const memberDatabase = [
    { name: "楊攸仁", industry: "髮妝造型教育顧問" },
    { name: "陳玥月", industry: "疤痕紋路修復專家" },
    { name: "陳家祥", industry: "成人情趣保健品業" },
    { name: "何玲君", industry: "體態雕塑" },
    { name: "李思賢", industry: "保養品業" },
    { name: "吳岳軒", industry: "影音行銷" },
    { name: "吳佳羽", industry: "活動整合企劃" },
    { name: "施建安", industry: "品牌形象設計" },
    { name: "吳金融", industry: "網路行銷" },
    { name: "熊若堯", industry: "專業人像攝影" },
    { name: "李子萱", industry: "中英文主持" },
    { name: "陳邑歆", industry: "花藝設計" },
    { name: "王杙鋌", industry: "海外留學顧問" },
    { name: "王子伊", industry: "頭皮.頭療spa顧問" },
    { name: "陳仕良", industry: "三高健康管理師" },
    { name: "洪千貽", industry: "樹化玉" },
    { name: "陳志豪", industry: "遠紅外線照射器材" },
    { name: "李冬梅", industry: "財富流教練" },
    { name: "黃裕峰", industry: "抗紅外線涼感眼鏡" },
    { name: "郭馥瑜", industry: "推拿觸療" },
    { name: "董帛融", industry: "會計師" },
    { name: "歐政儒", industry: "法律服務業" },
    { name: "黃仲毅", industry: "保險與財務規劃顧問" },
    { name: "林祥禔", industry: "Google資訊整合顧問" },
    { name: "張立群", industry: "進口車代表-賓士" },
    { name: "張泰祥", industry: "二手車代表" },
    { name: "李承書", industry: "汽車鍍膜包膜" },
    { name: "王瑞謙", industry: "資訊科技顧問" },
    { name: "林弘偉", industry: "單車業" },
    { name: "洪銘駿", industry: "殯葬禮儀業" },
    { name: "李雅婷", industry: "古物精品代銷業" },
    { name: "李侑昌", industry: "法式甜點" },
    { name: "賴奕銘", industry: "滷味麻辣燙" },
    { name: "李阡瑅", industry: "冷凍水產食品買賣" },
    { name: "李明憲", industry: "健康餐盒" },
    { name: "温志文", industry: "農業生技銷售" },
    { name: "張智堯", industry: "咖啡業" },
    { name: "吳瑞文", industry: "住宅房仲業" },
    { name: "段兆陽", industry: "健康住宅設計" },
    { name: "林才達", industry: "餐廳廚房油污清潔" },
    { name: "李庚育", industry: "環控設備業" },
    { name: "石昇弘", industry: "商空設計業" },
    { name: "朱玲瑤", industry: "窗簾業" },
    { name: "劉耀尹", industry: "五金工具業" },
    { name: "倪暉雅", industry: "彩繪藝術文創工程" },
    { name: "陳致佐", industry: "水電工程" },
    { name: "梁家菖", industry: "商用空調" },
    { name: "林詠儀", industry: "油漆工程" },
    { name: "杜國勇", industry: "木作裝修" },
    { name: "陳建男", industry: "溫泉旅宿業" }
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