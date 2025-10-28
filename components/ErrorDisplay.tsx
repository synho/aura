import React from 'react';

interface ErrorDisplayProps {
  error: Error | null;
  onClearError?: () => void;
  onRetry?: () => void;
}

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const getErrorDetails = (error: Error) => {
    const message = error.message.toLowerCase();
    const rateLimitUrl = "https://ai.google.dev/gemini-api/docs/rate-limits";
    const usageUrl = "https://ai.dev/usage?tab=rate-limit";

    if (message.includes('429') || message.includes('quota') || message.includes('resource_exhausted')) {
        return {
            title: 'API Usage Limit Reached',
            description: "Aura is feeling very popular right now! It seems we've reached the current request limit for the AI service.",
            suggestion: (
                 <>
                    Please try again in a little while. To learn more or monitor your usage, please visit:
                    <div className="mt-2 flex flex-col items-start text-xs">
                        <a href={rateLimitUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-red-600 hover:text-red-800 underline">
                            Gemini API Rate Limits
                        </a>
                        <a href={usageUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-red-600 hover:text-red-800 underline mt-1">
                            Your Usage Dashboard
                        </a>
                    </div>
                </>
            ),
            isRetryable: false
        };
    }
    if (message.includes('api key') || message.includes('permission denied')) {
        return {
            title: 'Service Connection Error',
            description: 'There was an issue with the credentials needed to connect to Aura.',
            suggestion: 'Please contact the developer or try again shortly.',
            isRetryable: false
        };
    }
    if (message.includes('network') || message.includes('failed to fetch')) {
        return {
            title: 'Network Connection Error',
            description: "It seems you're not connected to the internet. A connection is required to talk to Aura.",
            suggestion: 'Please check your Wi-Fi or data connection and try again.',
            isRetryable: true
        };
    }
    if (message.includes('geolocation')) {
         return {
            title: 'Location Error',
            description: "Failed to get your current location. Please check your browser's location permissions.",
            suggestion: 'Please refresh the page and allow location access.',
            isRetryable: false
        };
    }
    if (message.includes("aura's analysis failed")) {
        return {
            title: 'Voice Analysis Stumbled',
            description: error.message.split(': ')[1] || "Aura couldn't quite catch the feeling in your voice this time.",
            suggestion: 'Please try again. Speaking clearly for a few seconds usually helps.',
            isRetryable: false
        };
    }
    if (message.includes('microphone access was denied')) {
         return {
            title: 'Microphone Access Denied',
            description: "Aura needs permission to use your microphone to hear your story.",
            suggestion: 'Please check your browser settings to allow microphone access for this site.',
            isRetryable: false
        };
    }


    return {
        title: 'An Unknown Error Occurred',
        description: 'An unexpected issue occurred while processing your request.',
        suggestion: 'Please try again in a moment, or refresh the page if the problem persists.',
        isRetryable: true
    };
}


const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClearError, onRetry }) => {
  if (!error) return null;

  const { title, description, suggestion, isRetryable } = getErrorDetails(error);

  return (
    <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-800 rounded-r-lg animate-fade-in" role="alert">
      <div className="flex">
        <div className="py-1">
          <ErrorIcon />
        </div>
        <div className="ml-3 flex-1">
          <p className="font-bold">{title}</p>
          <p className="text-sm mt-1">{description}</p>
          <div className="mt-2 text-xs font-semibold bg-red-100 p-2 rounded">
            <span className="font-bold">Next step:</span> {suggestion}
          </div>
          {isRetryable && onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-500 transition-all duration-200 transform hover:scale-105"
              >
                Retry
              </button>
            </div>
          )}
        </div>
        {onClearError && (
             <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                    <button type="button" onClick={onClearError} className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600">
                        <span className="sr-only">Dismiss</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;