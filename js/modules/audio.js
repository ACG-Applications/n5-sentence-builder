// ============================================================
// AUDIO MODULE - Text-to-Speech for Sentence Builder
// ============================================================

/**
 * AudioManager - Handles all TTS functionality
 * Uses the Web Speech API (SpeechSynthesis)
 */
class AudioManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.currentUtterance = null;
        this.isSpeaking = false;
        this.speed = 1.0;
        this.voice = null;
        this.voicesLoaded = false;
        this.japaneseVoices = [];
        
        // Bind methods
        this.speak = this.speak.bind(this);
        this.stop = this.stop.bind(this);
        this.setSpeed = this.setSpeed.bind(this);
        this.getVoices = this.getVoices.bind(this);
        
        // Load voices when available
        if (this.synth) {
            if (this.synth.getVoices().length > 0) {
                this.onVoicesLoaded();
            } else {
                this.synth.onvoiceschanged = () => {
                    this.onVoicesLoaded();
                };
            }
        }
    }

    /**
     * Called when voices are loaded
     */
    onVoicesLoaded() {
        const voices = this.synth.getVoices();
        console.log('🎤 TTS Voices loaded:', voices.length);
        
        // Find Japanese voices
        this.japaneseVoices = voices.filter(v => 
            v.lang.startsWith('ja') || 
            v.lang.includes('Japanese') ||
            v.name.includes('Japanese')
        );
        
        if (this.japaneseVoices.length > 0) {
            this.voice = this.japaneseVoices[0];
            console.log('🇯🇵 Japanese voice selected:', this.voice.name);
        } else {
            // Fallback: try to find any voice that supports Japanese
            for (const v of voices) {
                if (v.lang && (v.lang.startsWith('ja') || v.lang.includes('ja'))) {
                    this.voice = v;
                    console.log('🇯🇵 Japanese voice (fallback):', v.name);
                    break;
                }
            }
            
            // If still no Japanese voice, use default
            if (!this.voice && voices.length > 0) {
                this.voice = voices[0];
                console.log('🔊 Using default voice:', this.voice.name);
            }
        }
        
        this.voicesLoaded = true;
    }

    /**
     * Get available voices
     */
    getVoices() {
        if (this.synth) {
            return this.synth.getVoices();
        }
        return [];
    }

    /**
     * Set speech speed
     * @param {number} speed - 0.75, 1.0, or 1.5
     */
    setSpeed(speed) {
        this.speed = speed;
        console.log('🎤 TTS speed set to:', speed);
    }

    /**
     * Speak text using TTS
     * @param {string} text - The text to speak
     * @param {string} lang - Language code (default: 'ja-JP')
     * @param {number} rate - Speech rate (default: uses this.speed)
     * @param {Function} callback - Called when speech ends or fails
     */
    speak(text, lang = 'ja-JP', rate = null, callback = null) {
        if (!this.synth) {
            console.warn('⚠️ Speech synthesis not available');
            if (callback) callback(false);
            return;
        }

        // Stop any current speech
        this.stop();

        // Clean the text - remove furigana markers for TTS
        const cleanText = this.cleanTextForTTS(text);
        
        if (!cleanText || cleanText.trim().length === 0) {
            console.warn('⚠️ No text to speak');
            if (callback) callback(false);
            return;
        }

        try {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            
            // Set language
            utterance.lang = lang;
            
            // Set speed (use provided rate or default)
            utterance.rate = rate !== null ? rate : this.speed;
            
            // Set pitch - slightly higher for Japanese to sound more natural
            utterance.pitch = 1.0;
            
            // Set volume
            utterance.volume = 1.0;
            
            // Try to use Japanese voice
            if (this.voice && lang.startsWith('ja')) {
                utterance.voice = this.voice;
            } else if (this.voice) {
                utterance.voice = this.voice;
            }
            
            // Set callbacks
            utterance.onstart = () => {
                this.isSpeaking = true;
                this.currentUtterance = utterance;
                console.log('🔊 Speaking:', cleanText);
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                this.currentUtterance = null;
                console.log('🔊 Speech ended');
                if (callback) callback(true);
            };
            
            utterance.onerror = (event) => {
                this.isSpeaking = false;
                this.currentUtterance = null;
                console.error('❌ TTS Error:', event);
                if (callback) callback(false);
            };
            
            // Speak
            this.synth.speak(utterance);
            
        } catch (error) {
            console.error('❌ TTS Error:', error);
            this.isSpeaking = false;
            this.currentUtterance = null;
            if (callback) callback(false);
        }
    }

    /**
     * Clean text for TTS - remove furigana markers, keep only the reading
     * @param {string} text - The text to clean
     * @returns {string} - Clean text for TTS
     */
    cleanTextForTTS(text) {
        if (!text) return '';
        
        let cleaned = text;
        
        // Remove furigana markers: Kanji（ふりがな）or Kanji(ふりがな)
        // Keep only the kanji part for TTS
        // Actually, for TTS we want to keep the furigana readings when available
        // But we need to extract them properly
        
        // Pattern: Kanji（ふりがな）→ replace with ふりがな (the reading)
        cleaned = cleaned.replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)（([^（）]+)）/g, (_, kanji, furigana) => {
            return furigana;
        });
        
        // Pattern: Kanji(ふりがな) → replace with ふりがな
        cleaned = cleaned.replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)\(([^()]+)\)/g, (_, kanji, furigana) => {
            return furigana;
        });
        
        // Remove any remaining parentheses or brackets
        cleaned = cleaned.replace(/[（(][^）)]*[）)]/g, '');
        
        // Remove multiple spaces
        cleaned = cleaned.replace(/\s+/g, ' ');
        
        // Remove leading/trailing spaces
        cleaned = cleaned.trim();
        
        // If the text is empty, return original
        if (!cleaned) return text.replace(/[（(][^）)]*[）)]/g, '').trim();
        
        return cleaned;
    }

    /**
     * Speak a sentence (with context)
     * @param {string} sentenceJp - The Japanese sentence
     * @param {string} sentenceEn - The English translation (optional, for context)
     * @param {Function} callback - Called when speech ends
     */
    speakSentence(sentenceJp, sentenceEn = null, callback = null) {
        // Speak the Japanese sentence
        this.speak(sentenceJp, 'ja-JP', null, (success) => {
            if (callback) callback(success);
        });
    }

    /**
     * Speak a single word
     * @param {string} word - The word to speak
     * @param {Function} callback - Called when speech ends
     */
    speakWord(word, callback = null) {
        if (!word) return;
        this.speak(word, 'ja-JP', null, callback);
    }

    /**
     * Stop all TTS speech
     */
    stop() {
        if (this.synth) {
            try {
                this.synth.cancel();
                this.isSpeaking = false;
                this.currentUtterance = null;
                console.log('⏹️ TTS stopped');
            } catch (error) {
                console.error('❌ Error stopping TTS:', error);
            }
        }
    }

    /**
     * Check if TTS is currently speaking
     */
    isSpeakingNow() {
        return this.isSpeaking || (this.synth && this.synth.speaking);
    }

    /**
     * Get the current speech status
     */
    getStatus() {
        return {
            isSpeaking: this.isSpeakingNow(),
            speed: this.speed,
            voicesAvailable: this.voicesLoaded,
            voiceName: this.voice ? this.voice.name : 'Default',
            lang: this.voice ? this.voice.lang : 'Unknown'
        };
    }

    /**
     * Test TTS with a sample phrase
     * @param {Function} callback - Called when test completes
     */
    test(callback = null) {
        const testPhrases = [
            'こんにちは、これはテストです。',
            '日本語の音声合成をテストしています。'
        ];
        const phrase = testPhrases[Math.floor(Math.random() * testPhrases.length)];
        this.speak(phrase, 'ja-JP', 0.9, callback);
    }
}

// Create a singleton instance
const audioManager = new AudioManager();

// Make it globally available
if (typeof window !== 'undefined') {
    window.audioManager = audioManager;
    window.speakText = function(text, lang = 'ja-JP', rate = 1.0, callback = null) {
        return audioManager.speak(text, lang, rate, callback);
    };
    window.stopTts = function() {
        audioManager.stop();
    };
    window.setTtsSpeed = function(speed) {
        audioManager.setSpeed(speed);
    };
    window.speakSentence = function(sentenceJp, sentenceEn = null, callback = null) {
        return audioManager.speakSentence(sentenceJp, sentenceEn, callback);
    };
    window.speakWord = function(word, callback = null) {
        return audioManager.speakWord(word, callback);
    };
}

console.log('🎤 Audio module loaded');