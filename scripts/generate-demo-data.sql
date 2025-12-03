-- ========================================
-- 活动签到系统演示数据生成脚本
-- ========================================
-- 请在 Supabase SQL Editor 中运行此脚本

-- 清理现有数据（可选，仅用于重置）
-- DELETE FROM attendees;
-- DELETE FROM events;

-- 1. 创建示例活动
INSERT INTO events (id, name, date, location, description) VALUES
('demo-event-2024', '2024年度技术创新峰会', '2024-12-25', '北京国际会议中心', '汇聚行业精英，探讨前沿技术趋势与未来发展方向')
ON CONFLICT (id) DO NOTHING;

-- 2. 生成 50 条参会者数据（包含真实的中文姓名）
-- 30 个 registered (待入场) 用户
INSERT INTO attendees (id, event_id, name, phone, status, created_at) VALUES
-- 待入场用户 (30人)
('registered-001', 'demo-event-2024', '张伟', '13800138001', 'registered', NOW() - INTERVAL '2 days 3 hours'),
('registered-002', 'demo-event-2024', '王秀英', '13800138002', 'registered', NOW() - INTERVAL '2 days 1 hours'),
('registered-003', 'demo-event-2024', '李强', '13800138003', 'registered', NOW() - INTERVAL '1 days 23 hours'),
('registered-004', 'demo-event-2024', '刘敏', '13800138004', 'registered', NOW() - INTERVAL '1 days 21 hours'),
('registered-005', 'demo-event-2024', '陈勇', '13800138005', 'registered', NOW() - INTERVAL '1 days 19 hours'),
('registered-006', 'demo-event-2024', '杨丽', '13800138006', 'registered', NOW() - INTERVAL '1 days 17 hours'),
('registered-007', 'demo-event-2024', '赵建国', '13800138007', 'registered', NOW() - INTERVAL '1 days 15 hours'),
('registered-008', 'demo-event-2024', '黄秀英', '13800138008', 'registered', NOW() - INTERVAL '1 days 13 hours'),
('registered-009', 'demo-event-2024', '周建华', '13800138009', 'registered', NOW() - INTERVAL '1 days 11 hours'),
('registered-010', 'demo-event-2024', '吴敏', '13800138010', 'registered', NOW() - INTERVAL '1 days 9 hours'),
('registered-011', 'demo-event-2024', '徐强', '13800138011', 'registered', NOW() - INTERVAL '1 days 7 hours'),
('registered-012', 'demo-event-2024', '孙丽华', '13800138012', 'registered', NOW() - INTERVAL '1 days 5 hours'),
('registered-013', 'demo-event-2024', '马勇', '13800138013', 'registered', NOW() - INTERVAL '1 days 3 hours'),
('registered-014', 'demo-event-2024', '朱秀兰', '13800138014', 'registered', NOW() - INTERVAL '1 days 1 hours'),
('registered-015', 'demo-event-2024', '胡建华', '13800138015', 'registered', NOW() - INTERVAL '23 hours'),
('registered-016', 'demo-event-2024', '林敏', '13800138016', 'registered', NOW() - INTERVAL '21 hours'),
('registered-017', 'demo-event-2024', '何强', '13800138017', 'registered', NOW() - INTERVAL '19 hours'),
('registered-018', 'demo-event-2024', '高丽华', '13800138018', 'registered', NOW() - INTERVAL '17 hours'),
('registered-019', 'demo-event-2024', '郑勇', '13800138019', 'registered', NOW() - INTERVAL '15 hours'),
('registered-020', 'demo-event-2024', '谢秀英', '13800138020', 'registered', NOW() - INTERVAL '13 hours'),
('registered-021', 'demo-event-2024', '唐建华', '13800138021', 'registered', NOW() - INTERVAL '11 hours'),
('registered-022', 'demo-event-2024', '冯敏', '13800138022', 'registered', NOW() - INTERVAL '9 hours'),
('registered-023', 'demo-event-2024', '曹强', '13800138023', 'registered', NOW() - INTERVAL '7 hours'),
('registered-024', 'demo-event-2024', '彭丽华', '13800138024', 'registered', NOW() - INTERVAL '5 hours'),
('registered-025', 'demo-event-2024', '萧勇', '13800138025', 'registered', NOW() - INTERVAL '3 hours'),
('registered-026', 'demo-event-2024', '曾秀英', '13800138026', 'registered', NOW() - INTERVAL '2 hours'),
('registered-027', 'demo-event-2024', '邓建华', '13800138027', 'registered', NOW() - INTERVAL '1 hours'),
('registered-028', 'demo-event-2024', '蔡敏', '13800138028', 'registered', NOW() - INTERVAL '45 minutes'),
('registered-029', 'demo-event-2024', '丁强', '13800138029', 'registered', NOW() - INTERVAL '30 minutes'),
('registered-030', 'demo-event-2024', '田丽华', '13800138030', 'registered', NOW() - INTERVAL '15 minutes'),

-- 已入场用户 (15人)
('checked-in-001', 'demo-event-2024', '王伟', '13800138031', 'checked_in', NOW() - INTERVAL '3 days 2 hours', NOW() - INTERVAL '2 days 8 hours'),
('checked-in-002', 'demo-event-2024', '李秀英', '13800138032', 'checked_in', NOW() - INTERVAL '2 days 22 hours', NOW() - INTERVAL '2 days 6 hours'),
('checked-in-003', 'demo-event-2024', '张强', '13800138033', 'checked_in', NOW() - INTERVAL '2 days 20 hours', NOW() - INTERVAL '2 days 4 hours'),
('checked-in-004', 'demo-event-2024', '刘敏华', '13800138034', 'checked_in', NOW() - INTERVAL '2 days 18 hours', NOW() - INTERVAL '2 days 2 hours'),
('checked-in-005', 'demo-event-2024', '陈建华', '13800138035', 'checked_in', NOW() - INTERVAL '2 days 16 hours', NOW() - INTERVAL '1 days 23 hours'),
('checked-in-006', 'demo-event-2024', '杨勇', '13800138036', 'checked_in', NOW() - INTERVAL '2 days 14 hours', NOW() - INTERVAL '1 days 21 hours'),
('checked-in-007', 'demo-event-2024', '赵丽', '13800138037', 'checked_in', NOW() - INTERVAL '2 days 12 hours', NOW() - INTERVAL '1 days 19 hours'),
('checked-in-008', 'demo-event-2024', '黄强华', '13800138038', 'checked_in', NOW() - INTERVAL '2 days 10 hours', NOW() - INTERVAL '1 days 17 hours'),
('checked-in-009', 'demo-event-2024', '周敏', '13800138039', 'checked_in', NOW() - INTERVAL '2 days 8 hours', NOW() - INTERVAL '1 days 15 hours'),
('checked-in-010', 'demo-event-2024', '吴建华', '13800138040', 'checked_in', NOW() - INTERVAL '2 days 6 hours', NOW() - INTERVAL '1 days 13 hours'),
('checked-in-011', 'demo-event-2024', '徐勇华', '13800138041', 'checked_in', NOW() - INTERVAL '2 days 4 hours', NOW() - INTERVAL '1 days 11 hours'),
('checked-in-012', 'demo-event-2024', '孙敏', '13800138042', 'checked_in', NOW() - INTERVAL '2 days 2 hours', NOW() - INTERVAL '1 days 9 hours'),
('checked-in-013', 'demo-event-2024', '马强华', '13800138043', 'checked_in', NOW() - INTERVAL '1 days 22 hours', NOW() - INTERVAL '1 days 7 hours'),
('checked-in-014', 'demo-event-2024', '朱丽', '13800138044', 'checked_in', NOW() - INTERVAL '1 days 20 hours', NOW() - INTERVAL '1 days 5 hours'),
('checked-in-015', 'demo-event-2024', '胡建华', '13800138045', 'checked_in', NOW() - INTERVAL '1 days 18 hours', NOW() - INTERVAL '1 days 3 hours'),

-- 已核销用户 (5人)
('redeemed-001', 'demo-event-2024', '林伟', '13800138046', 'redeemed', NOW() - INTERVAL '3 days 1 hours', NOW() - INTERVAL '2 days 12 hours', NOW() - INTERVAL '2 days 6 hours'),
('redeemed-002', 'demo-event-2024', '何秀英', '13800138047', 'redeemed', NOW() - INTERVAL '3 days 0 hours', NOW() - INTERVAL '2 days 10 hours', NOW() - INTERVAL '2 days 4 hours'),
('redeemed-003', 'demo-event-2024', '高强', '13800138048', 'redeemed', NOW() - INTERVAL '2 days 23 hours', NOW() - INTERVAL '2 days 8 hours', NOW() - INTERVAL '2 days 2 hours'),
('redeemed-004', 'demo-event-2024', '郑丽华', '13800138049', 'redeemed', NOW() - INTERVAL '2 days 21 hours', NOW() - INTERVAL '2 days 6 hours', NOW() - INTERVAL '2 days 0 hours'),
('redeemed-005', 'demo-event-2024', '谢伟', '13800138050', 'redeemed', NOW() - INTERVAL '2 days 19 hours', NOW() - INTERVAL '2 days 4 hours', NOW() - INTERVAL '1 days 22 hours')
ON CONFLICT (id) DO NOTHING;

-- 3. 数据验证查询（检查数据是否正确插入）
-- 查看数据统计
SELECT
    e.name as 活动名称,
    e.date as 活动日期,
    COUNT(*) as 总报名人数,
    COUNT(CASE WHEN a.status = 'registered' THEN 1 END) as 待入场人数,
    COUNT(CASE WHEN a.status = 'checked_in' THEN 1 END) as 已入场人数,
    COUNT(CASE WHEN a.status = 'redeemed' THEN 1 END) as 已核销人数,
    ROUND(
        COUNT(CASE WHEN a.status = 'redeemed' THEN 1 END) * 100.0 / COUNT(*),
        2
    ) as 核销率百分比
FROM events e
LEFT JOIN attendees a ON e.id = a.event_id
WHERE e.id = 'demo-event-2024'
GROUP BY e.id, e.name, e.date;

-- 查看各状态的详细用户
SELECT
    a.status as 状态,
    a.name as 姓名,
    a.phone as 手机号,
    a.created_at as 报名时间,
    a.check_in_time as 入场时间,
    a.redeem_time as 核销时间,
    CASE
        WHEN a.status = 'registered' THEN '待入场'
        WHEN a.status = 'checked_in' THEN '已入场'
        WHEN a.status = 'redeemed' THEN '已核销'
        ELSE '未知状态'
    END as 状态描述
FROM attendees a
WHERE a.event_id = 'demo-event-2024'
ORDER BY
    CASE a.status
        WHEN 'registered' THEN 1
        WHEN 'checked_in' THEN 2
        WHEN 'redeemed' THEN 3
        ELSE 4
    END,
    a.created_at DESC;

-- ========================================
-- 数据生成完成！
-- 现在你可以：
-- 1. 访问 /admin/dashboard 查看丰富统计数据
-- 2. 访问 /staff/scan 测试扫码功能
-- 3. 访问 /ticket/[ID] 查看用户凭证
-- ========================================