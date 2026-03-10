// Google Translate informal API response shape
// Format: [[["translated","original",null,null,null,null,null,[]], ...], null, "detected_lang"]
export type GTranslateResponse = [
  [string, string, ...unknown[]][],
  unknown,
  string,
  ...unknown[],
];
