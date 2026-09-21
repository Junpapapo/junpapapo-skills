/**
 * ==============================================================================
 * 📋 Modo User Feedback & Survey — Google Apps Script Master Engine v2.0
 * ==============================================================================
 * 
 * [초간단 1분 배포 가이드 - 구글 시트와 서베이 탭이 1클릭으로 자동 생성됩니다!]
 * 1. 기존 Modo 구글 스프레드시트를 열거나, 새 스프레드시트를 만듭니다.
 * 2. 상단 메뉴 [확장 프로그램 (Extensions)] > [Apps Script] 클릭.
 * 3. 기존 코드를 모두 지우고 본 파일 전체를 복사하여 붙여넣습니다 (Ctrl+A -> Ctrl+V).
 * 4. 상단 [저장] 아이콘(Ctrl+S) 클릭.
 * 5. 상단 함수 드롭다운에서 'initAllSheets'를 선택하고 [실행 (Run)] 클릭:
 *    -> 1) 'Modo_User_VOC' 시트에 15개 헤더(설문 질문, 설문 응답 열 포함) 자동 구성!
 *    -> 2) 'Survey_Config' 시트에 17개 언어 자동 번역(=GOOGLETRANSLATE) 수식 및 시드 설문 자동 구성!
 * 6. 우측 상단 [배포 (Deploy)] > [배포 관리 (Manage deployments)] > 연필 아이콘(수정):
 *    - 버전: '새 버전 (New version)'
 *    - 설명: 'Modo VOC & Dynamic 4-Choice Survey v2'
 *    - 다음 사용자로 실행: '나 (Me)'
 *    - 액세스 권한: '모든 사용자 (Anyone)' (⭐️ 중요: 익명 앱 사용자도 제출 가능)
 *    - [배포] 클릭!
 * 7. (신규 생성 시에만) 배포 완료 후 나온 '웹 앱 URL'을 복사하여 .env의 EXPO_PUBLIC_FEEDBACK_WEBHOOK_URL에 설정.
 * ==============================================================================
 */

// (선택 사항) 디스코드 실시간 알림을 받고 싶다면 웹훅 URL 입력
var DISCORD_WEBHOOK_URL = "";

// 1. Modo_User_VOC 시트 헤더 (15개 컬럼)
var VOC_HEADERS = [
  "ID", 
  "일시 (Date)", 
  "유형 (Category)", 
  "별점 (Rating)", 
  "내용 (Content)", 
  "OS/기기", 
  "앱 버전", 
  "언어", 
  "Pro 여부", 
  "상태 (Status)", 
  "투표수 (Upvotes)", 
  "비고 (Notes)",
  "출처 (Source)",
  "설문 질문 (Survey Q)",
  "설문 응답 (Survey A)"
];

// 2. Survey_Config 시트 헤더 (9개 컬럼)
var SURVEY_CONFIG_HEADERS = [
  "active",
  "id",
  "lang",
  "question",
  "option_1",
  "option_2",
  "option_3",
  "option_4",
  "updated_at"
];

/**
 * [원클릭 초기화 마스터 함수]
 * Apps Script 에디터에서 initAllSheets를 선택 후 실행하면 두 시트가 모두 자동 세팅됩니다.
 */
function initAllSheets() {
  initVocSheetHeaders();
  initSurveyConfigSheet();
  Logger.log("🎉 All Modo Sheets (VOC & Survey_Config) initialized successfully!");
}

/**
 * 1. Modo_User_VOC 시트 헤더 및 서식 세팅 함수
 */
function initVocSheetHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Modo_User_VOC") || ss.getActiveSheet();
  sheet.setName("Modo_User_VOC");

  var headerRange = sheet.getRange(1, 1, 1, VOC_HEADERS.length);
  headerRange.setValues([VOC_HEADERS]);
  headerRange.setBackground("#228BE6");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");

  // 열 너비 설정
  sheet.setColumnWidth(1, 110); // ID
  sheet.setColumnWidth(2, 160); // Date
  sheet.setColumnWidth(3, 110); // Category
  sheet.setColumnWidth(4, 80);  // Rating
  sheet.setColumnWidth(5, 360); // Content
  sheet.setColumnWidth(6, 160); // OS
  sheet.setColumnWidth(7, 100); // AppVersion
  sheet.setColumnWidth(8, 80);  // Language
  sheet.setColumnWidth(9, 90);  // Pro
  sheet.setColumnWidth(10, 100); // Status
  sheet.setColumnWidth(11, 80);  // Upvotes
  sheet.setColumnWidth(12, 180); // Notes
  sheet.setColumnWidth(13, 120); // Source
  sheet.setColumnWidth(14, 220); // Survey Question
  sheet.setColumnWidth(15, 220); // Survey Answer

  sheet.setFrozenRows(1);
  Logger.log("✅ Modo_User_VOC Headers (15 Columns) initialized!");
}

/**
 * 2. Survey_Config 시트 자동 생성 및 17개 언어 자동 번역 수식 세팅 함수
 */
function initSurveyConfigSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Survey_Config");
  if (!sheet) {
    sheet = ss.insertSheet("Survey_Config");
  }

  // 헤더 설정 (1행)
  var headerRange = sheet.getRange(1, 1, 1, SURVEY_CONFIG_HEADERS.length);
  headerRange.setValues([SURVEY_CONFIG_HEADERS]);
  headerRange.setBackground("#4F46E5"); // Indigo accent
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");

  // 2행: 한국어 원본 (Master Seed)
  var koRow = [
    true,
    "SURVEY_2026_Q3_ROADMAP",
    "ko",
    "다음 업데이트에서 가장 바라는 기능은?",
    "위젯 스타일/폰트 추가",
    "태블릿/가로모드 지원",
    "데스크톱/웹 뷰어 연동",
    "AI 스마트 요약/정리",
    new Date()
  ];

  // 3행: 영어 표준 행 (Universal Fallback - 검증된 영문 번역)
  var enRow = [
    true,
    "SURVEY_2026_Q3_ROADMAP",
    "en",
    "What feature do you want most in the next update?",
    "More Widget Styles & Fonts",
    "Tablet & Landscape Support",
    "Desktop & Web Viewer",
    "AI Smart Summary & Organize",
    new Date()
  ];

  // 4행~18행: 나머지 15개 글로벌 언어 (구글번역 자동 수식 탑재)
  var otherLanguages = [
    "ja", "zh", "zh-TW", "es", "fr", "de", "it", "pt-BR", "ru", "nl", "pl", "tr", "vi", "th", "id"
  ];

  var rowsData = [koRow, enRow];

  for (var i = 0; i < otherLanguages.length; i++) {
    var lang = otherLanguages[i];
    var rowIndex = 4 + i; // 4행부터 시작
    // GOOGLETRANSLATE formula referencing Row 2 ($D$2:$H$2)
    var transQuestion = '=IFERROR(GOOGLETRANSLATE($D$2, "ko", C' + rowIndex + '), $D$3)';
    var transOpt1 = '=IFERROR(GOOGLETRANSLATE($E$2, "ko", C' + rowIndex + '), $E$3)';
    var transOpt2 = '=IFERROR(GOOGLETRANSLATE($F$2, "ko", C' + rowIndex + '), $F$3)';
    var transOpt3 = '=IFERROR(GOOGLETRANSLATE($G$2, "ko", C' + rowIndex + '), $G$3)';
    var transOpt4 = '=IFERROR(GOOGLETRANSLATE($H$2, "ko", C' + rowIndex + '), $H$3)';

    rowsData.push([
      true,
      "SURVEY_2026_Q3_ROADMAP",
      lang,
      transQuestion,
      transOpt1,
      transOpt2,
      transOpt3,
      transOpt4,
      new Date()
    ]);
  }

  var dataRange = sheet.getRange(2, 1, rowsData.length, SURVEY_CONFIG_HEADERS.length);
  dataRange.setValues(rowsData);

  sheet.setColumnWidth(1, 80);  // active
  sheet.setColumnWidth(2, 180); // id
  sheet.setColumnWidth(3, 80);  // lang
  sheet.setColumnWidth(4, 280); // question
  sheet.setColumnWidth(5, 180); // opt 1
  sheet.setColumnWidth(6, 180); // opt 2
  sheet.setColumnWidth(7, 180); // opt 3
  sheet.setColumnWidth(8, 180); // opt 4
  sheet.setColumnWidth(9, 140); // updated_at

  sheet.setFrozenRows(1);
  Logger.log("✅ Survey_Config Sheet (17 Languages with Auto-Translation) initialized!");
}

/**
 * 3. 구글 스프레드시트 상단 커스텀 메뉴 자동 등록
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🚀 Modo 관리 도구")
    .addItem("✨ VOC + 설문 시트 전체 자동 초기화", "initAllSheets")
    .addItem("📋 VOC 헤더 업데이트 (15컬럼)", "initVocSheetHeaders")
    .addItem("📊 설문(Survey_Config) 시트 초기화", "initSurveyConfigSheet")
    .addToUi();
}

/**
 * 4. GET 웹훅: 
 *    - ?action=getSurvey&lang={lang}: 활성 설문 조회 (영문 유니버설 폴백)
 *    - 기타 / 기본: QA 대시보드 및 VOC 동기화를 위한 피드백 목록 반환
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || "";
    var requestedLang = (e && e.parameter && e.parameter.lang) || "en";

    // 1) 서베이 조회 API
    if (action === "getSurvey") {
      var survey = getActiveSurveyConfig(requestedLang);
      return ContentService.createTextOutput(
        JSON.stringify({ status: "success", survey: survey })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // 2) QA 대시보드 / sync_feedback.py 용 피드백 목록 반환 (기존 기능 100% 보존)
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Modo_User_VOC") || ss.getActiveSheet();
    var rows = sheet.getDataRange().getValues();

    if (rows.length <= 1) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "success", count: 0, data: [] })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var result = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (!r[0]) continue;

      var rawSource = String(r[12] || "").trim().toLowerCase();
      var sourceCode = "in_app";
      if (rawSource.indexOf("play") >= 0) {
        sourceCode = "play_store";
      } else if (rawSource.indexOf("app_store") >= 0 || rawSource.indexOf("apple") >= 0) {
        sourceCode = "app_store";
      }

      result.push({
        id: String(r[0]),
        date: String(r[1]).substring(0, 10),
        timestamp: String(r[1]),
        category: String(r[2]),
        rating: Number(r[3]) || 5,
        title: String(r[4]).length > 40 ? String(r[4]).substring(0, 37) + "..." : String(r[4]),
        content: String(r[4]),
        device: String(r[5]) + " • v" + String(r[6]),
        os: String(r[5]),
        appVersion: String(r[6]),
        language: String(r[7]),
        isPro: String(r[8]) === "PRO",
        status: String(r[9]) || "new",
        upvotes: Number(r[10]) || 1,
        notes: String(r[11] || ""),
        source: sourceCode,
        surveyQuestion: String(r[13] || ""),
        surveyAnswer: String(r[14] || "")
      });
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success", count: result.length, data: result })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 5. POST 웹훅:
 *    - 피드백 제출 및 설문 응답 (Col 14: 질문, Col 15: 답변) 기록
 *    - action: update_status (QA 대시보드 상태 변경) 처리
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Modo_User_VOC") || ss.getActiveSheet();

    // 1행이 비어 있다면 자동으로 헤더 생성
    if (sheet.getLastRow() === 0) {
      initVocSheetHeaders();
    }

    // 1) 2-Way Remote Sync: QA 대시보드 상태 업데이트
    if (data.action === "update_status") {
      var targetId = String(data.id || "").trim();
      var newStatus = String(data.status || "new");
      var reply = data.reply ? String(data.reply).trim() : "";
      var notes = data.notes ? String(data.notes).trim() : "";

      var rows = sheet.getDataRange().getValues();
      var foundRow = -1;
      for (var r = 1; r < rows.length; r++) {
        if (String(rows[r][0]).trim() === targetId) {
          foundRow = r + 1;
          break;
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, 10).setValue(newStatus);
        if (reply || notes) {
          var noteVal = reply ? ("답변완료: " + reply) : notes;
          sheet.getRange(foundRow, 12).setValue(noteVal);
        }
        return ContentService.createTextOutput(
          JSON.stringify({ result: "success", action: "update_status", id: targetId, status: newStatus })
        ).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(
          JSON.stringify({ result: "error", message: "Item ID not found: " + targetId })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 2) 일반 피드백 및 설문 제출 Ingestion
    var id = data.id || ("FB-" + Date.now().toString(36).toUpperCase());
    var timestamp = data.timestamp || new Date().toISOString();
    var category = data.category || "feature";
    var rating = data.rating || 5;
    var content = data.content || "";
    var device = data.device || {};
    var os = (device.os || "universal") + (device.osVersion ? (" (" + device.osVersion + ")") : "");
    var appVersion = device.appVersion || "1.0.44";
    var language = device.language || "ko";
    var isPro = device.isPro ? "PRO" : "FREE";
    var status = "new";
    var upvotes = 1;
    var notes = "";

    var rawSource = String(data.source || "in_app").toLowerCase();
    var sourceLabel = "📱 인앱 피드백";
    if (rawSource.indexOf("play") >= 0) {
      sourceLabel = "🤖 Play 스토어";
    } else if (rawSource.indexOf("app_store") >= 0 || rawSource.indexOf("apple") >= 0) {
      sourceLabel = "🍎 App Store";
    }

    var surveyQuestion = String(data.surveyQuestion || "");
    var surveyAnswer = String(data.surveyAnswer || "");

    sheet.appendRow([
      id,
      timestamp,
      category,
      rating,
      content,
      os,
      appVersion,
      language,
      isPro,
      status,
      upvotes,
      notes,
      sourceLabel,
      surveyQuestion,
      surveyAnswer
    ]);

    // 디스코드 알림 발송 (선택)
    if (DISCORD_WEBHOOK_URL && DISCORD_WEBHOOK_URL.indexOf("http") === 0) {
      sendDiscordNotification(data);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ result: "success", id: id })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/**
 * 6. 활성 서베이 설정 조회 (영문 유니버설 폴백 핵심 로직)
 */
function getActiveSurveyConfig(requestedLang) {
  var defaultSurvey = {
    id: "SURVEY_2026_Q3_ROADMAP",
    question: "What feature do you want most in the next update?",
    questionEn: "What feature do you want most in the next update?",
    questionKo: "다음 업데이트에서 가장 바라는 기능은?",
    options: [
      { id: 1, text: "More Widget Styles & Fonts", textKo: "위젯 스타일/폰트 추가", textEn: "More Widget Styles & Fonts" },
      { id: 2, text: "Tablet & Landscape Support", textKo: "태블릿/가로모드 지원", textEn: "Tablet & Landscape Support" },
      { id: 3, text: "Desktop & Web Viewer", textKo: "데스크톱/웹 뷰어 연동", textEn: "Desktop & Web Viewer" },
      { id: 4, text: "AI Smart Summary & Organize", textKo: "AI 스마트 요약/정리", textEn: "AI Smart Summary & Organize" }
    ],
    active: true,
    updatedAt: new Date().toISOString()
  };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = ss.getSheetByName("Survey_Config");
  if (!configSheet) return defaultSurvey;

  var values = configSheet.getDataRange().getValues();
  if (values.length < 2) return defaultSurvey;

  var matchedRow = null;
  var enRow = null;
  var koRow = null;

  var targetLang = (requestedLang || "en").toLowerCase().trim();

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var isActive = row[0] === true || String(row[0]).toLowerCase() === "true";
    if (!isActive) continue;

    var rowLang = String(row[2] || "").toLowerCase().trim();
    if (rowLang === "ko") koRow = row;
    if (rowLang === "en") enRow = row;
    if (rowLang === targetLang) matchedRow = row;
  }

  // Base rows: 한국어 원본 및 영문 표준 행
  var fallbackRow = enRow || koRow || values[1];
  var activeKoRow = koRow || values[1];
  var activeEnRow = enRow || activeKoRow;

  // 선택된 행: 타겟 언어가 없거나 오류 시 영어(en) 행으로 유니버설 폴백!
  var finalRow = (matchedRow && matchedRow[3] && !String(matchedRow[3]).startsWith("#")) ? matchedRow : fallbackRow;

  var id = String(finalRow[1] || defaultSurvey.id);
  var questionKo = String(activeKoRow[3] || defaultSurvey.questionKo);
  var questionEn = String(activeEnRow[3] || defaultSurvey.questionEn);

  var questionText = String(finalRow[3] || "").trim();
  if (!questionText || questionText.startsWith("#")) {
    questionText = targetLang.startsWith("ko") ? questionKo : questionEn;
  }

  var options = [];
  for (var optIdx = 1; optIdx <= 4; optIdx++) {
    var colIndex = 3 + optIdx; // Col E = 4
    var textKo = String(activeKoRow[colIndex] || defaultSurvey.options[optIdx - 1].textKo);
    var textEn = String(activeEnRow[colIndex] || defaultSurvey.options[optIdx - 1].textEn);

    var text = String(finalRow[colIndex] || "").trim();
    if (!text || text.startsWith("#")) {
      text = targetLang.startsWith("ko") ? textKo : textEn;
    }

    options.push({
      id: optIdx,
      text: text,
      textKo: textKo,
      textEn: textEn
    });
  }

  return {
    id: id,
    question: questionText,
    questionKo: questionKo,
    questionEn: questionEn,
    options: options,
    active: true,
    updatedAt: new Date().toISOString()
  };
}

/**
 * 7. (선택) 디스코드 웹훅 알림
 */
function sendDiscordNotification(data) {
  try {
    var stars = "";
    for (var i = 0; i < (data.rating || 5); i++) stars += "⭐";

    var colorMap = {
      bug: 0xE0533C,
      feature: 0x228BE6,
      ux: 0x7950F2,
      other: 0x2B8A3E
    };

    var fields = [
      { name: "카테고리", value: data.category || "기타", inline: true },
      { name: "별점", value: stars + " (" + (data.rating || 5) + "점)", inline: true },
      { name: "내용", value: data.content || "(내용 없음)", inline: false }
    ];

    if (data.surveyAnswer) {
      fields.push({
        name: "📊 설문 응답",
        value: (data.surveyQuestion ? (data.surveyQuestion + "\n👉 ") : "") + "**" + data.surveyAnswer + "**",
        inline: false
      });
    }

    var device = data.device || {};
    fields.push({
      name: "기기 환경",
      value: (device.os || "universal") + " (" + (device.osVersion || "N/A") + ") | v" + (device.appVersion || "1.0.44") + " | " + (device.language || "ko") + " | " + (device.isPro ? "PRO" : "FREE"),
      inline: false
    });

    var payload = {
      embeds: [
        {
          title: "💬 Modo 신규 유저 피드백 도착!",
          color: colorMap[data.category] || 0x228BE6,
          fields: fields,
          footer: { text: "ID: " + data.id + " | Modo VOC & Survey Pipeline" },
          timestamp: new Date().toISOString()
        }
      ]
    };

    UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload)
    });
  } catch (e) {
    Logger.log("Discord notification error: " + e);
  }
}
