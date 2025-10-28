import React from 'react';

interface ErrorDisplayProps {
  error: Error | null;
  onClearError?: () => void;
}

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const getErrorDetails = (error: Error) => {
    const message = error.message.toLowerCase();

    if (message.includes('api key') || message.includes('permission denied')) {
        return {
            title: '서비스 연결 오류',
            description: '아우라와 연결하는 데 필요한 인증 정보에 문제가 발생했습니다.',
            suggestion: '개발자에게 문의하거나 잠시 후 다시 시도해주세요.'
        };
    }
    if (message.includes('network') || message.includes('failed to fetch')) {
        return {
            title: '네트워크 연결 오류',
            description: '인터넷에 연결되어 있지 않은 것 같아요. 아우라와 대화하려면 연결이 필요합니다.',
            suggestion: 'Wi-Fi나 데이터 연결을 확인하고 다시 시도해주세요.'
        };
    }
    if (message.includes('geolocation')) {
         return {
            title: '위치 정보 오류',
            description: '현재 위치를 가져오는 데 실패했습니다. 브라우저의 위치 정보 접근 권한을 확인해주세요.',
            suggestion: '페이지를 새로고침하고 위치 정보 접근을 허용해주세요.'
        };
    }

    return {
        title: '알 수 없는 오류 발생',
        description: '요청을 처리하는 중 예기치 않은 문제가 발생했습니다.',
        suggestion: '잠시 후 다시 시도해보거나, 문제가 계속되면 새로고침해주세요.'
    };
}


const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClearError }) => {
  if (!error) return null;

  const { title, description, suggestion } = getErrorDetails(error);

  return (
    <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-800 rounded-r-lg animate-fade-in" role="alert">
      <div className="flex">
        <div className="py-1">
          <ErrorIcon />
        </div>
        <div className="ml-3">
          <p className="font-bold">{title}</p>
          <p className="text-sm mt-1">{description}</p>
          <div className="mt-2 text-xs font-semibold bg-red-100 p-2 rounded">
            <span className="font-bold">다음 단계:</span> {suggestion}
          </div>
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