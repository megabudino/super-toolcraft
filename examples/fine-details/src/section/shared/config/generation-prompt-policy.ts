export const maximumGenerationPromptCharacters = 4_000;
export const generationPromptError = 'Prompt must be between 1 and 4,000 characters.';

export function isValidGenerationPrompt(prompt: string) {
  const normalizedPrompt = prompt.trim();
  return (
    normalizedPrompt.length > 0 &&
    normalizedPrompt.length <= maximumGenerationPromptCharacters
  );
}
