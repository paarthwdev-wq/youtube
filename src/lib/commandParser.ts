import { ParsedCommand } from '../types';

/**
 * Normalizes Devanagari numerals to standard digits:
 * ०-९ -> 0-9
 */
export function convertDevanagariNumerals(text: string): string {
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  let result = text;
  for (let i = 0; i < devanagariDigits.length; i++) {
    result = result.split(devanagariDigits[i]).join(String(i));
  }
  return result;
}

/**
 * Converts Hindi and English spoken number words to standard decimal format:
 * e.g. "two point five" -> "2.5", "दो पॉइंट पांच" -> "2.5", "डेढ़" -> "1.5", "ढाई" -> "2.5"
 */
export function convertSpokenNumbersToDigits(text: string): string {
  let s = text.toLowerCase();

  // Spoken fractions in Hindi
  s = s.replace(/(?:^|\s)(?:डेढ़|dedh|dhedh)(?=\s|$)/gi, ' 1.5 ');
  s = s.replace(/(?:^|\s)(?:ढाई|dhai|dhaai)(?=\s|$)/gi, ' 2.5 ');
  s = s.replace(/(?:^|\s)(?:सवा|sawa)(?=\s|$)/gi, ' 1.25 ');

  // Convert decimal connectors: "point", "पॉइंट", "दशमलव", "dot"
  s = s.replace(/\s*(point|पॉइंट|दशमलव|dot|\.)\s*/gi, '.');

  // Specific common spoken decimals
  s = s.replace(/(?:^|\s)(?:दो|two)\s*\.\s*(?:पांच|पाँच|five|5)(?=\s|$)/gi, ' 2.5 ');
  s = s.replace(/(?:^|\s)(?:एक|one)\s*\.\s*(?:पांच|पाँच|five|5)(?=\s|$)/gi, ' 1.5 ');
  s = s.replace(/(?:^|\s)(?:दो|two)\s*\.\s*(?:शून्य|zero|0)(?=\s|$)/gi, ' 2.0 ');
  s = s.replace(/(?:^|\s)(?:एक|one)\s*\.\s*(?:शून्य|zero|0)(?=\s|$)/gi, ' 1.0 ');
  s = s.replace(/(?:^|\s)(?:तीन|three)\s*\.\s*(?:शून्य|zero|0)(?=\s|$)/gi, ' 3.0 ');
  s = s.replace(/(?:^|\s)(?:शून्य|zero)\s*\.\s*(?:पांच|पाँच|five|5)(?=\s|$)/gi, ' 0.5 ');

  // Hindi spoken word replacements (DO NOT replace bare "दो" if preceded by verb words like चला, रोक, बढ़ा, कर, etc.)
  const wordMap: Record<string, string> = {
    'शून्य': '0', 'zero': '0',
    'एक': '1', 'one': '1',
    'तीन': '3', 'three': '3',
    'चार': '4', 'four': '4',
    'पांच': '5', 'पाँच': '5', 'five': '5',
    'छह': '6', 'छः': '6', 'six': '6',
    'सात': '7', 'seven': '7',
    'आठ': '8', 'eight': '8',
    'नौ': '9', 'nine': '9',
    'दस': '10', 'ten': '10',
    'बीस': '20', 'twenty': '20',
    'तीस': '30', 'thirty': '30',
    'चालीस': '40', 'forty': '40',
    'पचास': '50', 'fifty': '50',
    'साठ': '60', 'sixty': '60',
    'सत्तर': '70', 'seventy': '70',
    'अस्सी': '80', 'eighty': '80',
    'नब्बे': '90', 'ninety': '90',
    'सौ': '100', 'hundred': '100',
    'two': '2'
  };

  // Replace words (using regex that handles unicode boundaries)
  for (const [word, digit] of Object.entries(wordMap)) {
    const reg = new RegExp(`(?:^|\\s)${word}(?=\\s|$)`, 'gi');
    s = s.replace(reg, ` ${digit} `);
  }

  // Handle "दो" as number 2 ONLY when at start of string or preceded by number/speed/volume context, NOT after verbs
  s = s.replace(/(^|speed|स्पीड|volume|आवाज|percent|प्रतिशत|\b)\s*दो\s*(speed|स्पीड|x|पॉइंट|\.|$)/gi, '$1 2 $2');

  // Clean patterns like "2 . 5" to "2.5"
  s = s.replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2');

  return s;
}

/**
 * Normalizes input speech string by cleaning symbols, trimming, and unifying representations.
 */
export function normalizeSpeech(raw: string): string {
  if (!raw) return '';
  let str = raw.trim().toLowerCase();
  str = convertDevanagariNumerals(str);
  str = convertSpokenNumbersToDigits(str);

  // Remove common punctuation except decimal dot
  str = str.replace(/[!?,;:_~`'"()\[\]{}]/g, ' ');

  // Strip common conversational fillers at word boundaries (supports Unicode/Devanagari)
  // e.g. "भाई", "जरा", "bhai", "zara", "please", "kripya", "कृपया", "yaar", "यार"
  str = str.replace(/(?:^|\s+)(?:भाई|bhai|bro|yaar|यार|कृपया|kripya|please|जरा|zara)(?=\s+|$)/gi, ' ');

  // Compress multiple spaces
  str = str.replace(/\s+/g, ' ').trim();

  return str;
}

/**
 * Extracts a numeric value for volume from text (e.g. "volume 70", "आवाज 50 करो")
 */
function extractVolumeNumber(text: string): number | null {
  // Check for volume followed or preceded by numbers
  const volMatches = [
    /(?:volume|awaaz|आवाज|sound|वॉल्यूम)\s*(?:ko|par|pe|का|पर|को)?\s*(\d{1,3})(?:\s*|%|प्रतिशत|percent)?/i,
    /(\d{1,3})\s*(?:%|प्रतिशत|percent)\s*(?:volume|awaaz|आवाज|sound)?/i,
    /(?:volume|awaaz|आवाज|sound)\s*(\d{1,3})/i,
    /(\d{1,3})\s*(?:volume|awaaz|आवाज|sound)/i
  ];

  for (const rx of volMatches) {
    const m = text.match(rx);
    if (m && m[1]) {
      const val = parseInt(m[1], 10);
      if (!isNaN(val) && val >= 0 && val <= 100) {
        return val;
      }
    }
  }
  return null;
}

/**
 * Extracts a numeric speed value from text (e.g. "2.5", "2.5 speed", "स्पीड में 0.5")
 */
function extractSpeedNumber(text: string): number | null {
  // Matches standalone decimal numbers like 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 2, 3
  const rx = /\b(\d+(?:\.\d+)?)\s*(?:x|एक्स|speed|स्पीड)?\b/i;
  const m = text.match(rx);
  if (m && m[1]) {
    const val = parseFloat(m[1]);
    if (!isNaN(val) && val > 0 && val <= 4.0) {
      return val;
    }
  }
  return null;
}

/**
 * Primary Command Parsing Function
 */
export function parseVoiceCommand(rawText: string): ParsedCommand {
  const normalized = normalizeSpeech(rawText);

  if (!normalized) {
    return {
      intent: 'UNKNOWN',
      rawText,
      normalizedText: normalized,
      confidence: 0,
    };
  }

  // -------------------------------------------------------------
  // 1. Check for standalone speed numbers (CRITICAL REQUIREMENT)
  // e.g. "1.0", "1.5", "2.0", "2.5", "3.0", "0.5", "0.75", "1.25", "1.75", "2", "3"
  // -------------------------------------------------------------
  const standaloneSpeedMatch = normalized.match(/^(\d+(?:\.\d+)?)(?:\s*x)?$/);
  if (standaloneSpeedMatch) {
    const val = parseFloat(standaloneSpeedMatch[1]);
    if (!isNaN(val) && val > 0 && val <= 4.0) {
      return {
        intent: 'SET_SPEED',
        rawText,
        normalizedText: normalized,
        value: val,
        confidence: 0.98,
      };
    }
  }

  // -------------------------------------------------------------
  // 2. SPEED COMMANDS
  // -------------------------------------------------------------
  const hasSpeedWord = /(?:speed|स्पीड|playback speed|play speed|गति)/i.test(normalized);

  // Speed Number With Increase (e.g. "0.5 speed बढ़ाओ", "speed में 0.5 बढ़ाओ", "increase speed by 0.5")
  const speedIncreaseByRx = /(?:(\d+(?:\.\d+)?)\s*(?:speed|स्पीड)\s*(?:बढ़ाओ|बढ़ाओ|badhao|increase|up)|(?:speed|स्पीड)\s*(?:में|me)?\s*(\d+(?:\.\d+)?)\s*(?:बढ़ाओ|बढ़ाओ|badhao|increase|up))/i;
  const speedIncMatch = normalized.match(speedIncreaseByRx);
  if (speedIncMatch) {
    const valStr = speedIncMatch[1] || speedIncMatch[2];
    const amount = parseFloat(valStr);
    if (!isNaN(amount) && amount > 0) {
      return {
        intent: 'SPEED_UP',
        rawText,
        normalizedText: normalized,
        amount: amount,
        confidence: 0.95,
      };
    }
  }

  // Speed Number With Set (e.g. "2.5 speed", "2.5 स्पीड", "2.5 speed पर कर दो", "set speed 2.5", "speed 2.5 karo")
  if (hasSpeedWord) {
    const speedSetRx = /(?:(?:ise|isko|video|इसे|इसको|वीडियो)?\s*(\d+(?:\.\d+)?)\s*(?:speed|स्पीड)(?:\s*(?:par|pe|kar do|kardo|rakho|पर|पे|कर दो|करो|रखो))?|(?:set\s*speed|speed|स्पीड)\s*(?:to|par|pe|पर|पे|को|ko)?\s*(\d+(?:\.\d+)?))/i;
    const speedSetMatch = normalized.match(speedSetRx);
    if (speedSetMatch) {
      const valStr = speedSetMatch[1] || speedSetMatch[2];
      const val = parseFloat(valStr);
      if (!isNaN(val) && val > 0 && val <= 4.0) {
        return {
          intent: 'SET_SPEED',
          rawText,
          normalizedText: normalized,
          value: val,
          confidence: 0.96,
        };
      }
    }

    // Incremental speed up ("speed बढ़ाओ", "स्पीड बढ़ाओ", "speed up", "और speed बढ़ाओ", "speed थोड़ी बढ़ाओ")
    if (/(?:(?:aur|thodi|thoda|or|और|थोड़ी|थोड़ी|जरा|zara)?\s*(?:speed|स्पीड|playback speed)\s*(?:aur|thodi|thoda|or|और|थोड़ी|थोड़ी|जरा|zara)?\s*(?:बढ़ाओ|बढ़ाओ|बढ़ा दो|badhao|badha do|badha|up|badhaao|badhaiye)|speed\s*up|fast\s*karo|tez\s*karo|तेज\s*करो)/i.test(normalized)) {
      return {
        intent: 'SPEED_UP',
        rawText,
        normalizedText: normalized,
        amount: 0.25,
        confidence: 0.92,
      };
    }

    // Incremental speed down ("speed कम करो", "स्पीड कम करो", "speed घटाओ", "slow करो", "playback speed कम करो")
    if (/(?:(?:speed|स्पीड|playback speed)\s*(?:कम\s*करो|कम|ghatao|ghata do|घटाओ|kam\s*karo|kam|down|slow)|speed\s*down|slow\s*karo|धीमे\s*करो|धीमी\s*करो)/i.test(normalized)) {
      return {
        intent: 'SPEED_DOWN',
        rawText,
        normalizedText: normalized,
        amount: 0.25,
        confidence: 0.92,
      };
    }
  }

  // -------------------------------------------------------------
  // 3. VOLUME COMMANDS
  // -------------------------------------------------------------
  const hasVolumeWord = /(?:volume|sound|awaaz|awaz|आवाज|आवाज़|ध्वनि|वॉल्यूम)/i.test(normalized);

  // Exact volume: "आवाज 50 करो", "volume 70", "आवाज 80 प्रतिशत", "awaaz 60 karo"
  if (hasVolumeWord || /\b\d{1,3}\s*(?:%|प्रतिशत|percent)\b/i.test(normalized)) {
    const exactVol = extractVolumeNumber(normalized);
    if (exactVol !== null) {
      return {
        intent: 'SET_VOLUME',
        rawText,
        normalizedText: normalized,
        value: exactVol,
        confidence: 0.95,
      };
    }

    // Volume Up: "आवाज बढ़ाओ", "आवाज बढ़ा दो", "और आवाज बढ़ाओ", "volume up", "increase sound", "awaaz badhao", "sound बढ़ाओ"
    if (/(?:(?:aur|thodi|or|और|जरा|zara|thoda|जरा सा)?\s*(?:volume|sound|awaaz|awaz|आवाज|आवाज़)\s*(?:बढ़ाओ|बढ़ाओ|बढ़ा दो|बढ़ा दो|badhao|badha do|badha|badhaiye|up|tez|jyada|ज्यादा)|volume\s*up|increase\s*(?:volume|sound)|awaaz\s*badhao)/i.test(normalized)) {
      return {
        intent: 'VOLUME_UP',
        rawText,
        normalizedText: normalized,
        amount: 10,
        confidence: 0.94,
      };
    }

    // Volume Down: "आवाज कम करो", "आवाज कम", "volume down", "decrease volume", "lower volume", "sound कम करो", "awaaz kam karo"
    if (/(?:(?:aur|thodi|or|और|जरा|zara|thoda)?\s*(?:volume|sound|awaaz|awaz|आवाज|आवाज़)\s*(?:कम\s*करो|कम|कम कर दो|kam\s*karo|kam|ghatao|घटाओ|घटा दो|down|low|dheemi)|volume\s*down|decrease\s*(?:volume|sound)|lower\s*volume|awaaz\s*kam\s*karo)/i.test(normalized)) {
      return {
        intent: 'VOLUME_DOWN',
        rawText,
        normalizedText: normalized,
        amount: 10,
        confidence: 0.94,
      };
    }

    // Volume mute via "आवाज बंद करो" / "sound बंद करो"
    if (/(?:आवाज|आवाज़|sound|awaaz)\s*(?:बंद\s*करो|बंद|band\s*karo|band|off)/i.test(normalized)) {
      return {
        intent: 'MUTE',
        rawText,
        normalizedText: normalized,
        confidence: 0.95,
      };
    }

    // Volume unmute via "आवाज चालू करो" / "sound चालू करो"
    if (/(?:आवाज|आवाज़|sound|awaaz)\s*(?:वापस\s*)?(?:चालू\s*करो|चालू|chalu\s*karo|chalu|on)/i.test(normalized)) {
      return {
        intent: 'UNMUTE',
        rawText,
        normalizedText: normalized,
        confidence: 0.95,
      };
    }
  }

  // -------------------------------------------------------------
  // 4. MUTE / UNMUTE DIRECT COMMANDS
  // -------------------------------------------------------------
  // Unmute
  if (/(?:^|\s)(?:unmute|अनम्यूट|unmute\s*video|unmute\s*kar\s*do|unmute\s*कर\s*दो|sound\s*chalu|awaaz\s*chalu)(?:\s|$)/i.test(normalized)) {
    return {
      intent: 'UNMUTE',
      rawText,
      normalizedText: normalized,
      confidence: 0.96,
    };
  }

  // Mute
  if (/(?:^|\s)(?:mute|म्यूट|mute\s*video|mute\s*kar\s*do|म्यूट\s*कर\s*दो|sound\s*mute|sound\s*band)(?:\s|$)/i.test(normalized)) {
    return {
      intent: 'MUTE',
      rawText,
      normalizedText: normalized,
      confidence: 0.96,
    };
  }

  // -------------------------------------------------------------
  // 5. PAUSE COMMANDS
  // "रुको", "रोको", "रोक", "रोक दो", "पॉज़", "pause", "stop", "video rok do", "video roko", "video ruko"
  // NOTE: Must PAUSE YouTube, NEVER terminate the app!
  // -------------------------------------------------------------
  const pauseKeywords = [
    'pause',
    'pause video',
    'stop',
    'stop video',
    'रुको',
    'रोको',
    'रोक',
    'रोक दो',
    'पॉज़',
    'पॉज',
    'वीडियो रोक दो',
    'वीडियो रोको',
    'वीडियो रुको',
    'ruko',
    'roko',
    'rok do',
    'video rok do',
    'video roko',
    'pause karo',
    'rok do video',
    'rok lo'
  ];

  for (const kw of pauseKeywords) {
    const rx = new RegExp(`(?:^|\\b)${kw}(?:\\b|$)`, 'i');
    if (rx.test(normalized)) {
      return {
        intent: 'PAUSE',
        rawText,
        normalizedText: normalized,
        confidence: 0.95,
      };
    }
  }

  // -------------------------------------------------------------
  // 6. PLAY COMMANDS
  // "चलाओ", "चलो", "चला दो", "प्ले", "play", "start", "resume", "play video", "start video", "resume video"
  // "वीडियो चलाओ", "वीडियो चला दो", "फिर से चलाओ", "शुरू करो", "वीडियो शुरू करो"
  // "video chalao", "video chala do", "phir se chalao", "video start karo", "play karo"
  // -------------------------------------------------------------
  const playKeywords = [
    'play',
    'play video',
    'start',
    'start video',
    'resume',
    'resume video',
    'प्ले',
    'चलाओ',
    'चलो',
    'चला दो',
    'वीडियो चलाओ',
    'वीडियो चला दो',
    'फिर से चलाओ',
    'शुरू करो',
    'वीडियो शुरू करो',
    'video chalao',
    'video chala do',
    'phir se chalao',
    'video start karo',
    'play karo',
    'chalao',
    'chala do',
    'shuru karo',
    'chalu karo'
  ];

  for (const kw of playKeywords) {
    const rx = new RegExp(`(?:^|\\b)${kw}(?:\\b|$)`, 'i');
    if (rx.test(normalized)) {
      return {
        intent: 'PLAY',
        rawText,
        normalizedText: normalized,
        confidence: 0.95,
      };
    }
  }

  // -------------------------------------------------------------
  // 7. Fallback check for numbers with speed context
  // e.g. "speed 2", "speed 1.5", "गति 2.5"
  // -------------------------------------------------------------
  if (hasSpeedWord) {
    const anySpeedNum = extractSpeedNumber(normalized);
    if (anySpeedNum !== null) {
      return {
        intent: 'SET_SPEED',
        rawText,
        normalizedText: normalized,
        value: anySpeedNum,
        confidence: 0.90,
      };
    }
  }

  // -------------------------------------------------------------
  // 8. UNKNOWN / UNRELATED SPEECH REJECTION
  // e.g. "आज मौसम कैसा है?", "मुझे speed के बारे में बताओ", "hello"
  // -------------------------------------------------------------
  return {
    intent: 'UNKNOWN',
    rawText,
    normalizedText: normalized,
    confidence: 0,
  };
}
