/** Deterministic practice marking; preserves decimals and rejects embedded digits. */
export function isListeningAnswerCorrect(value: unknown, question: { type: string; correctAnswer: unknown }) {
  if (question.type === 'true_false') return typeof value === 'boolean' && value === question.correctAnswer;
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  const normalize = (input: unknown) => String(input).trim().toLowerCase().replace(/^rm\s*/, '').replace(/\s+ringgit(?: malaysia)?$/, '').replace(/,(?=\d{3}(?:\D|$))/g,'').replace(/\s+/g,' ');
  const answer = normalize(value);
  if (!answer) return false;
  const expected = normalize(question.correctAnswer);
  if (question.type === 'mcq') return answer === expected;
  const alternatives = expected.split(/\s*(?:\/|;|\||\batau\b)\s*/);
  const numbers: Record<string,string> = {'lima belas ribu':'15000','dua puluh lima ribu':'25000','sepuluh ribu':'10000','lima ribu':'5000','lima puluh ribu':'50000','seratus ribu':'100000'};
  const numeric = (s: string) => numbers[s] || s.replace(/^(\d+)\s*(?:k|ribu)$/, (_match,n) => String(Number(n)*1000));
  return alternatives.some(a => numeric(a) === numeric(answer));
}
