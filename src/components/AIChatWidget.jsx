import { useMemo, useState } from 'react';

const presetQuestions = [
  'How can I build a weekly grocery budget with $60?',
  'What are affordable high-protein foods for students?',
  'Can you suggest a healthy one-week meal plan under my budget?',
  'How do I reduce food waste in a dorm or shared apartment?',
];

const systemPrompt =
  'You are a grocery budgeting and nutrition assistant for college students. Give practical, low-cost suggestions, realistic weekly strategies, and concise nutrition guidance. Avoid medical diagnosis. If unsure, suggest consulting a professional.';

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi, I can help with grocery budgeting and nutrition tips for student life. Pick a question or ask your own.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  async function sendMessage(textOverride) {
    const text = (textOverride || input).trim();

    if (!text || isLoading) {
      return;
    }

    const userMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setError('');

    if (!apiKey) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            'Chat is not configured yet. Add VITE_OPENAI_API_KEY to your environment file to enable AI replies.',
        },
      ]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.5,
          messages: [
            { role: 'system', content: systemPrompt },
            ...nextMessages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('The chat service returned an error.');
      }

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content?.trim();

      if (!reply) {
        throw new Error('No response text returned from chat service.');
      }

      setMessages((current) => [...current, { role: 'assistant', content: reply }]);
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong while contacting chat service.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  return (
    <div className="chat-widget-shell" aria-live="polite">
      {isOpen ? (
        <section className="chat-panel" aria-label="AI grocery chat">
          <header className="chat-header">
            <div>
              <strong>Budget Basket AI</strong>
              <small>Student grocery and nutrition help</small>
            </div>
            <button className="chat-icon-button" onClick={() => setIsOpen(false)} type="button">
              Close
            </button>
          </header>

          <div className="chat-presets">
            {presetQuestions.map((question) => (
              <button
                className="chat-chip"
                disabled={isLoading}
                key={question}
                onClick={() => sendMessage(question)}
                type="button"
              >
                {question}
              </button>
            ))}
          </div>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <article
                className={message.role === 'assistant' ? 'chat-bubble chat-assistant' : 'chat-bubble chat-user'}
                key={`${message.role}-${index}`}
              >
                {message.content}
              </article>
            ))}
            {isLoading ? <p className="chat-status">Thinking...</p> : null}
            {error ? <p className="chat-error">{error}</p> : null}
          </div>

          <form className="chat-input-row" onSubmit={handleSubmit}>
            <input
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about budget-friendly groceries..."
              type="text"
              value={input}
            />
            <button className="chat-send-button" disabled={!canSend} type="submit">
              Send
            </button>
          </form>
        </section>
      ) : null}

      <button
        aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
        className="chat-launcher"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <svg aria-hidden="true" className="chat-launcher-icon" viewBox="0 0 24 24">
          <path
            d="M4 5h16v10H8l-4 4V5zm2 2v7.17L7.17 13H18V7H6z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}