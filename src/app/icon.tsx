import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
    width: 512,
    height: 512,
};

export const contentType = 'image/png';

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 80,
                    background: 'white',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 120,
                    border: '10px solid #FF5A00',
                    position: 'relative',
                }}
            >
                {/* Simplified Bag Shape */}
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    width: '70%',
                    height: '60%',
                    backgroundColor: '#FFF5F0',
                    borderRadius: '40px 40px 80px 80px',
                    border: '8px solid #FF5A00',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        fontSize: 100,
                        fontWeight: 900,
                        color: '#FF5A00',
                        letterSpacing: '-5px',
                        marginTop: 40
                    }}>
                        ㄱㄷㅁㅋ
                    </div>
                </div>

                {/* Bag Handles */}
                <div style={{
                    position: 'absolute',
                    top: '10%',
                    width: '30%',
                    height: '20%',
                    border: '8px solid #FF5A00',
                    borderRadius: '50% 50% 0 0',
                    borderBottom: 'none'
                }} />

                {/* Decorative Stars */}
                <div style={{ position: 'absolute', top: '15%', right: '15%', fontSize: 40 }}>✨</div>
                <div style={{ position: 'absolute', top: '30%', left: '10%', fontSize: 30 }}>⭐</div>
            </div>
        ),
        {
            ...size,
        }
    );
}
