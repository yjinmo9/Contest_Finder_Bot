// ✅ Updated ChatBot UI: 상단 Joanne 헤더 고정 + 결과/채팅 조건부 렌더링
'use client';
import { useState, useEffect } from 'react';

type Message = { role: 'user' | 'bot'; text: string };

export default function ChatBot() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({ major: '', interest: '', project: '' });
  const [messages, setMessages] = useState<Message[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [showResultsOnly, setShowResultsOnly] = useState(false); // ✅ 결과 카드만 보기

  const questions = [
    '안녕하세요! 😊 전공이 어떻게 되시나요?',
    '관심 있는 분야가 있다면 알려주세요!',
    '해본 프로젝트나 경험이 있다면 간단히 알려주세요!',
  ];

  useEffect(() => {
    setMessages([
      {
        role: 'bot',
        text:
          '안녕하세요! 👋\n전공 맞춤 공모전 추천 챗봇입니다.\n몇 가지 기본 정보를 입력하면 캠퍼스픽 기반의 공모전을 추천해드릴게요!\n\n제가 묻는 질문에 답할 준비가 되셨다면 "네" 라고 입력해 주세요 :)',
      },
    ]);
  }, []);

  async function handleSend() {
    if (isWaiting) return;

    const trimmed = input.trim();
    if (!trimmed) return;

    setTimeout(() => setInput(''), 0);
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setIsWaiting(true);

    if (step === -1) {
      if (trimmed.toLowerCase().includes('네')) {
        const firstQuestion = questions[0];
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'bot', text: firstQuestion }]);
          setStep(0);
          setIsWaiting(false);
        }, 500);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: '준비가 되시면 "네" 라고 입력해주세요!' }]);
        setIsWaiting(false);
      }
      return;
    }

    if (step === 0) setAnswers(prev => ({ ...prev, major: trimmed }));
    if (step === 1) setAnswers(prev => ({ ...prev, interest: trimmed }));
    if (step === 2) setAnswers(prev => ({ ...prev, project: trimmed }));

    const botText = questions[step + 1] ?? '추천 공모전 가져오는 중...';
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
      setStep(prev => prev + 1);
      setIsWaiting(false);
    }, 500);

    if (step === 2) {
      try {
        const res = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: [answers.major, answers.interest, trimmed] }),
        });
        const result = await res.json();

        console.log('🧪 디버그 정보:', result);
        setRecommendations(result.recommendations || []);

        setMessages(prev => [
          ...prev,
          { role: 'bot', text: '🔍 전공 기반 추천 키워드로 공모전을 찾았어요!' },
          { role: 'bot', text: '✅ 추천 공모전 로딩 성공!' }
        ]);

        setShowResultsOnly(true);
        setIsWaiting(false);
      } catch (error) {
        setMessages(prev => [...prev, { role: 'bot', text: '❌ 공모전 가져오기 실패. 다시 시도해주세요.' }]);
        setIsWaiting(false);
      }
    }
  }

  function handleReset() {
    setStep(-1);
    setAnswers({ major: '', interest: '', project: '' });
    setMessages([
      {
        role: 'bot',
        text:
          '안녕하세요! 👋\n전공 맞춤 공모전 추천 챗봇입니다.\n몇 가지 기본 정보를 입력하면 캠퍼스픽 기반의 공모전을 추천해드릴게요!\n\n제가 묻는 질문에 답할 준비가 되셨다면 "네" 라고 입력해 주세요 :)',
      },
    ]);
    setInput('');
    setRecommendations([]);
    setShowResultsOnly(false);
  }

  return (
    <div className="max-w-sm mx-auto h-[90vh] flex flex-col border rounded-xl shadow-md overflow-hidden">
      
      {/* ✅ 상단 고정 헤더 */}
      <div className="bg-blue-600 text-white px-4 py-3 text-lg font-bold flex items-center">
        John <span className="ml-2 text-sm font-normal">consultant</span>
      </div>
  
      {/* ✅ 채팅 영역 (위쪽 50%) */}
      <div className="flex-1 bg-[#f4f4f4] p-3 space-y-2 overflow-y-auto">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`whitespace-pre-line max-w-[75%] px-3 py-2 rounded-lg text-sm leading-snug shadow ${
                m.role === 'bot'
                  ? 'bg-white text-gray-800 rounded-bl-none'
                  : 'bg-blue-100 text-blue-800 rounded-br-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
  
      {/* ✅ 추천 결과 (아래쪽 50%) */}
      {recommendations.length > 0 && (
        <div className="basis-1/2 bg-white border-t px-4 py-3 flex flex-col overflow-y-auto">
          <h2 className="text-sm font-semibold mb-2">📌 추천 공모전</h2>
          <ul className="space-y-2 text-sm flex-1 overflow-y-auto">
            {recommendations.map((item, idx) => (
              <li key={idx} className="bg-gray-100 p-3 rounded-md shadow-sm">
                <div className="font-medium">{item.title}</div>
                <div className="text-gray-600">{item.d_day}</div>
                <a
                  className="text-blue-600 underline"
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  공모전 링크
                </a>
              </li>
            ))}
          </ul>
  
          <button
            onClick={() => {
              setStep(-1);
              setInput('');
              setMessages([
                {
                  role: 'bot',
                  text:
                    '안녕하세요! 👋\n전공 맞춤 공모전 추천 챗봇입니다.\n몇 가지 기본 정보를 입력하면 캠퍼스픽 기반의 공모전을 추천해드릴게요!\n\n제가 묻는 질문에 답할 준비가 되셨다면 "네" 라고 입력해 주세요 :)',
                },
              ]);
              setRecommendations([]);
              setAnswers({ major: '', interest: '', project: '' });
            }}
            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded"
          >
            🔁 다시 찾아보기
          </button>
        </div>
      )}
  
      {/* ✅ 입력창 (추천 끝나면 숨김) */}
      {step < 3 && (
        <div className="flex items-center gap-2 p-2 border-t bg-white">
          <input
            className="flex-1 p-2 border rounded-full text-sm focus:outline-none"
            placeholder="입력하세요..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 text-sm"
          >
            ➤
          </button>
        </div>
      )}
    </div>
  );  
  
}