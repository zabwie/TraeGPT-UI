// Utility functions

// Add a helper function for timeout
export function fetchWithTimeout(resource: RequestInfo, options: RequestInit = {}, timeout = 15000): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), timeout);
    fetch(resource, options)
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Generate session title from messages
export function generateSessionTitle(messages: any[]): string {
  if (messages.length === 0) return 'New Chat';
  
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  if (!firstUserMessage) return 'New Chat';
  
  const content = firstUserMessage.content;
  if (content.length <= 50) return content;
  
  return content.substring(0, 50) + '...';
} 