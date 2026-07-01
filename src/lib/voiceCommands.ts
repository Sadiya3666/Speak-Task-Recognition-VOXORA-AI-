export type CommandType = 
  | 'NEW_NOTE'
  | 'SAVE_NOTE'
  | 'CLEAR_TEXT'
  | 'READ_NOTES'
  | 'DELETE_LAST_NOTE'
  | 'DELETE_ALL_NOTES'
  | 'STOP_LISTENING';

type CommandDictionary = Record<CommandType, string[]>;

const commandDictionaries: Record<string, CommandDictionary> = {
  // English
  'en-US': {
    NEW_NOTE: ['new note'],
    SAVE_NOTE: ['save note', 'save this'],
    CLEAR_TEXT: ['clear text', 'clear note'],
    READ_NOTES: ['read notes', 'read my notes'],
    DELETE_LAST_NOTE: ['delete last note', 'remove last note'],
    DELETE_ALL_NOTES: ['delete all notes', 'clear all notes'],
    STOP_LISTENING: ['stop listening', 'stop voice']
  },
  // Kannada
  'kn-IN': {
    NEW_NOTE: ['ಹೊಸ ಟಿಪ್ಪಣಿ'],
    SAVE_NOTE: ['ಉಳಿಸು', 'ಟಿಪ್ಪಣಿ ಉಳಿಸು'],
    CLEAR_TEXT: ['ಅಳಿಸು', 'ಪಠ್ಯ ಅಳಿಸು'],
    READ_NOTES: ['ಓದು', 'ಟಿಪ್ಪಣಿಗಳನ್ನು ಓದು'],
    DELETE_LAST_NOTE: ['ಕೊನೆಯ ಟಿಪ್ಪಣಿ ಅಳಿಸು'],
    DELETE_ALL_NOTES: ['ಎಲ್ಲಾ ಟಿಪ್ಪಣಿಗಳನ್ನು ಅಳಿಸು'],
    STOP_LISTENING: ['ನಿಲ್ಲಿಸು', 'ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸು']
  },
  // Hindi
  'hi-IN': {
    NEW_NOTE: ['नया नोट', 'नया नोट्स'],
    SAVE_NOTE: ['सेव करें', 'नोट सेव करें'],
    CLEAR_TEXT: ['टेक्स्ट मिटाएं', 'मिटा दो'],
    READ_NOTES: ['नोट्स पढ़ें', 'पढ़ो'],
    DELETE_LAST_NOTE: ['पिछला नोट मिटाएं'],
    DELETE_ALL_NOTES: ['सभी नोट मिटाएं', 'सब मिटा दो'],
    STOP_LISTENING: ['सुनना बंद करो', 'रुक जाओ']
  },
  // Spanish
  'es-ES': {
    NEW_NOTE: ['nueva nota'],
    SAVE_NOTE: ['guardar nota', 'guardar esto'],
    CLEAR_TEXT: ['borrar texto', 'borrar nota'],
    READ_NOTES: ['leer notas', 'leer mis notas'],
    DELETE_LAST_NOTE: ['borrar última nota', 'eliminar última nota'],
    DELETE_ALL_NOTES: ['borrar todas las notas', 'eliminar todas'],
    STOP_LISTENING: ['dejar de escuchar', 'detener voz']
  },
  // French
  'fr-FR': {
    NEW_NOTE: ['nouvelle note'],
    SAVE_NOTE: ['enregistrer la note', 'sauvegarder'],
    CLEAR_TEXT: ['effacer le texte', 'effacer la note'],
    READ_NOTES: ['lire les notes', 'lire mes notes'],
    DELETE_LAST_NOTE: ['supprimer la dernière note'],
    DELETE_ALL_NOTES: ['supprimer toutes les notes', 'tout effacer'],
    STOP_LISTENING: ['arrêter d\'écouter', 'stop']
  },
  // German
  'de-DE': {
    NEW_NOTE: ['neue notiz'],
    SAVE_NOTE: ['notiz speichern', 'speichern'],
    CLEAR_TEXT: ['text löschen', 'notiz löschen'],
    READ_NOTES: ['notizen lesen', 'lese meine notizen'],
    DELETE_LAST_NOTE: ['letzte notiz löschen'],
    DELETE_ALL_NOTES: ['alle notizen löschen', 'alles löschen'],
    STOP_LISTENING: ['aufhören zuzuhören', 'stop']
  },
  // Italian
  'it-IT': {
    NEW_NOTE: ['nuova nota'],
    SAVE_NOTE: ['salva nota', 'salva questo'],
    CLEAR_TEXT: ['cancella testo', 'cancella nota'],
    READ_NOTES: ['leggi note', 'leggi le mie note'],
    DELETE_LAST_NOTE: ['elimina ultima nota', 'cancella ultima nota'],
    DELETE_ALL_NOTES: ['elimina tutte le note', 'cancella tutto'],
    STOP_LISTENING: ['smetti di ascoltare', 'stop voce']
  },
  // Portuguese
  'pt-BR': {
    NEW_NOTE: ['nova nota'],
    SAVE_NOTE: ['salvar nota', 'salvar isso'],
    CLEAR_TEXT: ['limpar texto', 'apagar nota'],
    READ_NOTES: ['ler notas', 'ler minhas notas'],
    DELETE_LAST_NOTE: ['apagar última nota', 'excluir última nota'],
    DELETE_ALL_NOTES: ['apagar todas as notas', 'excluir tudo'],
    STOP_LISTENING: ['parar de ouvir', 'parar voz']
  },
  // Russian
  'ru-RU': {
    NEW_NOTE: ['новая заметка'],
    SAVE_NOTE: ['сохранить заметку', 'сохранить'],
    CLEAR_TEXT: ['очистить текст', 'удалить текст'],
    READ_NOTES: ['прочитать заметки', 'читай'],
    DELETE_LAST_NOTE: ['удалить последнюю заметку'],
    DELETE_ALL_NOTES: ['удалить все заметки', 'очистить все'],
    STOP_LISTENING: ['перестать слушать', 'стоп']
  },
  // Chinese (Simplified)
  'zh-CN': {
    NEW_NOTE: ['新笔记', '新建笔记'],
    SAVE_NOTE: ['保存笔记', '保存这个'],
    CLEAR_TEXT: ['清除文本', '清空笔记'],
    READ_NOTES: ['读取笔记', '读我的笔记'],
    DELETE_LAST_NOTE: ['删除最后一条笔记', '删除上一条'],
    DELETE_ALL_NOTES: ['删除所有笔记', '清空所有'],
    STOP_LISTENING: ['停止倾听', '停止录音']
  },
  // Japanese
  'ja-JP': {
    NEW_NOTE: ['新しいメモ'],
    SAVE_NOTE: ['メモを保存', '保存して'],
    CLEAR_TEXT: ['テキストをクリア', 'メモを消去'],
    READ_NOTES: ['メモを読む', '読んで'],
    DELETE_LAST_NOTE: ['最後のメモを削除'],
    DELETE_ALL_NOTES: ['すべてのメモを削除', 'すべて消去'],
    STOP_LISTENING: ['リスニングを停止', 'ストップ']
  },
  // Arabic
  'ar-SA': {
    NEW_NOTE: ['ملاحظة جديدة'],
    SAVE_NOTE: ['حفظ الملاحظة', 'احفظ هذا'],
    CLEAR_TEXT: ['مسح النص', 'مسح الملاحظة'],
    READ_NOTES: ['قراءة الملاحظات', 'اقرأ'],
    DELETE_LAST_NOTE: ['حذف آخر ملاحظة'],
    DELETE_ALL_NOTES: ['حذف جميع الملاحظات', 'مسح الكل'],
    STOP_LISTENING: ['توقف عن الاستماع', 'توقف']
  }
};

export const getCommandType = (transcript: string, language: string): CommandType | null => {
  if (!transcript) return null;
  
  const lowerText = transcript.toLowerCase();
  
  // Get dictionary for the current language, default to English if not found
  const dict = commandDictionaries[language] || commandDictionaries['en-US'];
  
  // Check against current language first
  for (const [command, keywords] of Object.entries(dict)) {
    if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      return command as CommandType;
    }
  }

  // Fallback: Check English commands just in case the user speaks English while in another language
  if (language !== 'en-US') {
    const enDict = commandDictionaries['en-US'];
    for (const [command, keywords] of Object.entries(enDict)) {
      if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
        return command as CommandType;
      }
    }
  }

  return null;
};
