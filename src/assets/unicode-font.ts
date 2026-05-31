// Unicode font utilities for PDF generation
// This file provides system font configuration for Unicode support

export interface FontConfig {
  normal: string;
  bold: string;
  italics: string;
  bolditalics: string;
}

export const UNICODE_FONTS: Record<string, FontConfig> = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  },
  System: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  },
  ArialUnicode: {
    normal: 'Arial Unicode MS',
    bold: 'Arial Unicode MS',
    italics: 'Arial Unicode MS',
    bolditalics: 'Arial Unicode MS'
  }
};

export const isUnicodeText = (text: string): boolean => {
  return /[^\x00-\x7F]/.test(text);
};

export const selectFontForText = (text: string): string => {
  return isUnicodeText(text) ? 'ArialUnicode' : 'Roboto';
};
