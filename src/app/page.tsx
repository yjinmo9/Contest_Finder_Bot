'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <h1 className="text-4xl font-bold text-blue-800 mb-4 text-center">
        전공 맞춤 공모전 추천 챗봇
      </h1>
      <p className="text-gray-600 text-center max-w-md mb-8">
        전공, 관심 분야, 프로젝트 경험을 입력하면<br/>
        나에게 딱 맞는 공모전 추천을 받아볼 수 있어요! 🚀
      </p>
      <button
        onClick={() => router.push('/chat')}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition"
      >
        챗봇 시작하기
      </button>
    </div>
  );
}

