import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface DashboardProps {
    currentUser: User;
}

interface ProcessingTimeMetrics {
    average_response_time_hours: number;
    median_response_time_hours: number;
    min_response_time_hours: number;
    max_response_time_hours: number;
    total_processed: number;
}

interface SLACompliance {
    total_with_sla: number;
    met_sla: number;
    missed_sla: number;
    compliance_rate: number;
    average_sla_deviation_hours: number;
}

interface TypeDistribution {
    type: string;
    count: number;
    percentage: number;
}

interface StatusDistribution {
    status: string;
    count: number;
    percentage: number;
}

interface PriorityDistribution {
    priority: number;
    priority_label: string;
    count: number;
    percentage: number;
}

interface DailyStats {
    date: string;
    count: number;
}

interface OverallSummary {
    total_letters: number;
    processed_letters: number;
    in_progress: number;
    average_sla_hours: number;
    processing_rate: number;
}

export const Dashboard: React.FC<DashboardProps> = () => {
    const [days, setDays] = useState(30);
    const [processingTime, setProcessingTime] = useState<ProcessingTimeMetrics | null>(null);
    const [slaCompliance, setSlaCompliance] = useState<SLACompliance | null>(null);
    const [typeDistribution, setTypeDistribution] = useState<TypeDistribution[]>([]);
    const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
    const [priorityDistribution, setPriorityDistribution] = useState<PriorityDistribution[]>([]);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [summary, setSummary] = useState<OverallSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const typeLabels: Record<string, string> = {
        info_request: 'Запрос информации',
        complaint: 'Жалоба',
        regulatory: 'Регуляторный',
        partnership: 'Партнерство',
        approval_request: 'Согласование',
        notification: 'Уведомление',
        other: 'Другое'
    };

    const statusLabels: Record<string, string> = {
        new: 'Входящие',
        analyzing: 'Анализируется',
        in_progress: 'В обработке',
        draft_ready: 'Черновик готов',
        in_approval: 'На согласовании',
        approved: 'Согласовано',
        sent: 'Отправлено'
    };

    useEffect(() => {
        loadAnalytics();
    }, [days]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const [
                processingTimeRes,
                slaComplianceRes,
                typeDistRes,
                statusDistRes,
                priorityDistRes,
                dailyStatsRes,
                summaryRes
            ] = await Promise.all([
                fetch(`/api/analytics/processing-time?days=${days}`, { headers }),
                fetch(`/api/analytics/sla-compliance?days=${days}`, { headers }),
                fetch(`/api/analytics/letter-types?days=${days}`, { headers }),
                fetch(`/api/analytics/status-distribution`, { headers }),
                fetch(`/api/analytics/priority-distribution?days=${days}`, { headers }),
                fetch(`/api/analytics/daily-stats?days=${days}`, { headers }),
                fetch(`/api/analytics/summary?days=${days}`, { headers })
            ]);

            setProcessingTime(await processingTimeRes.json());
            setSlaCompliance(await slaComplianceRes.json());
            setTypeDistribution(await typeDistRes.json());
            setStatusDistribution(await statusDistRes.json());
            setPriorityDistribution(await priorityDistRes.json());
            setDailyStats(await dailyStatsRes.json());
            setSummary(await summaryRes.json());
        } catch (error) {
            console.error('Ошибка загрузки аналитики:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '24px', textAlign: 'center', minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#ffffff' }}>Загрузка аналитики...</div>;
    }

    return (
        <div style={{ padding: '24px', minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: '#ffffff' }}>Аналитика и метрики</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px', color: '#ffffff' }}>Период:</label>
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        <option value={7}>7 дней</option>
                        <option value={14}>14 дней</option>
                        <option value={30}>30 дней</option>
                        <option value={90}>90 дней</option>
                    </select>
                    <button onClick={loadAnalytics} className="btn btn-secondary">Обновить</button>
                </div>
            </div>

            {/* Общая сводка */}
            {summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div className="metric-card">
                        <div className="metric-value">{summary.total_letters}</div>
                        <div className="metric-label">Всего писем</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-value">{summary.processed_letters}</div>
                        <div className="metric-label">Обработано</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-value">{summary.in_progress}</div>
                        <div className="metric-label">В работе</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-value">{summary.processing_rate}%</div>
                        <div className="metric-label">Процент завершения</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-value">{summary.average_sla_hours}ч</div>
                        <div className="metric-label">Средний SLA</div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                {/* Время обработки */}
                {processingTime && (
                    <div className="analytics-card">
                        <h3>Время обработки писем</h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Среднее время ответа:</span>
                                <strong>
                                    {processingTime.average_response_time_hours >= 1
                                        ? `${processingTime.average_response_time_hours.toFixed(1)} ч`
                                        : `${Math.round(processingTime.average_response_time_hours * 60)} мин`}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Медиана:</span>
                                <strong>
                                    {processingTime.median_response_time_hours >= 1
                                        ? `${processingTime.median_response_time_hours.toFixed(1)} ч`
                                        : `${Math.round(processingTime.median_response_time_hours * 60)} мин`}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Минимум:</span>
                                <strong>
                                    {processingTime.min_response_time_hours >= 1
                                        ? `${processingTime.min_response_time_hours.toFixed(1)} ч`
                                        : `${Math.round(processingTime.min_response_time_hours * 60)} мин`}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Максимум:</span>
                                <strong>
                                    {processingTime.max_response_time_hours >= 1
                                        ? `${processingTime.max_response_time_hours.toFixed(1)} ч`
                                        : `${Math.round(processingTime.max_response_time_hours * 60)} мин`}
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                                <span>Обработано писем:</span>
                                <strong>{processingTime.total_processed}</strong>
                            </div>
                        </div>
                    </div>
                )}

                {/* SLA Compliance */}
                {slaCompliance && (
                    <div className="analytics-card">
                        <h3>Соблюдение SLA</h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Процент выполнения:</span>
                                <strong style={{ color: slaCompliance.compliance_rate >= 90 ? 'var(--success)' : slaCompliance.compliance_rate >= 70 ? 'var(--warning)' : 'var(--danger)' }}>
                                    {slaCompliance.compliance_rate.toFixed(1)}%
                                </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Выполнено в срок:</span>
                                <strong style={{ color: 'var(--success)' }}>{slaCompliance.met_sla}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Просрочено:</span>
                                <strong style={{ color: 'var(--danger)' }}>{slaCompliance.missed_sla}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Всего с SLA:</span>
                                <strong>{slaCompliance.total_with_sla}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                                <span>Среднее отклонение:</span>
                                <strong>{slaCompliance.average_sla_deviation_hours.toFixed(1)} часов</strong>
                            </div>
                        </div>
                    </div>
                )}

                {/* Типы писем */}
                <div className="analytics-card">
                    <h3>Типы корреспонденции</h3>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {typeDistribution.map((item) => (
                            <div key={item.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{typeLabels[item.type] || item.type}:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '100px',
                                        height: '8px',
                                        backgroundColor: '#e0e0e0',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${item.percentage}%`,
                                            height: '100%',
                                            backgroundColor: '#2196F3'
                                        }} />
                                    </div>
                                    <strong>{item.count} ({item.percentage.toFixed(1)}%)</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Приоритеты */}
                <div className="analytics-card">
                    <h3>Распределение по приоритетам</h3>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {priorityDistribution.map((item) => (
                            <div key={item.priority} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{item.priority_label}:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '100px',
                                        height: '8px',
                                        backgroundColor: '#e0e0e0',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${item.percentage}%`,
                                            height: '100%',
                                            backgroundColor: item.priority === 1 ? '#f44336' : item.priority === 2 ? '#ff9800' : '#4caf50'
                                        }} />
                                    </div>
                                    <strong>{item.count} ({item.percentage.toFixed(1)}%)</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Статусы */}
                <div className="analytics-card">
                    <h3>Текущие статусы</h3>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {statusDistribution.map((item) => (
                            <div key={item.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{statusLabels[item.status] || item.status}:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '100px',
                                        height: '8px',
                                        backgroundColor: '#e0e0e0',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${item.percentage}%`,
                                            height: '100%',
                                            backgroundColor: '#9c27b0'
                                        }} />
                                    </div>
                                    <strong>{item.count} ({item.percentage.toFixed(1)}%)</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* График поступления */}
                <div className="analytics-card" style={{ gridColumn: 'span 2' }}>
                    <h3>Ежедневная статистика поступления</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '200px', padding: '16px 0' }}>
                        {dailyStats.map((item, index) => {
                            const maxCount = Math.max(...dailyStats.map(s => s.count));
                            const height = (item.count / maxCount) * 100;
                            return (
                                <div
                                    key={index}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{item.count}</span>
                                    <div
                                        style={{
                                            width: '100%',
                                            height: `${height}%`,
                                            backgroundColor: '#2196F3',
                                            borderRadius: '4px 4px 0 0',
                                            minHeight: item.count > 0 ? '4px' : '0'
                                        }}
                                        title={`${new Date(item.date).toLocaleDateString('ru-RU')}: ${item.count} писем`}
                                    />
                                    <span style={{ fontSize: '10px', color: '#666' }}>
                                        {new Date(item.date).getDate()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
