'use client';

export default function PrivacyPolicy() {
    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>개인정보 처리방침</h1>

            <p className="mb-4">
                경동마켓(이하 '회사')은 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리지침을 수립·공개합니다.
            </p>

            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>제1조(개인정보의 처리목적)</h2>
            <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
            <ul style={{ listStyleType: 'disc', marginLeft: '20px', marginTop: '8px' }}>
                <li>홈페이지 회원 가입 및 관리</li>
                <li>서비스 제공 (위치 기반 상점 추천, 주문, 배달 등)</li>
                <li>고충처리</li>
            </ul>

            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>제2조(개인정보의 처리 및 보유기간)</h2>
            <p>① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
            <p>② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.</p>
            <ul style={{ listStyleType: 'disc', marginLeft: '20px', marginTop: '8px' }}>
                <li>회원 가입 및 관리 : 홈페이지 탈퇴시까지</li>
                <li>재화 또는 서비스 제공 : 재화·서비스 공급완료 및 요금결제·정산 완료시까지</li>
            </ul>

            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>제3조(위치정보의 이용)</h2>
            <p>회사는 사용자의 현재 위치를 기반으로 주변 상점 정보를 제공하기 위해 위치정보를 이용합니다. 위치정보는 해당 목적 이외의 용도로 저장되거나 제3자에게 제공되지 않습니다.</p>

            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee', fontSize: '14px', color: '#666' }}>
                <p>본 방침은 2024년 2월 14일부터 시행됩니다.</p>
            </div>
        </div>
    );
}
