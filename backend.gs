/**
 * BNI富揚名人堂白金分會商務計算器後台服務
 * 
 * 部署說明：
 * 1. 創建一個新的 Google Sheets 電子表格
 * 2. 添加以下欄位作為標題行：
 *    - 時間戳記
 *    - 姓名
 *    - 專業別
 *    - 年營業額
 *    - BNI年營業額
 *    - 每筆交易金額
 *    - 成交率
 *    - 必須完成案件數
 *    - 需報價案件數
 *    - 每年會議次數
 *    - 每週會議次數
 *    - 夢幻引薦人脈
 *    - 夢幻引薦行業
 *    - 夢幻引薦金額
 *    - 願合作行業1
 *    - 願合作行業2
 *    - 願合作行業3
 *    - 願合作行業4
 *    - 期望會員數
 *    - 邀請來賓數
 *    - 提供引薦數
 *    - 一對一次數
 *    - 培訓場次
 *    - 期許與建議
 * 3. 點擊 "工具" > "指令碼編輯器" 打開 Google Apps Script 編輯器
 * 4. 將此代碼複製到編輯器中
 * 5. 修改 SPREADSHEET_ID 變數為您的 Google Sheets 的 ID
 * 6. 點擊 "部署" > "新增部署"
 * 7. 部署類型選擇 "網頁應用程式"
 * 8. 執行身份選擇 "自己"
 * 9. 誰可以存取選擇 "所有人"
 * 10. 點擊 "部署"，然後複製生成的網址
 * 11. 將網址更新到前端代碼的 BACKEND_API_URL 變數中
 */

// 配置：在這裡設置您的 Google Sheets ID
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// 在 Google Sheets 中使用的工作表名稱
const SHEET_NAME = '會員數據';

/**
 * 處理所有 HTTP 請求的主方法
 */
function doPost(e) {
  try {
    // 解析請求參數
    const params = e.parameter;
    const action = params.action;
    
    // 根據請求的 action 執行不同操作
    if (action === 'save_member_data') {
      // 從請求中獲取會員數據
      const memberData = JSON.parse(params.member_data);
      
      // 保存會員數據
      const result = saveMemberData(memberData);
      
      // 返回成功響應
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: '會員數據已成功保存',
        data: result
      })).setMimeType(ContentService.MimeType.JSON);
      
    } else {
      // 未知的 action
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: '未知的操作類型'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    // 處理錯誤
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: '處理請求時出錯: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 處理所有 GET 請求
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'API 服務正常運行中，請使用 POST 請求來提交數據'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 保存會員數據到 Google Sheets
 */
function saveMemberData(data) {
  try {
    // 打開電子表格和工作表
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // 如果工作表不存在，則創建一個新的
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      
      // 添加標題行
      sheet.appendRow([
        '時間戳記',
        '姓名',
        '專業別',
        '年營業額',
        'BNI年營業額',
        '每筆交易金額',
        '成交率',
        '必須完成案件數',
        '需報價案件數',
        '每年會議次數',
        '每週會議次數',
        '夢幻引薦人脈',
        '夢幻引薦行業',
        '夢幻引薦金額',
        '願合作行業1',
        '願合作行業2',
        '願合作行業3',
        '願合作行業4',
        '期望會員數',
        '邀請來賓數',
        '提供引薦數',
        '一對一次數',
        '培訓場次',
        '期許與建議'
      ]);
      
      // 凍結標題行
      sheet.setFrozenRows(1);
      
      // 調整列寬以便更好地顯示數據
      sheet.autoResizeColumns(1, 24);
    }
    
    // 檢查是否已有此會員的數據
    const dataRows = sheet.getDataRange().getValues();
    let existingRowIndex = -1;
    
    // 從第二行開始搜索 (跳過標題行)
    for (let i = 1; i < dataRows.length; i++) {
      if (dataRows[i][1] === data.name) {  // 姓名位於第二列 (索引 1)
        existingRowIndex = i + 1;  // +1 因為 Google Sheets 的行從 1 開始
        break;
      }
    }
    
    // 準備要保存的數據
    const rowData = [
      new Date(data.timestamp),  // 時間戳記
      data.name,                 // 姓名
      data.industry,             // 專業別
      data.yearlyRevenue,        // 年營業額
      data.bniForecast,          // BNI年營業額
      data.avgTransactionAmount, // 每筆交易金額
      data.closingRate,          // 成交率
      data.casesNeeded,          // 必須完成案件數
      data.contactsNeeded,       // 需報價案件數
      data.yearlyMeetings,       // 每年會議次數
      data.weeklyMeetings,       // 每週會議次數
      data.dreamReferral.people,        // 夢幻引薦人脈
      data.dreamReferral.industry,      // 夢幻引薦行業
      data.dreamReferral.amount,        // 夢幻引薦金額
      data.wishIndustries[0] || '',     // 願合作行業1
      data.wishIndustries[1] || '',     // 願合作行業2
      data.wishIndustries[2] || '',     // 願合作行業3
      data.wishIndustries[3] || '',     // 願合作行業4
      data.expectedMembers,             // 期望會員數
      data.commitment.guestInvites,     // 邀請來賓數
      data.commitment.referralsProvided, // 提供引薦數
      data.commitment.oneOnOneMeetings,  // 一對一次數
      data.commitment.trainingAttendance, // 培訓場次
      data.suggestions                   // 期許與建議
    ];
    
    // 如果會員數據已存在，則更新；否則添加新行
    if (existingRowIndex > 0) {
      const range = sheet.getRange(existingRowIndex, 1, 1, rowData.length);
      range.setValues([rowData]);
      return {
        action: 'updated',
        name: data.name,
        row: existingRowIndex
      };
    } else {
      sheet.appendRow(rowData);
      return {
        action: 'added',
        name: data.name,
        row: sheet.getLastRow()
      };
    }
  } catch (error) {
    console.error('保存會員數據時出錯:', error);
    throw error;
  }
}

/**
 * 獲取所有會員數據
 */
function getAllMemberData() {
  try {
    // 打開電子表格和工作表
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return [];
    }
    
    // 獲取所有數據
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // 如果只有標題行或沒有數據，則返回空陣列
    if (values.length <= 1) {
      return [];
    }
    
    // 獲取標題行
    const headers = values[0];
    
    // 將數據轉換為對象陣列
    const result = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const member = {};
      
      // 使用標題行作為對象的鍵
      for (let j = 0; j < headers.length; j++) {
        member[headers[j]] = row[j];
      }
      
      result.push(member);
    }
    
    return result;
  } catch (error) {
    console.error('獲取會員數據時出錯:', error);
    throw error;
  }
}
