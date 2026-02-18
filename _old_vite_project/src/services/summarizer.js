/**
 * Mock summarizer service.
 * In a real app, this would call an API like OpenAI.
 * 
 * @param {string} text 
 * @returns {Promise<{title: string, content: string[]}>}
 */
export async function summarizeText(text) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!text || text.trim().length === 0) {
        throw new Error("Input text is empty");
    }

    // Simple heuristic: 
    // 1. Title is the first sentence or first 50 chars.
    // 2. Content is up to 3 sentences from the rest.

    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
    const cleanSentences = sentences.map(s => s.trim()).filter(s => s.length > 10);

    const title = cleanSentences[0] || "No Title Found";
    const content = cleanSentences.slice(1, 4);

    if (content.length === 0) {
        // If only one sentence, split it artificially if possible, or just use it
        content.push(title);
    }

    return {
        title: title.length > 50 ? title.substring(0, 50) + "..." : title,
        content: content
    };
}
