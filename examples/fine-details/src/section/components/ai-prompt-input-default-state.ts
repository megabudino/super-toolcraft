export function getInitialAiPromptValue(
  defaultPrompt: string,
  clearUntouchedDefaultPrompt: boolean,
) {
  return clearUntouchedDefaultPrompt ? '' : defaultPrompt;
}

export function shouldClearUntouchedAiPromptDefault({
  active,
  previouslyActive,
  userEdited,
}: {
  active: boolean;
  previouslyActive: boolean;
  userEdited: boolean;
}) {
  return active && !previouslyActive && !userEdited;
}
