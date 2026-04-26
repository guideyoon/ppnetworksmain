import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    // CORS 처리 (필요시)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { name, phone, service, message } = req.body;

        if (!name || !phone || !service || !message) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // 서비스명 매핑
        const serviceMap = {
            'cafe': '네이버 카페 울산인 입점',
            'homepage': '홈페이지 제작',
            'contents': '콘텐츠(메뉴판/전단지/영상) 제작',
            'other': '기타 문의'
        };
        const serviceName = serviceMap[service] || service;

        const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #ff7e36; border-bottom: 2px solid #ff7e36; padding-bottom: 10px;">새로운 상담 신청이 접수되었습니다.</h2>
                <p><strong>성함(상호명):</strong> ${name}</p>
                <p><strong>연락처:</strong> ${phone}</p>
                <p><strong>관심 서비스:</strong> ${serviceName}</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <strong>문의 내용:</strong><br/><br/>
                    ${message.replace(/\n/g, '<br/>')}
                </div>
            </div>
        `;

        const { data, error } = await resend.emails.send({
            from: '피플네트웍스 홈페이지 <onboarding@resend.dev>', // Resend에서 발급받은 도메인으로 변경 권장
            to: [process.env.ADMIN_EMAIL || 'facecap@naver.com'],
            subject: `[상담신청] ${name} 님의 홈페이지 문의`,
            html: htmlContent,
        });

        if (error) {
            console.error('Resend API Error:', error);
            return res.status(400).json({ success: false, error: error.message });
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
