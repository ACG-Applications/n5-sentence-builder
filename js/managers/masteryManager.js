// ============================================================
// MASTERY MANAGER - Handles stats, progress, and persistence
// ============================================================

/**
 * MasteryManager - Manages all progress tracking and persistence
 * Completely separate from UI/puzzle logic
 */
class MasteryManager {
  constructor(sprintId = 0) {
    this.sprintId = sprintId;
    this.sprintTotalSentences = 0;

    // Progress tracking
    this.masteredIndices = new Set();
    this.failedIndices = new Set();
    this.currentCycleSentences = [];
    this.cycleNumber = 1;
    this.allCompleted = false;
    this.completionShown = false;

    // Statistics
    this.stats = {
      correct: 0,
      incorrect: 0,
      attempts: 0,
      sentenceAttempts: {},
      sentenceCorrect: {},
    };

    // Mode tracking
    this.primaryMode = "fill";
    this.sprintPrimaryModes = {};
    this.isPracticeMode = false;
    this.currentMode = "fill";
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  /**
   * Initialize or reset for a sprint
   * @param {number} sprintId - The sprint ID
   * @param {number} totalSentences - Total sentences in this sprint
   * @param {string} defaultMode - Default primary mode ('fill' | 'order' | 'select-order')
   */
  init(sprintId, totalSentences, defaultMode = "fill") {
    this.sprintId = sprintId;
    this.sprintTotalSentences = totalSentences;
    this.primaryMode = defaultMode;

    // Try to load saved progress
    const loaded = this.load(sprintId);

    // If no saved progress, initialize fresh
    if (!loaded) {
      console.log(
        `📂 No saved data for sprint ${sprintId}, initializing fresh`,
      );
      this.reset(true);
    } else {
      // Even if loaded, ensure we have the correct total sentences
      this.sprintTotalSentences = totalSentences;
      // Ensure currentCycleSentences is valid
      if (
        !this.currentCycleSentences ||
        this.currentCycleSentences.length === 0
      ) {
        this.currentCycleSentences = Array.from(
          { length: totalSentences },
          (_, i) => i,
        );
        this.shuffleArray(this.currentCycleSentences);
      }
    }

    // Update practice mode status
    this.updatePracticeMode(this.currentMode);

    return this;
  }

  // ============================================================
  // PROGRESS TRACKING
  // ============================================================

  /**
   * Track an attempt on a sentence
   * @param {number} sentenceIndex - The sentence index in the sprint
   * @param {boolean} isCorrect - Whether the answer was correct
   * @param {string} mode - The mode being used ('fill' | 'order' | 'select-order')
   * @returns {Object} Updated progress data
   */
  trackAttempt(sentenceIndex, isCorrect, mode) {
    // Only track in primary mode
    if (mode !== this.primaryMode) {
      return this.getProgress();
    }

    // Update attempt count
    this.stats.attempts++;
    if (!this.stats.sentenceAttempts[sentenceIndex]) {
      this.stats.sentenceAttempts[sentenceIndex] = 0;
    }
    this.stats.sentenceAttempts[sentenceIndex]++;

    if (isCorrect) {
      this.stats.correct++;
      this.stats.sentenceCorrect[sentenceIndex] = true;
      this.masteredIndices.add(sentenceIndex);
      this.failedIndices.delete(sentenceIndex);
    } else {
      this.stats.incorrect++;
      this.stats.sentenceCorrect[sentenceIndex] = false;
      this.failedIndices.add(sentenceIndex);
    }

    // Check if sprint is complete
    this.checkCompletion();

    return this.getProgress();
  }

  /**
   * Get the next sentence to practice
   * @returns {number|null} The next sentence index, or null if none
   */
  getNextSentence() {
    // If all completed, return null
    if (this.allCompleted) {
      return null;
    }

    // If no sentences left in current cycle
    if (this.currentCycleSentences.length === 0) {
      // If no failed sentences, we're done
      if (this.failedIndices.size === 0) {
        this.allCompleted = true;
        this.completionShown = false;
        return null;
      }

      // Start new cycle with failed sentences
      this.currentCycleSentences = Array.from(this.failedIndices);
      this.failedIndices = new Set();
      this.cycleNumber++;
      this.shuffleArray(this.currentCycleSentences);
    }

    return this.currentCycleSentences.shift();
  }

  /**
   * Reset all progress for the current sprint
   * @param {boolean} keepPrimaryMode - Whether to keep the primary mode
   */
  reset(keepPrimaryMode = true) {
    const primaryMode = keepPrimaryMode ? this.primaryMode : "fill";

    this.masteredIndices = new Set();
    this.failedIndices = new Set();
    this.currentCycleSentences = Array.from(
      { length: this.sprintTotalSentences },
      (_, i) => i,
    );
    this.cycleNumber = 1;
    this.allCompleted = false;
    this.completionShown = false;
    this.stats = {
      correct: 0,
      incorrect: 0,
      attempts: 0,
      sentenceAttempts: {},
      sentenceCorrect: {},
    };

    if (!keepPrimaryMode) {
      this.primaryMode = primaryMode;
    }

    this.shuffleArray(this.currentCycleSentences);
    this.save();
  }

  // ============================================================
  // PROGRESS QUERIES
  // ============================================================

  /**
   * Get current progress data
   * @returns {Object} Progress data
   */
  getProgress() {
    const total = this.sprintTotalSentences;
    const mastered = this.masteredIndices.size;
    return {
      total: total,
      mastered: mastered,
      progress: total > 0 ? (mastered / total) * 100 : 0,
      isComplete: mastered === total && total > 0,
      isPracticeMode: this.isPracticeMode,
      primaryMode: this.primaryMode,
    };
  }

  /**
   * Get all statistics
   * @returns {Object} Stats data
   */
  getStats() {
    return {
      ...this.stats,
      cycleNumber: this.cycleNumber,
      allCompleted: this.allCompleted,
    };
  }

  /**
   * Check if a sentence is mastered
   * @param {number} sentenceIndex - The sentence index
   * @returns {boolean} True if mastered
   */
  isSentenceMastered(sentenceIndex) {
    return this.masteredIndices.has(sentenceIndex);
  }

  /**
   * Check if a sentence has failed
   * @param {number} sentenceIndex - The sentence index
   * @returns {boolean} True if failed
   */
  isSentenceFailed(sentenceIndex) {
    return this.failedIndices.has(sentenceIndex);
  }

  /**
   * Get the number of mastered sentences
   * @returns {number} Count of mastered sentences
   */
  getMasteredCount() {
    return this.masteredIndices.size;
  }

  /**
   * Get the number of failed sentences
   * @returns {number} Count of failed sentences
   */
  getFailedCount() {
    return this.failedIndices.size;
  }

  // ============================================================
  // MODE MANAGEMENT
  // ============================================================

  /**
   * Set the primary mastery mode
   * @param {string} mode - 'fill' | 'order' | 'select-order'
   * @param {string} currentMode - The current active mode
   */
  setPrimaryMode(mode, currentMode = null) {
    if (!["fill", "order", "select-order"].includes(mode)) {
      console.warn(`Invalid primary mode: ${mode}`);
      return;
    }

    this.primaryMode = mode;
    this.sprintPrimaryModes[this.sprintId] = mode;
    this.updatePracticeMode(currentMode || this.currentMode);
    this.save();
  }

  /**
   * Update practice mode status based on current mode
   * @param {string} currentMode - The current active mode
   */
  updatePracticeMode(currentMode) {
    this.currentMode = currentMode;
    this.isPracticeMode = currentMode !== this.primaryMode;
    return this.isPracticeMode;
  }

  /**
   * Get the current mode status
   * @returns {Object} Mode status
   */
  getModeStatus() {
    return {
      primaryMode: this.primaryMode,
      currentMode: this.currentMode,
      isPracticeMode: this.isPracticeMode,
    };
  }

  // ============================================================
  // COMPLETION
  // ============================================================

  /**
   * Check if the sprint is complete and update state
   * @returns {boolean} True if complete
   */
  checkCompletion() {
    const progress = this.getProgress();
    if (progress.isComplete) {
      this.allCompleted = true;
    }
    return this.allCompleted;
  }

  /**
   * Mark completion as shown (for overlay control)
   */
  markCompletionShown() {
    this.completionShown = true;
    this.save();
  }

  /**
   * Check if completion should be shown
   * @returns {boolean} True if completion should be shown
   */
  shouldShowCompletion() {
    return this.allCompleted && !this.completionShown;
  }

  // ============================================================
  // PERSISTENCE
  // ============================================================

  /**
   * Save progress to localStorage
   * @returns {boolean} Success status
   */
  save() {
    try {
      const key = `sentence_builder_${this.sprintId}`;
      const data = {
        masteredIndices: Array.from(this.masteredIndices),
        failedIndices: Array.from(this.failedIndices),
        currentCycleSentences: this.currentCycleSentences,
        cycleNumber: this.cycleNumber,
        allCompleted: this.allCompleted,
        completionShown: this.completionShown,
        stats: this.stats,
        primaryMode: this.primaryMode,
        sprintPrimaryModes: this.sprintPrimaryModes,
      };
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Error saving progress:", error);
      return false;
    }
  }

  /**
   * Load progress from localStorage
   * @param {number} sprintId - The sprint ID to load
   * @returns {boolean} True if progress was loaded
   */
  load(sprintId) {
    try {
      this.sprintId = sprintId;
      const key = `sentence_builder_${sprintId}`;
      const stored = localStorage.getItem(key);

      if (!stored) {
        return false;
      }

      const data = JSON.parse(stored);

      // Restore data
      this.masteredIndices = new Set(data.masteredIndices || []);
      this.failedIndices = new Set(data.failedIndices || []);
      this.currentCycleSentences = data.currentCycleSentences || [];
      this.cycleNumber = data.cycleNumber || 1;
      this.allCompleted = data.allCompleted || false;
      this.completionShown = data.completionShown || false;
      this.stats = data.stats || {
        correct: 0,
        incorrect: 0,
        attempts: 0,
        sentenceAttempts: {},
        sentenceCorrect: {},
      };

      // Load primary mode
      this.sprintPrimaryModes = data.sprintPrimaryModes || {};
      this.primaryMode =
        this.sprintPrimaryModes[sprintId] || data.primaryMode || "fill";

      // Ensure currentCycleSentences is valid
      if (
        !this.currentCycleSentences ||
        this.currentCycleSentences.length === 0
      ) {
        this.currentCycleSentences = Array.from(
          { length: this.sprintTotalSentences },
          (_, i) => i,
        );
        this.shuffleArray(this.currentCycleSentences);
      }

      // Update practice mode status
      this.updatePracticeMode(this.currentMode);

      return true;
    } catch (error) {
      console.error("Error loading progress:", error);
      return false;
    }
  }

  /**
   * Clear all saved progress for this sprint
   */
  clearSavedProgress() {
    try {
      const key = `sentence_builder_${this.sprintId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error clearing progress:", error);
    }
  }

  // ============================================================
  // UTILITY
  // ============================================================

  /**
   * Shuffle an array in place (Fisher-Yates)
   * @param {Array} arr - The array to shuffle
   * @returns {Array} The shuffled array
   */
  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Get a string summary of current state (for debugging)
   * @returns {string} Summary string
   */
  getSummary() {
    const progress = this.getProgress();
    return (
      `Sprint ${this.sprintId}: ${progress.mastered}/${progress.total} mastered ` +
      `(${Math.round(progress.progress)}%) | Mode: ${this.primaryMode} ` +
      `| Practice: ${this.isPracticeMode ? "ON" : "OFF"} ` +
      `| Cycle: ${this.cycleNumber} | Attempts: ${this.stats.attempts}`
    );
  }
}

// Make available globally
if (typeof window !== "undefined") {
  window.MasteryManager = MasteryManager;
}

console.log("📊 Mastery Manager module loaded");
