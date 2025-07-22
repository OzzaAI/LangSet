interface QualityMetrics {
  score: number;
  breakdown: {
    length: number;
    uniqueness: number;
    clarity: number;
    completeness: number;
  };
  suggestions: string[];
}

export function calculateQualityScore(question: string, answer: string, tags: string[]): QualityMetrics {
  const breakdown = {
    length: calculateLengthScore(question, answer),
    uniqueness: calculateUniquenessScore(question, answer),
    clarity: calculateClarityScore(question, answer),
    completeness: calculateCompletenessScore(question, answer, tags),
  };

  const score = Math.round(
    (breakdown.length * 0.2 + 
     breakdown.uniqueness * 0.3 + 
     breakdown.clarity * 0.3 + 
     breakdown.completeness * 0.2)
  );

  const suggestions = generateSuggestions(breakdown, question, answer, tags);

  return { score, breakdown, suggestions };
}

function calculateLengthScore(question: string, answer: string): number {
  const questionLength = question.trim().length;
  const answerLength = answer.trim().length;
  
  // Optimal ranges: question 10-200 chars, answer 20-1000 chars
  let questionScore = 0;
  if (questionLength >= 10 && questionLength <= 200) {
    questionScore = 100;
  } else if (questionLength < 10) {
    questionScore = Math.max(0, (questionLength / 10) * 100);
  } else {
    questionScore = Math.max(0, 100 - ((questionLength - 200) / 10));
  }

  let answerScore = 0;
  if (answerLength >= 20 && answerLength <= 1000) {
    answerScore = 100;
  } else if (answerLength < 20) {
    answerScore = Math.max(0, (answerLength / 20) * 100);
  } else {
    answerScore = Math.max(0, 100 - ((answerLength - 1000) / 50));
  }

  return Math.round((questionScore + answerScore) / 2);
}

function calculateUniquenessScore(question: string, answer: string): number {
  const questionWords = new Set(question.toLowerCase().split(/\s+/));
  const answerWords = new Set(answer.toLowerCase().split(/\s+/));
  
  // Check for variety in vocabulary
  const totalWords = questionWords.size + answerWords.size;
  const commonWords = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  
  let uniqueWords = 0;
  questionWords.forEach(word => {
    if (!commonWords.has(word) && word.length > 2) uniqueWords++;
  });
  answerWords.forEach(word => {
    if (!commonWords.has(word) && word.length > 2) uniqueWords++;
  });

  // Score based on unique word ratio
  const uniqueRatio = totalWords > 0 ? uniqueWords / totalWords : 0;
  return Math.min(100, Math.round(uniqueRatio * 150));
}

function calculateClarityScore(question: string, answer: string): number {
  let score = 100;
  
  // Check for question marks in questions
  if (!question.includes('?') && !question.toLowerCase().startsWith('what') && 
      !question.toLowerCase().startsWith('how') && !question.toLowerCase().startsWith('why') &&
      !question.toLowerCase().startsWith('when') && !question.toLowerCase().startsWith('where') &&
      !question.toLowerCase().startsWith('who')) {
    score -= 20;
  }
  
  // Check for complete sentences
  if (!answer.endsWith('.') && !answer.endsWith('!') && !answer.endsWith('?')) {
    score -= 15;
  }
  
  // Check for excessive repetition
  const questionWords = question.toLowerCase().split(/\s+/);
  const answerWords = answer.toLowerCase().split(/\s+/);
  
  const questionRepeats = questionWords.length - new Set(questionWords).size;
  const answerRepeats = answerWords.length - new Set(answerWords).size;
  
  if (questionRepeats > 2) score -= 10;
  if (answerRepeats > 3) score -= 10;
  
  // Check for unclear language
  const unclearPhrases = ['um', 'uh', 'like', 'you know', 'basically', 'kind of', 'sort of'];
  const fullText = (question + ' ' + answer).toLowerCase();
  
  unclearPhrases.forEach(phrase => {
    if (fullText.includes(phrase)) score -= 5;
  });

  return Math.max(0, score);
}

function calculateCompletenessScore(question: string, answer: string, tags: string[]): number {
  let score = 50; // Base score
  
  // Bonus for having tags
  if (tags && tags.length > 0) {
    score += Math.min(30, tags.length * 10);
  }
  
  // Check if answer addresses the question
  const questionWords = question.toLowerCase().split(/\s+/)
    .filter(word => word.length > 3 && !['what', 'how', 'why', 'when', 'where', 'who'].includes(word));
  
  let addressedWords = 0;
  questionWords.forEach(word => {
    if (answer.toLowerCase().includes(word)) {
      addressedWords++;
    }
  });
  
  if (questionWords.length > 0) {
    const addressRatio = addressedWords / questionWords.length;
    score += Math.round(addressRatio * 20);
  }

  return Math.min(100, score);
}

function generateSuggestions(breakdown: Record<string, number>, question: string, answer: string, tags: string[]): string[] {
  const suggestions: string[] = [];
  
  if (breakdown.length < 70) {
    if (question.length < 10) suggestions.push("Consider making your question more detailed");
    if (answer.length < 20) suggestions.push("Provide a more comprehensive answer");
  }
  
  if (breakdown.uniqueness < 60) {
    suggestions.push("Try using more varied vocabulary");
  }
  
  if (breakdown.clarity < 70) {
    if (!question.includes('?')) suggestions.push("Consider adding a question mark to your question");
    if (!answer.endsWith('.') && !answer.endsWith('!')) suggestions.push("End your answer with proper punctuation");
  }
  
  if (breakdown.completeness < 60) {
    if (!tags || tags.length === 0) suggestions.push("Add relevant tags to categorize this content");
    suggestions.push("Ensure your answer fully addresses the question");
  }
  
  return suggestions;
}