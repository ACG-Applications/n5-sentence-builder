// ==================== HELPER FUNCTIONS ====================
// These functions are for the main app (index.html only)
// They safely check for required globals before executing

function loadMastered() {
  if (typeof masteredSet === 'undefined') return;
  const stored = localStorage.getItem("n5_mastered");
  if (stored) masteredSet = new Set(JSON.parse(stored));
}

function saveMastered() {
  if (typeof masteredSet === 'undefined' || typeof updateStats !== 'function') return;
  localStorage.setItem("n5_mastered", JSON.stringify([...masteredSet]));
  updateStats();
}

function toggleMastered(idx) {
  if (typeof masteredSet === 'undefined' || typeof renderSentences !== 'function') return;
  if (masteredSet.has(idx)) {
    masteredSet.delete(idx);
  } else {
    masteredSet.add(idx);
  }
  saveMastered();
  renderSentences();
}

function resetMastered() {
  if (typeof masteredSet === 'undefined' || typeof renderSentences !== 'function') return;
  masteredSet.clear();
  saveMastered();
  renderSentences();
}

function updateStats() {
  if (typeof sprints === 'undefined' || typeof activeSprintIndex === 'undefined') return;
  if (typeof masteredSet === 'undefined') return;
  const {start, end} = sprints[activeSprintIndex];
  let total = end - start + 1, cnt = 0;
  for (let i = start; i <= end; i++) if (masteredSet.has(i)) cnt++;
  const statsEl = document.getElementById("masteredStats");
  if (statsEl) statsEl.innerHTML = `📊 Mastered: ${cnt} / ${total}`;
}

function getCurrentSprintSentences() {
  if (typeof sprints === 'undefined' || typeof activeSprintIndex === 'undefined') return [];
  if (typeof masteredSet === 'undefined') return [];
  const {start, end} = sprints[activeSprintIndex];
  const sentences = [];
  for (let i = start; i <= end; i++) {
    if (typeof showMastered === 'undefined' || showMastered || !masteredSet.has(i)) {
      sentences.push(sentencesData[i]);
    }
  }
  return sentences;
}

function getSprintName() {
  if (typeof sprints === 'undefined' || typeof activeSprintIndex === 'undefined') return "";
  return sprints[activeSprintIndex].name;
}

function getPlainJapanese(sentence) {
  if (!sentence || !sentence.jp) return "";
  return sentence.jp.replace(/[（(][^）)]*[）)]/g, '').trim();
}

// ==================== ENHANCED DICTIONARY LOOKUP ====================

// List of particles for detection
const PARTICLES = ['は', 'が', 'を', 'に', 'へ', 'で', 'と', 'も', 'か', 'よ', 'ね', 'から', 'まで', 'より', 'くらい', 'ごろ', 'だけ', 'ほど', 'の', 'には', 'や'];

// Common words that might appear in different forms
const COMMON_WORDS = {
  '中止': '中止',
  'です': 'です',
  'ます': 'ます',
  'した': 'した',
  'て': 'て',
  'た': 'た',
  'ない': 'ない',
  'なる': 'なる',
};

/**
 * Get meaning for a single word from wordDict
 * Enhanced to handle particles and common word forms
 */
function getSingleWordMeaning(word) {
  const dict = window.wordDict || null;
  if (!dict) return null;
  
  if (!word) return null;
  let cleanWord = word.trim();
  if (!cleanWord) return null;
  
  // ===== 1. EXACT MATCH =====
  if (dict[cleanWord]) {
    return dict[cleanWord].meaning;
  }
  
  // ===== 2. CHECK COMMON WORDS FIRST =====
  for (const [key, value] of Object.entries(COMMON_WORDS)) {
    if (cleanWord === key || cleanWord.includes(key)) {
      if (dict[value]) {
        return dict[value].meaning;
      }
    }
  }
  
  // ===== 3. REMOVE FURIGANA MARKERS =====
  let strippedWord = cleanWord.replace(/[（(][^）)]*[）)]/g, '').trim();
  if (strippedWord && dict[strippedWord]) {
    return dict[strippedWord].meaning;
  }
  
  // ===== 4. CHECK IF IT'S A PARTICLE =====
  for (const particle of PARTICLES) {
    if (cleanWord === particle || strippedWord === particle) {
      if (dict[particle]) {
        return dict[particle].meaning;
      }
    }
    // Check if word ends with a particle
    if (cleanWord.endsWith(particle) && cleanWord.length > particle.length) {
      const base = cleanWord.slice(0, -particle.length);
      if (dict[base]) {
        return dict[base].meaning;
      }
      if (dict[cleanWord]) {
        return dict[cleanWord].meaning;
      }
    }
    // Check if stripped word ends with a particle
    if (strippedWord.endsWith(particle) && strippedWord.length > particle.length) {
      const base = strippedWord.slice(0, -particle.length);
      if (dict[base]) {
        return dict[base].meaning;
      }
    }
  }
  
  // ===== 5. CHECK FOR COMMON SUFFIXES =====
  const suffixes = ['い', 'な', 'ます', 'です', 'した', 'て', 'た', 'る', 'う', 'く', 'む', 'ぶ', 'ぬ', 'ぐ', 'す', 'れる', 'られる'];
  for (const suffix of suffixes) {
    if (strippedWord.endsWith(suffix) && strippedWord.length > suffix.length) {
      const base = strippedWord.slice(0, -suffix.length);
      if (dict[base]) {
        return dict[base].meaning;
      }
      if (dict[base + 'る']) {
        return dict[base + 'る'].meaning;
      }
      if (dict[base + 'う']) {
        return dict[base + 'う'].meaning;
      }
      if (dict[base + 'く']) {
        return dict[base + 'く'].meaning;
      }
    }
  }
  
  // ===== 6. CHECK FOR VERB STEMS =====
  // Common verb stems that might appear without endings
  const verbStems = ['行き', '見', '食べ', '飲み', '読み', '書き', '聞き', '話し', '買い', '売り', '作り', '使い', '待ち', '持ち', '渡し', '曲がり', '止まり', '入り', '出', '上がり', '下がり', '寝', '起き', '浴び', '磨き', '洗い', '泳ぎ', '走り', '飛び', '立ち', '座り', '知り', '教え', '習い', '見せ', '弾き', '引き'];
  for (const stem of verbStems) {
    if (strippedWord === stem || cleanWord === stem || strippedWord.startsWith(stem) || cleanWord.startsWith(stem)) {
      // Try to find the dictionary form
      if (dict[stem + 'る']) {
        return dict[stem + 'る'].meaning;
      }
      if (dict[stem + 'く']) {
        return dict[stem + 'く'].meaning;
      }
      if (dict[stem + 'う']) {
        return dict[stem + 'う'].meaning;
      }
      if (dict[stem]) {
        return dict[stem].meaning;
      }
    }
  }
  
  // ===== 7. PARTIAL MATCH =====
  const sortedKeys = Object.keys(dict).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (key.length > 1 && (strippedWord.includes(key) || cleanWord.includes(key))) {
      return dict[key].meaning;
    }
  }
  
  // ===== 8. SINGLE CHARACTER LOOKUP =====
  const chars = strippedWord.split('');
  for (const char of chars) {
    if (dict[char]) {
      return dict[char].meaning;
    }
  }
  
  // ===== 9. CHECK IF IT'S A NUMBER =====
  const numbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千', '万', '零'];
  for (const num of numbers) {
    if (strippedWord === num || cleanWord === num || strippedWord.includes(num)) {
      if (dict[num]) return dict[num].meaning;
    }
  }
  
  return null;
}

// ==================== TOOLTIP HELPERS (GLOBAL) ====================

/**
 * Get word meanings for a sentence from wordDict
 * @param {Object} sentence - Sentence object with .jp property
 * @returns {Array} Array of {word, meaning} objects
 */
function getWordMeaningsForSentence(sentence) {
  if (!sentence || !sentence.jp) return [];
  
  // If sentence already has wordMeanings, use them
  if (sentence.wordMeanings && sentence.wordMeanings.length > 0) {
    return sentence.wordMeanings;
  }
  
  // Get dictionary from global scope
  const dict = window.wordDict || null;
  if (!dict) return [];
  
  const meanings = [];
  const words = sentence.jp.split(/\s+/);
  
  for (const word of words) {
    const cleanWord = word.replace(/[（(][^）)]*[）)]/g, '').trim();
    let meaning = null;
    let wordKey = cleanWord;
    
    // Try enhanced lookup
    meaning = getSingleWordMeaning(word);
    
    if (!meaning) {
      // Try with the original word
      meaning = getSingleWordMeaning(word);
    }
    
    if (!meaning) {
      // Try partial match - check if word contains any dictionary key
      const sortedKeys = Object.keys(dict).sort((a, b) => b.length - a.length);
      for (const key of sortedKeys) {
        if (key.length > 1 && cleanWord.includes(key)) {
          meaning = dict[key].meaning;
          wordKey = key;
          break;
        }
      }
    }
    
    if (meaning) {
      meanings.push({ word: wordKey, meaning: meaning });
    } else {
      // No meaning found - try to get from individual characters
      let found = false;
      const chars = cleanWord.split('');
      for (const char of chars) {
        if (dict[char]) {
          meanings.push({ word: char, meaning: dict[char].meaning });
          found = true;
          break;
        }
      }
      if (!found) {
        // Try one more time with the original word
        const originalMeaning = getSingleWordMeaning(word);
        if (originalMeaning) {
          meanings.push({ word: word, meaning: originalMeaning });
        } else {
          // Still nothing - add as unknown
          meanings.push({ word: cleanWord, meaning: '?' });
        }
      }
    }
  }
  
  // If we still have no meanings, try a different approach
  if (meanings.length === 0) {
    for (const word of words) {
      const cleanWord = word.replace(/[（(][^）)]*[）)]/g, '').trim();
      // Try to match any part of the word
      for (const [key, value] of Object.entries(dict)) {
        if (cleanWord.includes(key) && key.length > 1) {
          meanings.push({ word: key, meaning: value.meaning });
          break;
        }
      }
    }
  }
  
  sentence.wordMeanings = meanings;
  return meanings;
}

/**
 * Create HTML with word tooltips for quiz sentences
 * @param {string} text - The sentence text
 * @param {Array} wordMeanings - Array of {word, meaning} objects
 * @returns {string} HTML with tooltips
 */
function createQuizWordTooltips(text, wordMeanings) {
  if (!text) return '';
  if (!wordMeanings || !wordMeanings.length) {
    // Still wrap furigana even without tooltips
    return text.replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)（([^（）]+)）/g, (_, kanji, furigana) => 
      `<ruby>${kanji}<rt>${furigana}</rt></ruby>`
    );
  }
  
  const words = text.split(/\s+/);
  let result = '';
  let usedMeanings = [];
  
  for (const word of words) {
    const cleanWord = word.replace(/[（(][^）)]*[）)]/g, '').trim();
    let meaning = '';
    let found = false;
    
    // Try to find meaning for this word
    for (let j = 0; j < wordMeanings.length; j++) {
      if (usedMeanings.includes(j)) continue;
      const w = wordMeanings[j];
      const cleanW = w.word ? w.word.replace(/[（(][^）)]*[）)]/g, '').trim() : '';
      if (cleanW === cleanWord || w.word === word || cleanW === word || cleanWord.includes(cleanW) || cleanW.includes(cleanWord)) {
        meaning = w.meaning || w.meaning_en || '';
        usedMeanings.push(j);
        found = true;
        break;
      }
    }
    
    // If not found, try partial match
    if (!found) {
      for (let j = 0; j < wordMeanings.length; j++) {
        if (usedMeanings.includes(j)) continue;
        const w = wordMeanings[j];
        const cleanW = w.word ? w.word.replace(/[（(][^）)]*[）)]/g, '').trim() : '';
        if (cleanW && (cleanWord.includes(cleanW) || cleanW.includes(cleanWord))) {
          meaning = w.meaning || w.meaning_en || '';
          usedMeanings.push(j);
          found = true;
          break;
        }
      }
    }
    
    // If still not found, try to get meaning directly
    if (!found) {
      const directMeaning = getSingleWordMeaning(word);
      if (directMeaning) {
        meaning = directMeaning;
        found = true;
      } else {
        const cleanMeaning = getSingleWordMeaning(cleanWord);
        if (cleanMeaning) {
          meaning = cleanMeaning;
          found = true;
        }
      }
    }
    
    // Build the word with furigana
    let displayWord = word;
    displayWord = displayWord.replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)（([^（）]+)）/g, (_, kanji, furigana) => 
      `<ruby>${kanji}<rt>${furigana}</rt></ruby>`
    );
    displayWord = displayWord.replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)\(([^()]+)\)/g, (_, kanji, furigana) => 
      `<ruby>${kanji}<rt>${furigana}</rt></ruby>`
    );
    
    if (meaning) {
      // Check if this word contains a particle
      const particleMatch = word.match(/^(.*?)([はがをにでへとかからまでのもよねや])$/);
      if (particleMatch) {
        const before = particleMatch[1];
        const particle = particleMatch[2];
        let beforeHtml = before;
        beforeHtml = beforeHtml.replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)（([^（）]+)）/g, (_, kanji, furigana) => 
          `<ruby>${kanji}<rt>${furigana}</rt></ruby>`
        );
        beforeHtml = beforeHtml.replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)\(([^()]+)\)/g, (_, kanji, furigana) => 
          `<ruby>${kanji}<rt>${furigana}</rt></ruby>`
        );
        result += `<span class="word-tooltip">${beforeHtml}<span class="particle-highlight">${particle}</span><span class="tooltip-text">${meaning}</span></span> `;
      } else {
        result += `<span class="word-tooltip">${displayWord}<span class="tooltip-text">${meaning}</span></span> `;
      }
    } else {
      // Check if this word contains a particle
      const particleMatch = word.match(/^(.*?)([はがをにでへとかからまでのもよねや])$/);
      if (particleMatch) {
        const before = particleMatch[1];
        const particle = particleMatch[2];
        let beforeHtml = before;
        beforeHtml = beforeHtml.replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)（([^（）]+)）/g, (_, kanji, furigana) => 
          `<ruby>${kanji}<rt>${furigana}</rt></ruby>`
        );
        beforeHtml = beforeHtml.replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)\(([^()]+)\)/g, (_, kanji, furigana) => 
          `<ruby>${kanji}<rt>${furigana}</rt></ruby>`
        );
        result += `${beforeHtml}<span class="particle-highlight">${particle}</span> `;
      } else {
        result += `${displayWord} `;
      }
    }
  }
  
  return result.trim();
}

/**
 * Add long press support for mobile devices
 * @param {HTMLElement} element - The element to add support to
 */
function addLongPressSupport(element) {
  if (!element) return;
  
  let timer = null;
  let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isTouchDevice) {
    element.addEventListener('touchstart', function(e) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        this.classList.toggle('active');
        this.classList.toggle('touched');
        timer = null;
      }, 500);
    });
    
    element.addEventListener('touchend', function(e) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      setTimeout(() => {
        this.classList.remove('active');
        this.classList.remove('touched');
      }, 3000);
    });
    
    element.addEventListener('touchmove', function(e) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    });
  } else {
    element.addEventListener('click', function(e) {
      this.classList.toggle('active');
      setTimeout(() => {
        this.classList.remove('active');
      }, 3000);
    });
  }
}

/**
 * Attach tooltips to a container
 * @param {HTMLElement} container - The container element
 */
function attachTooltipsToContainer(container) {
  if (!container) return;
  
  // Find all word-tooltip elements in the container
  const tooltips = container.querySelectorAll('.word-tooltip');
  tooltips.forEach(el => {
    addLongPressSupport(el);
  });
}

/**
 * Attach tooltip long press support to a container
 * @param {HTMLElement} container - The container element
 */
function attachTooltipLongPress(container) {
  if (!container) return;
  attachTooltipsToContainer(container);
}

/**
 * Global function to attach tooltips to quiz area
 * This is called after rendering quiz content
 */
function attachQuizTooltipsGlobal() {
  if (typeof attachQuizTooltips === 'function') {
    attachQuizTooltips();
  } else {
    // Fallback: try to attach to quiz area directly
    const quizArea = document.getElementById('quizArea');
    if (quizArea) {
      attachTooltipsToContainer(quizArea);
    }
    // Also attach to any word-tooltip elements
    document.querySelectorAll('.word-tooltip').forEach(el => {
      addLongPressSupport(el);
    });
  }
}

/**
 * Attach quiz tooltips (alias for attachQuizTooltipsGlobal)
 */
function attachQuizTooltips() {
  attachQuizTooltipsGlobal();
}

/**
 * Inject word meanings into all sentences
 * This pre-computes meanings for better performance
 */
function injectWordMeanings() {
  if (typeof sentencesData === 'undefined') {
    console.warn('⚠️ sentencesData not found');
    return;
  }
  if (typeof getWordMeaningsForSentence !== 'function') {
    console.warn('⚠️ getWordMeaningsForSentence not found');
    return;
  }
  
  let foundCount = 0;
  let totalWords = 0;
  let missingWords = [];
  
  for (const sentence of sentencesData) {
    if (!sentence.wordMeanings) {
      const meanings = getWordMeaningsForSentence(sentence);
      sentence.wordMeanings = meanings;
      totalWords += meanings.length;
      const found = meanings.filter(m => m && m.meaning && m.meaning !== '?').length;
      foundCount += found;
      
      // Track missing words
      for (let i = 0; i < meanings.length; i++) {
        if (!meanings[i] || !meanings[i].meaning || meanings[i].meaning === '?') {
          const parts = sentence.jp.split(/\s+/);
          if (parts[i]) {
            const clean = parts[i].replace(/[（(][^）)]*[）)]/g, '').trim();
            if (clean && !missingWords.includes(clean)) {
              missingWords.push(clean);
            }
          }
        }
      }
    }
  }
  
  const percent = totalWords > 0 ? Math.round(foundCount/totalWords*100) : 0;
  console.log(`📚 Injected word meanings: ${foundCount}/${totalWords} words found (${percent}%)`);
  
  if (missingWords.length > 0 && missingWords.length < 50) {
    console.log('📝 Missing words to add to wordDict:', missingWords.join(', '));
  } else if (missingWords.length > 0) {
    console.log(`📝 ${missingWords.length} missing words (too many to list)`);
  }
}

// Auto-inject word meanings when the page loads
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      if (typeof injectWordMeanings === 'function') {
        injectWordMeanings();
      }
      if (typeof attachQuizTooltipsGlobal === 'function') {
        attachQuizTooltipsGlobal();
      }
    }, 300);
  });
}

// Make helper functions globally available
if (typeof window !== 'undefined') {
  window.loadMastered = loadMastered;
  window.saveMastered = saveMastered;
  window.toggleMastered = toggleMastered;
  window.resetMastered = resetMastered;
  window.updateStats = updateStats;
  window.getCurrentSprintSentences = getCurrentSprintSentences;
  window.getSprintName = getSprintName;
  window.getPlainJapanese = getPlainJapanese;
  window.getWordMeaningsForSentence = getWordMeaningsForSentence;
  window.createQuizWordTooltips = createQuizWordTooltips;
  window.addLongPressSupport = addLongPressSupport;
  window.attachTooltipsToContainer = attachTooltipsToContainer;
  window.attachTooltipLongPress = attachTooltipLongPress;
  window.attachQuizTooltipsGlobal = attachQuizTooltipsGlobal;
  window.attachQuizTooltips = attachQuizTooltips;
  window.injectWordMeanings = injectWordMeanings;
  window.getSingleWordMeaning = getSingleWordMeaning;
}

console.log('🔧 Tooltips module loaded');