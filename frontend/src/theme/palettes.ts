export const PALETTE_TOKEN_NAMES = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--destructive',
  '--destructive-foreground',
  '--success',
  '--success-foreground',
  '--warning',
  '--warning-foreground',
  '--border',
  '--input',
  '--ring',
] as const

export type PaletteTokenName = (typeof PALETTE_TOKEN_NAMES)[number]

export type PaletteTokens = Record<PaletteTokenName, string>

export type Palette = {
  id: string
  name: string
  note: string
  tokens: PaletteTokens
}

export const TOKEN_NOTES: Record<PaletteTokenName, string> = {
  '--background':
    'Фон приложения. Светлый читается как открытость и доверие, тёмный — как премиальность.',
  '--foreground': 'Основной текст. Должен давать максимальный контраст с фоном.',
  '--card': 'Поверхность карточек и панелей, отделяет контент от фона.',
  '--card-foreground': 'Текст на карточках.',
  '--popover': 'Поверхность всплывающих окон и меню.',
  '--popover-foreground': 'Текст во всплывающих окнах.',
  '--primary': 'Главный акцент и кнопки действия. Формирует характер бренда.',
  '--primary-foreground': 'Текст и иконки на главном акценте.',
  '--secondary': 'Второстепенные поверхности: чипы, нейтральные кнопки.',
  '--secondary-foreground': 'Текст на второстепенных поверхностях.',
  '--muted': 'Приглушённые блоки и подложки.',
  '--muted-foreground': 'Второстепенный текст и подписи.',
  '--accent': 'Мягкая подсветка активных элементов и наведения.',
  '--accent-foreground': 'Текст на подсветке, обычно совпадает с оттенком акцента.',
  '--destructive': 'Опасные действия и статус отказа.',
  '--destructive-foreground': 'Текст на опасных действиях.',
  '--success': 'Успешные статусы: одобрено, выдано.',
  '--success-foreground': 'Текст на успешных статусах.',
  '--warning': 'Предупреждающие статусы и ожидание.',
  '--warning-foreground': 'Текст на предупреждениях.',
  '--border': 'Границы карточек, полей и разделителей.',
  '--input': 'Границы полей ввода.',
  '--ring': 'Обводка фокуса. Обычно совпадает с главным акцентом.',
}

const semantic = {
  '--destructive': '#dc2626',
  '--destructive-foreground': '#ffffff',
  '--success': '#16a34a',
  '--success-foreground': '#ffffff',
  '--warning': '#d97706',
  '--warning-foreground': '#ffffff',
} as const

export const PALETTES: Palette[] = [
  {
    id: 'alfa-red',
    name: 'Альфа-красный',
    note: 'Фирменная гамма Альфы. Красный акцент на нейтральном светлом фоне. Воспринимается как «родной» банковский интерфейс, привычно и надёжно для жюри.',
    tokens: {
      '--background': '#f8fafc',
      '--foreground': '#0f172a',
      '--card': '#ffffff',
      '--card-foreground': '#0f172a',
      '--popover': '#ffffff',
      '--popover-foreground': '#0f172a',
      '--primary': '#c8102e',
      '--primary-foreground': '#ffffff',
      '--secondary': '#f1f5f9',
      '--secondary-foreground': '#0f172a',
      '--muted': '#f1f5f9',
      '--muted-foreground': '#64748b',
      '--accent': '#fef2f2',
      '--accent-foreground': '#991b1b',
      '--border': '#e2e8f0',
      '--input': '#e2e8f0',
      '--ring': '#c8102e',
      ...semantic,
    },
  },
  {
    id: 'corporate-navy',
    name: 'Корпоративный синий',
    note: 'Глубокий синий — классический банковский. Воспринимается как надёжность, спокойствие и серьёзность; не привязан к бренду, безопасен по правилам кейса.',
    tokens: {
      '--background': '#f6f8fb',
      '--foreground': '#0b1a33',
      '--card': '#ffffff',
      '--card-foreground': '#0b1a33',
      '--popover': '#ffffff',
      '--popover-foreground': '#0b1a33',
      '--primary': '#1e3a8a',
      '--primary-foreground': '#ffffff',
      '--secondary': '#eef2f9',
      '--secondary-foreground': '#0b1a33',
      '--muted': '#eef2f9',
      '--muted-foreground': '#5b6b85',
      '--accent': '#e8efff',
      '--accent-foreground': '#1e3a8a',
      '--border': '#dbe3ef',
      '--input': '#dbe3ef',
      '--ring': '#1e3a8a',
      ...semantic,
    },
  },
  {
    id: 'graphite',
    name: 'Графит',
    note: 'Нейтральный графит со сдержанным серым акцентом. Воспринимается как enterprise-инструмент: минимум эмоций, максимум фокуса на данных и статусах.',
    tokens: {
      '--background': '#f5f6f7',
      '--foreground': '#111827',
      '--card': '#ffffff',
      '--card-foreground': '#111827',
      '--popover': '#ffffff',
      '--popover-foreground': '#111827',
      '--primary': '#1f2937',
      '--primary-foreground': '#ffffff',
      '--secondary': '#eceef1',
      '--secondary-foreground': '#111827',
      '--muted': '#eceef1',
      '--muted-foreground': '#6b7280',
      '--accent': '#e5e7eb',
      '--accent-foreground': '#111827',
      '--border': '#e1e3e6',
      '--input': '#e1e3e6',
      '--ring': '#4b5563',
      ...semantic,
    },
  },
  {
    id: 'indigo',
    name: 'Индиго',
    note: 'Современный финтех: индиго-акцент и мягкие фоны. Воспринимается технологично и свежо, но без эпатажа — подходит для цифрового продукта.',
    tokens: {
      '--background': '#f7f7fd',
      '--foreground': '#1e1b4b',
      '--card': '#ffffff',
      '--card-foreground': '#1e1b4b',
      '--popover': '#ffffff',
      '--popover-foreground': '#1e1b4b',
      '--primary': '#4f46e5',
      '--primary-foreground': '#ffffff',
      '--secondary': '#eef0fb',
      '--secondary-foreground': '#1e1b4b',
      '--muted': '#eef0fb',
      '--muted-foreground': '#6366a8',
      '--accent': '#e9e7ff',
      '--accent-foreground': '#4338ca',
      '--border': '#e0e1f3',
      '--input': '#e0e1f3',
      '--ring': '#4f46e5',
      ...semantic,
    },
  },
  {
    id: 'slate-cyan',
    name: 'Графит-циан',
    note: 'Холодный серо-голубой с циановым акцентом. Воспринимается собранно и «по-инженерному», хорошо держит таблицы, статусы и плотные данные.',
    tokens: {
      '--background': '#f4f7f9',
      '--foreground': '#0f2830',
      '--card': '#ffffff',
      '--card-foreground': '#0f2830',
      '--popover': '#ffffff',
      '--popover-foreground': '#0f2830',
      '--primary': '#0891b2',
      '--primary-foreground': '#ffffff',
      '--secondary': '#e9f1f4',
      '--secondary-foreground': '#0f2830',
      '--muted': '#e9f1f4',
      '--muted-foreground': '#5b7580',
      '--accent': '#e0f5fa',
      '--accent-foreground': '#0e7490',
      '--border': '#d8e3e8',
      '--input': '#d8e3e8',
      '--ring': '#0891b2',
      ...semantic,
    },
  },
]

export const DEFAULT_PALETTE_ID = PALETTES[0].id

export const THEME_STORAGE_KEY = 'credit-cabinet-theme'

export function getPalette(id: string | null): Palette {
  return PALETTES.find((palette) => palette.id === id) ?? PALETTES[0]
}

export function applyPalette(palette: Palette) {
  const root = document.documentElement
  for (const token of PALETTE_TOKEN_NAMES) {
    root.style.setProperty(token, palette.tokens[token])
  }
}

export function getInitialPaletteId(): string {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored && PALETTES.some((palette) => palette.id === stored)) {
      return stored
    }
  } catch {
    return DEFAULT_PALETTE_ID
  }
  return DEFAULT_PALETTE_ID
}

export function applyInitialPalette() {
  applyPalette(getPalette(getInitialPaletteId()))
}
