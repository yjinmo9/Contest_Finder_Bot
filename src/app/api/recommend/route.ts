import { OpenAI } from 'openai';
import { exec } from 'child_process';

export const runtime = 'nodejs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type RecommendResponse = {
  recommendations?: { title: string; d_day: string; link: string }[];
  error?: string;
  debug?: any;
};

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();
    const [major, interest, project] = answers;

    const prompt = `당신은 전공 기반 공모전 추천 챗봇입니다. 아래 정보는 사용자의 전공, 관심 분야, 프로젝트 경험입니다. 이 정보를 종합하여 관련된 키워드 30~40개를 JSON 배열 형식으로 만들어 주세요.

전공: ${major}
관심 분야: ${interest}
프로젝트 경험: ${project}

키워드 배열은 JSON 형식으로만 출력해야 하며, 그 외의 설명은 하지 마세요. 키워드는 공모전 추천에 사용될 것입니다. 예를 들어, 전공이 '산업공학'이라면
    '산업공학', '시스템공학', 'IE', '최적화', '공정', '생산관리', '품질', '물류', '공급망', 'SCM', '설비관리',
    '데이터', '통계', '빅데이터', 'AI', '머신러닝', '딥러닝', '데이터분석', '예측모델', '시뮬레이션', '분석', '공공데이터',
    '운영관리', '프로세스개선', '업무자동화', 'ERP', '경영과학', 'OR', '경영혁신', '전략기획', '스마트공장', '스마트팩토리',
    'UX', 'UI', 'UX/UI', '사용자경험', '서비스디자인', '고객경험', 'CX', '인터랙션디자인', '디자인씽킹',
    '헬스케어', '핀테크', '로보틱스', '스마트시티', '자율주행', '디지털트윈', '디지털전환', 'ESG', '지속가능경영', '제로웨이스트'

 등이 될 수 있습니다.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const gptOutput = completion.choices[0].message.content || '';
    let keywords: string[] = [];
    try {
      keywords = JSON.parse(gptOutput);
      console.log('🧠 GPT가 생성한 키워드 목록:', keywords); // ✅ 출력
    } catch {
      return new Response(
        JSON.stringify({ error: '키워드 생성 결과 파싱 실패', debug: gptOutput }),
        { status: 500 }
      );
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return new Response(
        JSON.stringify({ error: '생성된 키워드가 없습니다.', debug: keywords }),
        { status: 200 }
      );
    }

    const cmd = `python3 scripts/crawl_campuspick.py '${JSON.stringify(keywords)}'`;
    console.log('📤 실행 명령어:', cmd); // ✅ 실제 전달된 명령어 로그

    return new Promise<Response>((resolve) => {
      exec(cmd, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) {
          return resolve(
            new Response(
              JSON.stringify({ error: '크롤러 실행 오류', debug: err.message }),
              { status: 500 }
            )
          );
        }

        let result: RecommendResponse;
        try {
          result = JSON.parse(stdout);
        } catch {
          return resolve(
            new Response(
              JSON.stringify({ error: '크롤러 출력 파싱 실패', debug: stdout }),
              { status: 500 }
            )
          );
        }

        if (result.error) {
          resolve(
            new Response(JSON.stringify({ error: result.error, debug: result }), { status: 200 })
          );
        } else if (!result.recommendations || result.recommendations.length === 0) {
          resolve(
            new Response(
              JSON.stringify({ error: '추천 공모전이 없습니다.', debug: result }),
              { status: 200 }
            )
          );
        } else {
          resolve(
            new Response(JSON.stringify(result), { status: 200 })
          );
        }
      });
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: '서버 에러', debug: e.message }),
      { status: 500 }
    );
  }
}

