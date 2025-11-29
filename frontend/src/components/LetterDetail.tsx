import React, { useState } from 'react';
import { Letter, LetterStatus, User, UserRole } from '../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface LetterDetailProps {
    letter: Letter;
    currentUser: User;
    onUpdateResponse: (id: number, response: string) => void;
    onStartApproval: (id: number) => void;
    onApprovalAction: (id: number, department: string, comment: string, approved: boolean) => void;
}

const typeLabels: Record<string, string> = {
    info_request: 'Запрос информации',
    complaint: 'Жалоба',
    regulatory: 'Регуляторный запрос',
    partnership: 'Партнёрское предложение',
    approval_request: 'Запрос на согласование',
    notification: 'Уведомление',
    other: 'Другое'
};

const responseTypeLabels: Record<string, string> = {
    strict_official: 'Строгий официальный',
    corporate: 'Деловой корпоративный',
    client_oriented: 'Клиентоориентированный',
    brief_info: 'Краткий информационный'
};

export const LetterDetail: React.FC<LetterDetailProps> = ({
    letter,
    currentUser,
    onUpdateResponse,
    onStartApproval,
    onApprovalAction
}) => {
    const [editingResponse, setEditingResponse] = useState(false);
    const [editedResponse, setEditedResponse] = useState(letter.selected_response || '');
    const [approvalComment, setApprovalComment] = useState('');
    const [activeTab, setActiveTab] = useState<string>('strict_official');
    const [editingDeadline, setEditingDeadline] = useState(false);
    const [editedDeadline, setEditedDeadline] = useState('');

    // Проверка прав доступа
    const canEdit = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.OPERATOR;
    const canApprove = currentUser.role === UserRole.ADMIN ||
        currentUser.role === UserRole.LAWYER ||
        currentUser.role === UserRole.MARKETING;

    // Определяем отдел пользователя
    const getUserDepartment = (): string | null => {
        const departmentMap: Record<UserRole, string> = {
            [UserRole.LAWYER]: 'Юридический отдел',
            [UserRole.MARKETING]: 'Отдел маркетинга',
            [UserRole.ADMIN]: '',
            [UserRole.OPERATOR]: ''
        };
        const dept = departmentMap[currentUser.role] || null;
        // Возвращаем null для пустых строк
        return dept && dept.trim() !== '' ? dept : null;
    };

    const handleSaveResponse = () => {
        onUpdateResponse(letter.id, editedResponse);
        setEditingResponse(false);
    };

    const handleSelectResponse = (responseType: string) => {
        const response = letter.draft_responses![responseType as keyof typeof letter.draft_responses];
        setEditedResponse(response);
        onUpdateResponse(letter.id, response);
    };

    const handleApproval = (approved: boolean) => {
        if (letter.current_approver) {
            onApprovalAction(letter.id, letter.current_approver, approvalComment, approved);
            setApprovalComment('');
        }
    };

    return (
        <div>
            <div className="detail-section">
                <h3 className="detail-section-title">Информация об отправителе</h3>
                <div className="detail-content">
                    {letter.sender_name && (
                        <div className="detail-row">
                            <div className="detail-label">От кого:</div>
                            <div className="detail-value">{letter.sender_name}</div>
                        </div>
                    )}
                    {letter.sender_email && (
                        <div className="detail-row">
                            <div className="detail-label">Email:</div>
                            <div className="detail-value">{letter.sender_email}</div>
                        </div>
                    )}
                    <div className="detail-row">
                        <div className="detail-label">Дата:</div>
                        <div className="detail-value">{format(new Date(letter.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}</div>
                    </div>
                    {letter.deadline && (
                        <div className="detail-row">
                            <div className="detail-label">Дедлайн:</div>
                            <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {!editingDeadline ? (
                                    <>
                                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                                            {format(new Date(letter.deadline), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                                        </span>
                                        {canEdit && (
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '4px 12px', fontSize: '12px' }}
                                                onClick={() => {
                                                    const deadlineDate = new Date(letter.deadline!);
                                                    const localDatetime = new Date(deadlineDate.getTime() - deadlineDate.getTimezoneOffset() * 60000)
                                                        .toISOString()
                                                        .slice(0, 16);
                                                    setEditedDeadline(localDatetime);
                                                    setEditingDeadline(true);
                                                }}
                                            >
                                                Изменить
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <input
                                            type="datetime-local"
                                            value={editedDeadline}
                                            onChange={(e) => setEditedDeadline(e.target.value)}
                                            style={{ padding: '4px 8px', fontSize: '14px' }}
                                        />
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '4px 12px', fontSize: '12px' }}
                                            onClick={async () => {
                                                try {
                                                    const newDeadline = new Date(editedDeadline).toISOString();
                                                    await fetch(`/api/letters/${letter.id}`, {
                                                        method: 'PATCH',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                                                        },
                                                        body: JSON.stringify({ deadline: newDeadline })
                                                    });
                                                    setEditingDeadline(false);
                                                    window.location.reload();
                                                } catch (error) {
                                                    console.error('Ошибка обновления дедлайна:', error);
                                                }
                                            }}
                                        >
                                            Сохранить
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '4px 12px', fontSize: '12px' }}
                                            onClick={() => setEditingDeadline(false)}
                                        >
                                            Отмена
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="detail-section">
                <h3 className="detail-section-title">Тема письма</h3>
                <div className="detail-content" style={{ fontSize: '16px', fontWeight: 500 }}>
                    {letter.subject}
                </div>
            </div>

            <div className="detail-section">
                <h3 className="detail-section-title">Текст письма</h3>
                <div className="detail-content" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {letter.body}
                </div>
            </div>

            {letter.classification_data && (
                <div className="detail-section">
                    <h3 className="detail-section-title">Классификация</h3>
                    <div className="detail-content">
                        <div className="detail-row">
                            <div className="detail-label">Тип:</div>
                            <div className="detail-value">
                                <span className="badge badge-type">
                                    {typeLabels[letter.classification_data.type] || letter.classification_data.type}
                                </span>
                            </div>
                        </div>
                        <div className="detail-row">
                            <div className="detail-label">Описание:</div>
                            <div className="detail-value">{letter.classification_data.description}</div>
                        </div>
                        {letter.sla_hours && (
                            <div className="detail-row">
                                <div className="detail-label">SLA:</div>
                                <div className="detail-value">
                                    <span className="badge badge-sla">{letter.sla_hours} часов</span>
                                    {letter.sla_reasoning && (
                                        <div style={{ marginTop: '8px', fontSize: '14px', color: '#64748B', fontStyle: 'italic' }}>
                                            💡 {letter.sla_reasoning}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="detail-row">
                            <div className="detail-label">Приоритет:</div>
                            <div className="detail-value">
                                <span className={`badge badge-priority-${letter.priority}`}>
                                    {letter.priority === 1 ? 'Высокий' : letter.priority === 2 ? 'Средний' : 'Низкий'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {letter.extracted_entities && (
                <div className="detail-section">
                    <h3 className="detail-section-title">Извлечённая информация</h3>
                    <div className="detail-content">
                        {letter.extracted_entities.request_summary && (
                            <div className="detail-row">
                                <div className="detail-label">Суть запроса:</div>
                                <div className="detail-value">{letter.extracted_entities.request_summary}</div>
                            </div>
                        )}
                        {letter.extracted_entities.sender_details && (
                            <div className="detail-row">
                                <div className="detail-label">О отправителе:</div>
                                <div className="detail-value">{letter.extracted_entities.sender_details}</div>
                            </div>
                        )}
                        {letter.extracted_entities.contact_info && (
                            <div className="detail-row">
                                <div className="detail-label">Контакты:</div>
                                <div className="detail-value">{letter.extracted_entities.contact_info}</div>
                            </div>
                        )}
                        {letter.extracted_entities.legal_references && letter.extracted_entities.legal_references.length > 0 && (
                            <div className="detail-row">
                                <div className="detail-label">Нормативка:</div>
                                <div className="detail-value">
                                    {letter.extracted_entities.legal_references.map((ref, idx) => (
                                        <div key={idx} style={{ marginBottom: '4px' }}>• {ref}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {letter.risks && letter.risks.length > 0 && (
                <div className="detail-section">
                    <h3 className="detail-section-title">Выявленные риски</h3>
                    {letter.risks.map((risk, idx) => (
                        <div key={idx} className={`risk-item ${risk.level}`}>
                            <div className="risk-level">{risk.level === 'high' ? 'Высокий' : risk.level === 'medium' ? 'Средний' : 'Низкий'}</div>
                            <div className="risk-description">{risk.description}</div>
                            {risk.recommendation && <div className="risk-recommendation">Рекомендация: {risk.recommendation}</div>}
                        </div>
                    ))}
                </div>
            )}

            {letter.required_departments && letter.required_departments.length > 0 && (
                <div className="detail-section">
                    <h3 className="detail-section-title">Требуемые подразделения</h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {letter.required_departments.map((dept, idx) => (
                            <span key={idx} className="badge" style={{ background: '#DEEBFF', color: 'var(--primary)' }}>{dept}</span>
                        ))}
                    </div>
                </div>
            )}

            {letter.draft_responses && (
                <div className="detail-section">
                    <h3 className="detail-section-title">Варианты ответов</h3>
                    <div className="response-tabs">
                        {Object.entries(letter.draft_responses).map(([type]) => (
                            <button
                                key={type}
                                className={`response-tab ${activeTab === type ? 'active' : ''}`}
                                onClick={() => setActiveTab(type)}
                            >
                                {responseTypeLabels[type] || type}
                            </button>
                        ))}
                    </div>
                    <div className="response-content">
                        {letter.draft_responses[activeTab as keyof typeof letter.draft_responses]}
                    </div>
                    {canEdit && !letter.selected_response && (
                        <div className="mt-16">
                            <button
                                className="btn btn-primary"
                                onClick={() => handleSelectResponse(activeTab)}
                            >
                                Выбрать этот вариант
                            </button>
                        </div>
                    )}
                </div>
            )}

            {letter.selected_response && (
                <div className="detail-section">
                    <h3 className="detail-section-title">Выбранный ответ</h3>
                    {editingResponse ? (
                        <div>
                            <textarea
                                className="form-textarea"
                                value={editedResponse}
                                onChange={(e) => setEditedResponse(e.target.value)}
                                rows={15}
                            />
                            <div className="mt-16 flex gap-8">
                                <button className="btn btn-success" onClick={handleSaveResponse}>
                                    Сохранить
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setEditingResponse(false)}
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{
                                backgroundColor: '#f8f9fa',
                                padding: '15px',
                                borderRadius: '4px',
                                whiteSpace: 'pre-wrap',
                                marginBottom: '10px'
                            }}>
                                {letter.selected_response}
                            </div>
                            {canEdit && (
                                <button className="btn btn-primary" onClick={() => {
                                    setEditedResponse(letter.selected_response || '');
                                    setEditingResponse(true);
                                }}>
                                    Редактировать
                                </button>
                            )}
                            {canEdit && (letter.status === LetterStatus.IN_PROGRESS || letter.status === LetterStatus.DRAFT_READY) && (
                                <button
                                    className="btn btn-success"
                                    style={{ marginLeft: '10px' }}
                                    onClick={() => onStartApproval(letter.id)}
                                >
                                    {letter.approval_route && letter.approval_route.length > 0
                                        ? (letter.status === LetterStatus.DRAFT_READY ? 'Повторно отправить на согласование' : 'Отправить на согласование')
                                        : 'Отправить письмо'
                                    }
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {(letter.status === LetterStatus.IN_PROGRESS || letter.status === LetterStatus.DRAFT_READY || letter.status === LetterStatus.IN_APPROVAL || letter.status === LetterStatus.APPROVED) && (
                <div className="detail-section">
                    <h3 className="detail-section-title">Маршрут согласования</h3>
                    {(!letter.approval_route || letter.approval_route.length === 0) ? (
                        <div className="detail-content" style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Маршрут согласования не нужен. Письмо можно отправить сразу после редактирования.</p>
                        </div>
                    ) : (
                        <>
                            {letter.approval_route.map((route, idx) => {
                                const isActive = letter.current_approver &&
                                    route.department.toLowerCase() === letter.current_approver.toLowerCase();
                                const isCompleted = letter.approval_comments?.some(
                                    c => c.department.toLowerCase() === route.department.toLowerCase() && c.approved
                                );

                                return (
                                    <div
                                        key={idx}
                                        className={`approval-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                    >
                                        <div className="approval-icon">
                                            {isCompleted ? '✓' : idx + 1}
                                        </div>
                                        <div className="approval-info">
                                            <div className="approval-department">
                                                {route.department}
                                                {isActive && ' • Текущий этап'}
                                            </div>
                                            <div className="approval-reason">{route.reason}</div>
                                            {route.check_points && route.check_points.length > 0 && (
                                                <ul className="approval-checkpoints">
                                                    {route.check_points.map((point, pidx) => (
                                                        <li key={pidx}>{point}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            )}

            {canApprove && letter.status === LetterStatus.IN_APPROVAL && letter.current_approver && (
                <div className="detail-section">
                    <h3 className="detail-section-title">Действия согласующего: {letter.current_approver}</h3>
                    {(() => {
                        const userDept = getUserDepartment();
                        const currentApprover = letter.current_approver;
                        const isUserTurn = userDept && currentApprover &&
                            userDept.toLowerCase() === currentApprover.toLowerCase();

                        console.log('Approval check:', {
                            userDept,
                            currentApprover,
                            isUserTurn,
                            userRole: currentUser.role
                        });

                        return isUserTurn ? (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Комментарий</label>
                                    <textarea
                                        className="form-textarea"
                                        value={approvalComment}
                                        onChange={(e) => setApprovalComment(e.target.value)}
                                        rows={4}
                                        placeholder="Введите комментарий..."
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        className="btn btn-success"
                                        onClick={() => handleApproval(true)}
                                    >
                                        Согласовать
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => handleApproval(false)}
                                    >
                                        Отклонить
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                Ожидается согласование от отдела: {letter.current_approver}
                            </div>
                        );
                    })()}
                </div>
            )}

            {letter.approval_comments && letter.approval_comments.length > 0 && (
                <div className="card">
                    <h3>История согласования</h3>
                    {letter.approval_comments.map((comment, idx) => (
                        <div key={idx} style={{
                            marginBottom: '15px',
                            padding: '15px',
                            backgroundColor: comment.approved ? '#d4edda' : '#f8d7da',
                            borderRadius: '4px'
                        }}>
                            <p><strong>{comment.department}</strong></p>
                            <p>{comment.comment}</p>
                            <p style={{ fontSize: '12px', color: '#666' }}>
                                {comment.approved ? '✓ Согласовано' : '✗ Отклонено'} - {format(new Date(comment.timestamp), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
