'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Ensure consistent import
import { X, Upload, Check } from 'lucide-react';
import styles from './WikiEditor.module.css';

interface WikiEditorProps {
    shopId: string;
    initialData?: any; // Wiki diff structure
    onClose: () => void;
}

export default function WikiEditor({ shopId, onClose }: WikiEditorProps) {
    const [changeType, setChangeType] = useState('price'); // price, hours, closed, etc.
    const [description, setDescription] = useState('');
    const [evidence, setEvidence] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Upload Evidence (if any)
            let evidenceUrl = '';
            if (evidence) {
                const fileName = `${shopId}/${Date.now()}_${evidence.name}`;
                // Using supabase directly here (fix import if needed)
                const { data, error } = await supabase.storage
                    .from('wiki-evidence')
                    .upload(fileName, evidence);

                if (error) throw error;
                // Get Public URL
                const { data: publicURL } = supabase.storage.from('wiki-evidence').getPublicUrl(fileName);
                evidenceUrl = publicURL.publicUrl;
            }

            // 2. Create Revision Record
            const { error: dbError } = await supabase
                .from('wiki_revisions')
                .insert({
                    shop_id: shopId,
                    editor_user_id: (await supabase.auth.getUser()).data.user?.id, // Requires Auth context later
                    diff_json: {
                        type: changeType,
                        description: description,
                        ts: new Date().toISOString()
                    },
                    evidence_photo_urls: evidenceUrl ? [evidenceUrl] : [],
                    status: 'PENDING'
                });

            if (dbError) throw dbError;

            alert('정보 수정 요청이 접수되었습니다! 운영자 검수 후 반영됩니다.');
            onClose();

        } catch (err: any) {
            console.error('Wiki submit error:', err);
            alert('오류가 발생했습니다: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>정보 수정 제안 (Wiki)</h3>
                    <button onClick={onClose}><X /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <label>무엇이 바뀌었나요?</label>
                    <select value={changeType} onChange={e => setChangeType(e.target.value)} className={styles.select}>
                        <option value="price">가격 변동</option>
                        <option value="hours">영업시간 변경</option>
                        <option value="closed">폐업/휴무</option>
                        <option value="menu">메뉴 추가/삭제</option>
                    </select>

                    <label>내용 설명</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="예: 건오징어 가격이 5천원 올랐어요."
                        className={styles.textarea}
                        required
                    />

                    <label>증빙 사진 (선택)</label>
                    <div className={styles.fileInput}>
                        <Upload size={16} />
                        <input type="file" onChange={e => setEvidence(e.target.files?.[0] || null)} accept="image/*" />
                        {evidence && <span>{evidence.name}</span>}
                    </div>

                    <p className={styles.notice}>
                        * 허위 정보 제안 시 이용이 제한될 수 있습니다.
                    </p>

                    <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
                        {isSubmitting ? '전송 중...' : '제안하기'}
                    </button>
                </form>
            </div>
        </div>
    );
}
