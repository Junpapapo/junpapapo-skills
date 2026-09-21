/**
 * Default Seed Survey Dictionary for Modo Feedback & VOC.
 * Topic: "What feature do you want most in the next update?"
 * Standard English is the default universal fallback.
 * 100% English codebase with complete 17-language parity.
 */

import { SurveyConfig } from './types/survey';

export const DEFAULT_SURVEY_ID = 'SURVEY_2026_Q3_ROADMAP';

export const SURVEY_QUESTION_KO = '다음 업데이트에서 가장 바라는 기능은?';
export const SURVEY_QUESTION_EN = 'What feature do you want most in the next update?';

export const SURVEY_OPTIONS_KO = [
  '위젯 스타일/폰트 추가',
  '태블릿/가로모드 지원',
  '데스크톱/웹 뷰어 연동',
  'AI 스마트 요약/정리',
];

export const SURVEY_OPTIONS_EN = [
  'More Widget Styles & Fonts',
  'Tablet & Landscape Support',
  'Desktop & Web Viewer',
  'AI Smart Summary & Organize',
];

interface SurveyLocaleItem {
  question: string;
  options: [string, string, string, string];
}

export const DEFAULT_SURVEY_TRANSLATIONS: Record<string, SurveyLocaleItem> = {
  en: {
    question: SURVEY_QUESTION_EN,
    options: [
      SURVEY_OPTIONS_EN[0],
      SURVEY_OPTIONS_EN[1],
      SURVEY_OPTIONS_EN[2],
      SURVEY_OPTIONS_EN[3],
    ],
  },
  ko: {
    question: SURVEY_QUESTION_KO,
    options: [
      SURVEY_OPTIONS_KO[0],
      SURVEY_OPTIONS_KO[1],
      SURVEY_OPTIONS_KO[2],
      SURVEY_OPTIONS_KO[3],
    ],
  },
  ja: {
    question: '次のアップデートで最も期待する機能は？',
    options: [
      'ウィジェットスタイル・フォント追加',
      'タブレット・横向き画面対応',
      'デスクトップ・Web連携',
      'AIスマート要約・整理',
    ],
  },
  zh: {
    question: '在下一次更新中，您最期待哪个功能？',
    options: [
      '添加小组件样式与字体',
      '平板与横屏模式支持',
      '桌面端与网页查看器联动',
      'AI智能摘要与整理',
    ],
  },
  'zh-TW': {
    question: '在下一次更新中，您最期待哪個功能？',
    options: [
      '新增小工具樣式與字型',
      '平板與橫向模式支援',
      '桌面端與網頁檢視器連動',
      'AI智慧摘要與整理',
    ],
  },
  es: {
    question: '¿Qué función deseas más en la próxima actualización?',
    options: [
      'Más estilos de widgets y fuentes',
      'Soporte para tablet y modo horizontal',
      'Visor web y de escritorio',
      'Resumen y organización con IA',
    ],
  },
  fr: {
    question: 'Quelle fonctionnalité souhaitez-vous le plus pour la prochaine mise à jour ?',
    options: [
      'Plus de styles de widgets et polices',
      'Support tablette et mode paysage',
      'Visionneuse web et bureau',
      'Résumé et organisation IA',
    ],
  },
  de: {
    question: 'Welche Funktion wünschen Sie sich am meisten im nächsten Update?',
    options: [
      'Mehr Widget-Stile und Schriftarten',
      'Tablet- und Querformat-Unterstützung',
      'Desktop- und Web-Viewer',
      'KI-Zusammenfassung und Ordnung',
    ],
  },
  it: {
    question: 'Quale funzione desideri di più nel prossimo aggiornamento?',
    options: [
      'Altri stili e font per i widget',
      'Supporto per tablet e landscape',
      'Visualizzatore desktop e web',
      'Riepilogo e organizzazione con IA',
    ],
  },
  'pt-BR': {
    question: 'Qual recurso você mais deseja na próxima atualização?',
    options: [
      'Mais estilos de widgets e fontes',
      'Suporte para tablet e modo paisagem',
      'Visualizador web e desktop',
      'Resumo e organização com IA',
    ],
  },
  ru: {
    question: 'Какую функцию вы больше всего ждёте в следующем обновлении?',
    options: [
      'Больше стилей виджетов и шрифтов',
      'Поддержка планшетов и альбомного режима',
      'Десктоп и веб-просмотрщик',
      'ИИ-сводка и организация',
    ],
  },
  nl: {
    question: 'Welke functie wilt u het meest in de volgende update?',
    options: [
      'Meer widgetstijlen en lettertypen',
      'Ondersteuning voor tablet en landschap',
      'Desktop- en webviewer',
      'Slimme AI-samenvatting en ordening',
    ],
  },
  pl: {
    question: 'Jakiej funkcji najbardziej oczekujesz w kolejnej aktualizacji?',
    options: [
      'Więcej stylów widżetów i czcionek',
      'Obsługa tabletów i trybu poziomego',
      'Przeglądarka desktopowa i webowa',
      'Podsumowanie i porządkowanie przez AI',
    ],
  },
  tr: {
    question: 'Bir sonraki güncellemede en çok hangi özelliği istiyorsunuz?',
    options: [
      'Daha fazla widget stili ve yazı tipi',
      'Tablet ve yatay mod desteği',
      'Masaüstü ve web görüntüleyici',
      'Yapay zeka akıllı özet ve düzenleme',
    ],
  },
  vi: {
    question: 'Bạn mong muốn tính năng nào nhất trong bản cập nhật tiếp theo?',
    options: [
      'Thêm kiểu tiện ích và phông chữ',
      'Hỗ trợ máy tính bảng và xoay ngang',
      'Trình xem trên web và máy tính',
      'Tóm tắt và sắp xếp thông minh bằng AI',
    ],
  },
  th: {
    question: 'คุณต้องการฟีเจอร์ใดมากที่สุดในการอัปเดตครั้งถัดไป?',
    options: [
      'เพิ่มสไตล์วิดเจ็ตและฟอนต์',
      'รองรับแท็บเล็ตและแนวนอน',
      'เชื่อมต่อมุมมองเดสก์ท็อปและเว็บ',
      'สรุปและจัดระเบียบด้วย AI',
    ],
  },
  id: {
    question: 'Fitur apa yang paling Anda inginkan pada pembaruan berikutnya?',
    options: [
      'Lebih banyak gaya widget dan font',
      'Dukungan tablet dan mode lanskap',
      'Integrasi desktop dan penampil web',
      'Ringkasan dan penataan cerdas dengan AI',
    ],
  },
};

/**
 * Builds a complete SurveyConfig object for a given language.
 * Always defaults to English if the requested language translation is missing or incomplete.
 */
export function buildDefaultSurveyConfig(language: string = 'en'): SurveyConfig {
  const normLang = (language || 'en').toLowerCase().replace('_', '-');
  const localeData =
    DEFAULT_SURVEY_TRANSLATIONS[normLang] ||
    DEFAULT_SURVEY_TRANSLATIONS[normLang.split('-')[0]] ||
    DEFAULT_SURVEY_TRANSLATIONS.en;

  return {
    id: DEFAULT_SURVEY_ID,
    question: localeData.question || SURVEY_QUESTION_EN,
    questionKo: SURVEY_QUESTION_KO,
    questionEn: SURVEY_QUESTION_EN,
    active: true,
    options: [
      {
        id: 1,
        text: localeData.options[0] || SURVEY_OPTIONS_EN[0],
        textKo: SURVEY_OPTIONS_KO[0],
        textEn: SURVEY_OPTIONS_EN[0],
      },
      {
        id: 2,
        text: localeData.options[1] || SURVEY_OPTIONS_EN[1],
        textKo: SURVEY_OPTIONS_KO[1],
        textEn: SURVEY_OPTIONS_EN[1],
      },
      {
        id: 3,
        text: localeData.options[2] || SURVEY_OPTIONS_EN[2],
        textKo: SURVEY_OPTIONS_KO[2],
        textEn: SURVEY_OPTIONS_EN[2],
      },
      {
        id: 4,
        text: localeData.options[3] || SURVEY_OPTIONS_EN[3],
        textKo: SURVEY_OPTIONS_KO[3],
        textEn: SURVEY_OPTIONS_EN[3],
      },
    ],
  };
}
