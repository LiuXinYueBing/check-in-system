-- ========================================
-- 活动签到系统 - 完整数据库设置脚本
-- ========================================
-- 【首次部署使用】此脚本包含表结构创建和演示数据插入
-- 请在 Supabase SQL Editor 中一次性运行此脚本

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 创建活动表
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    location TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建参会者状态枚举
DROP TYPE IF EXISTS attendee_status CASCADE;
CREATE TYPE attendee_status AS ENUM ('registered', 'checked_in', 'redeemed');

-- 3. 创建参会者表
CREATE TABLE IF NOT EXISTS attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status attendee_status DEFAULT 'registered' NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    redeem_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_status ON attendees(status);
CREATE INDEX IF NOT EXISTS idx_attendees_phone ON attendees(phone);

-- 5. 插入示例活动数据
INSERT INTO events (id, name, date, location, description) VALUES
('demo-event-2024', '2024年度技术创新峰会', '2024-12-25', '北京国际会议中心', '汇聚行业精英，探讨前沿技术趋势与未来发展方向'),
('demo-event-2025', '2025年产品发布会', '2025-03-15', '上海世博中心', '新产品线发布及市场策略说明会')
ON CONFLICT (id) DO NOTHING;

-- 6. 批量生成参会者演示数据
INSERT INTO attendees (id, event_id, name, phone, status, created_at) VALUES
-- 待入场用户 (30人) - 使用真实中文姓名
('reg-001', 'demo-event-2024', '张伟', '13800138001', 'registered', NOW() - INTERVAL '2 days 3 hours'),
('reg-002', 'demo-event-2024', '王秀英', '13800138002', 'registered', NOW() - INTERVAL '2 days 1 hours'),
('reg-003', 'demo-event-2024', '李强', '13800138003', 'registered', NOW() - INTERVAL '1 days 23 hours'),
('reg-004', 'demo-event-2024', '刘敏', '13800138004', 'registered', NOW() - INTERVAL '1 days 21 hours'),
('reg-005', 'demo-event-2024', '陈勇', '13800138005', 'registered', NOW() - INTERVAL '1 days 19 hours'),
('reg-006', 'demo-event-2024', '杨丽', '13800138006', 'registered', NOW() - INTERVAL '1 days 17 hours'),
('reg-007', 'demo-event-2024', '赵建国', '13800138007', 'registered', NOW() - INTERVAL '1 days 15 hours'),
('reg-008', 'demo-event-2024', '黄秀英', '13800138008', 'registered', NOW() - INTERVAL '1 days 13 hours'),
('reg-009', 'demo-event-2024', '周建华', '13800138009', 'registered', NOW() - INTERVAL '1 days 11 hours'),
('reg-010', 'demo-event-2024', '吴敏', '13800138010', 'registered', NOW() - INTERVAL '1 days 9 hours'),
('reg-011', 'demo-event-2024', '徐强', '13800138011', 'registered', NOW() - INTERVAL '1 days 7 hours'),
('reg-012', 'demo-event-2024', '孙丽华', '13800138012', 'registered', NOW() - INTERVAL '1 days 5 hours'),
('reg-013', 'demo-event-2024', '马勇', '13800138013', 'registered', NOW() - INTERVAL '1 days 3 hours'),
('reg-014', 'demo-event-2024', '朱秀兰', '13800138014', 'registered', NOW() - INTERVAL '1 days 1 hours'),
('reg-015', 'demo-event-2024', '胡建华', '13800138015', 'registered', NOW() - INTERVAL '23 hours'),
('reg-016', 'demo-event-2024', '林敏', '13800138016', 'registered', NOW() - INTERVAL '21 hours'),
('reg-017', 'demo-event-2024', '何强', '13800138017', 'registered', NOW() - INTERVAL '19 hours'),
('reg-018', 'demo-event-2024', '高丽华', '13800138018', 'registered', NOW() - INTERVAL '17 hours'),
('reg-019', 'demo-event-2024', '郑勇', '13800138019', 'registered', NOW() - INTERVAL '15 hours'),
('reg-020', 'demo-event-2024', '谢秀英', '13800138020', 'registered', NOW() - INTERVAL '13 hours'),
('reg-021', 'demo-event-2024', '唐建华', '13800138021', 'registered', NOW() - INTERVAL '11 hours'),
('reg-022', 'demo-event-2024', '冯敏', '13800138022', 'registered', NOW() - INTERVAL '9 hours'),
('reg-023', 'demo-event-2024', '曹强', '13800138023', 'registered', NOW() - INTERVAL '7 hours'),
('reg-024', 'demo-event-2024', '彭丽华', '13800138024', 'registered', NOW() - INTERVAL '5 hours'),
('reg-025', 'demo-event-2024', '萧勇', '13800138025', 'registered', NOW() - INTERVAL '3 hours'),
('reg-026', 'demo-event-2024', '曾秀英', '13800138026', 'registered', NOW() - INTERVAL '2 hours'),
('reg-027', 'demo-event-2024', '邓建华', '13800138027', 'registered', NOW() - INTERVAL '1 hours'),
('reg-028', 'demo-event-2024', '蔡敏', '13800138028', 'registered', NOW() - INTERVAL '45 minutes'),
('reg-029', 'demo-event-2024', '丁强', '13800138029', 'registered', NOW() - INTERVAL '30 minutes'),
('reg-030', 'demo-event-2024', '田丽华', '13800138030', 'registered', NOW() - INTERVAL '15 minutes'),

-- 已入场用户 (15人)
('check-001', 'demo-event-2024', '王伟', '13800138031', 'checked_in', NOW() - INTERVAL '3 days 2 hours', NOW() - INTERVAL '2 days 8 hours'),
('check-002', 'demo-event-2024', '李秀英', '13800138032', 'checked_in', NOW() - INTERVAL '2 days 22 hours', NOW() - INTERVAL '2 days 6 hours'),
('check-003', 'demo-event-2024', '张强', '13800138033', 'checked_in', NOW() - INTERVAL '2 days 20 hours', NOW() - INTERVAL '2 days 4 hours'),
('check-004', 'demo-event-2024', '刘敏华', '13800138034', 'checked_in', NOW() - INTERVAL '2 days 18 hours', NOW() - INTERVAL '2 days 2 hours'),
('check-005', 'demo-event-2024', '陈建华', '13800138035', 'checked_in', NOW() - INTERVAL '2 days 16 hours', NOW() - INTERVAL '1 days 23 hours'),
('check-006', 'demo-event-2024', '杨勇', '13800138036', 'checked_in', NOW() - INTERVAL '2 days 14 hours', NOW() - INTERVAL '1 days 21 hours'),
('check-007', 'demo-event-2024', '赵丽', '13800138037', 'checked_in', NOW() - INTERVAL '2 days 12 hours', NOW() - INTERVAL '1 days 19 hours'),
('check-008', 'demo-event-2024', '黄强华', '13800138038', 'checked_in', NOW() - INTERVAL '2 days 10 hours', NOW() - INTERVAL '1 days 17 hours'),
('check-009', 'demo-event-2024', '周敏', '13800138039', 'checked_in', NOW() - INTERVAL '2 days 8 hours', NOW() - INTERVAL '1 days 15 hours'),
('check-010', 'demo-event-2024', '吴建华', '13800138040', 'checked_in', NOW() - INTERVAL '2 days 6 hours', NOW() - INTERVAL '1 days 13 hours'),
('check-011', 'demo-event-2024', '徐勇华', '13800138041', 'checked_in', NOW() - INTERVAL '2 days 4 hours', NOW() - INTERVAL '1 days 11 hours'),
('check-012', 'demo-event-2024', '孙敏', '13800138042', 'checked_in', NOW() - INTERVAL '2 days 2 hours', NOW() - INTERVAL '1 days 9 hours'),
('check-013', 'demo-event-2024', '马强华', '13800138043', 'checked_in', NOW() - INTERVAL '1 days 22 hours', NOW() - INTERVAL '1 days 7 hours'),
('check-014', 'demo-event-2024', '朱丽', '13800138044', 'checked_in', NOW() - INTERVAL '1 days 20 hours', NOW() - INTERVAL '1 days 5 hours'),
('check-015', 'demo-event-2024', '胡建华', '13800138045', 'checked_in', NOW() - INTERVAL '1 days 18 hours', NOW() - INTERVAL '1 days 3 hours'),

-- 已核销用户 (5人)
('redm-001', 'demo-event-2024', '林伟', '13800138046', 'redeemed', NOW() - INTERVAL '3 days 1 hours', NOW() - INTERVAL '2 days 12 hours', NOW() - INTERVAL '2 days 6 hours'),
('redm-002', 'demo-event-2024', '何秀英', '13800138047', 'redeemed', NOW() - INTERVAL '3 days 0 hours', NOW() - INTERVAL '2 days 10 hours', NOW() - INTERVAL '2 days 4 hours'),
('redm-003', 'demo-event-2024', '高强', '13800138048', 'redeemed', NOW() - INTERVAL '2 days 23 hours', NOW() - INTERVAL '2 days 8 hours', NOW() - INTERVAL '2 days 2 hours'),
('redm-004', 'demo-event-2024', '郑丽华', '13800138049', 'redeemed', NOW() - INTERVAL '2 days 21 hours', NOW() - INTERVAL '2 days 6 hours', NOW() - INTERVAL '2 days 0 hours'),
('redm-005', 'demo-event-2024', '谢伟', '13800138050', 'redeemed', NOW() - INTERVAL '2 days 19 hours', NOW() - INTERVAL '2 days 4 hours', NOW() - INTERVAL '1 days 22 hours')
ON CONFLICT (id) DO NOTHING;

-- 7. 更新已入场和已核销的时间戳
UPDATE attendees SET
    check_in_time = NOW() - INTERVAL '2 days 8 hours',
    redeem_time = NOW() - INTERVAL '2 days 6 hours'
WHERE id = 'redm-001';

UPDATE attendees SET
    check_in_time = NOW() - INTERVAL '2 days 10 hours',
    redeem_time = NOW() - INTERVAL '2 days 4 hours'
WHERE id = 'redm-002';

UPDATE attendees SET
    check_in_time = NOW() - INTERVAL '2 days 8 hours',
    redeem_time = NOW() - INTERVAL '2 days 2 hours'
WHERE id = 'redm-003';

UPDATE attendees SET
    check_in_time = NOW() - INTERVAL '2 days 6 hours',
    redeem_time = NOW() - INTERVAL '2 days 0 hours'
WHERE id = 'redm-004';

UPDATE attendees SET
    check_in_time = NOW() - INTERVAL '2 days 4 hours',
    redeem_time = NOW() - INTERVAL '1 days 22 hours'
WHERE id = 'redm-005';

-- 8. 数据统计验证（运行后查看结果）
-- 活动数据统计
SELECT
    e.name as 活动名称,
    e.date as 活动日期,
    e.location as 活动地点,
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
GROUP BY e.id, e.name, e.date, e.location;

-- ========================================
-- 🎉 数据库设置完成！
--
-- 接下来的步骤：
-- 1. 配置 .env.local 文件
-- 2. 运行 npm install 安装依赖
-- 3. 运行 npm run dev 启动开发服务器
-- 4. 访问以下地址测试功能：
--    - http://localhost:3000 (用户注册)
--    - http://localhost:3000/admin/dashboard (数据看板)
--    - http://localhost:3000/staff/scan (扫码核销)
-- ========================================