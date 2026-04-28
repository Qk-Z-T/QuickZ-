// src/teacher/components/question-item.js
// Reusable component for rendering a single question preview in exam creation list

/**
 * Render a single question preview for the questions list.
 * @param {Object} q - question object
 * @param {number} index - zero-based index
 * @returns {string} HTML
 */
export function renderQuestionPreview(q, index) {
  const previewText = (q.q || '').substring(0, 100) + (q.q && q.q.length > 100 ? '...' : '');
  const optionsPreview = ['A', 'B', 'C', 'D']
    .map((letter, i) => `${letter}. ${(q.options[i] || '').substring(0, 30)}...`)
    .join(' | ');

  return `
    <div class="p-3 rounded-lg border mb-2 bg-white dark:bg-gray-800">
      <div class="flex justify-between items-start mb-2">
        <div class="font-bold text-sm truncate">${index + 1}. ${previewText}</div>
        <div class="flex gap-2">
          <button onclick="Teacher.editQuestion(${index})" class="text-blue-600 hover:text-blue-800">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="Teacher.deleteQuestion(${index})" class="text-red-600 hover:text-red-800">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="text-xs text-gray-500">${optionsPreview}</div>
      <div class="text-xs text-green-600 font-bold mt-1">
        Correct: ${String.fromCharCode(65 + (q.correct ?? 0))}
      </div>
    </div>`;
}

/**
 * Render the entire questions list container.
 * @param {Array} questions - array of question objects
 * @returns {string} HTML
 */
export function renderQuestionsList(questions) {
  if (!questions || questions.length === 0) {
    return `
      <h3 class="font-bold text-lg mb-2 dark:text-white">Questions List (0)</h3>
      <div class="text-center p-4 text-gray-400">No questions added yet</div>`;
  }

  return `
    <h3 class="font-bold text-lg mb-2 dark:text-white">Questions List (${questions.length})</h3>
    ${questions.map((q, i) => renderQuestionPreview(q, i)).join('')}`;
}
