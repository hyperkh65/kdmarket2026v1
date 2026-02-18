'use client';

export default function TermsOfService() {
    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6', color: '#333' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>이용약관</h1>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>제1조 (목적)</h2>
                <p>본 약관은 경동마켓(이하 '회사')이 운영하는 어플리케이션 및 관련 서비스(이하 '서비스')를 이용함에 있어 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>제2조 (UGC 운영 정책)</h2>
                <p>회사는 이용자가 생성한 콘텐츠(UGC, 게시물, 댓글, 리뷰 등)에 대해 다음과 같은 정책을 시행합니다.</p>
                <ul style={{ listStyleType: 'disc', marginLeft: '20px', marginTop: '8px' }}>
                    <li><strong>부적절한 콘텐츠 금지:</strong> 욕설, 비하, 음란물, 불법 정보 등을 포함한 콘텐츠 게시는 엄격히 금지됩니다.</li>
                    <li><strong>콘텐츠 필터링 및 차단:</strong> 다른 이용자에게 불쾌감을 주는 게시물은 신고 기능을 통해 차단되거나 관리자에 의해 삭제될 수 있습니다.</li>
                    <li><strong>이용자 차단:</strong> 반복적으로 정책을 위반하는 사용자는 서비스 이용이 영구적으로 제한될 수 있습니다.</li>
                    <li><strong>신고 처리:</strong> 모든 신고는 24시간 이내에 검토되어 적절한 조치가 취해집니다.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>제3조 (회원 탈퇴 및 계정 삭제)</h2>
                <p>이용자는 언제든지 서비스 내 설정 메뉴를 통해 회원 탈퇴 및 계정 삭제를 요청할 수 있습니다. 탈퇴 시 이용자의 개인정보 및 생성한 데이터는 관련 법령 및 개인정보 처리방침에 따라 처리됩니다.</p>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>제4조 (위치 정보 이용)</h2>
                <p>회사는 서비스 제공을 위해 이용자의 기기 위치 정보를 수집 및 이용할 수 있으며, 이는 이용자의 동의를 전제로 합니다.</p>
            </section>

            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee', fontSize: '14px', color: '#666' }}>
                <p>시행일자: 2024년 2월 14일</p>
            </div>
        </div>
    );
}
