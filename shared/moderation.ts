export const reportReasons = ['spam', 'harassment', 'hate', 'sexual_content', 'violence', 'self_harm', 'other'] as const;
export const reportLabels: Record<typeof reportReasons[number], string> = {
  spam: 'Spam or scam', harassment: 'Harassment or bullying', hate: 'Hateful content',
  sexual_content: 'Sexual content', violence: 'Threats or violence', self_harm: 'Self-harm concerns', other: 'Something else',
};
